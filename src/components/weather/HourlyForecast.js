// src/components/weather/HourlyForecast.js
import React from 'react';

const HourlyForecast = ({ hourlyForecast }) => {
  if (!hourlyForecast?.length) return null;

  return (
    <div className="mb-4">
      <h2 className="text-white text-xl font-bold mb-2">Next 12 Hours</h2>
      <div className="bg-slate-800/50 rounded-lg p-4 backdrop-blur-sm">
        <div className="grid grid-cols-12 gap-2">
          {hourlyForecast.slice(0, 12).map((hour, index) => (
            <div key={index} className="text-center">
              <div className="text-slate-300 text-sm mb-2">
                {new Date(hour.startTime).toLocaleTimeString([], { 
                  hour: 'numeric',
                  hour12: true 
                }).toLowerCase()}
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
  );
};

export default HourlyForecast;
