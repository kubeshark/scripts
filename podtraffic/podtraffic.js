//podtraffic
try{
    var nodeName = utils.nodeName(); 
} catch(e){
    console.error(e);
}
var threshold = 0; // threshold for pod activity
var activePods = {};
var metricName = "podtraffic";


// onItemCaptured is called for each request and response pair, reassembled into  
// an API Entry Item
// The function is used to update pod activity in the activePods object

function onItemCaptured(data) {  

    // count the entries found for each pod 
    try{
        if (data.src && data.src.name){
            if (!(data.src.name in activePods))
                activePods[data.src.name] = 0;
            activePods[data.src.name] ++;
        }
        if (data.dst && data.dst.name){
            if (!(data.dst.name in activePods))
                activePods[data.dst.name] = 0;
            activePods[data.dst.name] ++;
        }
    } catch(e){
        console.error(e);  
    }
} 

// The printReport function is called by the scheduled jobs to print the report
// long report prints every minute, short report prints every 10 seconds
if (nodeName != "hub"){
    jobs.schedule("long", "0 * * * * *", printReport, 0, true)  
    jobs.schedule("short", "*/10 * * * * *", printReport, 0, false)  
}
// The printReport measures the activity of pods that are targeted
// and prints the list of pods that are under a certain threshold

function printReport(long){
    var thresholdPods = [];
    var targetedPods = {};

    try{
        // support using backend filters to target specific pods
        var targets = JSON.parse(vendor.webhook("GET", "http://kubeshark-hub/pods/targeted", "")).targets;
        targets.forEach(function(target){
            if (target.spec.nodeName == nodeName ){
                if (!(target.metadata.name in targetedPods))
                    targetedPods[target.metadata.name] = 0;
                if (target.metadata.name in activePods)
                    targetedPods[target.metadata.name] = activePods[target.metadata.name];          
            }
        });

        for (var pod in targetedPods) {
            if (targetedPods[pod] <= threshold){
                thresholdPods.push(pod);
                reportProm(pod, false, targetedPods[pod]);
            }
           else                
               reportProm(pod, true, targetedPods[pod]);
        }
    } catch (e){
        console.error(e);
    }
    if (long)
        console.log("\x1b[31mPods With No Traffic Report\x1b[0m\n" + utils.json2Yaml(JSON.stringify({ 
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

function generateUniqueString() {
    return 'id-' + Date.now() + '-' + Math.floor(Math.random() * 10000);
}

function reportProm(pod_name, active, value){
    var labels =  {
        s_pod: pod_name,
        s_active: active,
        s_script: "podtraffic",
    };
    prometheus.vector(metricName, "Pod getting traffic", 1, value, labels);
   // console.log(metricName,JSON.stringify(labels));  
}