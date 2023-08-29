// Traffic Recording

/*
 * TL;DR - Nothing do do here. This is an automatic script that feeds from the config.yaml's 
 * environment variables.
 * /
 
/*
 * Record traffic and store in S3. Make available for offline view and analysis
 * ============================================================================
 * 
 * Description:
 * -----------
 * This script records traffic that matches a KFL statement. Recorded traffic is stored in AWS S3. 
 * The operation is done by auto-generating PCAP files based on the KFL statement. 
 * PCAP files are uploaded to AWS S3 once every hour.
 * 
 * The script expects AWS properties and support both: 
 * a. S3 specific credentials; and 
 * b. IRSA (shared authentication).
 * 
 * To use IRSA, include only: AWS_REGION, S3_BUCKET and RECORDING_KFL.
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
    console.log(Date().toLocaleString() + "| Recording Traffic Matching: " + env.RECORDING_KFL );
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


function dfirJob(){
    console.log(Date().toLocaleString() + "| dfirJob");
    if (pcapArr.length > 0){
        var tmpPcapFolder = "dfir_tmp";
        file.delete(tmpPcapFolder);
        try{
            file.move(pcapFolder, tmpPcapFolder);
            pcapArr = [];
            file.mkdir(pcapFolder); 
            var snapshot = pcap.snapshot( [], tmpPcapFolder);
            file.delete(tmpPcapFolder);
            if (!env.AWS_SECRET_ACCESS_KEY)
                vendor.s3.put( env.S3_BUCKET, snapshot, env.AWS_REGION ); 
            else
                vendor.s3.put(
                    env.S3_BUCKET, snapshot, env.AWS_REGION, 
                    env.AWS_ACCESS_KEY_ID, env.AWS_SECRET_ACCESS_KEY
                ); 
            file.delete(snapshot);   
            var nrh = "name_resolution_history.json";
            if (!env.AWS_SECRET_ACCESS_KEY)
                vendor.s3.put( env.S3_BUCKET, nrh, env.AWS_REGION ); 
            else
                vendor.s3.put(
                    env.S3_BUCKET, nrh, env.AWS_REGION, 
                    env.AWS_ACCESS_KEY_ID, env.AWS_SECRET_ACCESS_KEY
            ); 
        } catch  (error) {
            console.error(Date().toLocaleString() + "| " + "Caught an error!", error);
        }
    }
}

jobs.schedule("dfir", "0 0 * * * *" , dfirJob);         