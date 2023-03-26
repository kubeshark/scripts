// Selective, File-system Based PCAP Snapshotting

var selectedPcapsDir = file.mkdirTemp("snapshot");

function onItemCaptured(data) {
  // Check if it's an HTTP request and the response status is 500
  if (data.protocol.name === "http" && data.response.status === 500) {
    path = pcap.path(data.stream)
    basename = path.replace(/^.*[\\\/]/, '');
    file.copy(path, selectedPcapsDir + '/' + basename)
  }
}

function takePcapSnapshot() {
  // Create a temporary directory
  var dir = file.mkdirTemp("snapshot");

  // Create the PCAP snapshot
  var snapshot = pcap.snapshot([], selectedPcapsDir);

  // Move the snapshot into the temporary directory
  file.move(snapshot, dir);

  // Dump the name resolution history into a file
  var nameResolutionHistory = pcap.nameResolutionHistory();
  file.write(
    dir + "/name_resolution_history.json",
    JSON.stringify(nameResolutionHistory)
  );

  // Create an archive from the directory
  var tarFile = file.tar(dir);

  // Upload TAR file to S3 bucket
  var location = vendor.s3.put(
    env.AWS_REGION,
    env.AWS_ACCESS_KEY_ID,
    env.AWS_SECRET_ACCESS_KEY,
    env.S3_BUCKET,
    tarFile
  );
  console.log("Uploaded PCAP snapshot to S3:", tarFile, "URL:", location);

  /*
  The TAR file kubeshark_<TIMESTAMP>.tar.gz can now be downloaded from the Amazon S3 bucket.
  Use \`kubeshark tap --pcap <TAR_FILE_PATH>\` command to capture from the PCAP snapshot (.tar.gz file)
  */

  // Clean up the temporary files and directories
  file.delete(dir);
  file.delete(tarFile);
  file.delete(selectedPcapsDir);
  selectedPcapsDir = file.mkdirTemp("snapshot");
}

// Call takePcapSnapshot every minute
jobs.schedule("take-pcap-snapshot", "0 */1 * * * *", takePcapSnapshot);
