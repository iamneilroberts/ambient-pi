const axios = require('axios');
// Import config file directly to avoid ES module issues
const configPath = require('path').join(__dirname, '../../src/config/display-config.js');
const configContent = require('fs').readFileSync(configPath, 'utf8');
// Extract the config object and evaluate it as JavaScript
const configMatch = configContent.match(/export const config = ({[\s\S]*});/);
const configStr = configMatch ? configMatch[1] : '{}';
const config = eval(`(${configStr})`);

const ISS_NORAD_ID = 25544;  // NORAD ID for the ISS
const N2YO_API_KEY = process.env.REACT_APP_N2YO_API_KEY;

// Cache for API responses
const cache = {
  launches: { data: null, timestamp: 0 },
  issPasses: { data: null, timestamp: 0 }
};

const CACHE_DURATION = {
  launches: 15 * 60 * 1000, // 15 minutes for launches
  issPasses: 15 * 60 * 1000  // 15 minutes for ISS passes
};

// Rate limiting with exponential backoff
const rateLimiter = {
  lastRequest: 0,
  minInterval: 10000, // 10 seconds between requests
  retryAfter: 0,
  retryCount: 0,
  maxRetries: 3,
  async throttle() {
    const now = Date.now();
    const backoffTime = this.retryCount > 0 
      ? Math.min(1000 * Math.pow(2, this.retryCount), 60000) // Max 1 minute
      : 0;
    const waitTime = Math.max(
      this.minInterval - (now - this.lastRequest),
      this.retryAfter * 1000,
      backoffTime
    );
    
    if (waitTime > 0) {
      console.log(`Rate limiting: waiting ${waitTime}ms before next request`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastRequest = Date.now();
    this.retryAfter = 0;
  },
  updateRetryAfter(seconds) {
    this.retryAfter = seconds;
    this.retryCount++;
    console.log(`Rate limit hit, retry count: ${this.retryCount}`);
  },
  reset() {
    this.retryCount = 0;
    this.retryAfter = 0;
  }
};

// Configure axios instance
const api = axios.create({
  timeout: 10000,
  headers: {
    'User-Agent': 'AmbientPi/1.0',
    'Accept': 'application/json'
  }
});

// Add response interceptor for logging
api.interceptors.response.use(
  response => {
    rateLimiter.reset(); // Reset on successful response
    return response;
  },
  error => {
    console.error('API Error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      message: error.response?.data?.message || error.message
    });
    return Promise.reject(error);
  }
);

async function getLaunches(limit = 5) {
  // Check cache
  if (cache.launches.data && Date.now() - cache.launches.timestamp < CACHE_DURATION.launches) {
    return cache.launches.data;
  }

  try {
    await rateLimiter.throttle();
    const response = await api.get(
      'https://ll.thespacedevs.com/2.2.0/launch/upcoming/',
      {
        params: { limit, mode: 'detailed' },
        headers: { 
          'User-Agent': 'AmbientPi/1.0',
          'Accept': 'application/json'
        }
      }
    );

    // Ensure we have a results array
    const formattedData = {
      results: response.data?.results || []
    };

    // Add detailed debug logging
    console.log('Launch API response:', {
      status: response.status,
      statusText: response.statusText,
      hasResults: !!response.data?.results,
      resultsLength: response.data?.results?.length || 0,
      firstResult: response.data?.results?.[0] || null
    });

    cache.launches = {
      data: formattedData,
      timestamp: Date.now()
    };

    return formattedData;
  } catch (error) {
    console.log('Launch API error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: error.message,
      data: error.response?.data
    });

    if (error.response?.status === 429) {
      const formattedData = {
        results: [{
          name: 'API Rate Limited',
          net: new Date().toISOString(),
          pad: {
            location: {
              name: 'Try again in a few minutes'
            }
          },
          rocket: {
            configuration: {
              name: 'Rate limit exceeded'
            }
          }
        }]
      };
      return formattedData;
    }
    throw error;
  }
}

async function getISSPasses(lat, lon, days = 5, minElevation = 10) {
  const cacheKey = `${lat},${lon}`;
  
  // Check cache
  if (cache.issPasses?.data && Date.now() - cache.issPasses.timestamp < CACHE_DURATION.issPasses) {
    return cache.issPasses.data;
  }

  try {
    await rateLimiter.throttle();
    if (!N2YO_API_KEY) {
      throw new Error('N2YO API key not configured');
    }

    console.log('Using N2YO API key:', N2YO_API_KEY ? 'Present' : 'Missing');
    
    // N2YO API requires parameters in URL path
    const response = await api.get(
      `https://api.n2yo.com/rest/v1/satellite/visualpasses/${ISS_NORAD_ID}/${lat}/${lon}/0/${days}/${minElevation}?apiKey=${N2YO_API_KEY}`
    );

    // Debug log response
    if (response.data.error) {
      throw new Error(`N2YO API error: ${response.data.error}`);
    }

    if (!response.data?.passes) {
      throw new Error('Invalid response format from N2YO API');
    }

    // Transform the data to match frontend format
    const formattedPasses = response.data.passes.map(pass => ({
      type: 'iss',
      name: new Date(pass.startUTC * 1000).toLocaleString(),
      elevation: Math.round(pass.maxEl),
      direction: `${pass.startAz}° to ${pass.endAz}°`,
      duration: Math.round(pass.duration / 60), // Convert to minutes
      magnitude: -2.7, // ISS typical magnitude
      startTime: pass.startUTC,
      endTime: pass.endUTC,
      maxElevationTime: pass.maxEl
    }));

    const result = {
      info: {
        satelliteName: 'ISS (ZARYA)',
        satelliteId: ISS_NORAD_ID
      },
      passes: formattedPasses
    };

    cache.issPasses = {
      data: result,
      timestamp: Date.now()
    };

    return result;
  } catch (error) {
    console.log('N2YO API error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: error.message,
      data: error.response?.data
    });
    if (error.response?.status === 429) {
      const retryAfter = parseInt(error.response.headers['retry-after'] || '60');
      rateLimiter.updateRetryAfter(retryAfter);
      console.log(`Rate limited, retry after ${retryAfter} seconds`);
      
      // Return cached data if available
      if (cache.issPasses?.data) {
        console.log('Using cached ISS pass data');
        return cache.issPasses.data;
      }
    }
    throw error;
  }
}

// Middleware to check for required location parameters
const checkLocationParams = (req, res, next) => {
  const { lat, lng } = req.query;
  if (!lat || !lng) {
    return res.status(400).json({
      error: 'Missing required parameters',
      details: 'Latitude and longitude are required'
    });
  }
  next();
};

function setupSpaceRoutes(app) {
  // Get upcoming launches
  app.get('/api/space/launches', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 5;
      const data = await getLaunches(limit);
      res.json(data);
    } catch (error) {
      res.status(error.response?.status || 500).json({
        error: 'Error fetching launch data',
        details: error.message
      });
    }
  });

  // Get ISS passes
  app.get('/api/space/iss/passes', checkLocationParams, async (req, res) => {
    try {
      const { lat, lng, days, minElevation } = req.query;
      const data = await getISSPasses(
        parseFloat(lat),
        parseFloat(lng),
        parseInt(days) || 5,
        parseInt(minElevation) || 10
      );
      res.json(data);
    } catch (error) {
      res.status(error.response?.status || 500).json({
        error: 'Error fetching ISS pass data',
        details: error.message
      });
    }
  });

  // Test route
  app.get('/api/space/test', (req, res) => {
    res.json({ status: 'Space service is running' });
  });
}

module.exports = { setupSpaceRoutes };
