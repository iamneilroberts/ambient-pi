const { getAircraftInBounds, getAircraftDetails, rateLimiter } = require('./flightService.js');

let requestCount = 0;
let lastRequestTime = Date.now();
let dataSource = 'live';

const setupFlightRoutes = (app) => {
  // Health check endpoint
  app.get('/api/flight/health', (req, res) => {
    const now = Date.now();
    const remainingRequests = rateLimiter.getRemainingRequests();
    const isRateLimited = rateLimiter.retryAfter > 0;
    const timeSinceLastRequest = now - rateLimiter.lastRequest;
    const resetTime = isRateLimited ? 
      now + (rateLimiter.retryAfter * 1000) : 
      now + Math.max(0, rateLimiter.minInterval - timeSinceLastRequest);
    
    const status = {
      status: isRateLimited ? 'rate-limited' : 'ok',
      details: {
        lastUpdate: lastRequestTime,
        dataSource: dataSource,
        requestCount: rateLimiter.requestCount,
        rateLimited: isRateLimited,
        rateLimit: {
          remaining: remainingRequests,
          total: rateLimiter.maxRequests,
          reset: new Date(resetTime).toISOString(),
          nextRequest: new Date(now + Math.max(0, rateLimiter.minInterval - timeSinceLastRequest)).toISOString()
        }
      }
    };
    res.json(status);
  });

  // Get aircraft in bounds
  app.get('/api/flight/aircraft', async (req, res) => {
    const timeout = setTimeout(() => {
      res.status(504).json({ error: 'Request timed out' });
    }, 30000); // 30 second timeout

    try {
      await rateLimiter.throttle();
      const { lamin, lamax, lomin, lomax } = req.query;
      
      // Validate parameters
      if (!lamin || !lamax || !lomin || !lomax) {
        return res.status(400).json({ 
          error: 'Missing required parameters',
          details: 'All bounds parameters (lamin, lamax, lomin, lomax) are required'
        });
      }

      const bounds = {
        lamin: parseFloat(lamin),
        lamax: parseFloat(lamax),
        lomin: parseFloat(lomin),
        lomax: parseFloat(lomax)
      };

      // Validate bounds are within valid ranges
      if (bounds.lamin < -90 || bounds.lamax > 90 || bounds.lomin < -180 || bounds.lomax > 180) {
        return res.status(400).json({
          error: 'Invalid bounds parameters',
          details: 'Latitude must be between -90 and 90, longitude between -180 and 180'
        });
      }

      const aircraft = await getAircraftInBounds(bounds);
      clearTimeout(timeout);
      if (!res.headersSent) {
        requestCount++;
        lastRequestTime = Date.now();
        dataSource = aircraft.length > 0 ? 'live' : 'cache';
        res.json(aircraft);
      }
    } catch (error) {
      clearTimeout(timeout);
      const status = error.response?.status || 500;
      res.status(status).json({ 
        error: 'Failed to fetch aircraft data', 
        details: error.message,
        status: status
      });
    }
  });

  // Get aircraft details
  app.get('/api/flight/aircraft/:icao24', async (req, res) => {
    const timeout = setTimeout(() => {
      res.status(504).json({ error: 'Request timed out' });
    }, 30000); // 30 second timeout

    try {
      await rateLimiter.throttle();
      const { icao24 } = req.params;
      const details = await getAircraftDetails(icao24);
      clearTimeout(timeout);
      if (!res.headersSent) {
        res.json(details);
      }
    } catch (error) {
      clearTimeout(timeout);
      res.status(500).json({ error: 'Failed to fetch aircraft details', details: error.message });
    }
  });

  console.log('Flight routes initialized');
};

module.exports = { setupFlightRoutes };
