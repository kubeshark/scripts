// API Calls Recording

/*
 * Record API calls and store in S3. Make available for offline view
 * =================================================================
 * 
 * Description:
 * -----------
 * This script records API call that matches a KFL statement. Recorded API calls are stored in 
 * JSON arrays, in files, in AWS S3. 
 * Files are uploaded to AWS S3 once every hour.
 * 
 * The script expects AWS properties and support both: 
 * a. S3 specific credentials; and 
 * b. IRSA (shared authentication).
 * 
 * To use IRSA, include only: AWS_REGION, APICALLS_S3_BUCKET and APICALLS_KFL.
 * To use specific AWS credentials include AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in addition.
 * Read more here: https://docs.kubeshark.co/en/integrations_aws_s3.
 * 
 * Environment Variables:
 * ----------------------
 * AWS_REGION:              <bucket-region>
 * APICALLS_S3_BUCKET:      <bucket-name>
 * AWS_ACCESS_KEY_ID:       <aws-access-key-id>         // not required if IRSA
 * AWS_SECRET_ACCESS_KEY:   <aws-secret-access-key>     // not required if IRSA
 * APICALLS_KFL:            <KFL statement>              // e.g. 'http or dns'
 *
 * 
 * How to use:
 * -----------
 * - Include this file in the scripts folder or enter in the UI section
 * - Make sure the environment variables are present in the config file
 * - To disable this script use and empty KFL statement or remove the APICALLS_KFL env variable.
 * 
 * Assets:
 * -------
 * N/A
*/

var apicallsArr = [];
var ACTIVE      = ( env.APICALLS_KFL && kfl.validate(env.APICALLS_KFL) ) ? true : false;

if ( env.APICALLS_KFL && ! kfl.validate(env.APICALLS_KFL))
    console.error(Date().toLocaleString() + "| Invalid KFL: " + env.APICALLS_KFL );

if ( ACTIVE ){
    console.log(Date().toLocaleString() + "| Recording API Calls Matching: " + env.APICALLS_KFL );
}

function onItemCaptured(data) {
    if (!ACTIVE)
        return;
    if ( kfl.match(env.APICALLS_KFL, data) )
        apicallsArr.push(data);
}


function apicallsJob(){
    console.log(Date().toLocaleString() + "| apicallsJob");
    if (apicallsArr.length > 0){
        try{
            var tmpApicallsArr = apicallsArr;
            var apicallsFile = file.temp("apicalls" , "." , "json" );
            apicallsArr = [];

            file.write(apicallsFile, JSON.stringify(tmpApicallsArr));
            if (!env.AWS_SECRET_ACCESS_KEY)
                vendor.s3.put( env.APICALLS_S3_BUCKET, apicallsFile, env.AWS_REGION ); 
            else
                vendor.s3.put(
                    env.APICALLS_S3_BUCKET, snapshot, env.AWS_REGION, 
                    env.AWS_ACCESS_KEY_ID, env.AWS_SECRET_ACCESS_KEY
                ); 
            file.delete(apicallsFile); 
        } catch  (error) {
            console.error(Date().toLocaleString() + "| " + "Caught an error!", error);
        }
    }
}

jobs.schedule("apicallsJob", "0 0 * * * *" , apicallsJob);         