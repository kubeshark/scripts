// Upload PCAP File of a Stream to an AWS S3 Bucket If Response Status Code is 500

function onItemCaptured(data) {
  if (data.response.status === 500) {
    // Get PCAP file path of the TCP/UDP stream
    var pcapPath = pcap.path(data.stream);

    // Dump the name resolution history into a file
    var nameResolutionHistory = pcap.nameResolutionHistory();
    var nameResolutionHistoryPath = "name_resolution_history.json";
    file.write(
      nameResolutionHistoryPath,
      JSON.stringify(nameResolutionHistory)
    );

    // Upload PCAP file to S3 bucket
    var location = vendor.s3.put(
      env.AWS_REGION,
      env.AWS_ACCESS_KEY_ID,
      env.AWS_SECRET_ACCESS_KEY,
      env.S3_BUCKET,
      pcapPath
    );
    console.log("Uploaded PCAP to S3:", pcapPath, "URL:", location);

    // Upload name resolution history to S3 bucket
    location = vendor.s3.put(
      env.AWS_REGION,
      env.AWS_ACCESS_KEY_ID,
      env.AWS_SECRET_ACCESS_KEY,
      env.S3_BUCKET,
      nameResolutionHistoryPath
    );
    console.log("Uploaded name resolution history to S3:", nameResolutionHistoryPath, "URL:", location);

    // Clean up the temporary files
    file.delete(nameResolutionHistoryPath);
  }
}
