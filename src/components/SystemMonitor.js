import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Cpu, HardDrive, Thermometer, Network, AlertCircle, CheckCircle, Clock, RefreshCw, RotateCw } from 'lucide-react';
import loggingService from '../utils/LoggingService';

// Custom hook for managing system stats
const useSystemStats = () => {
  const [stats, setStats] = useState({
    cpu: { usage: 0, temp: 0 },
    memory: { total: 0, used: 0 },
    network: { rx: 0, tx: 0 }
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:3002/api/stats');
      if (!response.ok) throw new Error('Failed to fetch stats');
      const data = await response.json();

      setStats({
        cpu: {
          usage: data.cpu.usage,
          temp: data.cpu.temperature
        },
        memory: {
          total: data.memory.total,
          used: data.memory.used
        },
        network: {
          rx: data.network.rx,
          tx: data.network.tx
        }
      });

      loggingService.log('system', `CPU: ${data.cpu.usage}% | Temp: ${data.cpu.temperature}°C | Memory: ${Math.round((data.memory.used / data.memory.total) * 100)}%`);
      setError(null);
    } catch (error) {
      console.error('Error fetching system stats:', error);
      loggingService.log('system', `Error fetching stats: ${error.message}`, 'error');
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 2000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  return { stats, error, loading, refetch: fetchStats };
};

// Custom hook for managing service health
const useServiceHealth = () => {
  const [services, setServices] = useState({
    proxy: { status: 'unknown', lastCheck: null, error: null },
    backend: { status: 'unknown', lastCheck: null, error: null },
    finance: { status: 'unknown', lastCheck: null, error: null },
    flight: { status: 'unknown', lastCheck: null, error: null },
    weather: { status: 'unknown', lastCheck: null, error: null },
    photos: { status: 'unknown', lastCheck: null, error: null },
    space: { status: 'unknown', lastCheck: null, error: null }
  });
  const [checking, setChecking] = useState(false);

  const updateService = useCallback((name, status, error = null) => {
    setServices(prev => {
      const prevStatus = prev[name].status;
      const newStatus = status;
      
      if (prevStatus !== newStatus || error) {
        const message = error 
          ? `${name}: ${error}`
          : `${name}: ${prevStatus} → ${newStatus}`;
          
        const level = status === 'rate-limited' ? 'warn' : (error ? 'error' : 'info');
        loggingService.log(name, message, level);
      }

      return {
        ...prev,
        [name]: {
          status: newStatus,
          lastCheck: new Date(),
          error
        }
      };
    });
  }, []);

  const checkServices = useCallback(async () => {
    setChecking(true);
    try {
      const proxyCheck = await fetch('http://localhost:3001/health').then(res => res.json());
      updateService('proxy', proxyCheck.status === 'ok' ? 'healthy' : 'error', proxyCheck.error);

      const backendCheck = await fetch('http://localhost:3002/health').then(res => res.json());
      updateService('backend', backendCheck.status === 'ok' ? 'healthy' : 'error', backendCheck.error);

      const serviceChecks = {
        finance: 'http://localhost:3002/api/finance/health',
        flight: 'http://localhost:3002/api/flight/health',
        weather: 'http://localhost:3002/api/weather/health',
        photos: 'http://localhost:3002/api/photos/health',
        space: 'http://localhost:3002/api/space/health'
      };

      await Promise.all(Object.entries(serviceChecks).map(async ([service, url]) => {
        try {
          const response = await fetch(url);
          let data;
          try {
            data = await response.json();
          } catch (error) {
            updateService(service, 'error', 'Invalid response format');
            loggingService.log(service, 'Failed to parse response', 'error');
            return;
          }

          if (response.status === 429 || data?.error?.includes('429') || data?.error?.toLowerCase().includes('rate limit')) {
            updateService(service, 'rate-limited', 'Rate limit exceeded');
            loggingService.log(service, 'Rate limited, using cached data', 'warn');
            return;
          }
          
          if (response.status === 401 || data?.error?.includes('401')) {
            updateService(service, 'error', 'Authentication failed');
            loggingService.log(service, 'Authentication failed', 'error');
            return;
          }

          if (data?.status === 'ok') {
            updateService(service, 'healthy');
          } else if (data.status === 'rate-limited') {
            updateService(service, 'rate-limited', 'Rate limit exceeded');
            loggingService.log(service, 'Rate limited, using cached data', 'warn');
          } else {
            updateService(service, 'error', data.error || 'Service check failed');
          }
        } catch (error) {
          console.error(`Error checking ${service}:`, error);
          updateService(service, 'error', error.message);
        }
      }));
    } catch (error) {
      console.error('Error checking services:', error);
      loggingService.log('monitor', `Service check error: ${error.message}`, 'error');
    } finally {
      setChecking(false);
    }
  }, [updateService]);

  useEffect(() => {
    checkServices();
    const interval = setInterval(checkServices, 10000);
    return () => clearInterval(interval);
  }, [checkServices]);

  return { services, checking, checkServices };
};

// Custom hook for managing activity logs
const useActivityLogs = () => {
  const [activityLog, setActivityLog] = useState([]);
  const consoleIntercepted = useRef(false);

  useEffect(() => {
    if (!consoleIntercepted.current) {
      const originalConsole = {
        log: console.log,
        error: console.error,
        warn: console.warn,
        info: console.info
      };

      console.log = (...args) => {
        loggingService.log('browser', args.join(' '), 'info');
        originalConsole.log.apply(console, args);
      };

      console.error = (...args) => {
        loggingService.log('browser', args.join(' '), 'error');
        originalConsole.error.apply(console, args);
      };

      console.warn = (...args) => {
        loggingService.log('browser', args.join(' '), 'warn');
        originalConsole.warn.apply(console, args);
      };

      console.info = (...args) => {
        // Don't log console.info to avoid recursion with activity log
        originalConsole.info.apply(console, args);
      };

      consoleIntercepted.current = true;

      // Restore original console on cleanup
      return () => {
        Object.assign(console, originalConsole);
      };
    }
  }, []);

  useEffect(() => {
    const fetchLogs = () => {
      const logs = loggingService.getRecentLogs(100);
      setActivityLog(logs.map(log => ({
        timestamp: new Date(log.timestamp).toLocaleTimeString(),
        type: log.level.toLowerCase(),
        component: log.component,
        message: log.message
      })).filter(Boolean));
    };

    fetchLogs(); // Initial fetch
    const interval = setInterval(fetchLogs, 1000);
    return () => clearInterval(interval);
  }, []);

  return activityLog;
};

const SystemMonitor = () => {
  const { stats, error: statsError, loading: statsLoading, refetch: refetchStats } = useSystemStats();
  const { services, checking: servicesChecking, checkServices } = useServiceHealth();
  const activityLog = useActivityLogs();

  const formatBytes = (bytes) => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-6 h-6 text-red-500" />;
      case 'rate-limited':
        return <Clock className="w-6 h-6 text-yellow-500" />;
      default:
        return <Clock className="w-6 h-6 text-gray-500" />;
    }
  };

  const getLogIcon = (type) => {
    switch (type.toLowerCase()) {
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'warn':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">System Monitor</h1>
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => {
              refetchStats();
              checkServices();
            }}
            className="flex items-center space-x-2 bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded transition-colors"
            disabled={statsLoading || servicesChecking}
          >
            <RotateCw className={`w-5 h-5 ${(statsLoading || servicesChecking) ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <div className="flex items-center space-x-2">
            <RefreshCw className="w-5 h-5" />
            <span>Updated: {new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-4 gap-6">
        {statsError ? (
          <div className="col-span-4 bg-red-900/50 text-red-200 p-6 rounded-lg shadow-lg flex items-center space-x-3">
            <AlertCircle className="w-6 h-6" />
            <span>Error loading system stats: {statsError}</span>
          </div>
        ) : (
          <>
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg hover:bg-gray-700 transition-colors cursor-help">
              <div className="flex items-center space-x-4">
                <Cpu className="w-8 h-8" />
                <div>
                  <div className="text-4xl font-bold">{stats.cpu.usage}%</div>
                  <div className="text-sm text-gray-400">CPU Usage</div>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 p-6 rounded-lg shadow-lg hover:bg-gray-700 transition-colors cursor-help">
              <div className="flex items-center space-x-4">
                <Thermometer className="w-8 h-8" />
                <div>
                  <div className="text-4xl font-bold">{stats.cpu.temp}°C</div>
                  <div className="text-sm text-gray-400">Temperature</div>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 p-6 rounded-lg shadow-lg hover:bg-gray-700 transition-colors cursor-help">
              <div className="flex items-center space-x-4">
                <HardDrive className="w-8 h-8" />
                <div>
                  <div className="text-4xl font-bold">
                    {Math.round((stats.memory.used / stats.memory.total) * 100)}%
                  </div>
                  <div className="text-sm text-gray-400">
                    {formatBytes(stats.memory.used)} / {formatBytes(stats.memory.total)}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 p-6 rounded-lg shadow-lg hover:bg-gray-700 transition-colors cursor-help">
              <div className="flex items-center space-x-4">
                <Network className="w-8 h-8" />
                <div>
                  <div className="text-xl font-bold">↓{stats.network.rx} MB/s</div>
                  <div className="text-sm font-bold">↑{stats.network.tx} MB/s</div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Service Status */}
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold flex items-center">
            <RefreshCw className="w-5 h-5 mr-2" />
            Service Status
          </h2>
          <button 
            onClick={checkServices}
            className="flex items-center space-x-2 bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded transition-colors text-sm"
            disabled={servicesChecking}
          >
            <RotateCw className={`w-4 h-4 ${servicesChecking ? 'animate-spin' : ''}`} />
            <span>Check Now</span>
          </button>
        </div>
        <div className="grid grid-cols-7 gap-4">
          {Object.entries(services).map(([name, service]) => {
            const getStatusColor = (status) => {
              switch (status) {
                case 'healthy': return 'bg-green-600';
                case 'error': return 'bg-red-600';
                case 'rate-limited': return 'bg-yellow-600';
                default: return 'bg-gray-600';
              }
            };
            
            return (
              <div 
                key={name} 
                className={`
                  p-4 rounded-lg text-center flex flex-col items-center justify-center
                  ${getStatusColor(service.status)}
                  transition-all duration-300 transform hover:scale-105 cursor-help
                `}
                title={service.error || `Status: ${service.status}`}
              >
                <h3 className="text-sm font-semibold capitalize mb-1">{name}</h3>
                {getStatusIcon(service.status)}
                {service.status !== 'error' && (
                  <p className="text-xs opacity-75 mt-1">
                    {service.lastCheck?.toLocaleTimeString() || 'Never'}
                  </p>
                )}
                {service.status === 'rate-limited' && (
                  <p className="text-xs opacity-75">Rate Limited</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* System Logs */}
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg flex-grow">
        <h2 className="text-xl font-bold mb-4 flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          System Logs
        </h2>
        <div className="overflow-y-auto max-h-96 space-y-2">
          {activityLog.map((log, i) => (
            <div 
              key={i} 
              className={`p-3 rounded text-sm flex items-start ${
                log.type === 'error' ? 'bg-red-900/50 text-red-200' :
                log.type === 'warn' ? 'bg-yellow-900/50 text-yellow-200' :
                'bg-gray-700/50'
              }`}
            >
              {getLogIcon(log.type)}
              <div className="ml-2">
                <span className="text-gray-400">{log.timestamp}</span>
                <span className="mx-2 text-gray-400">[{log.component}]</span>
                <span>{log.message}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SystemMonitor;
