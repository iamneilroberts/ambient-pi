import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { AlertCircle, Cpu, HardDrive, Database, Thermometer, Activity, Wifi, CheckCircle, XCircle, Settings } from 'react-feather';
import { useTheme } from './themes/ThemeProvider';

const SystemMonitor = () => {
  const { currentTheme, changeTheme, availableThemes } = useTheme();
  const [stats, setStats] = useState({
    cpu: { usage: 0, temperature: 0, cores: 0, speed: 0 },
    memory: { total: 0, used: 0, swapTotal: 0, swapUsed: 0 },
    network: { rx: 0, tx: 0 },
    drives: [],
    processes: []
  });
  const [health, setHealth] = useState({
    system: { status: 'unknown', details: {} },
    finance: { status: 'unknown', details: {} },
    flight: { status: 'unknown', details: {} },
    weather: { status: 'unknown', details: {} },
    photos: { status: 'unknown', details: {} },
    space: { status: 'unknown', details: {} }
  });
  const [logs, setLogs] = useState([]);
  const [showAllLogs, setShowAllLogs] = useState(false);
  const logContainerRef = useRef(null);

  // Parse log entries
  const parsedLogs = useMemo(() => {
    return logs.map(log => {
      const match = log.match(/\[(.*?)\] \[(.*?)\] \[(.*?)\] (.*)/);
      if (match) {
        let message = match[4];
        // Try to parse and prettify JSON content
        try {
          if (message.includes('{') || message.includes('[')) {
            const jsonStart = message.indexOf('{') !== -1 ? message.indexOf('{') : message.indexOf('[');
            const prefix = message.substring(0, jsonStart);
            const jsonContent = message.substring(jsonStart);
            const parsed = JSON.parse(jsonContent);
            message = prefix + '\n' + JSON.stringify(parsed, null, 2);
          }
        } catch (e) {
          // If JSON parsing fails, use original message
        }
        
        return {
          timestamp: match[1],
          level: match[2].toLowerCase(),
          component: match[3],
          message
        };
      }
      return null;
    }).filter(Boolean);
  }, [logs]);

  // Group logs by component and calculate health
  const componentHealth = useMemo(() => {
    const health = {};
    const lastHour = Date.now() - 60 * 60 * 1000;

    parsedLogs.forEach(log => {
      if (!health[log.component]) {
        health[log.component] = {
          status: 'healthy',
          errors: [],
          warnings: []
        };
      }

      const logTime = new Date(log.timestamp).getTime();
      if (logTime > lastHour) {
        if (log.level === 'error') {
          health[log.component].status = 'error';
          health[log.component].errors.push(log);
        } else if (log.level === 'warn') {
          if (health[log.component].status !== 'error') {
            health[log.component].status = 'warning';
          }
          health[log.component].warnings.push(log);
        }
      }
    });

    return health;
  }, [parsedLogs]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, healthRes, logsRes] = await Promise.all([
          fetch('/api/stats'),
          fetch('/api/health'),
          fetch('/api/logs')
        ]);
        
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        }
        
        if (healthRes.ok) {
          const healthData = await healthRes.json();
          setHealth(healthData);
        }
        
        if (logsRes.ok) {
          const logsData = await logsRes.json();
          setLogs(logsData);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };

    // Initial fetch
    fetchData();

    // Set up polling
    const interval = setInterval(fetchData, 10000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  // Auto-scroll logs to bottom when new logs arrive
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const getLogIcon = useCallback((type) => {
    switch (type) {
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />;
      case 'warn':
        return <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0" />;
      default:
        return <Activity className="w-4 h-4 text-blue-400 flex-shrink-0" />;
    }
  }, []);

  return (
    <div className="fixed inset-0 overflow-y-auto -mb-16 pb-32 space-y-4 md:space-y-6 p-2 md:p-0">
      {/* Theme Selection */}
      <div className="bg-gray-800 p-3 md:p-4 rounded-lg shadow-lg mb-4 md:mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Settings className="w-5 h-5 mr-2" />
            <h3 className="text-lg font-semibold">Theme</h3>
          </div>
          <select
            value={currentTheme}
            onChange={(e) => changeTheme(e.target.value)}
            className="bg-gray-700 text-white rounded-md px-3 py-1 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {Object.entries(availableThemes).map(([key, theme]) => (
              <option key={key} value={key}>
                {theme.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* System Summary */}
      <div className="bg-gray-800 p-3 md:p-6 rounded-lg shadow-lg mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {/* CPU & Temperature */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <Cpu className="w-4 h-4 mr-2" />
              CPU & Temperature
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Usage</span>
                <span>{stats.cpu?.usage.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Temperature</span>
                <span>{stats.cpu?.temperature}°C</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Speed</span>
                <span>{stats.cpu?.speed} GHz</span>
              </div>
            </div>
          </div>

          {/* Memory */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <Database className="w-4 h-4 mr-2" />
              Memory
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">RAM</span>
                <span>{((stats.memory?.used / stats.memory?.total) * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Used</span>
                <span>{(stats.memory?.used / 1024 / 1024 / 1024).toFixed(1)} GB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Total</span>
                <span>{(stats.memory?.total / 1024 / 1024 / 1024).toFixed(1)} GB</span>
              </div>
            </div>
          </div>

          {/* Network */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <Wifi className="w-4 h-4 mr-2" />
              Network
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Received</span>
                <span>{stats.network?.rx.toFixed(2)} MB/s</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Transmitted</span>
                <span>{stats.network?.tx.toFixed(2)} MB/s</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Status Indicators */}
      <div className="bg-gray-800 p-3 md:p-6 rounded-lg shadow-lg mb-4">
        <h2 className="text-lg md:text-xl font-bold mb-3 md:mb-4 flex items-center">
          <Activity className="w-5 h-5 mr-2" />
          Component Status
        </h2>
        <div className="grid grid-cols-1 gap-2 md:gap-4">
          {Object.entries(health).map(([service, status]) => (
            <div 
              key={service}
              className={`p-3 rounded-lg ${
                status.status === 'error' && !status.details?.rateLimited && !status.error?.includes('rate') ? 'bg-red-900/30' :
                (service === 'flight' && (status.status === 'rate-limited' || status.details?.rateLimited || (status.error && status.error.includes('rate')))) ? 'bg-yellow-900/30' :
                status.status === 'rate-limited' || status.details?.rateLimited || (status.error && status.error.includes('rate')) ? 'bg-blue-900/30' :
                status.status === 'ok' ? 'bg-green-900/30' :
                'bg-gray-700/30'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {status.status === 'error' && !status.details?.rateLimited && !status.error?.includes('rate') ? (
                    <XCircle className="w-4 h-4 md:w-5 md:h-5 text-red-400 flex-shrink-0" />
                  ) : status.status === 'rate-limited' || status.details?.rateLimited || (status.error && status.error.includes('rate')) ? (
                    <AlertCircle className={`w-4 h-4 md:w-5 md:h-5 flex-shrink-0 ${service === 'flight' ? 'text-yellow-400' : 'text-blue-400'}`} />
                  ) : status.status === 'ok' ? (
                    <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-green-400 flex-shrink-0" />
                  ) : (
                    <Activity className="w-4 h-4 md:w-5 md:h-5 text-gray-400 flex-shrink-0" />
                  )}
                  <span className="font-semibold capitalize text-sm md:text-base truncate">{service}</span>
                </div>

                {/* Status Summary */}
                <div className="flex items-center gap-2 text-xs">
                  {status.details?.lastUpdate && (
                    <span className="text-gray-400">
                      {new Date(status.details.lastUpdate).toLocaleTimeString()}
                    </span>
                  )}
                  {status.details?.dataSource && (
                    <span className={status.details.dataSource === 'cache' ? 'text-yellow-400' : 'text-green-400'}>
                      {status.details.dataSource === 'cache' ? 'Cached' : 'Live'}
                    </span>
                  )}
                </div>

                {/* Rate Limit or Error */}
                <div className="text-xs">
                  {(status.status === 'rate-limited' || status.details?.rateLimited) ? (
                    <span className={`${service === 'flight' ? 'text-yellow-400' : 'text-blue-400'}`}>
                      Rate Limited {status.details?.rateLimit?.remaining && `(${status.details.rateLimit.remaining})`}
                    </span>
                  ) : status.error ? (
                    <span className="text-red-400 truncate block">
                      {status.error}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* System Logs */}
      <div className="bg-gray-800 p-3 md:p-6 rounded-lg shadow-lg mb-4">
        <h2 className="text-lg md:text-xl font-bold mb-3 md:mb-4 flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          System Logs
        </h2>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowAllLogs(!showAllLogs)}
              className={`px-3 py-1 rounded-md text-sm ${
                showAllLogs ? 'bg-blue-500 text-white' : 'bg-gray-600 text-gray-300'
              }`}
            >
              {showAllLogs ? 'Show Errors & Warnings' : 'Show All Logs'}
            </button>
          </div>
        </div>
        <div 
          ref={logContainerRef}
          className="overflow-y-auto max-h-[70vh] md:max-h-96 space-y-2"
        >
          {parsedLogs
            .filter(log => showAllLogs || ['error', 'warn'].includes(log.level))
            .map((log, i) => (
            <div 
              key={i} 
              className={`p-2 md:p-3 rounded text-xs md:text-sm flex items-start ${
                log.level === 'error' ? 'bg-red-900/50 text-red-200' :
                log.level === 'warn' ? 'bg-yellow-900/50 text-yellow-200' :
                'bg-gray-700/50'
              }`}
            >
              {getLogIcon(log.level)}
              <div className="ml-2 flex-1">
                <div className="flex items-center mb-1">
                  <span className="text-gray-400">{log.timestamp}</span>
                  <span className="mx-2 text-gray-400">[{log.component}]</span>
                </div>
                <span className="whitespace-pre-wrap break-words">{log.message}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SystemMonitor;
