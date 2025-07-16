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
