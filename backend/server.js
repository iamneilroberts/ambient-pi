const path = require('path');
const dotenv = require('dotenv');
const loggingService = require('./utils/LoggingService');

// Load environment variables
const envPath = path.resolve(__dirname, '.env');
loggingService.log('system', `Loading .env file from: ${envPath}`);
loggingService.log('system', `File exists: ${require('fs').existsSync(envPath)}`);

if (require('fs').existsSync(envPath)) {
  const envContent = require('fs').readFileSync(envPath, 'utf8');
  loggingService.log('system', `Env file content: ${envContent}`);
}

const result = dotenv.config({ path: envPath, override: true });
if (result.error) {
  loggingService.log('system', `Error loading .env file: ${result.error}`, 'error');
  // Try loading from parent directory
  const parentEnvPath = path.resolve(__dirname, '../.env');
  loggingService.log('system', `Trying parent .env file: ${parentEnvPath}`);
  loggingService.log('system', `Parent file exists: ${require('fs').existsSync(parentEnvPath)}`);
  
  if (require('fs').existsSync(parentEnvPath)) {
    const parentEnvContent = require('fs').readFileSync(parentEnvPath, 'utf8');
    loggingService.log('system', `Parent env file content: ${parentEnvContent}`);
  }
  
  const parentResult = dotenv.config({ path: parentEnvPath, override: true });
  if (parentResult.error) {
    loggingService.log('system', `Error loading parent .env file: ${parentResult.error}`, 'error');
  }
}

// Force set environment variables from .env file
try {
  const envContent = require('fs').readFileSync(envPath, 'utf8');
  const envLines = envContent.split('\n');
  for (const line of envLines) {
    if (line && !line.startsWith('#')) {
      const [key, value] = line.split('=');
      if (key && value) {
        const trimmedKey = key.trim();
        const trimmedValue = value.trim();
        process.env[trimmedKey] = trimmedValue;
        
        // Map backend env vars to frontend format
        if (trimmedKey === 'OPENWEATHER_API_KEY') {
          process.env.REACT_APP_OPENWEATHER_API_KEY = trimmedValue;
        }
      }
    }
  }
} catch (error) {
  loggingService.log('system', `Error manually loading .env: ${error.message}`, 'error');
}

// Log all environment variables we care about
loggingService.log('system', 'Environment variables status:');
loggingService.log('system', `N2YO_API_KEY: ${process.env.N2YO_API_KEY ? 'Present' : 'Missing'}`);
loggingService.log('system', `OPENWEATHER_API_KEY: ${process.env.OPENWEATHER_API_KEY ? 'Present' : 'Missing'} (${process.env.OPENWEATHER_API_KEY || 'undefined'})`);
loggingService.log('system', `ALPHA_VANTAGE_API_KEY: ${process.env.ALPHA_VANTAGE_API_KEY ? 'Present' : 'Missing'}`);
loggingService.log('system', `OPENSKY_USERNAME: ${process.env.OPENSKY_USERNAME ? 'Present' : 'Missing'}`);

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
const { setupWeatherRoutes } = require('./services/weatherRoutes');
const { setupCalendarRoutes } = require('./services/calendarRoutes');

const app = express();
const port = 3002;

// Import configuration
const { config } = require('../config.cjs');

// Enable CORS and trust proxy
app.use(cors());
app.use(express.json());
app.set('trust proxy', 1); // trust first proxy

// Add logging middleware
app.use((req, res, next) => {
  loggingService.log('http', `${req.method} ${req.originalUrl}`);
  next();
});

// Debug endpoint for environment variables
app.get('/api/debug/env', (req, res) => {
  loggingService.log('system', 'Debug endpoint accessed');
  const envVars = {
    OPENWEATHER_API_KEY: process.env.OPENWEATHER_API_KEY || 'missing',
    N2YO_API_KEY: process.env.N2YO_API_KEY || 'missing',
    ALPHA_VANTAGE_API_KEY: process.env.ALPHA_VANTAGE_API_KEY || 'missing',
    NODE_ENV: process.env.NODE_ENV || 'missing'
  };
  loggingService.log('system', `Environment variables: ${JSON.stringify(envVars)}`);
  res.json(envVars);
});

