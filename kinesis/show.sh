#!/bin/bash

# Check if the stream name is passed as an argument
if [[ -z "$1" ]]; then
  echo "Usage: $0 <stream-name>"
  exit 1
fi

# Set variables based on command-line arguments
STREAM_NAME="$1"
MAX_EMPTY_ITERATIONS=5  # Maximum number of iterations to wait for data in each shard before moving on

# Describe the stream to get all shard IDs
echo "Fetching shard IDs for stream: $STREAM_NAME..."
SHARD_IDS=$(aws kinesis describe-stream --stream-name "$STREAM_NAME" --query 'StreamDescription.Shards[].ShardId' --output text)

if [[ -z "$SHARD_IDS" ]]; then
  echo "Error: Unable to retrieve shard IDs. Please check the stream name and your permissions."
  exit 1
fi

echo "Shard IDs fetched: $SHARD_IDS"

# Infinite loop to keep reading records from the stream until interrupted by the user (^C)
while true; do
  # Loop through each shard ID and start reading records from the LATEST position
  for SHARD_ID in $SHARD_IDS; do
    echo "Processing Shard ID: $SHARD_ID"

    # Get the shard iterator for the current shard using the LATEST type (newest records only)
    echo "Getting shard iterator for Shard ID: $SHARD_ID with LATEST iterator type..."
    shard_iterator=$(aws kinesis get-shard-iterator \
      --stream-name "$STREAM_NAME" \
      --shard-id "$SHARD_ID" \
      --shard-iterator-type "LATEST" \
      --query 'ShardIterator' \
      --output text)

    if [[ -z "$shard_iterator" ]]; then
      echo "Error: Unable to retrieve shard iterator for Shard ID: $SHARD_ID."
      continue  # Skip this shard and move to the next
    fi

    echo "Shard iterator retrieved: $shard_iterator"

    # Keep track of the number of empty responses
    empty_iterations=0

    # Continuously fetch records for this shard
    while true; do
      response=$(aws kinesis get-records \
        --shard-iterator "$shard_iterator" \
        --limit 10)

      if [[ $? -ne 0 ]]; then
        echo "Error fetching records from Kinesis shard: $SHARD_ID. Retrying..."
        sleep 2
        continue
      fi

      # Check if there are any records in the response
      record_count=$(echo "$response" | jq '.Records | length')
      if [[ "$record_count" -eq 0 ]]; then
        echo -n "."
        empty_iterations=$((empty_iterations+1))
        sleep 2  # Sleep to avoid throttling when no new records are found
      else
        echo "$record_count records fetched from Shard ID: $SHARD_ID:"
        empty_iterations=0  # Reset empty iteration counter since we received data

        # Decode and display the records
        echo "$response" | jq -r '.Records[].Data' | while IFS= read -r line; do
          decoded_data=$(echo "$line" | base64 --decode)
          echo "Record data: $decoded_data"
        done
      fi

      # Extract the next shard iterator
      shard_iterator=$(echo "$response" | jq -r '.NextShardIterator')
      if [[ -z "$shard_iterator" ]]; then
        echo "No more shard iterator for Shard ID: $SHARD_ID. Moving to next shard..."
        break
      fi

      sleep 2  # Sleep to avoid throttling
    done
  done
done

echo "Stream reading completed."
