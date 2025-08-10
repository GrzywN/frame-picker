import * as cdk from 'aws-cdk-lib';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import { Construct } from 'constructs';

export interface FrontendInfrastructureProps {
  environment: 'development' | 'staging' | 'production';
}

export class FrontendInfrastructure extends Construct {
  public readonly websiteBucket: s3.Bucket;
  public readonly distribution: cloudfront.Distribution;

  constructor(
    scope: Construct,
    id: string,
    props: FrontendInfrastructureProps
  ) {
    super(scope, id);

    // S3 bucket for hosting the frontend
    this.websiteBucket = new s3.Bucket(this, 'WebsiteBucket', {
      bucketName: `frame-picker-frontend-${cdk.Aws.ACCOUNT_ID}-${cdk.Aws.REGION}`,
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'index.html',
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy:
        props.environment === 'production'
          ? cdk.RemovalPolicy.RETAIN
          : cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: props.environment !== 'production',
    });

    // Origin Access Control for CloudFront
    const originAccessControl = new cloudfront.S3OriginAccessControl(
      this,
      'OAC'
    );

    // CloudFront distribution
    this.distribution = new cloudfront.Distribution(this, 'Distribution', {
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(
          this.websiteBucket,
          {
            originAccessControl: originAccessControl,
          }
        ),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        compress: true,
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
        },
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
        },
      ],
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
    });

    // Deploy frontend assets to S3
    new s3deploy.BucketDeployment(this, 'DeployFrontend', {
      sources: [s3deploy.Source.asset('../frontend-lite/dist')],
      destinationBucket: this.websiteBucket,
      distribution: this.distribution,
      distributionPaths: ['/*'],
    });
  }
}
