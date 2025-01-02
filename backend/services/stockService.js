const express = require('express');
const rateLimit = require('express-rate-limit');
const yahooFinance = require('yahoo-finance2').default;
const configService = require('./configService');
const cacheService = require('./cacheService');
const databaseService = require('./databaseService');

// Queue management
class RequestQueue {
  constructor() {
    this.queue = [];
    this.isProcessing = false;
    this.batchSize = 5;
    this.batchDelay = 2000;
    this.maxProcessingTime = 20000;
  }

  async add(params, resolve) {
    this.queue.push({ params, resolve });
    this.process();
  }

  async process() {
    if (this.isProcessing || this.queue.length === 0) return;
    
    this.isProcessing = true;
    const batchStartTime = Date.now();
    let processedCount = 0;

    try {
      while (this.queue.length > 0) {
        const { params, resolve } = this.queue.shift();
        await this.processRequest(params, resolve);
        
        processedCount++;
        const shouldDelay = processedCount >= this.batchSize || 
                          Date.now() - batchStartTime > this.maxProcessingTime;
        
        if (shouldDelay && this.queue.length > 0) {
          await new Promise(resolve => setTimeout(resolve, this.batchDelay));
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  async processRequest(params, resolve) {
    try {
      // Always check cache first
      const cached = databaseService.getStockData(params.symbol, params.function);
      const now = Date.now();
      
      // If we have cached data, check its age
      if (cached) {
        const cacheAge = now - new Date(cached.metadata?.timestamp).getTime();
        const isStale = cacheAge > 3600000; // 1 hour
        
        // Return cached data with metadata
        resolve({
          ...cached,
          _cache: {
            status: isStale ? 'stale' : 'fresh',
            timestamp: cached.metadata?.timestamp,
            age: Math.floor(cacheAge / 1000)
          }
        });

        // If data is stale, fetch new data in background
        if (isStale) {
          this.fetchAndCache(params).catch(console.error);
        }
        
        return;
      }

      // No cache, fetch new data
      const data = await this.fetchAndCache(params);
      resolve(data);
    } catch (error) {
      // On error, try to return cached data if available
      const cached = databaseService.getStockData(params.symbol, params.function);
      if (cached) {
        const now = Date.now();
        const cacheAge = now - new Date(cached.metadata?.timestamp).getTime();
        resolve({
          ...cached,
          _cache: {
            status: 'stale',
            timestamp: cached.metadata?.timestamp,
            age: Math.floor(cacheAge / 1000)
          }
        });
      } else {
        resolve({ error: error.message });
      }
    }
  }

  async fetchAndCache(params) {
    const data = await fetchYahooFinance(params);
    if (!data) {
      throw new Error('No data available');
    }

    // Add metadata
    data.metadata = { timestamp: new Date().toISOString() };
    
    // Cache the data
    databaseService.setStockData(params.symbol, data, params.function);
    
    // Return with cache info
    return {
      ...data,
      _cache: {
        status: 'fresh',
        timestamp: data.metadata.timestamp,
        age: 0
      }
    };
  }
}

const requestQueue = new RequestQueue();

// Rate limiting middleware - 5 requests per 10 seconds
const stockLimiter = rateLimit({
  windowMs: 10000,
  max: 5,
  message: { error: 'Rate limit exceeded. Please try again later.' }
});

// Helper function to fetch from Yahoo Finance
async function fetchYahooFinance(params) {
  try {
    let data;
    if (params.function === 'GLOBAL_QUOTE') {
      const quote = await yahooFinance.quote(params.symbol);
      // Calculate the percentage change correctly
      const change = quote.regularMarketChange || 0;
      const previousClose = quote.regularMarketPreviousClose || 0;
      const percentChange = previousClose !== 0 ? (change / previousClose) * 100 : 0;
      
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
      const news = await yahooFinance.search(params.tickers, {
        newsCount: 10,
        enableNavLinks: false,
        enableEnhancedTrivialQuery: true
      });
      
      data = {
        feed: news.news.map(item => ({
          title: item.title,
          url: item.link,
          time_published: item.providerPublishTime * 1000, // Convert to milliseconds
          summary: item.summary,
          source: item.publisher,
          category: "Market News"
        }))
      };
    }

    return data;
  } catch (error) {
    throw error;
  }
}

// Error handling middleware
const handleError = (res, error, defaultMessage) => {
  const status = error.status || 500;
  const message = error.message || defaultMessage;
  res.status(status).json({ error: message });
};

// Request validation
const validateSymbol = (symbol) => {
  if (!symbol) throw { status: 400, message: 'Symbol parameter is required' };
  return symbol.trim().toUpperCase();
};

// Route handlers
async function handleGetQuote(req, res) {
  try {
    const symbol = validateSymbol(req.query.symbol);
    const data = await new Promise(resolve => {
      requestQueue.add({ function: 'GLOBAL_QUOTE', symbol }, resolve);
    });
    res.json(data);
  } catch (error) {
    handleError(res, error, 'Failed to fetch stock quote');
  }
}

async function handleGetHistory(req, res) {
  try {
    const symbol = validateSymbol(req.query.symbol);
    const data = await new Promise(resolve => {
      requestQueue.add({ function: 'TIME_SERIES_DAILY', symbol }, resolve);
    });
    res.json(data);
  } catch (error) {
    handleError(res, error, 'Failed to fetch stock history');
  }
}

async function handleGetNews(req, res) {
  try {
    const { symbols } = req.query;
    if (!symbols) throw { status: 400, message: 'Symbols parameter is required' };

    const symbolArray = symbols.split(',').filter(s => s.trim());
    if (symbolArray.length === 0) return res.json({ feed: [] });

    const data = await new Promise(resolve => {
      requestQueue.add(
        { function: 'NEWS_SENTIMENT', tickers: symbolArray.join(',') },
        resolve
      );
    });

    res.json(data);
  } catch (error) {
    handleError(res, error, 'Failed to fetch market news');
  }
}

async function handleGetTrackedStocks(req, res) {
  try {
    const symbols = await configService.readStocksConfig();
    res.json({ symbols });
  } catch (error) {
    handleError(res, error, 'Failed to get tracked stocks');
  }
}

async function handleAddStock(req, res) {
  try {
    const symbol = validateSymbol(req.body.symbol);
    
    // Verify the stock exists
    try {
      await yahooFinance.quote(symbol);
    } catch (error) {
      throw { status: 400, message: 'Invalid stock symbol' };
    }

    const symbols = await configService.addStock(symbol);
    res.json({ symbols });
  } catch (error) {
    handleError(res, error, 'Failed to add stock');
  }
}

async function handleRemoveStock(req, res) {
  try {
    const symbol = validateSymbol(req.params.symbol);
    const symbols = await configService.removeStock(symbol);
    res.json({ symbols });
  } catch (error) {
    handleError(res, error, 'Failed to remove stock');
  }
}

function setupStockRoutes(app) {
  const router = express.Router();

  router.get('/quote', stockLimiter, handleGetQuote);
  router.get('/history', stockLimiter, handleGetHistory);
  router.get('/news', stockLimiter, handleGetNews);
  router.get('/tracked', handleGetTrackedStocks);
  router.post('/track', handleAddStock);
  router.delete('/track/:symbol', handleRemoveStock);

  app.use('/api/stock', router);
}

module.exports = { setupStockRoutes };
