class LoggingService {
  constructor() {
    this.logs = [];
    this.maxLogs = 1000; // Keep last 1000 logs in memory
  }

  log(component, message, level = 'info') {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      component,
      message
    };

    // Add to in-memory logs
    this.logs.push(logEntry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift(); // Remove oldest log
    }

    // Send to backend
    try {
      fetch('http://localhost:3002/api/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(logEntry)
      }).catch(error => {
        console.error('Error sending log to backend:', error);
      });
    } catch (error) {
      console.error('Error stringifying log:', error);
    }

    // Also output to console for development
    const consoleMsg = `[${timestamp}] [${level.toUpperCase()}] [${component}] ${message}`;
    switch (level.toLowerCase()) {
      case 'error':
        console.error(consoleMsg);
        break;
      case 'warn':
        console.warn(consoleMsg);
        break;
      case 'info':
        console.info(consoleMsg);
        break;
      default:
        console.log(consoleMsg);
    }
  }

  getRecentLogs(lines = 100) {
    return this.logs.slice(-lines);
  }
}

// Create singleton instance
const loggingService = new LoggingService();
export default loggingService;
