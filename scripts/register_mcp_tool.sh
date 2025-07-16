#!/bin/bash

# MCP Tool Registration Helper Script
# This script provides an idiot-proof way to register external MCP servers

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
MCP_GATEWAY_URL="${MCP_GATEWAY_URL:-http://127.0.0.1:4444}"
COOKIE_FILE="cookie.txt"

# Function to print colored output
print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Function to check if curl is available
check_curl() {
    if ! command -v curl &> /dev/null; then
        print_error "curl is required but not installed. Please install curl and try again."
        exit 1
    fi
}

# Function to check if authentication cookie exists
check_auth() {
    if [ ! -f "$COOKIE_FILE" ]; then
        print_error "No authentication cookie found."
        print_info "Please run 'make mcp-auth' first to authenticate with the MCP Gateway."
        exit 1
    fi
}

# Function to load environment variables from .env file
load_env() {
    if [ -f .env ]; then
        export $(grep -E '^MCP_ADMIN_USERNAME=' .env | xargs) 2>/dev/null || true
        export $(grep -E '^MCP_ADMIN_PASSWORD=' .env | xargs) 2>/dev/null || true
        export $(grep -E '^MCP_GATEWAY_URL=' .env | xargs) 2>/dev/null || true
    fi
}

# Function to validate URL
validate_url() {
    local url="$1"
    if [[ ! "$url" =~ ^https?:// ]]; then
        print_error "Invalid URL format. URL must start with http:// or https://"
        return 1
    fi
    return 0
}

# Function to validate tool name
validate_tool_name() {
    local name="$1"
    if [[ -z "$name" ]]; then
        print_error "Tool name cannot be empty."
        return 1
    fi
    if [[ ! "$name" =~ ^[a-zA-Z0-9_-]+$ ]]; then
        print_error "Tool name can only contain letters, numbers, underscores, and hyphens."
        return 1
    fi
    return 0
}

# Function to register the tool
register_tool() {
    local tool_name="$1"
    local server_url="$2"
    local description="$3"
    
    print_info "Registering tool with MCP Gateway..."
    
    local response_file="/tmp/mcp_register_response_$$.json"
    
    if curl -s -b "$COOKIE_FILE" -X POST "$MCP_GATEWAY_URL/admin/tools/" \
        -H "Content-Type: application/x-www-form-urlencoded" \
        -d "name=$tool_name" \
        -d "url=$server_url" \
        -d "integrationType=REST" \
        -d "requestType=GET" \
        -d "description=$description" \
        -o "$response_file" \
        -w "%{http_code}" | grep -q "^2"; then
        
        print_success "Tool registered successfully!"
        echo ""
        print_info "Response:"
        if command -v python3 &> /dev/null; then
            python3 -m json.tool "$response_file" 2>/dev/null || cat "$response_file"
        else
            cat "$response_file"
        fi
        rm -f "$response_file"
        return 0
    else
        print_error "Registration failed."
        if [ -f "$response_file" ]; then
            echo ""
            print_info "Error details:"
            cat "$response_file"
            rm -f "$response_file"
        fi
        return 1
    fi
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --help        Show this help message"
    echo "  -n, --name        Tool name (required)"
    echo "  -u, --url         Server URL (required)"
    echo "  -d, --description Tool description (optional)"
    echo "  --gateway-url     MCP Gateway URL (default: $MCP_GATEWAY_URL)"
    echo ""
    echo "Interactive mode:"
    echo "  Run without arguments to enter interactive mode"
    echo ""
    echo "Examples:"
    echo "  $0 -n my_tool -u 'https://server.smithery.ai/@upstash/context7-mcp/mcp?api_key=YOUR_API_KEY'"
    echo "  $0 --name weather_tool --url 'https://api.weather.com/mcp' --description 'Weather API tool'"
}

# Parse command line arguments
TOOL_NAME=""
SERVER_URL=""
DESCRIPTION=""
INTERACTIVE=true

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_usage
            exit 0
            ;;
        -n|--name)
            TOOL_NAME="$2"
            INTERACTIVE=false
            shift 2
            ;;
        -u|--url)
            SERVER_URL="$2"
            INTERACTIVE=false
            shift 2
            ;;
        -d|--description)
            DESCRIPTION="$2"
            shift 2
            ;;
        --gateway-url)
            MCP_GATEWAY_URL="$2"
            shift 2
            ;;
        *)
            print_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Main script
main() {
    echo "🔧 MCP Tool Registration Helper"
    echo "================================"
    echo ""
    
    # Load environment variables from .env file
    load_env
    
    # Check prerequisites
    check_curl
    check_auth
    
    # Set MCP_GATEWAY_URL to default if not set
    MCP_GATEWAY_URL="${MCP_GATEWAY_URL:-http://127.0.0.1:4444}"
    
    print_info "MCP Gateway URL: $MCP_GATEWAY_URL"
    echo ""
    
    # Interactive mode
    if [ "$INTERACTIVE" = true ]; then
        print_info "Please provide the following information:"
        echo ""
        
        while true; do
            read -p "Tool name (unique identifier): " TOOL_NAME
            if validate_tool_name "$TOOL_NAME"; then
                break
            fi
        done
        
        while true; do
            read -p "Server URL (with API key): " SERVER_URL
            if validate_url "$SERVER_URL"; then
                break
            fi
        done
        
        read -p "Description (optional): " DESCRIPTION
        
        echo ""
        print_info "Summary:"
        echo "  Name: $TOOL_NAME"
        echo "  URL: $SERVER_URL"
        echo "  Description: $DESCRIPTION"
        echo ""
        
        read -p "❓ Proceed with registration? (y/N): " confirm
        if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
            print_warning "Registration cancelled."
            exit 0
        fi
    else
        # Non-interactive mode validation
        if [ -z "$TOOL_NAME" ] || [ -z "$SERVER_URL" ]; then
            print_error "Tool name and server URL are required."
            show_usage
            exit 1
        fi
        
        if ! validate_tool_name "$TOOL_NAME"; then
            exit 1
        fi
        
        if ! validate_url "$SERVER_URL"; then
            exit 1
        fi
    fi
    
    echo ""
    
    # Register the tool
    if register_tool "$TOOL_NAME" "$SERVER_URL" "$DESCRIPTION"; then
        echo ""
        print_success "🎉 Tool '$TOOL_NAME' has been successfully registered!"
        print_info "You can now use this tool within the MCP Gateway."
    else
        exit 1
    fi
}

# Run main function
main "$@"
