// No Traffic Pods
console.log("Hello from the No Traffic Pods Script");

try {
    var targets = JSON.parse(vendor.webhook("GET", "http://kubeshark-hub/pods/targeted", "")).targets;
    console.log(JSON.stringify(targets));
} catch(e){
    console.error(e);
}