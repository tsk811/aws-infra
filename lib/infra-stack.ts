import { Duration, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

import { CommonConfigs } from '../lib/model/configs';

export interface InfraProps extends StackProps {
  readonly deployENV: string,
  readonly configs: CommonConfigs
}

export class InfraStack extends Stack {
  constructor(scope: Construct, id: string, props: InfraProps) {
    super(scope, id, props);
    const deployENV = props.deployENV
    const configs = props.configs

    //Function to create a parameter in SSM.
    function createParameter(name: string, value: string, context: any) {
      new ssm.StringParameter(context,`${name}Parameter`,{
        stringValue: value,
        parameterName: name
      })
    }

    const AZs = configs.AZs
    //AZs out to parameter store
    const azParam = createParameter("/configs/availabilityZones", AZs.toString(), this)

    const accountId = configs.account
    //Account ID out to parameter store
    const accountIdParam = createParameter("/configs/accountId", accountId, this)
    

    //VPC
    const vpc = new ec2.Vpc(this, `${this.stackName}VPC`, {
      cidr: configs.cidr,
      natGateways: 1,
      availabilityZones: this.availabilityZones,
      subnetConfiguration: [
        {
          name: 'private-subnet',
          subnetType: ec2.SubnetType.PRIVATE_WITH_NAT,
          cidrMask: configs.cidrMask,
        },
        {
          name: 'public-subnet',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: configs.cidrMask,
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
    const ecrRepo = new ecr.Repository(this, `${configs.ecrRepo}Repo`, {
      repositoryName: configs.ecrRepo,
      //repo needs to be deleted manually as it cannot be deleted by destroying the stack if it contains images
      removalPolicy: RemovalPolicy.RETAIN
    })
 
    //ECR repo name out to parameter store.
    const ecrRepoParam = createParameter("/configs/ecrRepo", ecrRepo.repositoryName, this)

    //S3 bucket to store build artifacts.
    const s3ArtifactBucket = new s3.Bucket(this, `${this.stackName}ArtifactBucket`, {
      bucketName: `artifact-bucket-${accountId}`,
      //this will create a lambda function to delete the objects inside the bucket when deleting the stack
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      publicReadAccess: false
    })

    //S3 bucket name out to parameter store.
    const s3ArtifactParam = createParameter("/configs/artifactBucket", s3ArtifactBucket.bucketName, this)
    
    //ECS cluster
    const ecsCluster = new ecs.Cluster(this, `${deployENV}Cluster`, {
      clusterName: `${deployENV}Cluster`,
      containerInsights: true,
      vpc: vpc
    });

    //ECS cluster name out to parameter store.
    const clusterParam = createParameter("/configs/ecsCluster", ecsCluster.clusterName, this)
  }

  //This allows cdk to only pull the cofigured AZs instead of all the available ones
  //Change this to region specific AZs
  get availabilityZones(): string[] {
    return ['us-east-1a', 'us-east-1b','us-east-1c'];
  }
  
}
