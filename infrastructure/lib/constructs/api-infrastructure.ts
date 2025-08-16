import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';

export interface ApiInfrastructureProps {
  allowedOrigins: string;
  environment: 'development' | 'staging' | 'production';
}

export class ApiInfrastructure extends Construct {
  public readonly api: apigateway.RestApi;

  constructor(scope: Construct, id: string, props: ApiInfrastructureProps) {
    super(scope, id);

    // API Gateway
    this.api = new apigateway.RestApi(this, 'Api', {
      restApiName: `Frame Picker API - ${props.environment}`,
      description: 'API for Frame Picker video processing application',
      defaultCorsPreflightOptions: {
        allowOrigins:
          props.allowedOrigins === '*'
            ? apigateway.Cors.ALL_ORIGINS
            : [props.allowedOrigins],
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization'],
      },
      deployOptions: {
        stageName: props.environment,
        throttlingRateLimit: 100,
        throttlingBurstLimit: 200,
        loggingLevel: apigateway.MethodLoggingLevel.OFF,
        dataTraceEnabled: false,
        metricsEnabled: true,
      },
    });

    // Health check endpoint
    const healthResource = this.api.root.addResource('health');
    healthResource.addMethod(
      'GET',
      new apigateway.MockIntegration({
        integrationResponses: [
          {
            statusCode: '200',
            responseTemplates: {
              'application/json': JSON.stringify({
                status: 'healthy',
                timestamp: '$context.requestTime',
                environment: props.environment,
              }),
            },
          },
        ],
        requestTemplates: {
          'application/json': '{"statusCode": 200}',
        },
      }),
      {
        methodResponses: [{ statusCode: '200' }],
      }
    );
  }
}
