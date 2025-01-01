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

      const errorStr = data.error?.toString?.() || '';
      if (errorStr.includes('limit')) {
        // If rate limited, wait with exponential backoff
        const delay = baseDelay * Math.pow(2, i);
        console.log(`Rate limited, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      throw new Error(data.error || `Failed to fetch: ${response.statusText}`);
    } catch (error) {
      if (i === retries - 1) throw error;
      const delay = baseDelay * Math.pow(2, i);
      console.log(`Request failed, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

export async function fetchStockQuote(symbol) {
  if (!symbol) {
    throw new Error('Symbol is required');
  }
  return fetchWithRetry(`${API_BASE_URL}/stock/quote?symbol=${symbol}`);
}

export async function fetchStockHistory(symbol) {
  return fetchWithRetry(`${API_BASE_URL}/stock/history?symbol=${symbol}`);
}

export async function fetchMarketNews(symbols = defaultSymbols) {
  return fetchWithRetry(`${API_BASE_URL}/stock/news?symbols=${symbols.join(',')}`);
}
