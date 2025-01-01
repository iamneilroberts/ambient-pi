// src/components/weather/ExtendedForecast.js
import React from 'react';

const getPrecipitation = (detailedForecast) => {
  const text = detailedForecast.toLowerCase();
  
  // Look for percentage patterns
  const percentMatch = text.match(/(\d+)(?:\s)?% chance of/);
  if (percentMatch) {
    return parseInt(percentMatch[1]);
  }
  
  return null;
};

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

const ExtendedForecast = ({ forecast }) => {
  if (!forecast?.length) return null;

  return (
    <>
      <h2 className="text-white text-xl font-bold mb-2">7-Day Forecast</h2>
      <div className="grid grid-cols-4 gap-2">
        {forecast.map((period, index) => (
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
              <div className="text-3xl" title={period.shortForecast}>
                {getWeatherIcon(period.shortForecast)}
              </div>
            </div>
            {period.detailedForecast && (
              <div className="flex flex-col gap-1 mt-1">
                {getPrecipitation(period.detailedForecast) !== null && (
                  <div className="flex items-center gap-1">
                    <span className="text-blue-400 text-xs">💧</span>
                    <span className="text-blue-400 text-xs">{getPrecipitation(period.detailedForecast)}%</span>
                  </div>
                )}
                <div className="text-slate-300 text-xs">
                  {period.shortForecast}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
};

export default ExtendedForecast;
