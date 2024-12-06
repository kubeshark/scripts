/**
 * 
 * Hook: onItemCaptured
 * 
 * L7 Hook: This function is invoked for every emitted item, representing a reassembled message. 
 * It operates continuously, regardless of the state of the dashboard, whether open or closed.
 * 
 * This hook processes the entire metadata object provided as input. It enables inline processing 
 * of metadata, allowing for quick actions such as calculations or assignments based on the data. 
 * Complex or time-consuming operations should not be included in this function, as it executes 
 * inline with every API call. For such tasks, offload the processing to asynchronous jobs.
 * 
 * This hook works only on the Worker node and not on the hub.
 *
 * @param {Object} data - The metadata object containing detailed information about the reassembled message. 
 * The exact structure can be referenced here: 
 * https://github.com/kubeshark/api/blob/856984a4d0fcccd0317da948c9e3059fdba59fcd/api.go#L330
 * @returns {void} - This function does not return any value.
 * 
 * @example
 * Key metadata fields available for inspection:
 * ==================================================
 * - data.dst.ip
 * - data.dst.name
 * - data.dst.namespace
 * - data.src.ip
 * - data.src.name
 * - data.src.namespace
 * - data.protocol.name
 * - data.request.method
 * - data.request.headers
 * - data.response.headers
 * - data.response.bodySize
 * - data.response.status
 * - data.response.statusText
 * - data.size
 * - data.responseSize
 * - data.requestSize
 * - data.elapsedTime
 * - data.timestamp
 * - data.stream
 * - data.startTime
 * - data.src.processName
 * - data.src.processId
 * - data.dst.processName
 * - data.dst.processId
 * 
 * @example
 * // Example 1: Capturing specific request path
 * function onItemCaptured(data) {
 *   console.log(data.Request.Path);
 *   if (data.Request.Path === "/health") {
 *     const response = vendor.webhook(
 *       "POST",
 *       env.WEBHOOK_URL,
 *       JSON.stringify(data),
 *       { "content-type": "application/json" }
 *     );
 *   }
 * }
 * 
 * @example
 * // Example 2: Logging the entire metadata object
 * function onItemCaptured(data) {
 *   console.log(JSON.stringify(data));
 * }
 */

function onItemCaptured(data) {
}
/**
 * Hook: onHubAction
 * 
 * This hook is called when the `hub.action(action, object)` helper is invoked. While the helper
 * can be called from either the Hub or Workers, the hook is triggered exclusively on the Hub.
 *
 * This hook is particularly useful for moving objects from Workers to the Hub for further processing.
 * For example, if you want to consolidate map objects created on each Worker into a single map object,
 * you can use this hook to receive objects from Workers via the helper and then consolidate them
 * for further processing.
 * 
 * Also, when you'd like to offload some computation to the Hub.
 *
 * This hook works only on the Hub.
 *
 * @param {string} action - A string indicating the type of action being performed.
 * @param {Object} object - The object transmitted using the helper.
 *
 * @returns {void} - This function does not return any value.
 *
 * @example
 * // Consolidating map objects from Workers
 * var map = {};
 *
 * function onHubAction(action, object) {
 *   // Triggered every time hub.action is called
 *   if (object) {
 *       map = joinMaps(map, object);
 *   }
 * }
 *
 * if (utils.nodeName() === "hub") {
 *   jobs.schedule("report-hub", "* * * * * *", reportHub);
 * } else {
 *   jobs.schedule("report-worker", "* * * * * *", reportWorker);
 * }
 *
 * function reportHub() {
 *   console.log(JSON.stringify(map));
 * }
 *
 * function reportWorker() {
 *   hub.action(utils.nodeName(), {
 *       a: 1,
 *       b: "this is b"
 *   });
 * }
 */
function onHubAction(action, object) {
}


/**
 * Hook: onPodEvent
 * 
 * Event Handler: Logs Kubernetes pod events with relevant metadata.
 *
 * This hooks gets called on every pod event.
 *
 * @param {string} event - The event type (e.g., "ADDED", "MODIFIED", "DELETED").
 * @param {Object} pod - The Kubernetes pod object containing metadata and labels.
 *
 * @returns {void} - This function does not return any value.
 *
 * @example
 * // Sample usage within a Kubernetes event listener
 * function onPodEvent(event, pod) {
 *   if (
 *     pod &&
 *     pod.ObjectMeta &&
 *     pod.ObjectMeta.Labels &&
 *     pod.ObjectMeta.Labels["app.kubernetes.io/name"] === "kubeshark"
 *   ) {
 *     var parsedObjectMeta = JSON.parse(JSON.stringify(pod.ObjectMeta));
 *
 *     console.log(
 *       orange + event + reset + " " + prettyLog({
 *         time: parsedObjectMeta.CreationTimestamp,
 *         app: pod.ObjectMeta.Labels["app.kubeshark.co/app"],
 *         pod: pod.ObjectMeta.Name
 *       })
 *     );
 *   }
 * }
 *
 * @example
 * // Example output for a logged pod event:
 * // "ADDED { time: '2024-01-01T12:00:00Z', app: 'kubeshark-app', pod: 'kubeshark-pod-12345' }"
 *
 * Key Metadata Fields for Inspection:
 * - `pod.ObjectMeta.Name`: The name of the Kubernetes pod.
 * - `pod.ObjectMeta.Labels`: A dictionary of labels associated with the pod.
 * - `pod.ObjectMeta.CreationTimestamp`: The timestamp indicating when the pod was created.
 */
function onPodEvent(event, pod) {
}
