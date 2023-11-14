# DFIR Script Folder (Traffic Recording & Offline Analysis)

Welcome to the DFIR (Digital Forensics and Incident Response) scripts folder! 
This collection of scripts is designed to assist DFIR professionals, including DevOps, platform engineers, and developers, and of course incident responders in their investigations.
While these scripts are ready-to-go as-is, they are made as examples and for the purpose of customization. If you choose to use these scripts as-is you do it on your own risk.

# Traffic Recording and Offline Investigation
## Purpose
This script is useful when dealing with suspicious and random network behavior that cannot be predicted in advance. In such cases, it is recommended to record traffic for a longer period of time and analyze the recorded data offline.

## Scripts: 
- [forensics_s3.js](forensics_s3.js)
- [forensics_IRSA.js](forensics_irsa.js)
- [forensics_gcs.js](forensics_gcs.js)

## Description
The `forensics_XXXX.js` script utilizes a KFL (Kubeshark Filtering Language) statement to continuously capture network traffic and periodically upload the recorded files to an immutable datastore. The recorded traffic can be investigated offline at the investigator's discretion.

Here are a few examples of KFL queries:

- `dns or http` - record cluster-wide DNS **and** HTTP traffic
- `dst.name==r"cata.*" or src.name==r"cata.*"` - record all traffic going in and out of pods with names matching the provided regular expression
- `node==r"my-node.*" and src.namespace==="my-namespace"` - record traffic originating from a specific namespace and belonging to a certain node

For more information on KFL, refer to the [Kubeshark Filtering documentation](https://docs.kubeshark.co/en/filtering).

## Instructions

1. Independent of your storage option you can set your recording pattern using the `RECORDING_KFL` environment variable. Recording will commence only if this variable is present. This variable should include the KFL pattern. For example:
```yaml
scripting:
  env:
    RECORDING_KFL: "http or dns" # To deactivated remove this field.
```
2. Choose an configure your storage option:

#### AWS S3

In `config.yaml` or `values.yaml`, ensure that you have the following environment variables (at least):

```yaml
scripting:
  env:
    AWS_ACCESS_KEY_ID: AKI..M3U5
    AWS_REGION: us-east-2-this-is-an-example
    AWS_SECRET_ACCESS_KEY: R4mJjgquy8..ONC6L
    S3_BUCKET: give-it-a-name
    RECORDING_KFL: "http or dns" # To deactivated remove this field.
  source: "/path/to/a/local/scripts/folder"
  watchScripts: true
```
Download an optionally customize the following script to the scripts folder: https://raw.githubusercontent.com/kubeshark/scripts/master/dfir/forensics_s3.js

#### AWS IRSA

When using [IRSA](https://docs.aws.amazon.com/eks/latest/userguide/iam-roles-for-service-accounts.html) or [kube2iam](https://github.com/jtblin/kube2iam), perform this step:

In `config.yaml` or `values.yaml`, ensure that you have the following environment variables (at least):

```yaml
tap:
   annotations:
   - "eks.amazonaws.com/role-arn": "arn:aws:iam::145..380:role/s3-role"
scripting:
  env:
    AWS_REGION: us-east-2-this-is-an-example
    S3_BUCKET: give-it-a-name
    RECORDING_KFL: "http or dns" # To deactivated remove this field.
  source: "/path/to/a/local/scripts/folder"
  watchScripts: true
```
Download an optionally customize the following script to the scripts folder: https://raw.githubusercontent.com/kubeshark/scripts/master/dfir/forensics_irsa.js

#### Google Cloud Storage (GCS)

In `config.yaml` or `values.yaml`, ensure that you have the following environment variables (at least):

```yaml
scripting:
  env:
    GCS_BUCKET: give-it-a-name
    GCS_SA_KEY_JSON : '{
  "type": "service_account",
  "project_id": "clou..on",
  "private_key_id": "14..81",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIB...tDAYZxgNB0=\n-----END PRIVATE KEY-----\n",
  "client_email": "k..on.iam.gserviceaccount.com",
  "client_id": "10..72",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/k..ion.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
}'
    RECORDING_KFL: http or dns
  source: "/path/to/a/local/scripts/folder"
  watchScripts: true
```

3. Run Kubeshark. 

  Run `kubeshark tap`.

## Offline Investigation

To view the saved traffic files, you'd need to provide the S3 URL to Kubeshark's CLI:
```Shell
kubeshark tap --pcap s3://<bucket-name>/
```
The above runs Kubeshark as a standalone application that downloads and feeds only from the files.
Make sure your AWS configuration is similar to the one that was used to upload the files.

Please keep in mind that this is WIP. Please use with caution!

## Troubleshooting

1. Verify that the script was uploaded to the Hub by checking the scripting section.

<img width="374" alt="image" src="https://github.com/kubeshark/scripts/assets/1990761/eed2d6fb-afc2-4aab-99a8-0450f5d3da2a">

2. Although not required, you can make changes to the script. Every time you save the script, it will restart. If you cannot find the save button, try increasing the resolution, as it might be hidden. If you delete the script, service will stop.

<img width="519" alt="image" src="https://github.com/kubeshark/scripts/assets/1990761/3c8c91cd-23b5-40f1-ad9f-f999fe6a3d1f">
   
3. You can adjust the upload time period by modifying the crontab pattern at the end of the script. By default, it is set to one hour.

<img width="563" alt="image" src="https://github.com/kubeshark/scripts/assets/1990761/bbca79e0-4c19-48cc-8980-4106e44ab536">

4. You can view the running script's logs by using: `kubeshark console`.
   To do this from a different computer, use: `--proxy-host <ip-of-where-kubeshark-is-runing>`.

