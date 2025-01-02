# Ambient Pi

A dashboard application displaying various ambient information including weather, finance, flights, and more.

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm (v7 or higher)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/iamneilroberts/ambient-pi.git
cd ambient-pi
```

2. Run the setup script:
```bash
chmod +x setup.sh
./setup.sh
```

The setup script will:
- Create necessary directories (logs, photo cache)
- Install frontend dependencies with legacy peer deps handling
- Install backend dependencies
- Create environment files from templates

3. Configure your environment:
- Edit `.env` with your frontend configuration
- Edit `backend/.env` with your backend configuration

### Starting the Application

The standard way to start the Ambient Pi application is using the provided startup script:

```bash
chmod +x start-ambient-pi.sh
./start-ambient-pi.sh
```

This script handles all necessary startup tasks:
- Checks for required dependencies and environment files
- Creates necessary directories if they don't exist
- Cleans up any existing processes on required ports (3001, 3002)
- Cleans up old logs and photo cache
- Starts the backend server (port 3002)
- Starts the frontend development server (port 3001)

The application will be available at:
- Frontend: http://localhost:3001
- Backend API: http://localhost:3002

### Troubleshooting

If you encounter dependency-related errors:
1. Make sure you've run `./setup.sh` first
2. Check that both `.env` and `backend/.env` files exist and are configured
3. Verify that the required directories exist:
   - `logs/`
   - `backend/logs/`
   - `backend/photo-cache/`
   - `backend/local-photos/`

### Development

When using Cline for development tasks, always use `./start-ambient-pi.sh` to start the application. This ensures both frontend and backend services are running correctly with proper initialization and cleanup.

## Features

[Rest of the README remains the same...]
