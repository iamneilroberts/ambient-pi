import React, { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react';
import { fetchStockQuote, fetchMarketNews } from './financeApi';
import StockCard from './StockCard';
import MarketNews from './MarketNews';

const STOCKS = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META'];
const REFRESH_INTERVAL = 60000; // 1 minute

const FinanceDashboard = () => {
  const [quotes, setQuotes] = useState({});
  const [news, setNews] = useState(null);
  const [globalLoading, setGlobalLoading] = useState(true);
  const [loadingStates, setLoadingStates] = useState({});
  const [error, setError] = useState(null);
  const [usingFallback, setUsingFallback] = useState(false);

  const isMounted = useRef(false);

  const fetchData = useCallback(async () => {
    if (!isMounted.current) return;

    console.log('Starting fetchData...');
    setGlobalLoading(true);
    setError(null);

    try {
      // Initialize loading states for all stocks
      const initialLoadingStates = STOCKS.reduce((acc, symbol) => ({ ...acc, [symbol]: true }), {});
      setLoadingStates(initialLoadingStates);

      // Fetch quotes sequentially with delay between requests
      const newQuotes = {};
      for (const symbol of STOCKS) {
        if (!isMounted.current) {
          console.log('Component unmounted, stopping fetch');
          return;
        }

        try {
          console.log(`Fetching data for ${symbol}...`);
          const data = await fetchStockQuote(symbol);
          console.log(`Received data for ${symbol}:`, data);
          
          if (isMounted.current) {
            newQuotes[symbol] = data;
            setLoadingStates(prev => ({ ...prev, [symbol]: false }));
            setQuotes(prev => ({ ...prev, [symbol]: data }));
          }
        } catch (error) {
          console.error(`Error fetching ${symbol}:`, error);
          if (isMounted.current) {
            newQuotes[symbol] = { error };
            setLoadingStates(prev => ({ ...prev, [symbol]: false }));
            setQuotes(prev => ({ ...prev, [symbol]: { error } }));
          }
        }

        // Add a small delay between requests
        if (isMounted.current) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      if (isMounted.current) {
        try {
          // Fetch news after quotes
          console.log('Fetching news...');
          const newsData = await fetchMarketNews(STOCKS);
          console.log('Received news:', newsData);
          if (isMounted.current) {
            setNews(newsData);
          }
        } catch (error) {
          console.error('News fetch error:', error);
          if (isMounted.current) {
            setNews(null);
          }
        }
      }
    } catch (error) {
      console.error('Dashboard error:', error);
      if (isMounted.current) {
        setError(error);
      }
    } finally {
      if (isMounted.current) {
        setGlobalLoading(false);
      }
    }
  }, []);

  // Check response for rate limit to detect fallback usage
  useEffect(() => {
    const isUsingFallback = Object.values(quotes).some(quote => {
      // Safely check for rate limit errors in string format
      const errorStr = quote?.error?.toString?.() || '';
      return errorStr.includes('limit') || // Check direct rate limit errors
        (quote?.['Global Quote'] && !quote?.['Global Quote']?.['01. symbol']); // Check Yahoo Finance format
    });
    setUsingFallback(isUsingFallback);
  }, [quotes]);

  // Set initial mounted state
  useLayoutEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Initial fetch
  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    const initialFetch = async () => {
      try {
        await fetchData();
      } catch (error) {
        console.error('Initial fetch error:', error);
      }
    };

    if (mounted) {
      initialFetch();
    }

    return () => {
      mounted = false;
      controller.abort();
    };
  }, [fetchData]);

  // Refresh interval
  useEffect(() => {
    const interval = setInterval(fetchData, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchData]);

  return (
    <div className="p-4">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">Market Overview</h2>
          {usingFallback && (
            <span className="text-sm text-yellow-400">Using Yahoo Finance Data</span>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {STOCKS.map((symbol) => (
            <StockCard
              key={symbol}
              data={quotes[symbol]}
              isLoading={globalLoading || loadingStates[symbol]}
              error={quotes[symbol]?.error}
            />
          ))}
        </div>
      </div>

      <div className="mt-8">
        <MarketNews
          data={news}
          isLoading={globalLoading}
          error={error}
          stocks={STOCKS}
        />
      </div>
    </div>
  );
};

export default FinanceDashboard;
