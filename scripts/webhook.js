// Call a Webhook For Each Health Check

function onItemCaptured(data) {
  if (data.protocol.name === "http" && data.request.path === "/health")
    vendor.webhook("POST", env.WEBHOOK_URL, data);
}
