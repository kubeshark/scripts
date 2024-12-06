/**
 * Tracks latency measures per pod and detects anomalies using the Z-Score method.
 * Captures latency data from the L7 hook using 'data.elapsedTime' in microseconds
 * and processes it in a scheduled job to calculate stats.
 * Options:
 * - filterExpression: Filter expression for the L7 hook (e.g. "http")
 * - zScoreThreshold: Z-Score threshold for anomaly detection
 * - rollingWindow: Rolling window size for latency measures
 * - minSampleSize: Minimum sample size for meaningful stats
 */


var filterExpression = "http"; // Filter expression for the L7 hook
var zScoreThreshold = 3; // Z-Score threshold for anomaly detection
var rollingWindow = 1000; // Rolling window size for latency measures
var minSampleSize = 40; // Minimum sample size for meaningful stats

// Object to store latency measures per pod and path
var latencyMeasures = {};
var podStats = {}; // Object to hold calculated stats (mean, stdDev) for each pod and path

var blue = "\x1b[34m"; // Blue color for keys
var green = "\x1b[32m"; // Green color for values
var reset = "\x1b[0m"; // Reset to default color
var bold = "\x1b[1m"; // Bold text
var red = "\x1b[31m"; // Red color for error messages


/**
 * L7 Hook: Captures latency data using 'data.elapsedTime' (in microseconds) and stores it.
 * Tests the newly added value for anomalies using pre-calculated stats from the scheduled job.
 * 
 * @param {Object} data - Metadata object for the captured API call.
 */
function onItemCaptured(data) {
    try {
        if (kfl.match(filterExpression, data) && data.elapsedTime && data.src && data.src.name) {
            var podName = data.src.name; // Use the pod name as the key
            var path = data.request && data.request.path ? data.request.path : "nopath"; // Default to "nopath" if undefined
            var latency = data.elapsedTime; // Latency value in microseconds

            if (latency < 0) {
                console.error(red + "Negative latency detected for pod:" + podName + ", Value:" + latency + "µs. Skipping." + reset);
                return;
            }

            // Initialize the pod's data structure if not already present
            if (!latencyMeasures[podName]) {
                latencyMeasures[podName] = {};
            }
            if (!latencyMeasures[podName][path]) {
                latencyMeasures[podName][path] = [];
            }
            if (!podStats[podName]) {
                podStats[podName] = {};
            }

            // Add the latency measure and ensure the array does not exceed 1000 values
            latencyMeasures[podName][path].push(latency);
            if (latencyMeasures[podName][path].length > rollingWindow) {
                latencyMeasures[podName][path].shift(); // Remove the oldest value
            }

            // Detect anomaly using pre-calculated stats
            if (podStats[podName][path]) {
                var mean = podStats[podName][path].mean;
                var stdDev = podStats[podName][path].stdDev;

                if (stdDev > 0) {
                    var zScore = (latency - mean) / stdDev;
                    if (Math.abs(zScore) > zScoreThreshold) {
                        console.log(
                            bold + blue + podName + "/" + path + reset,
                            "| Latency:", red + latency, "µs" + reset,
                            "| Z-Score:", red + zScore.toFixed(2) + reset,
                            "(Mean:", green + mean.toFixed(2) + "µs" + reset,
                            "| StdDev:", green + stdDev.toFixed(2) + "µs" + reset,
                            "| Sample Size:", latencyMeasures[podName][path].length + ")"
                        );
                    }
                }
            }
        }
    } catch (e) {
        console.error(red + "Error capturing latency data: " + e.message + reset);
    }
}

/**
 * Calculates the mean and standard deviation for a dataset.
 * @param {number[]} data - Array of latency measures
 * @returns {{mean: number, stdDev: number}} - Object containing mean and standard deviation
 */
function calculateMeanAndStdDev(data) {
    if (!data || data.length === 0) {
        return { mean: 0, stdDev: 0 };
    }

    var sum = 0;
    for (var i = 0; i < data.length; i++) {
        sum += data[i];
    }
    var mean = sum / data.length;

    var varianceSum = 0;
    for (var i = 0; i < data.length; i++) {
        varianceSum += Math.pow(data[i] - mean, 2);
    }
    var variance = varianceSum / data.length;
    var stdDev = Math.sqrt(variance);

    return { mean: mean, stdDev: stdDev };
}

/**
 * Scheduled Job: Processes stored latency measures and calculates stats for each pod.
 * Updates the podStats object with mean and standard deviation for each pod.
 */
function analyzeLatencies() {
    try {
        for (var podName in latencyMeasures) {
            if (latencyMeasures.hasOwnProperty(podName)) {
                for (var path in latencyMeasures[podName]) {
                    var measures = latencyMeasures[podName][path];

                    if (measures.length >= minSampleSize) { // Ensure enough data for meaningful stats
                        // Calculate mean and standard deviation
                        var stats = calculateMeanAndStdDev(measures);
                        if (!podStats[podName]) {
                            podStats[podName] = {};
                        }
                        podStats[podName][path] = stats;
                    }

                    // Trim the array to the last 1000 values as a precaution
                    if (measures.length > rollingWindow) {
                        latencyMeasures[podName][path] = measures.slice(-1 * rollingWindow);
                    }
                }
            }
        }
    } catch (e) {
        console.error(red + "Error analyzing latencies: " + e.message + reset);
    }
}

// Schedule the job to run every 10 seconds
if (utils.nodeName() !== "hub") {
    jobs.schedule("analyze-latencies", "*/10 * * * * *", analyzeLatencies);
} else {
    console.clear();
    console.log(bold + "Anomaly detection initialized. Anomalies will be reported if Z-Score > " + red + zScoreThreshold + reset);
}
