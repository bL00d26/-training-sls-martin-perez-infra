import { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';

import { SnsStackProps } from '../interfaces';
import * as Util from '../utils';

export class SnsStack extends cdk.Stack {
  private topic: sns.Topic;

  constructor(scope: Construct, id: string, props: SnsStackProps) {
    super(scope, id, Util.getCdkFromCustomProps(props));
    this.createSNSTopic();
    this.createLambdaRole(props);
  }

  private createLambdaRole(props: SnsStackProps) {
    const snsPolicyStatement = new iam.PolicyStatement();

    snsPolicyStatement.addResources(`${this.topic.topicArn}`);
    snsPolicyStatement.addActions('SNS:*');

    const s3BucketPolicyStatement = new iam.PolicyStatement();
    s3BucketPolicyStatement.addResources(props.stacks.s3.apiBucket.bucketArn);
    s3BucketPolicyStatement.addActions('s3:*');

    const s3ObjectsPolicyStatement = new iam.PolicyStatement();
    s3ObjectsPolicyStatement.addResources(
      `${props.stacks.s3.apiBucket.bucketArn}/*`
    );
    s3ObjectsPolicyStatement.addActions('s3:*');

    const lambdaRole = new iam.Role(this, 'LambdaTrainingRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      roleName: Util.getResourceNameWithPrefix(
        `lambda-training-role-${props.env}`
      ),
      description: 'Role para las lambdas',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaVPCAccessExecutionRole'
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        )
      ],
      inlinePolicies: {
        [Util.getResourceNameWithPrefix(
          `lambda-training-role-policy-${props.env}`
        )]: new iam.PolicyDocument({
          statements: [
            s3BucketPolicyStatement,
            snsPolicyStatement,
            s3ObjectsPolicyStatement
          ]
        })
      }
    });

    new cdk.CfnOutput(this, 'LambdaS3SnsRoleArn', {
      value: lambdaRole.roleArn,
      exportName: 'lambda-s3-sns-role-arn'
    });

    new cdk.CfnOutput(this, 'LambdaS3SnsRoleName', {
      value: lambdaRole.roleName,
      exportName: 'lambda-s3-sns-role-name'
    });
  }
  private createSNSTopic() {
    this.topic = new sns.Topic(this, 'PetHappyTopic');
    this.topic.addSubscription(
      new subscriptions.EmailSubscription('german.sosa@alegra.com')
    );
  }
}
