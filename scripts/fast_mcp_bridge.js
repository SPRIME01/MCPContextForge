#!/usr/bin/env node

const MCP_GATEWAY_URL = process.env.MCP_GATEWAY_URL || 'http://127.0.0.1:4444';
const MCP_JWT_TOKEN = process.env.MCP_JWT_TOKEN;

if (!MCP_JWT_TOKEN) {
  console.error('Error: MCP_JWT_TOKEN environment variable is not set.');
  process.exit(1);
}

// Import fetch with timeout
let fetch;
try {
  fetch = globalThis.fetch;
  if (!fetch) {
    const nodeFetch = require('node-fetch');
    fetch = nodeFetch;
  }
} catch (error) {
  console.error('Error: Could not load fetch. Please install node-fetch: npm install node-fetch@2');
  process.exit(1);
}

// Fetch with timeout
async function fetchWithTimeout(url, options = {}, timeout = 5000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

// Handle stdin with proper buffering
let messageBuffer = '';

process.stdin.on('data', async (data) => {
  messageBuffer += data.toString();

  // Split on newlines to handle multiple JSON messages
  const lines = messageBuffer.split('\n');

  // Keep the last incomplete line in the buffer
  messageBuffer = lines.pop() || '';

  // Process each complete line
  for (const line of lines) {
    const input = line.trim();
    if (!input) continue;

    await processMessage(input);
  }
});

async function processMessage(input) {
  try {
    const message = JSON.parse(input);

    if (message.method === 'initialize') {
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
            name: 'MCP Fast Bridge',
            version: '1.0.0'
          }
        }
      };
      console.log(JSON.stringify(response));
    } else if (message.method === 'notifications/initialized') {
      // No response needed for notifications
      return;
    } else if (message.method === 'prompts/list') {
      const response = {
        jsonrpc: '2.0',
        id: message.id,
        result: {
          prompts: []
        }
      };
      console.log(JSON.stringify(response));
    } else if (message.method === 'resources/list') {
      const response = {
        jsonrpc: '2.0',
        id: message.id,
        result: {
          resources: []
        }
      };
      console.log(JSON.stringify(response));
    } else if (message.method === 'tools/list') {
      // Handle tools list with timeout - use general endpoint to get all 7 tools
      try {
        const response = await fetchWithTimeout(`${MCP_GATEWAY_URL}/tools`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${MCP_JWT_TOKEN}`
          }
        }, 3000); // 3 second timeout

        if (!response.ok) {
          throw new Error(`Gateway responded with ${response.status}`);
        }

        const tools = await response.json();
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
        console.log(JSON.stringify(result));
      } catch (error) {
        // Return empty tools list on error to avoid blocking
        const result = {
          jsonrpc: '2.0',
          id: message.id,
          result: {
            tools: []
          }
        };
        console.log(JSON.stringify(result));
      }
    } else if (message.method === 'tools/call') {
      // Handle tool execution with timeout
      try {
        const toolName = message.params.name;
        const toolArgs = message.params.arguments || {};

        const response = await fetchWithTimeout(`${MCP_GATEWAY_URL}/tools/${encodeURIComponent(toolName)}/execute`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${MCP_JWT_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(toolArgs)
        }, 10000); // 10 second timeout for tool execution

        if (!response.ok) {
          throw new Error(`Gateway responded with ${response.status}`);
        }

        const result = await response.json();

        const toolResponse = {
          jsonrpc: '2.0',
          id: message.id,
          result: {
            content: [
              {
                type: 'text',
                text: typeof result === 'string' ? result : JSON.stringify(result, null, 2)
              }
            ]
          }
        };
        console.log(JSON.stringify(toolResponse));
      } catch (error) {
        const errorResponse = {
          jsonrpc: '2.0',
          id: message.id,
          error: {
            code: -32603,
            message: `Tool execution error: ${error.message}`
          }
        };
        console.log(JSON.stringify(errorResponse));
      }
    } else {
      // Handle other methods
      const response = {
        jsonrpc: '2.0',
        id: message.id,
        error: {
          code: -32601,
          message: 'Method not found'
        }
      };
      console.log(JSON.stringify(response));
    }
  } catch (error) {
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
  process.exit(0);
});

process.on('SIGTERM', () => {
  process.exit(0);
});

// Add a periodic heartbeat to keep the connection alive
setInterval(() => {
  // Just keep the event loop alive
}, 30000);
