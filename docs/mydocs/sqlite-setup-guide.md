# SQLite Database Setup Guide for MCP Context Forge

This guide will help you set up and run the MCP Context Forge with SQLite database properly, avoiding common permission and initialization issues.

## 📋 Prerequisites

- Docker and Docker Compose installed
- Linux/macOS environment (tested on Linux)
- Basic understanding of Docker containers and file permissions

## 🚀 Quick Start

### 1. Clone and Navigate to Project
```bash
git clone https://github.com/SPRIME01/MCPContextForge.git
cd MCPContextForge
```

### 2. Create Required Directories
```bash
# Create data directory for SQLite database
mkdir -p ./data
mkdir -p ./logs

# Set proper permissions (critical step!)
sudo chown -R 1001:0 ./data ./logs
sudo chmod -R 755 ./data ./logs
```

### 3. Environment Configuration
```bash
# Copy environment file
cp .env.example .env

# Edit .env file to ensure SQLite configuration
nano .env
```

Ensure your `.env` file contains:
```env
# Database Configuration
DATABASE_URL=sqlite:///./data/mcp.db
CACHE_TYPE=database

# Basic Auth (change these!)
BASIC_AUTH_USER=admin
BASIC_AUTH_PASSWORD=changeme

# JWT Secret (change this!)
JWT_SECRET_KEY=your-secret-key-here

# UI Configuration
MCPGATEWAY_UI_ENABLED=true
MCPGATEWAY_ADMIN_API_ENABLED=true

# Server Configuration
HOST=0.0.0.0
PORT=4444
```

### 4. Start the Services
```bash
# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f gateway
```

## 🔧 Docker Compose Configuration

### Critical Settings for SQLite

Your `docker-compose.yml` must include these specific settings:

```yaml
services:
  gateway:
    # IMPORTANT: Use the correct user ID that matches the container
    user: "1001:0"
    image: ghcr.io/ibm/mcp-context-forge:0.3.0
    
    # Mount data directory with correct path
    volumes:
      - ./data:/app/data      # SQLite database storage
      - ./logs:/app/logs      # Application logs
    
    # Environment file
    env_file:
      - .env
    
    # Health check for proper startup
    healthcheck:
      test: ["CMD", "python", "-c", "import urllib.request; urllib.request.urlopen('http://localhost:4444/health')"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 20s
```

## 🚨 Common Issues and Solutions

### Issue 1: Permission Denied Errors
**Symptom**: `sqlite3.OperationalError: attempt to write a readonly database`

**Solution**:
```bash
# Stop containers
docker-compose down

# Fix permissions
sudo chown -R 1001:0 ./data
sudo chmod -R 755 ./data

# Remove any existing database file
sudo rm -f ./data/mcp.db

# Restart services
docker-compose up -d
```

### Issue 2: Database Not Ready
**Symptom**: `Error: Database not ready after 3 attempts`

**Solution**:
```bash
# Check container user
docker-compose exec gateway id

# Verify data directory permissions
docker-compose exec gateway ls -la /app/data

# If permissions are wrong, fix them:
sudo chown -R 1001:0 ./data
docker-compose restart gateway
```

### Issue 3: Container User Mismatch
**Symptom**: Container can't write to mounted volumes

**Solution**:
1. Check the actual user ID in the container:
   ```bash
   docker-compose exec gateway id
   ```
2. Update `docker-compose.yml` to match:
   ```yaml
   gateway:
     user: "1001:0"  # Use the actual UID from step 1
   ```
3. Update host directory ownership:
   ```bash
   sudo chown -R 1001:0 ./data ./logs
   ```

## 🔍 Verification Steps

### 1. Check Container Status
```bash
docker-compose ps
```
Expected output:
```
NAME                        STATUS
mcpcontextforge-gateway-1   Up X minutes (healthy)
mcpcontextforge-redis-1     Up X minutes
redisinsight                Up X minutes
```

### 2. Test Health Endpoint
```bash
curl http://localhost:4444/health
```
Expected output:
```json
{"status":"healthy"}
```

### 3. Verify Database Creation
```bash
sudo ls -la ./data/
```
Expected output:
```
-rw-r--r-- 1 1001 root 139264 Jul 16 10:52 mcp.db
```

### 4. Check Application Logs
```bash
docker-compose logs gateway | grep -i "database ready"
```
Expected output:
```
INFO [mcpgateway] Database ready
```

## 📊 Database Management

### Backup Database
```bash
# Create backup
sudo cp ./data/mcp.db ./data/mcp_backup_$(date +%Y%m%d_%H%M%S).db

# Verify backup
sudo ls -la ./data/mcp_backup_*
```

### Reset Database
```bash
# Stop services
docker-compose down

# Remove database file
sudo rm -f ./data/mcp.db

# Start services (will recreate database)
docker-compose up -d
```

### Database Schema Migration
```bash
# Run manual migration if needed
docker-compose exec gateway python -m mcpgateway.bootstrap_db
```

## 🌐 Accessing the Services

Once everything is running:

- **MCP Gateway Web UI**: http://localhost:4444
- **Health Check**: http://localhost:4444/health
- **Redis Insight**: http://localhost:5540
- **API Documentation**: http://localhost:4444/docs

## 🔄 Maintenance Commands

### Regular Operations
```bash
# View logs
docker-compose logs -f gateway

# Restart specific service
docker-compose restart gateway

# Update containers
docker-compose pull
docker-compose up -d

# Clean up
docker-compose down
docker system prune -f
```

### Database Operations
```bash
# Connect to database (requires sqlite3 client)
sudo sqlite3 ./data/mcp.db

# Check database tables
sudo sqlite3 ./data/mcp.db ".tables"

# Check database size
sudo ls -lh ./data/mcp.db
```

## 📝 Troubleshooting Checklist

When encountering issues, check these in order:

1. **Container Status**: `docker-compose ps`
2. **Logs**: `docker-compose logs gateway`
3. **Permissions**: `sudo ls -la ./data/`
4. **Environment**: `docker-compose exec gateway env | grep DATABASE`
5. **Health**: `curl http://localhost:4444/health`
6. **Database File**: `sudo ls -la ./data/mcp.db`

## 📚 Additional Resources

- [Official MCP Context Forge Documentation](../docs/)
- [Docker Compose Reference](https://docs.docker.com/compose/)
- [SQLite Documentation](https://sqlite.org/docs.html)
- [Alembic Migration Guide](../mcpgateway/alembic/README.md)

## 🆘 Getting Help

If you encounter issues not covered in this guide:

1. Check the [GitHub Issues](https://github.com/SPRIME01/MCPContextForge/issues)
2. Review the application logs: `docker-compose logs gateway`
3. Verify your environment matches the requirements
4. Create a new issue with complete error logs and system information

---

*Last Updated: July 16, 2025*
