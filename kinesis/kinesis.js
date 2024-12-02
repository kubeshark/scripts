//kinesis

/*
 This script demonstrates exporting HTTP payloads in HAR format to a Kinesis stream.
 It exports the data in batches of a minimum size (env.KINESIS_MIN_BATCH_SIZE).
 The script expects the following environment variables to be set:
 - KINESIS_STREAM_NAME:    The name of the Kinesis stream to export the data to
 - AWS_REGION:             The AWS region where the Kinesis stream is located
 - AWS_ACCESS_KEY_ID:      The AWS access key ID to use for authentication
 - AWS_SECRET_ACCESS_KEY:  The AWS secret access key to use for authentication
 - KINESIS_MIN_BATCH_SIZE: The minimum number of items to batch before exporting to Kinesis
 */

 var dataArr = [];

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
     if (data.Protocol && data.Protocol.Name === "http") {
         dataArr.push(data);
     }
 }
 
 /*
  Schedules the job to export data to Kinesis at defined intervals using the jobs.schedule helper.
 
  The jobs.schedule function is used here to repeatedly execute the kinesisExportJob function
  every second, as specified by the cron expression * * * * * *.
 
  Example:
  jobs.schedule("kinesis-export", "* * * * * *", kinesisExportJob);
  */
 jobs.schedule("kinesis-export", "* * * * * *", kinesisExportJob);
 
 /*
  The kinesisExportJob function is executed at scheduled intervals to export
  batched HTTP payloads to a Kinesis stream.
 
  - If the number of items in the batch is below the minimum threshold (KINESIS_MIN_BATCH_SIZE),
    the function exits without exporting data.
  - Otherwise, it builds a HAR payload from the batched data and sends it to the Kinesis stream.
 
  Throws:
  - Logs any errors encountered during HAR creation or Kinesis export.
 
  Returns:
  - None
  */
 function kinesisExportJob() {
     try {
         if (dataArr.length < env.KINESIS_MIN_BATCH_SIZE) {
             console.log("No data to send to Kinesis: " + dataArr.length);
             return;
         }
 
         // The buildHAR function is provided by Kubeshark and expects an array of HTTP payloads
         var har = wrapper.buildHAR(dataArr);
 
         // Uncomment the following line to log the number of items being exported
         // console.log("Exporting " + dataArr.length + " items to Kinesis");
 
         // Reset the data array after building the HAR payload
         dataArr = [];
 
         // Export the HAR payload to Kinesis
         var k_ret = vendor.kinesis.put(
             env.KINESIS_STREAM_NAME,
             har,
             env.AWS_REGION,
             env.AWS_ACCESS_KEY_ID,
             env.AWS_SECRET_ACCESS_KEY
         );
 
         console.log("Kinesis Results: " + k_ret);
     } catch (e) {
         console.error(e);
     }
 }
 