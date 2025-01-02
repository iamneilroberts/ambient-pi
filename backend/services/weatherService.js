const axios = require('axios');
const weatherConfigService = require('./weatherConfigService');
const weatherCacheService = require('./weatherCacheService');
const weatherTransformService = require('./weatherTransformService');

class WeatherService {
  constructor() {
    this.config = weatherConfigService;
    this.cache = weatherCacheService;
    this.transform = weatherTransformService;
  }

  async getWeatherData(lat, lon) {
    try {
      const location = this.config.validateLocation(lat, lon);
      const cached = this.cache.get('weather', location);

      if (cached && !cached.isStale) {
        return cached.data;
      }

      try {
        const nwsData = await this.getNWSWeather(location.lat, location.lon);
        this.cache.set('weather', location, nwsData);
        return nwsData;
      } catch (nwsError) {
        if (!this.config.hasOpenWeatherKey) {
          throw nwsError;
        }

        try {
          const openWeatherData = await this.getOpenWeatherData(location.lat, location.lon);
          const transformedData = this.transform.transformOpenWeatherData(openWeatherData);
          this.cache.set('weather', location, transformedData);
          return transformedData;
        } catch (openWeatherError) {
          throw new Error(`Weather services failed - NWS: ${nwsError.message}, OpenWeather: ${openWeatherError.message}`);
        }
      }
    } catch (error) {
      throw error;
    }
  }

  async getNWSPoints(lat, lon) {
    const location = this.config.validateLocation(lat, lon);
    const cached = this.cache.get('points', location);

    if (cached && !cached.isStale) {
      return cached.data;
    }

    const pointsUrl = `${this.config.nwsConfig.baseUrl}/points/${location.lat},${location.lon}`;
    
    try {
      const response = await axios.get(pointsUrl, { 
        headers: this.config.nwsHeaders,
        validateStatus: status => status >= 200 && status < 500
      });

      if (response.status !== 200) {
        throw new Error(`NWS Points API returned status ${response.status}`);
      }

      const pointsData = response.data;
      if (!pointsData?.properties) {
        throw new Error('Invalid points data structure received from NWS');
      }
      
      this.cache.set('points', location, pointsData);
      return pointsData;
    } catch (error) {
      throw error;
    }
  }

  async getNWSWeather(lat, lon) {
    try {
      const pointsData = await this.getNWSPoints(lat, lon);
      const props = pointsData?.properties;
      
      if (!props?.cwa || !props?.gridX || !props?.gridY) {
        throw new Error('Invalid points data from NWS: Missing required grid properties');
      }

      const { cwa: gridId, gridX, gridY } = props;
      const baseUrl = this.config.nwsConfig.baseUrl;
      const headers = this.config.nwsHeaders;
      
      const [forecastResponse, hourlyResponse] = await Promise.all([
        axios.get(`${baseUrl}/gridpoints/${gridId}/${gridX},${gridY}/forecast`, { headers }),
        axios.get(`${baseUrl}/gridpoints/${gridId}/${gridX},${gridY}/forecast/hourly`, { headers })
      ]);

      return this.transform.transformNWSData(
        forecastResponse.data,
        hourlyResponse.data,
        pointsData
      );
    } catch (error) {
      throw error;
    }
  }

  async getOpenWeatherData(lat, lon) {
    if (!this.config.hasOpenWeatherKey) {
      throw new Error('OpenWeather API key not configured');
    }

    const { baseUrl, apiKey, units } = this.config.openWeatherConfig;
    const response = await axios.get(`${baseUrl}/weather`, {
      params: { lat, lon, appid: apiKey, units }
    });
    
    return response.data;
  }

  async getAlerts(lat, lon) {
    try {
      const location = this.config.validateLocation(lat, lon);
      const cached = this.cache.get('alerts', location);

      if (cached && !cached.isStale) {
        return cached.data;
      }

      const response = await axios.get(
        `${this.config.nwsConfig.baseUrl}/alerts/active?point=${location.lat},${location.lon}`,
        { headers: this.config.nwsHeaders }
      );

      const alertsData = this.transform.transformAlertsData(response.data);
      this.cache.set('alerts', location, alertsData);
      return alertsData;
    } catch (error) {
      return { features: [] }; // Return empty alerts array on error
    }
  }
}

module.exports = new WeatherService();
