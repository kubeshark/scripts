// Traffic Recording

/*
 * Record traffic and store in AWS IRSA. 
 * ====================================
 * 
 * Description:
 * -----------
 * This script records traffic that matches a KFL statement. Recorded traffic is stored in AWS S3 or GCS (GCP's Cloud Storage). 
 * The operation is done by auto-generating PCAP files based on the KFL statement. 
 * PCAP files are uploaded to AWS S3 once every hour.
 * 
 * Option II - AWS S3 Using IRSA
 * ==============================
 * In case only AWS_REGION, S3_BUCKET and RECORDING_KFL are available, IRSA is assumed.
 * Read more here: https://docs.kubeshark.co/en/integrations_aws_s3 and https://docs.kubeshark.co/en/irsa.
 * 
 * Environment Variables:
 * ----------------------
 * AWS_REGION:              <bucket-region>
 * S3_BUCKET:               <bucket-name>
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

jobs.schedule("dfir_irsa", "0 */5 * * * *" , dfirJob_s3_irsa);    
