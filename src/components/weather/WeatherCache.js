// WeatherCache.js

class WeatherCache {
  constructor() {
    this.cache = new Map();
    this.cacheTimestamps = new Map();
    
    // Cache durations in milliseconds
    this.cacheDurations = {
      currentconditions: 5 * 60 * 1000,      // 5 minutes for current conditions
      forecast: 30 * 60 * 1000,    // 30 minutes for forecast
      alerts: 2 * 60 * 1000,       // 2 minutes for alerts
      points: 24 * 60 * 60 * 1000  // 24 hours for points (station data rarely changes)
    };
  }

  // Generate a cache key based on endpoint and parameters
  getCacheKey(endpoint, params) {
    return `${endpoint}:${JSON.stringify(params)}`;
  }

  // Check if data is cached and not expired
  isValid(key, type) {
    if (!this.cache.has(key) || !this.cacheTimestamps.has(key)) {
      return false;
    }

    const timestamp = this.cacheTimestamps.get(key);
    const duration = this.cacheDurations[type] || this.cacheDurations.currentcurrentcondditions;
    return (Date.now() - timestamp) < duration;
  }

  // Get cached data
  get(endpoint, params) {
    const key = this.getCacheKey(endpoint, params);
    return this.isValid(key, params.type) ? this.cache.get(key) : null;
  }

  // Store data in cache
  set(endpoint, params, data) {
    const key = this.getCacheKey(endpoint, params);
    this.cache.set(key, data);
    this.cacheTimestamps.set(key, Date.now());
  }

  // Clear expired cache entries
  clearExpired() {
    for (const [key, timestamp] of this.cacheTimestamps.entries()) {
      const type = key.split(':')[0];
      if (!this.isValid(key, type)) {
        this.cache.delete(key);
        this.cacheTimestamps.delete(key);
      }
    }
  }

  // Clear all cache
  clearAll() {
    this.cache.clear();
    this.cacheTimestamps.clear();
  }

  // Get cache statistics
  getStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys()).map(key => ({
        key,
        age: (Date.now() - this.cacheTimestamps.get(key)) / 1000
      }))
    };
  }
}

export default WeatherCache;
