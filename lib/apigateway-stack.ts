import { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib';
import * as apigatewayv2 from 'aws-cdk-lib/aws-apigatewayv2';

import { ApiGatewayStackProps } from '../interfaces';
import {
  getCdkFromCustomProps,
  getAuthorizerArn,
  getResourceNameWithPrefix
} from '../utils';

export class ApiGatewayStack extends cdk.Stack {
  public httpApi: apigatewayv2.CfnApi;
  public httpAuthorizer: apigatewayv2.CfnAuthorizer;
  public domainName: apigatewayv2.CfnDomainName;

  constructor(scope: Construct, id: string, props: ApiGatewayStackProps) {
    super(scope, id, getCdkFromCustomProps(props));

    this.createDomainName(props);
    this.createHttpApi(props);
    this.createHttpAuthorizer(props);
  }

  private createDomainName(props: ApiGatewayStackProps) {
    const subdomainName = 'martin-training-pet.alegra.com';
    this.domainName = new apigatewayv2.CfnDomainName(this, 'DomainName', {
      domainName: subdomainName,
      domainNameConfigurations: [
        {
          certificateArn: props.stacks.domain.certificate.certificateArn,
          endpointType: 'regional',
          securityPolicy: 'TLS_1_2'
        }
      ]
    });

    new cdk.CfnOutput(this, 'OutputApiUrl', {
      value: `https://${subdomainName}/v1`,
      exportName: 'ApiGatewayUrl'
    });
  }

  private createHttpApi(props: ApiGatewayStackProps) {
    this.httpApi = new apigatewayv2.CfnApi(this, 'HttpApi', {
      name: 'pets-http-api',
      protocolType: 'HTTP',
      corsConfiguration: {
        allowCredentials: false,
        allowHeaders: ['*'],
        allowMethods: ['*'],
        allowOrigins: ['*']
      }
    });

    new apigatewayv2.CfnStage(this, 'DefaultStage', {
      apiId: this.httpApi.ref,
      stageName: 'mystage',
      autoDeploy: true
    });

    new apigatewayv2.CfnApiMapping(this, 'ApiMapping', {
      apiId: this.httpApi.ref,
      domainName: this.domainName.domainName,
      stage: 'mystage',
      apiMappingKey: 'v1'
    });

    new cdk.CfnOutput(this, 'OutputHttpApiId', {
      value: this.httpApi.ref,
      exportName: 'pets-api-id'
    });
  }

  private createHttpAuthorizer(props: ApiGatewayStackProps) {
    this.httpAuthorizer = new apigatewayv2.CfnAuthorizer(
      this,
      'ApiTrainingAuthorizer',
      {
        apiId: this.httpApi.ref,
        identitySource: ['$request.header.Authorization'],
        authorizerType: 'REQUEST',
        name: 'apiTrainingAuthorizer',
        authorizerUri: `arn:aws:apigateway:${
          props.region
        }:lambda:path/2015-03-31/functions/${getAuthorizerArn(
          props.env
        )}/invocations`,
        enableSimpleResponses: false,
        authorizerPayloadFormatVersion: '2.0',
        authorizerResultTtlInSeconds: 300
      }
    );

    new cdk.CfnOutput(this, 'OutputHttpAuthorizerId', {
      value: this.httpAuthorizer.ref,
      exportName: 'api-authorizer-id'
    });
  }
}
