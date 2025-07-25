#!/bin/bash

# MongoDB Backup Script
# This script creates backups of the MongoDB database

set -e  # Exit on any error

# Configuration
BACKUP_DIR="/var/backups/mongodb"
DB_NAME="mern-deployment-app"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="${DB_NAME}_${TIMESTAMP}"
RETENTION_DAYS=7

# MongoDB connection details
MONGO_HOST=${MONGO_HOST:-"localhost"}
MONGO_PORT=${MONGO_PORT:-"27017"}
MONGO_USER=${MONGO_USER:-"admin"}
MONGO_PASS=${MONGO_PASS:-"password123"}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Create backup directory if it doesn't exist
create_backup_dir() {
    if [ ! -d "$BACKUP_DIR" ]; then
        log_info "Creating backup directory: $BACKUP_DIR"
        mkdir -p "$BACKUP_DIR"
    fi
}

# Create MongoDB backup
create_backup() {
    log_info "Starting MongoDB backup..."
    
    # Check if mongodump is available
    if ! command -v mongodump &> /dev/null; then
        log_error "mongodump is not installed. Please install MongoDB tools."
        exit 1
    fi
    
    # Create backup
    log_info "Creating backup: $BACKUP_NAME"
    
    if [ -n "$MONGO_USER" ] && [ -n "$MONGO_PASS" ]; then
        mongodump \
            --host "$MONGO_HOST:$MONGO_PORT" \
            --username "$MONGO_USER" \
            --password "$MONGO_PASS" \
            --authenticationDatabase admin \
            --db "$DB_NAME" \
            --out "$BACKUP_DIR/$BACKUP_NAME"
    else
        mongodump \
            --host "$MONGO_HOST:$MONGO_PORT" \
            --db "$DB_NAME" \
            --out "$BACKUP_DIR/$BACKUP_NAME"
    fi
    
    if [ $? -eq 0 ]; then
        log_info "Backup created successfully: $BACKUP_DIR/$BACKUP_NAME"
        
        # Compress backup
        log_info "Compressing backup..."
        cd "$BACKUP_DIR"
        tar -czf "${BACKUP_NAME}.tar.gz" "$BACKUP_NAME"
        rm -rf "$BACKUP_NAME"
        
        log_info "Backup compressed: ${BACKUP_NAME}.tar.gz"
    else
        log_error "Backup failed!"
        exit 1
    fi
}

# Clean old backups
cleanup_old_backups() {
    log_info "Cleaning up old backups (older than $RETENTION_DAYS days)..."
    
    find "$BACKUP_DIR" -name "${DB_NAME}_*.tar.gz" -type f -mtime +$RETENTION_DAYS -delete
    
    log_info "Old backups cleaned up."
}

# Restore from backup
restore_backup() {
    local backup_file="$1"
    
    if [ -z "$backup_file" ]; then
        log_error "Please specify a backup file to restore."
        echo "Usage: $0 restore <backup_file>"
        echo "Available backups:"
        ls -la "$BACKUP_DIR"/${DB_NAME}_*.tar.gz 2>/dev/null || echo "No backups found."
        exit 1
    fi
    
    if [ ! -f "$backup_file" ]; then
        log_error "Backup file not found: $backup_file"
        exit 1
    fi
    
    log_warn "This will replace the current database. Are you sure? (y/N)"
    read -r response
    if [[ ! "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        log_info "Restore cancelled."
        exit 0
    fi
    
    log_info "Restoring from backup: $backup_file"
    
    # Extract backup
    temp_dir=$(mktemp -d)
    tar -xzf "$backup_file" -C "$temp_dir"
    
    # Check if mongorestore is available
    if ! command -v mongorestore &> /dev/null; then
        log_error "mongorestore is not installed. Please install MongoDB tools."
        exit 1
    fi
    
    # Restore backup
    if [ -n "$MONGO_USER" ] && [ -n "$MONGO_PASS" ]; then
        mongorestore \
            --host "$MONGO_HOST:$MONGO_PORT" \
            --username "$MONGO_USER" \
            --password "$MONGO_PASS" \
            --authenticationDatabase admin \
            --db "$DB_NAME" \
            --drop \
            "$temp_dir"/*/"$DB_NAME"
    else
        mongorestore \
            --host "$MONGO_HOST:$MONGO_PORT" \
            --db "$DB_NAME" \
            --drop \
            "$temp_dir"/*/"$DB_NAME"
    fi
    
    if [ $? -eq 0 ]; then
        log_info "Database restored successfully from: $backup_file"
    else
        log_error "Restore failed!"
        exit 1
    fi
    
    # Cleanup temp directory
    rm -rf "$temp_dir"
}

# List available backups
list_backups() {
    log_info "Available backups:"
    ls -la "$BACKUP_DIR"/${DB_NAME}_*.tar.gz 2>/dev/null || log_warn "No backups found."
}

# Verify backup integrity
verify_backup() {
    local backup_file="$1"
    
    if [ -z "$backup_file" ]; then
        log_error "Please specify a backup file to verify."
        exit 1
    fi
    
    if [ ! -f "$backup_file" ]; then
        log_error "Backup file not found: $backup_file"
        exit 1
    fi
    
    log_info "Verifying backup: $backup_file"
    
    # Check if tar file is valid
    if tar -tzf "$backup_file" > /dev/null 2>&1; then
        log_info "Backup file is valid."
    else
        log_error "Backup file is corrupted!"
        exit 1
    fi
}

# Main function
main() {
    case "${1:-backup}" in
        "backup")
            create_backup_dir
            create_backup
            cleanup_old_backups
            ;;
        "restore")
            restore_backup "$2"
            ;;
        "list")
            list_backups
            ;;
        "verify")
            verify_backup "$2"
            ;;
        "cleanup")
            cleanup_old_backups
            ;;
        *)
            echo "Usage: $0 [backup|restore|list|verify|cleanup] [backup_file]"
            echo "  backup: Create a new backup (default)"
            echo "  restore <file>: Restore from backup file"
            echo "  list: List available backups"
            echo "  verify <file>: Verify backup file integrity"
            echo "  cleanup: Remove old backups"
            exit 1
            ;;
    esac
    
    log_info "Operation completed successfully!"
}

# Run main function
main "$@"