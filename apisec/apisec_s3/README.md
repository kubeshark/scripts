## Record API Calls and Store Their Metadata in an S3 Bucket

This script is designed to record API calls that satisfy a specific KFL (Keyword Filtering Language) criterion. The metadata of these recorded API calls are stored as JSON arrays within files in an AWS S3 bucket. The system automatically uploads these files to AWS S3 once every hour. 

The script is straightforward and intended primarily as an illustrative example.

### Required Configuration

```yaml
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

Refer to [here](apisec_s3.js) for the script.

## How to Use:

- Place this file in the scripts directory or input it in the UI section.
- Ensure the necessary environment variables are configured in the file.
- To deactivate this script, either use an empty KFL statement or omit the `APICALLS_KFL` environment variable.

## Troubleshooting

### Verify the Script Upload

Check the scripting dashboard to confirm the script has been loaded.

### Manually Trigger the Job

To bypass the hourly schedule and trigger the job immediately, navigate to the Jobs dashboard and execute the job manually.

### Make Sure You Start Clean

Other than the first time, make sure you use the `clean` command before restarting Kubeshark:

```yaml
kubeshark clean
kubeshark tap
```


