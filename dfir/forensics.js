// Traffic Recording

/*
 * Record traffic and store in S3. Make available for offline view and analysis
 * ============================================================================
 * 
 * Description:
 * -----------
 * This script records traffic that matches a KFL statement. Recorded traffic is stored in AWS S3 or GCS (GCP's Cloud Storage). 
 * The operation is done by auto-generating PCAP files based on the KFL statement. 
 * PCAP files are uploaded to AWS S3 once every hour.
 * 
 * The script looks for one of three storage options, and uses the first storage option that is found:
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
 * Option II - AWS S3 Using IRSA
 * ==============================
 * In case only AWS_REGION, S3_BUCKET and RECORDING_KFL are available, IRSA is assumed.
 * 
 *  * Environment Variables:
 * ----------------------
 * AWS_REGION:              <bucket-region>
 * S3_BUCKET:               <bucket-name>
 * RECORDING_KFL:           <KFL statement>             // e.g. 'http or dns'
 *  
 * Option III - GCS Using Service Account credentials.
 * ===================================================
 * If AWS credentials are missing and GCS's service account key JSON content is available than 
 * GCS  will be assumed as the storage option:
 * 
 * Environment Variables:
 * ----------------------
 * GCS_BUCKET:              <bucket-name>
 * GCS_SA_KEY_JSON:         <service-account-key-json-content>
 * RECORDING_KFL:           <KFL statement>             // e.g. 'http or dns'
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

function dfirJob_s3_irsa(){
    try{
        console.log(Date().toLocaleString() + "| dfirJob_s3_irsa");
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
            vendor.s3.put( env.S3_BUCKET, snapshot, env.AWS_REGION ); 
            file.delete(snapshot);   
            var nrh = "name_resolution_history.json";
            vendor.s3.put( env.S3_BUCKET, nrh, env.AWS_REGION ); 
        } catch  (error) {
            console.error(Date().toLocaleString() + "| " + "Caught an error!", error);
        }
    }
}

function dfirJob_gcs(){
    try{
        console.log(Date().toLocaleString() + "| dfirJob_gcs");
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
            vendor.gcs.put( env.GCS_BUCKET, snapshot, JSON.parse(env.GCS_SA_KEY_JSON )); 
            file.delete(snapshot);   
            var nrh = "name_resolution_history.json";
            vendor.gcs.put( env.GCS_BUCKET, nrh, JSON.parse(env.GCS_SA_KEY_JSON )); 
        } catch  (error) {
            console.error(Date().toLocaleString() + "| " + "Caught an error!", error);
        }
    }
}


if (env.AWS_SECRET_ACCESS_KEY)
    jobs.schedule("dfir", "0 0 * * * *" , dfirJob_s3);    
else if  (env.S3_BUCKET)
    jobs.schedule("dfir", "0 0 * * * *" , dfirJob_s3_irsa);    
else if (env.GCS_BUCKET)
    jobs.schedule("dfir", "0 0 * * * *" , dfirJob_gcs);    
