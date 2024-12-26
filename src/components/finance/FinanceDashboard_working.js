import React, { useState, useEffect } from 'react';
import { Edit2, X, Loader, Plus } from 'lucide-react';
import { financeApi } from './financeApi';
import StockCard from './StockCard';

const STORAGE_KEY = 'tracked-stocks';

const FinanceDashboard = () => {
  const [stocks, setStocks] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : ['AAPL', 'GOOGL', 'MSFT'];
  });
  const [stockData, setStockData] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [newSymbol, setNewSymbol] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Save stocks to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stocks));
  }, [stocks]);

  // Fetch stock data
  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await financeApi.fetchBatchStockData(stocks);
        
        if (!mounted) return;

        // Convert array to object for easier lookup
        const stockMap = data.reduce((acc, stock) => {
          acc[stock.symbol] = stock;
          return acc;
        }, {});

        setStockData(stockMap);
        setError(null);
      } catch (err) {
        console.error('Error fetching stocks:', err);
        if (mounted) {
          setError('Failed to fetch stock data');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 60000); // Update every minute

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [stocks]);

  const handleAddStock = async (e) => {
    e.preventDefault();
    const symbol = newSymbol.trim().toUpperCase();
    if (!symbol || stocks.includes(symbol)) return;

    try {
      // Verify the stock exists by fetching its data
      await financeApi.fetchStockData(symbol);
      setStocks(prev => [...prev, symbol]);
      setNewSymbol('');
      setError(null);
    } catch (err) {
      setError(`Could not find stock with symbol ${symbol}`);
    }
  };

  const handleRemoveStock = (symbol) => {
    setStocks(prev => prev.filter(s => s !== symbol));
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Stock Dashboard</h1>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg flex items-center gap-2"
        >
          {isEditing ? <X className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
          {isEditing ? 'Done' : 'Edit Stocks'}
        </button>
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

      {/* Loading state */}
      {loading && stocks.length === 0 ? (
        <div className="flex items-center justify-center h-64">
          <Loader className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : (
        /* Stock grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
  );
};

export default FinanceDashboard;
