const express = require('express');
const axios = require('axios');
const rateLimit = require('express-rate-limit');
const NodeCache = require('node-cache');
const yahooFinance = require('yahoo-finance2').default;

// Initialize cache with 24 hour TTL
const memoryCache = new NodeCache({ 
  stdTTL: 24 * 60 * 60, // 24 hours in seconds
  checkperiod: 60 * 60 // Check for expired keys every hour
});

// Queue for managing API requests
const requestQueue = [];
let isProcessingQueue = false;

// Process queue with delay between requests
async function processQueue() {
  if (isProcessingQueue || requestQueue.length === 0) return;
  
  isProcessingQueue = true;
  while (requestQueue.length > 0) {
    const { params, resolve, reject } = requestQueue.shift();
    try {
      const data = await fetchAlphaVantage(params, false);
      resolve(data);
    } catch (error) {
      console.error('Queue processing error:', error);
      reject(error);
    }
    // Wait 15 seconds between requests to stay well under rate limits
    await new Promise(resolve => setTimeout(resolve, 15000));
  }
  isProcessingQueue = false;
}

// Rate limiting middleware for Alpha Vantage API (5 requests per 15 seconds)
const alphaVantageLimiter = rateLimit({
  windowMs: 15 * 1000, // 15 seconds
  max: 5, // 5 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Rate limit exceeded. Please try again later.' },
  keyGenerator: (req) => {
    return req.ip;
  }
});

// Helper function to fetch from Alpha Vantage with caching
async function fetchAlphaVantage(params, fallbackAttempted = false) {
  console.log('Fetching from Alpha Vantage:', params);
  const cacheKey = JSON.stringify(params);
  const cached = memoryCache.get(cacheKey);
  
  if (cached) {
    console.log('Returning cached data for:', params);
    return cached;
  }

  const apiKey = process.env.REACT_APP_ALPHA_VANTAGE_API_KEY;
  if (!apiKey) {
    console.error('Alpha Vantage API key not configured');
    throw new Error('API key not configured');
  }

  try {
    const url = 'https://www.alphavantage.co/query';
    const response = await axios.get(url, {
      params: {
        ...params,
        apikey: apiKey
      },
      timeout: 5000 // 5 second timeout
    });

    console.log('Alpha Vantage response:', response.data);

    // Check for various types of API limits and errors
    if (response.data['Information']?.includes('standard API rate limit') ||
        response.data['Note']?.includes('API call frequency')) {
      if (!fallbackAttempted) {
        console.log('Alpha Vantage rate limited, falling back to Yahoo Finance');
        return await fetchYahooFinance(params);
      }
      throw new Error('Rate limit exceeded. Please try again later.');
    }

    if (response.data['Error Message']) {
      if (!fallbackAttempted) {
        console.log('Alpha Vantage error, falling back to Yahoo Finance');
        return await fetchYahooFinance(params);
      }
      throw new Error(response.data['Error Message']);
    }

    memoryCache.set(cacheKey, response.data);
    return response.data;
  } catch (error) {
    console.error('Alpha Vantage fetch error:', error);
    if (!fallbackAttempted) {
      console.log('Alpha Vantage error, falling back to Yahoo Finance');
      return await fetchYahooFinance(params);
    }
    throw error;
  }
}

