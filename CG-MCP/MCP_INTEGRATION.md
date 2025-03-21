# MCP Integration Guide

This guide explains how to use the CoinGecko API Server as an MCP (Marketplace Component Program) component with AI systems like Claude.

## What is MCP?

MCP (Marketplace Component Program) is a protocol that allows AI systems to interact with external tools and APIs in a standardized way. Our CoinGecko API Server implements the MCP protocol, allowing AI models like Claude to access cryptocurrency market data.

## Integration Points

The server provides two key MCP integration points:

1. **JSON-RPC 2.0 Endpoint**: `/rpc` - Accepts JSON-RPC requests
2. **Schema Definition**: `/mcp/schema` - Provides tool definitions

## How It Works

The JSON-RPC 2.0 protocol allows the AI client to:

1. Discover available tools via the schema endpoint
2. Make method calls via the RPC endpoint
3. Process responses in a standardized format

## Setting Up the Connection

### For Users

To use this server with Claude Desktop or other MCP-compatible AI systems:

1. Start the CoinGecko API Server locally: `npm start`
2. Configure your AI assistant to use the local MCP server URL (e.g., `http://localhost:3000`)
3. The AI system should discover available tools and be able to make cryptocurrency data queries

### For Developers

If you're integrating with the MCP server programmatically:

1. Obtain the schema by making a GET request to `/mcp/schema`
2. Make JSON-RPC 2.0 calls to `/rpc` following this format:

```json
{
  "jsonrpc": "2.0",
  "id": "unique-request-id",
  "method": "methodName",
  "params": [methodParameters]
}
```

For example, to get Bitcoin price in USD:

```json
{
  "jsonrpc": "2.0",
  "id": "1",
  "method": "getPrice",
  "params": [{
    "ids": ["bitcoin"],
    "vs_currencies": ["usd"]
  }]
}
```

The server will respond with:

```json
{
  "jsonrpc": "2.0",
  "id": "1",
  "result": {
    "bitcoin": {
      "usd": 34567.89
    }
  }
}
```

## Available Methods

The server provides these MCP methods:

- `ping` - Check API server status
- `getPrice` - Get price data for specified cryptocurrencies
- `getSupportedVsCurrencies` - Get list of supported currencies
- `getCoinMarkets` - Get market data for coins
- `getGlobal` - Get global cryptocurrency data
- `getTrending` - Get trending coins

Each method is fully documented in the schema definition.

## Error Handling

The server follows JSON-RPC 2.0 error handling conventions:

```json
{
  "jsonrpc": "2.0",
  "id": "1",
  "error": {
    "code": -32602,
    "message": "Invalid params: required parameter missing"
  }
}
```

Common error codes:
- `-32600`: Invalid request
- `-32601`: Method not found
- `-32602`: Invalid params
- `-32603`: Internal error

## Testing the Connection

You can test the RPC endpoint with curl:

```bash
curl -X POST http://localhost:3000/rpc \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":"1","method":"ping","params":[]}'
```

And test the schema endpoint:

```bash
curl -X GET http://localhost:3000/mcp/schema
```

## Security Considerations

- The server doesn't implement authentication for local use
- For production deployment, consider adding authentication mechanisms
- The server respects CoinGecko's rate limits and terms of service

## Troubleshooting

If you encounter issues with the MCP integration:

1. Ensure the server is running (`npm start`)
2. Check the server logs for error messages
3. Verify your JSON-RPC requests are properly formatted
4. Ensure required parameters are provided for each method
5. Check if your CoinGecko API key is valid (for Pro API)

For more help, refer to the [GitHub repository](https://github.com/GaplyDev01/coingecko-api-server) or raise an issue. 