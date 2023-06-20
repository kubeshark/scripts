// Detect throughput anomalies 

var APIs = [
    {
        pathRegex: /pcap.*/i,
        throughputRange: {
            yellow: 1, // per minute
            red: 2
        },
        serviceRegex: null,
        namespaceRegex: null,
        nodeRegex: null
    }
];

/*
 * Alert Slack when throughput anomaly is found
 * ==========================================================
 * 
 * Description:
 * -----------
 *
 * 
 * Environment Variables:
 * ----------------------
 * 
 * How to use:
 * -----------
 * - Include this file in the scripts folder
 * - Make sure the environment variables are present in the config file
 * 
 * Assets:
 * -------
*/

// Use environment variables (recommended) or change these variables locally

// Monitor certain APIs
// Accumulate throughput every one minute
// Check if over the limit. If yes report



var slackAuthToken = env.SLACK_AUTH_TOKEN?env.SLACK_AUTH_TOKEN:"your-token";
var slackChannelID = env.SLACK_CHANNEL_ID?env.SLACK_CHANNEL_ID:"your-channel";

function onItemCaptured(data) {
    return hookAccumulateData(data);
}

var monitoredAPIs= APIs;
/*
 * path, service, namespace, node
 */
monitoredAPIs.forEach(function(api, idx){
    api.calls = 0;
});

function hookAccumulateData(data){
    monitoredAPIs.forEach(function(api, idx){
        if (data.request.path &&
            data.request.path.match(api.pathRegex) &&
            (api.nodeRegex===null ||
            data.node && data.node.match(api.nodeRegex) ) &&
            (api.serviceRegex===null ||
            data.src.name && data.src.name.match(api.serviceRegex) )  &&  
            (api.namespaceRegex ===null||
            data.src.namespace && data.src.namespace.match(api.namespaceRegex)         
            )){ 
            api.calls++;    
            console.log("path: " + data.request.path + " regex:" + api.pathRegex + ", counter:" + api.calls);
        }
    });
}

function checkThroughput(){
    monitoredAPIs.forEach(function(api, idx){
        console.log("API:", JSON.stringify(api));
        if (api.calls>api.throughputRange.red){
        console.log("red");
            vendor.slackBot(
                slackAuthToken,
                slackChannelID,
                "RED ZONE ALERT" ,                                    
                api.pathRegex + " throughput is the RED ZONE",   
                "#ff0000",                                                                   
                {
                    "Throughput ": "" + api.calls,
                    "Red zone": "" + api.throughputRange.red,
                }
            );
        }
        else if (api.calls>api.throughputRange.yellow){
            console.log("yellow");
            vendor.slackBot(
                slackAuthToken,
                slackChannelID,
                "YELLOW ZONE ALERT" ,                                    
                api.pathRegex + " throughput is the YELLOW ZONE",   
                "FFFF00",                                                                   
                {
                    "Throughput ": "" + api.calls + " / minute",
                    "Red zone": "" + api.throughputRange.red + " / minute",
                }
                
            );        
        }
        api.calls = 0;
    });  
}

jobs.schedule("check-api-throughput", "20 * * * * *", checkThroughput);
