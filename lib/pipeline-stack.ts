import * as codepipeline from 'aws-cdk-lib/aws-codepipeline'
import * as codeCommit from 'aws-cdk-lib/aws-codecommit'
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions'
import { App, Stack, StackProps } from 'aws-cdk-lib';
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
    const prodInfraStack = props.prodInfraStack
    const stackName = props.stackName;

    //Some required imports
    const codeRepository = codeCommit.Repository.fromRepositoryName(this, `${commonConfigs.codeRepo.name}Repository`,
      commonConfigs.codeRepo.name)

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
      stages: [
        {
          stageName: "Source",
          actions: [
            new codepipeline_actions.CodeCommitSourceAction(
              {
                actionName: "Code_Commit_Pull",
                output: sourceOut,
                repository: codeRepository,
                branch: commonConfigs.codeRepo.defaultBranch,
              })
          ]

        },
        {
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
        {
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
              // notifyEmails:"Emailhere". Slack integration coming soon.
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
              adminPermissions: true
            })]
        },


      ]
    })


  }
}
