import { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';

import { BasicStackProps } from '../interfaces';
import * as Utils from '../utils';

const Days: { [key: string]: number } = {
  dev: 30,
  sand: 30,
  prod: 90
};

export class S3Stack extends cdk.Stack {
  public apiBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: BasicStackProps) {
    super(scope, id, Utils.getCdkFromCustomProps(props));

    this.createBucket(props);
    this.addLifecyleRules(props);
  }

  private createBucket(props: BasicStackProps) {
    this.apiBucket = new s3.Bucket(this, 'PetBucket', {
      bucketName: Utils.getResourceNameWithPrefix(`${props.env}`),
      versioned: true
    });

    new cdk.CfnOutput(this, 'PetBucketArn', {
      value: this.apiBucket.bucketArn,
      exportName: Utils.getResourceNameWithPrefix('pets-s3-bucket')
    });
  }

  private addLifecyleRules(props: BasicStackProps) {
    this.apiBucket.addLifecycleRule({
      prefix: '',
      noncurrentVersionExpiration: cdk.Duration.days(Days[props.env])
    });
  }
}
