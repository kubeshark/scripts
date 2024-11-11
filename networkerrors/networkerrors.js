//networkerrors

if (utils.nodeName() == "hub")
    throw( "This script should not run on the hub" );

var pods={}

var consts ={
    DNS_RESOLUTION_FAILURE: "DNS_RESOLUTION_FAILURE",
}

function onItemCaptured(data) {  
    try{
        //checkDNSResolutionFailure(data);
        checkGeneralErrors(data);
    } catch(e){
        console.error(e);  
    }
} 


function checkInitPods(data) {
    if (! data || !data.src || !data.src.name)
        return; 
    if (!(data.src.name in pods)) {
        pods[data.src.name] = {
            errors: {},
            namespace: data.src.namespace
        };
        /*
        pods[data.src.name].errors[consts.DNS_RESOLUTION_FAILURE] = {
            count: 0
        };
        */
    }
    if (data.error && data.error.msg && (!(data.error.msg in pods[data.src.name].errors))) {
        pods[data.src.name].errors[data.error.msg] = {
            count: 0
        };
    }
}

function checkDNSResolutionFailure(data) {
    if ( data && data.protocol && (data.protocol.name == "dns") &&
        !data.response.additionals.length &&
        !data.response.answers.length &&
        !data.response.authorities.length){
            checkInitPods(data);
            pods[data.src.name].errors[consts.DNS_RESOLUTION_FAILURE].count ++;
    }
}

function checkGeneralErrors(data) {
    if (data && data.error && data.protocol && data.error.msg && (data.protocol.name == "http")){
        checkInitPods(data);
        pods[data.src.name].errors[data.error.msg].count ++;
    }
}

jobs.schedule("print-report", "*/10 * * * * *", printReport)

function printReport(){
    try{
        console.log("\x1b[31mNetwork Error Report\x1b[0m\n" + utils.json2Yaml(JSON.stringify(pods)));
    } catch (e){
        console.error(e);
    }
}