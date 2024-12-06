// Top 5 Pods Consuming the Most DNS Requests (Potentially Triggering DNS Rate Limiting)

var workerDnsCounts = {};
var hubDnsCounts = {};

var scriptId = "dns2"; // Unique identifier for this script - very important to be unique. DO NOT DUPLICATE THIS FIELD TO ANOTHER SCRIPT

// Color variables
var blue = "\x1b[34m"; // Blue color for keys
var green = "\x1b[32m"; // Green color for values
var reset = "\x1b[0m"; // Reset to default color
var bold = "\x1b[1m"; // Bold text
var red = "\x1b[31m"; // Red color for error messages
var yellow = "\x1b[33m"; // Yellow color for warnings
var orange = "\x1b[38;5;214m"; // Approximation for orange in 256-color palette

/**
 * L7 Hook: Capture DNS traffic and track request counts per pod.
 * @param {Object} data - Metadata object for a captured API call.
 */
function onItemCaptured(data) {
    try {
        if (data.protocol && data.protocol.name === "dns" && data.src && data.src.name) {
            var podName = data.src.name;
            if (!workerDnsCounts[podName])
                workerDnsCounts[podName] = 0;
            workerDnsCounts[podName]++;
        }
    } catch (e) {
        console.error(red + "Error processing DNS traffic:" + reset, e);
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
    // important to use the unique identifier to not mix up data with other scripts
    if (action == scriptId)
        hubDnsCounts = wrapper.joinMaps(hubDnsCounts, object);
}

// Function to merge two maps
function joinMaps(map1, map2) {
    var result = {};
    for (var key in map1) {
        if (map1.hasOwnProperty(key)) {
            result[key] = map1[key];
        }
    }
    for (var key in map2) {
        if (map2.hasOwnProperty(key)) {
            if (result[key])
                result[key] += map2[key]; // Add counts if the key already exists
            else
                result[key] = map2[key];
        }
    }
    return result;
}

/**
 * Report pod DNS activity metrics to Prometheus.
 */
function reportToPrometheus() {
    try {
        for (var podName in workerDnsCounts) {
            var dnsCount = workerDnsCounts[podName];
            var labels = { s_pod: podName };
            prometheus.vector("dns_requests", "DNS request count per pod", 1, dnsCount, labels);
        }
    } catch (e) {
        console.error(red + "Error reporting to Prometheus:" + reset, e);
    }
}

/**
 * Report the top N pods consuming the most DNS calls.
 */
function getTopDNSConsumers(dnsCounts, topN) {
    try {
        var sortedPods = Object.keys(dnsCounts).sort(function (a, b) {
            return dnsCounts[b] - dnsCounts[a];
        });
        var topPods = {};
        for (var i = 0; i < Math.min(topN, sortedPods.length); i++) {
            var podName = sortedPods[i];
            topPods[podName] = dnsCounts[podName];
        }

        return topPods;
    } catch (e) {
        console.error("Error retrieving top DNS consumers:", e);
        return {};
    }
}


/**
 * Create a log message for the top DNS consumers.
 */
function createReport(dnsCounts) {
    try {
        var logMessage = bold + "Top Pods Consuming DNS Requests:" + reset + "\n";

        // Loop through the provided map and append to the log message
        var i = 0;
        for (var podName in dnsCounts) {
            if (dnsCounts.hasOwnProperty(podName)) {
                var podDisplayName = red + podName + reset; // Red for pod name
                var dnsCount = blue + dnsCounts[podName] + reset; // Blue for DNS count
                logMessage += (++i) + ". Pod: " + podDisplayName + ", DNS Calls: " + dnsCount + "\n";
            }
        }

        return (i>0) ? logMessage : "Waiting for data ..";
    } catch (e) {
        console.error(red + "Error creating log message for DNS consumers:" + reset, e);
        return "";
    }
}


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
        hub.action(scriptId, dnsCounts);
    } catch (e) {
        console.error(red + "Error in worker reporting job:" + reset, e);
    }
}
