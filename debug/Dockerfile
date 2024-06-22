# Use a lightweight base image with package manager capabilities
FROM alpine:latest

# Install tshark and other necessary packages
RUN apk update && apk add --no-cache tshark

# Set the entrypoint to keep the container running
ENTRYPOINT ["/bin/sh", "-c", "while true; do sleep 30; done;"]

# docker buildx create --use
# docker buildx inspect --bootstrap
# docker buildx build --platform linux/amd64,linux/arm64 -t alongir/debug-tshark:latest . --push