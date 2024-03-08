## Record API Calls and Store Their Metadata in an S3 Bucket

This script records API calls that match a KFL statement. 
Recorded API calls' metadata are stored in JSON arrays, in files, in AWS S3. 
Files are uploaded to AWS S3 once every hour.

Script is simple and is provided more as an example than anything else.

### Required Configuration

```yanl
tap:
 scripting:
  env:
    AWS_REGION:              us-east-1
    APICALLS_S3_BUCKET:      apisec
    AWS_ACCESS_KEY_ID:       AK..BF
    AWS_SECRET_ACCESS_KEY:   Af..2v
    APICALLS_KFL:            http
  source: /path/to/scripts/
  watchScripts: true
```

### Script

See [here](apisec_s3.js)

## How to use:

- Include this file in the scripts folder or enter in the UI section
- Make sure the environment variables are present in the config file
- To disable this script use and empty KFL statement or remove the APICALLS_KFL env variable.