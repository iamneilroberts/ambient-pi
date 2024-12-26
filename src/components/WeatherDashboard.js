import React, { useState, useEffect } from 'react';
import { 
  Thermometer, Wind, Sun, Moon, CloudRain, 
  AlertTriangle, Radio
} from 'lucide-react';
import { config } from '../config/display-config';

const WeatherDashboard = () => {
  const [weatherData, setWeatherData] = useState(null);
  const [hourlyForecast, setHourlyForecast] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [radarStation, setRadarStation] = useState(null);
  const [selectedRadar, setSelectedRadar] = useState('base');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get the radar image URL based on the station and type
  const getRadarUrls = (station) => {
    if (!station) return null;
    return {
      base: `https://radar.weather.gov/ridge/standard/${station}_0.gif`,
      topology: `https://radar.weather.gov/ridge/Overlays/Topo/Short/${station}_Topo_Short.jpg`,
      counties: `https://radar.weather.gov/ridge/Overlays/County/Short/${station}_County_Short.gif`,
      highways: `https://radar.weather.gov/ridge/Overlays/Highways/Short/${station}_Highways_Short.gif`,
      cities: `https://radar.weather.gov/ridge/Overlays/Cities/Short/${station}_City_Short.gif`,
      warnings: `https://radar.weather.gov/ridge/Overlays/Warnings/Short/${station}_Warnings_0.gif`,
      legend: `https://radar.weather.gov/ridge/Legend/N0R/${station}_N0R_Legend_0.gif`
    };
  };

  useEffect(() => {
    const fetchWeatherData = async () => {
      try {
        const { lat, lon } = config.location;
        const baseUrl = 'https://api.weather.gov';
        
        // Get points data first (required for other endpoints)
        const pointsResponse = await fetch(`${baseUrl}/points/${lat},${lon}`);
        if (!pointsResponse.ok) throw new Error('Failed to fetch points data');
        const pointsData = await pointsResponse.json();
        
        // Store radar station
        setRadarStation(pointsData.properties.radarStation);
        
        // Get forecast data
        const forecastResponse = await fetch(pointsData.properties.forecast);
        if (!forecastResponse.ok) throw new Error('Failed to fetch forecast');
        const forecastData = await forecastResponse.json();

        // Get hourly forecast
        const hourlyResponse = await fetch(pointsData.properties.forecastHourly);
        if (!hourlyResponse.ok) throw new Error('Failed to fetch hourly forecast');
        const hourlyData = await hourlyResponse.json();
        setHourlyForecast(hourlyData.properties.periods);
        
        // Get alerts
        const alertsResponse = await fetch(`${baseUrl}/alerts/active/zone/${pointsData.properties.forecastZone}`);
        if (alertsResponse.ok) {
          const alertsData = await alertsResponse.json();
          setAlerts(alertsData.features || []);
        }
        
        // Update weather data state
        setWeatherData({
          current: forecastData.properties.periods[0],
          forecast: forecastData.properties.periods.slice(1, 8) // Next 7 periods
        });
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching weather data:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchWeatherData();
    const interval = setInterval(fetchWeatherData, 300000); // Update every 5 minutes
    return () => clearInterval(interval);
  }, []);

  // Radar layer selector component
  const RadarSelector = () => (
    <div className="flex gap-2">
      {['Base', 'Composite', 'Velocity'].map((type) => (
        <button
          key={type}
          onClick={() => setSelectedRadar(type.toLowerCase())}
          className={`px-4 py-2 rounded-lg ${
            selectedRadar === type.toLowerCase()
              ? 'bg-blue-600 text-white'
              : 'bg-slate-700 text-slate-300'
          }`}
        >
          {type}
        </button>
      ))}
    </div>
  );

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
        <div className="text-red-200 text-xl">Error: {error}</div>
      </div>
    );
  }

  const { current, forecast } = weatherData;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 to-slate-900 p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-white text-3xl font-bold">
            {config.location.city}, {config.location.state}
          </h1>
          <div className="text-slate-300 text-base">
            {new Date().toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit',
              weekday: 'long',
              month: 'long',
              day: 'numeric'
            })}
          </div>
        </div>
      </div>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <div className="mb-8">
          <div className="bg-red-900/50 rounded-xl p-6 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-8 h-8 text-red-400" />
              <h2 className="text-white text-2xl font-bold">Weather Alerts</h2>
            </div>
            <div className="space-y-4">
              {alerts.map((alert, index) => (
                <div key={index} className="bg-red-950/50 rounded-lg p-4">
                  <div className="text-red-200 font-bold text-lg">
                    {alert.properties.event}
                  </div>
                  <div className="text-red-100 mb-2">
                    {alert.properties.headline}
                  </div>
                  <div className="text-red-200 text-sm">
                    Valid until: {new Date(alert.properties.expires).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Hourly Forecast */}
      <div className="mb-4">
        <h2 className="text-white text-xl font-bold mb-2">Next 12 Hours</h2>
        <div className="bg-slate-800/50 rounded-lg p-4 backdrop-blur-sm">
          <div className="grid grid-cols-12 gap-2">
            {hourlyForecast?.slice(0, 12).map((hour, index) => (
              <div key={index} className="text-center">
                <div className="text-slate-300 text-sm mb-2">
                  {new Date(hour.startTime).toLocaleTimeString([], { hour: 'numeric', hour12: true }).toLowerCase()}
                </div>
                <div className="text-white font-bold text-lg mb-1">
                  {hour.temperature}°
                </div>
                {hour.probabilityOfPrecipitation?.value > 0 && (
                  <div className="text-blue-400 text-sm">
                    {hour.probabilityOfPrecipitation.value}%
                  </div>
                )}
                <div className="flex justify-center mt-2">
                  <div
                    className="transform"
                    style={{
                      borderLeft: '2px solid white',
                      borderBottom: '2px solid white',
                      width: '8px',
                      height: '8px',
                      transform: `rotate(${
                        ({ 'N': 180, 'NE': 225, 'E': 270, 'SE': 315,
                           'S': 0, 'SW': 45, 'W': 90, 'NW': 135 
                        })[hour.windDirection] || 0}deg)`
                    }}
                  />
                </div>
                <div className="text-slate-300 text-xs">
                  {hour.windSpeed.split(' ')[0]}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        {/* Current Conditions */}
        <div className="bg-slate-800/50 rounded-lg p-4 backdrop-blur-sm">
          <h2 className="text-white text-xl font-bold mb-2">Current Conditions</h2>
          <div className="space-y-4">
            <div>
              <div className="text-5xl font-bold text-white mb-1">
                {current.temperature}°{current.temperatureUnit}
              </div>
              <div className="text-slate-300 text-lg">
                {current.shortForecast}
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white mb-1">
                {current.windSpeed}
              </div>
              <div className="text-slate-300">
                Wind from {current.windDirection}
              </div>
            </div>
            <div className="text-slate-300 text-sm">
              {current.detailedForecast}
            </div>
          </div>
        </div>

        {/* Radar Section */}
        <div className="col-span-2 bg-slate-800/50 rounded-lg p-4 backdrop-blur-sm">
          <h2 className="text-white text-xl font-bold mb-2">Weather Radar</h2>
          <div className="relative h-96 bg-slate-900 rounded-lg overflow-hidden">
            {radarStation ? (
              <>
                {/* Base map layers */}
                <img 
                  src={getRadarUrls(radarStation).topology}
                  alt="Topography"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <img 
                  src={getRadarUrls(radarStation).counties}
                  alt="Counties"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <img 
                  src={getRadarUrls(radarStation).highways}
                  alt="Highways"
                  className="absolute inset-0 w-full h-full object-cover opacity-50"
                />
                
                {/* Radar and warning layers */}
                <img 
                  src={getRadarUrls(radarStation).base}
                  alt="Radar"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <img 
                  src={getRadarUrls(radarStation).warnings}
                  alt="Warnings"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                
                {/* City labels and legend */}
                <img 
                  src={getRadarUrls(radarStation).cities}
                  alt="Cities"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <img 
                  src={getRadarUrls(radarStation).legend}
                  alt="Legend"
                  className="absolute bottom-2 right-2 h-24"
                />
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-300">
                Radar data unavailable
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Extended Forecast */}
      <h2 className="text-white text-xl font-bold mb-2">7-Day Forecast</h2>
      <div className="grid grid-cols-4 gap-2">
        {weatherData.forecast.map((period, index) => (
          <div 
            key={index} 
            className="bg-slate-800/50 rounded-lg p-3 backdrop-blur-sm"
          >
            <div className="text-white font-bold text-sm mb-1">{period.name}</div>
            <div className="flex justify-between items-start">
              <div>
                <div className="text-xl font-bold text-white mb-1">
                  {period.temperature}°{period.temperatureUnit}
                </div>
                <div className="text-slate-300 text-xs">
                  {period.windSpeed} {period.windDirection}
                </div>
              </div>
            </div>
            <div className="text-slate-300 text-xs mt-1">
              {period.shortForecast}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WeatherDashboard;
