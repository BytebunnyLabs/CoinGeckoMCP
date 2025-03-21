# Using CoinGecko Pro API

To use the CoinGecko Pro API, you need to follow these steps:

1. **Sign up for a Pro Plan**
   - Visit [CoinGecko API Pricing](https://www.coingecko.com/en/api/pricing)
   - Choose a suitable plan (Analyst, Lite, Pro, or Enterprise)
   - Complete the signup process

2. **Get Your API Key**
   - After subscribing, go to your CoinGecko account dashboard
   - Locate the API key section
   - Copy your API key

3. **Set Up Your API Key in the Project**
   - Add your API key to the `.env` file in this format:
     ```
     COINGECKO_API_KEY=your_actual_api_key_here
     ```

4. **Pro API Limitations and Features**
   - Higher rate limits (depends on your plan)
   - Access to additional endpoints
   - Lower latency
   - Better support

5. **API Documentation**
   - Refer to [CoinGecko API Documentation](https://www.coingecko.com/api/documentation) for details on all available endpoints
   - Note that some endpoints are only available for Pro users

6. **Testing Your Setup**
   - Once you've added your API key, restart the server:
     ```
     pkill -f "node server.js"; node server.js &
     ```
   - Test basic endpoints like `/api/ping`
   - Then test Pro endpoints like `/api/coins/markets`

7. **Troubleshooting**
   - If you get 401 errors: Your API key may be invalid
   - If you get 403 errors: You're trying to access endpoints not included in your plan
   - If you get 429 errors: You've exceeded your rate limit

## Notes for Development

For development purposes, you can use the free API with limitations:
- Rate limits: 10-30 calls/minute
- No API key required
- Limited access to some endpoints
- No commercial use allowed

To switch between free and Pro versions, modify the URL in the fetch calls:
- Pro: `https://pro-api.coingecko.com/api/v3/...`
- Free: `https://api.coingecko.com/api/v3/...` 