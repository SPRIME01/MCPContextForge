# MCP Context Forge Integration Guide - JWT Tokens & Client Configuration

## Overview

This document outlines the process for integrating `mcp-context-forge` with various MCP clients including VS Code, Roo Code, Gemini CLI, and other applications. This setup provides centralized tool orchestration for AI agents, leveraging robust networking, authentication, and composability.

### Supported Integration Methods

1. **Direct HTTP API Access** - For clients that support HTTP-based MCP servers
2. **MCP Stdio Bridge** - For clients that require stdio-based MCP servers (like VS Code)
3. **Native MCP Protocol** - For clients with built-in MCP support

**Key Principles:**

  * **Centralized Orchestration:** `mcp-context-forge` acts as a single gateway for all AI tools.
  * **Network Bridging:** WSL2's Mirrored Networking Mode ensures seamless `localhost` access from Windows.
  * **Secure Authentication:** JWT tokens are used for API access, signed by a secret key known only to the server.
  * **Client-Server Decoupling:** Clients (like Gemini CLI) consume the HTTP API with a token; they do not launch the server.

## 1\. System Architecture Diagram (Conceptual)

```mermaid
graph TD
    subgraph "Windows Host"
        GeminiCLI["Gemini CLI (settings.json)"]
        Browser["Web Browser (Testing)"]
    end
    subgraph "WSL2 Environment"
        direction LR
        WSL2VM["WSL2 VM (Ubuntu/Distro)"]
        DockerDaemon["Docker Daemon"]
        MCPForgeContainer("mcpcontextforge-gateway-1 (Docker Container)")
        MCPForgeApp["mcp-context-forge Application"]
        JWTUtil("JWT Token Utility (python -m mcpgateway.utils.create_jwt_token)")
    end
    D["Your Project Dir .env/docker-compose.yml"]
    F["JWT Token String"]

    GeminiCLI -->|"HTTP Request (localhost:4444/mcp)"| WSL2VM
    Browser -->|"HTTP Request (localhost:4444/mcp)"| WSL2VM
    WSL2VM -->|"Network Bridge (Mirrored Mode)"| DockerDaemon
    DockerDaemon -->|"TCP Port 4444"| MCPForgeContainer
    MCPForgeContainer -->|"Serves API"| MCPForgeApp
    JWTUtil -->|"Uses JWT_SECRET_KEY"| MCPForgeApp
    MCPForgeApp -->|"Stores JWT_SECRET_KEY as ENV"| MCPForgeContainer
    D -->|"JWT_SECRET_KEY=..."| DockerDaemon
    JWTUtil -->|"Generates Token (ey...)"| F
    F --> GeminiCLI
```

## 2\. Prerequisites

  * Windows 11 (22H2+) for Mirrored Networking Mode.
  * WSL2 installed and updated.
  * Docker Desktop for Windows installed and configured to use the WSL2 backend.
  * `mcp-context-forge` Docker container running and exposed on port `4444`.
  * `jq` installed in your WSL2 distribution (`sudo apt install jq`).
  * Your `JWT_SECRET_KEY` used by `mcp-context-forge` is known (or discoverable via `docker inspect`).

## 3\. Configure WSL2 Mirrored Networking

This enables `localhost` access from Windows to services running in WSL2.

1.  **Edit `.wslconfig`:**
    Create or modify `C:\Users\YourUserName\.wslconfig` (replace `YourUserName` with your Windows username) to include:
    ```ini
    [wsl2]
    networkingMode=mirrored
    dnsTunneling=true
    autoMemoryReclaim=gradual # Recommended for resource management
    memory=6GB # Adjust as needed for your workload
    ```
2.  **Shut Down WSL2 Completely:**
    Open PowerShell (as Administrator) and run:
    ```powershell
    wsl --shutdown
    ```
3.  **Restart WSL2:**
    Simply open a WSL2 terminal window. This will apply the `.wslconfig` changes.
