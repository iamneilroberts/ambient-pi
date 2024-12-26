const express = require('express');
const cors = require('cors');
const { promisify } = require('util');
const fs = require('fs').promises;
const os = require('os');
const path = require('path');

const app = express();
const port = 3002;

// Backend configuration
const config = {
  localServices: {
    photos: {
      path: path.join(__dirname, '..', 'photos'), // Points to photos directory in project root
    }
  }
};

// Enable CORS for React frontend
app.use(cors());

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
    console.error('Error reading CPU info:', error);
    return null;
  }
}

// Function to read CPU temperature
async function getCpuTemperature() {
  try {
    const temp = await fs.readFile('/sys/class/thermal/thermal_zone0/temp', 'utf8');
    return Math.round(parseInt(temp) / 1000);
  } catch (error) {
    console.error('Error reading CPU temperature:', error);
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
    console.error('Error reading memory info:', error);
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
    console.error('Error reading network info:', error);
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
    console.error('Error collecting system stats:', error);
    res.status(500).json({ error: 'Failed to collect system stats' });
  }
});

// Local photos endpoints
app.get('/api/local-photos', async (req, res) => {
  try {
    const photoDir = config.localServices.photos.path;
    const files = await fs.readdir(photoDir);
    const photos = files
      .filter(file => /\.(jpg|jpeg|png|gif)$/i.test(file))
      .map(file => `/photos/${file}`);
    
    res.json({ photos });
  } catch (error) {
    console.error('Error reading photos directory:', error);
    res.status(500).json({ error: 'Failed to read photos directory' });
  }
});

// Serve static photos
app.use('/photos', express.static(config.localServices.photos.path));

// Start server
app.listen(port, () => {
  console.log(`System monitor backend running on port ${port}`);
  console.log(`Photo directory: ${config.localServices.photos.path}`);
});
