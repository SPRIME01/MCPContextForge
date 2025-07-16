# MCP Tool Registration Examples

This document provides examples of how to use the new MCP tool registration commands.

## Prerequisites

Before registering tools, you need to:

1. Set up your environment variables for authentication
2. Authenticate with the MCP Gateway

### Environment Variables

Add these to your `.env` file or export them:

```bash
export MCP_ADMIN_USERNAME="your_admin_username"
export MCP_ADMIN_PASSWORD="your_admin_password"
export MCP_GATEWAY_URL="http://127.0.0.1:4444"  # Optional, defaults to this
```

### Authentication

First, authenticate with the MCP Gateway:

```bash
make mcp-auth
```

This creates a `cookie.txt` file that stores your authentication token.

## Registering Tools

### Interactive Mode (Recommended for first-time users)

```bash
make mcp-register-tool
```

This will prompt you for:
- Tool name (unique identifier)
- Server URL (including API key parameters)
- Description (optional)

### Command Line Mode (For automation/scripts)

```bash
make mcp-register-tool-cli NAME=my_external_server URL="https://server.smithery.ai/@upstash/context7-mcp/mcp?api_key=YOUR_API_KEY&profile=some_profile" DESC="My external MCP server"
```

### Direct Script Usage

You can also use the script directly for more advanced options:

```bash
# Interactive mode
./scripts/register_mcp_tool.sh

# Command line mode
./scripts/register_mcp_tool.sh --name my_tool --url "https://..." --description "..."

# Show help
./scripts/register_mcp_tool.sh --help
```

## Examples

### Example 1: Smithery AI Context7 MCP Server

```bash
make mcp-register-tool-cli \
  NAME=context7_mcp \
  URL="https://server.smithery.ai/@upstash/context7-mcp/mcp?api_key=YOUR_API_KEY&profile=production" \
  DESC="Context7 MCP server for enhanced context management"
```

### Example 2: Weather API Tool

```bash
make mcp-register-tool-cli \
  NAME=weather_api \
  URL="https://api.weather.com/mcp/v1?apikey=YOUR_API_KEY" \
  DESC="Weather data API integration"
```

### Example 3: Custom Internal Tool

```bash
make mcp-register-tool-cli \
  NAME=internal_knowledge_base \
  URL="https://internal.company.com/api/mcp?token=YOUR_TOKEN" \
  DESC="Internal company knowledge base MCP interface"
```

## Managing Tools

### List all registered tools

```bash
make mcp-list-tools
```

### Authentication troubleshooting

If you get authentication errors:

1. Check your environment variables:
   ```bash
   echo $MCP_ADMIN_USERNAME
   echo $MCP_ADMIN_PASSWORD
   ```

2. Re-authenticate:
   ```bash
   rm cookie.txt
   make mcp-auth
   ```

3. Verify the MCP Gateway is running:
   ```bash
   curl -I http://127.0.0.1:4444/admin/
   ```

## Tips

1. **Tool names must be unique** - use descriptive names that won't conflict
2. **Include API keys in the URL** - the URL should be the complete endpoint
3. **Test your URL first** - make sure the MCP server responds before registering
4. **Use quotes around URLs** - especially if they contain special characters or spaces
5. **Keep your cookie.txt secure** - it contains your admin session token

## Troubleshooting

### Common Errors

1. **"No authentication cookie found"**
   - Solution: Run `make mcp-auth` first

2. **"Tool name can only contain letters, numbers, underscores, and hyphens"**
   - Solution: Use only alphanumeric characters, underscores, and hyphens in tool names

3. **"Invalid URL format"**
   - Solution: Ensure URL starts with `http://` or `https://`

4. **"Registration failed"**
   - Check that the MCP Gateway is running
   - Verify your authentication is still valid
   - Ensure the tool name is unique

### Getting Help

For more detailed help with any command:

```bash
./scripts/register_mcp_tool.sh --help
```

Or check the main Makefile help:

```bash
make help
```