// Helper function to fetch from Yahoo Finance
async function fetchYahooFinance(params) {
  console.log('Fetching from Yahoo Finance:', params);
  const cacheKey = `yahoo_${JSON.stringify(params)}`;
  const cached = memoryCache.get(cacheKey);
  
  if (cached) {
    console.log('Returning cached Yahoo data for:', params);
    return cached;
  }

  try {
    let data;
    if (params.function === 'GLOBAL_QUOTE') {
      const quote = await yahooFinance.quote(params.symbol);
      // Calculate the percentage change correctly
      const change = quote.regularMarketChange || 0;
      const previousClose = quote.regularMarketPreviousClose || 0;
      const percentChange = previousClose !== 0 ? (change / previousClose) * 100 : 0;
      
      // Create response object with proper JSON structure
      data = {
        'Global Quote': {
          '01. symbol': String(quote.symbol || ''),
          '02. open': String(quote.regularMarketOpen || 0),
          '03. high': String(quote.regularMarketDayHigh || 0),
          '04. low': String(quote.regularMarketDayLow || 0),
          '05. price': String(quote.regularMarketPrice || 0),
          '06. volume': String(quote.regularMarketVolume || 0),
          '07. latest trading day': new Date().toISOString().split('T')[0],
          '08. previous close': String(previousClose),
          '09. change': String(change),
          '10. change percent': `${percentChange.toFixed(2)}%`
        }
      };
    } else if (params.function === 'TIME_SERIES_DAILY') {
      const history = await yahooFinance.historical(params.symbol.toUpperCase(), {
        period1: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000), // last 100 days
        interval: '1d'
      });
      
      const timeSeries = {};
      history.forEach(day => {
        timeSeries[day.date.toISOString().split('T')[0]] = {
          '1. open': day.open,
          '2. high': day.high,
          '3. low': day.low,
          '4. close': day.close,
          '5. volume': day.volume
        };
      });
      
      data = {
        'Time Series (Daily)': timeSeries
      };
    } else if (params.function === 'NEWS_SENTIMENT') {
      // For news, we'll use Yahoo Finance news API
      const symbols = params.tickers.split(',');
      const newsPromises = symbols.map(async symbol => {
        try {
          // Get news articles for each symbol
          const news = await yahooFinance.search(symbol, {
            newsCount: 5, // Get 5 news items per symbol
            enableNavLinks: true,
            enableEnhancedTrivialQuery: true
          });
          
          // Transform the news items to match our expected format
          return news.news.map(item => ({
            title: item.title,
            url: item.link,
            time_published: new Date(item.providerPublishTime * 1000).toISOString(),
            summary: item.snippet,
            source: item.publisher,
            category: 'Market News',
            ticker_sentiment: [{
              ticker: symbol,
              sentiment_score: 0 // Yahoo doesn't provide sentiment, default to neutral
            }]
          }));
        } catch (error) {
          console.error(`Error fetching news for ${symbol}:`, error);
          return [{
            title: `${symbol} Information`,
            url: `https://finance.yahoo.com/quote/${symbol}`,
            time_published: new Date().toISOString(),
            summary: `View latest information about ${symbol} on Yahoo Finance`,
            source: 'Yahoo Finance',
            category: 'Stock Info'
          }];
        }
      });

      // Flatten all news items and sort by date
      const allNews = (await Promise.all(newsPromises))
        .flat()
        .sort((a, b) => new Date(b.time_published) - new Date(a.time_published));

      // Remove duplicates based on title and keep only the most recent 20 news items
      const feed = Array.from(
        new Map(allNews.map(item => [item.title, item])).values()
      ).slice(0, 20);

      data = { feed };
    }

    if (!data) {
      throw new Error('Failed to fetch data from Yahoo Finance');
    }

    console.log('Yahoo Finance response:', data);
    memoryCache.set(cacheKey, data);
    return data;
  } catch (error) {
    console.error('Yahoo Finance error:', error);
    throw new Error(`Yahoo Finance error: ${error.message}`);
  }
}

function setupStockRoutes(app) {
  const router = express.Router();

  // Stock quote endpoint
  router.get('/quote', alphaVantageLimiter, async (req, res) => {
    console.log('Received stock quote request:', req.query);
    try {
      const { symbol } = req.query;
      if (!symbol) {
        return res.status(400).json({ error: 'Symbol parameter is required' });
      }

      // Add request to queue and wait for result
      const data = await new Promise((resolve, reject) => {
        requestQueue.push({
          params: { function: 'GLOBAL_QUOTE', symbol },
          resolve,
          reject
        });
        processQueue();
      });

      console.log('Sending stock quote response:', data);
      res.json(data);
    } catch (error) {
      console.error('Stock API Error:', error);
      const status = error.message.includes('limit') ? 429 : 500;
      res.status(status).json({
        error: error.message
      });
    }
  });

  // Stock history endpoint
  router.get('/history', alphaVantageLimiter, async (req, res) => {
    console.log('Received stock history request:', req.query);
    try {
      const { symbol } = req.query;
      if (!symbol) {
        return res.status(400).json({ error: 'Symbol parameter is required' });
      }

      // Add request to queue and wait for result
      const data = await new Promise((resolve, reject) => {
        requestQueue.push({
          params: { function: 'TIME_SERIES_DAILY', symbol, outputsize: 'compact' },
          resolve,
          reject
        });
        processQueue();
      });

      console.log('Sending stock history response:', data);
      res.json(data);
    } catch (error) {
      console.error('Stock API Error:', error);
      const status = error.message.includes('limit') ? 429 : 500;
      res.status(status).json({
        error: error.message
      });
    }
  });

  // Market news endpoint
  router.get('/news', alphaVantageLimiter, async (req, res) => {
    console.log('Received market news request:', req.query);
    try {
      const { symbols } = req.query;
      if (!symbols) {
        return res.status(400).json({ error: 'Symbols parameter is required' });
      }

      // Add request to queue and wait for result
      const data = await new Promise((resolve, reject) => {
        requestQueue.push({
          params: { function: 'NEWS_SENTIMENT', tickers: symbols },
          resolve,
          reject
        });
        processQueue();
      });

      console.log('Sending market news response:', data);
      res.json(data);
    } catch (error) {
      console.error('Stock API Error:', error);
      const status = error.message.includes('limit') ? 429 : 500;
      res.status(status).json({
        error: error.message
      });
    }
  });

  app.use('/api/stock', router);
  
  console.log('Stock routes initialized');
}

module.exports = { setupStockRoutes };
