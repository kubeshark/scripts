#!/bin/bash

# Function to display usage
usage() {
  echo "Usage: $0"
  exit 1
}

# Set the DaemonSet name
DAEMONSET_NAME="kubeshark-worker-daemon-set"

# Check if jq is installed
if ! command -v jq &> /dev/null; then
  echo "jq is not installed. Please install jq to run this script."
  exit 1
fi

# Fetch the current DaemonSet configuration
DAEMONSET_JSON=$(kubectl get daemonset "$DAEMONSET_NAME" -o json)

# Check if the fetch was successful
if [ $? -ne 0 ]; then
  echo "Failed to fetch DaemonSet configuration. Please check if the DaemonSet name is correct."
  exit 1
fi

# Find the index of the debug container
DEBUG_CONTAINER_INDEX=$(echo "$DAEMONSET_JSON" | jq -r '
  .spec.template.spec.containers | to_entries[] | select(.value.name == "debug") | .key
')

# Check if the debug container was found
if [ -z "$DEBUG_CONTAINER_INDEX" ]; then
  echo "Debug container not found in DaemonSet $DAEMONSET_NAME."
  exit 1
fi

# Create the JSON patch file to remove the debug container
PATCH_CONTENT=$(cat <<EOF
[
  {
    "op": "remove",
    "path": "/spec/template/spec/containers/$DEBUG_CONTAINER_INDEX"
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

echo "Unpatched DaemonSet $DAEMONSET_NAME, removing debug container."
