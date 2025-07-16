# VS Code MCP Gateway Integration Setup Guide

This guide explains how to set up VS Code to work with your MCP Gateway using the stdio bridge approach.

## Prerequisites

- VS Code installed
- Node.js installed
- MCP Gateway project set up and running
- Environment variables configured in `.env` file

## Setup Steps

### 1. Install MCP Extension for VS Code

1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X)
3. Search for "Model Context Protocol"
4. Install the official MCP extension

### 2. Run the Setup Command

In your MCP Gateway project directory, run:

```bash
make setup-vscode
```

This command will:
- Create the stdio bridge script (`scripts/mcp_stdio_bridge.js`)
- Install required Node.js dependencies
- Display the VS Code configuration

### 3. Configure VS Code Settings

Add the following configuration to your VS Code `settings.json` file:

```json
{
  "mcp.servers": {
    "mcp-gateway": {
      "command": "node",
      "args": ["/home/sprime01/Projects/MCPContextForge/scripts/mcp_stdio_bridge.js"],
      "env": {
        "MCP_GATEWAY_URL": "http://127.0.0.1:4444",
        "MCP_ADMIN_USERNAME": "sprime01",
        "MCP_ADMIN_PASSWORD": "mcp1870171sP#"
      }
    }
  }
}
```

To edit your settings.json:
1. Open VS Code
2. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
3. Type "Preferences: Open User Settings (JSON)"
4. Add the configuration above to the JSON file

### 4. Restart VS Code

After adding the configuration, restart VS Code to activate the MCP integration.

### 5. Verify Setup

You can test the integration by running:

```bash
make test-vscode
```

This will verify that all components are properly configured.

## Available Make Commands

- `make setup-vscode` - Set up VS Code integration
- `make test-vscode` - Test the VS Code integration setup
- `make mcp-register-tool` - Register a new MCP tool (interactive)
- `make mcp-register-tool-cli` - Register a tool via command line
- `make mcp-list-tools` - List all registered tools
- `make mcp-auth` - Authenticate with MCP Gateway admin

## How It Works

The stdio bridge (`mcp_stdio_bridge.js`) acts as a translator between VS Code's MCP client and your MCP Gateway server. It:

1. Receives MCP protocol messages from VS Code via stdin
2. Forwards them to your MCP Gateway HTTP API
3. Returns responses back to VS Code via stdout

## Troubleshooting

### Common Issues

1. **Port mismatch**: Ensure `MCP_GATEWAY_URL` matches your running server
2. **Authentication**: Verify your admin credentials are correct
3. **Node.js dependencies**: Run `make setup-vscode` again to reinstall dependencies
4. **VS Code extension**: Make sure the MCP extension is installed and enabled

### Testing the Bridge Manually

You can test the stdio bridge manually by running:

```bash
./scripts/mcp_stdio_bridge.js
```

This will start the bridge in interactive mode where you can send test messages.

## Using the Integration

Once set up, your MCP Gateway tools should be available in VS Code Copilot. You can:

1. Ask Copilot to use your registered tools
2. Access external MCP servers through the gateway
3. Combine multiple MCP tools in your workflows

## Security Notes

- The stdio bridge uses basic authentication with your admin credentials
- Credentials are passed via environment variables
- Only localhost connections are used by default
- Consider using JWT tokens for production setups

## Next Steps

1. Register external MCP servers using `make mcp-register-tool`
2. Test the integration with VS Code Copilot
3. Explore the available tools and capabilities
4. Consider setting up additional MCP servers for your workflow
