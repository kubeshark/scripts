// Forensics

var KFL_ARR =[
    'http',
    'dns'
];

var ACTIVE = false;
var IRSA = true;

//TL;DR

/*
 * Auto-generate and Upload Network Traces to AWS S3 based on KFLs Queries
 * =======================================================================
 * 
 * Description:
 * -----------
 * This script auto-generates PCAPs based on KFL queries and uploads these PCAPs to AWS S3 once every hour.
 * It supports both use of S3 specific credentials and IRSA (shared authentication). Therefore if IRSA 
 * flag is set to false, it expects AWS S3 authentication properties in addition to region and bucket. 
 * If IRSA flag is set to true, no auth credentials nessasery. Read more here: https://docs.kubeshark.co/en/integrations_aws_s3.
 * 
 * Environment Variables:
 * ----------------------
 * AWS_REGION:              <bucket-region>
 * S3_BUCKET:               <bucket-name>
 * AWS_ACCESS_KEY_ID:       <aws-access-key-id>         // not required if IRSA
 * AWS_SECRET_ACCESS_KEY:   <aws-secret-access-key>     // not required if IRSA

 * 
 * How to use:
 * -----------
 * - Include this file in the scripts folder or enter in the UI section
 * - Make sure the environment variables are present in the config file (or put them in the script file)
 * - Add KFL queries to the KFL_ARR and change ACTIVE to true
 * 
 * Assets:
 * -------
 * N/A
*/

function onItemCaptured(data) {
    if (!ACTIVE)
        return;
    dfirDetect(data, KFL_ARR);
}


// TL;DR

var pcapArr = [];
var awsRegion = env.AWS_REGION;
var awsAccessKeyId = env.AWS_ACCESS_KEY_ID;
var awsSecretAccessKey = env.AWS_SECRET_ACCESS_KEY;
var s3Bucket = env.S3_BUCKET;
var pcapFolder = "dfir";
file.delete(pcapFolder);
file.mkdir(pcapFolder); 

if ( !awsRegion || awsRegion.length < 4)
    console.error( Date().toLocaleString() + "| " + "AWS property awsRegion is missing");
if ( !IRSA && (!awsAccessKeyId || awsAccessKeyId.length < 4))
    console.error( Date().toLocaleString() + "| " + "AWS property awsAccessKeyId is missing");
if ( !IRSA && (!awsSecretAccessKey || awsSecretAccessKey.length < 4))
    console.error( Date().toLocaleString() + "| " + "AWS property awsSecretAccessKey is missing");
if ( !s3Bucket || s3Bucket.length < 4)
    console.error( Date().toLocaleString() + "| " + "AWS property s3Bucket is missing");

function dfirDetect(data, kflArr) {
    kflArr.forEach(function(kflQuery, idx){
        if (kfl.match(kflQuery, data) && pcapArr.indexOf(data.stream)===-1){
            pcapArr.push(data.stream);
            try{
                file.copy(pcap.path(data.stream), pcapFolder + "/" + data.stream);   
            } catch(error){
                console.error(Date().toLocaleString() + "| " + "Error copying file:" + pcap.path(data.stream) + "; Error: " + error + ";");
            }
        }    
    });
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
            if (IRSA)
                var location = vendor.s3.put( s3Bucket, snapshot, awsRegion ); 
            else
                var location = vendor.s3.put(
                    s3Bucket, snapshot, awsRegion, 
                    awsAccessKeyId, awsSecretAccessKey
                ); 
            file.delete(snapshot);   
            var nameResolutionHistory = pcap.nameResolutionHistory();
            var nrh = "name_resolution_history.json";
            file.write( nrh, JSON.stringify(nameResolutionHistory) );
            if (IRSA)
                location = vendor.s3.put( s3Bucket, nrh, awsRegion ); 
            else
                location = vendor.s3.put(
                    s3Bucket, nrh, awsRegion, 
                    awsAccessKeyId,  awsSecretAccessKey
                ); 
            file.delete(nrh);   
        } catch  (error) {
            console.error(Date().toLocaleString() + "| " + "Caught an error!", error);
        }
    }
}

jobs.schedule("dfir", "0 0 * * * *" , dfirJob);         