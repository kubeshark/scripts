# ZAP & Kubeshark Integration: East-West Vulnerability Scanning

**About ZAP**: [ZAP](https://www.zaproxy.org/) (Zed Attack Proxy) is an open-source web application security scanner developed and maintained by OWASP (Open Web Application Security Project). It is widely used by developers, security professionals, and SREs to identify vulnerabilities in web applications and APIs. ZAP’s main benefits include the ability to automatically detect common security flaws like SQL injection, XSS, and insecure configurations. Its rich UI facilitates easy vulnerability management, and its support for both manual and automated security testing makes it a versatile tool for securing web applications.

Security professionals and SREs managing Kubernetes clusters can greatly benefit from integrating **Kubeshark** with ZAP, which provides significant advantages in maintaining robust security. **Kubeshark** enables deep inspection of inter-cluster HTTP API traffic, capturing every communication between services. ZAP is then used to identify vulnerabilities in this captured traffic.

By leveraging **Kubeshark** for traffic capture and ZAP’s scanning capabilities, security teams can automatically detect vulnerabilities such as **SQL Injection**, which can allow manipulation of database queries, and **Cross-Site Scripting (XSS)**, which enables attackers to inject harmful scripts into web pages. ZAP also flags **Cross-Site Request Forgery (CSRF)** risks, insecure cookies that lack `HttpOnly` or `Secure` attributes, and misconfigured **Content Security Policies (CSP)** and **Strict-Transport-Security (HSTS)** headers. Additionally, ZAP identifies **insecure HTTP methods**, like `PUT` or `DELETE`, and **information disclosure** vulnerabilities, where sensitive data, such as API keys or server error messages, might be exposed.

This proactive approach helps mitigate risks before they lead to breaches, providing real-time insights into potential weaknesses. ZAP’s rich UI simplifies vulnerability management, enabling quick identification and remediation of critical issues—essential for maintaining secure and reliable Kubernetes environments.

> The following screenshot is from running [this script](https://github.com/kubeshark/scripts/blob/master/zap-proxy/zap.js) and using ZAP on a local desktop

<img width="1661" alt="image" src="https://github.com/user-attachments/assets/a1f260f6-d5b3-47ef-b57a-f63764e93ff4">

## Recipe

This process is straightforward: **Kubeshark** captures inter-cluster HTTP API calls and, using its [scripting mechanism](https://docs.kubeshark.co/en/automation_scripting), exports them in [HAR](http://www.softwareishard.com/blog/har-12-spec/) format to ZAP. These HAR files are then periodically uploaded to ZAP using its `importHAR` feature, where ZAP scans the traffic and generates alerts based on its findings.

### The Script (zap.js)

The actual script can be found [here](https://github.com/kubeshark/scripts/blob/master/zap-proxy/zap.js).

#### Captured API Hook

**Kubeshark** calls a hook named `onItemCaptured` every time a new API call is captured and processed. It delivers `data`, which is the complete metadat information Kuebshark has on the captured API call. `data` defenition can be read in more details [here](https://github.com/kubeshark/api/blob/87c881e7697f2a2dc57a4772a3ceb1d2d2b446c7/api.go#L279). Easier to simply open the Metadata tab for each API call:

> TODO: Show the Metadata tab

In the script the `onItemCaptured` pushes the `data` for each HTTP API call to an object array named `dataArr`.

```js
function onItemCaptured(data) {
    if (data.Protocol && data.Protocol.Name == "http")  // Ensure Protocol and Protocol.Name exist
        dataArr.push(data);
}
```

#### HAR Export Job

The `jobs.schedule` helper, schedule a function to run based on a cron schedule. `"*/60 * * * * *"` => In this case every 60 seconds.
The `zapExportJob` wakes up every 60 seconds, convert  `dataArr` into an HAR file, and uses [fileUpload](https://www.zaproxy.org/docs/api/#coreotherfileupload) and [importHar](https://www.zaproxy.org/docs/api/#eximactionimporthar) APIs from ZAP to psush the HAR file to ZAP and cause it to be examined.

```js
jobs.schedule("zap-export", "*/60 * * * * *", zapExportJob);  

function zapExportJob() {
    try{
        ...
        var har = wrapper.buildHAR(dataArr);
        ...
        var path = vendor.webhookForm("POST", env.ZAP_SERVER_URL + "/OTHER/core/other/fileUpload/", {...});
        var zap_r = JSON.parse(vendor.webhook("GET",  env.ZAP_SERVER_URL + "/JSON/exim/action/importHar/?apikey=" ... );
    } ...
}
```

### Running ZAP Proxy on a Desktop

While there are many options to run ZAP, this document describes how to run ZAP locally on a desktop.

#### Prerequisites

- Download and install ZAP proxy on your desktop. Installation packages can be found here: [https://www.zaproxy.org/download/](https://www.zaproxy.org/download/).
- Ensure the API and file transfer options are enabled.
- Set or disable the use of an API key. If you enable the API key, make sure to note it for later use.
- Ensure the localhost address is whitelisted.
- Identify and note the main proxy port.

<img width="821" alt="image" src="https://github.com/user-attachments/assets/7303d8f5-178e-4091-a650-00d39cfec5a4">

### Expose Public IP

Use [ngrok](https://ngrok.com/) to expose your ZAP API port so it can be accessed by the cluster:

```shell
ngrok http 8082 --request-header-remove "X-Forwarded-For,X-Forwarded-Host,X-Forwarded-Proto" --request-header-add "Host: 127.0.0.1:8082"
```

> The above command assumes the ZAP proxy API port is 8082.

<img width="481" alt="image" src="https://github.com/user-attachments/assets/96183ddd-228d-4cfb-a7ef-9ffdc6abb902">

Note the public API endpoint.

> If ZAP is already installed somewhere else, note its public URL.

### Kubeshark Configuration

Use the following configuration for **Kubeshark**:

```yaml
tap:
  scripting:
    source: /path/to/script
    active:
    - zap                     # for the script to start automatically. otherwise you'd need to activate it.
    env:
      ZAP_SERVER: <public-api-endpoint>
      ZAP_APIKEY: <API key>   # only if you set one
license: <your-enterprise-license>
```

### Running Kubeshark with the CLI

To use with the CLI, simply run:

```shell
kubeshark clean; kubeshark tap
```

You should see the script's log in the console output.

<img width="1328" alt="image" src="https://github.com/user-attachments/assets/16778462-cc29-49f6-92ae-fae1dccb293c">


### Running Kubeshark with Helm

To use with Helm, apply the `config.yaml` as a Helm values file:

```shell
helm install kubeshark kubeshark/kubeshark -f ~/.kubeshark/config.yaml
```

Next, run the CLI to sync the script to the `kubeshark-config-map` by executing the following command:

```shell
kubeshark scripts & kubeshark console
```

Adding the `kubeshark console` command is optional and will display the `console` log output.

This command watches the scripts folder and synchronizes any changes to the `kubeshark-config-map`.

## In Summary

**Kubeshark** and ZAP can work together to scan API calls of interest, detecting and alerting on threats and vulnerabilities. This document demonstrates **Kubeshark**’s scripting capabilities and presents a potential use case for this integration.
