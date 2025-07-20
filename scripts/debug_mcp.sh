#!/bin/bash

# Simple debug script to see what Gemini is sending
echo "DEBUG: Starting MCP debug bridge" >&2
echo "DEBUG: Environment variables:" >&2
env | grep -E "(MCP|WSL)" >&2

# Read input and log it
while IFS= read -r line; do
    echo "DEBUG: Received line: $line" >&2
    # For now, just send a basic error response
    echo '{"jsonrpc":"2.0","error":{"code":-32601,"message":"Method not found"},"id":null}'
done
