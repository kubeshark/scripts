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
 * - `utils.nodeName`: Retrieves the Kubeshark component node name. It is either the Worker hostname or the keyword "hub".
 * - `jobs.schedule`: Schedules a job to run at a specific time or interval.
 * - `kfl.match`: Filters data based on a KFL string.
 * - `console.log`: Logs a message to the console.
 * - `console.clear`: Clears all logged messages from the console.
 * 
 * **Configuration Options:**
 * - `showOnlyExternal`: When set to `true`, shows only connections going outside the cluster. 
 *   When `false`, includes connections going outside the namespace.
 * - `matchStr`: A KFL string to narrow the search scope (e.g., `"http"`, `"tcp"`, `"http and tls"`).
 * 
 * **Captured Data:**
 * - Source process name
 * - Source namespace
 * - Destination name or IP
 * - Destination namespace
 * - Count of connections to each destination
 * 
 * **Scheduler:**
 * If running on a Worker node, the `printProcesses` function is scheduled to execute every 20 seconds, 
 * logging details of active processes and their destinations.
 * 
 * @file ReportExternalConnection.js
 * @example
 * // Configuration
 * var showOnlyExternal = true; // true: show only external cluster connections
 * var matchStr = "http"; // Show only HTTP traffic
 */

// Configuration variables
var showOnlyExternal = true; // true: show only connections going outside the cluster. false: outside the namespace
var matchStr = ""; // KFL filter for narrowing down search (e.g., "http", "tcp", "http and tls", etc)

// Store process data
var processes = {};

/**
 * Captures and logs external connections based on the configured filters.
 * 
 * @param {object} data - The metadata object for a captured API call.
 */
function onItemCaptured(data) {
    try {
        // Filter data based on match string and connection type
        if (kfl.match(matchStr, data) && data && data.src && data.dst &&
            ((!showOnlyExternal && (data.src.namespace !== data.dst.namespace)) || 
            (showOnlyExternal && (data.dst.namespace === "")))) {
                
            var idx = data.src.processName + (data.src.name || data.src.ip) + (data.dst.name || data.dst.ip);

            // Initialize process data if not already tracked
            if (!processes[idx]) {
                processes[idx] = {
                    processName: data.src.processName,
                    ids: [],
                    podName: data.src.name || data.src.ip,
                    namespace: (data.src.namespace || "External"),
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
                    namespace: (data.dst.namespace || "External")
                };
            }
            processes[idx].destinations[dstName].count++;
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
            return;
        }

        var currentDate = new Date();
        var logMsg = "[31m" + currentDate.toString() + "[0m";

        for (var idx in processes) {
            if (processes[idx].processName) {
                logMsg += "[31m" + processes[idx].processName + "[0m.";
            }
            logMsg += processes[idx].podName + ".[32m" + processes[idx].namespace + "[0m";
            logMsg += " => ";
            for (var dest in processes[idx].destinations) {
                logMsg += dest + ".[32m" + processes[idx].destinations[dest].namespace + "[0m (count: " +
                    processes[idx].destinations[dest].count + "), ";
            }
            logMsg += "\n";
        }

        console.log(logMsg);
    } catch (e) {
        console.error(e);
    }
}

// Schedule the process printing job if running on a Worker node
if (utils.nodeName() !== "hub") {
    jobs.schedule("print-processes", "*/20 * * * * *", printProcesses);
}
