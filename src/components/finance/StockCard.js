import React from 'react';

const StockCard = ({ data, isLoading, error }) => {
  console.log('StockCard render:', { symbol: data?.['Global Quote']?.['01. symbol'], isLoading, hasError: !!error, hasData: !!data?.['Global Quote'] });

  const renderContent = () => {
    if (isLoading) {
      console.log('StockCard: Showing loading skeleton');
      return (
        <div className="animate-pulse">
          <div className="h-4 bg-gray-700 rounded w-3/4 mb-4"></div>
          <div className="h-8 bg-gray-700 rounded w-1/2 mb-4"></div>
          <div className="h-4 bg-gray-700 rounded w-full"></div>
        </div>
      );
    }

    if (error) {
      console.log('StockCard: Showing error state:', error);
      return (
        <div className="text-red-400">Error: {error.message || error}</div>
      );
    }

    if (!data?.['Global Quote']) {
      console.log('StockCard: No data available');
      return (
        <div className="text-gray-400">No data available</div>
      );
    }

    console.log('StockCard: Rendering data for:', data['Global Quote']['01. symbol']);

    const quote = data['Global Quote'];
    const price = parseFloat(quote['05. price']);
    const change = parseFloat(quote['09. change']);
    const changePercent = parseFloat(quote['10. change percent'].replace('%', ''));
    const isPositive = change >= 0;

    return (
      <>
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-bold text-white">
              {quote['01. symbol']}
            </h3>
            <div className="text-3xl font-bold text-white mt-1">
              ${price.toFixed(2)}
            </div>
          </div>
          <div className={`text-right ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
            <div className="text-lg font-bold">
              {isPositive ? '+' : ''}{change.toFixed(2)}
            </div>
            <div>
              {isPositive ? '+' : ''}{changePercent.toFixed(2)}%
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-gray-400">Open</div>
            <div className="text-white">${parseFloat(quote['02. open']).toFixed(2)}</div>
          </div>
          <div>
            <div className="text-gray-400">Previous Close</div>
            <div className="text-white">${parseFloat(quote['08. previous close']).toFixed(2)}</div>
          </div>
          <div>
            <div className="text-gray-400">High</div>
            <div className="text-white">${parseFloat(quote['03. high']).toFixed(2)}</div>
          </div>
          <div>
            <div className="text-gray-400">Low</div>
            <div className="text-white">${parseFloat(quote['04. low']).toFixed(2)}</div>
          </div>
          <div className="col-span-2">
            <div className="text-gray-400">Volume</div>
            <div className="text-white">
              {parseInt(quote['06. volume']).toLocaleString()}
            </div>
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg p-4 min-w-[300px]">
      {renderContent()}
    </div>
  );
};

export default StockCard;
