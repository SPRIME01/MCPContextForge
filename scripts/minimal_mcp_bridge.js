#!/usr/bin/env node

// Ultra minimal MCP bridge for testing
const responses = {
  initialize: (id) => ({
    jsonrpc: '2.0',
    id: id,
    result: {
      protocolVersion: '2025-06-18',
      capabilities: {
        tools: { listChanged: false },
        resources: { subscribe: false, listChanged: false },
        prompts: { listChanged: false }
      },
      serverInfo: {
        name: 'Minimal MCP Bridge',
        version: '1.0.0'
      }
    }
  }),
  'tools/list': (id) => ({
    jsonrpc: '2.0',
    id: id,
    result: {
      tools: [
        {
          name: 'test-tool',
          description: 'A simple test tool',
          inputSchema: {
            type: 'object',
            properties: {},
            required: []
          }
        }
      ]
    }
  }),
  'prompts/list': (id) => ({
    jsonrpc: '2.0',
    id: id,
    result: { prompts: [] }
  }),
  'resources/list': (id) => ({
    jsonrpc: '2.0',
    id: id,
    result: { resources: [] }
  })
};

process.stdin.on('data', (data) => {
  const lines = data.toString().split('\n');

  for (const line of lines) {
    if (!line.trim()) continue;

    try {
      const msg = JSON.parse(line);

      // Handle notifications (no response)
      if (msg.method === 'notifications/initialized') {
        continue;
      }

      // Handle regular methods
      if (responses[msg.method]) {
        console.log(JSON.stringify(responses[msg.method](msg.id)));
      } else {
        console.log(JSON.stringify({
          jsonrpc: '2.0',
          id: msg.id,
          error: { code: -32601, message: 'Method not found' }
        }));
      }
    } catch (e) {
      console.log(JSON.stringify({
        jsonrpc: '2.0',
        error: { code: -32700, message: 'Parse error' },
        id: null
      }));
    }
  }
});

process.stdin.setEncoding('utf8');
process.stdin.resume();

process.on('SIGINT', () => process.exit(0));
process.on('SIGTERM', () => process.exit(0));
