import React, { useState, useEffect, useMemo } from 'react';
import { Loader, TrendingUp, TrendingDown } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

// Move indices object outside component
const MARKET_INDICES = {
  '^GSPC': 'S&P 500',
  '^DJI': 'Dow Jones',
  '^IXIC': 'NASDAQ',
  'AAPL': 'Apple Inc.'
};

const SimpleFinanceDashboard = () => {
  const [marketData, setMarketData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Memoize the fetch function to avoid recreation on every render
  const fetchMarketData = useMemo(() => async () => {
    try {
      setLoading(true);
      const symbols = Object.keys(MARKET_INDICES);
      
      const results = await Promise.all(
        symbols.map(async (symbol) => {
          try {
            // First, try to get the quote data
            const quoteRes = await fetch(`http://localhost:3005/yf/quote?symbols=${symbol}`);
            if (!quoteRes.ok) throw new Error(`Quote API error: ${quoteRes.status}`);
            const quoteData = await quoteRes.json();
            
            console.log(`Quote data for ${symbol}:`, quoteData);
            
            if (!quoteData || !quoteData.quoteResponse || !quoteData.quoteResponse.result) {
              throw new Error('Invalid quote data structure');
            }

            const quote = quoteData.quoteResponse.result[0];

            // Then get the chart data
            const chartRes = await fetch(`http://localhost:3005/yf/chart/${symbol}`);
            if (!chartRes.ok) throw new Error(`Chart API error: ${chartRes.status}`);
            const chartData = await chartRes.json();
            
            console.log(`Chart data for ${symbol}:`, chartData);

            if (!chartData || !chartData.chart || !chartData.chart.result) {
              throw new Error('Invalid chart data structure');
            }

            const chart = chartData.chart.result[0];
            
            // Extract price history with error checking
            const priceHistory = chart.timestamp.map((time, i) => ({
              time,
              price: chart.indicators.quote[0].close?.[i] || chart.indicators.quote[0].open?.[i]
            })).filter(point => point.price !== null);

            return {
              symbol,
              name: MARKET_INDICES[symbol],
              price: quote.regularMarketPrice,
              change: quote.regularMarketChangePercent,
              priceHistory
            };
          } catch (err) {
            console.error(`Error processing ${symbol}:`, err);
            return {
              symbol,
              name: MARKET_INDICES[symbol],
              error: err.message,
              price: null,
              change: null,
              priceHistory: []
            };
          }
        })
      );

      const newMarketData = {};
      results.forEach((result) => {
        newMarketData[result.symbol] = result;
      });

      setMarketData(newMarketData);
      setLastUpdate(new Date());
      setError(null);
    } catch (err) {
      console.error('Error fetching market data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []); // No dependencies since it doesn't use any props or state

  // Set up the interval for fetching data
  useEffect(() => {
    fetchMarketData();
    const interval = setInterval(fetchMarketData, 10000);
    return () => clearInterval(interval);
  }, [fetchMarketData]);

  if (loading && Object.keys(marketData).length === 0) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <div className="flex items-center justify-center">
          <Loader className="w-6 h-6 animate-spin text-blue-400" />
          <span className="ml-2">Loading market data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="mb-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Market Dashboard</h1>
        {lastUpdate && (
          <div className="text-sm text-gray-400">
            Last update: {lastUpdate.toLocaleTimeString()}
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-900/50 rounded-lg text-red-200">
          Error: {error}
        </div>
      )}

      {/* Market Indices */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {Object.entries(marketData).map(([symbol, data]) => (
          <div key={symbol} className="bg-gray-800 rounded-lg p-4">
            <div className="text-sm text-gray-400">{data.name}</div>
            {data.error ? (
              <div className="text-red-400 text-sm mt-2">Error: {data.error}</div>
            ) : (
              <>
                <div className="text-2xl font-bold">{data.price?.toFixed(2)}</div>
                <div className={`flex items-center gap-1 ${
                  data.change >= 0 ? 'text-green-500' : 'text-red-500'
                }`}>
                  {data.change >= 0 ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  <span>{data.change?.toFixed(2)}%</span>
                </div>

                {/* Price chart */}
                {data.priceHistory.length > 0 && (
                  <div className="h-16 mt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data.priceHistory}>
                        <Line 
                          type="monotone"
                          dataKey="price"
                          stroke={data.change >= 0 ? '#4ADE80' : '#EF4444'}
                          dot={false}
                          strokeWidth={1.5}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SimpleFinanceDashboard;
