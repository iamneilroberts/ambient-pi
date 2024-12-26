import React, { useState, useEffect } from 'react';

const StockTest = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const API_KEY = 'FL3wKRKbNIh7OuLDTYSMbINWtNEfwIXh'; // Corrected case-sensitive key

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Fetching stock data...');
        const response = await fetch(
          `https://financialmodelingprep.com/api/v3/quote/AAPL?apikey=${API_KEY}`
        );
        
        console.log('Response status:', response.status);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const json = await response.json();
        console.log('Received data:', json);
        
        setData(json);
        setError(null);
      } catch (err) {
        console.error('Error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="text-white p-4">
      <h1 className="text-xl font-bold mb-4">AAPL Stock Test</h1>
      {loading && <div>Loading...</div>}
      {error && <div className="text-red-400">Error: {error}</div>}
      {data && (
        <pre className="bg-gray-800 p-4 rounded overflow-auto">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
};

export default StockTest;