// Logs endpoints
app.post('/api/logs', (req, res) => {
  const { timestamp, level, component, message } = req.body;
  loggingService.log(component, message, level.toLowerCase());
  res.json({ success: true });
});

app.get('/api/logs', (req, res) => {
  try {
    // Get the last 100 logs
    const logs = loggingService.getRecentLogs(100);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve logs' });
  }
});

// Setup routes
setupPhotoRoutes(app);
setupSpaceRoutes(app);
setupStockRoutes(app);
setupFlightRoutes(app);
setupWeatherRoutes(app);
setupCalendarRoutes(app);

// Serve photos directory statically
const photosPath = path.join(__dirname, '../photos');
loggingService.log('photos', `Serving photos from: ${photosPath}`);
app.use('/photos', express.static(photosPath));

// Function to read and parse CPU info
async function getCpuInfo() {
  try {
    // Read CPU stats
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

    // Read CPU info
    const cpuinfo = await fs.readFile('/proc/cpuinfo', 'utf8');
    const cpuinfoLines = cpuinfo.split('\n');
    const cores = cpuinfoLines.filter(line => line.includes('processor')).length;
    const speedLine = cpuinfoLines.find(line => line.includes('cpu MHz'));
    const speed = speedLine ? parseFloat(speedLine.split(':')[1].trim()) / 1000 : null;
    const brandLine = cpuinfoLines.find(line => line.includes('model name'));
    const brand = brandLine ? brandLine.split(':')[1].trim() : 'Unknown CPU';
    
    return { total, used, cores, speed, brand };
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
    const getValue = (key) => {
      const line = lines.find(l => l.startsWith(key));
      return line ? parseInt(line.split(/\s+/)[1]) * 1024 : 0; // Convert to bytes
    };

    const total = getValue('MemTotal:');
    const free = getValue('MemFree:');
    const available = getValue('MemAvailable:');
    const swapTotal = getValue('SwapTotal:');
    const swapFree = getValue('SwapFree:');
    
    return {
      total,
      used: total - available,
      swapTotal,
      swapUsed: swapTotal - swapFree
    };
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

// Cache and last readings
const cache = {
  stats: null,
  lastUpdate: Date.now(),
  lastCpuInfo: null,
  lastNetworkInfo: null,
  cacheTimeout: 5000 // 5 seconds cache
};

// Timeout wrapper for promises
const timeoutPromise = (promise, ms) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Operation timed out')), ms)
    )
  ]);
};

// Function to get drive stats with timeout
async function getDriveStats() {
  try {
    const cmd = "df -B1 / /boot 2>/dev/null || df -B1 / 2>/dev/null"; // Only check root and boot partitions
    const { stdout } = await timeoutPromise(
      promisify(require('child_process').exec)(cmd),
      2000
    );
    const lines = stdout.trim().split('\n').slice(1); // Skip header
    return lines.map(line => {
      const [filesystem, size, used, available, usePercent, mount] = line.split(/\s+/);
      return {
        filesystem,
        size: parseInt(size),
        used: parseInt(used),
        available: parseInt(available),
        usePercent: parseInt(usePercent),
        mount
      };
    });
  } catch (error) {
    loggingService.log('system', `Error getting drive stats: ${error.message}`, 'error');
    return [];
  }
}

// Cache for top processes
let processCache = {
  data: [],
  lastUpdate: 0,
  timeout: 10000 // 10 second cache for processes
};

// Function to get top processes
async function getTopProcesses() {
  try {
    const now = Date.now();
    if (processCache.data.length && (now - processCache.lastUpdate) < processCache.timeout) {
      return processCache.data;
    }

    const { stdout } = await promisify(require('child_process').exec)('ps -eo pid,ppid,cmd,%mem,%cpu --sort=-%cpu | head -n 6');
    const lines = stdout.trim().split('\n').slice(1); // Skip header
    processCache.data = lines.map(line => {
      const [pid, ppid, cmd, mem, cpu] = line.trim().split(/\s+/);
      return {
        pid: parseInt(pid),
        ppid: parseInt(ppid),
        name: cmd.split('/').pop(),
        mem: parseFloat(mem),
        cpu: parseFloat(cpu)
      };
    });
    processCache.lastUpdate = now;
    return processCache.data;
  } catch (error) {
    loggingService.log('system', `Error getting top processes: ${error.message}`, 'error');
    return processCache.data.length ? processCache.data : [];
  }
}

