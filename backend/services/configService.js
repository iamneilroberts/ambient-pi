const fs = require('fs').promises;
const path = require('path');

class ConfigService {
  constructor() {
    this.configPath = path.join(__dirname, '../../src/config/config.js');
  }

  async readStocksConfig() {
    try {
      const configContent = await fs.readFile(this.configPath, 'utf8');
      const stocksMatch = configContent.match(/symbols:\s*\[([\s\S]*?)\]/);
      if (!stocksMatch) throw new Error('Could not find stocks array in config');
      
      return JSON.parse(`[${stocksMatch[1]}]`);
    } catch (error) {
      throw new Error('Failed to read stocks configuration');
    }
  }

  async updateStocksConfig(updater) {
    try {
      const configContent = await fs.readFile(this.configPath, 'utf8');
      const stocksMatch = configContent.match(/symbols:\s*\[([\s\S]*?)\]/);
      if (!stocksMatch) throw new Error('Could not find stocks array in config');
      
      const config = {
        preferences: {
          stocks: {
            symbols: JSON.parse(`[${stocksMatch[1]}]`)
          }
        }
      };
      
      updater(config);
      
      const stocksArrayStr = JSON.stringify(config.preferences.stocks.symbols)
        .slice(1, -1)
        .split(',')
        .map(s => `"${s.trim().replace(/"/g, '')}"`)
        .join(', ');
      
      const newConfigContent = configContent.replace(
        /symbols:\s*\[([\s\S]*?)\]/,
        `symbols: [${stocksArrayStr}]`
      );
      
      await fs.writeFile(this.configPath, newConfigContent, 'utf8');
      
      return config.preferences.stocks.symbols;
    } catch (error) {
      throw new Error('Failed to update stocks configuration');
    }
  }

  async addStock(symbol) {
    return this.updateStocksConfig(config => {
      if (!config.preferences.stocks.symbols.includes(symbol)) {
        config.preferences.stocks.symbols.push(symbol);
      }
    });
  }

  async removeStock(symbol) {
    return this.updateStocksConfig(config => {
      config.preferences.stocks.symbols = config.preferences.stocks.symbols.filter(
        s => s !== symbol
      );
    });
  }
}

module.exports = new ConfigService();
