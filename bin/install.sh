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

# Install Canvas dependencies
echo "Installing Canvas dependencies..."
apt-get update
apt-get install -y \
    build-essential \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    pkg-config \
    python3

# Create application directory
echo "Creating application directory..."
mkdir -p $APP_DIR

# Copy application files
echo "Copying application files..."
cp -r . $APP_DIR/

# Make start script executable
chmod +x $APP_DIR/bin/start.sh

# Initial installation of dependencies
echo "Installing API dependencies..."
cd $APP_DIR/api
export NODE_OPTIONS="--max-old-space-size=512"
npm ci

echo "Installing UI dependencies and building..."
cd $APP_DIR/ui
npm ci
# Increase memory limit for Angular build and disable analytics
export NODE_OPTIONS="--max-old-space-size=512"
npx ng analytics off
npm run build -- --configuration production --aot --build-optimizer=false

# Create systemd service
echo "Creating systemd service..."
cat > /etc/systemd/system/${SERVICE_NAME}.service << EOL
[Unit]
Description=E-ink Display Service
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=${APP_DIR}
Environment=NODE_OPTIONS=--max-old-space-size=512
ExecStart=/bin/bash ${APP_DIR}/bin/start.sh
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
EOL

# Create log file and set permissions
touch /var/log/eink.log
chmod 644 /var/log/eink.log

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
echo "View logs with: tail -f /var/log/eink.log" 