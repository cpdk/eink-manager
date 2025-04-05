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

# Try to update from git
log "Attempting to update from git..."
if git pull origin main >> "$LOG_FILE" 2>&1; then
    log "Git pull successful"
else
    log "Git pull failed, continuing with existing code"
fi

# Try to update API dependencies
log "Updating API dependencies..."
cd $APP_DIR/api
if npm ci >> "$LOG_FILE" 2>&1; then
    log "API dependencies updated successfully"
else
    log "Failed to update API dependencies, continuing with existing modules"
fi

# Try to update UI dependencies and rebuild
log "Updating UI dependencies..."
cd $APP_DIR/ui
if npm ci >> "$LOG_FILE" 2>&1; then
    log "UI dependencies updated successfully"
    if npm run build -- --configuration production --aot --build-optimizer=false >> "$LOG_FILE" 2>&1; then
        log "UI built successfully"
    else
        log "UI build failed, continuing with existing build"
    fi
else
    log "Failed to update UI dependencies, continuing with existing modules"
fi

# Start the server
log "Starting server..."
cd $APP_DIR/api
exec node dist/server.js 