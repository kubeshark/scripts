## Traffic Threshold Demo

This script demonstrates how to measure egress and ingress pod traffic and presents both a short and a long report.

#### Prerequisites:

1. Ensure you have the latest Kubeshark Helm chart release installed (hint: use `helm repo update kubeshark`).
2. Ensure you have the latest Kubeshark CLI (hint: use `brew upgrade kubeshark`).

### Steps

1. Copy the `podtraffic.js` script to a folder and note its path. Use this path in the `config.yaml` configuration.
2. Create a `~/.kubeshark/config.yaml` file based on the following configuration:

```yaml
tap:
  stopped: false
scripting:
  source: /path/to/folder
  active: 
    - podtraffic 
license: <enterprise-license>
```

### Using with the CLI

To use with the CLI, simply run:
```shell
kubeshark clean; kubeshark tap
```

You should see the script's log in the console output.

### Using with Helm

To use with Helm, apply the `config.yaml` as a Helm values file:

```shell
helm install kubeshark kubeshark/kubeshark -f ~/.kubeshark/config.yaml
```

Next, you need to run the CLI to sync the script to the `kubeshark-config-map` by running the following command:

```shell
kubeshark scripts & kubeshark console
```

This command watches the scripts folder and synchronizes any changes to the `kubeshark-config-map`.

## Viewing the reports

The short report is scheduled to print every 10 seconds and the long report every minute. The `console` log will show both the short and long reports.

<img width="837" alt="image" src="https://github.com/user-attachments/assets/41a561da-36e2-4ddf-8b38-c8bde3ef3646">

## Targeting a specific set of pods or namespaces

You can use Kubeshark to target specific namespaces and/or pods of interest by using its backend filters. The backend filters can be changed from the UI or the configuration file:

```yaml
tap:
  regex: catal.*
  namespaces:
  - ks-load
  - sock-shop
  excludeNamespaces:
  - kube-system
```