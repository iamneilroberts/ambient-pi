import React, { useState } from 'react';
import { PlusCircle, X, HelpCircle } from 'lucide-react';
import StockSearch from './StockSearch';

const StockEditor = ({ onAddStock, onClose }) => {
  const [newStock, setNewStock] = useState({
    symbol: '',
    name: '',
    purchaseDate: '',
    purchasePrice: ''
  });
  const [showHelp, setShowHelp] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newStock.symbol) return;
    
    onAddStock(newStock);
    setNewStock({ symbol: '', name: '', purchaseDate: '', purchasePrice: '' });
  };

  const handleStockSelect = (stock) => {
    setNewStock(prev => ({
      ...prev,
      symbol: stock.symbol,
      name: stock.name
    }));
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 mb-6">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-bold">Add Stock</h3>
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="text-gray-400 hover:text-white"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {showHelp && (
        <div className="bg-gray-700/50 p-4 rounded-lg mb-4 text-sm">
          <p className="mb-2"><strong>How to add stocks:</strong></p>
          <ul className="list-disc pl-4 space-y-1">
            <li>Search for a stock by name or symbol (e.g., "Apple" or "AAPL")</li>
            <li>Select the stock from the dropdown results</li>
            <li>Optionally add purchase date and price to track performance</li>
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-4">
        <StockSearch
          onSelect={handleStockSelect}
          placeholder="Search for a stock"
        />
        <input
          type="date"
          value={newStock.purchaseDate}
          onChange={e => setNewStock(prev => ({ 
            ...prev, 
            purchaseDate: e.target.value 
          }))}
          className="bg-gray-700 px-3 py-2 rounded-lg w-40"
        />
        <input
          type="number"
          step="0.01"
          placeholder="Purchase Price"
          value={newStock.purchasePrice}
          onChange={e => setNewStock(prev => ({ 
            ...prev, 
            purchasePrice: e.target.value 
          }))}
          className="bg-gray-700 px-3 py-2 rounded-lg w-40"
        />
        <button
          type="submit"
          disabled={!newStock.symbol}
          className="bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:cursor-not-allowed px-4 py-2 rounded-lg flex items-center gap-2 whitespace-nowrap"
        >
          <PlusCircle className="w-4 h-4" />
          Add Stock
        </button>
      </form>
    </div>
  );
};

export default StockEditor;
