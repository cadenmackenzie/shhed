/**
 * Configuration options for the Shhed SDK
 */
export interface ShhedConfig {
  /** 
   * Access key ID for authentication
   * Example: "ak_AbCdEfGhIjKlMnOpQrStUvWxYz123456"
   */
  access_key: string;
  
  /** 
   * Secret key for full access (optional)
   * If provided, enables access to both public and private keys
   * If not provided, only public keys can be accessed
   * Example: "dGhpc2lzYXNlY3JldGtleWV4YW1wbGU="
   */
  secret_key?: string;
  
  /** 
   * Project ID - can be numeric ID or project name
   * Examples: "123", "proj_123", "my-project"
   */
  projectId: string;
  
  /** 
   * API endpoint URL (optional - defaults to production endpoint)
   * Only specify this for development/testing purposes
   * Example: "http://localhost:8000"
   */
  endpoint?: string;
}

/**
 * Response from the Shhed API when fetching a key
 */
export interface ShhedResponse {
  key_name: string;
  key_value: string;
  project_id: string;
}

/**
 * Error response from the Shhed API
 */
export interface ShhedError {
  detail: string;
}

/**
 * Custom error class for Shhed SDK errors
 */
export class ShhedSDKError extends Error {
  public readonly statusCode: number;
  public readonly response?: ShhedError;

  constructor(message: string, statusCode: number, response?: ShhedError) {
    super(message);
    this.name = 'ShhedSDKError';
    this.statusCode = statusCode;
    this.response = response;
  }
} 