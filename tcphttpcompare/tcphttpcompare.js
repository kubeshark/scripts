// get TCP packets with GET
// retrieve the path
// count the GET requests per path
// count the HTTP requests per same path

var tcpActivePaths = {};
var httpActivePaths = {};
var gapActivePaths = {};

function onItemQueried(data, filter) { //onItemCaptured(data) {

    if ( kfl.match( "tcp and data.payload.startsWith(\"GET\")", data ) ){
        var path = data.data.payload.split(" ")[1];

        if (!tcpActivePaths[data.src.name]) {
            tcpActivePaths[data.src.name] = {};
        }

        if (!tcpActivePaths[data.src.name][data.dst.name]) {
            tcpActivePaths[data.src.name][data.dst.name] = {};
        }

        if (!tcpActivePaths[data.src.name][data.dst.name][path]) {
            tcpActivePaths[data.src.name][data.dst.name][path] = 0;
        }

        tcpActivePaths[data.src.name][data.dst.name][path]++;
    }
    if ( kfl.match( "http and request.method==\"GET\"", data)){
        var path = data.request.path;

        if (!httpActivePaths[data.src.name]) {
            httpActivePaths[data.src.name] = {};
        }

        if (!httpActivePaths[data.src.name][data.dst.name]) {
            httpActivePaths[data.src.name][data.dst.name] = {};
        }

        if (!httpActivePaths[data.src.name][data.dst.name][path]) {
            httpActivePaths[data.src.name][data.dst.name][path] = 0;
        }

        httpActivePaths[data.src.name][data.dst.name][path]++;
    }
}

jobs.schedule("print-report", "*/10 * * * * *", printReport);

function printReport() {
    //console.log("TCP active paths: " + utils.json2Yaml(JSON.stringify(tcpActivePaths)));
    //return;
    // Calculate the gap between TCP and HTTP requests for each path
    gapActivePaths = {};
    for (var src in tcpActivePaths) {
        gapActivePaths[src] = gapActivePaths[src] || {};

        for (var src in tcpActivePaths) {
            if (!gapActivePaths[src]) {
                gapActivePaths[src] = {};  // Initialize src if missing
            }
    
            for (var dst in tcpActivePaths[src]) {
                if (!gapActivePaths[src][dst]) {
                    gapActivePaths[src][dst] = {};  // Initialize dst if missing
                }
    
                for (var path in tcpActivePaths[src][dst]) {
                    var tcpCount = tcpActivePaths[src][dst][path];
                    var httpCount = (httpActivePaths[src] && httpActivePaths[src][dst] && httpActivePaths[src][dst][path]) 
                        ? httpActivePaths[src][dst][path] 
                        : 0;  // If HTTP path is missing, default to 0
    
                    gapActivePaths[src][dst][path] = tcpCount - httpCount;
                }
            }
        }
    }
    // Print the report in YAML format
    console.log("Active paths (TCP vs HTTP gap): " + utils.json2Yaml(JSON.stringify(gapActivePaths)));
}