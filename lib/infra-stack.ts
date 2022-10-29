import { Duration, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

import { CommonConfigs, StackConfigs } from './model/configurations';

export interface InfraProps extends StackProps {
  readonly deployENV: string,
  readonly commonConfigs: CommonConfigs
  readonly stackConfigs: StackConfigs
  readonly stackName: string
}

export class InfraStack extends Stack {
  constructor(scope: Construct, id: string, props: InfraProps) {
    super(scope, id, props);
    const deployENV = props.deployENV
    const commonConfigs = props.commonConfigs
    const stackConfigs = props.stackConfigs
    const stackName = props.stackName

    //Function to create a parameter in SSM.
    function createParameter(name: string, value: string, context: any) {
      new ssm.StringParameter(context,`${name}Parameter`,{
        stringValue: value,
        parameterName: name
      })
    }

    const AZs = commonConfigs.AZs
    //AZs out to parameter store
    const azParam = createParameter("/configs/availabilityZones", AZs.toString(), this)

    const accountId = stackConfigs.account
    //Account ID out to parameter store
    const accountIdParam = createParameter("/configs/accountId", accountId, this)
    

    //VPC
    const vpc = new ec2.Vpc(this, `${this.stackName}VPC`, {
      cidr: stackConfigs.cidr,
      natGateways: 1,
      availabilityZones: this.availabilityZones,
      subnetConfiguration: [
        {
          name: 'private-subnet',
          subnetType: ec2.SubnetType.PRIVATE_WITH_NAT,
          cidrMask: stackConfigs.cidrMask,
        },
        {
          name: 'public-subnet',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: stackConfigs.cidrMask,
        }
      ],
    });


    //VPC ID out to parameter store.
    const vpcParam = createParameter("/configs/vpc", vpc.vpcId, this)

    //Subnets out to parameter store.
    vpc.publicSubnets.forEach( (subnet) =>{
      const az = subnet.availabilityZone.charAt(subnet.availabilityZone.length - 1).toUpperCase()
      createParameter(`/configs/publicSubnet${az}`, subnet.subnetId, this)
    })
    vpc.privateSubnets.forEach( (subnet) =>{
      const az = subnet.availabilityZone.charAt(subnet.availabilityZone.length - 1).toUpperCase()
      createParameter(`/configs/privateSubnet${az}`, subnet.subnetId, this)
    })

    const publicSubnets = createParameter("/configs/publicSubnets", vpc.selectSubnets({subnetType:ec2.SubnetType.PUBLIC}).subnetIds.toString(), this)
    const privateSubnets = createParameter("/configs/privateSubnets", vpc.selectSubnets({subnetType:ec2.SubnetType.PRIVATE_WITH_NAT}).subnetIds.toString(), this)
    

    //ECR Repo.
    const ecrRepo = new ecr.Repository(this, `${stackConfigs.ecrRepo}Repo`, {
      repositoryName: stackConfigs.ecrRepo,
      //repo needs to be deleted manually as it cannot be deleted by destroying the stack if it contains images
      removalPolicy: RemovalPolicy.RETAIN
    })

    //ECR permissions.
    ecrRepo.grantPullPush(new iam.AccountPrincipal( props.deployENV == "Prod" ? commonConfigs.account.nonProd : commonConfigs.account.nonProd))
 
    //ECR repo name out to parameter store.
    const ecrRepoParam = createParameter("/configs/ecrRepo", ecrRepo.repositoryName, this)
    
    //ECS cluster
    const ecsCluster = new ecs.Cluster(this, `${deployENV}Cluster`, {
      clusterName: `${deployENV}Cluster`,
      containerInsights: true,
      vpc: vpc
    });

    //ECS cluster name out to parameter store.
    const clusterParam = createParameter("/configs/ecsCluster", ecsCluster.clusterName, this)
    
    //HostedZoneID param
    const hostedZoneId = createParameter("/configs/hostedZoneId", 'zoneId', this)

    //HostedZoneName param
    const hostedZoneName = createParameter("/configs/hostedZoneName", 'zoneName', this)
  }

  //This allows cdk to only pull the cofigured AZs instead of all the available ones
  //Change this to region specific AZs
  get availabilityZones(): string[] {
    return ['us-east-1a', 'us-east-1b','us-east-1c'];
  }
  
}
