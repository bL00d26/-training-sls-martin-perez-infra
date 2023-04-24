import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as certmgr from 'aws-cdk-lib/aws-certificatemanager';
import { Construct } from 'constructs';
import { LambdaIntegration } from 'aws-cdk-lib/aws-apigateway';
export class AppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const domainName = 'alegra.com';
    const subdomainName = 'martin-training-pets.alegra.com';

    const hostedZone = route53.HostedZone.fromLookup(this, 'HostedZone', {
      domainName: domainName
    });

    const certificate = new certmgr.Certificate(this, 'ApiGatewayCertificate', {
      domainName: subdomainName,
      validation: certmgr.CertificateValidation.fromDns(hostedZone)
    });

    const bucket = new s3.Bucket(this, 'RequestDataBucket');

    const topic = new sns.Topic(this, 'PetHappyTopic');
    topic.addSubscription(
      new subscriptions.EmailSubscription('german.sosa@alegra.com')
    );

    const api = new apigateway.RestApi(this, 'PetsApi', {
      endpointTypes: [apigateway.EndpointType.REGIONAL]
    });

    const authorizerFunction = lambda.Function.fromFunctionArn(
      this,
      'AuthorizerFunction',
      'arn:aws:lambda:us-east-1:175749225105:function:training-sls-back-dev-authorizer'
    );

    const authorizer = new apigateway.TokenAuthorizer(
      this,
      'PetsApiAuthorizer',
      {
        handler: authorizerFunction
      }
    );

    const helloLambda = lambda.Function.fromFunctionArn(
      this,
      'HelloLambda',
      'arn:aws:lambda:us-east-1:175749225105:function:training-sls-back-dev-hello'
    );

    const helloResource = api.root.addResource('hello');
    helloResource.addMethod('GET', new LambdaIntegration(helloLambda), {
      authorizer
    });

    const customDomain = new apigateway.DomainName(this, 'CustomDomain', {
      domainName: subdomainName,
      certificate: certificate,
      endpointType: apigateway.EndpointType.REGIONAL
    });

    customDomain.addBasePathMapping(api);

    new route53.ARecord(this, 'AliasRecord', {
      zone: hostedZone,
      recordName: subdomainName,
      target: route53.RecordTarget.fromAlias(
        new cdk.aws_route53_targets.ApiGatewayDomain(customDomain)
      )
    });
    new cdk.CfnOutput(this, 'RequestDataBucketName', {
      value: bucket.bucketName
    });
    new cdk.CfnOutput(this, 'PetHappyTopicArn', { value: topic.topicArn });
    new cdk.CfnOutput(this, 'PetsApiUrl', { value: api.url });
  }
}
