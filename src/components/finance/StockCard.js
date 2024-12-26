import React from 'react';
import { TrendingUp, TrendingDown, X, Loader } from 'lucide-react';

const StockCard = ({ stock, onRemove, isEditing }) => {
  if (stock.loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-4 min-h-[200px] flex items-center justify-center">
        <Loader className="w-6 h-6 animate-spin text-blue-400" />
      </div>
    );
  }

  const isPositive = stock.percentChange >= 0;

  return (
    <div className="bg-gray-800 rounded-lg p-4">
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

      {/* Additional stats */}
      <div className="grid grid-cols-2 gap-4 text-sm text-gray-400">
        <div>
          <div className="font-medium">Volume</div>
          <div>{stock.volume?.toLocaleString()}</div>
        </div>
        <div>
          <div className="font-medium">Day Range</div>
          <div>${stock.dayLow?.toFixed(2)} - ${stock.dayHigh?.toFixed(2)}</div>
        </div>
      </div>
    </div>
  );
};

export default StockCard;
