# Shhed SDK

Official JavaScript/TypeScript SDK for [Shhed](https://shhed.io) - the secure API key management service.

## 🚀 Features

- **Simple API**: Easy-to-use interface for fetching API keys
- **TypeScript Support**: Full TypeScript definitions included
- **Error Handling**: Comprehensive error handling with custom error types
- **Retry Logic**: Built-in support for retry mechanisms
- **Framework Agnostic**: Works with any JavaScript/TypeScript environment
- **Secure**: Uses your existing Shhed access keys for authentication

## 📦 Installation

```bash
npm install shhed
```

```bash
yarn add shhed
```

```bash
pnpm add shhed
```

## 🔧 Quick Start

### 1. Get Your Access Keys

First, create access keys through your Shhed web interface:

1. Log into your Shhed dashboard
2. Navigate to "Access Keys Management"
3. Click "Create New Access Key"
4. Save your access key ID and secret key securely

### 2. Basic Usage

```javascript
const { Shhed } = require('shhed');

// Full access (can retrieve both public and private keys)
const kv = new Shhed({
  access_key: process.env.SHHED_ACCESS_KEY,
  secret_key: process.env.SHHED_SECRET_KEY,
  projectId: process.env.SHHED_PROJECT_ID
});

// Public access only (can only retrieve public keys)
const kvPublic = new Shhed({
  access_key: process.env.SHHED_ACCESS_KEY,
  projectId: process.env.SHHED_PROJECT_ID
});

// Get an API key
const stripeKey = await kv.get('STRIPE_API_KEY');
console.log('Stripe API Key:', stripeKey);
```

### 3. TypeScript Usage

```typescript
import { Shhed, ShhedConfig } from 'shhed';

const config: ShhedConfig = {
  access_key: process.env.SHHED_ACCESS_KEY!,
  secret_key: process.env.SHHED_SECRET_KEY!,
  projectId: process.env.SHHED_PROJECT_ID!
};

const kv = new Shhed(config);

try {
  const openaiKey = await kv.get('OPENAI_API_KEY');
  console.log('OpenAI Key loaded:', openaiKey.substring(0, 8) + '...');
} catch (error) {
  console.error('Failed to load key:', error.message);
}
```

## 📖 API Reference

### Shhed Class

#### Constructor

```typescript
new Shhed(config: ShhedConfig)
```

Creates a new Shhed instance with the provided configuration.

**Parameters:**
- `config` - Configuration object containing:
  - `access_key` (string): Your Shhed access key (starts with "ak_")
  - `secret_key` (string, optional): Your Shhed secret key. If provided, enables access to both public and private keys. If omitted, only public keys can be accessed.
  - `projectId` (string): Your project ID (numeric or name-based)
  - `endpoint` (string, optional): Custom API endpoint URL (defaults to production)

**Example:**
```javascript
// Full access
const kv = new Shhed({
  access_key: 'ak_abc123',
  secret_key: 'def456',
  projectId: 'my-project'
  // endpoint: 'http://localhost:8000' // Optional: for development only
});

// Public access only
const kvPublic = new Shhed({
  access_key: 'ak_abc123',
  projectId: 'my-project'
});
```

#### Methods

##### `get(keyName: string): Promise<string>`

Retrieves an API key value by name.

**Parameters:**
- `keyName` (string): The name of the API key to retrieve

**Returns:**
- `Promise<string>`: The API key value

**Throws:**
- `ShhedSDKError`: When the request fails or key is not found

**Example:**
```javascript
const apiKey = await kv.get('STRIPE_API_KEY');
```

##### `test(): Promise<boolean>`

Tests the connection to Shhed by calling the health endpoint.

**Returns:**
- `Promise<boolean>`: True if connection is successful

**Throws:**
- `ShhedSDKError`: When the connection test fails

**Example:**
```javascript
const isConnected = await kv.test();
console.log('Connected:', isConnected);
```

### Types

#### ShhedConfig

```typescript
interface ShhedConfig {
  access_key: string;   // Shhed access key (starts with "ak_")
  secret_key?: string;  // Shhed secret key (optional, for full access)
  projectId: string;    // Project ID
  endpoint?: string;    // API endpoint URL (optional, defaults to production)
}
```

#### ShhedSDKError

```typescript
class ShhedSDKError extends Error {
  statusCode: number;    // HTTP status code (0 for network errors)
  response?: object;     // API error response (if available)
}
```

## 🔒 Authentication

The SDK uses access keys for authentication with two modes:

### Full Access (Private + Public Keys)
When both `access_key` and `secret_key` are provided, you can access both public and private keys:

```javascript
const kv = new Shhed({
  access_key: 'ak_PnPiytCF_Oszt6xWjanVoUmfFj5GAepx',
  secret_key: 'kmP7zCwwHvnp4FWDj6i6ZpbeXeH8EHmDQfLVirhjDww=',
  projectId: 'my-project'
});
```

### Public Access Only (Public Keys Only)
When only `access_key` is provided, you can only access keys marked as public:

```javascript
const kv = new Shhed({
  access_key: 'ak_PnPiytCF_Oszt6xWjanVoUmfFj5GAepx',
  projectId: 'my-project'
});
```

### Environment Variables

For security, store your credentials in environment variables:

```bash
export SHHED_ACCESS_KEY="ak_your_access_key"
export SHHED_SECRET_KEY="your_secret_key"  # Optional: for full access
export SHHED_PROJECT_ID="your_project_id"
# export SHHED_ENDPOINT="http://localhost:8000"  # Optional: for development only
```

## 📁 Project ID Format

The `projectId` can be specified in multiple formats:

- **Numeric ID**: `"123"`
- **With prefix**: `"proj_123"`
- **Project name**: `"my-project-name"`

All formats are automatically handled by the SDK.

## 🛠️ Advanced Usage

### Error Handling

```javascript
import { Shhed, ShhedSDKError } from 'shhed';

try {
  const key = await kv.get('API_KEY');
} catch (error) {
  if (error instanceof ShhedSDKError) {
    console.error(`API Error (${error.statusCode}): ${error.message}`);
    
    switch (error.statusCode) {
      case 401:
      case 403:
        console.error('Authentication failed');
        break;
      case 404:
        console.error('Key or project not found');
        break;
      default:
        console.error('Server error');
    }
  } else {
    console.error('Unexpected error:', error.message);
  }
}
```

### Retry Logic

```javascript
async function getKeyWithRetry(kv, keyName, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await kv.get(keyName);
    } catch (error) {
      if (error.statusCode === 404 || error.statusCode === 401) {
        throw error; // Don't retry on client errors
      }
      
      if (attempt === maxRetries) throw error;
      
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

### Loading Multiple Keys

```javascript
async function loadAllKeys(kv) {
  const keyNames = ['STRIPE_KEY', 'OPENAI_KEY', 'DATABASE_URL'];
  
  const results = await Promise.allSettled(
    keyNames.map(name => kv.get(name))
  );
  
  const keys = {};
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      keys[keyNames[index]] = result.value;
    } else {
      console.error(`Failed to load ${keyNames[index]}:`, result.reason);
    }
  });
  
  return keys;
}
```

## 🌐 Framework Integration

### Express.js

```javascript
const express = require('express');
const { Shhed } = require('shhed');

