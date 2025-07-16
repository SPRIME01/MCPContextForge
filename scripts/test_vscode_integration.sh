#!/bin/bash

# Test script for MCP Gateway VS Code integration

echo "🧪 Testing MCP Gateway VS Code Integration"
echo "=========================================="

# Check if VS Code bridge script exists
if [ -f "scripts/mcp_stdio_bridge.js" ]; then
    echo "✅ VS Code stdio bridge script exists"
else
    echo "❌ VS Code stdio bridge script missing"
    exit 1
fi

# Check if Node.js dependencies are installed
if [ -f "scripts/package.json" ]; then
    echo "✅ Node.js package.json exists"
else
    echo "❌ Node.js package.json missing"
    exit 1
fi

# Check if node_modules exists
if [ -d "scripts/node_modules" ]; then
    echo "✅ Node.js dependencies installed"
else
    echo "❌ Node.js dependencies missing"
    exit 1
fi

# Check if .env file has required variables
if [ -f ".env" ]; then
    echo "✅ .env file exists"
    
    # Check for required environment variables
    if grep -q "MCP_GATEWAY_URL" .env; then
        echo "✅ MCP_GATEWAY_URL configured"
    else
        echo "❌ MCP_GATEWAY_URL missing from .env"
        exit 1
    fi
    
    if grep -q "MCP_ADMIN_USERNAME" .env; then
        echo "✅ MCP_ADMIN_USERNAME configured"
    else
        echo "❌ MCP_ADMIN_USERNAME missing from .env"
        exit 1
    fi
    
    if grep -q "MCP_ADMIN_PASSWORD" .env; then
        echo "✅ MCP_ADMIN_PASSWORD configured"
    else
        echo "❌ MCP_ADMIN_PASSWORD missing from .env"
        exit 1
    fi
else
    echo "❌ .env file missing"
    exit 1
fi

echo ""
echo "🎯 All checks passed! VS Code integration is ready."
echo ""
echo "📋 To complete the setup:"
echo "1. Open VS Code"
echo "2. Install the 'Model Context Protocol' extension"
echo "3. Add the configuration from 'make setup-vscode' to your VS Code settings.json"
echo "4. Restart VS Code"
echo "5. Your MCP Gateway tools should be available in Copilot!"
