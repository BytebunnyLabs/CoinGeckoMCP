/**
 * MCP Schema Definitions
 * 
 * This file contains the schema definitions for the MCP tools that can be used
 * by Claude or other AI systems to interact with the CoinGecko API.
 */

const schemas = {
  name: "coingecko-api",
  description: "Access cryptocurrency market data from CoinGecko",
  schema: {
    type: "object",
    properties: {
      ping: {
        type: "function",
        description: "Check API server status",
        parameters: {
          type: "object",
          properties: {},
          required: []
        },
        returns: {
          type: "object",
          description: "API status response"
        }
      },
      getPrice: {
        type: "function",
        description: "Get price data for specified cryptocurrencies in various currencies",
        parameters: {
          type: "object",
          properties: {
            ids: {
              type: "array",
              description: "ID of coins, comma-separated (e.g. bitcoin,ethereum)",
              items: {
                type: "string"
              }
            },
            vs_currencies: {
              type: "array",
              description: "vs_currency of coins, comma-separated (e.g. usd,eur)",
              items: {
                type: "string"
              }
            },
            include_market_cap: {
              type: "boolean",
              description: "Include market cap data (true/false)"
            },
            include_24hr_vol: {
              type: "boolean",
              description: "Include 24hr volume (true/false)"
            },
            include_24hr_change: {
              type: "boolean",
              description: "Include 24hr change (true/false)"
            },
            include_last_updated_at: {
              type: "boolean",
              description: "Include last updated timestamp (true/false)"
            },
            precision: {
              type: "string",
              description: "Decimal precision for price data"
            }
          },
          required: ["ids", "vs_currencies"]
        },
        returns: {
          type: "object",
          description: "Price data for the specified coins"
        }
      },
      getSupportedVsCurrencies: {
        type: "function",
        description: "Get list of supported vs currencies",
        parameters: {
          type: "object",
          properties: {},
          required: []
        },
        returns: {
          type: "array",
          description: "List of supported vs currencies"
        }
      },
      getCoinMarkets: {
        type: "function",
        description: "Get market data for coins",
        parameters: {
          type: "object",
          properties: {
            vs_currency: {
              type: "string",
              description: "The target currency of market data (usd, eur, jpy, etc.)"
            },
            ids: {
              type: "string",
              description: "The ids of the coins, comma separated (e.g. bitcoin,ethereum)"
            },
            category: {
              type: "string",
              description: "Filter by coin category"
            },
            order: {
              type: "string",
              description: "Sort results by field (e.g. market_cap_desc, volume_asc)",
              enum: ["market_cap_desc", "market_cap_asc", "volume_desc", "volume_asc", "id_desc", "id_asc"]
            },
            per_page: {
              type: "number",
              description: "Total results per page (1-250)"
            },
            page: {
              type: "number",
              description: "Page number"
            },
            sparkline: {
              type: "boolean",
              description: "Include sparkline 7 days data"
            },
            price_change_percentage: {
              type: "string",
              description: "Include price change percentage in 1h, 24h, 7d, 14d, 30d, 200d, 1y (e.g. '1h,24h,7d')"
            }
          },
          required: ["vs_currency"]
        },
        returns: {
          type: "array",
          description: "Market data for the specified coins"
        }
      },
      getGlobal: {
        type: "function",
        description: "Get global cryptocurrency data",
        parameters: {
          type: "object",
          properties: {},
          required: []
        },
        returns: {
          type: "object",
          description: "Global cryptocurrency market data"
        }
      },
      getTrending: {
        type: "function",
        description: "Get trending coins",
        parameters: {
          type: "object",
          properties: {},
          required: []
        },
        returns: {
          type: "object",
          description: "List of trending coins"
        }
      }
    }
  }
};

module.exports = schemas; 