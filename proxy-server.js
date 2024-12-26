const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const app = express();
const port = 3005;

app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

// Yahoo Finance API endpoints
const YF_BASE_URL = 'https://query1.finance.yahoo.com/v8/finance';
const YF_QUOTE_URL = `${YF_BASE_URL}/chart`;
const YF_RSS_URL = 'https://finance.yahoo.com/news/rssindex';

// Get current stock quote and intraday data
app.get('/stock/quote', async (req, res) => {
  try {
    const { symbol } = req.query;
    if (!symbol) {
      return res.status(400).json({ error: 'Symbol parameter is required' });
    }

    console.log('Fetching quote for:', symbol);
    
    const url = `${YF_QUOTE_URL}/${symbol}?range=1d&interval=5m&includePrePost=false`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      return res.status(500).json({ error: data.error });
    }

    const result = data.chart.result[0];
    if (!result) {
      return res.status(404).json({ error: 'No data found for symbol' });
    }

    const quote = {
      symbol: result.meta.symbol,
      currency: result.meta.currency,
      regularMarketPrice: result.meta.regularMarketPrice,
      previousClose: result.meta.previousClose,
      timestamp: result.meta.regularMarketTime,
      tradingPeriods: result.meta.tradingPeriods,
      gmtoffset: result.meta.gmtoffset
    };

    res.json(quote);
  } catch (error) {
    console.error('Error fetching quote:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get historical data
app.get('/stock/history', async (req, res) => {
  try {
    const { symbol } = req.query;
    if (!symbol) {
      return res.status(400).json({ error: 'Symbol parameter is required' });
    }

    console.log(`Fetching historical data for ${symbol}`);
    
    const url = `${YF_QUOTE_URL}/${symbol}?range=1mo&interval=1d`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      return res.status(500).json({ error: data.error });
    }

    const result = data.chart.result[0];
    if (!result) {
      return res.status(404).json({ error: 'No historical data found for symbol' });
    }

    const history = {
      timestamp: result.timestamp,
      indicators: result.indicators
    };

    res.json(history);
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get market news
app.get('/yf/news', async (req, res) => {
  try {
    console.log('Fetching news from:', YF_RSS_URL);
    const response = await fetch(YF_RSS_URL);
    const data = await response.text();
    console.log('Received news data length:', data.length);
    
    // Parse RSS feed and convert to JSON
    const items = data.match(/<item>[\s\S]*?<\/item>/g) || [];
    console.log('Found news items:', items.length);
    
    const parsedItems = items.map(item => {
      const title = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] || 
                   item.match(/<title>(.*?)<\/title>/)?.[1] || '';
      const link = item.match(/<link>(.*?)<\/link>/)?.[1] || '';
      const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || '';
      const guid = item.match(/<guid>(.*?)<\/guid>/)?.[1] || '';
      return { title, link, pubDate, guid };
    }).slice(0, 20); // Limit to 20 most recent news items

    console.log('Parsed news items:', parsedItems.length);
    res.json({ items: parsedItems });
  } catch (error) {
    console.error('Error fetching news:', error);
    res.status(500).json({ error: 'Failed to fetch news', details: error.message });
  }
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const response = await fetch(`${YF_QUOTE_URL}/AAPL?range=1d&interval=5m`);
    const data = await response.json();
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      yahooFinanceStatus: 'connected'
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Financial Modeling Prep free api
const FMP_API_KEY = 'FL3wKRkbNih7OuLDTYSMblNWtNEfwiXh';

app.get('/stock/news', async (req, res) => {
  try {
    const url = `https://financialmodelingprep.com/api/v3/stock_news?limit=10&apikey=${FMP_API_KEY}`;
    console.log('Fetching news...');
    
    const response = await fetch(url);
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', errorText);
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`Fetched ${data.length} news items`);
    res.json({ items: data });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});
app.listen(port, () => {
  console.log(`Finance proxy server running on port ${port}`);
  console.log('CORS enabled for localhost:3000 and localhost:3001');
  console.log('Health check: http://localhost:3005/health');
});
