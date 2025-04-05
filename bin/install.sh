#!/bin/bash

# Exit on error
set -e

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
  echo "Please run as root (sudo bash bin/install.sh)"
  exit 1
fi

# Configuration
APP_NAME="eink"
APP_DIR="/opt/eink"
SERVICE_NAME="eink"
NODE_VERSION="20"

# Install system dependencies
bash "$(dirname "$0")/install-deps.sh"

echo "Installing E-ink Display Service..."

# Create application directory
echo "Creating application directory..."
mkdir -p "$APP_DIR"

# Copy application files
echo "Copying application files..."
cp -r "$(dirname "$0")/.." "$APP_DIR"

# Create systemd service
echo "Creating systemd service..."
cat > /etc/systemd/system/eink.service << EOL
[Unit]
Description=E-ink Display Service
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/eink
ExecStart=/bin/bash /opt/eink/bin/start.sh
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOL

# Set permissions
echo "Setting permissions..."
chmod +x "$APP_DIR/bin/start.sh"
chmod +x "$APP_DIR/bin/install-deps.sh"

# Create log file
touch /var/log/eink.log
chmod 644 /var/log/eink.log

# Reload systemd and enable service
echo "Enabling service..."
systemctl daemon-reload
systemctl enable eink
systemctl start eink

echo "Installation complete! The service is now running."
echo "You can check the status with: systemctl status eink"
echo "View logs with: journalctl -u eink -f" 