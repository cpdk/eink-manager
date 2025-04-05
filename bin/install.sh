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

echo "Installing E-ink Display Service..."

# Install Node.js if not present
if ! command -v node &> /dev/null; then
    echo "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
    apt-get install -y nodejs
fi

# Create application directory
echo "Creating application directory..."
mkdir -p $APP_DIR

# Copy application files
echo "Copying application files..."
cp -r . $APP_DIR/

# Install API dependencies
echo "Installing API dependencies..."
cd $APP_DIR/api
npm ci

# Install UI dependencies and build
echo "Installing UI dependencies and building..."
cd $APP_DIR/ui
npm ci
npm run build

# Create systemd service
echo "Creating systemd service..."
cat > /etc/systemd/system/${SERVICE_NAME}.service << EOL
[Unit]
Description=E-ink Display Service
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=${APP_DIR}/api
ExecStart=/usr/bin/node dist/server.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
EOL

# Reload systemd
echo "Reloading systemd..."
systemctl daemon-reload

# Enable and start service
echo "Enabling and starting service..."
systemctl enable ${SERVICE_NAME}
systemctl start ${SERVICE_NAME}

echo "Installation complete!"
echo "The service is now running at http://localhost:3000"
echo "You can check the service status with: systemctl status ${SERVICE_NAME}" 