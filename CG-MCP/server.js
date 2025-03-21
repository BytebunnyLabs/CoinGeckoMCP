const express = require('express');
const { CoinGeckoClient } = require('coingecko-api-v3');
require('dotenv').config(); // Load environment variables from .env file

// Import the JSON-RPC middleware
const jsonRpcMiddleware = require('./mcp');
// Import MCP schemas
const mcpSchemas = require('./mcp-schema');

// Initialize Express
const app = express();
const port = process.env.PORT || 3000;

// Initialize CoinGecko API client
const client = new CoinGeckoClient({
  timeout: 10000,
  autoRetry: true,
  apiKey: process.env.COINGECKO_API_KEY
});

// Middleware
app.use(express.json());

// JSON-RPC endpoint for MCP
app.post('/rpc', jsonRpcMiddleware);

// MCP Schema endpoint
app.get('/mcp/schema', (req, res) => {
  res.json(mcpSchemas);
});

// Basic health check route
app.get('/', async (req, res) => {
  res.json({ message: 'CoinGecko API Server is running' });
});

// PING endpoint - Check API server status
app.get('/api/ping', async (req, res) => {
  try {
    const apiKey = process.env.COINGECKO_API_KEY;
    const baseUrl = apiKey 
      ? 'https://pro-api.coingecko.com/api/v3/ping'
      : 'https://api.coingecko.com/api/v3/ping';
    
    if (!apiKey) {
      console.log('No API key found, using free CoinGecko API for ping');
    }

    const headers = apiKey ? { 'x-cg-pro-api-key': apiKey } : {};
    
    const response = await fetch(baseUrl, { headers });
    
    if (!response.ok) {
      throw new Error(`Error from CoinGecko API: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error pinging server:', error);
    res.status(500).json({ error: 'Failed to ping server' });
  }
});

// === SIMPLE Endpoints ===

// Get price data for specific coins
app.get('/api/simple/price', async (req, res) => {
  try {
    const { ids, vs_currencies } = req.query;
    
    if (!ids || !vs_currencies) {
      return res.status(400).json({ error: 'Missing required parameters: ids and vs_currencies are required' });
    }

    const params = new URLSearchParams();
    params.append('ids', ids);
    params.append('vs_currencies', vs_currencies);
    
    // Optional parameters
    if (req.query.include_market_cap) params.append('include_market_cap', req.query.include_market_cap);
    if (req.query.include_24hr_vol) params.append('include_24hr_vol', req.query.include_24hr_vol);
    if (req.query.include_24hr_change) params.append('include_24hr_change', req.query.include_24hr_change);
    if (req.query.include_last_updated_at) params.append('include_last_updated_at', req.query.include_last_updated_at);
    if (req.query.precision) params.append('precision', req.query.precision);

    const apiKey = process.env.COINGECKO_API_KEY;
    const baseUrl = apiKey 
      ? 'https://pro-api.coingecko.com/api/v3/simple/price'
      : 'https://api.coingecko.com/api/v3/simple/price';
    
    if (!apiKey) {
      console.log('No API key found, using free CoinGecko API for simple/price');
    }

    const url = `${baseUrl}?${params.toString()}`;
    const headers = apiKey ? { 'x-cg-pro-api-key': apiKey } : {};
    
    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      throw new Error(`Error from CoinGecko API: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error fetching price data:', error);
    res.status(500).json({ error: 'Failed to fetch price data' });
  }
});

// Get token price by contract address
app.get('/api/simple/token_price/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { contract_addresses, vs_currencies, include_market_cap, include_24hr_vol, include_24hr_change, include_last_updated_at, precision } = req.query;
    
    if (!contract_addresses || !vs_currencies) {
      return res.status(400).json({ error: 'Missing required parameters: contract_addresses, vs_currencies' });
    }
    
    const tokenPriceData = await client.simpleTokenPrice({
      id,
      contract_addresses: contract_addresses.split(','),
      vs_currencies: vs_currencies.split(','),
      include_market_cap: include_market_cap === 'true',
      include_24hr_vol: include_24hr_vol === 'true',
      include_24hr_change: include_24hr_change === 'true',
      include_last_updated_at: include_last_updated_at === 'true',
      precision: precision
    });
    res.json(tokenPriceData);
  } catch (error) {
    console.error('Error fetching token price data:', error);
    res.status(500).json({ error: 'Failed to fetch token price data' });
  }
});

