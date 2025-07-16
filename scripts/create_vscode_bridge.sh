#!/bin/bash
# Script to create VS Code MCP stdio bridge

set -e

# Load environment variables
if [ -f .env ]; then
    export $(grep -E '^(MCP_GATEWAY_URL|MCP_ADMIN_USERNAME|MCP_ADMIN_PASSWORD)=' .env | xargs)
fi

# Default values
MCP_GATEWAY_URL=${MCP_GATEWAY_URL:-"http://127.0.0.1:4444"}
MCP_ADMIN_USERNAME=${MCP_ADMIN_USERNAME:-"admin"}
MCP_ADMIN_PASSWORD=${MCP_ADMIN_PASSWORD:-"password"}

echo "Creating MCP stdio bridge..."

# Create the Node.js bridge script
cat > scripts/mcp_stdio_bridge.js << 'EOF'
#!/usr/bin/env node
const { spawn } = require('child_process');
const net = require('net');

// Configuration
const MCP_GATEWAY_URL = process.env.MCP_GATEWAY_URL || 'http://127.0.0.1:4444';
const MCP_ADMIN_USERNAME = process.env.MCP_ADMIN_USERNAME || 'admin';
const MCP_ADMIN_PASSWORD = process.env.MCP_ADMIN_PASSWORD || 'password';

// Create a stdio bridge to MCP Gateway
class MCPStdioBridge {
  constructor() {
    this.connected = false;
    this.init();
  }

  init() {
    console.error('MCP Stdio Bridge starting...');
    console.error('Gateway URL:', MCP_GATEWAY_URL);
    
    // Listen for messages from stdin
    process.stdin.on('data', (data) => {
      this.handleMessage(data.toString().trim());
    });

    // Handle process termination
    process.on('SIGINT', () => {
      console.error('Shutting down MCP Stdio Bridge...');
      process.exit(0);
    });

    // Send initialization message
    this.sendMessage({
      jsonrpc: '2.0',
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {
          sampling: {},
          tools: {}
        },
        clientInfo: {
          name: 'vscode-copilot',
          version: '1.0.0'
        }
      },
      id: 1
    });
  }

  handleMessage(message) {
    try {
      const parsed = JSON.parse(message);
      console.error('Received message:', JSON.stringify(parsed, null, 2));
      
      // Forward to MCP Gateway
      this.forwardToGateway(parsed);
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  }

  forwardToGateway(message) {
    const fetch = require('node-fetch');
    const auth = Buffer.from(`${MCP_ADMIN_USERNAME}:${MCP_ADMIN_PASSWORD}`).toString('base64');
    
    fetch(`${MCP_GATEWAY_URL}/api/v1/mcp/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`
      },
      body: JSON.stringify(message)
    })
    .then(response => response.json())
    .then(data => {
      this.sendMessage(data);
    })
    .catch(error => {
      console.error('Error forwarding to gateway:', error);
      this.sendMessage({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'Internal error'
        },
        id: message.id
      });
    });
  }

  sendMessage(message) {
    console.log(JSON.stringify(message));
  }
}

// Start the bridge
new MCPStdioBridge();
EOF

chmod +x scripts/mcp_stdio_bridge.js
echo "✅ Stdio bridge script created"

# Install Node.js dependencies
echo "Installing node dependencies..."
cd scripts
npm init -y >/dev/null 2>&1 || true
npm install node-fetch >/dev/null 2>&1 || true
cd ..
echo "✅ Dependencies installed"

echo ""
echo "🎯 VS Code Integration Setup Complete!"
echo ""
echo "📋 Next steps:"
echo "1. Open VS Code"
echo "2. Install the 'Model Context Protocol' extension"
echo "3. Add this to your VS Code settings.json:"
echo ""
echo "{"
echo "  \"mcp.servers\": {"
echo "    \"mcp-gateway\": {"
echo "      \"command\": \"node\","
echo "      \"args\": [\"$(pwd)/scripts/mcp_stdio_bridge.js\"],"
echo "      \"env\": {"
echo "        \"MCP_GATEWAY_URL\": \"$MCP_GATEWAY_URL\","
echo "        \"MCP_ADMIN_USERNAME\": \"$MCP_ADMIN_USERNAME\","
echo "        \"MCP_ADMIN_PASSWORD\": \"$MCP_ADMIN_PASSWORD\""
echo "      }"
echo "    }"
echo "  }"
echo "}"
echo ""
echo "4. Restart VS Code"
echo "5. The MCP Gateway tools should now be available in Copilot!"
echo ""
echo "🔧 To test the bridge manually:"
echo "   ./scripts/mcp_stdio_bridge.js"
