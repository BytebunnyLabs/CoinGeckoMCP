# CoinGecko API Server MCP

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

A powerful and flexible Node.js Express server that provides a comprehensive interface to the CoinGecko cryptocurrency data API. This server supports both the free public API and the Pro API with automatic fallback.

## Quick Start

```bash
# Install and run with npx
npx coingecko-api-server

# Or clone and install manually
git clone https://github.com/GaplyDev01/coingecko-api-server.git
cd coingecko-api-server
npm install
npm run setup
npm start
```

## Features

- 🔄 **Dual API Support**: Seamlessly works with both CoinGecko Free and Pro APIs
- 🔙 **Automatic Fallback**: Falls back to free API during development
- 🔌 **RESTful Endpoints**: Simple and intuitive API interface
- 🛡️ **Robust Error Handling**: Detailed error messages and proper status codes
- 🧩 **Simple Setup**: Quick installation with guided setup
- 📝 **Comprehensive Documentation**: Clear usage instructions

## Setup Options

### Option 1: Using npx (Recommended)

This is the fastest way to get started:

```bash
npx coingecko-api-server
```

The interactive setup will:
1. Ask where to install the server
2. Clone the repository
3. Install dependencies
4. Prompt for your CoinGecko API key (optional)
5. Configure your server port

### Option 2: Manual Setup

If you prefer to set up manually:

```bash
# Clone the repository
git clone https://github.com/GaplyDev01/coingecko-api-server.git
cd coingecko-api-server

# Install dependencies
npm install

# Run the setup script
npm run setup

# Start the server
npm start
```

## Configuration

The server can be configured using environment variables in the `.env` file:

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | The port the server will listen on | `3000` |
| `COINGECKO_API_KEY` | Your CoinGecko Pro API key | - |

## API Endpoints

The server provides access to all essential CoinGecko API endpoints:

### Basic Endpoints

- `GET /api/ping` - Check CoinGecko API status

### Price Data

- `GET /api/simple/price` - Get price data for specified coins
  - Query params: `ids`, `vs_currencies`, `include_market_cap`, `include_24hr_vol`, `include_24hr_change`, `include_last_updated_at`, `precision`

- `GET /api/simple/supported_vs_currencies` - Get list of supported vs currencies

### Coin Data

- `GET /api/coins/markets` - Get market data for coins
  - Query params: `vs_currency`, `ids`, `category`, `order`, `per_page`, `page`, `sparkline`, `price_change_percentage`

### Market Data

- `GET /api/global` - Get global cryptocurrency data
- `GET /api/search/trending` - Get trending coins

Full API documentation can be found in the [CoinGecko API Documentation](https://www.coingecko.com/api/documentation).

## MCP Integration Information

This is an MCP (Marketplace Component Program) server compatible with AI systems like Claude. To use this server in Claude Desktop:

1. Start the CoinGecko API server locally
2. In Claude Desktop, install the MCP by providing the server URL (e.g., `http://localhost:3000`)
3. Claude can now access cryptocurrency data through the MCP interface

The server implements the full MCP specification with JSON-RPC 2.0:

- **JSON-RPC 2.0 Endpoint**: `/rpc` - Handles all method calls from AI clients
- **Schema Definition**: `/mcp/schema` - Defines available tools and parameters
- **Standardized Communication**: Follows MCP protocol for seamless AI integration

For detailed integration instructions, see [MCP_INTEGRATION.md](MCP_INTEGRATION.md).

## Pro API vs Free API

This server supports both the CoinGecko Pro API and the free API:

- **Pro API**: Higher rate limits, no throttling, additional endpoints. Requires an API key.
- **Free API**: Limited to ~30 calls/minute with potential rate limiting.

The server automatically detects if an API key is provided and uses the appropriate API. If no key is provided, it will fall back to the free API, which is ideal for development or personal use.

For more details about the Pro API setup, see [USING_COINGECKO_PRO.md](USING_COINGECKO_PRO.md).

## Development

```bash
# Run in development mode with hot reload
npm run dev
```

The server uses direct fetch calls to the CoinGecko API, ensuring compatibility with both free and Pro versions.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [CoinGecko](https://www.coingecko.com/) for the cryptocurrency data API
- [Anthropic](https://www.anthropic.com/) for Claude AI and the MCP program 