#!/bin/bash

# Function to display usage
usage() {
  echo "Usage: $0 -o output_directory"
  exit 1
}

# Function to clean up background processes
cleanup() {
  echo "Cleaning up..."
  pkill -P $$
#   bash -c "unpatch-debug.sh"
  wait
  exit 0
}

# Trap SIGINT (Ctrl+C)
trap cleanup SIGINT

# Parse command-line arguments
while getopts "o:" opt; do
  case ${opt} in
    o )
      OUTPUT_DIR=$OPTARG
      ;;
    \? )
      usage
      ;;
  esac
done

# Check if the output directory is provided
if [ -z "$OUTPUT_DIR" ]; then
  usage
fi

# Ensure the output directory exists
mkdir -p $OUTPUT_DIR

# Function to run tshark command on a pod
run_tshark() {
  local pod_name=$1
  local node_name=$2
#   echo "run_tshark received pod_name: $pod_name, node_name: $node_name"
  local cmd="kubectl exec $pod_name -c debug -- tshark -r /app/data/$node_name/ksdump.pcap -w /app/data/$node_name/ksdump-out.pcap"
  echo "Running command: $cmd"
  eval $cmd
}

# Function to copy the pcap file from the pod
copy_pcap() {
  local output_dir=$1
  local pod_name=$2
  local namespace=$3
  local node_name=$4

#   echo "copy_pcap received: $@"
#   echo "copy_pcap received pod_name: $pod_name, namespace: $namespace, node_name: $node_name, output_dir: $output_dir"
  while true; do
    sleep 20
    local cmd2="kubectl exec $pod_name -c debug -- touch /app/data/$node_name/ksdump-out.pcap"
    echo "Running command: $cmd2"
    eval $cmd2
    local cmd="kubectl cp $namespace/$pod_name:/app/data/$node_name/ksdump-out.pcap $output_dir/ksdump-$node_name.pcap -c debug"
    echo "Running command: $cmd"
    eval $cmd
  done
}

export -f run_tshark
export -f copy_pcap

# Get the DaemonSet
ds="kubeshark-worker-daemon-set"

# Get the label selector for the DaemonSet
labels=$(kubectl get daemonset $ds -o jsonpath='{.spec.selector.matchLabels}')
# Convert the JSON output to a label selector string
selector=$(echo $labels | jq -r 'to_entries | map("\(.key)=\(.value)") | join(",")')
# Get the pods with the matching label selector and their node names
kubectl get pods -l $selector -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.metadata.namespace}{"\t"}{.spec.nodeName}{"\n"}{end}' | \
while read pod_name namespace node_name; do
  echo "$pod_name $node_name"
done | tee /dev/tty | xargs -n 2 -P 0 bash -c 'run_tshark "$1" "$2"' _ &

# Run the copy command in parallel every 20 seconds
kubectl get pods -l $selector -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.metadata.namespace}{"\t"}{.spec.nodeName}{"\n"}{end}' | \
while read pod_name namespace node_name; do
  echo "$pod_name $namespace $node_name"
done | xargs -n 3 -P 0 bash -c 'copy_pcap "$1" "$2" "$3" "$4"' _ "$OUTPUT_DIR"

# Wait for background processes to complete
wait
