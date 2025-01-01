import React from 'react';

const MarketNews = ({ data, isLoading, error, stocks }) => {
  if (isLoading) {
    return (
      <div className="bg-gray-800 rounded-lg shadow-lg p-4">
        <div className="animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="mb-4">
              <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-700 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-800 rounded-lg shadow-lg p-4">
        <div className="text-red-400">Error: {error.message}</div>
      </div>
    );
  }

  if (!data?.feed || data.feed.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg shadow-lg p-4">
        <div className="text-gray-400">No news available</div>
      </div>
    );
  }

  // Filter news to show stories related to tracked stocks
  const filteredFeed = data.feed.filter(article => {
    // Handle Alpha Vantage format
    if (article.ticker_sentiment) {
      return article.ticker_sentiment.some(sentiment => 
        stocks.includes(sentiment.ticker)
      );
    }
    // Handle Yahoo Finance format - check if any stock symbol appears in title
    return stocks.some(symbol => 
      article.title.includes(symbol) || 
      (article.summary && article.summary.includes(symbol))
    );
  });

  if (filteredFeed.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg shadow-lg p-4">
        <div className="text-gray-400">No news available for tracked stocks</div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg p-4">
      <h3 className="text-lg font-bold text-white mb-4">Market News</h3>
      <div className="space-y-4">
        {filteredFeed.map((article, index) => (
          <a
            key={index}
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block hover:bg-gray-700 rounded-lg p-3 transition-colors duration-200"
          >
            <div className="flex flex-col">
              <h4 className="text-white font-medium mb-1">
                {article.title}
              </h4>
              <div className="text-sm text-gray-400">
                {article.source} • {formatDate(article.time_published)}
              </div>
              <div className="flex gap-2 mt-2">
                {article.ticker_sentiment ? (
                  // Alpha Vantage format
                  article.ticker_sentiment.map((sentiment, i) => (
                    <span
                      key={i}
                      className="text-xs px-2 py-1 rounded bg-gray-700 text-gray-300"
                    >
                      {sentiment.ticker}
                    </span>
                  ))
                ) : (
                  // Yahoo Finance format - show matching stock symbols from title
                  stocks
                    .filter(symbol => 
                      article.title.includes(symbol) || 
                      (article.summary && article.summary.includes(symbol))
                    )
                    .map((symbol, i) => (
                      <span
                        key={i}
                        className="text-xs px-2 py-1 rounded bg-gray-700 text-gray-300"
                      >
                        {symbol}
                      </span>
                    ))
                )}
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};

export default MarketNews;
