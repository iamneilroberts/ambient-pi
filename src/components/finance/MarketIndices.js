import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Loader } from 'lucide-react';

const INDEX_SYMBOLS = {
  'S&P 500': '^GSPC',
  'Dow Jones': '^DJI',
  'NASDAQ': '^IXIC',
  'Russell 2000': '^RUT'
};

const MarketIndices = () => {
  const [indices, setIndices] = useState({});
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    const fetchIndices = async () => {
      try {
        const PROXY_PORT = process.env.REACT_APP_PROXY_PORT || 3005;
        const symbols = Object.values(INDEX_SYMBOLS).join(',');
        const response = await fetch(
          `http://localhost:${PROXY_PORT}/yf/v7/finance/quote?symbols=${symbols}`
        );

        if (!response.ok) throw new Error('Failed to fetch indices');
        
        const data = await response.json();
        const result = {};
        
        data.quoteResponse.result.forEach(quote => {
          const name = Object.entries(INDEX_SYMBOLS).find(([_, symbol]) => symbol === quote.symbol)?.[0];
          if (name) {
            result[name] = {
              value: quote.regularMarketPrice.toFixed(2),
              change: quote.regularMarketChangePercent.toFixed(2),
              dayChange: quote.regularMarketChange.toFixed(2)
            };
          }
        });

        setIndices(result);
        setLastUpdate(new Date());
        setLoading(false);
      } catch (error) {
        console.error('Error fetching indices:', error);
        setLoading(false);
      }
    };

    fetchIndices();
    // Update every minute
    const interval = setInterval(fetchIndices, 60000);
    
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-4 gap-4 bg-gray-800/50 p-4 rounded-lg">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-4 bg-gray-700 rounded w-20 mb-2"></div>
            <div className="h-6 bg-gray-700 rounded w-24 mb-1"></div>
            <div className="h-4 bg-gray-700 rounded w-16"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-4 bg-gray-800/50 p-4 rounded-lg">
      {Object.entries(indices).map(([name, data]) => (
        <div key={name}>
          <div className="text-sm text-gray-400">{name}</div>
          <div className="text-xl font-bold">{data.value}</div>
          <div className={`text-sm flex items-center gap-1 ${
            parseFloat(data.change) >= 0 ? 'text-green-500' : 'text-red-500'
          }`}>
            {parseFloat(data.change) >= 0 ? 
              <TrendingUp className="w-4 h-4" /> : 
              <TrendingDown className="w-4 h-4" />
            }
            {parseFloat(data.change) >= 0 ? '+' : ''}{data.change}%
            <span className="text-xs">({data.dayChange})</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MarketIndices;
