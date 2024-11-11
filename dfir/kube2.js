var active = false;

// Recording name
var name = "test123"
// KFL query [empty means no filtering]
var query = "";
// Cron [if duration is zero, set it to "* * * * * *"]
var cron = "* * * * * *";
// Duration (ms) [Zero means infinite]
var duration = 0;
// Delete the recording after (ms) [Zero means infinite]
var deleteAfter = 0;
// Job repeat limit
var limit = 1;

var recordingDir = "recordings/" + name;

function onItemCaptured(data) {
  if (active && kfl.match(query, data)) {
    file.mkdir(recordingDir);
    console.log(data.entryFile);
    file.copy(pcap.path(data.pcapFile), recordingDir + "/" + data.pcapFile);
    file.write(recordingDir + "/" + data.entryFile, JSON.stringify(data));
  }
}

function activate() {
  active = true;
  if (duration > 0) {
    setTimeout(function () {
      active = false;
    }, duration);
  }
  if (deleteAfter > 0) {
    setTimeout(function () {
      file.delete(recordingDir)
    }, deleteAfter);
  }
}

jobs.schedule(name, cron, activate, limit)
