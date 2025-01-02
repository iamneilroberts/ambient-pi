import React from 'react';

// Utility function for date formatting
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const month = date.toLocaleString('en-US', { month: 'short' });
  const day = date.getDate();
  const time = date.toLocaleString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
  return `${month} ${day}, ${time}`;
};

// Loading skeleton component
const NewsLoadingSkeleton = () => (
  <div className="animate-pulse">
    {[...Array(3)].map((_, i) => (
      <div key={i} className="mb-4">
        <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-700 rounded w-1/2"></div>
      </div>
    ))}
  </div>
);

// Wrapper component for consistent layout
const NewsWrapper = ({ children }) => (
  <div className="bg-gray-800 rounded-lg shadow-lg p-4">
    {children}
  </div>
);

const MarketNews = ({ data, isLoading, error }) => {
  if (isLoading) {
    return (
      <NewsWrapper>
        <NewsLoadingSkeleton />
      </NewsWrapper>
    );
  }

  if (error) {
    return (
      <NewsWrapper>
        <div className="text-red-400">Error: {error.message || error}</div>
      </NewsWrapper>
    );
  }

  if (!data?.feed || data.feed.length === 0) {
    return (
      <NewsWrapper>
        <div className="text-gray-400">No market news available at this time</div>
      </NewsWrapper>
    );
  }

  return (
    <NewsWrapper>
      <h3 className="text-lg font-bold text-white mb-4">Market News</h3>
      <div className="space-y-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
        {data.feed.map((article, index) => (
          <a
            key={index}
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block hover:bg-gray-700/50 rounded-lg p-3 transition-colors duration-200"
          >
            <div className="flex flex-col">
              <h4 className="text-white font-medium mb-1">
                {article.title}
              </h4>
              <div className="text-sm text-gray-500 flex items-center gap-2">
                <span className="font-medium text-gray-400">{article.source}</span>
                <span className="text-gray-600">•</span>
                <span>{formatDate(article.time_published)}</span>
              </div>
            </div>
          </a>
        ))}
      </div>
    </NewsWrapper>
  );
};

export default MarketNews;
