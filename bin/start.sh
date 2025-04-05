#!/bin/bash

# Configuration
APP_DIR="/opt/eink"
LOG_FILE="/var/log/eink.log"

# Set Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=512"

# Function to log messages
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Change to app directory
cd $APP_DIR

# Try to update from git if .git directory exists
if [ -d ".git" ]; then
    log "Git repository detected, attempting to update..."
    if git pull origin main >> "$LOG_FILE" 2>&1; then
        log "Git pull successful"
        # Only update API dependencies if package.json has changed
        if git diff --name-only HEAD@{1} HEAD | grep -q "api/package.json"; then
            log "API package.json changed, updating dependencies..."
            cd $APP_DIR/api
            if npm ci --only=production >> "$LOG_FILE" 2>&1; then
                log "API dependencies updated successfully"
            else
                log "Failed to update API dependencies, continuing with existing modules"
            fi
        fi
    else
        log "Git pull failed, continuing with existing code"
    fi
else
    log "No git repository found, running from release package"
fi

# Start the server
log "Starting server..."
cd $APP_DIR/api
exec node dist/server.js 