#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { execSync } = require('child_process');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🚀 CoinGecko API Server Setup');
console.log('============================');

// Determine if this is being run via npx install or locally
const isNpx = process.env.npm_lifecycle_event === undefined;
let installDir = process.cwd();

if (isNpx) {
  console.log('ℹ️  Installing via npx...');
  
  // Ask for install directory
  rl.question('📁 Where would you like to install the server? (default: ./coingecko-server): ', (answer) => {
    const dir = answer.trim() || './coingecko-server';
    installDir = path.resolve(process.cwd(), dir);
    
    if (!fs.existsSync(installDir)) {
      console.log(`📂 Creating directory: ${installDir}`);
      fs.mkdirSync(installDir, { recursive: true });
    }
    
    // Clone the repository
    console.log('📥 Cloning the repository...');
    try {
      execSync(`git clone https://github.com/GaplyDev01/coingecko-api-server.git ${installDir}`, { stdio: 'inherit' });
      process.chdir(installDir);
      
      // Install dependencies
      console.log('📦 Installing dependencies...');
      execSync('npm install', { stdio: 'inherit' });
      
      setupApiKey();
    } catch (error) {
      console.error('❌ Failed to clone repository:', error.message);
      rl.close();
    }
  });
} else {
  setupApiKey();
}

function setupApiKey() {
  // Check if .env file exists
  const envPath = path.join(installDir, '.env');
  let envContent = '';
  
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }
  
  // Ask for CoinGecko API key
  rl.question('🔑 Enter your CoinGecko API key (leave blank to use free API): ', (apiKey) => {
    const apiKeyValue = apiKey.trim();
    
    if (apiKeyValue) {
      console.log('✅ Using provided API key for CoinGecko Pro');
      if (envContent.includes('COINGECKO_API_KEY=')) {
        // Replace existing API key
        envContent = envContent.replace(
          /COINGECKO_API_KEY=.*/,
          `COINGECKO_API_KEY=${apiKeyValue}`
        );
      } else {
        // Add API key
        envContent += `\nCOINGECKO_API_KEY=${apiKeyValue}\n`;
      }
    } else {
      console.log('ℹ️  No API key provided. Server will use the free CoinGecko API (rate limited).');
      if (envContent.includes('COINGECKO_API_KEY=')) {
        // Comment out existing API key
        envContent = envContent.replace(
          /COINGECKO_API_KEY=(.*)/,
          `# COINGECKO_API_KEY=$1 # Uncomment and add your key to use CoinGecko Pro`
        );
      } else {
        envContent += '\n# COINGECKO_API_KEY=your_api_key_here # Uncomment and add your key to use CoinGecko Pro\n';
      }
    }
    
    // Ask for port
    rl.question('🔌 Enter the port for the server (default: 3000): ', (port) => {
      const portValue = port.trim() || '3000';
      
      if (envContent.includes('PORT=')) {
        // Replace existing port
        envContent = envContent.replace(/PORT=.*/, `PORT=${portValue}`);
      } else {
        envContent += `\nPORT=${portValue}\n`;
      }
      
      // Save .env file
      fs.writeFileSync(envPath, envContent);
      console.log(`✅ Environment configuration saved to ${envPath}`);
      
      console.log('\n🎉 Setup complete!');
      console.log(`\nTo start the server, run:
      cd ${path.relative(process.cwd(), installDir) || '.'}
      npm start
      
      The server will be available at: http://localhost:${portValue}
      
      For more information, see the README.md file.`);
      
      rl.close();
    });
  });
}

rl.on('close', () => {
  process.exit(0);
}); 