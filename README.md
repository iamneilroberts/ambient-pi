# Ambient Pi

A dashboard application displaying various ambient information including weather, finance, flights, and more.

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm (v7 or higher)

### Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
cd backend && npm install
```

### Starting the Application

The standard way to start the Ambient Pi application is using the provided startup script:

```bash
./start-ambient-pi.sh
```

This script handles all necessary startup tasks:
- Cleans up any existing processes on required ports (3001, 3002)
- Cleans up old logs and photo cache
- Starts the backend server (port 3002)
- Starts the frontend development server (port 3001)

The application will be available at:
- Frontend: http://localhost:3001
- Backend API: http://localhost:3002

### Development

When using Cline for development tasks, always use `./start-ambient-pi.sh` to start the application. This ensures both frontend and backend services are running correctly with proper initialization and cleanup.

## Features

- Weather Dashboard: Real-time weather information and forecasts
- Finance Dashboard: Stock market data and financial news
- Flight Tracker: Live aircraft tracking
- Space Information: Space launches and ISS tracking
- Photo Frame: Dynamic photo display

## Project Structure

```
ambient-pi/
├── backend/                 # Backend server implementation
│   ├── config/             # Backend configuration files
│   ├── services/           # Service implementations (weather, finance, etc.)
│   └── utils/              # Backend utilities
├── src/                    # Frontend React application
│   ├── components/         # React components
│   │   ├── finance/       # Finance dashboard components
│   │   ├── flight/        # Flight tracking components
│   │   └── weather/       # Weather dashboard components
│   ├── config/            # Frontend configuration
│   └── utils/             # Frontend utilities
├── scripts/                # Utility scripts for maintenance
├── logs/                   # Application logs
└── public/                # Static assets
```

## Configuration

The application uses several configuration files:

- `.env` - Environment variables for the frontend (copy from .env.template)
- `backend/.env` - Environment variables for the backend
- `src/config/display-config.js` - Frontend display configuration
- `backend/config/display-config.js` - Backend service configuration

### Required API Keys

The application requires several API keys to function. Copy `.env.template` to `.env` and fill in your API keys:

1. N2YO API Key (Space tracking)
   - Get from: https://www.n2yo.com/api/
   - Used for: Satellite and ISS tracking

2. OpenWeather API Key
   - Get from: https://openweathermap.org/api
   - Used for: Weather data and forecasts

3. Alpha Vantage API Key
   - Get from: https://www.alphavantage.co/
   - Used for: Stock market data

4. OpenSky Credentials
   - Register at: https://opensky-network.org/
   - Used for: Flight tracking

Optional API keys (features will be disabled if not provided):
- Marine Traffic API Key (ship tracking)
- Railroad Live API Key (train tracking)
- Pi-hole API Key (network statistics)

## Servers and Ports

The application runs multiple servers:

1. Frontend Development Server
   - Port: 3001
   - Main application interface
   - React development server with hot reloading

2. Backend API Server
   - Port: 3002
   - Handles data fetching and processing
   - Provides REST APIs for frontend components

## Component Testing

Individual components can be tested by launching them directly with the display parameter:

```
http://localhost:3001/?display=finance    # Test finance dashboard
http://localhost:3001/?display=weather    # Test weather dashboard
http://localhost:3001/?display=flight     # Test flight tracker
```

This allows for isolated testing and development of specific components.

## Maintenance Scripts

The project includes several utility scripts:

- `start-ambient-pi.sh` - Main startup script
- `scripts/cleanup-ports.js` - Cleans up processes on required ports
- `scripts/cleanup-logs.js` - Manages log rotation
- `scripts/get-google-photos-token.js` - Handles photo service authentication
