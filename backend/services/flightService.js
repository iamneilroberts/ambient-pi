const axios = require('axios');
const NodeCache = require('node-cache');

const OPENSKY_API_BASE = 'https://opensky-network.org/api';
const STATES_ENDPOINT = '/states/all';

// Authentication
const username = process.env.REACT_APP_OPENSKY_USERNAME;
const password = process.env.REACT_APP_OPENSKY_PASSWORD;

if (!username || !password) {
  console.error('OpenSky credentials not configured');
}

// Configure axios instance with default settings
const api = axios.create({
  baseURL: OPENSKY_API_BASE,
  timeout: 30000, // 30 second timeout
  headers: {
    'Accept': 'application/json',
    'User-Agent': 'AmbientPi/1.0'
  },
  // Use basic auth directly in the instance config
  auth: {
    username,
    password
  },
  // Disable automatic credential encoding
  transformRequest: [
    (data, headers) => {
      // Remove any auto-generated Authorization header
      delete headers.Authorization;
      return data;
    },
    ...axios.defaults.transformRequest
  ]
});

// Add response interceptor for logging
api.interceptors.response.use(
  response => {
    console.log('Received response:', {
      status: response.status,
      url: response.config.url,
      dataPresent: !!response.data
    });
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

// Cache aircraft data for 5 minutes
const aircraftCache = new NodeCache({ stdTTL: 600 }); // 10 minutes cache
// Cache aircraft details for 24 hours
const detailsCache = new NodeCache({ stdTTL: 86400 });

// Rate limiting with dynamic backoff
const rateLimiter = {
  lastRequest: 0,
  minInterval: 5000, // 5 seconds between requests for authenticated users
  retryAfter: 0,
  async throttle() {
    const now = Date.now();
    const waitTime = Math.max(
      this.minInterval - (now - this.lastRequest),
      this.retryAfter * 1000
    );
    
    if (waitTime > 0) {
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastRequest = Date.now();
    this.retryAfter = 0; // Reset retry after using it
  },
  updateRetryAfter(seconds) {
    this.retryAfter = seconds;
  }
};

const getAircraftInBounds = async (bounds) => {
  const cacheKey = JSON.stringify(bounds);
  const cachedData = aircraftCache.get(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  await rateLimiter.throttle();

  try {
    console.log('Fetching aircraft data:', {
      url: STATES_ENDPOINT,
      bounds,
      auth: {
        username: username ? 'present' : 'missing',
        password: password ? 'present' : 'missing'
      }
    });
    const response = await api.get(STATES_ENDPOINT, {
      params: {
        lamin: bounds.lamin,
        lamax: bounds.lamax,
        lomin: bounds.lomin,
        lomax: bounds.lomax,
      }
    });

    if (response.data?.states) {
      // Filter and transform aircraft data
      const validStates = response.data.states.filter(state => 
        // Filter out aircraft with invalid coordinates or missing essential data
        state[0] && // has icao24
        state[5] !== null && state[6] !== null && // has valid coordinates
        !isNaN(state[5]) && !isNaN(state[6]) && // coordinates are numbers
        state[5] >= -180 && state[5] <= 180 && // longitude in valid range
        state[6] >= -90 && state[6] <= 90 // latitude in valid range
      );

      const aircraft = await Promise.all(validStates.map(async state => {
        try {
          // Basic aircraft info without details since metadata API is not available
          return {
            icao24: state[0],
            callsign: state[1]?.trim() || 'N/A',
            country: state[2],
            latitude: state[6],
            longitude: state[5],
            altitude: state[7], // meters
            velocity: state[9], // m/s
            heading: state[10],
            onGround: state[8],
            lastUpdate: state[4],
            // Basic links
            flightAwareLink: `https://flightaware.com/live/modes/${state[0]}`,
            radarBoxLink: `https://www.radarbox.com/data/mode-s/${state[0]}`,
            flightRadarLink: `https://www.flightradar24.com/data/aircraft/${state[0]}`
          };
        } catch (error) {
          console.error(`Error fetching details for aircraft ${state[0]}:`, error);
          // Return basic aircraft data even if details fetch fails
          return {
            icao24: state[0],
            callsign: state[1]?.trim() || 'N/A',
            country: state[2],
            latitude: state[6],
            longitude: state[5],
            altitude: state[7],
            velocity: state[9],
            heading: state[10],
            onGround: state[8],
            lastUpdate: state[4],
            // Provide basic links even without details
            flightAwareLink: `https://flightaware.com/live/modes/${state[0]}`,
            radarBoxLink: `https://www.radarbox.com/data/mode-s/${state[0]}`,
            flightRadarLink: `https://www.flightradar24.com/data/aircraft/${state[0]}`
          };
        }
      }));

      const validAircraft = aircraft.filter(plane => plane !== null);
      aircraftCache.set(cacheKey, validAircraft);
      return validAircraft;
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching aircraft data:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: error.response?.data?.message || error.message,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        params: error.config?.params,
        headers: error.config?.headers
      }
    });
    if (error.response?.status === 401) {
      console.error('OpenSky API authentication failed. Please check credentials.');
      return [];
    } else if (error.response?.status === 429) {
      const retryAfter = parseInt(error.response.headers['x-rate-limit-retry-after-seconds'] || '60');
      rateLimiter.updateRetryAfter(retryAfter);
      console.log(`Rate limited, retry after ${retryAfter} seconds`);
      
      // Return cached data if available
      const cachedData = aircraftCache.get(cacheKey);
      if (cachedData) {
        console.log('Using cached aircraft data');
        return cachedData;
      }
    }
    return [];
  }
};

module.exports = {
  getAircraftInBounds,
  rateLimiter
};
