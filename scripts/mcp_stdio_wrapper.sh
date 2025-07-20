#!/bin/bash

# Load environment variables from .env file
if [ -f "/home/sprime01/Projects/MCPContextForge/.env" ]; then
    export MCPGATEWAY_BEARER_TOKEN=$(grep "^MCPGATEWAY_BEARER_TOKEN=" /home/sprime01/Projects/MCPContextForge/.env | cut -d"=" -f2)
fi

# Set the MCP_JWT_TOKEN from the bearer token
export MCP_JWT_TOKEN="${MCPGATEWAY_BEARER_TOKEN}"

# Set the MCP Gateway URL
export MCP_GATEWAY_URL="http://127.0.0.1:4444"

# Debug: Print environment variables (comment out in production)
# echo "MCP_JWT_TOKEN set: ${MCP_JWT_TOKEN:0:20}..." >&2
# echo "MCP_GATEWAY_URL: ${MCP_GATEWAY_URL}" >&2

# Execute the node script
exec node /home/sprime01/Projects/MCPContextForge/scripts/mcp_stdio_bridge.js "$@"
