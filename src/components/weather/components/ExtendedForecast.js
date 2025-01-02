import React from 'react';
import { ResponsiveContainer, ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { chartConfig, getWeatherIcon, getPrecipitation } from '../weatherUtils';

const ExtendedForecast = ({ forecast }) => {
  if (!forecast?.length) return null;

  const { margin, grid, xAxis, yAxis, tooltip, temperature, precipitation } = chartConfig.forecast;

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg p-4 h-full">
      <h3 className="text-lg font-bold text-white mb-4">7-Day Forecast</h3>
      
      {/* 7-Day Temperature & Rain Graph */}
      <div className="h-48 mb-4 bg-gray-700/30 rounded-lg shadow p-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={forecast.slice(0, 7)} margin={margin}>
            <CartesianGrid strokeDasharray={grid.strokeDasharray} stroke={grid.stroke} />
            <XAxis 
              dataKey="name" 
              stroke={xAxis.stroke}
              tick={{ fontSize: xAxis.fontSize }}
              height={xAxis.height}
            />
            <YAxis 
              yAxisId="temp"
              stroke={yAxis.temp.stroke}
              tick={{ fontSize: yAxis.temp.fontSize }}
              domain={['dataMin - 5', 'dataMax + 5']}
              tickFormatter={(value) => `${value}°`}
              width={yAxis.temp.width}
            />
            <YAxis 
              yAxisId="precip"
              orientation="right"
              stroke={yAxis.precip.stroke}
              domain={yAxis.precip.domain}
              hide
            />
            <Tooltip 
              contentStyle={tooltip.style}
              formatter={(value, name) => {
                if (name === 'precipitation') return [`${value}%`, 'Rain Chance'];
                return [`${value}°${forecast[0].temperatureUnit}`, 'Temperature'];
              }}
            />
            <Line 
              type="monotone"
              dataKey="temperature"
              stroke={temperature.stroke}
              strokeWidth={temperature.strokeWidth}
              yAxisId="temp"
              dot={temperature.dot}
            />
            <Bar
              dataKey={(data) => getPrecipitation(data.detailedForecast) || 0}
              fill={precipitation.fill}
              yAxisId="precip"
              opacity={precipitation.opacity}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Forecast Details */}
      <div className="space-y-2 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 400px)' }}>
        {forecast.slice(0, 7).map((day, idx) => (
          <div key={idx} className="text-sm border-b border-gray-700 pb-3 hover:bg-gray-700/30 rounded-lg p-2 transition-colors">
            <div className="font-bold text-white">{day.name}</div>
            <div className="mt-1">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-white">{day.temperature}°{day.temperatureUnit}</span>
                <span className="text-2xl" title={day.shortForecast}>
                  {getWeatherIcon(day.shortForecast)}
                </span>
              </div>
              <span className="text-gray-300 leading-tight block mt-1">{day.shortForecast}</span>
              {getPrecipitation(day.detailedForecast) !== null && (
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-blue-400 text-xs">💧</span>
                  <span className="text-blue-400 text-xs">{getPrecipitation(day.detailedForecast)}%</span>
                </div>
              )}
              <div className="text-xs text-gray-400 leading-snug mt-2">
                {day.detailedForecast}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExtendedForecast;
