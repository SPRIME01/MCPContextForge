#!/bin/bash
# Wrapper script for Roo Cline MCP integration
# This loads environment variables and starts the Node.js bridge

# Load environment variables from the .env file
if [ -f "/home/sprime01/Projects/MCPContextForge/.env" ]; then
    export $(grep -E '^(MCP_JWT_TOKEN|MCPGATEWAY_BEARER_TOKEN)=' /home/sprime01/Projects/MCPContextForge/.env | xargs)
fi

# If MCP_JWT_TOKEN is not set, try using MCPGATEWAY_BEARER_TOKEN
if [ -z "$MCP_JWT_TOKEN" ] && [ -n "$MCPGATEWAY_BEARER_TOKEN" ]; then
    export MCP_JWT_TOKEN="$MCPGATEWAY_BEARER_TOKEN"
fi

# Set the gateway URL
export MCP_GATEWAY_URL="http://127.0.0.1:4444"

# Start the Node.js bridge
exec node /home/sprime01/Projects/MCPContextForge/scripts/fast_mcp_bridge.js
