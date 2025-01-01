const fs = require('fs');
const path = require('path');

class LoggingService {
  constructor() {
    this.logFile = path.join(process.cwd(), 'logs', 'system.log');
    this.maxLogSize = 5 * 1024 * 1024; // 5MB
    this.ensureLogDirectory();
  }

  ensureLogDirectory() {
    const logDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  rotateLogIfNeeded() {
    try {
      if (fs.existsSync(this.logFile)) {
        const stats = fs.statSync(this.logFile);
        if (stats.size > this.maxLogSize) {
          // Create backup of current log
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          fs.renameSync(this.logFile, `${this.logFile}.${timestamp}`);
          
          // Start new log file
          this.log('system', 'Log rotation completed');
        }
      }
    } catch (error) {
      console.error('Error rotating log file:', error);
    }
  }

  log(component, message, level = 'info') {
    try {
      this.rotateLogIfNeeded();
      
      const timestamp = new Date().toISOString();
      const logEntry = `[${timestamp}] [${level.toUpperCase()}] [${component}] ${message}\n`;
      
      fs.appendFileSync(this.logFile, logEntry);
    } catch (error) {
      console.error('Error writing to log file:', error);
    }
  }

  // Method to read recent logs
  getRecentLogs(lines = 100) {
    try {
      if (!fs.existsSync(this.logFile)) {
        return [];
      }

      const data = fs.readFileSync(this.logFile, 'utf8');
      return data.split('\n').slice(-lines).filter(Boolean);
    } catch (error) {
      console.error('Error reading log file:', error);
      return [];
    }
  }
}

// Create singleton instance
const loggingService = new LoggingService();
module.exports = loggingService;
