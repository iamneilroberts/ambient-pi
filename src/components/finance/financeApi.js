// src/api/financeApi.js
class FinanceAPI {
  constructor() {
    this.baseUrl = 'http://localhost:3005/stock';
  }

  async fetchStockData(symbol) {
    try {
      // Fetch both quote and history data
      const [quoteRes, historyRes] = await Promise.all([
        fetch(`${this.baseUrl}/quote?symbol=${symbol}`),
        fetch(`${this.baseUrl}/history?symbol=${symbol}`)
      ]);

      const [quote, history] = await Promise.all([
        quoteRes.json(),
        historyRes.json()
      ]);

      if (quote.error) throw new Error(quote.error);
      if (history.error) throw new Error(history.error);

      // Calculate price change
      const priceChange = quote.regularMarketPrice - quote.previousClose;
      const percentChange = (priceChange / quote.previousClose) * 100;

      // Process historical data for chart
      const chartData = history.timestamp.map((time, index) => ({
        time,
        price: history.indicators.quote[0].close[index]
      })).filter(point => point.price !== null);

      return {
        symbol,
        currentPrice: quote.regularMarketPrice,
        previousClose: quote.previousClose,
        priceChange,
        percentChange,
        chartData
      };
    } catch (error) {
      console.error(`Error fetching data for ${symbol}:`, error);
      throw error;
    }
  }

  async fetchBatchStockData(symbols) {
    try {
      return await Promise.all(
        symbols.map(symbol => this.fetchStockData(symbol))
      );
    } catch (error) {
      console.error('Error in batch fetch:', error);
      throw error;
    }
  }

  formatPrice(price) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  }

  formatChange(change, percent = false) {
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      signDisplay: 'always'
    }).format(change);

    if (percent) {
      const percentFormatted = new Intl.NumberFormat('en-US', {
        style: 'percent',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        signDisplay: 'always'
      }).format(change / 100);
      return `${formatted} (${percentFormatted})`;
    }

    return formatted;
  }
}

export const financeApi = new FinanceAPI();
