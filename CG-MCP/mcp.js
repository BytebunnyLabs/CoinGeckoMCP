const jayson = require('jayson');
const fetch = require('node-fetch');
require('dotenv').config();

// Get API key from environment
const API_KEY = process.env.COINGECKO_API_KEY;

// Base URLs for CoinGecko API
const PRO_API_URL = 'https://pro-api.coingecko.com/api/v3';
const FREE_API_URL = 'https://api.coingecko.com/api/v3';

// Function to determine which API to use
function getApiUrl() {
  return API_KEY ? PRO_API_URL : FREE_API_URL;
}

// MCP Tool method implementations
const methods = {
  // Ping the CoinGecko API
  ping: async function(args, callback) {
    try {
      const url = `${getApiUrl()}/ping`;
      const headers = API_KEY ? { 'x-cg-pro-api-key': API_KEY } : {};
      
      const response = await fetch(url, { headers });
      const data = await response.json();
      
      return callback(null, data);
    } catch (error) {
      console.error('Error in ping method:', error);
      return callback({ code: -32603, message: error.message });
    }
  },
  
  // Get price data for coins
  getPrice: async function(args, callback) {
    try {
      const { ids, vs_currencies, include_market_cap, include_24hr_vol, include_24hr_change, include_last_updated_at, precision } = args[0] || {};
      
      if (!ids || !vs_currencies) {
        return callback({ code: -32602, message: "Missing required parameters: ids, vs_currencies" });
      }

      const params = new URLSearchParams();
      params.append('ids', Array.isArray(ids) ? ids.join(',') : ids);
      params.append('vs_currencies', Array.isArray(vs_currencies) ? vs_currencies.join(',') : vs_currencies);
      
      if (include_market_cap) params.append('include_market_cap', include_market_cap);
      if (include_24hr_vol) params.append('include_24hr_vol', include_24hr_vol);
      if (include_24hr_change) params.append('include_24hr_change', include_24hr_change);
      if (include_last_updated_at) params.append('include_last_updated_at', include_last_updated_at);
      if (precision) params.append('precision', precision);

      const baseUrl = getApiUrl();
      const url = `${baseUrl}/simple/price?${params.toString()}`;
      const headers = API_KEY ? { 'x-cg-pro-api-key': API_KEY } : {};
      
      const response = await fetch(url, { headers });
      const data = await response.json();
      
      return callback(null, data);
    } catch (error) {
      console.error('Error in getPrice method:', error);
      return callback({ code: -32603, message: error.message });
    }
  },
  
  // Get supported vs currencies
  getSupportedVsCurrencies: async function(args, callback) {
    try {
      const baseUrl = getApiUrl();
      const url = `${baseUrl}/simple/supported_vs_currencies`;
      const headers = API_KEY ? { 'x-cg-pro-api-key': API_KEY } : {};
      
      const response = await fetch(url, { headers });
      const data = await response.json();
      
      return callback(null, data);
    } catch (error) {
      console.error('Error in getSupportedVsCurrencies method:', error);
      return callback({ code: -32603, message: error.message });
    }
  },
  
  // Get market data for coins
  getCoinMarkets: async function(args, callback) {
    try {
      const { vs_currency, ids, category, order, per_page, page, sparkline, price_change_percentage } = args[0] || {};
      
      if (!vs_currency) {
        return callback({ code: -32602, message: "Missing required parameter: vs_currency" });
      }

      const params = new URLSearchParams();
      params.append('vs_currency', vs_currency);
      
      if (ids) params.append('ids', Array.isArray(ids) ? ids.join(',') : ids);
      if (category) params.append('category', category);
      if (order) params.append('order', order);
      if (per_page) params.append('per_page', per_page);
      if (page) params.append('page', page);
      if (sparkline) params.append('sparkline', sparkline);
      if (price_change_percentage) params.append('price_change_percentage', price_change_percentage);

      const baseUrl = getApiUrl();
      const url = `${baseUrl}/coins/markets?${params.toString()}`;
      const headers = API_KEY ? { 'x-cg-pro-api-key': API_KEY } : {};
      
      const response = await fetch(url, { headers });
      const data = await response.json();
      
      return callback(null, data);
    } catch (error) {
      console.error('Error in getCoinMarkets method:', error);
      return callback({ code: -32603, message: error.message });
    }
  },
  
  // Get global cryptocurrency data
  getGlobal: async function(args, callback) {
    try {
      const baseUrl = getApiUrl();
      const url = `${baseUrl}/global`;
      const headers = API_KEY ? { 'x-cg-pro-api-key': API_KEY } : {};
      
      const response = await fetch(url, { headers });
      const data = await response.json();
      
      return callback(null, data);
    } catch (error) {
      console.error('Error in getGlobal method:', error);
      return callback({ code: -32603, message: error.message });
    }
  },
  
  // Get trending coins
  getTrending: async function(args, callback) {
    try {
      const baseUrl = getApiUrl();
      const url = `${baseUrl}/search/trending`;
      const headers = API_KEY ? { 'x-cg-pro-api-key': API_KEY } : {};
      
      const response = await fetch(url, { headers });
      const data = await response.json();
      
      return callback(null, data);
    } catch (error) {
      console.error('Error in getTrending method:', error);
      return callback({ code: -32603, message: error.message });
    }
  }
};

// Create a JSON-RPC server
const server = jayson.server(methods);

// Export the middleware for use in Express
module.exports = server.middleware(); 