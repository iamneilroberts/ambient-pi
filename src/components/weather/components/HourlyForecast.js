import React from 'react';
import { ResponsiveContainer, ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { chartConfig } from '../weatherUtils';

const HourlyForecast = ({ hourlyForecast }) => {
  if (!hourlyForecast?.length) return null;

  const { margin, grid, xAxis, yAxis, tooltip, temperature, precipitation } = chartConfig.hourly;

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-white">Next 12 Hours</h3>
        <div className="flex items-center gap-4 text-sm text-gray-300">
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-red-400 rounded"></div>
            <span>Temperature</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-400 opacity-30 rounded"></div>
            <span>Precipitation %</span>
          </div>
        </div>
      </div>
      <div className="h-64 bg-gray-700/30 rounded-lg shadow p-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={hourlyForecast.slice(0, 12)} margin={margin}>
            <CartesianGrid strokeDasharray={grid.strokeDasharray} stroke={grid.stroke} />
            <XAxis 
              dataKey="startTime" 
              stroke={xAxis.stroke}
              tickFormatter={(time) => new Date(time).getHours() + ':00'}
              interval={1}
              tick={{ fontSize: xAxis.fontSize }}
              height={xAxis.height}
            />
            <YAxis 
              yAxisId="temp"
              stroke={yAxis.temp.stroke}
              tick={{ fontSize: yAxis.temp.fontSize, fontWeight: yAxis.temp.fontWeight }}
              domain={['dataMin - 2', 'dataMax + 2']}
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
              labelFormatter={(time) => new Date(time).toLocaleTimeString([], { 
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              })}
            />
            <Line 
              type="monotone"
              dataKey="temperature"
              stroke={temperature.stroke}
              strokeWidth={temperature.strokeWidth}
              yAxisId="temp"
              dot={false}
            />
            <Bar
              dataKey="probabilityOfPrecipitation.value"
              fill={precipitation.fill}
              yAxisId="precip"
              opacity={precipitation.opacity}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default HourlyForecast;
