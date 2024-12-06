/**
 * Tracks latency measures per pod and detects anomalies using the Interquartile Range (IQR) method.
 * Captures latency data from the L7 hook using `data.elapsedTime` in microseconds and processes it in a scheduled job.
 * Ensures no pod's latency array exceeds 1000 values. Logs and skips negative values.
 */

// Object to store latency measures per pod
var latencyMeasures = {};

var blue = "\x1b[34m"; // Blue color for keys
var green = "\x1b[32m"; // Green color for values
var reset = "\x1b[0m"; // Reset to default color
var bold = "\x1b[1m"; // Bold text
var red = "\x1b[31m"; // Red color for error messages
var yellow = "\x1b[33m"; // Yellow color for warnings
var orange = "\x1b[38;5;214m"; // Approximation for orange in 256-color palette

/**
 * L7 Hook: Captures latency data using `data.elapsedTime` (in microseconds) and stores it.
 * Ensures no pod's latency array exceeds 1000 values and skips negative values.
 * 
 * @param {Object} data - Metadata object for the captured API call.
 */
function onItemCaptured(data) {
    try {
        if (data.elapsedTime && data.src && data.src.name) {
            var podName = data.src.name; // Use the pod name as the key
            var latency = data.elapsedTime; // Latency value in microseconds

            if (latency < 0) {
                // Log and skip negative latency values
                console.error(red + "Negative latency detected for pod: " + podName + ", Value: " + latency + "µs. Skipping." + reset);
                return;
            }

            // Initialize the pod's latency array if not already present
            if (!latencyMeasures[podName]) {
                latencyMeasures[podName] = [];
            }

            // Add the latency measure
            latencyMeasures[podName].push(latency);

            // Ensure the array does not exceed 1000 values
            if (latencyMeasures[podName].length > 1000) {
                latencyMeasures[podName].shift(); // Remove the oldest value
            }
        }
    } catch (e) {
        console.error("Error capturing latency data:", e);
    }
}

/**
 * Detects if the latest value is an anomaly using the Interquartile Range (IQR) method.
 * 
 * @param {Array<number>} data - The array of latency measures for the pod.
 * @param {number} value - The latest value to check.
 * @returns {boolean} - Returns true if the value is an anomaly, otherwise false.
 */
function detectAnomaly(data, value) {
    if (data.length < 40) {
        // Not enough data to calculate IQR (minimum 4 values required)
        // console.log("Not enough data to detect anomalies for pod. Skipping.");
        return false;
    }

    // Sort the data
    var sorted = data.slice().sort(function(a, b) {
        return a - b;
    });

    // Calculate Q1 (25th percentile) and Q3 (75th percentile)
    var q1Index = Math.floor((sorted.length - 1) * 0.25);
    var q3Index = Math.floor((sorted.length - 1) * 0.75);
    var q1 = sorted[q1Index];
    var q3 = sorted[q3Index];

    // Calculate IQR
    var iqr = q3 - q1;

    // Define lower and upper bounds
    var lowerBound = q1 - 1.5 * iqr;
    var upperBound = q3 + 1.5 * iqr;

    // Check if the value is an anomaly
    return value < lowerBound || value > upperBound;
}

/**
 * Calculates the IQR thresholds for a dataset.
 * 
 * @param {Array<number>} data - The array of latency measures.
 * @returns {Object} - An object containing the lower and upper bounds.
 */
function calculateThresholds(data) {
    if (data.length < 40) {
        // Not enough data to calculate thresholds
        return { lowerBound: null, upperBound: null };
    }

    // Sort the data
    var sorted = data.slice().sort(function(a, b) {
        return a - b;
    });

    // Calculate Q1 (25th percentile) and Q3 (75th percentile)
    var q1Index = Math.floor((sorted.length - 1) * 0.1);
    var q3Index = Math.floor((sorted.length - 1) * 0.9);
    var q1 = sorted[q1Index];
    var q3 = sorted[q3Index];

    // Calculate IQR and thresholds
    var iqr = q3 - q1;
    return {
        lowerBound: q1 - 1.5 * iqr,
        upperBound: q3 + 1.5 * iqr
    };
}

/**
 * Scheduled Job: Processes stored latency measures and checks for anomalies.
 * Ensures no pod's latency array exceeds 1000 values during processing.
 */
function analyzeLatencies() {
    try {
        console.log("Analyzing pod latencies for anomalies...");

        // Iterate over all pods
        for (var podName in latencyMeasures) {
            var logMessage = "";

            if (latencyMeasures.hasOwnProperty(podName)) {
                var measures = latencyMeasures[podName];
                var anomalies = [];
                var thresholds = calculateThresholds(measures);
                var lowerBound = thresholds.lowerBound;
                var upperBound = thresholds.upperBound;
            
                // Detect anomalies and add details to the log message
                for (var i = 0; i < measures.length; i++) {
                    if (detectAnomaly(measures, measures[i])) {
                        if (measures[i] > upperBound) {
                            anomalies.push({
                                value: measures[i],
                                reason: measures[i] < lowerBound ? "below lower bound" : "above upper bound"
                            });
                        }
                    }
                }
            
                if (anomalies.length > 0) {
                    logMessage =  blue + podName + reset + " anomalies (" + red + anomalies.length + reset + "): ";
                    logMessage += anomalies.map(function(a) {
                        return a.value + "µs";
                    }).join(", ") + " > " + green + upperBound + "µs(sample size: " + measures.length + ")."  + reset;
                    console.log(logMessage);
                }
            
                // Ensure the array does not exceed 1000 values
                if (measures.length > 1000) {
                    latencyMeasures[podName] = measures.slice(-1000);
                }
            }
            
        }
    } catch (e) {
        console.error("Error analyzing latencies:", e);
    }
}

// Schedule the anomaly detection job to run every 20 seconds
if (utils.nodeName() !== "hub") {
    jobs.schedule("analyze-latencies", "*/20 * * * * *", analyzeLatencies);
}
