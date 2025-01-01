#!/bin/bash

# =================================================================
# Ambient Pi Startup Script
# =================================================================
#
# This is the standard way to start the Ambient Pi application.
# It handles all necessary startup tasks including:
# - Cleaning up any existing processes on required ports (3001, 3002)
# - Cleaning up old logs and photo cache
# - Starting the backend server (port 3002)
# - Starting the frontend development server (port 3001)
#
# Usage:
#   ./start-ambient-pi.sh
#
# Note: This script should be run from the project root directory
# =================================================================

# First kill any existing processes on the ports
node scripts/cleanup-ports.js

# Clean up old logs and photo cache
node scripts/cleanup-logs.js

# Start the backend server (port 3002)
(cd backend && node server.js) &

# Wait a moment for backend server to initialize
sleep 2

# Start the frontend development server (port 3001)
npm run start
