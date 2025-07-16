#!/bin/bash
# Quick test script to verify the MCP tool registration validation

echo "Testing MCP tool registration validation..."
echo "=========================================="

# Test 1: Invalid tool name (contains spaces)
echo "Test 1: Invalid tool name with spaces"
echo "my invalid tool name" | ./scripts/register_mcp_tool.sh --name "invalid name" --url "https://example.com" 2>&1 | grep -q "Tool name can only contain" && echo "✅ PASS: Tool name validation works" || echo "❌ FAIL: Tool name validation failed"

# Test 2: Invalid URL format
echo "Test 2: Invalid URL format"
./scripts/register_mcp_tool.sh --name "valid_name" --url "not-a-url" 2>&1 | grep -q "Invalid URL format" && echo "✅ PASS: URL validation works" || echo "❌ FAIL: URL validation failed"

# Test 3: Missing cookie file
echo "Test 3: Missing authentication cookie"
rm -f cookie.txt
./scripts/register_mcp_tool.sh --name "valid_name" --url "https://example.com" 2>&1 | grep -q "No authentication cookie found" && echo "✅ PASS: Auth check works" || echo "❌ FAIL: Auth check failed"

echo "Validation tests completed!"
