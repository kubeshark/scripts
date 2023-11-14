// Traffic Recording

/*
 * Record traffic and store in Google Cloud Storage.
 * =================================================
 * 
 * Description:
 * -----------
 * This script records traffic that matches a KFL statement. Recorded traffic is stored in AWS S3 or GCS (GCP's Cloud Storage). 
 * The operation is done by auto-generating PCAP files based on the KFL statement. 
 * PCAP files are uploaded to AWS S3 once every hour.
 *  
 * Option III - GCS Using Service Account credentials.
 * ===================================================
 * If AWS credentials are missing and GCS's service account key JSON content is available than 
 * GCS  will be assumed as the storage option:
 * 
 * Environment Variables:
 * ----------------------
 * GCS_BUCKET:              <bucket-name>
 * GCS_SA_KEY_JSON:         <service-account-key-json-content>
 * RECORDING_KFL:           <KFL statement>             // e.g. 'http or dns'
 *
 * How to use:
 * -----------
 * - Include this file in the scripts folder or enter in the UI section
 * - Make sure the environment variables are present in the config file
 * - To disable this script use and empty KFL statement.
 * 
 * Assets:
 * -------
 * N/A
*/

'use strict';

// Global variables
var pcapArr = []; // Array to store unique pcap data streams
var pcapFolder = "dfir"; // Folder for storing pcap files
var ACTIVE = env.RECORDING_KFL && kfl.validate(env.RECORDING_KFL); // Check if KFL statement is valid and set ACTIVE status

// Validate KFL statement
if (env.RECORDING_KFL && !kfl.validate(env.RECORDING_KFL)) {
    console.error(currentDateTime() + "| Invalid KFL: " + env.RECORDING_KFL);
}

// Setup for recording if ACTIVE
if (ACTIVE) {
    try {
        console.log(currentDateTime() + "| Recording Traffic Matching: " + env.RECORDING_KFL);
        file.delete(pcapFolder); // Delete existing pcap folder
        file.mkdir(pcapFolder);  // Create a new pcap folder
    } catch (error) {
        console.error(currentDateTime() + "| Error: " + error + ";");
    }
}

// Function to get current date and time in a readable format
function currentDateTime() {
    return new Date().toLocaleString();
}

// Function called when an item is captured
function onItemCaptured(data) {
    if (!ACTIVE) return;

    // Check if data matches KFL and hasn't been captured before
    if (kfl.match(env.RECORDING_KFL, data) && pcapArr.indexOf(data.stream) === -1) {
        pcapArr.push(data.stream); // Add new stream to the array
        try {
            file.copy(pcap.path(data.stream), pcapFolder + "/" + data.stream); // Copy pcap file to the folder
        } catch (error) {
            console.error(currentDateTime() + "| Error copying file: " + pcap.path(data.stream) + "; Error: " + error + ";");
        }
    }
}

// Function to handle GCS job
function dfirJob_gcs() {
    if (pcapArr.length === 0) return; // Exit if no pcap files are captured

    var tmpPcapFolder = "dfir_tmp"; // Temporary folder for pcap files
    var serviceAccountKey = JSON.parse(env.GCS_SA_KEY_JSON); // Parse GCS service account key

    try {
        console.log(currentDateTime() + "| dfirJob_gcs");
        file.delete(tmpPcapFolder); // Delete existing temporary folder
        file.move(pcapFolder, tmpPcapFolder); // Move pcap files to temporary folder
        pcapArr = []; // Clear the array
        file.mkdir(pcapFolder); // Create a new empty pcap folder

        var snapshot = pcap.snapshot([], tmpPcapFolder); // Create a snapshot of pcap files
        file.delete(tmpPcapFolder); // Delete the temporary folder
        vendor.gcs.put(env.GCS_BUCKET, snapshot, serviceAccountKey); // Upload snapshot to GCS
        file.delete(snapshot); // Delete the local snapshot

        var nrh = "name_resolution_history.json";
        vendor.gcs.put(env.GCS_BUCKET, nrh, serviceAccountKey); // Upload name resolution history to GCS
    } catch (error) {
        console.error(currentDateTime() + "| " + "Caught an error!", error);
    }
}

// Schedule the GCS job to run periodically
jobs.schedule("dfir_fcs", "0 */5 * * * *", dfirJob_gcs);
