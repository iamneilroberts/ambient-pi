#!/bin/bash

# Navigate to project directory
cd "$(dirname "$0")"

echo "Setting up Ambient Pi..."

# Create necessary directories
echo "Creating required directories..."
mkdir -p logs
mkdir -p backend/logs
mkdir -p backend/photo-cache
mkdir -p backend/local-photos

# Install frontend dependencies with legacy peer deps
echo "Installing frontend dependencies..."
npm install --legacy-peer-deps

# Install backend dependencies
echo "Installing backend dependencies..."
cd backend
npm install
cd ..

# Create environment files if they don't exist
if [ ! -f .env ]; then
    echo "Creating frontend .env file..."
    cp .env.template .env
fi

if [ ! -f backend/.env ]; then
    echo "Creating backend .env file..."
    cp backend/.env.template backend/.env
fi

echo "Setup complete! Next steps:"
echo "1. Configure your environment variables in .env and backend/.env"
echo "2. Run ./start-ambient-pi.sh to start the application"
