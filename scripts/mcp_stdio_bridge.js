#!/usr/bin/env node
const { spawn } = require('child_process');
const net = require('net');

// Configuration
const MCP_GATEWAY_URL = process.env.MCP_GATEWAY_URL || 'http://127.0.0.1:4444';
const MCP_JWT_TOKEN = process.env.MCP_JWT_TOKEN;

// Ensure token is provided
if (!MCP_JWT_TOKEN) {
  console.error('Error: MCP_JWT_TOKEN environment variable is not set.');
  process.exit(1);
}

// Import fetch - try native first, fallback to node-fetch
let fetch;
try {
  // Try native fetch first (Node.js 18+)
  fetch = globalThis.fetch;
  if (!fetch) {
    // Fallback to node-fetch
    const nodeFetch = require('node-fetch');
    fetch = nodeFetch;
  }
} catch (error) {
  console.error('Error: Could not load fetch. Please install node-fetch: npm install node-fetch@2');
  process.exit(1);
}

// Create a stdio bridge to MCP Gateway
class MCPStdioBridge {
  constructor() {
    this.connected = false;
    this.init();
  }

  init() {
    console.error('MCP Stdio Bridge starting...');
    console.error('Gateway URL:', MCP_GATEWAY_URL);

    // Buffer for handling partial messages
    this.messageBuffer = '';

    // Listen for messages from stdin
    process.stdin.on('data', (data) => {
      this.handleRawData(data.toString());
    });

    // Handle process termination
    process.on('SIGINT', () => {
      console.error('Shutting down MCP Stdio Bridge...');
      process.exit(0);
    });
  }

  handleRawData(rawData) {
    this.messageBuffer += rawData;

    // Split on newlines to handle multiple JSON messages
    const lines = this.messageBuffer.split('\n');

    // Keep the last incomplete line in the buffer
    this.messageBuffer = lines.pop() || '';

    // Process each complete line
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed) {
        this.handleMessage(trimmed);
      }
    }
  }

  handleMessage(message) {
    try {
      const parsed = JSON.parse(message);
      console.error('Received message:', JSON.stringify(parsed, null, 2));

      // Handle 'initialize' method directly
      if (parsed.method === 'initialize') {
        this.sendMessage({
          jsonrpc: '2.0',
          id: parsed.id,
          result: {
            protocolVersion: parsed.params?.protocolVersion || '2025-06-18',
            capabilities: {
              tools: {
                listChanged: true
              },
              resources: {
                subscribe: true,
                listChanged: true
              },
              prompts: {
                listChanged: true
              }
            },
            serverInfo: {
              name: 'MCP Stdio Bridge',
              version: '1.0.0'
            }
          }
        });
        return;
      }

      // Forward other messages to MCP Gateway
      this.forwardToGateway(parsed);
    } catch (error) {
      console.error('Error parsing message:', error);
      this.sendMessage({
        jsonrpc: '2.0',
        error: {
          code: -32700,
          message: 'Invalid JSON received'
        },
        id: null
      });
    }
  }

  async forwardToGateway(message) {
    try {
      // Handle different MCP methods
      if (message.method === 'prompts/list') {
        // Return empty prompts list for now
        this.sendMessage({
          jsonrpc: '2.0',
          id: message.id,
          result: {
            prompts: []
          }
        });
        return;
      }

      if (message.method === 'tools/list') {
        // Get tools from gateway
        const response = await fetch(`${MCP_GATEWAY_URL}/tools`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${MCP_JWT_TOKEN}`
          }
        });

        if (!response.ok) {
          throw new Error(`Gateway responded with ${response.status}: ${await response.text()}`);
        }

        const tools = await response.json();

        // Convert to MCP format
        const mcpTools = tools.map(tool => ({
          name: tool.name,
          description: tool.description || '',
          inputSchema: tool.inputSchema || {
            type: 'object',
            properties: {},
            required: []
          }
        }));

        this.sendMessage({
          jsonrpc: '2.0',
          id: message.id,
          result: {
            tools: mcpTools
          }
        });
        return;
      }

      if (message.method === 'tools/call') {
        // Execute a tool
        const toolName = message.params.name;
        const toolArgs = message.params.arguments || {};

        const response = await fetch(`${MCP_GATEWAY_URL}/tools/${toolName}/execute`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${MCP_JWT_TOKEN}`
          },
          body: JSON.stringify(toolArgs)
        });

        if (!response.ok) {
          throw new Error(`Gateway responded with ${response.status}: ${await response.text()}`);
        }

        const result = await response.json();

        this.sendMessage({
          jsonrpc: '2.0',
          id: message.id,
          result: {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2)
              }
            ]
          }
        });
        return;
      }

      // For other methods, return method not found
      this.sendMessage({
        jsonrpc: '2.0',
        id: message.id,
        error: {
          code: -32601,
          message: `Method not found: ${message.method}`
        }
      });

    } catch (error) {
      console.error('Error forwarding to gateway:', error);
      this.sendMessage({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: `Internal bridge error: ${error.message}`
        },
        id: message.id || null
      });
    }
  }

  sendMessage(message) {
    // Use simple JSON output for MCP stdio
    console.log(JSON.stringify(message));
  }
}

// Start the bridge
new MCPStdioBridge();
