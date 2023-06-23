// Forensics

var ACTIVE = true;

var KFL_ARR =[
    'http and response.code > 500' // add KFL entries
];


//TL;DR

/*
 * Auto-generate and Upload Network Traces to AWS S3 based on KFLs Queries
 * =======================================================================
 * 
 * Description:
 * -----------
 * This script auto-generates PCAPs based on KFL queries and uploads these PCAPs to AWS S3 once every hour.
 * It expects AWS S3 authentication properties. Read more here: https://docs.kubeshark.co/en/integrations_aws_s3.
 * 
 * Environment Variables:
 * ----------------------
 * AWS_REGION:              <bucket-region>
 * AWS_ACCESS_KEY_ID:       <aws-access-key-id>
 * AWS_SECRET_ACCESS_KEY:   <aws-secret-access-key>
 * S3_BUCKET:               <bucket-name>
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
var verbose = true;
var awsRegion = env.AWS_REGION;
var awsAccessKeyId = env.AWS_ACCESS_KEY_ID;
var awsSecretAccessKey = env.AWS_SECRET_ACCESS_KEY;
var s3Bucket = env.S3_BUCKET;
var pcapFolder = "dfir";
var tmpPcapFolder = "dfir_tmp";
file.delete(tmpPcapFolder);
file.delete(pcapFolder);
file.mkdir(pcapFolder); 
var timestampNow = Date.now();

if ( !awsRegion || awsRegion.length < 4)
    console.error( Date().toLocaleString() + "| " + "AWS property awsRegion is missing");
if ( !awsAccessKeyId || awsAccessKeyId.length < 4)
    console.error( Date().toLocaleString() + "| " + "AWS property awsAccessKeyId is missing");
if ( !awsSecretAccessKey || awsSecretAccessKey.length < 4)
    console.error( Date().toLocaleString() + "| " + "AWS property awsSecretAccessKey is missing");
if ( !s3Bucket || s3Bucket.length < 4)
    console.error( Date().toLocaleString() + "| " + "AWS property s3Bucket is missing");

function dfirDetect(data, kflArr) {
    kflArr.forEach(function(kflQuery, idx){
        var newKfl = "(" + kflQuery + ") and (timestamp > " + timestampNow + ")";
        if (kfl.match(newKfl, data) && pcapArr.indexOf(data.stream)===-1){
            pcapArr.push(data.stream);
            try{
                file.copy(pcap.path(data.stream), pcapFolder + "/" + data.stream); 
                if (verbose) console.log( Date().toLocaleString() + "| " + 
                "dfir: new PCAP: KFL=" + 
                newKfl + "; PCAP=" + data.stream + "; files=" + 
                pcapArr.length + "; time=" + Date(data.timestamp).toLocaleString());    
            } catch(error){
                console.error(Date().toLocaleString() + "| " + "Error copying file:" + pcap.path(data.stream) + "; Error: " + error + ";");
            }
        }    
    });
}

function dfirJob(){
    console.log(Date().toLocaleString() + "| dfirJob");
    if (pcapArr.length > 0){
        file.delete(tmpPcapFolder);
        try{
            file.move(pcapFolder, tmpPcapFolder);
            pcapArr = [];
            file.mkdir(pcapFolder); 
            var newTmpPcapFolder = file.mkdirTemp("newTmpPcapFolder");
            var snapshot = pcap.snapshot(tmpPcapFolder);
            file.delete(tmpPcapFolder);
            file.move(snapshot,newTmpPcapFolder + "/");
            var nameResolutionHistory = pcap.nameResolutionHistory();
            file.write(
                newTmpPcapFolder + "/name_resolution_history.json",
                JSON.stringify(nameResolutionHistory)
            );
            var tarFile = file.tar(newTmpPcapFolder);
            file.delete(newTmpPcapFolder);
            var location = vendor.s3.put(
                awsRegion,
                awsAccessKeyId,
                awsSecretAccessKey,
                s3Bucket,
                tarFile
            ); 
            file.delete(tarFile);   
            console.log(Date().toLocaleString() + "| " +  
            "dfir|S3 TAR: " + tarFile + "; location: " + location);
        } catch  (error) {
            console.error(Date().toLocaleString() + "| " + "Caught an error!", error);
        }
    }
}



jobs.schedule("dfir", "0 0 * * * *" , dfirJob);         
