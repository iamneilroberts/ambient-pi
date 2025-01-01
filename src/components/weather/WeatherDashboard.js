import React, { useState, useEffect, useMemo } from 'react';
import { ResponsiveContainer, ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { WeatherService } from './WeatherService';
import { config as displayConfig } from '../../config/display-config';
import { config } from '../../config/config';
import { AlertTriangle } from 'lucide-react';

const getWeatherIcon = (forecast) => {
  const description = forecast.toLowerCase();
  
  // Rain conditions
  if (description.includes('rain') || description.includes('shower')) {
    if (description.includes('light')) return '🌦';
    if (description.includes('heavy')) return '🌧';
    return '🌧';
  }
  
  // Snow conditions
  if (description.includes('snow')) {
    if (description.includes('light')) return '🌨';
    if (description.includes('heavy')) return '❄️';
    return '🌨';
  }
  
  // Thunderstorms
  if (description.includes('thunder') || description.includes('storm')) return '⛈';
  
  // Cloudy conditions
  if (description.includes('cloudy')) {
    if (description.includes('partly') || description.includes('mostly')) return '⛅';
    return '☁️';
  }
  
  // Clear conditions
  if (description.includes('clear') || description.includes('sunny')) {
    if (description.includes('partly')) return '⛅';
    return '☀️';
  }
  
  // Foggy conditions
  if (description.includes('fog')) return '🌫';
  
  // Default sunny
  return '☀️';
};

const getPrecipitation = (detailedForecast) => {
  if (!detailedForecast) return null;
  const text = detailedForecast.toLowerCase();
  
  // Look for percentage patterns
  const percentMatch = text.match(/(\d+)(?:\s)?% chance of/);
  if (percentMatch) {
    return parseInt(percentMatch[1]);
  }
  
  return null;
};

const WeatherDashboard = () => {
  const [weatherData, setWeatherData] = useState({
    currentWeather: null,
    forecast: []
  });
  const [hourlyForecast, setHourlyForecast] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [radarStation, setRadarStation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dataSource, setDataSource] = useState('NWS');

  // Initialize weather service
  const weatherService = useMemo(() => new WeatherService(), []);

  // Transform alerts data for WeatherAlerts component
  const transformAlerts = (alerts) => {
    if (!alerts?.features) return [];
    return alerts.features.map(alert => ({
      event: alert.properties.event,
      expires: alert.properties.expires,
      headline: alert.properties.headline,
      description: alert.properties.description,
      severity: alert.properties.severity,
      urgency: alert.properties.urgency,
      areaDesc: alert.properties.areaDesc,
      instruction: alert.properties.instruction
    }));
  };

  // Fetch weather data
  useEffect(() => {
    const fetchWeatherData = async () => {
      try {
        setLoading(true);
        const { lat, lon } = config.location;
        
        // Get weather data from service
        const data = await weatherService.getWeatherData(lat, lon);
        console.log('Received weather data:', data);
        
        if (!data.currentWeather) {
          throw new Error('No current weather data available');
        }

        // Update weather data state with explicit current conditions
        setWeatherData({
          currentWeather: {
            temperature: data.currentWeather.temperature,
            temperatureUnit: data.currentWeather.temperatureUnit,
            windSpeed: data.currentWeather.windSpeed,
            windDirection: data.currentWeather.windDirection,
            shortForecast: data.currentWeather.shortForecast,
            detailedForecast: data.currentWeather.detailedForecast
          },
          forecast: data.forecast || []
        });
        
        // Update hourly forecast if available
        if (data.hourly) {
          setHourlyForecast(data.hourly);
        }
        
        // Update data source
        setDataSource(data.metadata?.source || 'Unknown');
        
        // Set radar station if available
        if (data.metadata?.station) {
          setRadarStation(data.metadata.station);
        }

        // Fetch alerts if using NWS
        if (data.metadata?.source === 'NWS') {
          try {
            const alertsData = await weatherService.getAlerts(lat, lon);
            const transformedAlerts = transformAlerts(alertsData);
            setAlerts(transformedAlerts);
          } catch (alertError) {
            console.error('Error fetching alerts:', alertError);
            setAlerts([]);
          }
        }

        setError(null);
      } catch (err) {
        console.error('Error fetching weather data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchWeatherData();
    const interval = setInterval(fetchWeatherData, 300000); // 5 minutes
    
    return () => clearInterval(interval);
  }, [weatherService]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-blue-900 to-slate-900">
        <div className="text-white text-xl">Loading weather data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-red-900 to-slate-900">
        <div className="p-6 bg-gray-800/50 rounded-lg max-w-lg">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-red-400" />
            <div className="text-xl font-bold text-red-200">Weather Data Error</div>
          </div>
          <div className="text-red-100 mb-4">{error}</div>
          <div className="text-sm text-red-300">
            Location: {config.location.city}, {config.location.state}
          </div>
        </div>
      </div>
    );
  }

  // Get rendered components from weather service
  const components = weatherService.renderWeatherComponents({
    weatherData,
    hourlyForecast,
    alerts,
    radarStation
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-gray-900 text-white">
      <div className="p-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold">
              {config.location.city}, {config.location.state}
            </h1>
            <div className="text-sm text-slate-300">
              {new Date().toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit',
                weekday: 'long',
                day: 'numeric'
              })}
              <span className="ml-2 text-xs text-slate-400">via {dataSource}</span>
            </div>
          </div>
        </div>

        {/* Weather Alerts - Full width when present */}
        {alerts.length > 0 && (
          <div className="mb-4">
            <div className={`rounded-lg p-3 ${
              alerts.some(a => a.severity === 'Extreme') ? 'bg-red-900/90' :
              alerts.some(a => a.severity === 'Severe') ? 'bg-orange-800/70' :
              'bg-orange-700/60'
            }`}>
              {components.alerts}
            </div>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-12 gap-4">
          {/* Left Column - Current Conditions + Hourly */}
          <div className="col-span-4">
            {/* Current Conditions */}
            <div className="bg-slate-800/50 rounded-lg p-4 mb-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-4xl font-bold mb-2">
                    {weatherData.currentWeather?.temperature}°{weatherData.currentWeather?.temperatureUnit}
                  </div>
                  <div className="text-lg mb-2">{weatherData.currentWeather?.shortForecast}</div>
                </div>
                <div className="text-4xl" title={weatherData.currentWeather?.shortForecast}>
                  {weatherData.currentWeather?.shortForecast && getWeatherIcon(weatherData.currentWeather.shortForecast)}
                </div>
              </div>
              <div className="text-sm text-slate-300 mb-2">
                Wind: {weatherData.currentWeather?.windSpeed} {weatherData.currentWeather?.windDirection}
              </div>
              <div className="text-sm text-slate-200 leading-snug">
                {weatherData.currentWeather?.detailedForecast}
              </div>
            </div>

            {/* Temperature Graph */}
            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">Next 12 Hours</h3>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-0.5 bg-red-400"></div>
                    <span>Temperature</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-400 opacity-30"></div>
                    <span>Precipitation %</span>
                  </div>
                </div>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={hourlyForecast.slice(0, 12)} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="startTime" 
                      stroke="#9CA3AF"
                      tickFormatter={(time) => new Date(time).getHours() + ':00'}
                      interval={1}
                      tick={{ fontSize: 13 }}
                      height={30}
                    />
                    <YAxis 
                      yAxisId="temp"
                      stroke="#9CA3AF"
                      tick={{ fontSize: 14, fontWeight: 'bold' }}
                      domain={['dataMin - 2', 'dataMax + 2']}
                      tickFormatter={(value) => `${value}°`}
                      width={45}
                    />
                    <YAxis 
                      yAxisId="precip"
                      orientation="right"
                      stroke="#60A5FA"
                      domain={[0, 100]}
                      hide
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1F2937', border: 'none' }}
                      labelFormatter={(time) => new Date(time).toLocaleTimeString([], { 
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                      })}
                    />
                    <Line 
                      type="monotone"
                      dataKey="temperature"
                      stroke="#EF4444"
                      strokeWidth={2}
                      yAxisId="temp"
                      dot={false}
                    />
                    <Bar
                      dataKey="probabilityOfPrecipitation.value"
                      fill="#60A5FA"
                      yAxisId="precip"
                      opacity={0.3}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Center Column - Radar (Larger) */}
          <div className="col-span-5">
            <div className="bg-slate-800/50 rounded-lg p-4 h-full">
              {components.radar}
            </div>
          </div>

          {/* Right Column - Extended Forecast */}
          <div className="col-span-3">
            <div className="bg-slate-800/50 rounded-lg p-4 h-full">
              <h3 className="text-sm font-bold mb-2">7-Day Forecast</h3>
              <div className="space-y-2">
                {weatherData.forecast.slice(0, 7).map((day, idx) => (
                  <div key={idx} className="text-sm border-b border-slate-700 pb-3">
                    <div className="font-bold">{day.name}</div>
                    <div className="mt-1">
                      <div className="flex justify-between items-center">
                        <span className="text-lg">{day.temperature}°{day.temperatureUnit}</span>
                        <span className="text-2xl" title={day.shortForecast}>
                          {getWeatherIcon(day.shortForecast)}
                        </span>
                      </div>
                      <span className="text-slate-300 leading-tight block mt-1">{day.shortForecast}</span>
                      {getPrecipitation(day.detailedForecast) !== null && (
                        <div className="flex items-center gap-1 mt-1">
                          <span className="text-blue-400 text-xs">💧</span>
                          <span className="text-blue-400 text-xs">{getPrecipitation(day.detailedForecast)}%</span>
                        </div>
                      )}
                      <div className="text-xs text-slate-400 leading-snug mt-2">
                        {day.detailedForecast}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeatherDashboard;
