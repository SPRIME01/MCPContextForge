#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Create debug log file
const debugLog = path.join(__dirname, 'mcp_debug.log');

function log(message) {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${message}\n`;
  fs.appendFileSync(debugLog, logEntry);
}

const MCP_GATEWAY_URL = process.env.MCP_GATEWAY_URL || 'http://127.0.0.1:4444';
const MCP_JWT_TOKEN = process.env.MCP_JWT_TOKEN;

log('Starting MCP Debug Bridge');
log(`Gateway URL: ${MCP_GATEWAY_URL}`);
log(`Token set: ${MCP_JWT_TOKEN ? 'YES' : 'NO'}`);

if (!MCP_JWT_TOKEN) {
  log('ERROR: MCP_JWT_TOKEN not set');
  process.exit(1);
}

// Import fetch
let fetch;
try {
  fetch = globalThis.fetch;
  if (!fetch) {
    const nodeFetch = require('node-fetch');
    fetch = nodeFetch;
  }
} catch (error) {
  log('ERROR: Could not load fetch');
  process.exit(1);
}

// Handle stdin with proper buffering
let messageBuffer = '';

process.stdin.on('data', async (data) => {
  const dataStr = data.toString();
  log(`Raw input: ${dataStr}`);

  messageBuffer += dataStr;

  // Split on newlines to handle multiple JSON messages
  const lines = messageBuffer.split('\n');

  // Keep the last incomplete line in the buffer
  messageBuffer = lines.pop() || '';

  // Process each complete line
  for (const line of lines) {
    const input = line.trim();
    if (!input) continue;

    log(`Processing message: ${input}`);
    await processMessage(input);
  }
});

async function processMessage(input) {
  try {
    const message = JSON.parse(input);
    log(`Parsed message: ${JSON.stringify(message)}`);

    if (message.method === 'initialize') {
      log('Handling initialize');
      const response = {
        jsonrpc: '2.0',
        id: message.id,
        result: {
          protocolVersion: '2025-06-18',
          capabilities: {
            tools: { listChanged: true },
            resources: { subscribe: true, listChanged: true },
            prompts: { listChanged: true }
          },
          serverInfo: {
            name: 'MCP Debug Bridge',
            version: '1.0.0'
          }
        }
      };
      const responseStr = JSON.stringify(response);
      log(`Sending response: ${responseStr}`);
      console.log(responseStr);
    } else if (message.method === 'notifications/initialized') {
      log('Handling initialized notification');
      // No response needed for notifications
      return;
    } else if (message.method === 'tools/list') {
      log('Handling tools/list');
      try {
        const response = await fetch(`${MCP_GATEWAY_URL}/tools`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${MCP_JWT_TOKEN}`
          }
        });

        if (!response.ok) {
          throw new Error(`Gateway responded with ${response.status}`);
        }

        const tools = await response.json();
        log(`Retrieved ${tools.length} tools from gateway`);

        const mcpTools = tools.map(tool => ({
          name: tool.name,
          description: tool.description || '',
          inputSchema: {
            type: 'object',
            properties: {},
            required: []
          }
        }));

        const result = {
          jsonrpc: '2.0',
          id: message.id,
          result: {
            tools: mcpTools
          }
        };
        const responseStr = JSON.stringify(result);
        log(`Sending tools response: ${responseStr.substring(0, 200)}...`);
        console.log(responseStr);
      } catch (error) {
        log(`Tools/list error: ${error.message}`);
        const errorResponse = {
          jsonrpc: '2.0',
          id: message.id,
          error: {
            code: -32603,
            message: `Internal error: ${error.message}`
          }
        };
        console.log(JSON.stringify(errorResponse));
      }
    } else if (message.method === 'prompts/list') {
      log('Handling prompts/list');
      const response = {
        jsonrpc: '2.0',
        id: message.id,
        result: {
          prompts: []
        }
      };
      console.log(JSON.stringify(response));
    } else if (message.method === 'resources/list') {
      log('Handling resources/list');
      const response = {
        jsonrpc: '2.0',
        id: message.id,
        result: {
          resources: []
        }
      };
      console.log(JSON.stringify(response));
    } else {
      log(`Unhandled method: ${message.method}`);
      const response = {
        jsonrpc: '2.0',
        id: message.id,
        error: {
          code: -32601,
          message: 'Method not found'
        }
      };
      const responseStr = JSON.stringify(response);
      log(`Sending error response: ${responseStr}`);
      console.log(responseStr);
    }
  } catch (error) {
    log(`Parse error: ${error.message}`);
    const errorResponse = {
      jsonrpc: '2.0',
      error: {
        code: -32700,
        message: 'Parse error'
      },
      id: null
    };
    console.log(JSON.stringify(errorResponse));
  }
}

// Keep the process alive
process.stdin.setEncoding('utf8');
process.stdin.resume();

// Handle process termination
process.on('SIGINT', () => {
  log('Received SIGINT, exiting');
  process.exit(0);
});

process.on('SIGTERM', () => {
  log('Received SIGTERM, exiting');
  process.exit(0);
});

log('MCP Debug Bridge ready');
