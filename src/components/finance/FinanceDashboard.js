import React, { useState, useEffect } from 'react';
import { fetchMarketNews, getTrackedStocks, addStock, removeStock } from './financeApi';
import StockPrice from './StockPrice';
import MarketNews from './MarketNews';
import MarketIndices from './MarketIndices';

const StockLoadingSkeleton = () => (
  <div className="animate-pulse bg-gray-800 rounded-lg p-4">
    <div className="h-4 bg-gray-700 rounded w-24 mb-2"></div>
    <div className="h-6 bg-gray-700 rounded w-32"></div>
  </div>
);

const AddStockForm = ({ onAdd, isAdding }) => {
  const [symbol, setSymbol] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!symbol || isAdding) return;

    try {
      await onAdd(symbol);
      setSymbol('');
    } catch (error) {
      // Error handling is managed by parent component
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={symbol}
        onChange={(e) => setSymbol(e.target.value.toUpperCase())}
        placeholder="Add stock symbol"
        className="bg-gray-700 text-white px-3 py-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        disabled={isAdding}
      />
      <button
        type="submit"
        disabled={isAdding || !symbol}
        className={`px-3 py-1 rounded ${
          isAdding || !symbol
            ? 'bg-gray-600 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700'
        } text-white font-medium`}
      >
        {isAdding ? 'Adding...' : 'Add'}
      </button>
    </form>
  );
};

const StockGrid = ({ stocks, onRemove }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {stocks.length === 0 ? (
      Array.from({ length: 3 }).map((_, index) => (
        <StockLoadingSkeleton key={index} />
      ))
    ) : (
      stocks.map((symbol, index) => (
        <div key={symbol} className="relative group">
          <StockPrice 
            symbol={symbol} 
            loadDelay={index * 500}
          />
          <button
            onClick={() => onRemove(symbol)}
            className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
            title="Remove stock"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      ))
    )}
  </div>
);

const FinanceDashboard = () => {
  const [news, setNews] = useState(null);
  const [error, setError] = useState(null);
  const [stocks, setStocks] = useState([]);
  const [addError, setAddError] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const { symbols } = await getTrackedStocks();
        if (!mounted) return;
        setStocks(symbols);
        setError(null);
        
        setTimeout(async () => {
          try {
            const validSymbols = Array.isArray(symbols) ? symbols : [];
            const newsData = await fetchMarketNews(validSymbols);
            if (!mounted) return;
            setNews(newsData);
          } catch (newsErr) {
            if (mounted) {
              setError(prev => prev || { message: 'Failed to fetch market news' });
            }
          }
        }, 5000);
      } catch (err) {
        if (mounted) {
          setError(err);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 600000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleAddStock = async (symbol) => {
    setIsAdding(true);
    setAddError(null);

    try {
      const { symbols } = await addStock(symbol);
      setStocks(symbols);
    } catch (err) {
      setAddError(err.message);
      throw err;
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveStock = async (symbol) => {
    try {
      const { symbols } = await removeStock(symbol);
      setStocks(symbols);
    } catch (err) {
      setError({ message: `Failed to remove ${symbol}` });
    }
  };

  return (
    <div className="p-4">
      <div className="mb-8">
        <MarketIndices />
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">Market Overview</h2>
          <AddStockForm onAdd={handleAddStock} isAdding={isAdding} />
        </div>
        
        {addError && (
          <div className="mb-4 p-2 bg-red-900/50 text-red-400 rounded">
            {addError}
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <StockLoadingSkeleton key={index} />
            ))}
          </div>
        ) : (
          <StockGrid stocks={stocks} onRemove={handleRemoveStock} />
        )}
      </div>

      <div className="mt-8">
        <MarketNews
          data={news}
          isLoading={!news && !error}
          error={error}
        />
      </div>
    </div>
  );
};

export default FinanceDashboard;
