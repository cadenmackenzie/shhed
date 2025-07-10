/**
 * Express.js integration example for Shhed SDK
 * 
 * This example shows how to:
 * 1. Use Shhed SDK in an Express application
 * 2. Load configuration on startup
 * 3. Make keys available throughout the application
 * 4. Handle graceful startup and error handling
 */

const express = require('express');
const { Shhed } = require('shhed');

class AppConfig {
  constructor() {
    this.shhed = null;
    this.keys = {};
    this.isReady = false;
  }

  async initialize() {
    console.log('🔄 Initializing Shhed configuration...');

    try {
      // Initialize Shhed SDK
      this.shhed = new Shhed({
        token: process.env.KV_TOKEN,
        projectId: process.env.KV_PROJECT_ID
        // endpoint: 'http://localhost:8000' // Optional: only for development/testing
      });

      // Test connection
      await this.shhed.test();
      console.log('✅ Shhed connection established');

      // Load all required keys
      await this.loadKeys();
      
      this.isReady = true;
      console.log('✅ Application configuration loaded successfully');

    } catch (error) {
      console.error('❌ Failed to initialize configuration:', error.message);
      throw error;
    }
  }

  async loadKeys() {
    const requiredKeys = [
      'DATABASE_URL',
      'JWT_SECRET',
      'STRIPE_API_KEY',
      'SENDGRID_API_KEY'
    ];

    console.log('🔄 Loading API keys...');

    for (const keyName of requiredKeys) {
      try {
        const value = await this.shhed.get(keyName);
        this.keys[keyName] = value;
        console.log(`✅ Loaded ${keyName}`);
      } catch (error) {
        console.error(`❌ Failed to load ${keyName}:`, error.message);
        throw new Error(`Required configuration key ${keyName} is missing`);
      }
    }
  }

  get(keyName) {
    if (!this.isReady) {
      throw new Error('Configuration not ready. Call initialize() first.');
    }
    return this.keys[keyName];
  }

  isConfigReady() {
    return this.isReady;
  }
}

// Global configuration instance
const config = new AppConfig();

// Express application
const app = express();
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    configReady: config.isConfigReady(),
    timestamp: new Date().toISOString()
  });
});

// Middleware to ensure configuration is ready
const requireConfig = (req, res, next) => {
  if (!config.isConfigReady()) {
    return res.status(503).json({
      error: 'Service Unavailable',
      message: 'Application configuration is not ready'
    });
  }
  next();
};

// Example API endpoints using the configuration
app.get('/api/database-status', requireConfig, (req, res) => {
  const databaseUrl = config.get('DATABASE_URL');
  // In a real app, you'd use this to connect to the database
  res.json({
    message: 'Database configuration loaded',
    hasUrl: !!databaseUrl,
    urlPreview: databaseUrl ? `${databaseUrl.substring(0, 20)}...` : null
  });
});

app.post('/api/send-email', requireConfig, async (req, res) => {
  const sendgridKey = config.get('SENDGRID_API_KEY');
  // In a real app, you'd use this to send emails via SendGrid
  res.json({
    message: 'Email service configured',
    hasApiKey: !!sendgridKey
  });
});

app.post('/api/process-payment', requireConfig, async (req, res) => {
  const stripeKey = config.get('STRIPE_API_KEY');
  // In a real app, you'd use this to process payments via Stripe
  res.json({
    message: 'Payment service configured',
    hasApiKey: !!stripeKey
  });
});

// Graceful error handling
app.use((err, req, res, next) => {
  console.error('Express error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: 'Something went wrong'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'Endpoint not found'
  });
});

// Startup function
async function startServer() {
  const port = process.env.PORT || 3000;

  try {
    // Validate required environment variables
    if (!process.env.KV_TOKEN || !process.env.KV_PROJECT_ID) {
      console.error('❌ Missing required environment variables:');
      console.error('   KV_TOKEN: Your Shhed access token');
      console.error('   KV_PROJECT_ID: Your project ID');
      process.exit(1);
    }

    // Initialize configuration
    await config.initialize();

    // Start the server
    const server = app.listen(port, () => {
      console.log(`🚀 Server running on port ${port}`);
      console.log(`📋 Health check: http://localhost:${port}/health`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('👋 SIGTERM received, shutting down gracefully');
      server.close(() => {
        console.log('✅ Process terminated');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.log('👋 SIGINT received, shutting down gracefully');
      server.close(() => {
        console.log('✅ Process terminated');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
}

// Start the server if this file is run directly
if (require.main === module) {
  startServer();
}

module.exports = { app, config, startServer }; 