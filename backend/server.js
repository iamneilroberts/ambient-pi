const path = require('path');
const dotenv = require('dotenv');
const loggingService = require('./utils/LoggingService');

// Load environment variables
const envPath = path.resolve(__dirname, '../.env');
loggingService.log('system', `Loading .env file from: ${envPath}`);
const result = dotenv.config({ path: envPath });
if (result.error) {
  loggingService.log('system', `Error loading .env file: ${result.error}`, 'error');
} else {
  loggingService.log('system', `Environment variables loaded. N2YO_API_KEY: ${process.env.N2YO_API_KEY ? 'Present' : 'Missing'}`);
}

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { promisify } = require('util');
const fs = require('fs').promises;
const os = require('os');
const { setupPhotoRoutes } = require('./services/photoService');
const { setupSpaceRoutes } = require('./services/spaceService');
const { setupStockRoutes } = require('./services/stockService');
const { setupFlightRoutes } = require('./services/flightRoutes');

const app = express();
const port = 3002;

// Import configuration
const { config } = require('../config.cjs');

// Enable CORS and trust proxy
app.use(cors());
app.use(express.json());
app.set('trust proxy', 1); // trust first proxy

// Logs endpoint
app.post('/api/logs', (req, res) => {
  const { timestamp, level, component, message } = req.body;
  loggingService.log(component, message, level.toLowerCase());
  res.json({ success: true });
});

// Setup routes
setupPhotoRoutes(app);
setupSpaceRoutes(app);
setupStockRoutes(app);
setupFlightRoutes(app);

// Serve photos directory statically
const photosPath = path.join(__dirname, '../photos');
loggingService.log('photos', `Serving photos from: ${photosPath}`);
app.use('/photos', express.static(photosPath));

// Function to read and parse CPU info
async function getCpuInfo() {
  try {
    const stat = await fs.readFile('/proc/stat', 'utf8');
    const lines = stat.trim().split('\n');
    const cpuLine = lines[0].split(' ').filter(Boolean);
    
    // CPU times
    const user = parseInt(cpuLine[1]);
    const nice = parseInt(cpuLine[2]);
    const system = parseInt(cpuLine[3]);
    const idle = parseInt(cpuLine[4]);
    const iowait = parseInt(cpuLine[5]);
    const irq = parseInt(cpuLine[6]);
    const softirq = parseInt(cpuLine[7]);
    
    const total = user + nice + system + idle + iowait + irq + softirq;
    const used = total - idle - iowait;
    
    return { total, used };
  } catch (error) {
    loggingService.log('system', `Error reading CPU info: ${error.message}`, 'error');
    return null;
  }
}

// Function to read CPU temperature
async function getCpuTemperature() {
  try {
    const temp = await fs.readFile('/sys/class/thermal/thermal_zone0/temp', 'utf8');
    return Math.round(parseInt(temp) / 1000);
  } catch (error) {
    loggingService.log('system', `Error reading CPU temperature: ${error.message}`, 'error');
    return null;
  }
}

// Function to read memory info
async function getMemoryInfo() {
  try {
    const meminfo = await fs.readFile('/proc/meminfo', 'utf8');
    const lines = meminfo.split('\n');
    const total = parseInt(lines[0].split(/\s+/)[1]) * 1024;  // Convert to bytes
    const free = parseInt(lines[1].split(/\s+/)[1]) * 1024;
    const available = parseInt(lines[2].split(/\s+/)[1]) * 1024;
    const used = total - available;
    
    return { total, used };
  } catch (error) {
    loggingService.log('system', `Error reading memory info: ${error.message}`, 'error');
    return null;
  }
}

// Function to read network info
async function getNetworkInfo() {
  try {
    const netstat = await fs.readFile('/proc/net/dev', 'utf8');
    const lines = netstat.split('\n');
    const networkInterface = lines.find(line => line.includes('eth0') || line.includes('wlan0'));
    
    if (networkInterface) {
      const values = networkInterface.split(/\s+/).filter(Boolean);
      return {
        rx_bytes: parseInt(values[1]),
        tx_bytes: parseInt(values[9])
      };
    }
    return null;
  } catch (error) {
    loggingService.log('system', `Error reading network info: ${error.message}`, 'error');
    return null;
  }
}

