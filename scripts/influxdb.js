// Aggregate the HTTP Status Codes and Push Them to InfluxDB Every Minute

var statusCodes = {};

function onItemCaptured(data) {
  if (data.protocol.name !== "http") return;

  if (statusCodes.hasOwnProperty(data.response.status)) {
    statusCodes[data.response.status]++;
  } else {
    statusCodes[data.response.status] = 1;
  }
}

function pushStatusCodesToInfluxDB() {
  console.log("Status Codes:", JSON.stringify(statusCodes));

  vendor.influxdb(
    env.INFLUXDB_URL,
    env.INFLUXDB_TOKEN,
    env.INFLUXDB_ORGANIZATION,
    env.INFLUXDB_BUCKET,
    "Status Codes",               // Measurement
    statusCodes                   // Payload
  );

  statusCodes = {};
}

jobs.schedule("push-status-codes-to-influxdb", "0 */1 * * * *", pushStatusCodesToInfluxDB);
