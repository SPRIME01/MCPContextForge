# Permission Issues and Solutions

This document details the specific permission issues encountered during SQLite database setup and their solutions.

## 🚨 The Core Problem

The MCP Context Forge Docker container runs as user `1001:0` (UID 1001, GID 0), but the host directory was initially owned by user `1000:1000`. This mismatch caused SQLite to be unable to create or write to the database file.

## 🔍 How to Identify Permission Issues

### Symptoms
- `sqlite3.OperationalError: attempt to write a readonly database`
- `sqlite3.OperationalError: unable to open database file`
- Container logs showing "Database not ready after 3 attempts"
- Health check failing repeatedly

### Diagnostic Commands
```bash
# Check container user
docker-compose exec gateway id
# Output: uid=1001 gid=0(root) groups=0(root)

# Check host directory permissions
ls -la ./data/
# Problem: drwxr-xr-x 2 1000 1000 4096 Jul 16 10:37 ./data

# Check if database file exists and is writable
sudo ls -la ./data/
# Problem: -rw-rw-rw- 1 1000 1000 0 Jul 16 10:37 mcp.db (0 bytes = not initialized)
```

## 🔧 Step-by-Step Solution

### Step 1: Stop All Services
```bash
docker-compose down
```

### Step 2: Identify Container User
```bash
# Start container temporarily to check user
docker-compose run --rm gateway id
# Note the UID and GID (typically 1001:0)
```

### Step 3: Fix Directory Ownership
```bash
# Change ownership to match container user
sudo chown -R 1001:0 ./data ./logs

# Verify ownership changed
ls -la ./data/
# Expected: drwxr-xr-x 2 1001 root 4096 Jul 16 10:37 ./data
```

### Step 4: Remove Corrupted Database
```bash
# Remove any existing empty or corrupted database file
sudo rm -f ./data/mcp.db
```

### Step 5: Update Docker Compose Configuration
Ensure your `docker-compose.yml` has the correct user setting:

```yaml
services:
  gateway:
    user: "1001:0"  # Match the container's actual user
    # ... rest of configuration
```

### Step 6: Start Services
```bash
docker-compose up -d
```

### Step 7: Verify Success
```bash
# Check container status
docker-compose ps
# Expected: Status should be "Up X minutes (healthy)"

# Check database file creation
sudo ls -la ./data/
# Expected: -rw-r--r-- 1 1001 root 139264 Jul 16 10:52 mcp.db (non-zero size)

# Test health endpoint
curl http://localhost:4444/health
# Expected: {"status":"healthy"}
```

## 🛠️ Alternative Solutions

### Option 1: Run Container as Host User
If you prefer to run the container as your host user:

```yaml
services:
  gateway:
    user: "${UID}:${GID}"
    # ... rest of configuration
```

Then start with:
```bash
UID=$(id -u) GID=$(id -g) docker-compose up -d
```

### Option 2: Use Bind Mount with Proper Permissions
```yaml
services:
  gateway:
    user: "1001:0"
    volumes:
      - type: bind
        source: ./data
        target: /app/data
        bind:
          create_host_path: true
    # ... rest of configuration
```

### Option 3: Use Docker Volume Instead of Bind Mount
```yaml
volumes:
  mcp_data:

services:
  gateway:
    volumes:
      - mcp_data:/app/data
    # ... rest of configuration
```

## 🔄 Prevention Strategies

### 1. Always Set Correct Permissions Before First Run
```bash
# Create directories with correct ownership from start
mkdir -p ./data ./logs
sudo chown -R 1001:0 ./data ./logs
```

### 2. Use a Setup Script
Create a `setup.sh` script:
```bash
#!/bin/bash
set -e

echo "Setting up MCP Context Forge..."

# Create directories
mkdir -p ./data ./logs

# Set permissions
sudo chown -R 1001:0 ./data ./logs
sudo chmod -R 755 ./data ./logs

# Copy environment file if it doesn't exist
if [ ! -f .env ]; then
    cp .env.example .env
    echo "Created .env file - please review and update it"
fi

echo "Setup complete! Run: docker-compose up -d"
```

### 3. Add Permission Checks to Health Check
```yaml
healthcheck:
  test: ["CMD", "sh", "-c", "test -w /app/data && python -c \"import urllib.request; urllib.request.urlopen('http://localhost:4444/health')\""]
  interval: 30s
  timeout: 10s
  retries: 5
  start_period: 20s
```

## 📊 Understanding Docker User Mapping

### How Docker Maps Users
- Container processes run as specific UIDs/GIDs
- These are mapped to the host system's user namespace
- Files created by containers inherit the container's UID/GID
- Host file permissions apply to mounted volumes

### Best Practices
1. Always check container user: `docker-compose exec gateway id`
2. Match host directory ownership to container user
3. Use consistent UID/GID across environments
4. Document the required user mappings

## 🚨 Common Mistakes to Avoid

### ❌ Wrong User in docker-compose.yml
```yaml
# DON'T: Assuming container runs as root or 1000
user: "1000:1000"
```

```yaml
# DO: Check actual container user and use that
user: "1001:0"
```

### ❌ Using chmod 777 as a "Quick Fix"
```bash
# DON'T: This is insecure
sudo chmod 777 ./data
```

```bash
# DO: Use proper ownership
sudo chown -R 1001:0 ./data
sudo chmod -R 755 ./data
```

### ❌ Not Removing Corrupted Database Files
```bash
# DON'T: Leave empty or corrupted database files
# This can cause persistent issues
```

```bash
# DO: Remove and let the application recreate
sudo rm -f ./data/mcp.db
```

## 🔧 Troubleshooting Commands

### Quick Diagnostic
```bash
# One-liner to check everything
echo "Container user:" && docker-compose exec gateway id && \
echo "Host directory:" && ls -la ./data && \
echo "Database file:" && sudo ls -la ./data/mcp.db && \
echo "Health check:" && curl -s http://localhost:4444/health
```

### Fix Permissions Script
```bash
#!/bin/bash
# fix-permissions.sh
set -e

echo "Fixing MCP Context Forge permissions..."

# Stop services
docker-compose down

# Fix ownership
sudo chown -R 1001:0 ./data ./logs

# Remove corrupted database
sudo rm -f ./data/mcp.db

# Start services
docker-compose up -d

echo "Permissions fixed! Check status with: docker-compose ps"
```

## 📚 Related Documentation

- [SQLite Setup Guide](./sqlite-setup-guide.md)
- [Docker Compose Configuration](../docker-compose.yml)
- [Environment Configuration](../.env.example)

---

*Last Updated: July 16, 2025*
