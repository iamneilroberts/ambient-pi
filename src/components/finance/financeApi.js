import { config as baseConfig } from '../../config/config.js';

const API_BASE_URL = '/api';
const defaultSymbols = baseConfig.preferences.stocks.symbols;

// Helper function to implement exponential backoff
async function fetchWithRetry(url, options = {}, retries = 3, baseDelay = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      const data = await response.json();
      
      if (response.ok) {
        return data;
      }

      // Handle rate limiting and other errors
      if (!response.ok) {
        if (i === retries - 1) {
          throw new Error(data.error || `Failed to fetch: ${response.statusText}`);
        }
        
        const delay = baseDelay * Math.pow(2, i);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      return data;
    } catch (error) {
      if (i === retries - 1) throw error;
      const delay = baseDelay * Math.pow(2, i);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

export async function fetchStockQuote(symbol) {
  if (!symbol) throw new Error('Symbol is required');
  return fetchWithRetry(`${API_BASE_URL}/stock/quote?symbol=${symbol}`);
}

export async function fetchStockHistory(symbol) {
  return fetchWithRetry(`${API_BASE_URL}/stock/history?symbol=${symbol}`);
}

export async function fetchMarketNews(symbols = defaultSymbols) {
  const validSymbols = symbols.filter(Boolean).join(',');
  if (!validSymbols) return { feed: [] };
  return fetchWithRetry(`${API_BASE_URL}/stock/news?symbols=${validSymbols}`);
}

export async function getTrackedStocks() {
  return fetchWithRetry(`${API_BASE_URL}/stock/tracked`);
}

export async function addStock(symbol) {
  if (!symbol) throw new Error('Symbol is required');
  const normalizedSymbol = symbol.trim().toUpperCase();
  return fetchWithRetry(`${API_BASE_URL}/stock/track`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ symbol: normalizedSymbol }),
  });
}

export async function removeStock(symbol) {
  if (!symbol) throw new Error('Symbol is required');
  const normalizedSymbol = symbol.trim().toUpperCase();
  return fetchWithRetry(`${API_BASE_URL}/stock/track/${normalizedSymbol}`, {
    method: 'DELETE',
  });
}
