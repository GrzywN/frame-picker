import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export interface UploadInfrastructureProps {
  allowedOrigins: string;
  environment: 'development' | 'staging' | 'production';
}

export class UploadInfrastructure extends Construct {
  public readonly uploadsBucket: s3.Bucket;
  public readonly uploadLambda: lambda.Function;
  public readonly uploadEndpoint: string;

  constructor(scope: Construct, id: string, props: UploadInfrastructureProps) {
    super(scope, id);

    // S3 bucket for video uploads
    this.uploadsBucket = new s3.Bucket(this, 'UploadsBucket', {
      bucketName: `frame-picker-uploads-${cdk.Aws.ACCOUNT_ID}-${cdk.Aws.REGION}`,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy:
        props.environment === 'production'
          ? cdk.RemovalPolicy.RETAIN
          : cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: props.environment !== 'production',
      cors: [
        {
          allowedOrigins: [props.allowedOrigins],
          allowedMethods: [s3.HttpMethods.PUT, s3.HttpMethods.POST],
          allowedHeaders: ['*'],
          maxAge: 3600,
        },
      ],
      lifecycleRules: [
        {
          id: 'DeleteIncompleteUploads',
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(1),
        },
        {
          id: 'DeleteUploadsAfter30Days',
          expiration: cdk.Duration.days(30),
        },
      ],
    });

    // Upload Lambda function
    this.uploadLambda = new lambda.Function(this, 'UploadLambda', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('./lambda/upload/dist'),
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      environment: {
        S3_UPLOADS_BUCKET: this.uploadsBucket.bucketName,
        ALLOWED_ORIGINS: props.allowedOrigins,
        NODE_ENV: props.environment,
      },
    });

    // Grant Lambda permissions to generate presigned URLs
    this.uploadsBucket.grantPut(this.uploadLambda);
    this.uploadsBucket.grantPutAcl(this.uploadLambda);

    // Expose the upload endpoint URL (will be set by parent)
    this.uploadEndpoint = '';
  }

  public addToApi(api: apigateway.RestApi): void {
    const uploadIntegration = new apigateway.LambdaIntegration(
      this.uploadLambda
    );

    const apiResource = api.root.addResource('api');
    const uploadResource = apiResource.addResource('upload');
    uploadResource.addMethod('POST', uploadIntegration);

    // Update the endpoint URL using object property access
    Object.assign(this, { uploadEndpoint: `${api.url}api/upload` });
  }
}
