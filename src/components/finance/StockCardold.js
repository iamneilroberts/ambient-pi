import React from 'react';
import { TrendingUp, TrendingDown, X } from 'lucide-react';
import { LineChart, Line, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const StockCard = ({ stock, onRemove, isEditing }) => {
  const isPositive = stock.percentChange >= 0;

  return (
    <div className="bg-gray-800 rounded-lg p-4 relative">
      {/* Header with symbol and remove button */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold">{stock.symbol}</h3>
        </div>
        {isEditing && (
          <button
            onClick={() => onRemove(stock.symbol)}
            className="text-red-500 hover:text-red-400"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Price and change */}
      <div className="mb-4">
        <div className="text-2xl font-bold">
          ${stock.currentPrice?.toFixed(2)}
        </div>
        <div className={`flex items-center gap-1 ${
          isPositive ? 'text-green-500' : 'text-red-500'
        }`}>
          {isPositive ? (
            <TrendingUp className="w-4 h-4" />
          ) : (
            <TrendingDown className="w-4 h-4" />
          )}
          <span>
            {stock.priceChange?.toFixed(2)} ({stock.percentChange?.toFixed(2)}%)
          </span>
        </div>
      </div>

      {/* Chart */}
      <div className="h-24">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={stock.chartData}>
            <YAxis domain={['dataMin', 'dataMax']} hide />
            <Line
              type="monotone"
              dataKey="price"
              stroke={isPositive ? '#10B981' : '#EF4444'}
              dot={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1F2937',
                border: 'none',
                borderRadius: '0.5rem'
              }}
              formatter={(value) => [`$${value.toFixed(2)}`, 'Price']}
              labelFormatter={(time) => new Date(time * 1000).toLocaleString()}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default StockCard;
