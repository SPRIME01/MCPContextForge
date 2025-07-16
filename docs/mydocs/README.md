# MCP Context Forge Documentation Index

Welcome to the MCP Context Forge documentation! This directory contains comprehensive guides and documentation for setting up, configuring, and maintaining your MCP Context Forge installation.

## 📚 Available Documentation

### 🚀 Getting Started
- **[SQLite Setup Guide](./sqlite-setup-guide.md)** - Complete guide for setting up MCP Context Forge with SQLite database
  - Prerequisites and requirements
  - Step-by-step installation
  - Configuration examples
  - Verification procedures

### 🛠️ Troubleshooting
- **[Permission Issues and Solutions](./permission-issues-solutions.md)** - Solutions for common permission problems
  - Docker user mapping issues
  - File permission problems
  - Database access errors
  - Step-by-step fixes

- **[Server Connection Troubleshooting](./server-connection-troubleshooting.md)** - Fix external MCP server connection issues
  - Common connection errors (502, 524, 406)
  - Network troubleshooting
  - Server testing methods
  - Configuration validation

### 🗃️ Database Management
- **[Database Management and Maintenance](./database-management.md)** - Comprehensive database operations guide
  - Backup and recovery procedures
  - Migration management
  - Performance optimization
  - Disaster recovery

## 🔧 Quick Reference

### Essential Commands
```bash
# Check service status
docker-compose ps

# View logs
docker-compose logs -f gateway

# Fix permissions
sudo chown -R 1001:0 ./data ./logs

# Health check
curl http://localhost:4444/health

# Backup database
sudo cp ./data/mcp.db ./data/mcp_backup_$(date +%Y%m%d_%H%M%S).db
```

### Common Issues Quick Fix
```bash
# If database issues occur:
docker-compose down
sudo rm -f ./data/mcp.db
sudo chown -R 1001:0 ./data
docker-compose up -d
```

## 📋 Document Status

| Document | Status | Last Updated |
|----------|--------|--------------|
| SQLite Setup Guide | ✅ Complete | July 16, 2025 |
| Permission Issues Solutions | ✅ Complete | July 16, 2025 |
| Database Management | ✅ Complete | July 16, 2025 |

## 🔄 Getting Help

If you encounter issues not covered in these documents:

1. **Check the main project documentation**: [../docs/](../docs/)
2. **Review GitHub issues**: [Project Issues](https://github.com/SPRIME01/MCPContextForge/issues)
3. **Check application logs**: `docker-compose logs gateway`
4. **Verify your setup** against the guides in this directory

## 🤝 Contributing

If you find errors or have improvements for this documentation:

1. Fork the repository
2. Make your changes
3. Submit a pull request
4. Include details about what you changed and why

## 📄 Document Structure

Each document in this directory follows a consistent structure:

- **Prerequisites** - What you need before starting
- **Step-by-step instructions** - Clear, actionable steps
- **Common issues** - Problems and solutions
- **Verification steps** - How to confirm success
- **Troubleshooting** - When things go wrong
- **Related documentation** - Links to other relevant guides

## 🎯 Recommended Reading Order

For new users, we recommend reading the documents in this order:

1. **[SQLite Setup Guide](./sqlite-setup-guide.md)** - Start here for initial setup
2. **[Permission Issues Solutions](./permission-issues-solutions.md)** - If you encounter permission problems
3. **[Database Management](./database-management.md)** - For ongoing maintenance and operations

## 📊 System Requirements

- **Operating System**: Linux or macOS (Windows with WSL)
- **Docker**: Version 20.10 or higher
- **Docker Compose**: Version 2.0 or higher
- **Available RAM**: 2GB minimum (4GB recommended)
- **Disk Space**: 1GB minimum for application and database

## 🔐 Security Notes

- Always change default passwords in `.env` file
- Use strong JWT secret keys
- Regular backup your database
- Monitor logs for unusual activity
- Keep the container images updated

## 🌟 Features Covered

These documents cover setup and management of:

- ✅ SQLite database configuration
- ✅ Docker container permissions
- ✅ Database backup and recovery
- ✅ Migration management
- ✅ Performance optimization
- ✅ Troubleshooting common issues
- ✅ Health monitoring
- ✅ Log management

## 📝 Feedback

We welcome feedback on this documentation! Please let us know:

- What sections were most helpful
- What could be clearer
- What additional topics would be useful
- Any errors or outdated information

---

*MCP Context Forge Documentation - Last Updated: July 16, 2025*
