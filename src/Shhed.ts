import fetch from 'cross-fetch';
import { ShhedConfig, ShhedResponse, ShhedError, ShhedSDKError } from './types';

/**
 * Shhed SDK for programmatic access to your API keys
 * 
 * @example
 * ```typescript
 * // Full access (public and private keys)
 * const kv = new Shhed({
 *   access_key: process.env.KV_ACCESS_KEY,
 *   secret_key: process.env.KV_SECRET_KEY,
 *   projectId: process.env.KV_PROJECT
 * });
 * 
 * // Public access only
 * const kvPublic = new Shhed({
 *   access_key: process.env.KV_ACCESS_KEY,
 *   projectId: process.env.KV_PROJECT
 * });
 * 
 * const stripeKey = await kv.get('STRIPE_API_KEY');
 * ```
 */
export class Shhed {
  private readonly config: ShhedConfig;
  private readonly endpoint: string;

  /**
   * Create a new Shhed SDK instance
   * 
   * @param config - Configuration options for the SDK
   */
  constructor(config: ShhedConfig) {
    this.validateConfig(config);
    this.config = config;
    this.endpoint = config.endpoint || 'https://api.shhed.io';
  }

  /**
   * Validate the configuration provided to the SDK
   */
  private validateConfig(config: ShhedConfig): void {
    if (!config.access_key) {
      throw new Error('Shhed access_key is required');
    }

    if (!config.projectId) {
      throw new Error('Shhed projectId is required');
    }

    // Validate access key format
    if (!config.access_key.startsWith('ak_')) {
      throw new Error('Shhed access_key must start with "ak_"');
    }

    // Validate endpoint URL format if provided
    if (config.endpoint) {
      try {
        new URL(config.endpoint);
      } catch {
        throw new Error('Shhed endpoint must be a valid URL');
      }
    }
  }

  /**
   * Get an API key value by name
   * 
   * @param keyName - The name of the API key to retrieve
   * @returns Promise that resolves to the API key value
   * 
   * @example
   * ```typescript
   * const stripeKey = await kv.get('STRIPE_API_KEY');
   * const openaiKey = await kv.get('OPENAI_API_KEY');
   * ```
   * 
   * @throws {ShhedSDKError} When the API request fails or key is not found
   */
  async get(keyName: string): Promise<string> {
    if (!keyName) {
      throw new Error('Key name is required');
    }

    const url = `${this.endpoint.replace(/\/$/, '')}/v1/keys/${encodeURIComponent(keyName)}`;
    
    // Generate authorization token based on available keys
    const authToken = this.config.secret_key 
      ? `${this.config.access_key}:${this.config.secret_key}`
      : this.config.access_key;

    const headers = {
      'Authorization': `Bearer ${authToken}`,
      'X-Project-ID': this.config.projectId,
      'Content-Type': 'application/json'
    };

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers
      });

      const responseData = await response.json();

      if (!response.ok) {
        const error = responseData as ShhedError;
        throw new ShhedSDKError(
          error.detail || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          error
        );
      }

      const keyData = responseData as ShhedResponse;
      return keyData.key_value;

    } catch (error) {
      if (error instanceof ShhedSDKError) {
        throw error;
      }

      // Handle network errors or other unexpected errors
      if (error instanceof Error) {
        throw new ShhedSDKError(
          `Failed to fetch key "${keyName}": ${error.message}`,
          0
        );
      }

      throw new ShhedSDKError(
        `Failed to fetch key "${keyName}": Unknown error`,
        0
      );
    }
  }

  /**
   * Test the connection to Shhed by attempting to fetch a health endpoint
   * 
   * @returns Promise that resolves to true if connection is successful
   * @throws {ShhedSDKError} When the connection test fails
   */
  async test(): Promise<boolean> {
    const url = `${this.endpoint.replace(/\/$/, '')}/health`;
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new ShhedSDKError(
          `Health check failed: HTTP ${response.status}`,
          response.status
        );
      }

      return true;

    } catch (error) {
      if (error instanceof ShhedSDKError) {
        throw error;
      }

      throw new ShhedSDKError(
        `Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        0
      );
    }
  }
} 