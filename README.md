# Kubeshark Public Scripts Repository

This repository contains scripts that can be used in Kubeshark's scripting system.

Kubeshark supports custom-logic scripts that use [hooks](https://docs.kubeshark.co/en/automation_hooks) and [helpers](https://docs.kubeshark.co/en/automation_helpers) to trigger actions, supported by the available integrations, and based on programmatic decisions and/or on a schedule.

**Kubeshark** scripting language is based on [Javascript ES5](https://262.ecma-international.org/5.1/).

The following script example calculates the number of packets and overall traffic processed per minute using an L4 network hook ([`onPacketCaptured`](/en/automation_hooks#onpacketcapturedinfo-object)), some helpers and a job.

```js
var packetCount = 0;
var totalKB = 0;

function onPacketCaptured(info) {
  packetCount++;
  totalKB += info.length / 1000;
}

function logPacketCountTotalBytes() {
  console.log("Captured packet count per minute:", packetCount);
  packetCount = 0;
  console.log("Total KB captured per minute:", totalKB);
  totalKB = 0;
}

jobs.schedule("log-packet-count-total-bytes", "0 */1 * * * *", logPacketCountTotalBytes);
```