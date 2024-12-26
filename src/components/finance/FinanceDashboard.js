import React, { useState, useEffect, useCallback } from 'react';
import { Edit2, X, Plus, RefreshCcw } from 'lucide-react'; // Removed unused Loader
import StockCard from './StockCard';
import MarketNews from './MarketNews';

const API_KEY = 'FL3wKRKbNIh7OuLDTYSMbINWtNEfwIXh';
const STORAGE_KEY = 'tracked-stocks';
const CACHE_KEY = 'stock-data-cache';
const CACHE_DURATION = 60000; // 1 minute cache

const FinanceDashboard = () => {
  const [stocks, setStocks] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : ['AAPL', 'MSFT', 'GOOGL'];
    } catch (err) {
      console.error('Error reading from localStorage:', err);
      return ['AAPL', 'MSFT', 'GOOGL'];
    }
  });
  
  const [stockData, setStockData] = useState(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_DURATION) {
          return data;
        }
      }
      return {};
    } catch (err) {
      return {};
    }
  });

  const [isEditing, setIsEditing] = useState(false);
  const [newSymbol, setNewSymbol] = useState('');
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [error, setError] = useState(null);
  const [apiCallCount, setApiCallCount] = useState(0);

  // Save stocks to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stocks));
    } catch (err) {
      console.error('Error saving to localStorage:', err);
    }
  }, [stocks]);

  // Cache stock data
  useEffect(() => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        data: stockData,
        timestamp: Date.now()
      }));
    } catch (err) {
      console.error('Error caching stock data:', err);
    }
  }, [stockData]);

  const fetchStockData = useCallback(async () => {
    if (apiCallCount >= 250) {
      setError('Daily API call limit reached (250/250). Data updates paused until tomorrow.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const promises = stocks.map(symbol =>
        fetch(`https://financialmodelingprep.com/api/v3/quote/${symbol}?apikey=${API_KEY}`)
          .then(res => res.json())
          .then(data => data[0])
      );

      const results = await Promise.all(promises);
      const newData = {};
      let validResponses = 0;
      
      results.forEach((data, index) => {
        if (data) {
          validResponses++;
          const symbol = stocks[index];
          newData[symbol] = {
            symbol: data.symbol,
            currentPrice: data.price,
            priceChange: data.change,
            percentChange: data.changesPercentage,
            volume: data.volume,
            dayHigh: data.dayHigh,
            dayLow: data.dayLow
          };
        }
      });

      setStockData(newData);
      setLastUpdate(new Date());
      setApiCallCount(prev => prev + validResponses);
    } catch (err) {
      setError('Failed to fetch stock data');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  }, [stocks, apiCallCount]); // Added fetchStockData dependencies

  // Initial fetch and refresh interval
  useEffect(() => {
    fetchStockData();
    
    const interval = setInterval(() => {
      if (apiCallCount < 250) {
        fetchStockData();
      }
    }, CACHE_DURATION);
    
    return () => clearInterval(interval);
  }, [fetchStockData]); // Fixed dependency warning

  const handleAddStock = async (e) => {
    e.preventDefault();
    const symbol = newSymbol.trim().toUpperCase();
    if (!symbol || stocks.includes(symbol)) return;

    if (apiCallCount >= 250) {
      setError('Cannot add new stock - daily API limit reached');
      return;
    }

    try {
      const response = await fetch(
        `https://financialmodelingprep.com/api/v3/quote/${symbol}?apikey=${API_KEY}`
      );
      const data = await response.json();

      if (data[0]?.symbol) {
        setStocks(prev => [...prev, symbol]);
        setNewSymbol('');
        setError(null);
        setApiCallCount(prev => prev + 1);
      } else {
        setError(`Could not find stock: ${symbol}`);
      }
    } catch (err) {
      setError('Failed to add stock');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Stock Dashboard</h1>
          <div className="text-sm text-gray-400 mt-1">
            API Calls: {apiCallCount}/250
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={fetchStockData}
            disabled={loading || apiCallCount >= 250}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg flex items-center gap-2"
          >
            {isEditing ? <X className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
            {isEditing ? 'Done' : 'Edit Stocks'}
          </button>
        </div>
      </div>

      {lastUpdate && (
        <div className="text-sm text-gray-400 mb-4">
          Last updated: {lastUpdate.toLocaleTimeString()}
        </div>
      )}

      {error && (
        <div className="bg-red-900/50 text-red-200 p-4 rounded-lg mb-4">
          {error}
        </div>
      )}

      {/* Add stock form */}
      {isEditing && (
        <form onSubmit={handleAddStock} className="mb-6 flex gap-4">
          <input
            type="text"
            value={newSymbol}
            onChange={(e) => setNewSymbol(e.target.value)}
            placeholder="Enter stock symbol (e.g., AAPL)"
            className="bg-gray-800 px-4 py-2 rounded-lg flex-grow"
            disabled={apiCallCount >= 250}
          />
          <button
            type="submit"
            disabled={apiCallCount >= 250}
            className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            Add Stock
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Stock grid */}
        <div className="lg:col-span-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stocks.map(symbol => (
              <StockCard
                key={symbol}
                stock={stockData[symbol] || { symbol, loading: true }}
                onRemove={() => setStocks(prev => prev.filter(s => s !== symbol))}
                isEditing={isEditing}
              />
            ))}
          </div>
        </div>

        {/* News Panel */}
        <div className="lg:col-span-1">
          <MarketNews apiKey={API_KEY} stocks={stocks} />
        </div>
      </div>
    </div>
  );
};

export default FinanceDashboard;