// Store last readings for delta calculations
let lastCpuInfo = null;
let lastNetworkInfo = null;
let lastUpdate = Date.now();

// Main stats endpoint
app.get('/api/stats', async (req, res) => {
  try {
    const currentTime = Date.now();
    const timeDelta = (currentTime - lastUpdate) / 1000; // Time difference in seconds
    lastUpdate = currentTime;

    // Get CPU usage
    const cpuInfo = await getCpuInfo();
    let cpuUsage = 0;
    
    if (lastCpuInfo && cpuInfo) {
      const totalDelta = cpuInfo.total - lastCpuInfo.total;
      const usedDelta = cpuInfo.used - lastCpuInfo.used;
      cpuUsage = Math.round((usedDelta / totalDelta) * 100);
    }
    lastCpuInfo = cpuInfo;

    // Get network rates
    const networkInfo = await getNetworkInfo();
    let networkRates = { rx: 0, tx: 0 };
    
    if (lastNetworkInfo && networkInfo) {
      networkRates = {
        rx: Math.round((networkInfo.rx_bytes - lastNetworkInfo.rx_bytes) / timeDelta / 1024 / 1024 * 100) / 100, // MB/s
        tx: Math.round((networkInfo.tx_bytes - lastNetworkInfo.tx_bytes) / timeDelta / 1024 / 1024 * 100) / 100  // MB/s
      };
    }
    lastNetworkInfo = networkInfo;

    // Get other stats
    const [cpuTemp, memoryInfo] = await Promise.all([
      getCpuTemperature(),
      getMemoryInfo()
    ]);

    res.json({
      cpu: {
        usage: cpuUsage || 0,
        temperature: cpuTemp || 0
      },
      memory: memoryInfo || { total: 0, used: 0 },
      network: networkRates
    });
  } catch (error) {
    loggingService.log('system', `Error collecting system stats: ${error.message}`, 'error');
    res.status(500).json({ error: 'Failed to collect system stats' });
  }
});

// Health check endpoints
app.get('/health', async (req, res) => {
  try {
    // Check if we can read system stats
    const cpuInfo = await getCpuInfo();
    const memoryInfo = await getMemoryInfo();
    if (!cpuInfo || !memoryInfo) {
      throw new Error('Unable to read system stats');
    }
    res.json({ status: 'ok' });
  } catch (error) {
    res.status(500).json({ status: 'error', error: error.message });
  }
});

app.get('/api/finance/health', async (req, res) => {
  try {
    // Try to fetch a test stock quote
    const response = await axios.get('https://www.alphavantage.co/query', {
      params: {
        function: 'GLOBAL_QUOTE',
        symbol: 'IBM',
        apikey: process.env.REACT_APP_ALPHA_VANTAGE_API_KEY
      }
    });
    if (response.data['Error Message']) {
      throw new Error(response.data['Error Message']);
    }
    res.json({ status: 'ok' });
  } catch (error) {
    res.status(500).json({ status: 'error', error: error.message });
  }
});

app.get('/api/flight/health', async (req, res) => {
  try {
    // Import the rate limiter from flight service
    const { rateLimiter } = require('./services/flightService');
    
    // Respect rate limiting
    await rateLimiter.throttle();
    
    // Try to connect to OpenSky API - just get time endpoint which is less demanding
    const response = await axios.get('https://opensky-network.org/api/time', {
      auth: {
        username: process.env.REACT_APP_OPENSKY_USERNAME,
        password: process.env.REACT_APP_OPENSKY_PASSWORD
      }
    });
    
    if (typeof response.data !== 'number') {
      throw new Error('Invalid response from OpenSky API');
    }
    res.json({ status: 'ok' });
  } catch (error) {
    if (error.response?.status === 429) {
      res.status(429).json({ status: 'rate-limited', error: 'Rate limit exceeded' });
    } else {
      res.status(500).json({ status: 'error', error: error.message });
    }
  }
});

