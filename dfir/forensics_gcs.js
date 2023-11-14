// Traffic Recording

/*
 * Record traffic and store in Google Cloud Storage.
 * =================================================
 * 
 * Description:
 * -----------
 * This script records traffic that matches a KFL statement. Recorded traffic is stored in AWS S3 or GCS (GCP's Cloud Storage). 
 * The operation is done by auto-generating PCAP files based on the KFL statement. 
 * PCAP files are uploaded to AWS S3 once every hour.
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

jobs.schedule("dfir_fcs", "0 */5 * * * *" , dfirJob_gcs);    
