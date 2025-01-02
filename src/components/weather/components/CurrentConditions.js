import React from 'react';
import { getWeatherIcon, getPrecipitation, getWindDirectionRotation } from '../weatherUtils';

const CurrentConditions = ({ currentWeather }) => {
  if (!currentWeather) return null;

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg p-4 mb-4">
      {/* Temperature and Icon */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="text-5xl font-bold mb-2">
            {currentWeather.temperature}°{currentWeather.temperatureUnit}
          </div>
          <div className="text-lg">{currentWeather.shortForecast}</div>
        </div>
        <div className="text-5xl" title={currentWeather.shortForecast}>
          {currentWeather.shortForecast && getWeatherIcon(currentWeather.shortForecast)}
        </div>
      </div>
      
      {/* Wind and Additional Data */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Wind Info */}
        <div className="bg-gray-700/50 rounded-lg shadow p-3">
          <div className="text-xs text-gray-400 mb-1">Wind</div>
          <div className="flex items-center gap-2">
            <div className="relative w-8 h-8">
              <div 
                className="absolute inset-0 flex items-center justify-center"
                style={{
                  transform: `rotate(${getWindDirectionRotation(currentWeather.windDirection)})`
                }}
              >
                ↑
              </div>
            </div>
            <div>
              <div className="font-bold">{currentWeather.windSpeed}</div>
              <div className="text-xs text-gray-400">{currentWeather.windDirection}</div>
            </div>
          </div>
        </div>
        
        {/* Precipitation Chance */}
        <div className="bg-gray-700/50 rounded-lg shadow p-3">
          <div className="text-xs text-gray-400 mb-1">Rain Chance</div>
          <div className="flex items-center gap-2">
            <span className="text-blue-400">💧</span>
            <span className="font-bold">
              {getPrecipitation(currentWeather.detailedForecast) || '0'}%
            </span>
          </div>
        </div>
      </div>

      {/* Detailed Forecast */}
      <div className="text-sm text-gray-200 leading-snug bg-gray-700/50 rounded-lg shadow p-3">
        {currentWeather.detailedForecast}
      </div>
    </div>
  );
};

export default CurrentConditions;
