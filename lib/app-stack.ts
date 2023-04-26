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

    //Domain and subdomain
    const domainName = 'alegra.com';
    const subdomainName = 'martin-training-pets.alegra.com';

    const hostedZone = route53.HostedZone.fromLookup(this, 'HostedZone', {
      domainName: domainName
    });

    const certificate = new certmgr.Certificate(this, 'ApiGatewayCertificate', {
      domainName: subdomainName,
      validation: certmgr.CertificateValidation.fromDns(hostedZone)
    });

    //S3 bucket
    const bucket = new s3.Bucket(this, 'RequestDataBucket');

    //SNS Topic and subscription
    const topic = new sns.Topic(this, 'PetHappyTopic');
    topic.addSubscription(
      new subscriptions.EmailSubscription('german.sosa@alegra.com')
    );

    //API Gateway
    const api = new apigateway.RestApi(this, 'PetsApi', {
      endpointTypes: [apigateway.EndpointType.REGIONAL]
    });

    //API authorizer {authorization:'test'}
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

    //Database lambdas
    const syncDbLambda = lambda.Function.fromFunctionArn(
      this,
      'SyncDbLambda',
      'arn:aws:lambda:us-east-1:175749225105:function:training-sls-back-dev-hello'
    );

    //Database Endpoint
    const databaseResource = api.root.addResource('database');
    databaseResource.addMethod('GET', new LambdaIntegration(syncDbLambda), {
      authorizer
    });

    //Foundation lambdas
    const createFoundationLambda = lambda.Function.fromFunctionArn(
      this,
      'CreateFoundationLambda',
      'arn:aws:lambda:us-east-1:175749225105:function:training-sls-back-dev-createFoundation'
    );
    const getFoundationPetsLambda = lambda.Function.fromFunctionArn(
      this,
      'GetFoundationPetsLambda',
      'arn:aws:lambda:us-east-1:175749225105:function:training-sls-back-dev-createFoundation'
    );
    const filterFoundationPetsLambda = lambda.Function.fromFunctionArn(
      this,
      'FilterFoundationPetsLambda',
      'arn:aws:lambda:us-east-1:175749225105:function:training-sls-back-dev-createFoundation'
    );
    //Foundation Endpoint
    const foundationResource = api.root.addResource('foundation');
    foundationResource.addMethod(
      'POST',
      new LambdaIntegration(createFoundationLambda),
      {
        authorizer
      }
    );
    //Foundation Endpoint with foundationId
    const foundationIdResource =
      foundationResource.addResource('{foundationId}');
    foundationIdResource.addMethod(
      'GET',
      new LambdaIntegration(getFoundationPetsLambda),
      { authorizer }
    );
    foundationIdResource.addMethod(
      'POST',
      new LambdaIntegration(filterFoundationPetsLambda),
      { authorizer }
    );
    //Pet lambdas
    const createPetLambda = lambda.Function.fromFunctionArn(
      this,
      'CreatePetLambda',
      'arn:aws:lambda:us-east-1:175749225105:function:training-sls-back-dev-createFoundation'
    );
    const getPetsLambda = lambda.Function.fromFunctionArn(
      this,
      'GetPetsLambda',
      'arn:aws:lambda:us-east-1:175749225105:function:training-sls-back-dev-createFoundation'
    );
    const getPetLambda = lambda.Function.fromFunctionArn(
      this,
      'getPetLambda',
      'arn:aws:lambda:us-east-1:175749225105:function:training-sls-back-dev-createFoundation'
    );
    const updatePetLambda = lambda.Function.fromFunctionArn(
      this,
      'updatePetLambda',
      'arn:aws:lambda:us-east-1:175749225105:function:training-sls-back-dev-createFoundation'
    );
    const deletePetLambda = lambda.Function.fromFunctionArn(
      this,
      'deletePetLambda',
      'arn:aws:lambda:us-east-1:175749225105:function:training-sls-back-dev-createFoundation'
    );

    //Pet Endpoint
    const petResource = api.root.addResource('pet');
    petResource.addMethod('POST', new LambdaIntegration(createPetLambda), {
      authorizer
    });
    petResource.addMethod('GET', new LambdaIntegration(getPetsLambda), {
      authorizer
    });

    // Pet Endpoint with petId
    const petIdResource = petResource.addResource('{petId}');
    petIdResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(getPetLambda),
      { authorizer }
    );
    petIdResource.addMethod(
      'PUT',
      new apigateway.LambdaIntegration(updatePetLambda),
      { authorizer }
    );
    petIdResource.addMethod(
      'DELETE',
      new apigateway.LambdaIntegration(deletePetLambda),
      { authorizer }
    );
    //Add custom domain to API Gateway
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

    //Outputs
    new cdk.CfnOutput(this, 'RequestDataBucketName', {
      value: bucket.bucketName
    });
    new cdk.CfnOutput(this, 'PetHappyTopicArn', { value: topic.topicArn });
    new cdk.CfnOutput(this, 'PetsApiUrl', { value: api.url });
  }
}
