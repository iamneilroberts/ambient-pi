import React, { useState, useEffect } from 'react';
import { Newspaper, Loader } from 'lucide-react';

const MarketNews = ({ apiKey, stocks = [] }) => {  // Added stocks prop
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        console.log('Fetching news for stocks:', stocks);
        // Join the stock symbols with commas and add to the URL
        const tickers = stocks.join(',');
        const response = await fetch(
          `https://financialmodelingprep.com/api/v3/stock_news?tickers=${tickers}&limit=50&apikey=${apiKey}`
        );
        
        console.log('News response status:', response.status);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('News data received:', data);

        if (Array.isArray(data)) {
          setNews(data);
          setError(null);
        } else {
          throw new Error('Invalid news data format');
        }
      } catch (err) {
        console.error('Error fetching news:', err);
        setError('Unable to load news');
      } finally {
        setLoading(false);
      }
    };

    if (stocks.length > 0) {
      fetchNews();
      const interval = setInterval(fetchNews, 300000); // 5 minutes
      return () => clearInterval(interval);
    } else {
      setNews([]);
      setLoading(false);
    }
  }, [apiKey, stocks]); // Added stocks to dependency array

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-4">
        <Newspaper className="w-5 h-5" />
        <h2 className="text-lg font-bold">Stock News</h2>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <Loader className="w-6 h-6 animate-spin text-blue-400" />
        </div>
      ) : error ? (
        <div className="text-red-400 p-4 text-sm">
          {error}
        </div>
      ) : news.length === 0 ? (
        <div className="text-gray-400 text-center p-4">
          {stocks.length === 0 
            ? 'Add stocks to see related news'
            : 'No recent news for tracked stocks'}
        </div>
      ) : (
        <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-12rem)]">
          {news.map((item, index) => (
            <div 
              key={item.url || index}
              className="text-sm hover:bg-gray-700 p-3 rounded-lg transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <a 
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-200 hover:text-blue-400 flex-grow"
                >
                  {item.title}
                </a>
                <span className="inline-block bg-blue-900/50 text-xs px-2 py-1 rounded">
                  {item.symbol}
                </span>
              </div>
              <div className="text-gray-500 text-xs mt-2">
                {item.site} • {new Date(item.publishedDate).toLocaleString()}
              </div>
              {item.text && (
                <div className="text-gray-400 text-sm mt-1 line-clamp-2">
                  {item.text}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MarketNews;
