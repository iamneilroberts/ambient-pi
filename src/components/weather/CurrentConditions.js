// CurrentConditions.js
import React from 'react';

const CurrentConditions = ({ currentWeather }) => {
  // Early return with loading state if no data
  if (!currentWeather) {
    return (
      <div className="bg-slate-800/50 rounded-lg p-4 backdrop-blur-sm">
        <h2 className="text-white text-xl font-bold mb-2">Current Conditions</h2>
        <div className="text-slate-300">Loading current conditions...</div>
      </div>
    );
  }

  // Safely access properties with optional chaining and defaults
  const temperature = currentWeather?.temperature ?? 'N/A';
  const temperatureUnit = currentWeather?.temperatureUnit ?? 'F';
  const shortForecast = currentWeather?.shortForecast ?? 'No data available';
  const windSpeed = currentWeather?.windSpeed ?? 'N/A';
  const windDirection = currentWeather?.windDirection ?? '';
  const detailedForecast = currentWeather?.detailedForecast ?? '';

  return (
    <div className="bg-slate-800/50 rounded-lg p-4 backdrop-blur-sm">
      <h2 className="text-white text-xl font-bold mb-2">Current Conditions</h2>
      <div className="space-y-4">
        <div>
          <div className="text-5xl font-bold text-white mb-1">
            {temperature}°{temperatureUnit}
          </div>
          <div className="text-slate-300 text-lg">
            {shortForecast}
          </div>
        </div>
        <div>
          <div className="text-2xl font-bold text-white mb-1">
            {windSpeed}
          </div>
          {windDirection && (
            <div className="text-slate-300">
              Wind from {windDirection}
            </div>
          )}
        </div>
        {detailedForecast && (
          <div className="text-slate-300 text-sm">
            {detailedForecast}
          </div>
        )}
      </div>
    </div>
  );
};

export default CurrentConditions;
