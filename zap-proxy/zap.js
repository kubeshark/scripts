//ZAP

var dataArr = [];

function onItemCaptured(data) {
    if (data.Protocol && data.Protocol.Name == "http")  // Ensure Protocol and Protocol.Name exist
        dataArr.push(data);
}

jobs.schedule("zap-export", "*/60 * * * * *", zapExportJob);  

function zapExportJob() {
    try{
        if (dataArr.length == 0) {
            console.log("No data to export");   
            return;
        }
        var har = wrapper.buildHAR(dataArr);
        dataArr = [];
        var fileName = utils.nodeName() + "-" + new Date().toISOString().replace(/:/g, "-") + ".har";
        if (env.ZAP_APIKEY != null && env.ZAP_APIKEY != "") {
            var path = vendor.webhookForm("POST", env.ZAP_SERVER_URL + "/OTHER/core/other/fileUpload/", {
            "fileContents":     har, 
            "apikey":           env.ZAP_APIKEY,
            "fileName":         fileName
            });
            console.log("HAR uploaded to path: " + path);
            var zap_r = JSON.parse(vendor.webhook("GET",  env.ZAP_SERVER_URL + "/JSON/exim/action/importHar/?apikey=" + 
                env.ZAP_APIKEY + "&filePath=" + JSON.parse(path).Uploaded));
        } else {
            var path = vendor.webhookForm("POST", env.ZAP_SERVER_URL + "/OTHER/core/other/fileUpload/", {
                "fileContents":  har, 
                "fileName":      fileName
            });
            console.log("HAR uploaded to path: " + path);
            var zap_r = JSON.parse(vendor.webhook("GET", env.ZAP_SERVER_URL  + "/JSON/exim/action/importHar/&filePath=" + JSON.parse(path).Uploaded));
        }
        console.log("HAR imported with result: " + zap_r.Result ); // + " | harContent: " + harContent);
    } catch(e){
        console.error(e);
    }
}
