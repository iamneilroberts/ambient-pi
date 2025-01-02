#!/bin/bash

# =================================================================
# Ambient Pi Startup Script
# =================================================================
#
# This is the standard way to start the Ambient Pi application.
# It handles all necessary startup tasks including:
# - Checking for required dependencies
# - Creating necessary directories
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

# Function to check dependencies and system requirements
check_dependencies() {
    # Check Node.js version
    if ! command -v node &> /dev/null; then
        echo "Node.js not found. Please follow installation instructions in ORANGEPI_SETUP.md"
        exit 1
    fi
    
    node_version=$(node -v | cut -d. -f1 | tr -d 'v')
    if [ "$node_version" -lt 16 ]; then
        echo "Node.js version 16 or higher is required. Current version: $(node -v)"
        echo "Please upgrade Node.js following instructions in ORANGEPI_SETUP.md"
        exit 1
    fi

    # Check npm version
    npm_version=$(npm -v | cut -d. -f1)
    if [ "$npm_version" -lt 7 ]; then
        echo "npm version 7 or higher is required. Current version: $(npm -v)"
        echo "Please upgrade npm following instructions in ORANGEPI_SETUP.md"
        exit 1
    fi

    # Check for node_modules
    if [ ! -d "node_modules" ]; then
        echo "Frontend dependencies not found. Please run ./setup.sh first."
        exit 1
    fi
    if [ ! -d "backend/node_modules" ]; then
        echo "Backend dependencies not found. Please run ./setup.sh first."
        exit 1
    fi

    # Check display environment
    if [ -z "$DISPLAY" ]; then
        echo "Warning: DISPLAY environment variable not set"
        echo "Setting DISPLAY=:0"
        export DISPLAY=:0
    fi
}

# Function to ensure required directories exist and set permissions
ensure_directories() {
    mkdir -p logs
    mkdir -p backend/logs
    mkdir -p backend/photo-cache
    mkdir -p backend/local-photos

    # Set proper permissions
    chmod 755 logs backend/logs
    chmod 755 backend/photo-cache backend/local-photos
}

# Function to check if environment files exist
check_env_files() {
    if [ ! -f .env ]; then
        echo "Frontend .env file not found. Please copy .env.template to .env and configure it."
        exit 1
    fi
    if [ ! -f backend/.env ]; then
        echo "Backend .env file not found. Please copy backend/.env.template to backend/.env and configure it."
        exit 1
    fi
}

# Run pre-flight checks
echo "Running pre-flight checks..."
check_dependencies
check_env_files
ensure_directories

# First kill any existing processes on the ports
echo "Cleaning up ports..."
node scripts/cleanup-ports.js

# Clean up old logs and photo cache
echo "Cleaning up logs..."
node scripts/cleanup-logs.js

# Start the backend server (port 3002)
echo "Starting backend server..."
(cd backend && node server.js) &
BACKEND_PID=$!

# Wait a moment for backend server to initialize
echo "Waiting for backend to initialize..."
sleep 2

# Start the frontend development server (port 3001)
echo "Starting frontend server..."
npm run start

# If frontend exits, kill the backend
kill $BACKEND_PID
