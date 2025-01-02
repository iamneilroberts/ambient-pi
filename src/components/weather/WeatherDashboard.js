import React, { useState, useEffect, useMemo } from 'react';
import { WeatherService } from './WeatherService';
import { config } from '../../config/config';
import { AlertTriangle } from 'lucide-react';
import { transformAlerts } from './weatherUtils';
import CurrentConditions from './components/CurrentConditions';
import HourlyForecast from './components/HourlyForecast';
import ExtendedForecast from './components/ExtendedForecast';
import WeatherAlerts from './components/WeatherAlerts';
import { ThemeFrame } from '../themes/ThemeFrame';

const WeatherDashboard = () => {
  const [weatherState, setWeatherState] = useState({
    currentWeather: null,
    forecast: [],
    hourlyForecast: [],
    alerts: [],
    radarStation: null,
    loading: true,
    error: null,
    dataSource: 'NWS'
  });

  // Initialize weather service once using useMemo
  const weatherService = useMemo(() => new WeatherService(), []);

  // Fetch weather data
  useEffect(() => {
    let mounted = true;
    const fetchWeatherData = async () => {
      try {
        if (!mounted) return;
        setWeatherState(prev => ({ ...prev, loading: true }));
        const { lat, lon } = config.location;
        
        // Get weather data from service
        const data = await weatherService.getWeatherData(lat, lon);
        
        if (!data.currentWeather) {
          throw new Error('No current weather data available');
        }

        // Update weather state
        if (mounted) {
          setWeatherState(prev => ({
            ...prev,
            currentWeather: {
              temperature: data.currentWeather.temperature,
              temperatureUnit: data.currentWeather.temperatureUnit,
              windSpeed: data.currentWeather.windSpeed,
              windDirection: data.currentWeather.windDirection,
              shortForecast: data.currentWeather.shortForecast,
              detailedForecast: data.currentWeather.detailedForecast
            },
            forecast: data.forecast || [],
            hourlyForecast: data.hourly || [],
            dataSource: data.metadata?.source || 'Unknown',
            radarStation: data.metadata?.station || null,
            error: null
          }));

          // Fetch alerts if using NWS
          if (data.metadata?.source === 'NWS') {
            try {
              const alertsData = await weatherService.getAlerts(lat, lon);
              if (mounted) {
                setWeatherState(prev => ({
                  ...prev,
                  alerts: transformAlerts(alertsData)
                }));
              }
            } catch (alertError) {
              if (mounted) {
                setWeatherState(prev => ({ ...prev, alerts: [] }));
              }
            }
          }
        }
      } catch (err) {
        if (mounted) {
          setWeatherState(prev => ({ 
            ...prev, 
            error: err.message 
          }));
        }
      } finally {
        if (mounted) {
          setWeatherState(prev => ({ ...prev, loading: false }));
        }
      }
    };

    fetchWeatherData();
    const interval = setInterval(fetchWeatherData, 300000); // 5 minutes
    
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [weatherService]); // Add weatherService dependency

  const { loading, error, currentWeather, forecast, hourlyForecast, alerts, radarStation, dataSource } = weatherState;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-blue-900 to-slate-900">
        <ThemeFrame>
          <div className="text-white text-xl">Loading weather data...</div>
        </ThemeFrame>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-red-900 to-slate-900">
        <ThemeFrame className="max-w-lg">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-red-400" />
            <div className="text-xl font-bold text-red-200">Weather Data Error</div>
          </div>
          <div className="text-red-100 mb-4">{error}</div>
          <div className="text-sm text-red-300">
            Location: {config.location.city}, {config.location.state}
          </div>
        </ThemeFrame>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 overflow-auto bg-gradient-to-b from-slate-900 to-gray-900 text-white">
      <div className="p-4 pb-32">
        {/* Header - Responsive */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
          <div className="w-full md:w-auto">
            <h1 className="text-xl md:text-2xl font-bold break-words">
              {config.location.city}, {config.location.state}
            </h1>
            <div className="text-sm text-slate-300 flex flex-col md:flex-row items-start md:items-center">
              <span>
                {new Date().toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  weekday: 'long',
                  day: 'numeric'
                })}
              </span>
              <span className="md:ml-2 text-xs text-slate-400">via {dataSource}</span>
            </div>
          </div>
        </div>

        {/* Weather Alerts */}
        <WeatherAlerts alerts={alerts} />

        {/* Main Content - Horizontal scroll on mobile, grid on desktop */}
        <div className="flex flex-col md:grid md:grid-cols-12 gap-4">
          {/* Current Conditions */}
          <div className="w-full md:col-span-4 space-y-4">
            <ThemeFrame className="md:h-auto">
              <CurrentConditions currentWeather={currentWeather} />
            </ThemeFrame>
            <ThemeFrame className="md:h-auto">
              <HourlyForecast hourlyForecast={hourlyForecast} />
            </ThemeFrame>
          </div>

          {/* Radar */}
          <div className="w-full md:col-span-5">
            <ThemeFrame className="h-[300px] md:h-full">
              {weatherService.renderWeatherComponents({ radarStation }).radar}
            </ThemeFrame>
          </div>

          {/* Extended Forecast */}
          <div className="w-full md:col-span-3">
            <ThemeFrame className="md:h-auto">
              <ExtendedForecast forecast={forecast} />
            </ThemeFrame>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeatherDashboard;
