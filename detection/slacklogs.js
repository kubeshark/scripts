// Slack Alerts
/*
 * Trigger Slack alerts based on Kubeshark Query Language statements 
 * =================================================================
 * 
 * Description:
 * -----------
 * This script uses an array of log triggers, where each entry includes a  query-based trigger, 
 * a log title and minimum gap time (in ms) between alerts. Each alert will include protocol information, 
 * kubernetes manifest snapshot and a network trace (PCAP).
 * 
 * This script expects Slack Authentication properties. Read more here: https://docs.kubeshark.co/en/integrations_slack
 * 
 * Environment Variables:
 * ----------------------
 * SLACK_AUTH_TOKEN:    <slack-auth-token>
 * SLACK_CHANNEL_ID:  <slack-channel-id>
 * 
 * How to use:
 * -----------
 * - Include this file in the scripts folder
 * - Make sure the environment variables are present in the config file
 * - Change the triggers as you see fit
 * 
 * Assets:
 * -------
 * N/A
*/
var ACTIVE = false; // change to true to activate this script
var LOGS_TRIGGERS =[
    {
        // Detect suspicious payloads
        trigger: 'http and request.headers["Authorization"] == r"Token w2YdcihKE7eo3Fz.*IiIpIplQ==" and request.headers["User-Agent"] == r"influxdb-client-go/.*" and dst.namespace == ""',
        title:'Authorization found in cluster-external communication',
        gap: -1 // -r means deactivated
    },
    {
        // Detect encrypted traffic to outside the cluster
        trigger: 'dst.port==443 and dst.namespace==""',
        title: 'Encrypted external traffic',
        gap: -1 
    },
    {
        trigger: 'put-your-kfl-here',
        title: "All hell just broke loose",
        gap: 30000 // 30000 is 30 seconds
    }
];

/*
 * FROM THIS POINT IT'S TL;DR
 */

var slackAuthToken = env.SLACK_AUTH_TOKEN?env.SLACK_AUTH_TOKEN:"put-toke-here";
var slackChannelID = env.SLACK_CHANNEL_ID?env.SLACK_CHANNEL_ID:"here-goes-channel-id";


function onItemCaptured(data) {
    logTriggers(data);
}

var triggerArr = LOGS_TRIGGERS;

function logTriggers( data){
    if (!ACTIVE)
        return;
    triggerArr.forEach(function(log,idx){
        if (!kfl.validate(log.trigger))
            console.error("KFL invalid", log.trigger);
        else if (kfl.match(log.trigger, data)){
            if (!log.last ||
                Date.now() - log.last > log.gap){
                slackLog(data, log.title);
            }
            triggerArr[idx].last = Date.now();
        }
    });
}


function slackLog(data, title){
    var files = {};
    // Write L4 stream into PCAP
    var pcapPath = pcap.path(data.stream);
    files[data.stream + ".pcap"] = pcapPath;

    // Write data object into file
    var dataPath = file.temp("data", "", "json");
    file.write(dataPath, JSON.stringify(data, null, 2));
    files["data.json"] = dataPath;

    vendor.slackBot(
        slackAuthToken,
        slackChannelID,
        title,                                    
        "Protocol-level message summary",   
        "#ff0000",                                                                   
        {
            "Service": data.dst.name,
            "Namespace": data.namespace,
            "Node": data.node.name,
            "HTTP method": data.request.method,
            "HTTP path": data.request.path
        },
        files
    );        
    file.delete(dataPath);
}