# Development Notes

## System Specifications

### Environment
- Node.js
- Express.js
- CoinGecko API v3

### Dependencies
- **express**: Web server framework
- **coingecko-api-v3**: API client for CoinGecko cryptocurrency data

## Implementation Details

### API Client Configuration
The CoinGecko API client is configured with:
- 10 second timeout to prevent long-hanging requests
- Auto-retry functionality for handling rate limit errors

### Endpoints Implementation

#### Initial Implementation

##### 1. Root Endpoint
- Purpose: Health check for server status
- Path: `/`
- Response: JSON message confirming server is running

##### 2. Trending Coins
- Purpose: Retrieve trending cryptocurrency data
- Path: `/api/trending`
- Method: `client.trending()`
- Error Handling: 500 status with error details on failure

##### 3. Price Data
- Purpose: Get price information for specified coins
- Path: `/api/prices/:coinIds`
- Parameters: Comma-separated list of coin IDs
- Method: `client.simplePrice()`
- Options:
  * Currencies: USD, EUR
  * 24h change included

##### 4. Coin Details
- Purpose: Retrieve detailed information about a specific coin
- Path: `/api/coins/:coinId`
- Method: `client.coinId()`
- Error Handling: 500 status with contextual error message

#### Enhanced Implementation

The API has been enhanced to support all major CoinGecko API endpoints according to the official Swagger documentation. The endpoints are organized into logical categories:

##### Simple Endpoints
- `/api/simple/price`: Get current prices with customizable options
- `/api/simple/token_price/:id`: Get token prices by contract addresses
- `/api/simple/supported_vs_currencies`: Get supported currency list

##### Coins Endpoints
- `/api/coins/list`: Get all supported coins
- `/api/coins/markets`: Get market data with sorting and filtering
- `/api/coins/:coinId`: Get detailed coin information
- `/api/coins/:coinId/tickers`: Get trading data from exchanges
- `/api/coins/:coinId/history`: Get historical data for specific dates
- `/api/coins/:coinId/market_chart`: Get time-series market data
- `/api/coins/:coinId/market_chart/range`: Get time-series data for custom ranges
- `/api/coins/:coinId/ohlc`: Get candlestick (OHLC) data

##### Contract Endpoints
- Support for contract-based queries across various blockchain platforms
- Market chart data for specific token contracts

##### Additional Categories
- Asset Platforms: Blockchain network information
- Categories: Coin categorization and market data
- Exchanges: Exchange information, tickers, and volume data
- Derivatives: Futures and options market data
- NFTs: Non-fungible token market data (beta)
- Exchange Rates: Currency conversion rates
- Search: Unified search across coins and exchanges
- Global: Market-wide statistics and metrics
- Companies: Corporate treasury holdings data (beta)

## API Limitations

The CoinGecko API has rate limits:
- 10-30 calls/minute for free API tier
- Auto-retry is enabled, but implementing proper caching is recommended for production

## Parameter Handling

- Required parameters are validated with appropriate error responses
- Optional parameters are properly defaulted or excluded as needed
- Parameter types are converted as required (e.g., string to array, string to boolean)
- Complex parameter handling for arrays, comma-separated values, and special formats

## Error Handling Strategy

- Consistent error response format across all endpoints
- Contextual error messages based on the endpoint and operation
- HTTP status codes aligned with error types:
  * 400: Bad Request (missing or invalid parameters)
  * 500: Internal Server Error (API or server failure)
- Detailed error logging for server-side debugging

## Future Enhancements

### Planned Features
1. Response caching to reduce API calls
2. Rate limiting to prevent abuse
3. More detailed error handling
4. Additional endpoints for market data

### Performance Optimizations
- Implement Redis or in-memory caching
- Add compression for responses
- Consider pagination for large datasets
- Implement request batching for multiple coin queries

### Monitoring and Maintenance
- Add request logging for API usage analysis
- Implement health checks for the API client
- Set up monitoring for rate limit approach warnings
- Create dashboard for API performance metrics

# CoinGecko API Server - Development Notes

## Implementation Summary - 2023-03-20

Successfully implemented JSON-RPC 2.0 support for the MCP protocol, enabling AI systems like Claude to interact with the CoinGecko API. This implementation includes:

1. **Tool Integration**
   - Added JSON-RPC 2.0 endpoint using the `jayson` library
   - Created an MCP schema definition that follows the specification
   - Implemented methods for core CoinGecko API features

2. **Documentation**
   - Added comprehensive MCP integration guide
   - Updated project README
   - Created testing tools and examples

3. **Testing**
   - Verified endpoint functionality using the `test-mcp.js` script
   - Manual testing with curl commands
   - Ensured compatibility with existing REST API endpoints

All tests pass, and the implementation is ready for use with Claude or other AI systems that support the MCP protocol.

## MCP Implementation - 2023-03-20

### JSON-RPC 2.0 Implementation

The MCP specification requires a JSON-RPC 2.0 endpoint to handle method calls from AI clients. We implemented this using the `jayson` library, which provides a middleware that can be easily integrated with Express.

Key technical decisions:

1. **Direct API Calls**: We chose to implement our own fetch-based API calls rather than using the CoinGecko client library for the MCP methods to ensure full control over error handling and request formatting.

2. **Middleware Approach**: The JSON-RPC server is implemented as Express middleware, making it easy to integrate with the existing server.

3. **Fallback Mechanism**: All methods automatically detect API key presence and fall back to the free API if no key is available.

### Schema Design

The schema design follows MCP specifications with:

- Root level properties: name, description, schema
- Tool definitions with parameters and return types
- Clear documentation for each parameter

### Error Handling Strategy

JSON-RPC 2.0 error codes are used according to the specification:

- `-32600`: Invalid request (malformed JSON or invalid RPC object)
- `-32601`: Method not found
- `-32602`: Invalid params (missing required parameters)
- `-32603`: Internal error (server error during execution)

### Testing Approach

The test script (`test-mcp.js`) checks:

1. Schema endpoint availability and format
2. Basic method call functionality (ping)
3. Parameter handling (getPrice with required parameters)
4. Results processing (getCoinMarkets with complex response)

## Technical Implementation Details

### API Key Management

```javascript
// Get API key from environment
const API_KEY = process.env.COINGECKO_API_KEY;

// Function to determine which API to use
function getApiUrl() {
  return API_KEY ? PRO_API_URL : FREE_API_URL;
}

// In request headers
const headers = API_KEY ? { 'x-cg-pro-api-key': API_KEY } : {};
```

### Parameter Handling

```javascript
// Example of parameter handling
const { ids, vs_currencies } = args[0] || {};

if (!ids || !vs_currencies) {
  return callback({ code: -32602, message: "Missing required parameters" });
}

const params = new URLSearchParams();
params.append('ids', Array.isArray(ids) ? ids.join(',') : ids);
```

### Response Processing

```javascript
// Example of response processing
const response = await fetch(url, { headers });
const data = await response.json();
return callback(null, data);
```

## Performance Considerations

- The server does not implement caching at this point
- Rate limiting is handled by the CoinGecko API
- Auto-retry is available through the CoinGecko client but not in MCP methods

## Future Improvements

1. **Caching**: Implement response caching to reduce API calls
2. **Rate Limiting**: Add client-side rate limiting to prevent API restrictions
3. **Metrics**: Track and log API usage for optimization
4. **Authentication**: Add auth for MCP endpoints when used in production
5. **Additional Methods**: Implement more CoinGecko API methods as MCP tools 