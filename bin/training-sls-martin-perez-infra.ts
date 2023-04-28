#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { getStackNameWithPrefix } from '../utils';
import { DomainStack } from '../lib/domain-stack';
import { ApiGatewayStack } from '../lib/apigateway-stack';
import { S3Stack } from '../lib/s3-stack';
import { SnsStack } from '../lib/sns-stack';

const app = new cdk.App();
const sharedProps = {
  env: 'dev',
  account: '175749225105',
  region: 'us-east-1'
};

const domainStack = new DomainStack(app, 'DomainStack', {
  ...sharedProps,
  name: getStackNameWithPrefix('domain')
});

const apiGatewayStack = new ApiGatewayStack(app, 'ApiGatewayStack', {
  ...sharedProps,
  name: getStackNameWithPrefix('apigateway'),
  stacks: {
    domain: domainStack
  }
});

const s3Stack = new S3Stack(app, 'S3Stack', {
  ...sharedProps,
  name: getStackNameWithPrefix('s3')
});
const snsStack = new SnsStack(app, 'SnsStack', {
  ...sharedProps,
  name: getStackNameWithPrefix('sns'),
  stacks: {
    s3: s3Stack
  }
});

apiGatewayStack.addDependency(domainStack);
snsStack.addDependency(s3Stack);
