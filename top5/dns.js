var dnsCounts = {};

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
            if (!dnsCounts[podName]) {
                dnsCounts[podName] = 0;
            }

            // Increment the DNS request count for the pod
            dnsCounts[podName]++;
        }
    } catch (e) {
        console.error(red + "Error processing DNS traffic:" + reset, e);
    }
}

/**
 * Report pod DNS activity metrics to Prometheus.
 */
function reportToPrometheus() {
    try {
        for (var podName in dnsCounts) {
            var dnsCount = dnsCounts[podName];

            // Prometheus label and metric reporting
            var labels = {
                s_pod: podName
            };
            prometheus.vector("dns_requests", "DNS request count per pod", 1, dnsCount, labels);
        }
    } catch (e) {
        console.error(red + "Error reporting to Prometheus:" + reset, e);
    }
}

/**
 * Scheduled Job: Log the top 5 pods consuming the most DNS calls and report to Prometheus.
 */
function reportTopDNSConsumers() {
    try {
        var sortedPods = Object.keys(dnsCounts).sort(function (a, b) {
            return dnsCounts[b] - dnsCounts[a];
        });

        var logMessage = bold + "Top 5 Pods Consuming DNS Requests:" + reset + "\n"; // Bold title
        for (var i = 0; i < Math.min(5, sortedPods.length); i++) {
            var podName = red + sortedPods[i] + reset; // Red for pod name
            var dnsCount = blue + dnsCounts[sortedPods[i]] + reset; // Blue for DNS count
            logMessage += (i + 1) + ". Pod: " + podName + ", DNS Calls: " + dnsCount + "\n";
        }

        console.log(logMessage);

        // Report to Prometheus after logging
        reportToPrometheus();
    } catch (e) {
        console.error(red + "Error reporting top DNS consumers:" + reset, e);
    }
}

if (utils.nodeName() === "hub") {
    console.clear();
}
else
    // Schedule the reporting job to run every 20 seconds
    jobs.schedule("report-dns-consumers", "*/20 * * * * *", reportTopDNSConsumers);