// Main stats endpoint
app.get('/api/stats', async (req, res) => {
  try {
    const currentTime = Date.now();
    
    // Return cached data if available and fresh
    if (cache.stats && (currentTime - cache.lastUpdate) < cache.cacheTimeout) {
      return res.json(cache.stats);
    }

    const timeDelta = (currentTime - cache.lastUpdate) / 1000; // Time difference in seconds
    cache.lastUpdate = currentTime;

    // Get all stats in parallel with individual timeouts
    const [
      cpuInfo,
      cpuTemp,
      memoryInfo,
      networkInfo,
      driveStats,
      processes
    ] = await Promise.all([
      timeoutPromise(getCpuInfo(), 1000).catch(err => {
        loggingService.log('system', `CPU info error: ${err.message}`, 'error');
        return null;
      }),
      timeoutPromise(getCpuTemperature(), 1000).catch(err => {
        loggingService.log('system', `CPU temp error: ${err.message}`, 'error');
        return null;
      }),
      timeoutPromise(getMemoryInfo(), 1000).catch(err => {
        loggingService.log('system', `Memory info error: ${err.message}`, 'error');
        return null;
      }),
      timeoutPromise(getNetworkInfo(), 1000).catch(err => {
        loggingService.log('system', `Network info error: ${err.message}`, 'error');
        return null;
      }),
      timeoutPromise(getDriveStats(), 2000).catch(err => {
        loggingService.log('system', `Drive stats error: ${err.message}`, 'error');
        return [];
      }),
      timeoutPromise(getTopProcesses(), 2000).catch(err => {
        loggingService.log('system', `Process list error: ${err.message}`, 'error');
        return [];
      })
    ]);

    // Calculate CPU usage
    let cpuUsage = 0;
    if (cache.lastCpuInfo && cpuInfo) {
      const totalDelta = cpuInfo.total - cache.lastCpuInfo.total;
      const usedDelta = cpuInfo.used - cache.lastCpuInfo.used;
      cpuUsage = Math.round((usedDelta / totalDelta) * 100);
    }
    cache.lastCpuInfo = cpuInfo;

    // Calculate network rates
    let networkRates = { rx: 0, tx: 0 };
    if (cache.lastNetworkInfo && networkInfo) {
      networkRates = {
        rx: Math.round((networkInfo.rx_bytes - cache.lastNetworkInfo.rx_bytes) / timeDelta / 1024 / 1024 * 100) / 100, // MB/s
        tx: Math.round((networkInfo.tx_bytes - cache.lastNetworkInfo.tx_bytes) / timeDelta / 1024 / 1024 * 100) / 100  // MB/s
      };
    }
    cache.lastNetworkInfo = networkInfo;

    // Cache and return the stats
    cache.stats = {
      cpu: {
        usage: cpuUsage || 0,
        temperature: cpuTemp || 0,
        cores: cpuInfo?.cores || 0,
        speed: cpuInfo?.speed || 0,
        brand: cpuInfo?.brand || 'Unknown CPU'
      },
      memory: memoryInfo || { total: 0, used: 0, swapTotal: 0, swapUsed: 0 },
      network: networkRates,
      drives: driveStats || [],
      processes: processes || []
    };
    
    res.json(cache.stats);
  } catch (error) {
    loggingService.log('system', `Error collecting system stats: ${error.message}`, 'error');
    res.status(500).json({ error: 'Failed to collect system stats' });
  }
});

