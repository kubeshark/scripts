// Report To a Slack Channel If Response Status Code is 500

function onItemCaptured(data) {
  // Check if it's an HTTP request and the response status is 500
  if (data.protocol.name === "http" && data.response.status === 500) {
    var files = {};

    // Get the path of the PCAP file that this stream belongs to
    var pcapPath = pcap.path(data.stream);
    files[data.stream + ".pcap"] = pcapPath;

    // Dump the `data` argument into a temporary JSON file
    var dataPath = file.temp("data", "", "json");
    file.write(dataPath, JSON.stringify(data, null, 2));
    files["data.json"] = dataPath;

    // Send a detailed Slack message with 2 attached files
    vendor.slackBot(
      SLACK_AUTH_TOKEN,
      SLACK_CHANNEL_ID,
      "Server-side Error in Kubernetes Cluster",                                    // Pretext
      "An HTTP request resulted with " + data.response.status + " status code:",    // Text
      "#ff0000",                                                                    // Color
      {
        "Service": data.dst.name,
        "Namespace": data.namespace,
        "Node": data.node.name,
        "HTTP method": data.request.method,
        "HTTP path": data.request.path
      },
      files
    );

    // Delete the temporary file
    file.delete(dataPath);
  }
}
