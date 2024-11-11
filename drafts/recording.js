
var active = false;

// Recording name
var name = "example"
// KFL query [empty means no filtering]
var query = "";
// Cron [if duration is zero, set it to "* * * * * *"]
var cron = "* * * * * *";
// Duration (ms) [Zero means infinite]
var duration = 14400000;
// Delete the recording after (ms) [Zero means infinite]
var deleteAfter = 172800000;
// Job repeat limit
var limit = 1;

var recordingDir = "recordings/" + name;
try {
  file.mkdir(recordingDir + "/pcaps");
} catch(err) {
  console.error(Date().toLocaleString() + ": Failed recording (" + name + ")", err);
}

function onItemCaptured(data) {
  if (active && kfl.match(query, data)) {
    try {
      file.mkdir(recordingDir + "/pcaps");
      file.copy(pcap.path(data.stream), recordingDir + "/pcaps/" + data.stream);
      file.write(recordingDir + "/" + data.entryFile, JSON.stringify(data));
    } catch(err) {
      console.error(Date().toLocaleString() + ": Failed recording (" + name + ")", err);
    }
  }
}

function activate() {
  active = true;
  if (duration > 0) {
    setTimeout(function () {
      console.log(Date().toLocaleString() + ": Stopping recording (" + name + ")");
      jobS3();
      active = false;
    }, duration);
  }
  if (deleteAfter > 0) {
    setTimeout(function () {
      console.log(Date().toLocaleString() + ": Deleting recording (" + name + ")");
      try {
        file.delete(recordingDir);
      } catch(err) {
        console.error(Date().toLocaleString() +  ": Cannot delete recording (" + name + ")", err);
      }
    }, deleteAfter);
  }
}

function jobS3(){
    if (active & env.S3_BUCKET){
        console.log(Date().toLocaleString() + ": jobS3 AWS upload (" + name + ") based on the filter: (" + query + ")");
        try{
            var tarFile = file.tar(recordingDir)
            file.move(tarFile, name + "_" + tarFile);

            if (env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY)
                vendor.s3.put(
                    env.S3_BUCKET , name + "_" + tarFile, env.AWS_REGION, 
                    env.AWS_ACCESS_KEY_ID, env.AWS_SECRET_ACCESS_KEY    
                ); 
            else
                vendor.s3.put( env.S3_BUCKET , name + "_" + tarFile, env.AWS_REGION ); 
            console.log(Date().toLocaleString() + ": jobS3 uploaded: " + name + "_" + tarFile);
            file.delete(name + "_" + tarFile);   
        } catch  (error) {
            console.error(Date().toLocaleString() + "| " + "Caught an error!", error);
        }
    }
    if (env.GCS_BUCKET && env.GCS_SA_KEY_JSON){
        console.log(Date().toLocaleString() + ": jobS3 GCS upload (" + name + ") based on the filter: (" + query + ")");
        try{
            var tarFile = file.tar(recordingDir)
            file.move(tarFile, name + "_" + tarFile);
            vendor.gcs.put(
                env.GCS_BUCKET,
                name + "_" + tarFile,
                JSON.parse(env.GCS_SA_KEY_JSON)
              );
            console.log(Date().toLocaleString() + ": jobS3 uploaded: " + name + "_" + tarFile);
            file.delete(name + "_" + tarFile);   
        } catch  (error) {
            console.error(Date().toLocaleString() + "| " + "Caught an error!", error);
        }
    }
}

jobs.schedule(name, cron, activate, limit);
jobs.schedule("jobS3", "0 0 * * * *" , jobS3);

console.log(Date().toLocaleString() + ": New recording (" + name + ") based on the filter: (" + query + ")");
