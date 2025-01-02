const axios = require('axios');
const NodeCache = require('node-cache');

const OPENSKY_API_BASE = 'https://opensky-network.org/api';
const STATES_ENDPOINT = '/states/all';

// Authentication
const username = process.env.OPENSKY_USERNAME;
const password = process.env.OPENSKY_PASSWORD;

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
  auth: { username, password }
});

// Add response interceptor for minimal logging
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      console.error('OpenSky API authentication failed');
    } else if (error.response?.status === 429) {
      console.log('OpenSky API rate limit reached');
    } else if (!error.response) {
      console.error('OpenSky API connection error');
    }
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
  minInterval: 10000, // 10 seconds between requests for authenticated users
  retryAfter: 0,
  requestCount: 0,
  maxRequests: 500, // OpenSky API limit
  resetTime: Date.now(),

  async throttle() {
    const now = Date.now();
    
    // Reset request count if we're in a new time window
    if (now - this.resetTime >= 3600000) { // Reset every hour
      this.requestCount = 0;
      this.resetTime = now;
    }

    // Check if we're rate limited
    if (this.retryAfter > 0) {
      const waitTime = this.retryAfter * 1000;
      await new Promise(resolve => setTimeout(resolve, waitTime));
      this.retryAfter = 0;
      return;
    }

    // Check if we need to wait for the minimum interval
    const timeSinceLastRequest = now - this.lastRequest;
    if (timeSinceLastRequest < this.minInterval) {
      const waitTime = this.minInterval - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    // Check if we've hit the request limit
    if (this.requestCount >= this.maxRequests) {
      const waitTime = 3600000 - (now - this.resetTime); // Wait until next hour
      await new Promise(resolve => setTimeout(resolve, waitTime));
      this.requestCount = 0;
      this.resetTime = Date.now();
    }

    this.lastRequest = Date.now();
  },

  updateRetryAfter(seconds) {
    this.retryAfter = seconds;
  },
  
  getRemainingRequests() {
    const now = Date.now();
    
    if (this.retryAfter > 0) return 0;

    if (now - this.resetTime >= 3600000) {
      this.requestCount = 0;
      this.resetTime = now;
    }

    const timeSinceLastRequest = now - this.lastRequest;
    if (timeSinceLastRequest < this.minInterval) return 0;

    return Math.max(0, this.maxRequests - this.requestCount);
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
    rateLimiter.requestCount++;
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
    if (error.response?.status === 429) {
      const retryAfter = parseInt(error.response.headers['x-rate-limit-retry-after-seconds'] || '60');
      rateLimiter.updateRetryAfter(retryAfter);
      
      // Return cached data if available
      const cachedData = aircraftCache.get(cacheKey);
      if (cachedData) return cachedData;
    }
    return [];
  }
};

module.exports = {
  getAircraftInBounds,
  rateLimiter
};
