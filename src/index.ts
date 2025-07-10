/**
 * Shhed SDK for JavaScript/TypeScript
 * 
 * Official SDK for accessing Shhed API to retrieve your stored API keys
 * programmatically from applications, scripts, and CI/CD pipelines.
 * 
 * @packageDocumentation
 */

export { Shhed } from './Shhed';
export { 
  ShhedConfig, 
  ShhedResponse, 
  ShhedError, 
  ShhedSDKError 
} from './types';

// Default export for convenience
export { Shhed as default } from './Shhed'; 