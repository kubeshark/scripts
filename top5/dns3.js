// Top requested DNS endpoints by DNS server

/*
 * Prompt: Write a network processor script that reports the top requested DNS endpoints by DNS server.
 * 
 * Hook: onItemCaptured
 * - This hook captures network messages processed by Kubeshark and filters DNS traffic.
 * - DNS messages are identified by `data.protocol.name == 'dns'`.
 * - Each message contains:
 *     - `data.src.name`: The client making the request.
 *     - `data.dst.name`: The DNS server (fallback to `data.dst.ip` if empty).
 *     - `data.dst.namespace`: The namespace of the DNS server. Defaults to "External" if empty.
 * - The hook maintains a map:
 *     - Key: DNS server identifier (domain or IP, including namespace if available).
 *     - Value: Another map with:
 *         - Key: Endpoint name (from `data.response.answers[i].name`).
 *         - Value: Count of requests for the endpoint.
 * 
 * Hook: onHubAction
 * - This hook consolidates DNS data from all worker nodes into a single map (`hubDnsServerMap`).
 * - Workers send their DNS maps periodically to the hub using the `hub.action()` helper.
 * - The hub merges these maps using the `joinMaps()` function for centralized reporting.
 * 
 * Scheduled Jobs:
 * - Hub:
 *     - Schedules a job to report the top 5 DNS endpoints for each server every 20 seconds.
 * - Worker:
 *     - Schedules a job to send the DNS map to the hub every 10 seconds.
 * 
 * Report:
 * - The report includes:
 *     - DNS server names highlighted in blue.
 *     - Endpoint names highlighted in green.
 *     - Counts in bold.
 *     - The total requests per server and the top 5 endpoints.
 */

var workerDnsServerMap = {};
var hubDnsServerMap = {};

var scriptId = "dns3"; // Unique identifier for this script - very important to be unique. DO NOT DUPLICATE THIS FIELD TO ANOTHER SCRIPT

// ANSI escape codes for color and formatting
var blue = "\033[34m";
var green = "\033[32m";
var bold = "\033[1m";
var reset = "\033[0m";

/**
 * Hook: onHubAction
 * - Consolidates DNS data from all worker nodes into the hub's map (`hubDnsServerMap`).
 * - Uses the `joinMaps()` helper to merge worker data.
 * @param {string} action - The action identifier (unused here).
 * @param {object} object - The DNS data map sent from a worker.
 */
function onHubAction(action, object) {
    // important to use the unique identifier to not mix up data with other scripts
    if (action == scriptId)
        hubDnsServerMap = wrapper.joinMaps(hubDnsServerMap, object);
}

/**
 * Hook: onItemCaptured
 * - Processes each DNS message captured by Kubeshark.
 * - Updates the local map (`workerDnsServerMap`) with endpoint request counts.
 * @param {object} data - The network message metadata.
 */
function onItemCaptured(data) {
    try {
        if (data.protocol && data.protocol.name === "dns" && data.src && data.dst && data.response && data.response.answers) {
            var dnsServer = data.dst.name || data.dst.ip;
            var namespace = data.dst.namespace || "External";
            var dnsServerIdentifier = dnsServer + " (" + namespace + ")";

            if (!workerDnsServerMap[dnsServerIdentifier]) {
                workerDnsServerMap[dnsServerIdentifier] = {};
            }

            for (var i = 0; i < data.response.answers.length; i++) {
                var endpointName = data.response.answers[i].name;

                if (endpointName) {
                    if (!workerDnsServerMap[dnsServerIdentifier][endpointName]) {
                        workerDnsServerMap[dnsServerIdentifier][endpointName] = 0;
                    }
                    workerDnsServerMap[dnsServerIdentifier][endpointName]++;
                }
            }
        }
    } catch (e) {
        console.error(bold + "Error processing DNS data:" + reset, e);
    }
}

/**
 * Generates a report of the top 5 endpoints for each DNS server.
 * - Consolidates data from the global `hubDnsServerMap`.
 * - Formats the report with color and bold text.
 * @returns {string} - The formatted report.
 */
function createReport() {
    try {
        var report = "DNS Server Report:\n";

        for (var dnsServer in hubDnsServerMap) {
            if (hubDnsServerMap.hasOwnProperty(dnsServer)) {
                var totalRequests = 0;
                for (var endpoint in hubDnsServerMap[dnsServer]) {
                    if (hubDnsServerMap[dnsServer].hasOwnProperty(endpoint)) {
                        totalRequests += hubDnsServerMap[dnsServer][endpoint];
                    }
                }

                report += bold + blue + "DNS Server: " + dnsServer + reset + " - Total Requests: " + bold + totalRequests + reset + "\n";

                var endpoints = [];
                for (var endpoint in hubDnsServerMap[dnsServer]) {
                    if (hubDnsServerMap[dnsServer].hasOwnProperty(endpoint)) {
                        endpoints.push({ name: endpoint, count: hubDnsServerMap[dnsServer][endpoint] });
                    }
                }

                endpoints.sort(function (a, b) {
                    return b.count - a.count;
                });

                for (var i = 0; i < Math.min(5, endpoints.length); i++) {
                    report += "  " + (i + 1) + ". " + green + endpoints[i].name + reset + " - Requests: " + bold + endpoints[i].count + reset + "\n";
                }
            }
        }

        return report || "No DNS requests tracked yet.";
    } catch (e) {
        console.error(bold + "Error generating DNS server report:" + reset, e);
        return "Error generating report.";
    }
}


// Scheduled jobs
if (utils.nodeName() === "hub") {
    jobs.schedule("report-dns-endpoints", "*/20 * * * * *", reportTopDNSEndpoints);
} else {
    jobs.schedule("worker-report-to-hub", "*/10 * * * * *", workerReportToHub);
}

/**
 * Periodic job: Generates and logs the DNS report on the hub.
 */
function reportTopDNSEndpoints() {
    try {
        console.clear();
        console.log(createReport());
    } catch (e) {
        console.error(bold + "Error in hub reporting job:" + reset, e);
    }
}

/**
 * Periodic job: Sends worker DNS data to the hub and resets the local map.
 */
function workerReportToHub() {
    try {
        // important to use the unique identifier to not mix up data with other scripts
        hub.action(scriptId, workerDnsServerMap);
        reportToPrometheus(workerDnsServerMap)
        workerDnsServerMap = {};
    } catch (e) {
        console.error(bold + "Error in worker reporting job:" + reset, e);
    }
}

/**
 * Report pod DNS activity metrics to Prometheus.
 */


/**
 * Reports DNS metrics to Prometheus.
 * Sends metrics with the format:
 * - Metric Name: dns_server
 * - Labels: 
 *   - s_server: The DNS server name (identifier).
 *   - s_endpoint: The resolved DNS endpoint.
 * - Value: The count of requests.
 */
function reportToPrometheus(map) {
    try {
        for (var dnsServer in map) {
            if (map.hasOwnProperty(dnsServer)) {
                for (var endpoint in map[dnsServer]) {
                    if (map[dnsServer].hasOwnProperty(endpoint)) {
                        // Metric name: dns_server
                        var metricName = "dns_server";

                        // Labels: s_server and s_endpoint
                        var labels = {
                            s_server: dnsServer,
                            s_endpoint: endpoint
                        };

                        // Value: Count of requests
                        var value = map[dnsServer][endpoint];

                        // Send the metric to Prometheus
                        prometheus.vector(metricName, "endpoint DNS request count by DNS server", 1, value, labels);
                    }
                }
            }
        }
    } catch (e) {
        console.error(bold + "Error reporting metrics to Prometheus:" + reset, e);
    }
}
