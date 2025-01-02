import React from 'react';

// Utility functions for formatting
const formatPrice = (value) => parseFloat(value).toFixed(2);
const formatVolume = (value) => parseInt(value).toLocaleString();
const formatChange = (value, includeSign = true) => {
  const formatted = formatPrice(value);
  return includeSign && parseFloat(value) >= 0 ? `+${formatted}` : formatted;
};

const StockCard = ({ data, isLoading, error }) => {
  // Error state
  if (error) {
    return (
      <div className="bg-gray-800 rounded-lg shadow-lg p-4 min-w-[300px]">
        <div className="text-red-400">Error: {error.message || error}</div>
      </div>
    );
  }

  // Loading or no data state
  const quote = data?.['Global Quote'];
  if (!quote?.['05. price']) {
    return (
      <div className="bg-gray-800 rounded-lg shadow-lg p-4 min-w-[300px]">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-700 rounded w-3/4 mb-4"></div>
          <div className="h-8 bg-gray-700 rounded w-1/2 mb-4"></div>
          <div className="h-4 bg-gray-700 rounded w-full"></div>
        </div>
      </div>
    );
  }

  // Parse data
  const price = parseFloat(quote['05. price']);
  const change = parseFloat(quote['09. change']);
  const changePercent = parseFloat(quote['10. change percent'].replace('%', ''));
  const isPositive = change >= 0;

  // Render data state
  return (
    <div className="bg-gray-800 rounded-lg shadow-lg p-4 min-w-[300px]">
      {/* Header with price and change */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-bold text-white">
            {quote['01. symbol']}
          </h3>
          <div className="text-3xl font-bold text-white mt-1">
            ${formatPrice(price)}
          </div>
        </div>
        <div className={`text-right ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
          <div className="text-lg font-bold">
            {formatChange(change)}
          </div>
          <div>
            {formatChange(changePercent)}%
          </div>
        </div>
      </div>
      
      {/* Price details grid */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="text-gray-400">Open</div>
          <div className="text-white">${formatPrice(quote['02. open'])}</div>
        </div>
        <div>
          <div className="text-gray-400">Previous Close</div>
          <div className="text-white">${formatPrice(quote['08. previous close'])}</div>
        </div>
        <div>
          <div className="text-gray-400">High</div>
          <div className="text-white">${formatPrice(quote['03. high'])}</div>
        </div>
        <div>
          <div className="text-gray-400">Low</div>
          <div className="text-white">${formatPrice(quote['04. low'])}</div>
        </div>
        <div className="col-span-2">
          <div className="text-gray-400">Volume</div>
          <div className="text-white">
            {formatVolume(quote['06. volume'])}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockCard;
