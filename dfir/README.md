# DFIR Script Folder

Welcome to the DFIR (Digital Forensics and Incident Response) scripts folder! This collection of scripts is designed to assist DFIR professionals, including DevOps, platform engineers, and developers, and of course incident responders in their investigations.

# Traffic Recording and Long Retention Periods

## Purpose
This script is useful when dealing with suspicious and random network behavior that cannot be predicted in advance. In such cases, it is recommended to record traffic for a longer period of time and analyze the recorded data offline.

## Script: [forensics.js](forensics.js)

## Description
The `forensics.js` script utilizes a KFL (Kubeshark Filtering Language) statement to continuously capture network traffic and periodically upload the recorded files to AWS S3. The recorded traffic can be investigated offline at the investigator's discretion.

Here are a few examples of KFL queries:

- `dns` - record cluster-wide DNS traffic
- `dst.name==r"cata.*" or src.name==r"cata.*"` - record all traffic going in and out of pods with names matching the provided regular expression
- `node==r"my-node.*" and src.namespace==="my-namespace"` - record traffic originating from a specific namespace and belonging to a certain node

As traffic is recorded per node, it may make sense to limit the KFL queries to certain nodes.

For more information on KFL, refer to the [Kubeshark Filtering documentation](https://docs.kubeshark.co/en/filtering).

## Instructions

1. Make sure you are signed up for the Pro edition of Kubeshark. If you haven't done so, please run the following command: `kubeshark pro`. The Pro edition is free.

2. If you're not using IRSA or kube2iam perform this step: In the configuration file, ensure that you have the following environment variables (at least):

```yaml
license: FT7YKAYBAEDUY2LD.. your license here .. 65JQRQMNSYWAA=
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

3. If you are using a form of IRSA or kube2iam, you aren't required to have the AWS_SECRET_ACCESS_KEY and AWS_ACCESS_KEY_ID present, however, you need to provide the proper annotation:

```yaml
tap:
   annotations:
   - "eks.amazonaws.com/role-arn": "arn:aws:iam::145..380:role/s3-role"

license: FT7YKAYBAEDUY2LD.. your license here .. 65JQRQMNSYWAA=
scripting:
  env:
    AWS_REGION: us-east-2-this-is-an-example
    S3_BUCKET: give-it-a-name
    RECORDING_KFL: "http or dns" # To deactivated remove this field.
  source: "/path/to/a/local/scripts/folder"
  watchScripts: true
```

4. Run Kubeshark. 

  Run `kubeshark tap`.

## Offline Investigation

Files are continually uploaded to the provided S3 bucket. The bucket structure will include a folder per Worker where the folder name includes a run ID to denote restarted Workers. 

You can view a specific folder or the entire bucket.

To view the saved traffic files, you'd need to provide the S3 URL to Kubeshark's CLI:
```Shell
kubeshark tap --pcap s3://<bucket-name>/
```
The above runs Kubeshark as a standalone application that feeds only from the file.
Make sure your AWS configuration is similar to the one that was used to upload the files.

Please keep in mind that this is WIP and as with any programming language, so many things can go wrong. Please use with caution!

## Troubleshooting

1. Verify that the script was uploaded to the Hub by checking the scripting section.

<img width="374" alt="image" src="https://github.com/kubeshark/scripts/assets/1990761/eed2d6fb-afc2-4aab-99a8-0450f5d3da2a">

2. Although not required, you can make changes to the script. Every time you save the script, it will restart. If you cannot find the save button, try increasing the resolution, as it might be hidden. If you delete the script, service will stop.

<img width="519" alt="image" src="https://github.com/kubeshark/scripts/assets/1990761/3c8c91cd-23b5-40f1-ad9f-f999fe6a3d1f">
   
3. You can adjust the upload time period by modifying the crontab pattern at the end of the script. By default, it is set to one hour.

<img width="563" alt="image" src="https://github.com/kubeshark/scripts/assets/1990761/bbca79e0-4c19-48cc-8980-4106e44ab536">

4. You can view the running script's logs by using: `kubeshark console`.
   To do this from a different computer, use: `--proxy-host <ip-of-where-kubeshark-is-runing>`.

