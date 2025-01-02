const databaseService = require('./databaseService');

class WeatherCacheService {
  constructor() {
    this.cacheConfig = {
      points: { duration: 24 * 60 }, // 24 hours in minutes
      weather: { duration: 30 }, // 30 minutes
      alerts: { duration: 15 } // 15 minutes
    };
  }

  getCacheKey(type, params) {
    switch (type) {
      case 'points':
      case 'weather':
      case 'alerts':
        const { lat, lon } = params;
        return `${type}:${parseFloat(lat).toFixed(4)},${parseFloat(lon).toFixed(4)}`;
      default:
        throw new Error(`Invalid cache type: ${type}`);
    }
  }

  isStale(data, type) {
    if (!data?.metadata?.timestamp) return true;
    
    const cacheAge = Date.now() - new Date(data.metadata.timestamp).getTime();
    const maxAge = this.cacheConfig[type].duration * 60 * 1000; // Convert minutes to milliseconds
    
    return cacheAge > maxAge;
  }

  get(type, params) {
    const key = this.getCacheKey(type, params);
    const data = databaseService.getWeatherCache(key);
    
    if (!data || !this.isValidData(data, type)) return null;
    
    return {
      data,
      isStale: this.isStale(data, type)
    };
  }

  set(type, params, data) {
    const key = this.getCacheKey(type, params);
    data.metadata = {
      ...data.metadata,
      timestamp: new Date().toISOString()
    };
    
    return databaseService.setWeatherCache(
      key,
      data,
      this.cacheConfig[type].duration
    );
  }

  isValidData(data, type) {
    if (!data?.metadata?.timestamp) return false;

    switch (type) {
      case 'points':
        return data.properties && 
               data.properties.cwa && 
               data.properties.gridX !== undefined && 
               data.properties.gridY !== undefined;
      
      case 'weather':
        return data.currentWeather && 
               Array.isArray(data.forecast) && 
               Array.isArray(data.hourly);
      
      case 'alerts':
        return Array.isArray(data.features);
      
      default:
        return false;
    }
  }

  update(type, params, data) {
    if (!data || data.error) return;
    this.set(type, params, data);
  }
}

module.exports = new WeatherCacheService();
