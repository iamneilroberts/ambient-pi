import React from 'react';
import StockCard from './StockCard';

const StockGrid = ({ stocks, isEditing, onRemoveStock }) => {
  if (stocks.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-8 text-center text-gray-400">
        No stocks tracked. Click "Edit Stocks" to add some.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {stocks.map(stock => (
        <StockCard
          key={stock.id}
          stock={stock}
          isEditing={isEditing}
          onRemove={onRemoveStock}
        />
      ))}
    </div>
  );
};

export default StockGrid;
