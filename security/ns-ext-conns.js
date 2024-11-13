// ns-ext-conn

var showOnlyExternal = true; // true: show only connection going outside the cluster. false: show connections going outside the namespace
var matchStr = ""; // use a KFL string to narrow down the search (e.g. "http", "tcp", "http and tls", etc)


var processes = {};

function onItemCaptured(data) {  
    try{
        if (kfl.match(matchStr, data) && data && data.src && data.dst &&
                (   (!showOnlyExternal && (data.src.namespace != data.dst.namespace ) ) ||
                    (showOnlyExternal && (data.dst.namespace == "") ) ) ){
            var idx = data.src.processName + (data.src.name || data.src.ip) + (data.dst.name || data.dst.ip);
            if (!processes[idx])
                processes[idx]={
                    processName: data.src.processName,
                    ids: [],
                    podName: data.src.name || data.src.ip,
                    namespace: (data.src.namespace||"External"),
                    destinations: {}
                };
            if (processes[idx].ids.indexOf(data.src.processId) == -1)
                processes[idx].ids.push(data.src.processId)
            var dstName = data.dst.name || data.dst.ip;
            if (!processes[idx].destinations[dstName])
                processes[idx].destinations[dstName]={
                    count: 0,
                    namespace: (data.dst.namespace||"External"),
                };
            processes[idx].destinations[dstName].count++;
        }
    } catch(e){
        console.error(e);
    }
}

if (utils.nodeName() != "hub")
    jobs.schedule("print-processes", "*/20 * * * * *", printProcesses)  

function printProcesses(){
    try{
        if (Object.keys(processes).length == 0){
            return;
        }
        // console.log(JSON.stringify(processes, null, 2));
        var currentDate = new Date();
        var logMsg = "\033[31m" + currentDate.toString()+ "\033[0m\n";
        for (idx in processes){
            if (processes[idx].processName)
                logMsg += "\033[31m" + processes[idx].processName + "\033[0m.";
            logMsg += processes[idx].podName + ".\033[32m" + processes[idx].namespace + "\033[0m";
            logMsg += " => ";
            for (dest in processes[idx].destinations){
                logMsg += dest + ".\033[32m" + processes[idx].destinations[dest].namespace + "\033[0m (count: " + processes[idx].destinations[dest].count + "), ";
            }
            logMsg += "\n";
        }
        console.log(logMsg);
    } catch (e){
        console.error(e);
    }
}