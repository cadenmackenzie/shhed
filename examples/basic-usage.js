/**
 * Basic usage example for Shhed SDK in JavaScript
 * 
 * This example shows how to:
 * 1. Initialize the Shhed SDK with different authentication modes
 * 2. Retrieve API keys
 * 3. Handle errors
 */

const { Shhed } = require('shhed');

async function main() {
  // Initialize Shhed SDK with full access (public and private keys)
  const kv = new Shhed({
    access_key: process.env.KV_ACCESS_KEY,
    secret_key: process.env.KV_SECRET_KEY,
    projectId: process.env.KV_PROJECT_ID
    // endpoint: 'http://localhost:8000' // Optional: only for development/testing
  });

  // Initialize Shhed SDK with public access only (public keys only)
  const kvPublic = new Shhed({
    access_key: process.env.KV_ACCESS_KEY,
    projectId: process.env.KV_PROJECT_ID
    // endpoint: 'http://localhost:8000' // Optional: only for development/testing
  });

  try {
    // Test the connection first
    console.log('Testing connection to Shhed...');
    await kv.test();
    console.log('✅ Connection successful!');

    // Retrieve API keys with full access (can get both public and private keys)
    console.log('\nRetrieving API keys with full access...');
    
    const stripeKey = await kv.get('STRIPE_API_KEY'); // Can be private or public
    console.log(`Stripe API Key: ${stripeKey.substring(0, 10)}...`);
    
    const openaiKey = await kv.get('OPENAI_API_KEY'); // Can be private or public
    console.log(`OpenAI API Key: ${openaiKey.substring(0, 10)}...`);
    
    // Try to get a public key with public access (will only work if key is marked as public)
    console.log('\nRetrieving public keys with public access...');
    try {
      const publicKey = await kvPublic.get('PUBLIC_API_KEY'); // Only works if key is public
      console.log(`Public API Key: ${publicKey.substring(0, 10)}...`);
    } catch (publicError) {
      console.log('⚠️  Public key access failed (key might be private or not found)');
    }

  } catch (error) {
    if (error.name === 'ShhedSDKError') {
      console.error(`❌ Shhed API Error (${error.statusCode}): ${error.message}`);
      if (error.response) {
        console.error('API Response:', error.response);
      }
    } else {
      console.error('❌ Unexpected Error:', error.message);
    }
    process.exit(1);
  }
}

// Run the example
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main }; 