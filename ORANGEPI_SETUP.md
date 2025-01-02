# Setting up Ambient Pi on OrangePi 800

This guide provides additional setup instructions specific to running Ambient Pi on an OrangePi 800 with Ubuntu.

## System Prerequisites

1. Install system dependencies:
```bash
sudo apt update
sudo apt install -y curl build-essential git
```

2. Install Node.js LTS (v18.x recommended for ARM64):
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

3. Verify installations:
```bash
node --version  # Should be v18.x
npm --version   # Should be v9.x or higher
```

## Display Configuration

1. Ensure X11 is installed and configured:
```bash
sudo apt install -y xserver-xorg x11-xserver-utils
```

2. If using a display manager (recommended), install lightdm:
```bash
sudo apt install -y lightdm
```

## Application Setup

1. Clone and setup the application:
```bash
git clone https://github.com/iamneilroberts/ambient-pi.git
cd ambient-pi
chmod +x setup.sh start-ambient-pi.sh
./setup.sh
```

2. Configure environment variables in `.env` and `backend/.env`

## Running as a System Service

1. Create a systemd service file:
```bash
sudo nano /etc/systemd/system/ambient-pi.service
```

2. Add the following content (adjust paths as needed):
```ini
[Unit]
Description=Ambient Pi Dashboard
After=network.target

[Service]
Type=simple
User=YOUR_USERNAME
WorkingDirectory=/home/YOUR_USERNAME/ambient-pi
ExecStart=/home/YOUR_USERNAME/ambient-pi/start-ambient-pi.sh
Restart=always
Environment=DISPLAY=:0
Environment=XAUTHORITY=/home/YOUR_USERNAME/.Xauthority

[Install]
WantedBy=graphical.target
```

3. Enable and start the service:
```bash
sudo systemctl enable ambient-pi
sudo systemctl start ambient-pi
```

## Troubleshooting

### Display Issues
- Ensure DISPLAY environment variable is set: `echo $DISPLAY`
- Check X11 is running: `ps aux | grep X`
- Verify permissions: `xhost +local:`

### Performance Optimization
- If experiencing performance issues, consider:
  1. Reducing the update frequency in display-config.js
  2. Disabling unused features in the configuration
  3. Adjusting browser cache settings
  4. Using PM2 for process management: `npm install -g pm2`

### Common Issues
1. **Black screen or no display**
   - Check X11 configuration
   - Verify DISPLAY environment variable
   - Ensure proper permissions for the user

2. **High CPU usage**
   - Monitor system resources: `top` or `htop`
   - Adjust update intervals in configuration
   - Consider disabling intensive features

3. **Network-related errors**
   - Verify network connectivity
   - Check API keys in environment files
   - Ensure proper DNS resolution

## Additional Notes

- The OrangePi 800 has sufficient processing power and memory for this application, but monitor resource usage during initial setup
- Consider using a dedicated user account for running the application
- Regular monitoring of logs in `logs/` and `backend/logs/` is recommended
- For optimal performance, consider running in production mode by building the frontend:
  ```bash
  npm run build
  ```
  And serving it with a production-grade web server like nginx
