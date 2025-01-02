import React, { useState, useEffect } from 'react';
import { fetchStockQuote } from './financeApi';

const indices = [
  { symbol: '^GSPC', name: 'S&P 500' },
  { symbol: '^DJI', name: 'Dow Jones' },
  { symbol: '^IXIC', name: 'NASDAQ' },
];

const IndexItem = ({ symbol, name }) => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [cacheAge, setCacheAge] = useState(null);

  useEffect(() => {
    let mounted = true;
    const updateInterval = 60000; // 1 minute
    let intervalId;

    const fetchData = async () => {
      try {
        const response = await fetchStockQuote(symbol);
        if (!mounted) return;
        setData(response);
        setError(null);
        if (response._cache?.age) {
          setCacheAge(Math.floor(response._cache.age / 60)); // Convert to minutes
        }
      } catch (err) {
        if (mounted) {
          setError(err.message);
        }
      }
    };

    fetchData();
    intervalId = setInterval(fetchData, updateInterval);

    return () => {
      mounted = false;
      clearInterval(intervalId);
    };
  }, [symbol]);

  if (error) return null;

  const quote = data?.['Global Quote'];
  if (!quote) return null;

  const price = parseFloat(quote['05. price']).toFixed(2);
  const change = parseFloat(quote['09. change']);
  const changePercent = parseFloat(quote['10. change percent']?.replace('%', ''));
  const isPositive = change >= 0;
  const changeColor = isPositive ? 'text-green-400' : 'text-red-400';

  return (
    <div className="px-4 py-2 bg-gray-800/50 rounded-lg">
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-400">{name}</div>
        {cacheAge > 0 && (
          <div className="text-xs text-gray-500">{cacheAge}m</div>
        )}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-white font-medium">{price}</span>
        <span className={`text-xs ${changeColor}`}>
          {isPositive ? '+' : ''}{change.toFixed(2)} ({changePercent.toFixed(2)}%)
        </span>
      </div>
    </div>
  );
};

const MarketIndices = () => {
  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      {indices.map(index => (
        <IndexItem key={index.symbol} {...index} />
      ))}
    </div>
  );
};

export default MarketIndices;
