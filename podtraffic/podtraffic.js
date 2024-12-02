/**
 * Pod Traffic Monitoring Script for Cost Optimization
 * This script was created by the Kubeshark Generative-AI assistant.
 * It identifies pods with minimal or no network activity, making them candidates for removal to optimize costs.
 */

var nodeName = utils.nodeName(); // Current node name
var threshold = 0; // Threshold for identifying inactive pods
var activePods = {}; // Tracks network activity per pod
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
            activePods[data.src.name] = (activePods[data.src.name] || 0) + 1;
        }
        if (data.dst && data.dst.name) {
            activePods[data.dst.name] = (activePods[data.dst.name] || 0) + 1;
        }
    } catch (e) {
        console.error(red + "Error processing captured data:" + reset, e);
    }
}

/**
 * Periodically print a report of pods with low activity.
 * @param {boolean} isLongReport - Flag for detailed vs summary report.
 */
function printReport(isLongReport) {
    var thresholdPods = [];
    var nodePods = {};

    try {
        var targets = JSON.parse(hub.targeted()).targets;

        targets.forEach(function (target) {
            if (target.spec.nodeName === nodeName) {
                var podName = target.metadata.name;
                nodePods[podName] = activePods[podName] || 0;
            }
        });

        for (var pod in nodePods) {
            var isActive = nodePods[pod] > threshold;
            if (!isActive) thresholdPods.push(pod);
            reportPrometheus(pod, isActive, nodePods[pod]);
        }

        if (isLongReport) {
            console.log(bold + red + "Pods With No Traffic Report" + reset + "\n" + utils.json2Yaml(JSON.stringify({
                node: nodeName,
                totalPodsInNode: Object.keys(nodePods).length,
                podsUnderThreshold: thresholdPods.length,
                threshold: threshold,
                pods: thresholdPods
            })));
        } else {
            console.log(
                "Found " + yellow + thresholdPods.length + reset + "/" + blue +
                Object.keys(nodePods).length + reset +
                " pods under threshold (" + green + threshold + reset + ")."
            );
        }
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
function reportPrometheus(podName, isActive, value) {
    var labels = {
        s_pod: podName,
        s_active: isActive,
    };
    prometheus.vector(metricName, "Pod traffic activity", 1, value, labels);
}

// Schedule reports to run only on the worker nodes
if (nodeName !== "hub") {
    jobs.schedule("longReport", "0 * * * * *", printReport, 0, true);  // Long report every minute
    jobs.schedule("shortReport", "*/10 * * * * *", printReport, 0, false); // Summary report every 10 seconds
} else
    console.clear();
