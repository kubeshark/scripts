## Traffic Threshold Demo

This script demonstrates how measure egress and ingress pod traffic and present both a short and a long report.

#### Prerequisites:

1. Ensure you have the latest Kubeshark Helm chart release installed.

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