const app = express();
const kv = new Shhed({
  token: process.env.SHHED_TOKEN,
  projectId: process.env.SHHED_PROJECT_ID
});

app.get('/api/config', async (req, res) => {
  try {
    const dbUrl = await kv.get('DATABASE_URL');
    // Use the database URL...
    res.json({ status: 'configured' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### Next.js

```javascript
// lib/shhed.js
import { Shhed } from 'shhed';

export const kv = new Shhed({
  token: process.env.SHHED_TOKEN,
  projectId: process.env.SHHED_PROJECT_ID
});

// pages/api/payment.js
import { kv } from '../../lib/shhed';

export default async function handler(req, res) {
  const stripeKey = await kv.get('STRIPE_API_KEY');
  // Process payment with Stripe...
}
```

## 📊 Examples

Check out the `examples/` directory for complete working examples:

- **[basic-usage.js](./examples/basic-usage.js)** - Simple JavaScript usage
- **[typescript-usage.ts](./examples/typescript-usage.ts)** - Advanced TypeScript example
- **[express-integration.js](./examples/express-integration.js)** - Express.js integration

## 🧪 Testing

The SDK includes comprehensive tests. To run them:

```bash
cd sdk
npm install
npm test
```

For test coverage:

```bash
npm run test -- --coverage
```

## 🏗️ Building

To build the SDK from source:

```bash
npm install
npm run build
```

This creates both CommonJS and ESM builds in the `dist/` directory.

## 📝 License

MIT License - see [LICENSE](./LICENSE) for details.

## 🆘 Support

- **Documentation**: [Shhed Docs](https://docs.shhed.io)
- **Issues**: [GitHub Issues](https://github.com/your-org/shhed/issues)
- **Support**: support@shhed.io

## 🔄 Migration from Direct API Calls

If you're currently using direct HTTP requests to the Shhed API, migration is simple:

**Before (direct API call):**
```javascript
const response = await fetch(`${endpoint}/v1/keys/${keyName}`, {
  headers: {
    'Authorization': `Bearer ${accessKey}:${secretKey}`,
    'X-Project-ID': projectId
  }
});
const data = await response.json();
const keyValue = data.key_value;
```

**After (using SDK):**
```javascript
const kv = new Shhed({
  token: `${accessKey}:${secretKey}`,
  projectId: projectId
});
const keyValue = await kv.get(keyName);
```

## 🚀 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request 