4.  **Verify Mirrored Mode (Optional, but Good Practice):**
    In your WSL2 terminal:
    ```bash
    wslinfo --networking-mode
    # Expected output: mirrored
    ip addr show eth0
    # Expected: eth0 should have the same IP as your Windows host's primary network adapter.
    ```

## 4\. Verify `mcp-context-forge` Accessibility & Listener

Ensure `mcp-context-forge` is running and listening on the correct port within WSL2.

1.  **Ensure Docker Container is Running:**
    In your WSL2 terminal:

    ```bash
    docker ps
    # Confirm 'mcpcontextforge-gateway-1' is listed with 'Up' status and 'healthy'
    ```

    Note the container name (e.g., `mcpcontextforge-gateway-1`).

2.  **Verify Listening Port within Container (using `ss`):**
    In your WSL2 terminal:

    ```bash
    docker exec mcpcontextforge-gateway-1 sudo ss -tulnp | grep 4444
    # Expected output: tcp LISTEN 0      4096                *:4444            *:*
    # This confirms it's listening on all interfaces on port 4444.
    ```

3.  **Test Connectivity from Windows Host:**
    Open a web browser on your **Windows host** and navigate to:
    `http://localhost:4444/mcp`

      * **Expected Behavior:** You should get a JSON response like `{"detail":"Authentication failed"}`. This confirms successful network bridging and that the gateway is active and requires authentication. If you get a "site can't be reached" error, re-check WSL2 networking setup.

## 5. Generate JWT Authentication Tokens

You have multiple methods to generate JWT tokens for authenticating with `mcp-context-forge`:

### Method 1: Using the Project's Make Command (Recommended)

The simplest method uses the built-in make target:

```bash
# Navigate to your project directory
cd /path/to/MCPContextForge

# Generate a fresh JWT token
make generate-jwt
```

This will output a JWT token like:
```
🔑 Generating JWT token for MCP authentication...
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InNwcmltZTAxIiwiZXhwIjoxNzUzNDcyODgzfQ.bSDtA--qbAB7gTLyYMktjg_V1BDHRJY_0SxvukVHQPA
```

### Method 2: Using Docker Exec (For Docker Deployments)

If you're running `mcp-context-forge` in Docker:

1. **Identify the `JWT_SECRET_KEY` of your running container:**
   ```bash
   docker inspect mcpcontextforge-gateway-1 | jq -r '.[0].Config.Env[] | select(startswith("JWT_SECRET_KEY="))'
   ```

2. **Generate the JWT Token:**
   ```bash
   docker exec mcpcontextforge-gateway-1 python3 -m mcpgateway.utils.create_jwt_token \
   --username admin --exp 10080 --secret YOUR_SECRET_KEY_HERE
   ```

### Method 3: Direct Python Module (For Local Development)

If running locally with Python:

```bash
# From your project directory
python -m mcpgateway.utils.create_jwt_token --username admin --exp 10080
```

### Token Validation

Test your generated token:

```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" http://localhost:4444/tools
```

Expected response: A JSON array of available tools.

## 6. Client Configuration Examples

### VS Code MCP Extension

For VS Code with MCP extensions, you'll typically need a stdio bridge. Use this configuration:

1. **Create `.vscode/mcp.json` in your workspace:**
   ```jsonc
   {
     "servers": {
       "mcp-gateway": {
         "type": "stdio",
         "command": "node",
         "args": ["/path/to/your/scripts/mcp_stdio_bridge.js"],
         "env": {
           "MCP_GATEWAY_URL": "http://127.0.0.1:4444",
           "MCP_JWT_TOKEN": "YOUR_JWT_TOKEN_HERE"
         }
       }
     }
   }
   ```

2. **Ensure the MCP stdio bridge script exists** (see section 7 for bridge setup)

### Roo Code Configuration

For Roo Code, which supports HTTP-based MCP servers:

1. **Create or edit your Roo Code configuration:**
   ```json
   {
     "mcpServers": {
       "contextforge": {
         "url": "http://localhost:4444/mcp",
         "headers": {
           "Authorization": "Bearer YOUR_JWT_TOKEN_HERE"
         }
       }
     }
   }
   ```