// Health check endpoints
app.get('/api/health', async (req, res) => {
  try {
    const [
      systemHealth,
      financeHealth,
      flightHealth,
      weatherHealth,
      photosHealth,
      spaceHealth
    ] = await Promise.all([
      // System health
      (async () => {
        try {
          const cpuInfo = await getCpuInfo();
          const memoryInfo = await getMemoryInfo();
          if (!cpuInfo || !memoryInfo) {
            throw new Error('Unable to read system stats');
          }
          return { status: 'ok' };
        } catch (error) {
          return { status: 'error', error: error.message };
        }
      })(),
      
      // Finance health
      (async () => {
        try {
          const stockService = require('./services/stockService');
          
          const response = await axios.get('https://www.alphavantage.co/query', {
            params: {
              function: 'GLOBAL_QUOTE',
              symbol: 'IBM',
              apikey: process.env.ALPHA_VANTAGE_API_KEY || process.env.REACT_APP_ALPHA_VANTAGE_API_KEY
            }
          });
          
          if (response.data['Error Message']) {
            throw new Error(response.data['Error Message']);
          }
          
          // Get remaining API calls (Alpha Vantage has a limit of 500/day)
          const quotesRemaining = stockService.getRemainingQuotes ? 
            await stockService.getRemainingQuotes() : 
            'Unknown';
          
          return {
            status: 'ok',
            details: {
              quotesRemaining: quotesRemaining,
              lastUpdate: new Date().toISOString()
            }
          };
        } catch (error) {
          return { 
            status: 'error', 
            error: error.message,
            details: {
              quotesRemaining: 'Unknown',
              lastUpdate: new Date().toISOString()
            }
          };
        }
      })(),
      
      // Flight health
      (async () => {
        try {
          const flightService = require('./services/flightService');
          const { rateLimiter } = flightService;
          
          // Get rate limit status
          const rateLimit = rateLimiter.getRemainingRequests();
          
          const response = await axios.get('https://opensky-network.org/api/time', {
            auth: {
              username: process.env.REACT_APP_OPENSKY_USERNAME,
              password: process.env.REACT_APP_OPENSKY_PASSWORD
            }
          });
          
          if (typeof response.data !== 'number') {
            throw new Error('Invalid response from OpenSky API');
          }
          
          return {
            status: 'ok',
            details: {
              rateLimit: `${rateLimit}/500`,
              lastUpdate: new Date().toISOString()
            }
          };
        } catch (error) {
          if (error.response?.status === 429) {
            return {
              status: 'rate-limited',
              error: 'Rate limit exceeded',
              details: {
                rateLimit: '0/500',
                lastUpdate: new Date().toISOString()
              }
            };
          }
          return {
            status: 'error',
            error: error.message,
            details: {
              rateLimit: 'Unknown',
              lastUpdate: new Date().toISOString()
            }
          };
        }
      })(),
      
      // Weather health
      (async () => {
        try {
          const weatherService = require('./services/weatherService');
          const weatherCacheService = require('./services/weatherCacheService');
          
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

          // Get cache status
          const cacheStatus = weatherCacheService.get('weather', {
            lat: config.location.lat,
            lon: config.location.lon
          });

          return {
            status: 'ok',
            details: {
              provider: weatherService.config.hasOpenWeatherKey ? 'OpenWeather' : 'NWS',
              cacheStatus: cacheStatus ? (cacheStatus.isStale ? 'Stale' : 'Fresh') : 'Empty',
              lastUpdate: cacheStatus ? cacheStatus.timestamp : null
            }
          };
        } catch (error) {
          return { 
            status: 'error', 
            error: error.message,
            details: {
              provider: 'Unknown',
              cacheStatus: 'Error',
              lastUpdate: null
            }
          };
        }
      })(),
      
      // Photos health
      (async () => {
        try {
          await fs.access(photosPath, fs.constants.R_OK);
          
          // Count photos in directory
          const files = await fs.readdir(photosPath);
          const photoCount = files.filter(file => 
            file.toLowerCase().endsWith('.jpg') || 
            file.toLowerCase().endsWith('.jpeg') || 
            file.toLowerCase().endsWith('.png')
          ).length;
          
          return {
            status: 'ok',
            details: {
              photoCount: `${photoCount} photos`,
              lastUpdate: new Date().toISOString()
            }
          };
        } catch (error) {
          return {
            status: 'error',
            error: error.message,
            details: {
              photoCount: 'Unknown',
              lastUpdate: new Date().toISOString()
            }
          };
        }
      })(),
      
      // Space health
      (async () => {
        try {
          const response = await axios.get('https://lldev.thespacedevs.com/2.2.0/launch/upcoming/', {
            params: { limit: 1 }
          });
          if (!response.data) {
            throw new Error('Invalid response from Space API');
          }
          
          const nextLaunch = response.data.results[0]?.name || 'Unknown';
          
          return {
            status: 'ok',
            details: {
              nextLaunch,
              lastUpdate: new Date().toISOString()
            }
          };
        } catch (error) {
          if (error.response?.status === 429) {
            return {
              status: 'rate-limited',
              error: 'Rate limit exceeded',
              details: {
                nextLaunch: 'Unknown',
                lastUpdate: new Date().toISOString()
              }
            };
          }
          return {
            status: 'error',
            error: error.message,
            details: {
              nextLaunch: 'Unknown',
              lastUpdate: new Date().toISOString()
            }
          };
        }
      })()
    ]);

    res.json({
      system: systemHealth,
      finance: financeHealth,
      flight: flightHealth,
      weather: weatherHealth,
      photos: photosHealth,
      space: spaceHealth
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to check health' });
  }
});

// Individual health check endpoints for direct component testing
app.get('/api/system/health', async (req, res) => {
  try {
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
        apikey: process.env.ALPHA_VANTAGE_API_KEY || process.env.REACT_APP_ALPHA_VANTAGE_API_KEY
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
    
    // Get rate limit status
    const rateLimit = rateLimiter.getRemainingRequests();
    
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
    
    res.json({
      status: 'ok',
      details: {
        rateLimit: `${rateLimit}/500`,
        lastUpdate: new Date().toISOString()
      }
    });
  } catch (error) {
    if (error.response?.status === 429) {
      res.status(429).json({
        status: 'rate-limited',
        error: 'Rate limit exceeded',
        details: {
          rateLimit: '0/500',
          lastUpdate: new Date().toISOString()
        }
      });
    } else {
      res.status(500).json({
        status: 'error',
        error: error.message,
        details: {
          rateLimit: 'Unknown',
          lastUpdate: new Date().toISOString()
        }
      });
    }
  }
});

app.get('/api/weather/health', async (req, res) => {
  try {
    const weatherService = require('./services/weatherService');
    const weatherCacheService = require('./services/weatherCacheService');
    
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

    // Get cache status
    const cacheStatus = weatherCacheService.get('weather', {
      lat: config.location.lat,
      lon: config.location.lon
    });

    res.json({
      status: 'ok',
      details: {
        provider: weatherService.config.hasOpenWeatherKey ? 'OpenWeather' : 'NWS',
        cacheStatus: cacheStatus ? (cacheStatus.isStale ? 'Stale' : 'Fresh') : 'Empty',
        lastUpdate: cacheStatus ? cacheStatus.timestamp : new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message,
      details: {
        provider: 'Unknown',
        cacheStatus: 'Error',
        lastUpdate: new Date().toISOString()
      }
    });
  }
});

app.get('/api/photos/health', async (req, res) => {
  try {
    await fs.access(photosPath, fs.constants.R_OK);
    
    // Count photos in directory
    const files = await fs.readdir(photosPath);
    const photoCount = files.filter(file => 
      file.toLowerCase().endsWith('.jpg') || 
      file.toLowerCase().endsWith('.jpeg') || 
      file.toLowerCase().endsWith('.png')
    ).length;
    
    res.json({
      status: 'ok',
      details: {
        photoCount: `${photoCount} photos`,
        lastUpdate: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message,
      details: {
        photoCount: 'Unknown',
        lastUpdate: new Date().toISOString()
      }
    });
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
    
    const nextLaunch = response.data.results[0]?.name || 'Unknown';
    
    res.json({
      status: 'ok',
      details: {
        nextLaunch,
        lastUpdate: new Date().toISOString()
      }
    });
  } catch (error) {
    if (error.response?.status === 429) {
      res.status(429).json({
        status: 'rate-limited',
        error: 'Rate limit exceeded',
        details: {
          nextLaunch: 'Unknown',
          lastUpdate: new Date().toISOString()
        }
      });
    } else {
      res.status(500).json({
        status: 'error',
        error: error.message,
        details: {
          nextLaunch: 'Unknown',
          lastUpdate: new Date().toISOString()
        }
      });
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
app.listen(port, '0.0.0.0', () => {
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