// Get supported vs currencies
app.get('/api/simple/supported_vs_currencies', async (req, res) => {
  try {
    // Use Pro API if API key is available, otherwise use free API
    const apiKey = process.env.COINGECKO_API_KEY;
    let url;
    
    if (apiKey && apiKey !== 'your_api_key_here') {
      // Pro API
      url = `https://pro-api.coingecko.com/api/v3/simple/supported_vs_currencies?x_cg_pro_api_key=${apiKey}`;
    } else {
      // Free API - fallback for development
      console.log('Using free CoinGecko API (no API key provided)');
      url = 'https://api.coingecko.com/api/v3/simple/supported_vs_currencies';
    }
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`CoinGecko API responded with status: ${response.status}`);
    }
    
    const supportedVsCurrencies = await response.json();
    res.json(supportedVsCurrencies);
  } catch (error) {
    console.error('Error fetching supported vs currencies:', error);
    res.status(500).json({ error: 'Failed to fetch supported vs currencies' });
  }
});

// === COINS Endpoints ===

// Get list of all coins
app.get('/api/coins/list', async (req, res) => {
  try {
    const { include_platform } = req.query;
    const coinsList = await client.coinList({
      include_platform: include_platform === 'true'
    });
    res.json(coinsList);
  } catch (error) {
    console.error('Error fetching coins list:', error);
    res.status(500).json({ error: 'Failed to fetch coins list' });
  }
});

// Get market data for coins
app.get('/api/coins/markets', async (req, res) => {
  try {
    const { vs_currency, ids, category, order, per_page, page, sparkline, price_change_percentage } = req.query;
    
    if (!vs_currency) {
      return res.status(400).json({ error: 'Missing required parameter: vs_currency' });
    }
    
    // Create parameters object
    const params = new URLSearchParams({
      vs_currency,
      ...(ids && { ids }),
      ...(category && { category }),
      ...(order && { order }),
      per_page: per_page || 100,
      page: page || 1,
      ...(sparkline && { sparkline: sparkline === 'true' }),
      ...(price_change_percentage && { price_change_percentage })
    });
    
    // Use Pro API if API key is available, otherwise use free API
    const apiKey = process.env.COINGECKO_API_KEY;
    let url;
    
    if (apiKey && apiKey !== 'your_api_key_here') {
      // Pro API
      params.append('x_cg_pro_api_key', apiKey);
      url = `https://pro-api.coingecko.com/api/v3/coins/markets?${params.toString()}`;
    } else {
      // Free API - fallback for development
      console.log('Using free CoinGecko API (no API key provided)');
      url = `https://api.coingecko.com/api/v3/coins/markets?${params.toString()}`;
    }
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`CoinGecko API responded with status: ${response.status}`);
    }
    
    const marketsData = await response.json();
    res.json(marketsData);
  } catch (error) {
    console.error("Error fetching coin markets data:", error);
    res.status(500).json({ error: 'Failed to fetch coin markets data' });
  }
});

// Get coin details
app.get('/api/coins/:coinId', async (req, res) => {
  try {
    const { coinId } = req.params;
    const { localization, tickers, market_data, community_data, developer_data, sparkline } = req.query;
    
    const coinData = await client.coinId({
      id: coinId,
      localization: localization !== 'false',
      tickers: tickers !== 'false',
      market_data: market_data !== 'false',
      community_data: community_data !== 'false',
      developer_data: developer_data !== 'false',
      sparkline: sparkline === 'true'
    });
    res.json(coinData);
  } catch (error) {
    console.error(`Error fetching data for coin ${req.params.coinId}:`, error);
    res.status(500).json({ error: `Failed to fetch data for coin ${req.params.coinId}` });
  }
});

