// Short Version of PCAP Snapshotting

function onItemCaptured(data) {
  // Check if it's an HTTP request and the response status is 500
  if (data.protocol.name === "http" && data.response.status === 500) {
    var location = wrapper.pcapSnapshot(
      env.AWS_REGION,
      env.AWS_ACCESS_KEY_ID,
      env.AWS_SECRET_ACCESS_KEY,
      env.S3_BUCKET
    );

    console.log("Uploaded PCAP snapshot to S3:", location);
  }
}
