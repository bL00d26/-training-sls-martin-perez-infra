import { DomainStack } from '../lib/domain-stack';
import { S3Stack } from '../lib/s3-stack';

export interface BasicStackProps {
  name: string;
  env: string;
  account: string;
  region: string;
}

export interface ApiGatewayStackProps extends BasicStackProps {
  stacks: {
    domain: DomainStack;
  };
}
export interface SnsStackProps extends BasicStackProps {
  stacks: {
    s3: S3Stack;
  };
}
