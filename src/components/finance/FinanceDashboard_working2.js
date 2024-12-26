import React, { useState, useEffect } from 'react';
import { Edit2, X, Loader, Plus, RefreshCcw, Clock } from 'lucide-react';
import { financeApi } from './financeApi';
import StockCard from './StockCard';
import MarketIndices from './MarketIndices';
import MarketNews from './MarketNews';

const STORAGE_KEY = 'tracked-stocks';
const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

const FinanceDashboard = () => {
  const [stocks, setStocks] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : ['AAPL', 'GOOGL', 'MSFT'];
  });
  const [stockData, setStockData] = useState({});
  const [indices, setIndices] = useState([
    { name: 'S&P 500', value: '0.00', change: '0.00' },
    { name: 'NASDAQ', value: '0.00', change: '0.00' },
    { name: 'DOW', value: '0.00', change: '0.00' }
  ]);
  const [isEditing, setIsEditing] = useState(false);
  const [newSymbol, setNewSymbol] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Save stocks to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stocks));
  }, [stocks]);

  const fetchData = async (showLoader = true) => {
    try {
      if (showLoader) setIsRefreshing(true);
      
      // Fetch stock data
      const data = await financeApi.fetchBatchStockData(stocks);
      const stockMap = data.reduce((acc, stock) => {
        acc[stock.symbol] = stock;
        return acc;
      }, {});

      // Fetch index data
      const indexData = await financeApi.fetchBatchStockData(['^GSPC', '^IXIC', '^DJI']);
      const updatedIndices = [
        { name: 'S&P 500', value: indexData[0].currentPrice.toFixed(2), change: indexData[0].percentChange.toFixed(2) },
        { name: 'NASDAQ', value: indexData[1].currentPrice.toFixed(2), change: indexData[1].percentChange.toFixed(2) },
        { name: 'DOW', value: indexData[2].currentPrice.toFixed(2), change: indexData[2].percentChange.toFixed(2) }
      ];

      setStockData(stockMap);
      setIndices(updatedIndices);
      setLastRefresh(new Date());
      setError(null);
    } catch (err) {
      console.error('Error fetching market data:', err);
      setError('Failed to fetch market data');
    } finally {
      setIsRefreshing(false);
      setLoading(false);
    }
  };

  // Initial fetch and refresh interval
  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(false), REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [stocks]);

  const handleAddStock = async (e) => {
    e.preventDefault();
    const symbol = newSymbol.trim().toUpperCase();
    if (!symbol || stocks.includes(symbol)) return;

    try {
      await financeApi.fetchStockData(symbol);
      setStocks(prev => [...prev, symbol]);
      setNewSymbol('');
      setError(null);
    } catch (err) {
      setError(`Could not find stock with symbol ${symbol}`);
    }
  };

  const handleManualRefresh = () => {
    if (!isRefreshing) {
      fetchData();
    }
  };

  const handleRemoveStock = (symbol) => {
    setStocks(prev => prev.filter(s => s !== symbol));
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      {/* Header with Market Indices */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Stock Dashboard</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <RefreshCcw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
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

        {/* Market Indices */}
        <MarketIndices indices={indices} />
        
        {lastRefresh && (
          <div className="flex items-center gap-2 text-sm text-gray-400 mt-2">
            <Clock className="w-4 h-4" />
            Last updated: {lastRefresh.toLocaleTimeString()}
          </div>
        )}
      </div>

      {/* Error display */}
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
          />
          <button
            type="submit"
            className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Stock
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main stock grid */}
        <div className="lg:col-span-3">
          {loading && stocks.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <Loader className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {stocks.map(symbol => (
                <StockCard
                  key={symbol}
                  stock={stockData[symbol] || { symbol }}
                  onRemove={handleRemoveStock}
                  isEditing={isEditing}
                />
              ))}
            </div>
          )}
        </div>

        {/* News Panel */}
        <div className="lg:col-span-1">
          <div className="bg-gray-800 rounded-lg p-4 h-full">
            <MarketNews symbols={stocks} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinanceDashboard;
