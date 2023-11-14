// Traffic Recording

/*
 * Record traffic and store in AWS S3 using IAM credentials.
 * =========================================================
 * 
 * Description:
 * -----------
 * This script records traffic that matches a KFL statement. Recorded traffic is stored in AWS S3 or GCS (GCP's Cloud Storage). 
 * The operation is done by auto-generating PCAP files based on the KFL statement. 
 * PCAP files are uploaded to AWS S3 once every hour.
 * 
 * Option I - AWS S3 With IAM credentials
 * =======================================
 * To use specific AWS credentials include AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in addition.
 * Read more here: https://docs.kubeshark.co/en/integrations_aws_s3.
 * 
 * Environment Variables:
 * ----------------------
 * AWS_REGION:              <bucket-region>
 * S3_BUCKET:               <bucket-name>
 * AWS_ACCESS_KEY_ID:       <aws-access-key-id>         // not required if IRSA
 * AWS_SECRET_ACCESS_KEY:   <aws-secret-access-key>     // not required if IRSA
 * RECORDING_KFL:           <KFL statement>             // e.g. 'http or dns'
 * 
 *
 * How to use:
 * -----------
 * - Include this file in the scripts folder or enter in the UI section
 * - Make sure the environment variables are present in the config file
 * - To disable this script use and empty KFL statement.
 * 
 * Assets:
 * -------
 * N/A
*/

var pcapArr             = [];
var pcapFolder          = "dfir";
var ACTIVE              = ( env.RECORDING_KFL && kfl.validate(env.RECORDING_KFL) ) ? true : false;

if ( env.RECORDING_KFL && ! kfl.validate(env.RECORDING_KFL))
    console.error(Date().toLocaleString() + "| Invalid KFL: " + env.RECORDING_KFL );

if ( ACTIVE ){
    try{
        console.log(Date().toLocaleString() + "| Recording Traffic Matching: " + env.RECORDING_KFL );
    } catch(error){
        console.error(Date().toLocaleString() + "| " + "Error: " + error + ";");
    }
    file.delete(pcapFolder);
    file.mkdir(pcapFolder); 
}

function onItemCaptured(data) {
    if (!ACTIVE)
        return;
    if (    kfl.match(env.RECORDING_KFL, data) && 
            ( pcapArr.indexOf(data.stream)===-1   ) ){
        pcapArr.push(data.stream);
        try{
            file.copy(pcap.path(data.stream), pcapFolder + "/" + data.stream);   
        } catch(error){
            console.error(Date().toLocaleString() + "| " + "Error copying file:" + pcap.path(data.stream) + "; Error: " + error + ";");
        }
    }    
}

function dfirJob_s3(){
    try{
        console.log(Date().toLocaleString() + "| dfirJob_s3");
    } catch(error){
        console.error(Date().toLocaleString() + "| " + "Error: " + error + ";");
    }
    if (pcapArr.length > 0){
        var tmpPcapFolder = "dfir_tmp";
        file.delete(tmpPcapFolder);
        try{
            file.move(pcapFolder, tmpPcapFolder);
            pcapArr = [];
            file.mkdir(pcapFolder); 
            var snapshot = pcap.snapshot( [], tmpPcapFolder);
            file.delete(tmpPcapFolder);
            vendor.s3.put(
                env.S3_BUCKET, snapshot, env.AWS_REGION, 
                env.AWS_ACCESS_KEY_ID, env.AWS_SECRET_ACCESS_KEY
            ); 
            file.delete(snapshot);   
            var nrh = "name_resolution_history.json";
            vendor.s3.put(
                env.S3_BUCKET, nrh, env.AWS_REGION, 
                env.AWS_ACCESS_KEY_ID, env.AWS_SECRET_ACCESS_KEY
            ); 
        } catch  (error) {
            console.error(Date().toLocaleString() + "| " + "Caught an error!", error);
        }
    }
}


jobs.schedule("dfir_s3", "0 */5 * * * *" , dfirJob_s3);