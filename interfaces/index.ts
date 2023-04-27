import { DomainStack } from '../lib/domain-stack';

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