// Get coin tickers
app.get('/api/coins/:coinId/tickers', async (req, res) => {
  try {
    const { coinId } = req.params;
    const { exchange_ids, include_exchange_logo, page, order, depth } = req.query;
    
    const tickersData = await client.coinIdTickers({
      id: coinId,
      exchange_ids: exchange_ids ? exchange_ids.split(',') : undefined,
      include_exchange_logo: include_exchange_logo === 'true',
      page: page ? parseInt(page) : 1,
      order,
      depth: depth === 'true'
    });
    res.json(tickersData);
  } catch (error) {
    console.error(`Error fetching tickers for coin ${req.params.coinId}:`, error);
    res.status(500).json({ error: `Failed to fetch tickers for coin ${req.params.coinId}` });
  }
});

// Get coin history
app.get('/api/coins/:coinId/history', async (req, res) => {
  try {
    const { coinId } = req.params;
    const { date, localization } = req.query;
    
    if (!date) {
      return res.status(400).json({ error: 'Missing required parameter: date (format: dd-mm-yyyy)' });
    }
    
    const historyData = await client.coinIdHistory({
      id: coinId,
      date,
      localization: localization !== 'false'
    });
    res.json(historyData);
  } catch (error) {
    console.error(`Error fetching history for coin ${req.params.coinId}:`, error);
    res.status(500).json({ error: `Failed to fetch history for coin ${req.params.coinId}` });
  }
});

// Get coin market chart
app.get('/api/coins/:coinId/market_chart', async (req, res) => {
  try {
    const { coinId } = req.params;
    const { vs_currency, days, interval, precision } = req.query;
    
    if (!vs_currency || !days) {
      return res.status(400).json({ error: 'Missing required parameters: vs_currency, days' });
    }
    
    const chartData = await client.coinIdMarketChart({
      id: coinId,
      vs_currency,
      days,
      interval,
      precision
    });
    res.json(chartData);
  } catch (error) {
    console.error(`Error fetching market chart for coin ${req.params.coinId}:`, error);
    res.status(500).json({ error: `Failed to fetch market chart for coin ${req.params.coinId}` });
  }
});

// Get coin market chart range
app.get('/api/coins/:coinId/market_chart/range', async (req, res) => {
  try {
    const { coinId } = req.params;
    const { vs_currency, from, to, precision } = req.query;
    
    if (!vs_currency || !from || !to) {
      return res.status(400).json({ error: 'Missing required parameters: vs_currency, from, to' });
    }
    
    const chartRangeData = await client.coinIdMarketChartRange({
      id: coinId,
      vs_currency,
      from,
      to,
      precision
    });
    res.json(chartRangeData);
  } catch (error) {
    console.error(`Error fetching market chart range for coin ${req.params.coinId}:`, error);
    res.status(500).json({ error: `Failed to fetch market chart range for coin ${req.params.coinId}` });
  }
});

// Get coin OHLC data
app.get('/api/coins/:coinId/ohlc', async (req, res) => {
  try {
    const { coinId } = req.params;
    const { vs_currency, days, precision } = req.query;
    
    if (!vs_currency || !days) {
      return res.status(400).json({ error: 'Missing required parameters: vs_currency, days' });
    }
    
    const ohlcData = await client.coinIdOHLC({
      id: coinId,
      vs_currency,
      days,
      precision
    });
    res.json(ohlcData);
  } catch (error) {
    console.error(`Error fetching OHLC data for coin ${req.params.coinId}:`, error);
    res.status(500).json({ error: `Failed to fetch OHLC data for coin ${req.params.coinId}` });
  }
});

// === CONTRACT Endpoints ===

// Get coin info from contract address
app.get('/api/coins/:assetPlatformId/contract/:contractAddress', async (req, res) => {
  try {
    const { assetPlatformId, contractAddress } = req.params;
    
    const contractData = await client.contract({
      id: assetPlatformId, 
      contract_address: contractAddress
    });
    res.json(contractData);
  } catch (error) {
    console.error(`Error fetching contract data:`, error);
    res.status(500).json({ error: 'Failed to fetch contract data' });
  }
});

