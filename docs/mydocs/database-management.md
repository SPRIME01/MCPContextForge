# Database Management and Maintenance

This guide covers database management, backup, recovery, and maintenance procedures for the MCP Context Forge SQLite database.

## 📊 Database Overview

The MCP Context Forge uses SQLite as its default database with the following characteristics:
- **Location**: `./data/mcp.db`
- **Type**: SQLite 3.x
- **Size**: ~140KB when initialized
- **Schema**: Managed by Alembic migrations
- **Persistence**: Stored on host filesystem via Docker bind mount

## 🔧 Database Operations

### Database Initialization

The database is automatically initialized when the container starts:

```bash
# Check if database exists and is initialized
sudo ls -la ./data/mcp.db
# Expected: File size > 100KB indicates proper initialization

# Check database tables
sudo sqlite3 ./data/mcp.db ".tables"
# Expected output: List of tables like gateways, tools, resources, etc.
```

### Manual Database Bootstrap

If you need to manually initialize or reset the database:

```bash
# Stop the gateway service
docker-compose stop gateway

# Remove existing database
sudo rm -f ./data/mcp.db

# Run manual bootstrap
docker-compose run --rm gateway python -m mcpgateway.bootstrap_db

# Start the service
docker-compose start gateway
```

## 🗃️ Backup and Recovery

### Creating Backups

#### Method 1: File Copy (Recommended)
```bash
# Stop services to ensure consistent backup
docker-compose stop gateway

# Create timestamped backup
BACKUP_NAME="mcp_backup_$(date +%Y%m%d_%H%M%S).db"
sudo cp ./data/mcp.db "./data/${BACKUP_NAME}"

# Verify backup
sudo ls -la ./data/mcp_backup_*

# Restart services
docker-compose start gateway
```

#### Method 2: SQLite Backup Command
```bash
# Create backup using SQLite's backup command
sudo sqlite3 ./data/mcp.db ".backup ./data/mcp_backup_$(date +%Y%m%d_%H%M%S).db"
```

#### Method 3: Hot Backup (Without Stopping Services)
```bash
# SQLite supports hot backups
BACKUP_NAME="mcp_hotbackup_$(date +%Y%m%d_%H%M%S).db"
sudo sqlite3 ./data/mcp.db ".backup ./data/${BACKUP_NAME}"
```

### Automated Backup Script

Create a backup script for regular backups:

```bash
#!/bin/bash
# backup-database.sh

set -e

BACKUP_DIR="./data/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="mcp_backup_${DATE}.db"

# Create backup directory if it doesn't exist
sudo mkdir -p "${BACKUP_DIR}"

# Create backup
echo "Creating backup: ${BACKUP_FILE}"
sudo sqlite3 ./data/mcp.db ".backup ${BACKUP_DIR}/${BACKUP_FILE}"

# Verify backup
if [ -f "${BACKUP_DIR}/${BACKUP_FILE}" ]; then
    SIZE=$(sudo stat -c%s "${BACKUP_DIR}/${BACKUP_FILE}")
    echo "Backup created successfully: ${BACKUP_FILE} (${SIZE} bytes)"
else
    echo "Backup failed!"
    exit 1
fi

# Clean up old backups (keep last 7 days)
find "${BACKUP_DIR}" -name "mcp_backup_*.db" -mtime +7 -delete

echo "Backup completed!"
```

### Restoring from Backup

```bash
# Stop services
docker-compose stop gateway

# Restore from backup
sudo cp ./data/mcp_backup_YYYYMMDD_HHMMSS.db ./data/mcp.db

# Fix permissions
sudo chown 1001:0 ./data/mcp.db

# Start services
docker-compose start gateway

# Verify restoration
curl http://localhost:4444/health
```

## 🔄 Database Migrations

### Understanding Migrations

The MCP Context Forge uses Alembic for database schema management:

```bash
# Check current migration version
docker-compose exec gateway alembic current

# View migration history
docker-compose exec gateway alembic history --verbose

# Check for pending migrations
docker-compose exec gateway alembic show head
```

### Running Migrations

```bash
# Apply all pending migrations
docker-compose exec gateway alembic upgrade head

# Downgrade one migration
docker-compose exec gateway alembic downgrade -1

# Upgrade to specific revision
docker-compose exec gateway alembic upgrade abc123
```

### Migration Troubleshooting

If migrations fail:

```bash
# Check migration status
docker-compose exec gateway alembic current

# If database is corrupted, reset and migrate
docker-compose stop gateway
sudo rm -f ./data/mcp.db
docker-compose run --rm gateway python -m mcpgateway.bootstrap_db
docker-compose start gateway
```

## 🔍 Database Inspection and Monitoring

### Database Schema Inspection

```bash
# List all tables
sudo sqlite3 ./data/mcp.db ".tables"

# Show schema for specific table
sudo sqlite3 ./data/mcp.db ".schema gateways"

# Show all table schemas
sudo sqlite3 ./data/mcp.db ".schema"
```

### Database Statistics

```bash
# Database file size
sudo ls -lh ./data/mcp.db

# Database info
sudo sqlite3 ./data/mcp.db "PRAGMA database_list;"

# Table row counts
sudo sqlite3 ./data/mcp.db "
  SELECT name, 
         (SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name=m.name) as table_count
  FROM sqlite_master m WHERE type='table';
"

# Database integrity check
sudo sqlite3 ./data/mcp.db "PRAGMA integrity_check;"
```