### Gemini CLI Configuration

1. **Locate Gemini CLI `settings.json`:**
   - **Windows:** `C:\Users\YourUserName\.gemini\settings.json`
   - **macOS/Linux:** `~/.gemini/settings.json`

2. **Add/Update `mcpServers` Section:**
   ```json
   {
     "mcpServers": {
       "myContextForgeGateway": {
         "url": "http://localhost:4444/mcp",
         "trust": true,
         "token": "YOUR_JWT_TOKEN_HERE"
       }
     }
   }
   ```

### Claude Desktop Configuration

For Claude Desktop with MCP support:

1. **Edit Claude configuration file:**
   - **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
   - **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`

2. **Add MCP server configuration:**
   ```json
   {
     "mcpServers": {
       "contextforge": {
         "command": "node",
         "args": ["/path/to/your/scripts/mcp_stdio_bridge.js"],
         "env": {
           "MCP_GATEWAY_URL": "http://127.0.0.1:4444",
           "MCP_JWT_TOKEN": "YOUR_JWT_TOKEN_HERE"
         }
       }
     }
   }
   ```

### Generic HTTP Client

For any application that can make HTTP requests:

```bash
# List available tools
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     http://localhost:4444/tools

# Execute a tool (example)
curl -X POST \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"tool_name": "exa-search", "parameters": {"query": "AI news"}}' \
     http://localhost:4444/tools/execute