// Get contract market chart
app.get('/api/coins/:assetPlatformId/contract/:contractAddress/market_chart', async (req, res) => {
  try {
    const { assetPlatformId, contractAddress } = req.params;
    const { vs_currency, days, precision } = req.query;
    
    if (!vs_currency || !days) {
      return res.status(400).json({ error: 'Missing required parameters: vs_currency, days' });
    }
    
    const contractChartData = await client.contractMarketChart({
      id: assetPlatformId,
      contract_address: contractAddress,
      vs_currency,
      days,
      precision
    });
    res.json(contractChartData);
  } catch (error) {
    console.error(`Error fetching contract market chart data:`, error);
    res.status(500).json({ error: 'Failed to fetch contract market chart data' });
  }
});

// Get contract market chart range
app.get('/api/coins/:assetPlatformId/contract/:contractAddress/market_chart/range', async (req, res) => {
  try {
    const { assetPlatformId, contractAddress } = req.params;
    const { vs_currency, from, to, precision } = req.query;
    
    if (!vs_currency || !from || !to) {
      return res.status(400).json({ error: 'Missing required parameters: vs_currency, from, to' });
    }
    
    const contractChartRangeData = await client.contractMarketChartRange({
      id: assetPlatformId,
      contract_address: contractAddress,
      vs_currency,
      from,
      to,
      precision
    });
    res.json(contractChartRangeData);
  } catch (error) {
    console.error(`Error fetching contract market chart range data:`, error);
    res.status(500).json({ error: 'Failed to fetch contract market chart range data' });
  }
});

// === ASSET PLATFORMS Endpoint ===

// Get list of all asset platforms
app.get('/api/asset_platforms', async (req, res) => {
  try {
    const { filter } = req.query;
    const assetPlatforms = await client.assetPlatforms({
      filter
    });
    res.json(assetPlatforms);
  } catch (error) {
    console.error('Error fetching asset platforms:', error);
    res.status(500).json({ error: 'Failed to fetch asset platforms' });
  }
});

// === CATEGORIES Endpoints ===

// Get list of all categories
app.get('/api/coins/categories/list', async (req, res) => {
  try {
    const categoriesList = await client.coinCategoriesList();
    res.json(categoriesList);
  } catch (error) {
    console.error('Error fetching categories list:', error);
    res.status(500).json({ error: 'Failed to fetch categories list' });
  }
});