### Performance Monitoring

```bash
# Analyze database performance
sudo sqlite3 ./data/mcp.db "ANALYZE;"

# Check database page information
sudo sqlite3 ./data/mcp.db "PRAGMA page_count; PRAGMA page_size;"

# View database statistics
sudo sqlite3 ./data/mcp.db "
  SELECT 
    name,
    (SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name=m.name) as tables,
    (SELECT COUNT(*) FROM sqlite_master WHERE type='index' AND name=m.name) as indexes
  FROM sqlite_master m;
"
```

## 🧹 Database Maintenance

### Regular Maintenance Tasks

#### Weekly Maintenance Script
```bash
#!/bin/bash
# weekly-maintenance.sh

set -e

echo "Starting weekly database maintenance..."

# 1. Create backup
./backup-database.sh

# 2. Run integrity check
echo "Running integrity check..."
sudo sqlite3 ./data/mcp.db "PRAGMA integrity_check;" | grep -v "ok" || echo "Database integrity: OK"

# 3. Analyze database
echo "Analyzing database..."
sudo sqlite3 ./data/mcp.db "ANALYZE;"

# 4. Vacuum database (reclaim space)
echo "Vacuuming database..."
sudo sqlite3 ./data/mcp.db "VACUUM;"

# 5. Check database size
SIZE=$(sudo stat -c%s ./data/mcp.db)
echo "Database size: ${SIZE} bytes"

echo "Weekly maintenance completed!"
```

### Database Optimization

```bash
# Reclaim unused space
sudo sqlite3 ./data/mcp.db "VACUUM;"

# Update database statistics
sudo sqlite3 ./data/mcp.db "ANALYZE;"

# Check and fix database
sudo sqlite3 ./data/mcp.db "PRAGMA integrity_check;"
```

### Log Rotation

```bash
# Create log rotation script
#!/bin/bash
# rotate-logs.sh

LOG_DIR="./logs"
DATE=$(date +%Y%m%d)

# Compress old logs
find "${LOG_DIR}" -name "*.log" -mtime +1 -exec gzip {} \;

# Remove very old logs
find "${LOG_DIR}" -name "*.log.gz" -mtime +30 -delete

echo "Log rotation completed!"
```

## 🚨 Disaster Recovery

### Recovery Procedures

#### Complete Database Loss
```bash
# 1. Stop services
docker-compose down

# 2. Remove corrupted database
sudo rm -f ./data/mcp.db

# 3. Restore from backup if available
if [ -f "./data/mcp_backup_latest.db" ]; then
    sudo cp ./data/mcp_backup_latest.db ./data/mcp.db
    sudo chown 1001:0 ./data/mcp.db
else
    echo "No backup found - database will be recreated"
fi

# 4. Start services (will recreate if no backup)
docker-compose up -d

# 5. Verify recovery
curl http://localhost:4444/health
```

#### Partial Data Recovery
```bash
# If some data is recoverable
sudo sqlite3 ./data/mcp.db "
  -- Export data to CSV
  .mode csv
  .output gateways_backup.csv
  SELECT * FROM gateways;
  
  .output tools_backup.csv
  SELECT * FROM tools;
  
  .quit
"

# Then restore using the CSV files after database recreation
```

## 📊 Database Configuration

### SQLite Configuration

The database is configured via environment variables:

```env
# Database URL
DATABASE_URL=sqlite:///./data/mcp.db

# Cache configuration
CACHE_TYPE=database

# Connection settings (if needed)
SQLITE_TIMEOUT=30
SQLITE_BUSY_TIMEOUT=30000
```

### Performance Tuning

For better performance, you can configure SQLite pragmas:

```bash
# Optimize database settings
sudo sqlite3 ./data/mcp.db "
  PRAGMA journal_mode=WAL;
  PRAGMA synchronous=NORMAL;
  PRAGMA cache_size=10000;
  PRAGMA temp_store=MEMORY;
"
```

## 🔧 Troubleshooting Common Issues

### Database Locked
```bash
# Check for lock files
sudo ls -la ./data/mcp.db*

# Remove lock files if safe
sudo rm -f ./data/mcp.db-wal ./data/mcp.db-shm

# Restart services
docker-compose restart gateway
```

### Database Corruption
```bash
# Check integrity
sudo sqlite3 ./data/mcp.db "PRAGMA integrity_check;"

# If corrupted, restore from backup
docker-compose stop gateway
sudo cp ./data/mcp_backup_latest.db ./data/mcp.db
sudo chown 1001:0 ./data/mcp.db
docker-compose start gateway
```

### Migration Failures
```bash
# Reset migration state
docker-compose exec gateway alembic stamp head

# Or start fresh
docker-compose stop gateway
sudo rm -f ./data/mcp.db
docker-compose run --rm gateway python -m mcpgateway.bootstrap_db
docker-compose start gateway
```

## 📚 Related Documentation

- [SQLite Setup Guide](./sqlite-setup-guide.md)
- [Permission Issues Solutions](./permission-issues-solutions.md)
- [Alembic Migration Guide](../mcpgateway/alembic/README.md)

---

*Last Updated: July 16, 2025*
