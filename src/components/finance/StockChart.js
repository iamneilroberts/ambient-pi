import React, { useState, useEffect } from 'react';
import { fetchStockHistory } from './financeApi';

const timeframes = [
  { label: '1W', days: 7 },
  { label: '1M', days: 30 },
  { label: 'MTD', days: 'mtd' },
  { label: 'YTD', days: 'ytd' },
];

const StockChart = ({ symbol }) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState('1M');
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cacheAge, setCacheAge] = useState(null);

  useEffect(() => {
    let mounted = true;
    let retryTimeoutId;

    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetchStockHistory(symbol);
        if (!mounted) return;
        
        if (response?.['Time Series (Daily)']) {
          const timeSeries = response['Time Series (Daily)'];
          const prices = Object.entries(timeSeries).map(([date, data]) => ({
            date,
            close: parseFloat(data['4. close'])
          })).reverse();
          
          setData(prices);
          setError(null);
          
          // Set cache age if available
          if (response._cache?.age) {
            const ageHours = Math.floor(response._cache.age / 3600);
            setCacheAge(ageHours);
          }
        }
      } catch (err) {
        if (mounted) {
          setError(err.message);
          // Retry after 1 minute on error
          retryTimeoutId = setTimeout(fetchData, 60000);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      mounted = false;
      if (retryTimeoutId) clearTimeout(retryTimeoutId);
    };
  }, [symbol]);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-32 bg-gray-700/50 rounded"></div>
      </div>
    );
  }

  if (error || !data) {
    return null;
  }

  // Filter data based on selected timeframe
  const filterData = () => {
    const now = new Date();
    const timeframe = timeframes.find(t => t.label === selectedTimeframe);
    
    if (!timeframe) return data;

    if (timeframe.days === 'ytd') {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      return data.filter(d => new Date(d.date) >= startOfYear);
    }

    if (timeframe.days === 'mtd') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return data.filter(d => new Date(d.date) >= startOfMonth);
    }

    const startDate = new Date(now.setDate(now.getDate() - timeframe.days));
    return data.filter(d => new Date(d.date) >= startDate);
  };

  const chartData = filterData();
  if (!chartData.length) return null;

  // Calculate chart dimensions and scaling
  const width = 280;
  const height = 120;
  const padding = 30;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;
  
  const prices = chartData.map(d => d.close);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice;

  // Calculate percentage change
  const startPrice = chartData[0].close;
  const endPrice = chartData[chartData.length - 1].close;
  const percentChange = ((endPrice - startPrice) / startPrice) * 100;

  // Create points for SVG path
  const points = chartData.map((d, i) => {
    const x = (i / (chartData.length - 1)) * chartWidth + padding;
    const y = height - (((d.close - minPrice) / priceRange) * chartHeight + padding);
    return `${x},${y}`;
  }).join(' ');

  const strokeColor = percentChange >= 0 ? '#34D399' : '#F87171';
  const gradientId = `gradient-${symbol}`;

  return (
    <div className="mt-2">
      <div className="flex justify-between items-center mb-2">
        <div className="flex gap-1">
        {timeframes.map(({ label }) => (
          <button
            key={label}
            onClick={() => setSelectedTimeframe(label)}
            className={`px-2 py-0.5 text-xs rounded ${
              selectedTimeframe === label
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {label}
          </button>
        ))}
        </div>
        {cacheAge && (
          <span className="text-xs text-gray-500">
            {cacheAge}h old
          </span>
        )}
      </div>
      
      <div className="relative bg-gray-800/50 rounded-lg p-2">
        <svg
          width={width}
          height={height}
          className="overflow-visible"
          viewBox={`0 0 ${width} ${height}`}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity="0.1" />
              <stop offset="100%" stopColor={strokeColor} stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Zero line if range crosses zero */}
          {minPrice < 0 && maxPrice > 0 && (
            <line
              x1={padding}
              y1={height - (((0 - minPrice) / priceRange) * chartHeight + padding)}
              x2={width - padding}
              y2={height - (((0 - minPrice) / priceRange) * chartHeight + padding)}
              stroke="#4B5563"
              strokeWidth="1"
              strokeDasharray="4"
            />
          )}
          
          {/* Area under the line */}
          <path
            d={`${points} L${width - padding},${height - padding} L${padding},${height - padding}Z`}
            fill={`url(#${gradientId})`}
          />

          {/* Line chart */}
          <polyline
            points={points}
            fill="none"
            stroke={strokeColor}
            strokeWidth="1.5"
          />
        </svg>
        
        {/* Price labels */}
        <div className="absolute top-1 right-2 text-xs text-gray-400">
          ${maxPrice.toFixed(2)}
        </div>
        <div className="absolute bottom-1 right-2 text-xs text-gray-400">
          ${minPrice.toFixed(2)}
        </div>
        
        {/* Percentage change */}
        <div className={`absolute top-1 left-2 text-xs ${percentChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {percentChange >= 0 ? '+' : ''}{percentChange.toFixed(2)}%
        </div>
      </div>
    </div>
  );
};

export default StockChart;
