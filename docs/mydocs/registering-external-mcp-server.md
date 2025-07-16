# Registering an External MCP Server with URL-based Authentication

This guide explains how to register an external MCP server that uses an API key as a query parameter for authentication.

## Quick Start (New Method)

We've added idiot-proof make commands to simplify this process:

### 1. Set up authentication

First, set your admin credentials in your environment:

```bash
export MCP_ADMIN_USERNAME="your_admin_username"
export MCP_ADMIN_PASSWORD="your_admin_password"
```

### 2. Authenticate with the MCP Gateway

```bash
make mcp-auth
```

### 3. Register your external MCP server

**Interactive mode (recommended for first-time users):**
```bash
make mcp-register-tool
```

**Command-line mode (for automation):**
```bash
make mcp-register-tool-cli NAME=my_external_server URL="https://server.smithery.ai/@upstash/context7-mcp/mcp?api_key=YOUR_API_KEY&profile=some_profile" DESC="My external MCP server"
```

### 4. Verify registration

```bash
make mcp-list-tools
```

That's it! For more examples and troubleshooting, see [MCP Tool Registration Examples](mcp-tool-registration-examples.md).

---

## Manual Method (Original)

If you prefer to do this manually or need to understand the underlying process:

## The Problem

You have an MCP server URL that looks like this:

```
https://server.smithery.ai/@upstash/context7-mcp/mcp?api_key=YOUR_API_KEY&profile=some_profile
```

When you try to register this as a "Gateway" in the MCP Gateway Admin UI, it fails with an "Unable to connect to gateway" error. This is because the gateway registration process does not directly support API keys in the URL for authentication.

## The Solution

The correct way to register this type of server is as a "Tool". This allows you to specify the full URL, including the API key, and treat it as a REST endpoint.

## Steps to Register the Server as a Tool

1.  **Get a JWT Token:**

    First, you need to authenticate with the MCP Gateway's admin interface to get a JWT token. You can do this by making a `curl` request to the `/admin/` endpoint with your admin credentials:

    ```bash
    curl -c cookie.txt -u YOUR_ADMIN_USERNAME:YOUR_ADMIN_PASSWORD http://127.0.0.1:4444/admin/
    ```

    This will save a cookie file named `cookie.txt` containing your JWT token.

2.  **Register the Tool:**

    Now, you can use the `cookie.txt` file to authenticate a `curl` request to the `/admin/tools/` endpoint to register the new tool.

    ```bash
    curl -b cookie.txt -X POST http://127.0.0.1:4444/admin/tools/ \
        -H "Content-Type: application/x-www-form-urlencoded" \
        -d "name=my_external_server_tool" \
        -d "url=https://server.smithery.ai/@upstash/context7-mcp/mcp?api_key=YOUR_API_KEY&profile=some_profile" \
        -d "integrationType=REST" \
        -d "requestType=GET" \
        -d "description=My external MCP server as a tool"
    ```

    Replace the following values:
    *   `my_external_server_tool`: A unique name for your tool.
    *   `https://server.smithery.ai/@upstash/context7-mcp/mcp?api_key=YOUR_API_KEY&profile=some_profile`: The full URL of your external server.
    *   `My external MCP server as a tool`: An optional description.

After running this command, your external server will be registered as a tool and you can start using it within the MCP Gateway.
