// Aggregate the HTTP Status Codes and Push Them to Elastic Cloud Every Minute

var statusCodes = {};

function onItemCaptured(data) {
  if (data.protocol.name !== "http") return;

  if (statusCodes.hasOwnProperty(data.response.status)) {
    statusCodes[data.response.status]++;
  } else {
    statusCodes[data.response.status] = 1;
  }
}

function pushStatusCodesToElasticsearch() {
  console.log("Status Codes:", JSON.stringify(statusCodes));

  vendor.elastic(
    "",                     // URL is ignored for Elastic Cloud
    env.ELASTIC_INDEX,
    statusCodes,            // Payload
    "",                     // Username is ignored for Elastic Cloud
    "",                     // Password is ignored for Elastic Cloud
    env.ELASTIC_CLOUD_ID,
    env.ELASTIC_API_KEY
  );

  statusCodes = {};
}

jobs.schedule("push-status-codes-to-elastic", "0 */1 * * * *", pushStatusCodesToElasticsearch);
