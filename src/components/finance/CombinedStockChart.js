import React, { useState, useEffect } from 'react';
import { fetchStockHistory } from './financeApi';

const timeframes = [
  { label: '1D', days: 1 },
  { label: '1W', days: 7 },
  { label: '1M', days: 30 },
  { label: 'MTD', days: 'mtd' },
  { label: 'YTD', days: 'ytd' },
];

// Generate a unique color for each stock
const getStockColor = (index) => {
  const colors = [
    '#34D399', // green
    '#F87171', // red
    '#60A5FA', // blue
    '#FBBF24', // yellow
    '#A78BFA', // purple
    '#EC4899', // pink
    '#2DD4BF', // teal
    '#F472B6', // pink
    '#FB923C', // orange
    '#4ADE80', // light green
  ];
  return colors[index % colors.length];
};

const CombinedStockChart = ({ symbols }) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState('1M');
  const [stocksData, setStocksData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStocks, setSelectedStocks] = useState(symbols.reduce((acc, symbol) => ({
    ...acc,
    [symbol]: true
  }), {}));

  useEffect(() => {
    let mounted = true;

    const fetchAllStockData = async () => {
      try {
        setLoading(true);
        const promises = symbols.map(symbol => fetchStockHistory(symbol));
        const results = await Promise.all(promises);
        
        if (!mounted) return;

        const processedData = {};
        results.forEach((result, index) => {
          const symbol = symbols[index];
          if (result?.['Time Series (Daily)']) {
            const timeSeries = result['Time Series (Daily)'];
            processedData[symbol] = Object.entries(timeSeries).map(([date, data]) => ({
              date,
              close: parseFloat(data['4. close'])
            })).reverse();
          }
        });

        setStocksData(processedData);
        setError(null);
      } catch (err) {
        if (mounted) {
          setError(err.message);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchAllStockData();

    return () => {
      mounted = false;
    };
  }, [symbols]);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-80 bg-gray-700/50 rounded"></div>
      </div>
    );
  }

  if (error || Object.keys(stocksData).length === 0) {
    return null;
  }

  // Filter data based on selected timeframe
  const filterData = (data) => {
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

  // Normalize prices to percentage change from start
  const normalizeData = (data) => {
    if (!data.length) return [];
    const startPrice = data[0].close;
    return data.map(point => ({
      ...point,
      value: ((point.close - startPrice) / startPrice) * 100
    }));
  };

  // Get all unique dates across all stocks
  const allDates = new Set();
  Object.values(stocksData).forEach(stockData => {
    filterData(stockData).forEach(point => allDates.add(point.date));
  });
  const sortedDates = Array.from(allDates).sort();

  // Calculate chart dimensions
  const width = 800;
  const height = 400;
  const padding = 40;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  // Calculate min and max values for scaling
  let minValue = Infinity;
  let maxValue = -Infinity;
  Object.entries(stocksData).forEach(([symbol, data]) => {
    if (selectedStocks[symbol]) {
      const normalized = normalizeData(filterData(data));
      normalized.forEach(point => {
        minValue = Math.min(minValue, point.value);
        maxValue = Math.max(maxValue, point.value);
      });
    }
  });

  // Add some padding to min/max
  const valueRange = maxValue - minValue;
  minValue -= valueRange * 0.1;
  maxValue += valueRange * 0.1;

  // Create SVG paths for each stock
  const stockPaths = Object.entries(stocksData).map(([symbol, data], index) => {
    if (!selectedStocks[symbol]) return null;

    const normalized = normalizeData(filterData(data));
    const points = normalized.map(point => {
      const x = ((sortedDates.indexOf(point.date)) / (sortedDates.length - 1)) * chartWidth + padding;
      const y = height - (((point.value - minValue) / (maxValue - minValue)) * chartHeight + padding);
      return `${x},${y}`;
    }).join(' ');

    return (
      <polyline
        key={symbol}
        points={points}
        fill="none"
        stroke={getStockColor(index)}
        strokeWidth="2"
      />
    );
  });

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2">
          {timeframes.map(({ label }) => (
            <button
              key={label}
              onClick={() => setSelectedTimeframe(label)}
              className={`px-3 py-1 text-sm rounded ${
                selectedTimeframe === label
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {symbols.map((symbol, index) => (
            <button
              key={symbol}
              onClick={() => setSelectedStocks(prev => ({
                ...prev,
                [symbol]: !prev[symbol]
              }))}
              className={`px-2 py-1 text-xs rounded flex items-center gap-1 ${
                selectedStocks[symbol]
                  ? 'bg-gray-700 text-white'
                  : 'bg-gray-800 text-gray-400'
              }`}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: getStockColor(index) }}
              />
              {symbol}
            </button>
          ))}
        </div>
      </div>
      
      <div className="relative">
        <svg
          width={width}
          height={height}
          className="overflow-visible"
          viewBox={`0 0 ${width} ${height}`}
        >
          {/* Y-axis labels */}
          <text x={padding - 5} y={padding} className="text-xs fill-gray-400" textAnchor="end">
            {`+${maxValue.toFixed(1)}%`}
          </text>
          <text x={padding - 5} y={height - padding} className="text-xs fill-gray-400" textAnchor="end">
            {`${minValue.toFixed(1)}%`}
          </text>
          
          {/* Zero line */}
          <line
            x1={padding}
            y1={height - (((0 - minValue) / (maxValue - minValue)) * chartHeight + padding)}
            x2={width - padding}
            y2={height - (((0 - minValue) / (maxValue - minValue)) * chartHeight + padding)}
            stroke="#4B5563"
            strokeWidth="1"
            strokeDasharray="4"
          />
          
          {stockPaths}
        </svg>
      </div>
    </div>
  );
};

export default CombinedStockChart;