// Get list of all categories with market data
app.get('/api/coins/categories', async (req, res) => {
  try {
    const { order } = req.query;
    const categories = await client.coinCategories({
      order
    });
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// === EXCHANGES Endpoints ===

// Get list of all exchanges
app.get('/api/exchanges', async (req, res) => {
  try {
    const { per_page, page } = req.query;
    const exchanges = await client.exchanges({
      per_page: per_page ? parseInt(per_page) : 100,
      page: page ? parseInt(page) : 1
    });
    res.json(exchanges);
  } catch (error) {
    console.error('Error fetching exchanges:', error);
    res.status(500).json({ error: 'Failed to fetch exchanges' });
  }
});

// Get list of all exchanges with IDs
app.get('/api/exchanges/list', async (req, res) => {
  try {
    const exchangesList = await client.exchangesList();
    res.json(exchangesList);
  } catch (error) {
    console.error('Error fetching exchanges list:', error);
    res.status(500).json({ error: 'Failed to fetch exchanges list' });
  }
});

// Get exchange details
app.get('/api/exchanges/:exchangeId', async (req, res) => {
  try {
    const { exchangeId } = req.params;
    const exchangeData = await client.exchangeId({
      id: exchangeId
    });
    res.json(exchangeData);
  } catch (error) {
    console.error(`Error fetching data for exchange ${req.params.exchangeId}:`, error);
    res.status(500).json({ error: `Failed to fetch data for exchange ${req.params.exchangeId}` });
  }
});

// Get exchange tickers
app.get('/api/exchanges/:exchangeId/tickers', async (req, res) => {
  try {
    const { exchangeId } = req.params;
    const { coin_ids, include_exchange_logo, page, depth, order } = req.query;
    
    const exchangeTickersData = await client.exchangeIdTickers({
      id: exchangeId,
      coin_ids: coin_ids ? coin_ids.split(',') : undefined,
      include_exchange_logo: include_exchange_logo === 'true',
      page: page ? parseInt(page) : 1,
      depth: depth === 'true',
      order
    });
    res.json(exchangeTickersData);
  } catch (error) {
    console.error(`Error fetching tickers for exchange ${req.params.exchangeId}:`, error);
    res.status(500).json({ error: `Failed to fetch tickers for exchange ${req.params.exchangeId}` });
  }
});

// Get exchange volume chart
app.get('/api/exchanges/:exchangeId/volume_chart', async (req, res) => {
  try {
    const { exchangeId } = req.params;
    const { days } = req.query;
    
    if (!days) {
      return res.status(400).json({ error: 'Missing required parameter: days' });
    }
    
    const exchangeVolumeChartData = await client.exchangeIdVolumeChart({
      id: exchangeId,
      days: parseInt(days)
    });
    res.json(exchangeVolumeChartData);
  } catch (error) {
    console.error(`Error fetching volume chart for exchange ${req.params.exchangeId}:`, error);
    res.status(500).json({ error: `Failed to fetch volume chart for exchange ${req.params.exchangeId}` });
  }
});

// === DERIVATIVES Endpoints ===

// Get all derivative tickers
app.get('/api/derivatives', async (req, res) => {
  try {
    const derivativesData = await client.derivatives();
    res.json(derivativesData);
  } catch (error) {
    console.error('Error fetching derivatives:', error);
    res.status(500).json({ error: 'Failed to fetch derivatives' });
  }
});

// Get all derivative exchanges
app.get('/api/derivatives/exchanges', async (req, res) => {
  try {
    const { order, per_page, page } = req.query;
    
    const derivativeExchangesData = await client.derivativesExchanges({
      order,
      per_page: per_page ? parseInt(per_page) : undefined,
      page: page ? parseInt(page) : undefined
    });
    res.json(derivativeExchangesData);
  } catch (error) {
    console.error('Error fetching derivative exchanges:', error);
    res.status(500).json({ error: 'Failed to fetch derivative exchanges' });
  }
});

// Get derivative exchange data
app.get('/api/derivatives/exchanges/:exchangeId', async (req, res) => {
  try {
    const { exchangeId } = req.params;
    const { include_tickers } = req.query;
    
    const derivativeExchangeData = await client.derivativesExchangesId({
      id: exchangeId,
      include_tickers
    });
    res.json(derivativeExchangeData);
  } catch (error) {
    console.error(`Error fetching data for derivative exchange ${req.params.exchangeId}:`, error);
    res.status(500).json({ error: `Failed to fetch data for derivative exchange ${req.params.exchangeId}` });
  }
});

// Get derivative exchanges list
app.get('/api/derivatives/exchanges/list', async (req, res) => {
  try {
    const derivativeExchangesList = await client.derivativesExchangesList();
    res.json(derivativeExchangesList);
  } catch (error) {
    console.error('Error fetching derivative exchanges list:', error);
    res.status(500).json({ error: 'Failed to fetch derivative exchanges list' });
  }
});

// === NFTs Endpoints (beta) ===

// Get NFTs list
app.get('/api/nfts/list', async (req, res) => {
  try {
    const { order, asset_platform_id, per_page, page } = req.query;
    
    const nftsList = await client.nftsList({
      order,
      asset_platform_id,
      per_page: per_page ? parseInt(per_page) : 100,
      page: page ? parseInt(page) : 1
    });
    res.json(nftsList);
  } catch (error) {
    console.error('Error fetching NFTs list:', error);
    res.status(500).json({ error: 'Failed to fetch NFTs list' });
  }
});

// Get NFT by ID
app.get('/api/nfts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const nftData = await client.nftsId({
      id
    });
    res.json(nftData);
  } catch (error) {
    console.error(`Error fetching NFT data for ${req.params.id}:`, error);
    res.status(500).json({ error: `Failed to fetch NFT data for ${req.params.id}` });
  }
});

