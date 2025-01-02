const Database = require('better-sqlite3');
const path = require('path');
const loggingService = require('../utils/LoggingService');

class DatabaseService {
    constructor() {
        this.db = new Database(path.join(__dirname, '../data/ambient.db'));
        this.initializeTables();
        this.setupCleanupJob();
    }

    initializeTables() {
        // Enable foreign keys
        this.db.pragma('foreign_keys = ON');

        // Create weather cache table with JSON column and timestamp
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS weather_cache (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                cache_key TEXT NOT NULL UNIQUE,
                data JSON NOT NULL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                expires_at DATETIME NOT NULL
            )
        `);

        // Create stock data table with JSON column
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS stock_data (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                symbol TEXT NOT NULL,
                data JSON NOT NULL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                data_type TEXT NOT NULL,
                UNIQUE(symbol, data_type)
            )
        `);

        // Create config table with JSON column
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS config (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                key TEXT NOT NULL UNIQUE,
                value JSON NOT NULL,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create indexes for better performance
        this.db.exec(`
            CREATE INDEX IF NOT EXISTS idx_weather_expires ON weather_cache(expires_at);
            CREATE INDEX IF NOT EXISTS idx_stock_symbol ON stock_data(symbol);
            CREATE INDEX IF NOT EXISTS idx_config_key ON config(key);
        `);
    }

    setupCleanupJob() {
        // Run cleanup every hour
        setInterval(() => {
            this.cleanupExpiredCache();
        }, 60 * 60 * 1000);

        // Run initial cleanup
        this.cleanupExpiredCache();
    }

    cleanupExpiredCache() {
        try {
            const result = this.db.prepare('DELETE FROM weather_cache WHERE expires_at < datetime(\'now\')').run();
            if (result.changes > 0) {
                loggingService.log('database', `Cleaned up ${result.changes} expired weather cache entries`);
            }
        } catch (error) {
            loggingService.log('database', `Error cleaning up cache: ${error.message}`, 'error');
        }
    }

    // Weather cache operations
    setWeatherCache(key, data, expiresInMinutes = 30) {
        try {
            loggingService.log('database', `Setting weather cache for key: ${key}`);
            loggingService.log('database', `Cache data: ${JSON.stringify(data)}`);
            
            const stmt = this.db.prepare(`
                INSERT OR REPLACE INTO weather_cache (cache_key, data, expires_at)
                VALUES (?, ?, datetime('now', '+' || ? || ' minutes'))
            `);
            const result = stmt.run(key, JSON.stringify(data), expiresInMinutes);
            loggingService.log('database', `Cache set result: ${JSON.stringify(result)}`);
            return result;
        } catch (error) {
            loggingService.log('database', `Error setting weather cache: ${error.message}`, 'error');
            throw error;
        }
    }

    getWeatherCache(key) {
        try {
            loggingService.log('database', `Getting weather cache for key: ${key}`);
            
            const stmt = this.db.prepare(`
                SELECT data FROM weather_cache 
                WHERE cache_key = ? AND expires_at > datetime('now')
            `);
            const result = stmt.get(key);
            
            if (result) {
                loggingService.log('database', `Cache hit for key: ${key}`);
                const parsedData = JSON.parse(result.data);
                loggingService.log('database', `Parsed cache data: ${JSON.stringify(parsedData)}`);
                return parsedData;
            } else {
                loggingService.log('database', `Cache miss for key: ${key}`);
                return null;
            }
        } catch (error) {
            loggingService.log('database', `Error getting weather cache: ${error.message}`, 'error');
            return null;
        }
    }

    // Stock data operations
    setStockData(symbol, data, dataType) {
        const stmt = this.db.prepare(`
            INSERT OR REPLACE INTO stock_data (symbol, data, data_type)
            VALUES (?, ?, ?)
        `);
        return stmt.run(symbol, JSON.stringify(data), dataType);
    }

    getStockData(symbol, dataType) {
        const stmt = this.db.prepare('SELECT data FROM stock_data WHERE symbol = ? AND data_type = ?');
        const result = stmt.get(symbol, dataType);
        return result ? JSON.parse(result.data) : null;
    }

    // Config operations
    setConfig(key, value) {
        const stmt = this.db.prepare(`
            INSERT OR REPLACE INTO config (key, value, updated_at)
            VALUES (?, ?, CURRENT_TIMESTAMP)
        `);
        return stmt.run(key, JSON.stringify(value));
    }

    getConfig(key) {
        const stmt = this.db.prepare('SELECT value FROM config WHERE key = ?');
        const result = stmt.get(key);
        return result ? JSON.parse(result.value) : null;
    }

    getAllConfig() {
        const stmt = this.db.prepare('SELECT key, value FROM config');
        const results = stmt.all();
        return results.reduce((acc, row) => {
            acc[row.key] = JSON.parse(row.value);
            return acc;
        }, {});
    }
}

// Create and export a singleton instance
const databaseService = new DatabaseService();
module.exports = databaseService;
