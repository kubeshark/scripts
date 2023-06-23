# DFIR Script Folder

Welcome to the DFIR (Digital Forensics and Incident Response) script folder! This collection of scripts is designed to assist DFIR professionals, including DevOps, platform engineers, and developers, and of course incident responders in their investigations.

# Longer Traffic Retention for Offline Investigation

## Purpose
This script is useful when dealing with suspicious and random network behavior that cannot be predicted in advance. In such cases, it is recommended to record traffic for a longer period of time and analyze the recorded data offline.

## Script: [forensics.js](forensics.js)

## Description
The `forensics.js` script utilizes a list of KFL (Kubeshark Filtering Language) queries to continuously capture network traffic and periodically upload the recorded files to AWS S3. Kubeshark can be run on your laptop, as a standalone application, to conveniently view the uploaded files.

Here are a few examples of KFL queries:

- `dns` - record cluster-wide DNS traffic
- `dst.name==r"cata.*" or src.name==r"cata.*"` - record all traffic going in and out of pods with names matching the provided regular expression
- `node==r"my-node.*" and src.namespace==="my-namespace"` - record traffic originating from a specific namespace and belonging to a certain node

As traffic is recorded per node, it may make sense to limit the KFL queries to a certain node.

For more information on KFL, refer to the [Kubeshark Filtering documentation](https://docs.kubeshark.co/en/filtering).

## Instructions

1. Make sure you are signed up for the Pro edition of Kubeshark. If you haven't done so, please run the following command: `kubeshark pro`. The Pro edition is free.

2. In the configuration file, ensure that you have the following environment variables (at least):

```yaml
license: FT7YKAYBAEDUY2LD.. your license here .. 65JQRQMNSYWAA=
scripting:
  env:
    AWS_ACCESS_KEY_ID: AKI..M3U5
    AWS_REGION: us-east-2-this-is-an-example
    AWS_SECRET_ACCESS_KEY: R4mJjgquy8..ONC6L
    S3_BUCKET: give-it-a-name
  source: "/path/to/a/local/scripts/folder"
  watchScripts: true
```

3. Run Kubeshark. 

   It is considered a best practice to use a pod regex filter and/or a namespace flag with the `kubeshark tap` command to limit the amount of captured traffic.

## Troubleshooting and Playing Arround

1. Verify that the script was uploaded to the hub by checking the scripting section.

<img width="374" alt="image" src="https://github.com/kubeshark/scripts/assets/1990761/eed2d6fb-afc2-4aab-99a8-0450f5d3da2a">

2. Set the `ACTIVE` variable to `true` and modify the KFL entries to match your desired queries.

<img width="1132" alt="image" src="https://github.com/kubeshark/scripts/assets/1990761/d9bea4bc-4de6-44d3-9d6a-808aa897bb8d">

3. Save the script. Every time you save the script, it will restart. If you cannot find the save button, try increasing the resolution, as it might be hidden.

<img width="519" alt="image" src="https://github.com/kubeshark/scripts/assets/1990761/3c8c91cd-23b5-40f1-ad9f-f999fe6a3d1f">

   You can also change the script, directly where you saved it. Kubeshark is monitoring that scripting folder for changes.
   
4. You can adjust the upload time period by modifying the crontab pattern at the end of the script. By default, it is set to one hour.

<img width="563" alt="image" src="https://github.com/kubeshark/scripts/assets/1990761/bbca79e0-4c19-48cc-8980-4106e44ab536">

5. You can view the running script's logs by using: `kubeshark console`.
   To do this from a different computer, use: `--proxy-host <ip-of-where-kubeshark-is-runing>`.

## Offline Investigation

At this time, Kubeshark enables viewing only individual files by running:
```Shell
kubeshark tap --pcap <file-nametar.gz>
```
The above runs KUbeshark as a standalone application that feeds only from the file.
**TIP:** I like to download the entire bucket using this command: `aws s3 sync s3://<bucket-name .`, with the same credentials that were used as environment variables.

Please keep in mind that this is WIP and as with any programming language, so many things can go wrong. Please use with caution!

## Areas of Improvements
- Files are stored individually for every node without consolidation
- Files can only be viewed individually
- There is no storage limit
We are effortlessly working on correcting the above 