app.get('/api/weather/health', async (req, res) => {
  try {
    // Try to fetch current weather data
    const response = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
      params: {
        lat: config.location.lat,
        lon: config.location.lon,
        appid: process.env.REACT_APP_OPENWEATHER_API_KEY,
        units: 'metric'
      }
    });
    if (!response.data) {
      throw new Error('Invalid response from OpenWeather API');
    }
    res.json({ status: 'ok' });
  } catch (error) {
    res.status(500).json({ status: 'error', error: error.message });
  }
});

app.get('/api/photos/health', async (req, res) => {
  try {
    // Check if we can access the photos directory
    await fs.access(photosPath, fs.constants.R_OK);
    res.json({ status: 'ok' });
  } catch (error) {
    res.status(500).json({ status: 'error', error: error.message });
  }
});

app.get('/api/space/health', async (req, res) => {
  try {
    // Try to fetch upcoming launches
    const response = await axios.get('https://lldev.thespacedevs.com/2.2.0/launch/upcoming/', {
      params: { limit: 1 }
    });
    
    if (!response.data) {
      throw new Error('Invalid response from Space API');
    }
    res.json({ status: 'ok' });
  } catch (error) {
    if (error.response?.status === 429) {
      res.status(429).json({ status: 'rate-limited', error: 'Rate limit exceeded' });
    } else {
      res.status(500).json({ status: 'error', error: error.message });
    }
  }
});

// Add logging middleware
app.use((req, res, next) => {
  loggingService.log('http', `${req.method} ${req.originalUrl}`);
  next();
});

// Error handling middleware
app.use((err, req, res, next) => {
  loggingService.log('http', `Error handling ${req.method} ${req.originalUrl}: ${err.message}`, 'error');
  loggingService.log('http', err.stack, 'error');
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: err.message
  });
});

// Start server
app.listen(port, () => {
  loggingService.log('system', `Backend server running on port ${port}`);
  const endpoints = [
    `Stats:     http://localhost:${port}/api/stats`,
    `Photos:    http://localhost:${port}/photos`,
    `Space:     http://localhost:${port}/api/space/test`,
    `Launches:  http://localhost:${port}/api/space/launches?limit=5`,
    `ISS:       http://localhost:${port}/api/space/iss/passes?lat=${config.location.lat}&lng=${config.location.lon}&days=5`,
    `Stock:     http://localhost:${port}/api/stock/quote?symbol=AAPL`,
    `History:   http://localhost:${port}/api/stock/history?symbol=AAPL`,
    `News:      http://localhost:${port}/api/stock/news?symbols=AAPL,MSFT`,
    `Flight:    http://localhost:${port}/api/flight/aircraft?lamin=30&lamax=31&lomin=-89&lomax=-88`
  ];
  loggingService.log('system', 'Available endpoints:\n' + endpoints.join('\n'));

  // Set up periodic cleanup (every 24 hours)
  const CLEANUP_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  setInterval(() => {
    loggingService.log('system', 'Running periodic cleanup...');
    const { execSync } = require('child_process');
    try {
      execSync('node ../scripts/cleanup-logs.js', { cwd: __dirname });
      loggingService.log('system', 'Periodic cleanup completed successfully');
    } catch (error) {
      loggingService.log('system', `Error during periodic cleanup: ${error.message}`, 'error');
    }
  }, CLEANUP_INTERVAL);
  
  // Run initial cleanup
  try {
    const { execSync } = require('child_process');
    execSync('node ../scripts/cleanup-logs.js', { cwd: __dirname });
    loggingService.log('system', 'Initial cleanup completed successfully');
  } catch (error) {
    loggingService.log('system', `Error during initial cleanup: ${error.message}`, 'error');
  }
});

// Cleanup on shutdown
process.on('SIGINT', () => {
  loggingService.log('system', 'Server shutting down...', 'info');
  process.exit(0);
});
