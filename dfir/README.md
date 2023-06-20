# DFIR Script Folder

This is the DFIR script folder. Here you can find scripts that can be used to assist in DFIR professionals

## Available Scripts

### Auto-generate and Upload Network Traces to AWS S3 based on KFLs Queries

- **Script**: [dfir.js](forensics.js)

#### Description

Continuously record  traffic in certain areas of the cluster or based on specific network behaviors as defined in a list of KFL entries. Recorded traffic is stored in PCAP format and uploaded to AWS S3 once an hour.
Here are a few example of KFL entries that provide description as to what to record:

- `dns` - record cluster-wide DNS traffic 
- `dst.name==r"cata.*" or src.name==r"cata.*"` - record all traffic going in and out of all pods with resolved names that match the regular expression. 
- `node==r"my-node.*" and src.namespace==="my-namespace"` - record traffic that belongs to a certain node only and that originate from a certain namespace.

Read more about KFL here: https://docs.kubeshark.co/en/filtering
