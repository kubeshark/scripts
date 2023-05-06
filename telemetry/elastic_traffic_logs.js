// Send select traffic logs to Elasticsearch

/*
 * Send Select Traffic Logs to Elasticsearch
 * =========================================
 * 
 * Description:
 * -----------
 * Send select traffic logs to an Elasticsearch instance based on a KFL query. 
 * Simply change the KFL query to meet your use-case and set the authentication variable of 
 * your Elasticsearch instance.
 * 
 * Environment Variables:
 * ----------------------
 * ELASTIC_INDEX:   <elasticsearch-index>
 * ELASTIC_CLOUD_ID:<elasticsearch-cloud-id>
 * ELASTIC_API_ID:  <elasticsearch-api-id>
 * 
 * How to use:
 * -----------
 * - Include this file in the scripts folder
 * - Make sure the environment variables are present in the config file
 * - Change the KFL query to meet your use-case
*/

// Set the kflQuery to meet your use-case
var kflQuery    = "gql and (src.name == 'my-pod-name' or dst.name == 'my-pod-name')";
var ACTIVE      = true;  // change to false to disable this script

// Use environment variables (recommended) or change these variables locally
var elaIdx      = env.ELASTIC_INDEX;
var elaCloId    = env.ELASTIC_CLOUD_ID;
var elaApiId    = env.ELASTIC_API_ID;

function onItemCaptured(data) {
    if (!ACTIVE) return;
    try{
        if (kflQuery.match(kflQuery, data)){
            vendor.elastic(
                "",     // URL is ignored for Elastic Cloud
                elaIdx,
                data,   // Payload
                "",     // Username is ignored for Elastic Cloud
                "",     // Password is ignored for Elastic Cloud
                elaCloId,
                elaApiId
            );
        }
    }
    catch(error){
        console.error("Elastic Traffic Logs", error);
    }
}
