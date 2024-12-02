// Helper: jobs.schedule

/**
 * Schedules a function to run at specified intervals defined by a cron expression.
 * 
 * This helper allows you to schedule a task (function) to run periodically based on a cron expression.
 * It includes optional arguments for execution limits and additional parameters to pass to the scheduled function.
 * 
 * Since hooks should not run complex or time-consuming code, jobs can be used to handle more complex tasks
 * as they do not run inline with API calls.
 *
 * @function jobs.schedule
 * @param {string} jobName - A unique name or tag for the scheduled job. Used for identifying and managing the job.
 * @param {string} cronExpression - A cron expression defining the schedule, including seconds precision 
 *                                   (e.g., "* * * * * *").
 * @param {function} taskFunction - The function to execute at each scheduled interval. This function is called 
 *                                   with any extra arguments provided.
 * @param {number} [executionLimit=0] - (Optional) The maximum number of times the job should run. A value of 0 
 *                                       means the job will run indefinitely.
 * @param {...*} [args] - (Optional) Additional arguments to pass to the taskFunction when it is executed.
 * @returns {void} - This function does not return any value.
 * 
 * @example
 * // Schedule a job to run every 5 seconds
 * jobs.schedule("example-job", "* * * * * *", exampleJob);
 * 
 * // Schedule a job to run every minute, limited to 10 executions
 * jobs.schedule("limited-job", "0 * * * * *", limitedJob, 10, "arg1", "arg2");
 * 
 * // Function to be executed by the scheduled job
 * function exampleJob() {
 *   console.log("Job executed");
 * }
 * 
 * // Function with additional arguments
 * function limitedJob(arg1, arg2) {
 *   console.log("Job executed with arguments:", arg1, arg2);
 * }
 */

// Helper: vendor.kinesis.put

/**
 * Exports data to an AWS Kinesis stream, typically HTTP payloads.
 * 
 * The `vendor.kinesis.put` function allows exporting data to a specified Kinesis stream. 
 * This data can be processed by external systems, such as security or API security scanning solutions, 
 * which retrieve the data from Kinesis for analysis and processing.
 * 
 * @function vendor.kinesis.put
 * @param {string} streamName - The name of the Kinesis stream to export the data to.
 * @param {string|object} payload - The data to export, often in HAR format, as a string or JSON object.
 * @param {string} awsRegion - The AWS region where the Kinesis stream is located (e.g., "us-west-2").
 * @param {string} accessKeyId - The AWS access key ID used for authentication.
 * @param {string} secretAccessKey - The AWS secret access key used for authentication.
 * @returns {object} - A response object with details of the operation, such as success status, sequence number, and shard ID.
 * @throws {Error} - Throws an error if the export fails due to invalid credentials, stream configuration issues, 
 *                   or connectivity problems.
 * 
 * @example
 * // Exporting HTTP payloads in HAR format to a Kinesis stream
 * var dataArr = [];
 * 
 * function onItemCaptured(data) {
 *     if (data.Protocol && data.Protocol.Name === "http") {
 *         dataArr.push(data);
 *     }
 * }
 * 
 * jobs.schedule("kinesis-export", "* * * * * *", kinesisExportJob);
 * 
 * function kinesisExportJob() {
 *     if (dataArr.length < env.KINESIS_MIN_BATCH_SIZE) {
 *         console.log("No data to send to Kinesis: " + dataArr.length);
 *         return;
 *     }
 * 
 *     var har = wrapper.buildHAR(dataArr);
 *     dataArr = [];
 *     var result = vendor.kinesis.put(env.KINESIS_STREAM_NAME, har, env.AWS_REGION, env.AWS_ACCESS_KEY_ID, env.AWS_SECRET_ACCESS_KEY);
 *     console.log("Kinesis Results: " + result);
 * }
 */


// Helper: console.clear

/**
 * Clears all logged messages from the console. If this code runs on Workers, each execution will cause
 * the console to be cleared.
 *
 * @function console.clear
 * @returns {void} Does not return any value.
 * @example
 * console.clear();
 */

