import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { fetchStockQuote } from './financeApi';
import StockChart from './StockChart';

// Utility functions
const formatPrice = (value) => parseFloat(value || 0).toFixed(2);
const formatChange = (value, includeSign = true) => {
  const num = parseFloat(value || 0);
  const formatted = num.toFixed(2);
  return includeSign && num >= 0 ? `+${formatted}` : formatted;
};
const formatVolume = (value) => new Intl.NumberFormat().format(parseInt(value || 0));

// Styled components
const PriceCard = ({ children, error, isStale, isUpdating }) => (
  <div className={`rounded-lg p-4 shadow-lg ${
    error ? 'bg-red-900/50' : 'bg-gray-800'
  } ${isStale ? 'opacity-80' : ''} relative`}>
    {isUpdating && (
      <div className="absolute top-0 right-0 mt-1 mr-1">
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
      </div>
    )}
    {children}
  </div>
);

const LoadingSkeleton = () => (
  <div className="animate-pulse bg-gray-800 rounded-lg p-4">
    <div className="h-4 bg-gray-700 rounded w-24 mb-2"></div>
    <div className="h-6 bg-gray-700 rounded w-32"></div>
  </div>
);

const ChartLoadingSkeleton = () => (
  <div className="animate-pulse mt-2">
    <div className="h-32 bg-gray-700/50 rounded"></div>
  </div>
);

// Lazy loaded chart component
const LazyStockChart = React.lazy(() => {
  // Add a small delay to prioritize price data loading
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(import('./StockChart'));
    }, 100);
  });
});

const StockPrice = ({ symbol, loadDelay = 0 }) => {
  const [stockData, setStockData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [retryTime, setRetryTime] = useState(null);
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [showChart, setShowChart] = useState(false);

  useEffect(() => {
    let mounted = true;
    const updateInterval = 60000; // 1 minute to match backend cache
    let intervalId;
    let retryTimeoutId;
    let initialLoadTimeoutId;

    const fetchData = async (isInitialLoad = false) => {
      try {
        if (isInitialLoad) {
          setLoading(true);
        } else {
          setUpdating(true);
        }

        const data = await fetchStockQuote(symbol);
        if (mounted) {
          setStockData(prevData => {
            // If we have cached data and it's newer than what we just fetched, keep it
            if (prevData?._cache?.timestamp && data?._cache?.timestamp) {
              const prevTime = new Date(prevData._cache.timestamp).getTime();
              const newTime = new Date(data._cache.timestamp).getTime();
              if (prevTime > newTime) return prevData;
            }
            return data;
          });
          setError(null);
          setRetryTime(null);
          setRetryAttempt(0);
          
          if (isInitialLoad) {
            // Show chart after price data loads
            setTimeout(() => {
              if (mounted) setShowChart(true);
            }, 100);
            
            // Start regular updates
            if (intervalId === undefined) {
              intervalId = setInterval(() => fetchData(false), updateInterval);
            }
          }
        }
      } catch (err) {
        if (mounted) {
          const errorMessage = err.message.toLowerCase();
          if (errorMessage.includes('rate limit') || errorMessage.includes('429')) {
            const backoffDelay = Math.min(Math.pow(2, retryAttempt) * 30000, 600000);
            const nextRetryTime = Date.now() + backoffDelay;
            
            setRetryTime(nextRetryTime);
            setRetryAttempt(prev => prev + 1);
            
            retryTimeoutId = setTimeout(() => {
              if (mounted) fetchData();
            }, backoffDelay);
            
            setError(`Rate limit exceeded. Retrying with exponential backoff.`);
          } else {
            setError(err.message);
            retryTimeoutId = setTimeout(() => {
              if (mounted) fetchData();
            }, 60000);
          }
        }
      } finally {
        if (mounted) {
          if (isInitialLoad) setLoading(false);
          setUpdating(false);
        }
      }
    };

    // Start loading after the stagger delay
    initialLoadTimeoutId = setTimeout(() => {
      if (mounted) fetchData(true);
    }, loadDelay);

    return () => {
      mounted = false;
      clearTimeout(initialLoadTimeoutId);
      clearInterval(intervalId);
      if (retryTimeoutId) clearTimeout(retryTimeoutId);
    };
  }, [symbol, retryAttempt, loadDelay]);

  const priceData = useMemo(() => {
    const quote = stockData?.['Global Quote'];
    if (!quote) return null;
    return {
      price: parseFloat(quote['05. price'] || 0),
      change: parseFloat(quote['09. change'] || 0),
      changePercent: parseFloat(quote['10. change percent']?.replace('%', '') || 0),
      latestTradingDay: quote['07. latest trading day'],
      volume: quote['06. volume']
    };
  }, [stockData]);

  const renderPriceContent = () => {
    if (!stockData?.['Global Quote'] || !priceData) return null;

    const cacheInfo = stockData?._cache;
    const isStale = cacheInfo?.status === 'stale';
    const cacheAge = cacheInfo?.age ? Math.floor(cacheInfo.age / 60) : 0; // Convert to minutes
    const isPositive = priceData.change >= 0;
    const changeColor = isPositive ? 'text-green-400' : 'text-red-400';

    return (
      <div>
        <div className="flex justify-between items-center">
          <h3 className="text-gray-400 font-medium">{symbol}</h3>
          <div className="text-right">
            <span className="text-xs text-gray-500">
              {priceData.latestTradingDay}
            </span>
            {cacheAge > 0 && (
              <span className="text-xs text-gray-500 ml-2">
                {cacheAge}m old
              </span>
            )}
          </div>
        </div>
        
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl text-white font-bold">
            ${formatPrice(priceData.price)}
          </span>
          <div className={`flex items-center ${changeColor}`}>
            <span className="text-sm">
              {formatChange(priceData.change)} 
              ({formatChange(priceData.changePercent)}%)
            </span>
          </div>
        </div>

        {priceData.volume && (
          <div className="mt-2 text-xs text-gray-500">
            Vol: {formatVolume(priceData.volume)}
          </div>
        )}
      </div>
    );
  };

  if (!stockData && loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <PriceCard error={!stockData}>
        {stockData?.['Global Quote'] && (
          <>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-gray-400 font-medium">{symbol}</h3>
              <span className="text-xs text-gray-500">
                {stockData['Global Quote']['07. latest trading day']} (Last known)
              </span>
            </div>
            <div className="mb-2">
              <span className="text-2xl text-white font-bold">
                ${formatPrice(stockData['Global Quote']['05. price'])}
              </span>
            </div>
          </>
        )}
        <p className="text-red-400 text-sm">
          {error}
          {retryTime && (
            <span className="block mt-1">
              Retrying in {Math.max(0, Math.ceil((retryTime - Date.now()) / 1000))}s
            </span>
          )}
        </p>
      </PriceCard>
    );
  }

  return (
    <PriceCard 
      isStale={stockData?._cache?.status === 'stale'} 
      isUpdating={updating}
    >
      {renderPriceContent()}
      {showChart && (
        <Suspense fallback={<ChartLoadingSkeleton />}>
          <LazyStockChart symbol={symbol} />
        </Suspense>
      )}
    </PriceCard>
  );
};

export default StockPrice;
