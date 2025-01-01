const { getAircraftInBounds, getAircraftDetails, rateLimiter } = require('./flightService.js');

const setupFlightRoutes = (app) => {
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
        res.json(aircraft);
      }
    } catch (error) {
      clearTimeout(timeout);
      console.error('Error fetching aircraft:', error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
      const status = error.response?.status || 500;
      const errorMessage = error.response?.data?.message || error.message;
      res.status(status).json({ 
        error: 'Failed to fetch aircraft data', 
        details: errorMessage,
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
      console.error('Error fetching aircraft details:', error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
      res.status(500).json({ error: 'Failed to fetch aircraft details', details: error.message });
    }
  });

  console.log('Flight routes initialized');
};

module.exports = { setupFlightRoutes };
