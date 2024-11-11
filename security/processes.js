    var processes = {};
    function onItemCaptured(data) {  
        try{
            if (data && data.src && (data.src.cgroupId>0)){
                var idx = data.src.processName + data.src.processId + data.src.name;
                if (!processes[idx])
                    processes[idx]={
                        ids: [],
                        podName: "",
                        destinations: {}
                    };
                if (processes[data.src.processName].ids.indexOf(data.src.processId) == -1)
                    processes[data.src.processName].ids.push(data.src.processId)
                processes[data.src.processName].podName = data.src.name;

                if (!processes[data.src.processName].destinations[data.dst.name])
                    processes[data.src.processName].destinations[data.dst.name]={
                        count: 0,
                        namespace: ""
                    };
                processes[data.src.processName].destinations[data.dst.name].namespace=data.dst.namespace;
                processes[data.src.processName].destinations[data.dst.name].count++;
                //console.log(JSON.stringify(processes));
            }
        } catch(e){
            console.error(e);  
        }
    }
    if (utils.nodeName() != "hub")
        jobs.schedule("print-processes", "*/5 * * * * *", printProcesses)  

    function printProcesses(){
        try{
            if (Object.keys(processes).length == 0){
                //console.log("No processes found\n");
                return;
            }
            var logMsg = "\n"
            for (var processName in processes){
                logMsg += "\033[0;32m" + processName + "(";
                for (var id in processes[processName].ids){
                    logMsg += processes[processName].ids[id] + ", ";
                }   
                logMsg += ")\033[0;32m: " + processes[processName].podName +  " => ";
                for (var destination in processes[processName].destinations){
                    if (processes[processName].destinations[destination].namespace == "")
                        logMsg += "\033[0;31m" + destination + "(" + processes[processName].destinations[destination].count + ")\033[0m, ";
                    else
                        logMsg += destination + "(" + processes[processName].destinations[destination].count + "), ";
                }
                logMsg += "\n";
            }
            console.log(logMsg);
        } catch (e){
            console.error(e);
        }
    }