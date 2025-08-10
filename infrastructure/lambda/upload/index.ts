import { randomUUID } from 'node:crypto';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
  type Input,
  integer,
  maxLength,
  maxValue,
  minLength,
  minValue,
  number,
  object,
  parse,
  picklist,
  string,
} from 'valibot';

if (
  !process.env.AWS_REGION ||
  !process.env.S3_UPLOADS_BUCKET ||
  !process.env.ALLOWED_ORIGINS
) {
  throw new Error(
    'Missing required environment variables: AWS_REGION, S3_UPLOADS_BUCKET, ALLOWED_ORIGINS'
  );
}

const FILE_SIZE_LIMITS = {
  MAX_SIZE: 100 * 1024 * 1024, // 100MB
  PRESIGNED_URL_EXPIRY: 3600, // 1 hour
} as const;

const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/mpeg',
  'video/quicktime',
  'video/x-msvideo',
  'video/webm',
] as const;

const s3Client = new S3Client({ region: process.env.AWS_REGION });

// Valibot schemas
const UploadRequestSchema = object({
  filename: string([
    minLength(1, 'Filename cannot be empty'),
    maxLength(500, 'Filename too long (max 500 characters)'),
  ]),
  contentType: picklist(
    ALLOWED_VIDEO_TYPES,
    `Unsupported video format. Allowed: ${ALLOWED_VIDEO_TYPES.join(', ')}`
  ),
  fileSize: number([
    integer('File size must be an integer'),
    minValue(1, 'File size must be greater than 0'),
    maxValue(FILE_SIZE_LIMITS.MAX_SIZE, 'File size cannot exceed 100MB'),
  ]),
});

export type UploadRequest = Input<typeof UploadRequestSchema>;

export interface UploadResponse {
  uploadId: string;
  presignedUrl: string;
  fields?: Record<string, string>;
}

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log('Upload request initiated', {
    method: event.httpMethod,
    userAgent: event.headers['User-Agent'],
    sourceIp: event.requestContext?.identity?.sourceIp,
    timestamp: new Date().toISOString(),
  });

  try {
    const corsHeaders = {
      'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGINS as string,
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      'Access-Control-Allow-Methods': 'POST,OPTIONS',
    };

    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: '',
      };
    }

    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Method not allowed' }),
      };
    }

    if (!event.body) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Request body is required' }),
      };
    }

    let requestData: unknown;
    try {
      requestData = JSON.parse(event.body);
    } catch (parseError) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Invalid JSON in request body' }),
      };
    }

    // Validate with Valibot
    let validatedData: UploadRequest;
    try {
      validatedData = parse(UploadRequestSchema, requestData);
    } catch (validationError: unknown) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'Validation failed',
          details:
            validationError instanceof Error
              ? validationError.message
              : 'Invalid request data',
        }),
      };
    }

    const { filename, contentType, fileSize } = validatedData;

    const sanitizeFilename = (filename: string): string => {
      const sanitized = filename
        .trim()
        .replace(/[^a-zA-Z0-9.-]/g, '_')
        .replace(/_{2,}/g, '_')
        .replace(/^[._]+|[._]+$/g, '')
        .substring(0, 255);

      return sanitized || 'unnamed_file';
    };

    const sanitizedFilename = sanitizeFilename(filename);

    const uploadId = randomUUID();
    const key = `uploads/${uploadId}/${sanitizedFilename}`;

    // Create presigned URL for direct upload to S3
    const command = new PutObjectCommand({
      Bucket: process.env.S3_UPLOADS_BUCKET,
      Key: key,
      ContentType: contentType,
      ContentLength: fileSize,
      ServerSideEncryption: 'AES256',
      Metadata: {
        'upload-id': uploadId,
        'original-filename': filename,
        'sanitized-filename': sanitizedFilename,
        'content-type': contentType,
        'file-size': fileSize.toString(),
        'upload-timestamp': new Date().toISOString(),
        'user-agent': event.headers['User-Agent'] || 'unknown',
      },
    });

    const presignedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: FILE_SIZE_LIMITS.PRESIGNED_URL_EXPIRY,
    });

    console.log('Presigned URL created', {
      uploadId,
      filename: sanitizedFilename,
      contentType,
      fileSize,
      bucket: process.env.S3_UPLOADS_BUCKET,
      expiresIn: FILE_SIZE_LIMITS.PRESIGNED_URL_EXPIRY,
    });

    const response: UploadResponse = {
      uploadId,
      presignedUrl,
    };

    return {
      statusCode: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(response),
    };
  } catch (error) {
    console.error('Upload initiation error:', {
      error:
        error instanceof Error
          ? {
              name: error.name,
              message: error.message,
              stack:
                process.env.NODE_ENV !== 'production' ? error.stack : undefined,
            }
          : error,
      timestamp: new Date().toISOString(),
    });

    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGINS as string,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        error: 'Internal server error',
        message:
          process.env.NODE_ENV === 'production'
            ? 'Something went wrong'
            : error instanceof Error
              ? error.message
              : 'Unknown error',
        timestamp: new Date().toISOString(),
      }),
    };
  }
};
