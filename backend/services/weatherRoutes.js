const weatherService = require('./weatherService');
const weatherConfigService = require('./weatherConfigService');
const { config } = require('../../config.cjs');

const setupWeatherRoutes = (app) => {
  // Current weather endpoint
  app.get('/api/weather/current', async (req, res) => {
    const timeout = setTimeout(() => {
      res.status(504).json({ error: 'Request timed out' });
    }, 30000); // 30 second timeout

    try {
      const lat = parseFloat(req.query.lat) || config.location.lat;
      const lon = parseFloat(req.query.lon) || config.location.lon;
      
      const location = weatherConfigService.validateLocation(lat, lon);
      const weatherData = await weatherService.getWeatherData(location.lat, location.lon);
      
      clearTimeout(timeout);
      if (!res.headersSent) {
        res.json(weatherData);
      }
    } catch (error) {
      clearTimeout(timeout);
      const status = error.response?.status || 500;
      const errorMessage = error.response?.data?.message || error.message;
      res.status(status).json({ 
        error: 'Failed to fetch weather data', 
        details: errorMessage,
        status: status
      });
    }
  });

  // Weather alerts endpoint
  app.get('/api/weather/alerts', async (req, res) => {
    const timeout = setTimeout(() => {
      res.status(504).json({ error: 'Request timed out' });
    }, 30000); // 30 second timeout

    try {
      const lat = parseFloat(req.query.lat) || config.location.lat;
      const lon = parseFloat(req.query.lon) || config.location.lon;
      
      const location = weatherConfigService.validateLocation(lat, lon);
      const alerts = await weatherService.getAlerts(location.lat, location.lon);
      
      clearTimeout(timeout);
      if (!res.headersSent) {
        res.json(alerts);
      }
    } catch (error) {
      clearTimeout(timeout);
      res.status(500).json({ error: 'Failed to fetch weather alerts', details: error.message });
    }
  });

  console.log('Weather routes initialized');
};

module.exports = { setupWeatherRoutes };
