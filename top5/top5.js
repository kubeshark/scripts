//podtraffic

var threshold = 10; // threshold for pod activity
var activePods = {};
var nodeName = utils.nodeName(); 

// onItemCaptured is called for each request and response pair, reassembled into 
// an API Entry Item
// The function is used to update pod activity in the activePods object

function onItemCaptured(data) {  

    // count the entries found for each pod
    try{
        if ((data.protocol.name == "http") && (data.elapsedTime == 0)){
           console.log(utils.json2Yaml(JSON.stringify({
                elapsedTime: data.elapsedTime,
                path: data.request.path,
            })));
        }
        /*
        if (data.dst && data.dst.name){
            if (!(data.dst.name in activePods))  
                activePods[data.dst.name] = {};
            activePods[data.dst.name][data.requesr.path].latency = data.latency;
        }
            */
    } catch(e){
        console.error(e);  
    }
} 

// The printReport function is called by the scheduled jobs to print the report
// long report prints every minute, short report prints every 10 seconds

//jobs.schedule("long", "0 * * * * *", printReport, 0, true)  
//jobs.schedule("short", "*/10 * * * * *", printReport, 0, false)  
// jobs.schedule("report-prom", "*/10 * * * * *", reportProm, 0, false)  

// The printReport measures the activity of pods that are targeted
// and prints the list of pods that are under a certain threshold

function printReport(long){
    var thresholdPods = [];
    var targetedPods = {};

    console.log("printReport" + long? "long": "short");
    try{
        // support using backend filters to target specific pods
        var targets = JSON.parse(vendor.webhook("GET", "http://kubeshark-hub/pods/targeted", "")).targets;
        // console.log(JSON.stringify(targets));
        targets.forEach(function(target){
            if (target.spec.nodeName == nodeName ){
                if (!(target.metadata.name in targetedPods))
                    targetedPods[target.metadata.name] = 0;
                if (target.metadata.name in activePods)
                    targetedPods[target.metadata.name] = activePods[target.metadata.name];          
            }
        });

        for (var pod in targetedPods) {
            if (targetedPods[pod] <= threshold)
                thresholdPods.push(pod);
        }
    } catch (e){
        console.error(e);
    }
    if (long)
        console.log("\n" + utils.json2Yaml(JSON.stringify({ 
            "node": nodeName,
            "total-pod-in-node": Object.keys(targetedPods).length,
            "pods-under-threshold": thresholdPods.length, 
            "threshold": threshold,
            "pods": thresholdPods
        }))); 
    else
        console.log("Found " + thresholdPods.length + "/" + 
        Object.keys(targetedPods).length + 
        " pods under threshold of " + threshold + ""); 
}  
function convertToValidMetricName(input) {
    return input.replace(/[^a-zA-Z0-9_]/g, '_');
}

function reportProm(){
    for (var pod in activePods) {
        var metric = convertToValidMetricName("pod_traffic_" + pod);
        prometheus.metric(metric, "Pod traffic", 1, activePods[pod]);
        console.log("Prometheus metric: " + metric + " = " + activePods[pod]);
    }
}