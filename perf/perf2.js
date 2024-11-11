//perf2

try{
    var nodeName = utils.nodeName(); 
    if (nodeName == "hub")
        throw( "This script should not run on the hub" );
} catch(e){
    console.error(e);
}


var pods = {};
var metricName = "performance";
console.log("starting");

function onItemCaptured(data) {  
    // Push metric
    try {
        if (data && 
            data.protocol && data.protocol.name === "http" && 
            data.elapsedTime && 
            data.dst && data.dst.name &&
            data.request && data.request.path) {

            if (!pods[data.dst.name]) {
                pods[data.dst.name] = {};
                pods[data.dst.name][data.request.path] = {
                    latencyArr: []
                };
            } else if (!pods[data.dst.name][data.request.path]) {
                pods[data.dst.name][data.request.path] = { latencyArr: [] };
            }
            // Push the elapsed time into latencyArr
            pods[data.dst.name][data.request.path].latencyArr.push({
                latency: data.elapsedTime,
                src: data.src.name || "unknown"
            });
            
            // console.log("pushing", data.dst.name);

            // Update namespace if available
            if (!pods[data.dst.name].namespace && data.dst.namespace) {
                pods[data.dst.name].namespace = data.dst.namespace;
            }

        }
    } catch (e) {
        console.error(e);
    }
}



jobs.schedule("push-to-prom", "0 * * * * *", pushProm);


function convertToValidMetricName(input) {
    return input.replace(/[^a-zA-Z0-9_]/g, '_');
}

function pushProm() {
    try {
        for (var pod in pods) {
            for (var path in pods[pod]) {
                if (pods[pod][path].latencyArr && pods[pod][path].latencyArr.length > 0) {  // Ensure array exists and is not empty
                    // Calculate the sum of the array
                    var sum = pods[pod][path].latencyArr.reduce(function(a, b) { return a + b.latency; }, 0);
                
                    // Calculate the average
                    var avg = sum / pods[pod][path].latencyArr.length;
            
                    
                    // Report the average latency

                    var labels = {
                        s_path: path,
                        s_namespace: pods[pod].namespace || "external",
                        s_src: pods[pod][path].latencyArr[0].src || "unknown",
                        s_pod: pod
                    };
                    // console.log("pushing to prom", JSON.stringify(labels));
                    prometheus.vector(metricName, "Pod getting traffic", 2, avg, labels);
                
                    // Reset the latency array
                    pods[pod][path].latencyArr = [];
                } 
            }
        }
    } catch (e) {
        console.error(e);
    }
}