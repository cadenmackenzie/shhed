/**
 * TypeScript usage example for Shhed SDK
 * 
 * This example shows how to:
 * 1. Use the SDK with TypeScript
 * 2. Create a configuration service
 * 3. Handle different types of API keys
 * 4. Implement proper error handling
 */

import { Shhed, ShhedConfig, ShhedSDKError } from 'shhed';

interface APIKeys {
  stripe: string;
  openai: string;
  database: string;
  redis: string;
  sendgrid?: string; // Optional key
}

class ConfigService {
  private shhed: Shhed;

  constructor(config: ShhedConfig) {
    this.shhed = new Shhed(config);
  }

  /**
   * Load all required API keys
   */
  async loadAPIKeys(): Promise<APIKeys> {
    console.log('🔄 Loading API keys from Shhed...');

    try {
      // Test connection first
      await this.shhed.test();
      console.log('✅ Connection to Shhed established');

      // Load all keys in parallel for better performance
      const [stripe, openai, database, redis, sendgrid] = await Promise.allSettled([
        this.shhed.get('STRIPE_API_KEY'),
        this.shhed.get('OPENAI_API_KEY'),
        this.shhed.get('DATABASE_URL'),
        this.shhed.get('REDIS_URL'),
        this.shhed.get('SENDGRID_API_KEY') // Optional key
      ]);

      const keys: APIKeys = {
        stripe: this.extractValue(stripe, 'STRIPE_API_KEY'),
        openai: this.extractValue(openai, 'OPENAI_API_KEY'),
        database: this.extractValue(database, 'DATABASE_URL'),
        redis: this.extractValue(redis, 'REDIS_URL')
      };

      // Handle optional key
      if (sendgrid.status === 'fulfilled') {
        keys.sendgrid = sendgrid.value;
        console.log('✅ SendGrid API key loaded (optional)');
      } else {
        console.log('⚠️  SendGrid API key not found (optional, skipping)');
      }

      console.log('✅ All required API keys loaded successfully');
      return keys;

    } catch (error) {
      console.error('❌ Failed to load API keys:', error);
      throw error;
    }
  }

  /**
   * Get a single API key with retry logic
   */
  async getKeyWithRetry(keyName: string, maxRetries: number = 3): Promise<string> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 Fetching ${keyName} (attempt ${attempt}/${maxRetries})`);
        const value = await this.shhed.get(keyName);
        console.log(`✅ Successfully fetched ${keyName}`);
        return value;
      } catch (error) {
        lastError = error as Error;
        
        if (error instanceof ShhedSDKError) {
          // Don't retry on 404 or authentication errors
          if (error.statusCode === 404 || error.statusCode === 401 || error.statusCode === 403) {
            throw error;
          }
        }

        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
          console.log(`⏳ Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError!;
  }

  private extractValue(result: PromiseSettledResult<string>, keyName: string): string {
    if (result.status === 'fulfilled') {
      console.log(`✅ ${keyName} loaded`);
      return result.value;
    } else {
      console.error(`❌ Failed to load ${keyName}:`, result.reason);
      throw new Error(`Required key ${keyName} could not be loaded: ${result.reason.message}`);
    }
  }
}

// Example usage
async function main(): Promise<void> {
  const config: ShhedConfig = {
    access_key: process.env.SHHED_ACCESS_KEY!,
    secret_key: process.env.SHHED_SECRET_KEY!,
    projectId: process.env.SHHED_PROJECT_ID!
    // endpoint: 'http://localhost:8000' // Optional: only for development/testing
  };

  // Validate required environment variables
  if (!config.access_key || !config.projectId) {
    console.error('❌ Missing required environment variables:');
    console.error('   SHHED_ACCESS_KEY: Your Shhed access key');
    console.error('   SHHED_SECRET_KEY: Your Shhed secret key (optional for public keys only)');
    console.error('   SHHED_PROJECT_ID: Your project ID');
    process.exit(1);
  }

  const configService = new ConfigService(config);

  try {
    // Load all API keys
    const apiKeys = await configService.loadAPIKeys();

    // Example usage of the loaded keys
    console.log('\n📊 API Keys Summary:');
    console.log(`Stripe: ${apiKeys.stripe.substring(0, 8)}...`);
    console.log(`OpenAI: ${apiKeys.openai.substring(0, 8)}...`);
    console.log(`Database: ${apiKeys.database.substring(0, 20)}...`);
    console.log(`Redis: ${apiKeys.redis.substring(0, 20)}...`);
    
    if (apiKeys.sendgrid) {
      console.log(`SendGrid: ${apiKeys.sendgrid.substring(0, 8)}...`);
    }

    // Example: Get a single key with retry
    console.log('\n🔄 Testing retry functionality...');
    const singleKey = await configService.getKeyWithRetry('STRIPE_API_KEY', 2);
    console.log(`Retrieved with retry: ${singleKey.substring(0, 8)}...`);

  } catch (error) {
    if (error instanceof ShhedSDKError) {
      console.error(`❌ Shhed Error (${error.statusCode}): ${error.message}`);
      
      switch (error.statusCode) {
        case 401:
        case 403:
          console.error('🔐 Authentication failed. Check your access token.');
          break;
        case 404:
          console.error('🔍 Resource not found. Check your project ID and key names.');
          break;
        case 0:
          console.error('🌐 Network error. Check your internet connection and endpoint URL.');
          break;
        default:
          console.error('🚨 Server error. Please try again later.');
      }
    } else {
      console.error('❌ Unexpected error:', error);
    }
    
    process.exit(1);
  }
}

// Export for testing
export { ConfigService, main };

// Run if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
} 