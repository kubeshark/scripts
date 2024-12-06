/**
 * Monitors and logs external connections from the cluster or namespace.
 * 
 * This script is good to detect and log pods with external connections from the cluster or namespace.
 * This script can be extended to detect processes at the operating system level that were not expected to have external connections.
 * 
 * As an example, consider a hacker SSHing into a pod, and using curl to download or upload encrypted
 * payload to an external server. If the pod is allowed to have an external connection, 
 * the process is likely to be successful. This script can be extended to help detect such activities.
 * 
 * This script captures external connections and logs details about the source processes, their namespaces, 
 * and their destinations. It can be configured to filter connections going outside the cluster or only outside 
 * the namespace.
 * 
 * This script uses the following helpers:
 * - 'utils.nodeName': Retrieves the Kubeshark component node name. It is either the Worker hostname or the keyword 'hub'.
 * - 'jobs.schedule': Schedules a job to run at a specific time or interval.
 * - 'kfl.match': Filters data based on a KFL string.
 * - 'console.log': Logs a message to the console.
 * - 'console.clear': Clears all logged messages from the console.
 * 
 * **Configuration Options:**
 * - 'showOnlyExternal': When set to 'true', shows only connections going outside the cluster. 
 *   When 'false', includes connections going outside the namespace.
 * - 'matchStr': A KFL string to narrow the search scope (e.g., 'http', 'tcp', 'http and tls').
 * 
 * **Captured Data:**
 * - Source process name
 * - Source namespace
 * - Destination name or IP
 * - Destination namespace
 * - Count of connections to each destination
 * 
 * **Scheduler:**
 * If running on a Worker node, the 'printProcesses' function is scheduled to execute every 20 seconds, 
 * logging details of active processes and their destinations.
 * 
 * @file ReportExternalConnection.js
 * @example
 * // Configuration
 * var showOnlyExternal = true; // true: show only external cluster connections
 * var matchStr = 'http'; // Show only HTTP traffic
 */

// Configuration variables
var showOnlyExternal = true; // true: show only connections going outside the cluster. false: outside the namespace

// Store process data
var processes = {};
var processNamesToBlock = [
    // 'curl',
];

// Color variables
var blue = '[34m'; // Blue color for keys
var green = '[32m'; // Green color for values
var reset = '[0m'; // Reset to default color
var bold = '[1m'; // Bold text
var red = '[31m'; // Red color for error messages
var yellow = '[33m'; // Yellow color for warnings
var orange = '[38;5;214m'; // Approximation for orange in 256-color palette

/**
 * Checks if an IP address is public or private within the context of a Kubernetes cluster.
 * Private includes traditional private IP ranges, link-local addresses, and metadata service IPs.
 * 
 * @param {string} ip - The IP address to check.
 * @returns {boolean} - Returns true if the IP is public, otherwise false.
 */
function isPublicIP(ip) {
    try {
        var privateRanges = [
            /^10\./, // 10.0.0.0 - 10.255.255.255
            /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // 172.16.0.0 - 172.31.255.255
            /^192\.168\./, // 192.168.0.0 - 192.168.255.255
            /^127\./, // 127.0.0.0 - 127.255.255.255 (loopback)
            // /^169\.254\./, // 169.254.0.0 - 169.254.255.255 (link-local, including 169.254.169.254)
            /^::1$/, // IPv6 loopback
            /^fc00:/, // IPv6 unique local address
            /^fe80:/, // IPv6 link-local address
            /^100\.64\./, // 100.64.0.0 - 100.127.255.255 (Carrier-Grade NAT)
            /^198\.18\./ // 198.18.0.0 - 198.19.255.255 (network testing)
        ];

        // Check if the IP matches any private or reserved range
        for (var i = 0; i < privateRanges.length; i++) {
            if (privateRanges[i].test(ip)) {
                return false; // IP is private or reserved
            }
        }

        // If no private ranges matched, the IP is public
        return true;
    } catch (e) {
        console.error('Error checking IP:', e);
        return false;
    }
}

/**
 * Captures and logs external connections based on the configured filters.
 * 
 * @param {object} data - The metadata object for a captured API call.
 */
function onItemCaptured(data) {
    try {
        // Filter data based on match string and connection type
        if (data && data.src && data.dst && data.dst.ip &&
            ((!showOnlyExternal && (data.src.namespace !== data.dst.namespace)) || 
            (showOnlyExternal && (data.dst.namespace === '') && isPublicIP(data.dst.ip))
        )) {
             
            var idx = data.src.processName + '|' + (data.src.name || data.src.ip) + '|' + (data.dst.name || data.dst.ip);

            // Initialize process data if not already tracked
            if (!processes[idx]) {
                processes[idx] = {
                    processName: data.src.processName,
                    ids: [],
                    podName: data.src.name || data.src.ip,
                    namespace: (data.src.namespace || 'External'),
                    destinations: {}
                };
            }

            // Track unique process IDs
            if (processes[idx].ids.indexOf(data.src.processId) === -1) {
                processes[idx].ids.push(data.src.processId);
            }

            // Track destinations and connection counts
            var dstName = data.dst.name || data.dst.ip;
            if (!processes[idx].destinations[dstName]) {
                processes[idx].destinations[dstName] = {
                    count: 0,
                    namespace: (data.dst.namespace || 'External')
                };
            }
            processes[idx].destinations[dstName].count++;

            // Block the pod if the process name is in the block list
            if (data.src.processName && data.src.pod && processNamesToBlock.indexOf(data.src.processName) !== -1) {
                console.log(red + 'Action Triggered: ' + bold + 'Block Pod\n' + reset +
                    'Process: ' + red + data.src.processName + reset +
                    '\nPod: ' + red + data.src.name + reset +
                    '\nDestination: ' + red + dstName + reset +
                    '\nServer response: ' + blue + hub.blockPod(data.src.name, data.src.namespace) + reset); 
            }
        }
    } catch (e) {
        console.error(e);
    }
}

/**
 * Logs the collected process and connection data in a structured format.
 */
function printProcesses() {
    try {
        // If no processes are tracked, skip logging
        if (Object.keys(processes).length === 0) {
            logMsg = 'No processes to log.';
        } else {
            var currentDate = new Date();
            var logMsg = '[31m' + currentDate.toString() + '[0m\n';

            for (var idx in processes) {
                if (processes[idx].processName) {
                    logMsg += '[31m' + processes[idx].processName + '[0m.';
                }
                logMsg += processes[idx].podName + '.[32m' + processes[idx].namespace + '[0m';
                logMsg += ' => ';
                for (var dest in processes[idx].destinations) {
                    logMsg += dest + '.[32m' + processes[idx].destinations[dest].namespace + '[0m (count: ' +
                        processes[idx].destinations[dest].count + '), ';
                }
                logMsg += '\n';
            }
            console.log(logMsg);
        }
    } catch (e) {
        console.error(e);
    }
}

// Schedule the process printing job if running on a Worker node
if (utils.nodeName() !== 'hub') {
    jobs.schedule('print-processes', '*/20 * * * * *', printProcesses);
}
