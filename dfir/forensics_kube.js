var active = false; 

var name = "example3"
var query = "";
var cron = "* * * * * *";
var duration = 60000;
var deleteAfter = 120000;
var limit = 1;
var recordingDir = "recordings/" + name; 

// create recording folder
try{
    // TODO: delete causes the Worker to break.
    file.delete(recordingDir);
    file.mkdir(recordingDir);
} catch (err) {
    console.error(Date().toLocaleString() + ": Creating recoding folder", err);
}

console.log(Date().toLocaleString() + ": New recording (" + name + ") based on pattern (" + query + ")");

function onItemCaptured(data) {
  if (active && kfl.match(query, data)) {
    var pcapFile = recordingDir + "/" + data.pcapFile;
    var entryFile = recordingDir + "/" + data.entryFile;
    try{
        console.log(Date().toLocaleString() + ": Copy", pcapFile);
        file.copy(pcap.path(data.pcapFile), pcapFile);
        console.log(Date().toLocaleString() + ": Write", entryFile);
        file.write(entryFile, JSON.stringify(data));
    } catch(err) {
        console.error(Date().toLocaleString() + ": Copying", err);        
    }
  }
}

function activate() {
    active = true;
    if (duration > 0) {
        setTimeout(function () {
            console.log(Date().toLocaleString() + ": Stopping recording (" + name + ")");
            active = false;
        }, duration);
    }
    if (deleteAfter > 0) {
        setTimeout(function () {
            console.log(Date().toLocaleString() + ": Deleting recording (" + name + ")");
            active = false;
            try{
                file.delete(recordingDir);
            } catch (err) {
                console.error(Date().toLocaleString() + ": Deleting recoding folder", err);
            }
            // TODO: delete script
        }, deleteAfter);
    }
  }
  
  jobs.schedule(name, cron, activate, limit)
  