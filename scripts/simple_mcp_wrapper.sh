#!/bin/bash

# Load environment variables
if [ -f "/home/sprime01/Projects/MCPContextForge/.env" ]; then
    export MCPGATEWAY_BEARER_TOKEN=$(grep "^MCPGATEWAY_BEARER_TOKEN=" /home/sprime01/Projects/MCPContextForge/.env | cut -d"=" -f2)
fi

export MCP_JWT_TOKEN="${MCPGATEWAY_BEARER_TOKEN}"
export MCP_GATEWAY_URL="http://127.0.0.1:4444"

# Execute the simple bridge
exec node /home/sprime01/Projects/MCPContextForge/scripts/simple_mcp_bridge.js "$@"
