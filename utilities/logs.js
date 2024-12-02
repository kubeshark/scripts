// Kubeshark Logs and Pod Events Report
var logLevels = [
    "error",
    "warning",
    // "info",
  ];
  
  var blue = "[34m"; // Blue color for keys
  var green = "[32m"; // Green color for values
  var reset = "[0m"; // Reset to default color
  var bold = "[1m"; // Bold text
  var red = "[31m"; // Red color for error messages
  var yellow = "[33m"; // Yellow color for warnings
  var orange = "[38;5;214m"; // Approximation for orange in 256-color palette
  
  // Clear console and print header if running on the "hub" node
  if (utils.nodeName() === "hub") {
    console.clear();
    console.log(bold + "Kubeshark Logs and Pod Events Report" + reset);
  }
  
  /**
   * Formats an object into a pretty ANSI-colored string for terminal logs.
   * If the object has a 'time' field, it is prepended to the log.
   * The remaining keys and values are styled with colors.
   * @param {Object} obj - The object to format.
   * @returns {string} - A formatted string.
   */
  function prettyLog(obj) {
    var msg = "";
  
    // Check if the 'time' field exists and prepend it
    if (obj.hasOwnProperty("time")) {
      msg += blue + obj["time"] + reset + " "; // Add time in green
      delete obj["time"]; // Remove 'time' key to avoid duplication
    }
    if (obj.hasOwnProperty("message")) {
        msg += green + obj["message"] + reset + " "; // Add time in green
        delete obj["message"]; // Remove 'time' key to avoid duplication
    }
    if (obj.hasOwnProperty("level")) {
        delete obj["level"]; // Remove 'time' key to avoid duplication
    }
    // Iterate over the remaining keys in the object
    for (var key in obj) {
      if (obj.hasOwnProperty(key)) {
        msg += blue + key + reset + ": " + green + obj[key] + reset + ", ";
      }
    }
  
    return msg.slice(0, -2); // Remove trailing ", "
  }
  
  /**
   * Logs messages with level-based prefixes.
   * Only logs messages with levels 'error' or 'warning'.
   * @param {string} level - The log level (e.g., "error", "warning").
   * @param {string|Object} msg - The log message, either a stringified JSON or an object.
   */
  function onLogCall(level, msg) {
    // Only log relevant levels
    if (logLevels.indexOf(level) == -1)
      return;
  
    var prefix = "";
    switch (level) {
      case "info":
        prefix = green + "INF" + reset;
        break;
      case "error":
        prefix = red + "ERR" + reset;
        break;
      case "warning":
        prefix = yellow + "WRN" + reset;
        break;
      default:
        prefix = "LOG"; // Default log prefix for unknown levels
        break;
    }
  
    // Parse message if it's a JSON string
    var parsedMsg = typeof msg === "string" ? JSON.parse(msg) : msg;
  
    console.log(prefix + " " + prettyLog(parsedMsg));
  }
  
  /**
   * Logs Kubernetes pod events with relevant metadata.
   * Filters events for pods with the 'kubeshark' label.
   * Logs the 'CreationTimestamp', app label, and pod name.
   * @param {string} event - The event type (e.g., "ADDED", "MODIFIED").
   * @param {Object} pod - The Kubernetes pod object.
   */
  function onPodEvent(event, pod) {
    // Ensure the pod has the required metadata and labels
    if (
      pod &&
      pod.ObjectMeta &&
      pod.ObjectMeta.Labels &&
      pod.ObjectMeta.Labels["app.kubernetes.io/name"] === "kubeshark"
    ) {
      // Deep copy ObjectMeta to avoid modifying the original object
      var parsedObjectMeta = JSON.parse(JSON.stringify(pod.ObjectMeta));
  
      console.log(
        orange + event + reset + " " + prettyLog({
          time: parsedObjectMeta.CreationTimestamp, // Creation timestamp
          app: pod.ObjectMeta.Labels["app.kubeshark.co/app"], // App label
          pod: pod.ObjectMeta.Name // Pod name
        })
      );
    }
  }
  
  