//kinesis

/*
    * This script demonstrates exporting HTTP payloads in HAR format to a Kinesis stream
    * It exports the data in batches of a minimum size (enf.KINESIS_MIN_BATCH_SIZE).
    * The script expects the following environment variables to be set:
    * - KINESIS_STREAM_NAME:    The name of the Kinesis stream to export the data to
    * - AWS_REGION:             The AWS region where the Kinesis stream is located
    * - AWS_ACCESS_KEY_ID:      The AWS access key ID to use for authentication
    * - AWS_SECRET_ACCESS_KEY:  The AWS secret access key to use for authentication
    * - KINESIS_MIN_BATCH_SIZE: The minimum number of items to batch before exporting to Kinesis
*/

var dataArr = [];

function onItemCaptured(data) {
    if (data.Protocol && data.Protocol.Name == "http") 
        dataArr.push(data);
}

jobs.schedule("kinesis-export", "*/1 * * * * *", kinesisExportJob);

function kinesisExportJob() {
    try{
        if (dataArr.length < env.KINESIS_MIN_BATCH_SIZE) {
            console.log("No data to send to Kinesis: " + dataArr.length);
            return;
        }
        
        // the buildHAR function is provided by Kubeshark as a wrapper and expects an array of HTTP payloads
        var har = wrapper.buildHAR(dataArr);

        // uncomment the log message to see the payloads that are being exported
        // console.log("Exporting " + dataArr.length + " items to Kinesis");
        dataArr = [];
        var k_ret = vendor.kinesis.put(
            env.KINESIS_STREAM_NAME,
            har,
            env.AWS_REGION,
            env.AWS_ACCESS_KEY_ID,
            env.AWS_SECRET_ACCESS_KEY);
        console.log("Kinesis Results: " + k_ret);
    } catch(e){
        console.error(e);
    }
}