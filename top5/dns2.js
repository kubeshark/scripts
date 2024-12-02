// Top 5 Pods Consuming the Most DNS Requests (Potentially Triggering DNS Rate Limiting)

var workerDnsCounts = {};
var hubDnsCounts = {};

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
        // Check if the protocol is DNS
        if (data.protocol && data.protocol.name === "dns" && data.src && data.src.name) {
            var podName = data.src.name;

            // Initialize the count for the pod if not already present
            if (!workerDnsCounts[podName]) {
                workerDnsCounts[podName] = 0;
            }

            // Increment the DNS request count for the pod
            workerDnsCounts[podName]++;
        }
    } catch (e) {
        console.error(red + "Error processing DNS traffic:" + reset, e);
    }
}

// Hub action handler
function onHubAction(action, object) {
    // Validate input structure
    if (object) {
        // Merge new values into the map
        hubDnsCounts = joinMaps(hubDnsCounts, object);
        // console.log(action,JSON.stringify(object));
    }
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
            if (result[key]) {
                result[key] += map2[key]; // Add counts if the key already exists
            } else {
                result[key] = map2[key];
            }
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

            // Prometheus label and metric reporting
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
        // Create an array of pod names sorted by their DNS counts in descending order
        var sortedPods = Object.keys(dnsCounts).sort(function (a, b) {
            return dnsCounts[b] - dnsCounts[a];
        });

        // Create a new map for the top N pods
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
function createLogMessage(dnsCounts) {
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

        return logMessage;
    } catch (e) {
        console.error(red + "Error creating log message for DNS consumers:" + reset, e);
        return "";
    }
}


// Scheduled reporting jobs
if (utils.nodeName() === "hub") 
    jobs.schedule("report-dns-consumers", "*/20 * * * * *", reportTopDNSConsumers);
else
    jobs.schedule("report-dns-consumers-to-hub", "*/20 * * * * *", workerReportTopDNSConsumers);
        
        
function reportTopDNSConsumers() {
    try {
        console.clear();
        var dnsCounts = getTopDNSConsumers(hubDnsCounts, 5);
        console.log(createLogMessage(dnsCounts));
    } catch (e) {
        console.error(red + "Error in hub reporting job:" + reset, e);
    }
}


function workerReportTopDNSConsumers() {
    try {
        reportToPrometheus();
        var dnsCounts = getTopDNSConsumers(workerDnsCounts, 5);
        hub.action(utils.nodeName(), dnsCounts);
    } catch (e) {
        console.error(red + "Error in worker reporting job:" + reset, e);
    }
}
