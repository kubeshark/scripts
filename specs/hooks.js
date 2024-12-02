/**
 * L7 Hook: This function is invoked for every emitted item, representing a reassembled message. 
 * It operates continuously, regardless of the state of the dashboard, whether open or closed.
 * 
 * This hook processes the entire metadata object provided as input. It enables inline processing 
 * of metadata, allowing for quick actions such as calculations or assignments based on the data. 
 * Complex or time-consuming operations should not be included in this function, as it executes 
 * inline with every API call. For such tasks, offload the processing to asynchronous jobs.
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
    // Implement your hook logic here
}
  