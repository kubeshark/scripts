# DFIR Script Folder

This is the DFIR script folder. Here you can find scripts that can be used to assist in DFIR professionals

## Available Scripts

### Longer traffic retention, ready for offline investigation

#### Why

When investigating a suspecious and random network behgavior and can't predict when it will occure. In this case, it makes sense to record traffic for a longer period of time and investigate the recorded traffic offline.

- **Script**: [dfir.js](forensics.js)

#### What (Description)

The DFIR script uses a list of KFL queries to continuously records traffic and periodically upload files to AWS S3.
Kubeshark, can be used as a standalone application running on your laptop to view the uplaoded files at your descretion.

Here're a few KFL examples:

- `dns` - record cluster-wide DNS traffic 
- `dst.name==r"cata.*" or src.name==r"cata.*"` - record all traffic going in and out of all pods with resolved names that match the regular expression. 
- `node==r"my-node.*" and src.namespace==="my-namespace"` - record traffic that belongs to a certain node only and that originate from a certain namespace.

Read more about KFL here: https://docs.kubeshark.co/en/filtering

#### How (Instructions)
1. Make sure you're signed up to the Pro edition. If you haven't, please run: `kubeshark pro`. Pro edition is free.
2. In the configuration file ensure you have the following four envrionemnt variables (at least):

```shell
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
3. Run `kubeshark tap; kubeshark clean`
4. It is best practice to run `kubeshark tap` with a pod regex filter and/or a namespace flag to limit the amount of traffic that is captured.
5. Make sure the script was uploaded by checking the `scripting section`
<img width="374" alt="image" src="https://github.com/kubeshark/scripts/assets/1990761/eed2d6fb-afc2-4aab-99a8-0450f5d3da2a">

6. Change the `ACTIVE` variable to `true` and change the KFL entries to suite the KFL queries you want.
<img width="1132" alt="image" src="https://github.com/kubeshark/scripts/assets/1990761/d9bea4bc-4de6-44d3-9d6a-808aa897bb8d">

7. Save the script. Everytime you save the script, it will restart. If you can't find the save button, incerase the resolution. It may be hiding.
<img width="519" alt="image" src="https://github.com/kubeshark/scripts/assets/1990761/3c8c91cd-23b5-40f1-ad9f-f999fe6a3d1f">

8. You can play with the upload time period, by changing the crontab pattern at the end of the script. It is set to one hour by default.
<img width="563" alt="image" src="https://github.com/kubeshark/scripts/assets/1990761/bbca79e0-4c19-48cc-8980-4106e44ab536">

Thanks for participating in our private beta program. You are basically using the developement version of this capability. Please do not use in production or any place it can do harm.

