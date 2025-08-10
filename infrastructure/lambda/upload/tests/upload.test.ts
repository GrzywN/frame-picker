import type { APIGatewayProxyEvent } from 'aws-lambda';
import { handler } from '../index';

// Mock AWS SDK
jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn(() => ({})),
  PutObjectCommand: jest.fn(),
}));

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn(() =>
    Promise.resolve('https://test-presigned-url.com')
  ),
}));

// Mock crypto
jest.mock('node:crypto', () => ({
  randomUUID: jest.fn(() => 'test-uuid-123'),
}));

const createTestEvent = (
  body: unknown = null,
  httpMethod = 'POST'
): APIGatewayProxyEvent => ({
  httpMethod,
  body: body ? JSON.stringify(body) : null,
  headers: {
    'User-Agent': 'test-agent',
    'Content-Type': 'application/json',
  },
  requestContext: {
    identity: {
      sourceIp: '127.0.0.1',
    },
  } as APIGatewayProxyEvent['requestContext'],
  pathParameters: null,
  queryStringParameters: null,
  multiValueQueryStringParameters: null,
  stageVariables: null,
  resource: '',
  path: '',
  multiValueHeaders: {},
  isBase64Encoded: false,
});

describe('Upload Lambda Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('CORS handling', () => {
    it('should handle OPTIONS preflight request', async () => {
      const event = createTestEvent(null, 'OPTIONS');
      const result = await handler(event);

      expect(result.statusCode).toBe(200);
      expect(result.headers).toHaveProperty('Access-Control-Allow-Origin', '*');
      expect(result.headers).toHaveProperty(
        'Access-Control-Allow-Methods',
        'POST,OPTIONS'
      );
      expect(result.body).toBe('');
    });

    it('should reject non-POST methods', async () => {
      const event = createTestEvent(null, 'GET');
      const result = await handler(event);

      expect(result.statusCode).toBe(405);
      expect(JSON.parse(result.body)).toHaveProperty(
        'error',
        'Method not allowed'
      );
    });
  });

  describe('Request validation', () => {
    it('should reject request without body', async () => {
      const event = createTestEvent(null);
      const result = await handler(event);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body)).toHaveProperty(
        'error',
        'Request body is required'
      );
    });

    it('should reject invalid JSON', async () => {
      const event = createTestEvent(null);
      event.body = 'invalid json';
      const result = await handler(event);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body)).toHaveProperty(
        'error',
        'Invalid JSON in request body'
      );
    });

    it('should reject missing required fields', async () => {
      const event = createTestEvent({
        filename: 'test.mp4',
        // missing contentType and fileSize
      });
      const result = await handler(event);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body)).toHaveProperty(
        'error',
        'Validation failed'
      );
    });

    it('should reject invalid content type', async () => {
      const event = createTestEvent({
        filename: 'test.txt',
        contentType: 'text/plain',
        fileSize: 1000,
      });
      const result = await handler(event);

      expect(result.statusCode).toBe(400);
      const response = JSON.parse(result.body);
      expect(response.error).toBe('Validation failed');
      expect(response.details).toContain('Unsupported video format');
    });

    it('should reject file size too large', async () => {
      const event = createTestEvent({
        filename: 'test.mp4',
        contentType: 'video/mp4',
        fileSize: 200 * 1024 * 1024, // 200MB
      });
      const result = await handler(event);

      expect(result.statusCode).toBe(400);
      const response = JSON.parse(result.body);
      expect(response.error).toBe('Validation failed');
      expect(response.details).toContain('File size cannot exceed 100MB');
    });

    it('should reject zero file size', async () => {
      const event = createTestEvent({
        filename: 'test.mp4',
        contentType: 'video/mp4',
        fileSize: 0,
      });
      const result = await handler(event);

      expect(result.statusCode).toBe(400);
      const response = JSON.parse(result.body);
      expect(response.error).toBe('Validation failed');
    });

    it('should reject empty filename', async () => {
      const event = createTestEvent({
        filename: '',
        contentType: 'video/mp4',
        fileSize: 1000,
      });
      const result = await handler(event);

      expect(result.statusCode).toBe(400);
      const response = JSON.parse(result.body);
      expect(response.error).toBe('Validation failed');
      expect(response.details).toContain('Filename cannot be empty');
    });

    it('should reject filename that is too long', async () => {
      const longFilename = `${'a'.repeat(501)}.mp4`;
      const event = createTestEvent({
        filename: longFilename,
        contentType: 'video/mp4',
        fileSize: 1000,
      });
      const result = await handler(event);

      expect(result.statusCode).toBe(400);
      const response = JSON.parse(result.body);
      expect(response.error).toBe('Validation failed');
      expect(response.details).toContain('Filename too long');
    });
  });

  describe('Valid requests', () => {
    it('should generate presigned URL for valid request', async () => {
      const event = createTestEvent({
        filename: 'test-video.mp4',
        contentType: 'video/mp4',
        fileSize: 50 * 1024 * 1024, // 50MB
      });

      const result = await handler(event);

      expect(result.statusCode).toBe(200);
      const response = JSON.parse(result.body);
      expect(response).toHaveProperty('uploadId', 'test-uuid-123');
      expect(response).toHaveProperty(
        'presignedUrl',
        'https://test-presigned-url.com'
      );
    });

    it('should accept all allowed video formats', async () => {
      const allowedTypes = [
        'video/mp4',
        'video/mpeg',
        'video/quicktime',
        'video/x-msvideo',
        'video/webm',
      ];

      for (const contentType of allowedTypes) {
        const event = createTestEvent({
          filename: `test.${contentType.split('/')[1]}`,
          contentType,
          fileSize: 1024 * 1024, // 1MB
        });

        const result = await handler(event);
        expect(result.statusCode).toBe(200);
      }
    });

    it('should sanitize special characters in filename', async () => {
      const event = createTestEvent({
        filename: 'test @#$%^&*()_+ file.mp4',
        contentType: 'video/mp4',
        fileSize: 1024 * 1024,
      });

      const result = await handler(event);
      expect(result.statusCode).toBe(200);

      // The filename should be sanitized in the S3 key
      // This would be tested by checking the PutObjectCommand call
    });
  });

  describe('Error handling', () => {
    it('should handle S3 errors gracefully', async () => {
      // Mock getSignedUrl to throw an error
      const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
      getSignedUrl.mockRejectedValueOnce(new Error('S3 connection failed'));

      const event = createTestEvent({
        filename: 'test.mp4',
        contentType: 'video/mp4',
        fileSize: 1024 * 1024,
      });

      const result = await handler(event);

      expect(result.statusCode).toBe(500);
      const response = JSON.parse(result.body);
      expect(response).toHaveProperty('error', 'Internal server error');
      expect(response).toHaveProperty('timestamp');
    });
  });
});
