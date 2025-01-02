const databaseService = require('./databaseService');

class CacheService {
  constructor() {
    this.staleThreshold = 60000; // 1 minute
  }

  isStale(timestamp) {
    return Date.now() - new Date(timestamp || 0).getTime() > this.staleThreshold;
  }

  getStockData(symbol, type) {
    const cached = databaseService.getStockData(symbol, type);
    if (!cached) return null;

    return {
      data: cached,
      isStale: this.isStale(cached.metadata?.timestamp)
    };
  }

  setStockData(symbol, data, type) {
    data.metadata = { timestamp: new Date().toISOString() };
    databaseService.setStockData(symbol, data, type);
  }

  updateStockData(symbol, data, type) {
    if (data && !data.error) {
      this.setStockData(symbol, data, type);
    }
  }
}

module.exports = new CacheService();
