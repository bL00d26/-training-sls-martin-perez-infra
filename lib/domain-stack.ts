import * as cdk from 'aws-cdk-lib';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import { Construct } from 'constructs';

import { BasicStackProps } from '../interfaces';
import { getCdkFromCustomProps } from '../utils';

export class DomainStack extends cdk.Stack {
  public readonly certificate: acm.Certificate;

  constructor(scope: Construct, id: string, props: BasicStackProps) {
    super(scope, id, getCdkFromCustomProps(props));

    this.certificate = new acm.Certificate(this, 'DomainCertificate', {
      domainName: 'alegra.com',
      subjectAlternativeNames: ['*.alegra.com'],
      validation: acm.CertificateValidation.fromDns()
    });
  }
}
