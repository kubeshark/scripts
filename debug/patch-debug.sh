#!/bin/bash

# Function to display usage
usage() {
  echo "Usage: $0"
  exit 1
}

# Set the DaemonSet name
DAEMONSET_NAME="kubeshark-worker-daemon-set"

# Create the JSON patch file
PATCH_CONTENT=$(cat <<EOF
[
  {
    "op": "add",
    "path": "/spec/template/spec/containers/-",
    "value": {
      "name": "debug",
      "image": "docker.io/alongir/debug-tshark:latest",
      "imagePullPolicy": "Always",
      "command": ["/bin/sh", "-c", "while true; do sleep 30; done;"],
      "resources": {
        "limits": {
          "cpu": "2750m",
          "memory": "2Gi"
        },
        "requests": {
          "cpu": "50m",
          "memory": "50Mi"
        }
      },
      "securityContext": {
        "capabilities": {
          "add": [
            "SYS_ADMIN",
            "SYS_PTRACE",
            "SYS_RESOURCE",
            "IPC_LOCK",
            "NET_RAW",
            "NET_ADMIN"
          ],
          "drop": [
            "ALL"
          ]
        }
      },
      "volumeMounts": [
        {
          "mountPath": "/hostproc",
          "name": "proc",
          "readOnly": true
        },
        {
          "mountPath": "/sys",
          "name": "sys",
          "readOnly": true
        },
        {
          "mountPath": "/app/data",
          "name": "data"
        }
      ]
    }
  }
]
EOF
)

# Apply the patch to the DaemonSet
kubectl patch daemonset "$DAEMONSET_NAME" --type='json' -p "$PATCH_CONTENT"

# Check if the patch was successful
if [ $? -ne 0 ]; then
  echo "Failed to patch DaemonSet. Please check the error messages above."
  exit 1
fi

echo "Patched DaemonSet $DAEMONSET_NAME with debug container."
