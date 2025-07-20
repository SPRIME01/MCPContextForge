#!/usr/bin/env python3
"""
Test script to debug MCP Tool serialization issues
"""

import json
import sys
from mcp import types

# Sample tool data from gateway
tool_data = {
    "id": "d8ec30f6edcc4f54b9ac5ba3aa73534e",
    "originalName": "smithery_ai_context7_tool",
    "url": "https://server.smithery.ai/@upstash/context7-mcp/mcp?api_key=cc369a4a-eaf7-47a4-b6ba-61fae9e9e628",
    "description": "Smithery AI context7 server as a tool",
    "inputSchema": {},
    "annotations": {},
    "name": "smithery-ai-context7-tool",
}

# Test creating MCP Tool with different schemas
def test_tool_creation():
    print("Testing MCP Tool creation...")

    # Test with empty schema
    try:
        tool1 = types.Tool(
            name=tool_data["name"],
            description=tool_data["description"],
            inputSchema={},
            annotations={}
        )
        print("✓ Empty schema works")
    except Exception as e:
        print(f"✗ Empty schema failed: {e}")

    # Test with proper MCP schema
    try:
        tool2 = types.Tool(
            name=tool_data["name"],
            description=tool_data["description"],
            inputSchema={"type": "object", "properties": {}, "required": []},
            annotations={}
        )
        print("✓ Proper MCP schema works")

        # Test serialization
        tool_dict = tool2.model_dump()
        print(f"✓ Serialization works: {json.dumps(tool_dict, indent=2)}")

    except Exception as e:
        print(f"✗ Proper MCP schema failed: {e}")

    # Test with None annotations
    try:
        tool3 = types.Tool(
            name=tool_data["name"],
            description=tool_data["description"],
            inputSchema={"type": "object", "properties": {}, "required": []},
            annotations=None
        )
        print("✓ None annotations works")
    except Exception as e:
        print(f"✗ None annotations failed: {e}")

if __name__ == "__main__":
    test_tool_creation()
