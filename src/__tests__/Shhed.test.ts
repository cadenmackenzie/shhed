import { Shhed, ShhedSDKError } from '../index';

// Mock cross-fetch
jest.mock('cross-fetch');
const mockFetch = require('cross-fetch') as jest.MockedFunction<typeof fetch>;

describe('Shhed', () => {
  const validConfig = {
    access_key: 'ak_test123',
    secret_key: 'secret123',
    projectId: 'test-project'
  };

  const publicConfig = {
    access_key: 'ak_test123',
    projectId: 'test-project'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create instance with valid config', () => {
      expect(() => new Shhed(validConfig)).not.toThrow();
    });

    it('should use default endpoint when none provided', () => {
      const kv = new Shhed(validConfig);
      expect(kv).toBeDefined();
    });

    it('should accept custom endpoint when provided', () => {
      const configWithEndpoint = {
        ...validConfig,
        endpoint: 'http://localhost:8000'
      };
      expect(() => new Shhed(configWithEndpoint)).not.toThrow();
    });

    it('should throw error if access_key is missing', () => {
      expect(() => new Shhed({
        ...validConfig,
        access_key: ''
      })).toThrow('Shhed access_key is required');
    });

    it('should throw error if projectId is missing', () => {
      expect(() => new Shhed({
        ...validConfig,
        projectId: ''
      })).toThrow('Shhed projectId is required');
    });



    it('should throw error if access_key format is invalid', () => {
      expect(() => new Shhed({
        ...validConfig,
        access_key: 'invalid-access-key-format'
      })).toThrow('Shhed access_key must start with "ak_"');
    });

    it('should throw error if endpoint URL is invalid', () => {
      expect(() => new Shhed({
        ...validConfig,
        endpoint: 'invalid-url'
      })).toThrow('Shhed endpoint must be a valid URL');
    });
  });

  describe('get', () => {
    let shhed: Shhed;

    beforeEach(() => {
      shhed = new Shhed(validConfig);
    });

    it('should successfully get a key value', async () => {
      const mockResponse = {
        key_name: 'TEST_KEY',
        key_value: 'secret-value',
        project_id: 'test-project'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await shhed.get('TEST_KEY');
      
      expect(result).toBe('secret-value');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.shhed.io/v1/keys/TEST_KEY',
        {
          method: 'GET',
          headers: {
            'Authorization': 'Bearer ak_test123:secret123',
            'X-Project-ID': 'test-project',
            'Content-Type': 'application/json'
          }
        }
      );
    });

    it('should throw error for empty key name', async () => {
      await expect(shhed.get('')).rejects.toThrow('Key name is required');
    });

    it('should handle API error responses', async () => {
      const errorResponse = { detail: 'API key not found' };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => errorResponse,
      } as Response);

      await expect(shhed.get('MISSING_KEY')).rejects.toThrow(ShhedSDKError);
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(shhed.get('TEST_KEY')).rejects.toThrow(ShhedSDKError);
    });

    it('should URL encode key names', async () => {
      const mockResponse = {
        key_name: 'KEY WITH SPACES',
        key_value: 'secret-value',
        project_id: 'test-project'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      await shhed.get('KEY WITH SPACES');
      
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.shhed.io/v1/keys/KEY%20WITH%20SPACES',
        expect.any(Object)
      );
    });
  });

  describe('test', () => {
    let shhed: Shhed;

    beforeEach(() => {
      shhed = new Shhed(validConfig);
    });

    it('should return true for successful health check', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'healthy' }),
      } as Response);

      const result = await shhed.test();
      
      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.shhed.io/health',
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    });

    it('should throw error for failed health check', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as Response);

      await expect(shhed.test()).rejects.toThrow(ShhedSDKError);
    });
  });
}); 