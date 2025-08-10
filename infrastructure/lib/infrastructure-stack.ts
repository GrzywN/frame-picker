import * as cdk from 'aws-cdk-lib';
import type { Construct } from 'constructs';
import { getConfig } from './config';
import { ApiInfrastructure } from './constructs/api-infrastructure';
import { FrontendInfrastructure } from './constructs/frontend-infrastructure';
import { UploadInfrastructure } from './constructs/upload-infrastructure';

export interface InfrastructureStackProps extends cdk.StackProps {
  environment?: 'development' | 'staging' | 'production';
}

export class InfrastructureStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: InfrastructureStackProps) {
    super(scope, id, props);

    // Get configuration based on environment
    const config = getConfig(props?.environment);

    // Frontend infrastructure (S3 + CloudFront)
    const frontend = new FrontendInfrastructure(this, 'Frontend', {
      environment: config.environment,
    });

    // API Gateway infrastructure
    const api = new ApiInfrastructure(this, 'Api', {
      allowedOrigins: config.allowedOrigins,
      environment: config.environment,
    });

    // Upload infrastructure (S3 + Lambda)
    const upload = new UploadInfrastructure(this, 'Upload', {
      allowedOrigins: config.allowedOrigins,
      environment: config.environment,
    });

    // Connect upload endpoints to API
    upload.addToApi(api.api);

    // Stack outputs
    new cdk.CfnOutput(this, 'Environment', {
      value: config.environment,
      description: 'Deployment environment',
    });

    new cdk.CfnOutput(this, 'FrontendUrl', {
      value: `https://${frontend.distribution.distributionDomainName}`,
      description: 'Frame Picker Frontend URL',
    });

    new cdk.CfnOutput(this, 'DistributionId', {
      value: frontend.distribution.distributionId,
      description: 'CloudFront Distribution ID',
    });

    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.api.url,
      description: 'Frame Picker API URL',
    });

    new cdk.CfnOutput(this, 'UploadEndpoint', {
      value: `${api.api.url}api/upload`,
      description: 'Upload initiation endpoint',
    });

    new cdk.CfnOutput(this, 'UploadsBucket', {
      value: upload.uploadsBucket.bucketName,
      description: 'S3 bucket for video uploads',
    });
  }
}