// Get NFT by contract
app.get('/api/nfts/:asset_platform_id/contract/:contract_address', async (req, res) => {
  try {
    const { asset_platform_id, contract_address } = req.params;
    
    const nftContractData = await client.nftsContract({
      asset_platform_id,
      contract_address
    });
    res.json(nftContractData);
  } catch (error) {
    console.error('Error fetching NFT contract data:', error);
    res.status(500).json({ error: 'Failed to fetch NFT contract data' });
  }
});

// === EXCHANGE RATES Endpoint ===

// Get exchange rates
app.get('/api/exchange_rates', async (req, res) => {
  try {
    const exchangeRatesData = await client.exchangeRates();
    res.json(exchangeRatesData);
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    res.status(500).json({ error: 'Failed to fetch exchange rates' });
  }
});

// === SEARCH Endpoint ===

// Search for coins, categories, and markets
app.get('/api/search', async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({ error: 'Missing required parameter: query' });
    }
    
    const searchResults = await client.search({
      query
    });
    res.json(searchResults);
  } catch (error) {
    console.error('Error performing search:', error);
    res.status(500).json({ error: 'Failed to perform search' });
  }
});

// === TRENDING Endpoint ===

// Get trending coins
app.get('/api/trending', async (req, res) => {
  try {
    const trendingCoins = await client.trending();
    res.json(trendingCoins);
  } catch (error) {
    console.error('Error fetching trending coins:', error);
    res.status(500).json({ error: 'Failed to fetch trending coins' });
  }
});

// === GLOBAL Endpoints ===

// Get global cryptocurrency data
app.get('/api/global', async (req, res) => {
  try {
    const apiKey = process.env.COINGECKO_API_KEY;
    const baseUrl = apiKey 
      ? 'https://pro-api.coingecko.com/api/v3/global'
      : 'https://api.coingecko.com/api/v3/global';
    
    if (!apiKey) {
      console.log('No API key found, using free CoinGecko API for global data');
    }

    const headers = apiKey ? { 'x-cg-pro-api-key': apiKey } : {};
    
    const response = await fetch(baseUrl, { headers });
    
    if (!response.ok) {
      throw new Error(`Error from CoinGecko API: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error fetching global data:', error);
    res.status(500).json({ error: 'Failed to fetch global data' });
  }
});

// Get global DeFi data
app.get('/api/global/decentralized_finance_defi', async (req, res) => {
  try {
    const globalDefiData = await client.globalDefi();
    res.json(globalDefiData);
  } catch (error) {
    console.error('Error fetching global DeFi data:', error);
    res.status(500).json({ error: 'Failed to fetch global DeFi data' });
  }
});

// === COMPANIES Endpoint (beta) ===

// Get public companies data
app.get('/api/companies/public_treasury/:coin_id', async (req, res) => {
  try {
    const { coin_id } = req.params;
    
    if (coin_id !== 'bitcoin' && coin_id !== 'ethereum') {
      return res.status(400).json({ error: 'Invalid coin_id parameter. Only "bitcoin" or "ethereum" are supported.' });
    }
    
    const companiesData = await client.companies({
      coin_id
    });
    res.json(companiesData);
  } catch (error) {
    console.error(`Error fetching companies data for ${req.params.coin_id}:`, error);
    res.status(500).json({ error: `Failed to fetch companies data for ${req.params.coin_id}` });
  }
});

// === SEARCH Endpoint ===

// Search for coins, categories, and markets
app.get('/api/search/trending', async (req, res) => {
  try {
    const apiKey = process.env.COINGECKO_API_KEY;
    const baseUrl = apiKey 
      ? 'https://pro-api.coingecko.com/api/v3/search/trending'
      : 'https://api.coingecko.com/api/v3/search/trending';
    
    if (!apiKey) {
      console.log('No API key found, using free CoinGecko API for search/trending');
    }

    const headers = apiKey ? { 'x-cg-pro-api-key': apiKey } : {};
    
    const response = await fetch(baseUrl, { headers });
    
    if (!response.ok) {
      throw new Error(`Error from CoinGecko API: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error fetching trending data:', error);
    res.status(500).json({ error: 'Failed to fetch trending data' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`CoinGecko API Server running on http://localhost:${port}`);
}); 