```

## 7. Setting Up the MCP Stdio Bridge (For stdio-based clients)

Some MCP clients (like VS Code extensions) expect stdio-based communication. Use this bridge script:

### Install Dependencies

```bash
cd /path/to/MCPContextForge
npm install node-fetch@2 --legacy-peer-deps
```

### Bridge Script (`scripts/mcp_stdio_bridge.js`)

Create or verify this script exists with the following content:

```javascript
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
  fetch = globalThis.fetch;
  if (!fetch) {
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

    // Listen for messages from stdin
    process.stdin.on('data', (data) => {
      this.handleMessage(data.toString().trim());
    });

    // Handle process termination
    process.on('SIGINT', () => {
      console.error('Shutting down MCP Stdio Bridge...');
      process.exit(0);
    });
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
              tools: { listChanged: true },
              resources: { subscribe: true, listChanged: true },
              prompts: { listChanged: true }
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
        error: { code: -32700, message: 'Invalid JSON received' },
        id: null
      });
    }
  }

  async forwardToGateway(message) {
    try {
      const response = await fetch(`${MCP_GATEWAY_URL}/tools`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${MCP_JWT_TOKEN}`
        },
        body: JSON.stringify(message)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gateway responded with ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      this.sendMessage(data);
    } catch (error) {
      console.error('Error forwarding to gateway:', error);
      this.sendMessage({
        jsonrpc: '2.0',
        error: { code: -32603, message: `Internal bridge error: ${error.message}` },
        id: message.id || null
      });
    }
  }

  sendMessage(message) {
    // Use LSP protocol with Content-Length header
    const content = JSON.stringify(message);
    const contentLength = Buffer.byteLength(content, 'utf8');
    process.stdout.write(`Content-Length: ${contentLength}\r\n\r\n${content}`);
  }
}

// Start the bridge
new MCPStdioBridge();
```

### Test the Bridge

```bash
# Test the bridge script directly
echo '{"jsonrpc": "2.0", "method": "initialize", "params": {"protocolVersion": "2025-06-18"}, "id": 1}' | \
MCP_GATEWAY_URL=http://127.0.0.1:4444 \
MCP_JWT_TOKEN=YOUR_JWT_TOKEN_HERE \
node scripts/mcp_stdio_bridge.js
```

## 8. Usage Examples

### VS Code with MCP Extension

Once configured, your VS Code MCP extension should:
- Connect automatically when VS Code starts
- Show available tools in the MCP panel
- Allow you to execute tools through the extension UI

### Gemini CLI Usage

```bash
# List available MCP servers
gemini mcp list

# Use a specific tool
gemini "Use exa-search to find recent AI research papers"
gemini "Can you access the mem0-memory-mcp to recall our previous conversation about machine learning?"
```

### Roo Code Usage

Within Roo Code, you can:
- Use the `/mcp` command to list available tools
- Reference tools in your prompts: "Use the exa-search tool to find..."
- Access tool results directly in your development workflow

### Direct API Usage

```bash
# List all available tools
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:4444/tools

# Get tool details
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:4444/tools/exa-search

# Execute a tool (if your gateway supports direct execution)
curl -X POST \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"query": "latest AI developments"}' \
     http://localhost:4444/tools/exa-search/execute
```

## Troubleshooting & Best Practices

## Troubleshooting & Best Practices

### Common Issues

**Authentication Errors (401 Unauthorized)**
- Verify your JWT token is not expired
- Check that the `JWT_SECRET_KEY` matches between token generation and your running gateway
- Ensure the token is properly formatted (starts with `ey`)

**Connection Refused**
- Verify the gateway is running: `docker ps` or check your local process
- Check the correct port (default 4444): `curl http://localhost:4444/health`
- For WSL2/Docker setups, ensure mirrored networking is configured

**VS Code MCP Extension Issues**
- Check VS Code developer console for errors: `Ctrl+Shift+I` → Console
- Verify the stdio bridge script path is correct
- Ensure `node-fetch` is installed: `npm list node-fetch`
- Check environment variables are set correctly in `mcp.json`

**Token Generation Fails**
- For `make generate-jwt`: Ensure you're in the project root directory
- For Docker method: Verify container name with `docker ps`
- For Python module: Check that dependencies are installed

### Best Practices

**Security**
- Use strong, random `JWT_SECRET_KEY` for production deployments
- Regenerate tokens regularly (set appropriate expiration times)
- Never commit JWT tokens to version control
- Use environment variables or secure secret management for production

**Performance**
- Monitor gateway logs: `docker logs mcpcontextforge-gateway-1`
- Set reasonable token expiration times (default: 1 week)
- Use connection pooling for high-traffic scenarios

**Development**
- Test token validity with curl before configuring clients
- Use `--exp 0` for no expiration during development only
- Keep backup JWT tokens for testing

### Token Expiration Management

```bash
# Check token expiration (decode JWT payload)
echo "YOUR_JWT_TOKEN" | cut -d. -f2 | base64 -d | jq .exp

# Generate long-lived token (30 days)
make generate-jwt  # Uses project defaults

# Generate custom expiration token
docker exec mcpcontextforge-gateway-1 python3 -m mcpgateway.utils.create_jwt_token \
--username admin --exp 43200 --secret YOUR_SECRET_KEY  # 30 days = 43200 minutes
```

### Client-Specific Troubleshooting

**VS Code**
- Reload window after configuration changes: `Ctrl+Shift+P` → "Developer: Reload Window"
- Check MCP extension logs in the Output panel
- Verify Node.js is in your PATH

**Roo Code**
- Restart Roo Code after configuration changes
- Check that HTTP requests are allowed to localhost
- Verify JSON configuration syntax

**Gemini CLI**
- Check settings.json syntax with a JSON validator
- Restart Gemini CLI completely after changes
- Verify network connectivity to your gateway

-----
```mermaid
graph TD
    A["Your .env / docker-compose.yml"] -->|"JWT_SECRET_KEY=wLOL...Hv4"| B("mcpcontextforge-gateway-1 Docker Container")
    B -->|"Configured Secret Key"| C("JWT Token Signing/Verification Logic")
    D["WSL2 Terminal / Docker Exec Command"] -->|"Use --secret wLOL...Hv4"| E["python3 -m mcpgateway.utils.create_jwt_token"]
    E -->|"Generates"| F["ey...JWT_TOKEN_STRING"]
    F -->|"Copy and Paste"| G["Gemini CLI settings.json (on Windows Host)"]
    G -->|"Authorization: Bearer ey...JWT_TOKEN_STRING"| B
    B -->|"Verifies with wLOL...Hv4"| C
    C -->|"Valid/Invalid"| B
    ```

