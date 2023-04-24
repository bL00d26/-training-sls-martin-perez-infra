#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AppStack } from '../lib/app-stack';

const app = new cdk.App();
const appName = 'training-martin';

new AppStack(app, 'AppStack', {
 env:{
  account: '175749225105',
  region:'us-east-1',
 },
  stackName:`${appName}-training`
});