// Helper: console.log

/**
 * Logs a message to the console.
 *
 * @function console.log
 * @param {...*} messages - The messages to log. Accepts any number of arguments of any type.
 * @returns {void} Does not return any value.
 * @example
 * console.log("This is a log message");
 * console.log(JSON.stringify({ key: "value" }));
 * console.log("Value1:", value1, "Value2:", value2);
 */

// Helper: console.error

/**
 * Logs an error message to the console.
 *
 * @function console.error
 * @param {...*} errors - The error messages to log. Accepts any number of arguments of any type.
 * @returns {void} Does not return a value.
 * @example
 * console.error("An error occurred");
 * console.error("Error in module:", moduleName, "at line:", lineNumber);
 */


// Helper: hub.targeted

/**
 * Fetches the Kubeshark object representing which pods are filtered in and which are filtered out 
 * following the application of backend filtering rules. 
 * 
 * Read more about the backend capturing rules here: https://docs.kubeshark.co/en/pod_targeting
 * 
 * Two significant keys:
 * - 'targets': Pods that are filtered in.
 * - 'excluded': Pods that are filtered out.
 * 
 * The pod objects include all available Kubernetes-related information, such as labels, annotations, 
 * and other metadata.
 *
 * @function hub.targeted
 * @returns {object} Returns an object containing the list of targeted and excluded pods.
 * You can view the results of this helper using this API call: https://<kubesahrk-url>/api/pods/targeted
 * 
 * @example
 * var targets = JSON.parse(hub.targeted()).targets;
 * targets.forEach(function(target) {
 *    if (target.spec.nodeName === nodeName) {
 *      var podName = target.metadata.name;
 *      targetedPods[podName] = activePods[podName] || 0;
 *    }
 * });
 */


// Helper: prometheus.vector

/**
 * Reports a metric to Prometheus with a vector type.
 * Each vector consists of a metric name, description, value, and labels.
 * This is useful for reporting metrics with a set of labels that vary in value across measurements.
 * 
 * @function prometheus.vector
 * @param {string} metricName - The name of the metric to report.
 * @param {string} description - A brief description of the metric.
 * @param {number} type - The type of vector: 1 for CounterVector, 2 for GaugeVector.
 * @param {number} value - The value of the metric being reported.
 * @param {object} labels - An object representing the labels for the metric.
 * @returns {string} Returns the status of the request.
 * 
 * @example
 * // Report a metric to Prometheus with a vector type
 * var labels = {
 *    s_pod: podName,
 *    s_active: isActive,
 *    s_script: "pod_traffic",
 * };
 * prometheus.vector(metricName, "Pod traffic activity", 1, value, labels);
 */


// Helper: utils.nodeName

/**
 * Retrieves the Kubeshark component node name. It is either the Worker hostname or the keyword "hub".
 * This utility can be used to ensure code runs (or does not run) on a specific node. For example, you can
 * use this utility to execute code only on the Hub or exclude the Hub from certain tasks.
 *
 * @function utils.nodeName
 * @returns {string} Returns the hostname the script is running on. The "hub" keyword is restricted to the Hub.
 * @example
 * var name = utils.nodeName();
 * if (name !== "hub") {
 *     console.log("I'm a worker:", name);
 * }
 */


// Helper: utils.json2Yaml

/**
 * Converts a JSON object to a YAML string.
 * This utility is useful for transforming JSON objects into YAML format for improved readability and consistency.
 * 
 * @function utils.json2Yaml
 * @param {string} jsonObjectStr - The JSON object to convert to YAML format. For consistency when converting between JavaScript and Go, the object must be stringified.
 * @returns {string} The YAML string representation of the JSON object.
 * 
 * @example
 * // Convert a JSON object to a YAML string
 * var yamlString = utils.json2Yaml(JSON.stringify({
 *   key1: "value1",
 *   key2: "value2"
 * }));
 * console.log(yamlString);
 */

