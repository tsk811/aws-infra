import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codeCommit from 'aws-cdk-lib/aws-codecommit';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as s3 from 'aws-cdk-lib/aws-s3'
import { Construct } from 'constructs';
import { App, Stack, StackProps, SecretValue } from 'aws-cdk-lib';
import { CommonConfigs, StackConfigs } from './model/configurations';
import { InfraStack } from './infra-stack';

import { buildProject } from './utils/util'

export interface PipelineProps extends StackProps {
  readonly commonConfigs: CommonConfigs
  readonly nonProdInfraStack: InfraStack
  readonly nonProdConfigs: StackConfigs
  readonly prodInfraStack: InfraStack
  readonly prodConfigs: StackConfigs
  readonly stackName: string

}

export class PipelineStack extends Stack {
  constructor(app: App, id: string, props: PipelineProps) {
    super(app, id, props);

    const commonConfigs = props.commonConfigs
    const nonProdInfraStack = props.nonProdInfraStack
    const nonProdConfigs = props.nonProdConfigs
    const prodConfigs = props.prodConfigs
    const prodInfraStack = props.prodInfraStack
    const stackName = props.stackName;

    function getValueFromParameterStore(name: string, stack: Construct) {
      return (ssm.StringParameter.fromStringParameterAttributes(stack, `${name}Parameter`, {
        parameterName: name
      })).stringValue
    }

    //Some required imports
    const codeRepository = codeCommit.Repository.fromRepositoryName(this, `${commonConfigs.codeRepo.name}Repository`,
      commonConfigs.codeRepo.name)

    const kms_key = kms.Key.fromKeyArn(this, "EncryptionKey",
      getValueFromParameterStore(commonConfigs.kms.arn, this))

    const prodDeployRole = iam.Role.fromRoleArn(this, "ProdDeployRole",
      getValueFromParameterStore(commonConfigs.roles.deployRole, this), { mutable: false })

    const crossAccountRole = iam.Role.fromRoleArn(this, "CrossAccountRole",
      getValueFromParameterStore(commonConfigs.roles.crossAccountRole, this), { mutable: false })


    const artifactBucket = s3.Bucket.fromBucketAttributes(this, `${stackName}ArtifactBucket`, {
      bucketName: getValueFromParameterStore(commonConfigs.artifactBucket, this),
      encryptionKey: kms_key,
    })


    //Artifacts
    const sourceOut = new codepipeline.Artifact("sourceOut")
    const cdkBuildOut = new codepipeline.Artifact("cdkBuildOut")

    //CodeBuild Projects for build
    const cdkBuild = buildProject(this, `${stackName}CDKBuild`,
      {
        build: { commands: ['make install'] }
      },
      {
        // No environment variables
      },
      {
        'base-directory': 'cdk.out',
        "files": ['*.template.json'],
        "name": cdkBuildOut.artifactName

      }, false)


    //Pipeline
    const pipeline = new codepipeline.Pipeline(this, "InfraPipeline", {
      restartExecutionOnUpdate: true,
      artifactBucket: artifactBucket,
      crossAccountKeys: true,
      stages: [
        {
          stageName: "Source",
          actions: [
            new codepipeline_actions.GitHubSourceAction(
              {
                actionName: "Github_Pull",
                repo: commonConfigs.codeRepo.name,
                owner: "tsk811",
                oauthToken: SecretValue.secretsManager(commonConfigs.secretsManager.name, {
                  jsonField: commonConfigs.secretsManager.key
                }),
                output: sourceOut,
                branch: commonConfigs.codeRepo.defaultBranch
              })
          ]

        },
        {//This stage produces cloud formation templates for all the stacks.
          stageName: "CDK_Build",
          actions: [
            new codepipeline_actions.CodeBuildAction({
              actionName: "CDK_Build",
              input: sourceOut,
              project: cdkBuild,
              outputs: [cdkBuildOut]

            })
          ]
        },
        {//This stage updates the pipeline
          stageName: "Pipeline_Update",
          actions: [
            new codepipeline_actions.CloudFormationCreateUpdateStackAction({
              actionName: "Self_Mutate",
              templatePath: cdkBuildOut.atPath(`${stackName}.template.json`),
              stackName: stackName,
              adminPermissions: true
            })
          ]
        },
        {
          stageName: "Non_Prod_Deployment",
          actions: [
            new codepipeline_actions.CloudFormationCreateUpdateStackAction({
              actionName: "Deploy_Non_Prod_Infra",
              templatePath: cdkBuildOut.atPath(`${nonProdInfraStack.stackName}.template.json`),
              stackName: nonProdInfraStack.stackName,
              adminPermissions: true,
            })]
        },
        {
          stageName: "Approval",
          actions: [
            new codepipeline_actions.ManualApprovalAction({
              actionName: "Manual_Approval",
              // notifyEmails:"Emailhere". Added emails which needs to be notified.
            })
          ]
        },
        {
          stageName: "Prod_Infra_Deployment",
          actions: [
            new codepipeline_actions.CloudFormationCreateUpdateStackAction({
              actionName: "Deploy_Non_Prod_Infra",
              templatePath: cdkBuildOut.atPath(`${prodInfraStack.stackName}.template.json`),
              stackName: prodInfraStack.stackName,
              adminPermissions: true,
              role: crossAccountRole,
              deploymentRole: prodDeployRole
            })]
        },
      ]
    })


  }
}
