// Log Total Captured Packet and KB Every Minute

var packetCount = 0;
var totalBytes = 0;

function onItemCaptured(data) {
  console.log("Captured packet count:", packetCount)
  console.log("Total bytes processed:", totalBytes)
}

function onPacketCaptured(info) {
  packetCount++
  totalBytes += info.length
}
