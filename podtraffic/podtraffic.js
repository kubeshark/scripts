/**
 * Pod Traffic Monitoring Script for Cost Optimization
 * This script was created by the Kubeshark Generative-AI assistant.
 * It identifies pods with minimal or no network activity, making them candidates for removal to optimize costs.
 */

var nodeName = utils.nodeName(); // Current node name
var threshold = 0; // Threshold for identifying inactive pods
var workerActivePods = {}; // Tracks network activity per pod
var hubActivePods = {}; // Tracks network activity per pod
var metricName = "pod_traffic"; // Prometheus metric name

// Color variables
var red = "\x1b[31m";
var green = "\x1b[32m";
var blue = "\x1b[34m";
var yellow = "\x1b[33m";
var reset = "\x1b[0m";
var bold = "\x1b[1m";

/**
 * Capture and record network activity for pods.
 * @param {object} data - Metadata for each captured API call.
 */
function onItemCaptured(data) {
    try {
        if (data.src && data.src.name) {
            workerActivePods[data.src.name] = (workerActivePods[data.src.name] || 0) + 1;
        }
        if (data.dst && data.dst.name) {
            workerActivePods[data.dst.name] = (workerActivePods[data.dst.name] || 0) + 1;
        }
    } catch (e) {
        console.error(red + "Error processing captured data:" + reset, e);
    }
}
/**
 * Hook: onHubAction
 * 
 * This hook is called when the `hub.action(action, object)` helper is invoked. While the helper
 * can be called from either the Hub or Workers, the hook is triggered exclusively on the Hub.
 *
 * This hook is particularly useful to consolidate objects created by the workers into a single object, ready for further processing.
 * In this example, we are consolidating the DNS counts from each worker into a single object, to generate a single report.
 *
 * This hook works only on the Hub.
 *
 * @param {string} action - A string indicating the type of action being performed (nothing really to do with this arg).
 * @param {Object} object - The object transmitted using the helper.
 *
 * @returns {void} - This function does not return any value.
 *
 */

function onHubAction(action, object) {
    hubActivePods = joinMaps(hubActivePods, object);
}

/**
 * Periodically print a report of pods with low activity.
 * @param {boolean} isLongReport - Flag for detailed vs summary report.
 */

function preparePods(activePods) {
    var nodePods = {};

    try {
        var targets = JSON.parse(hub.targeted()).targets;

        targets.forEach(function (target) {
            if (target.spec.nodeName === nodeName) {
                var podName = target.metadata.name;
                nodePods[podName] = activePods[podName] || 0;
                reportPrometheus(podName, nodePods[podName]);
            }
        });
        return nodePods;
    } catch (e) {
        console.error(red + "Error generating report:" + reset, e);
    }
}

function printReport(nodePods) {
    try {
        var logMessage =  "";
        var logTempMessage = "";
        var count = 0;

        for (var pod in nodePods) {
            if (pod <= threshold) {
                var podDisplayName = red + pod + reset;
                var podActivity = blue + nodePods[pod] + reset;
                logTempMessage += "Pod: " + podDisplayName + ", Activity: " + podActivity + "\n";
                count++;
            }
        }
        if (count>0)
            logMessage = bold + "Pod Activity Report:" + reset + "\n" +
                "Total pods: " + blue + Object.keys(nodePods).length + reset + "\n" +
                "Inactive pods: " + red + count + reset + "\n" +
                "Inactivity threshold: " + green + threshold + reset + "\n" +
                bold + "Pods with activity under threshold: " + reset + "\n" + logTempMessage;
        else
             logMessage = bold + "Pod Activity Report:" + reset + "\n" +
                "Total pods: " + blue + Object.keys(nodePods).length + reset + "\n" +
                "Inactive pods: " + red + "None!" + reset + "\n" +
                "Inactivity threshold: " + green + threshold + reset + "\n";
        return logMessage;
    } catch (e) {
        console.error(red + "Error generating report:" + reset, e);
    }
}


/**
 * Report pod activity metrics to Prometheus.
 * @param {string} podName - The name of the pod.
 * @param {boolean} isActive - Whether the pod is active.
 * @param {number} value - Traffic count for the pod.
 */
function reportPrometheus(podName, value) {
    var labels = {
        s_pod: podName,
    };
    prometheus.vector(metricName, "Pod traffic activity", 1, value, labels);
}

// Schedule reports to run only on the worker nodes
if (nodeName !== "hub") {
    jobs.schedule("longReport", "0 * * * * *", printReport, 0, true);  // Long report every minute
    jobs.schedule("shortReport", "*/10 * * * * *", printReport, 0, false); // Summary report every 10 seconds
} else
    console.clear();



    // Scheduled reporting jobs
if (utils.nodeName() === "hub") 
    jobs.schedule("report-dns-consumers", "*/20 * * * * *", reportTopDNSConsumers);
else
    jobs.schedule("report-dns-consumers-to-hub", "*/20 * * * * *", workerReportToHub);
        
        
function reportTopDNSConsumers() {
    try {
        console.clear();
        var dnsCounts = getTopDNSConsumers(hubDnsCounts, 5);
        console.log(createReport(dnsCounts));
    } catch (e) {
        console.error(red + "Error in hub reporting job:" + reset, e);
    }
}


function workerReportToHub() {
    try {
        reportToPrometheus();
        var dnsCounts = getTopDNSConsumers(workerDnsCounts, 5);
        hub.action(utils.nodeName(), dnsCounts);
    } catch (e) {
        console.error(red + "Error in worker reporting job:" + reset, e);
    }
}