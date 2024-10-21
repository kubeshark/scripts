## Kinesis Demo

This script demonstrates how to use the Kinesis helper to upload HTTP payloads in HAR format to a Kinesis stream.

#### Prerequisites:

1. Ensure you have the latest Kubeshark Helm chart release installed.

### Steps

1. Copy the `kinesis.js` script to a folder and note its path. Use this path in the `config.yaml` configuration.
2. Create a `~/.kubeshark/config.yaml` file based on the following configuration:

```yaml
tap:
  stopped: false
  docker:
    overrideTag:
      worker: helper-kinesis
scripting:
  source: /path/to/folder
  active: 
    - kinesis 
  env:
    AWS_REGION: <region>
    AWS_ACCESS_KEY_ID: <key>
    AWS_SECRET_ACCESS_KEY: <secret>
    KINESIS_STREAM_NAME: <stream-name>
license: <license>
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
kubeshark scripts
```

This command watches the scripts folder and synchronizes any changes to the `kubeshark-config-map`.

### Viewing the uploaded traffic

This folder includes the `show.sh` utility, which prints out the latest payloads uploaded to the Kinesis stream.