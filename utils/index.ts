export function getCdkFromCustomProps(props:any){
  return {
    stackName: props.stackName,
    env: {
      account: props.account,
      region: props.region,
    },
  }
}
export function getResourceNameWithPrefix(resourceName:string){
  return `training-martin-sls-${resourceName}`;
}

