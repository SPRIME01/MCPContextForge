# MCP Server Connection Troubleshooting Guide

This guide helps you troubleshoot common issues when connecting to external MCP servers through the MCP Context Forge UI.

## 🔧 Common Connection Issues

### 1. Server Error 502 (Bad Gateway)
**Error Message**: "External MCP server at [URL] is currently unavailable (502 Bad Gateway)"

**What it means**: The external MCP server is having internal issues or is down.

**Solutions**:
- Wait a few minutes and try again
- Check if the server URL is correct
- Contact the server administrator or provider
- Check the server's status page if available

### 2. Server Error 524 (Gateway Timeout)
**Error Message**: "External MCP server at [URL] timed out (524 Gateway Timeout)"

**What it means**: The external server took too long to respond.

**Solutions**:
- The server may be overloaded - try again later
- Check your network connection
- Verify the server is still operational
- Try connecting during off-peak hours

### 3. Not Acceptable (406)
**Error Message**: "External MCP server at [URL] returned 406 Not Acceptable"

**What it means**: There's a mismatch between what the client expects and what the server provides.

**Solutions**:
- Verify the server supports SSE (Server-Sent Events) transport
- Check if the server requires specific headers or authentication
- Ensure you're using the correct API key or authentication method

### 4. Connection Refused or Network Errors
**Error Message**: "Cannot connect to external MCP server at [URL]"

**What it means**: Network connectivity issues or server is completely down.

**Solutions**:
- Check your internet connection
- Verify the server URL is correct and accessible
- Try accessing the URL in a web browser
- Check if there are any firewall or proxy issues

## 🛠️ Testing Server Connectivity

### Method 1: Using curl (Command Line)
```bash
# Test basic connectivity
curl -v "https://your-server-url"

# Test with proper SSE headers
curl -H "Accept: text/event-stream" -H "Cache-Control: no-cache" "https://your-server-url"
```

### Method 2: Using the Debug Script
Save this as `test_connection.py`:
```python
import asyncio
import sys
from mcp.client.sse import sse_client
from mcp.client.session import ClientSession

async def test_connection(url):
    try:
        async with sse_client(url=url, headers={}) as streams:
            async with ClientSession(*streams) as session:
                response = await session.initialize()
                print(f"✅ Connection successful: {response}")
                return True
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        return False

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python test_connection.py <server_url>")
        sys.exit(1)
    
    url = sys.argv[1]
    success = asyncio.run(test_connection(url))
    sys.exit(0 if success else 1)
```

Run it with:
```bash
docker-compose exec gateway python test_connection.py "https://your-server-url"
```

## 📋 Server Configuration Checklist

When adding a new MCP server, ensure:

1. **URL Format**: The URL should be complete and properly formatted
   - ✅ Good: `https://server.example.com/mcp?key=abc123`
   - ❌ Bad: `server.example.com/mcp` (missing protocol)

2. **Authentication**: Include proper API keys or authentication
   - Check if the server requires authentication headers
   - Verify API keys are valid and not expired

3. **Transport Protocol**: Ensure the server supports SSE
   - Most MCP servers use Server-Sent Events (SSE) transport
   - Some may use Streamable HTTP

4. **Network Access**: Server must be accessible from your network
   - Check firewall settings
   - Verify proxy configurations if applicable

## 🔍 Debugging Steps

### Step 1: Check Server Status
1. Go to the MCP Context Forge UI at `http://localhost:4444`
2. Try to register the server
3. Note the exact error message

### Step 2: Test Direct Connection
```bash
# Test if server is reachable
curl -I "https://your-server-url"

# Test with proper headers
curl -H "Accept: text/event-stream" "https://your-server-url"
```

### Step 3: Check Gateway Logs
```bash
# View real-time logs
docker-compose logs -f gateway

# Search for specific errors
docker-compose logs gateway | grep -i error
```

### Step 4: Verify Configuration
1. Check your `.env` file for correct settings
2. Verify timeout settings if needed:
   - `FEDERATION_TIMEOUT=30`
   - `HEALTH_CHECK_TIMEOUT=10`
   - `SSE_RETRY_TIMEOUT=5000`

## 🔧 Common Solutions

### Increase Timeout Values
If connections are timing out, try increasing timeout values in your `.env` file:
```env
FEDERATION_TIMEOUT=60
HEALTH_CHECK_TIMEOUT=30
SSE_RETRY_TIMEOUT=10000
```

Then restart the gateway:
```bash
docker-compose restart gateway
```

### Check Server Documentation
- Review the MCP server's documentation
- Look for specific connection requirements
- Check if there are known issues or maintenance windows

### Network Troubleshooting
- Test from different networks
- Check if VPN affects connectivity
- Verify DNS resolution works correctly

## 📞 Getting Help

If you're still having issues:

1. **Check the Server Provider**: Contact the MCP server provider or check their status page
2. **Review Documentation**: Check both the MCP Context Forge docs and the server's documentation
3. **Create an Issue**: If you believe it's a bug in MCP Context Forge, create an issue with:
   - Complete error message
   - Server URL (redacted API keys)
   - Steps to reproduce
   - Gateway logs

## 🌐 Popular MCP Servers

Here are some well-known MCP servers you can try:

### Local Development Servers
- File system server: `mcp-server-filesystem`
- Git repository server: `mcp-server-git`
- SQLite database server: `mcp-server-sqlite`

### Cloud Services
- Check the MCP registry for available servers
- Many services provide MCP-compatible endpoints

### Testing Servers
- Use simple test servers for initial validation
- Create minimal test cases to isolate issues

---

*Last Updated: July 16, 2025*
