export function getCdkFromCustomProps(props: any) {
  return {
    stackName: props.stackName,
    env: {
      account: props.account,
      region: props.region
    }
  };
}
export function getResourceNameWithPrefix(resourceName: string) {
  return `training-martin-sls-${resourceName}`;
}

export function getStackNameWithPrefix(resourceName: string) {
  return `api-training-martin-${resourceName}`;
}

export function getAuthorizerArn(env: string): string {
  return 'arn:aws:lambda:us-east-1:175749225105:function:training-sls-back-dev-authorizer';
}
