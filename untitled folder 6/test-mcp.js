#!/usr/bin/env node

/**
 * Test script for MCP JSON-RPC 2.0 endpoint
 * 
 * This script can be used to test the MCP JSON-RPC implementation
 * by making requests to the /rpc endpoint and displaying responses.
 */

const fetch = require('node-fetch');

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3000';

async function testMcpEndpoint() {
  console.log('🔄 Testing CoinGecko API Server MCP Integration');
  console.log('==============================================');
  console.log(`🌐 Server URL: ${SERVER_URL}`);
  
  // Step 1: Test the schema endpoint
  console.log('\n📝 Step 1: Fetching MCP Schema...');
  try {
    const schemaRes = await fetch(`${SERVER_URL}/mcp/schema`);
    
    if (!schemaRes.ok) {
      throw new Error(`Schema request failed with status: ${schemaRes.status}`);
    }
    
    const schema = await schemaRes.json();
    console.log('✅ Schema endpoint working');
    console.log(`   Found ${Object.keys(schema.schema.properties).length} available methods`);
    console.log(`   MCP Name: ${schema.name}`);
  } catch (error) {
    console.error('❌ Schema endpoint error:', error.message);
    process.exit(1);
  }
  
  // Step 2: Test the ping method
  console.log('\n📝 Step 2: Testing ping method...');
  try {
    const pingRes = await fetch(`${SERVER_URL}/rpc`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: '1',
        method: 'ping',
        params: []
      })
    });
    
    if (!pingRes.ok) {
      throw new Error(`Ping request failed with status: ${pingRes.status}`);
    }
    
    const pingData = await pingRes.json();
    if (pingData.error) {
      throw new Error(`RPC Error: ${JSON.stringify(pingData.error)}`);
    }
    
    console.log('✅ Ping method working');
    console.log(`   Response: ${JSON.stringify(pingData.result)}`);
  } catch (error) {
    console.error('❌ Ping method error:', error.message);
  }
  
  // Step 3: Test the getPrice method
  console.log('\n📝 Step 3: Testing getPrice method...');
  try {
    const priceRes = await fetch(`${SERVER_URL}/rpc`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: '2',
        method: 'getPrice',
        params: [{
          ids: ['bitcoin', 'ethereum'],
          vs_currencies: ['usd', 'eur']
        }]
      })
    });
    
    if (!priceRes.ok) {
      throw new Error(`GetPrice request failed with status: ${priceRes.status}`);
    }
    
    const priceData = await priceRes.json();
    if (priceData.error) {
      throw new Error(`RPC Error: ${JSON.stringify(priceData.error)}`);
    }
    
    console.log('✅ GetPrice method working');
    console.log(`   Bitcoin USD: ${priceData.result.bitcoin?.usd || 'N/A'}`);
    console.log(`   Ethereum USD: ${priceData.result.ethereum?.usd || 'N/A'}`);
  } catch (error) {
    console.error('❌ GetPrice method error:', error.message);
  }
  
  // Step 4: Test the getCoinMarkets method
  console.log('\n📝 Step 4: Testing getCoinMarkets method...');
  try {
    const marketsRes = await fetch(`${SERVER_URL}/rpc`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: '3',
        method: 'getCoinMarkets',
        params: [{
          vs_currency: 'usd',
          ids: 'bitcoin,ethereum',
          per_page: 2
        }]
      })
    });
    
    if (!marketsRes.ok) {
      throw new Error(`GetCoinMarkets request failed with status: ${marketsRes.status}`);
    }
    
    const marketsData = await marketsRes.json();
    if (marketsData.error) {
      throw new Error(`RPC Error: ${JSON.stringify(marketsData.error)}`);
    }
    
    console.log('✅ GetCoinMarkets method working');
    console.log(`   Retrieved ${marketsData.result.length} coin(s)`);
    if (marketsData.result.length > 0) {
      console.log(`   First coin: ${marketsData.result[0].name} (${marketsData.result[0].symbol})`);
    }
  } catch (error) {
    console.error('❌ GetCoinMarkets method error:', error.message);
  }
  
  console.log('\n🎉 MCP Testing Complete!');
  console.log('=======================');
  console.log('To use with Claude Desktop:');
  console.log(`1. Ensure server is running at ${SERVER_URL}`);
  console.log('2. In Claude Desktop, register this URL as an MCP component');
  console.log('3. Claude will be able to use cryptocurrency data tools');
}

testMcpEndpoint().catch(error => {
  console.error('Test failed with error:', error);
  process.exit(1);
}); 