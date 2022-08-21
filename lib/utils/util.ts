import * as codeBuild from 'aws-cdk-lib/aws-codebuild'
import * as iam from 'aws-cdk-lib/aws-iam'
import { IVpc } from 'aws-cdk-lib/aws-ec2'


export function buildProject(stack: any,
    name: string,
    phases: any,
    env: any,
    artifacts: any,
    isPrivileged: boolean) {
    return new codeBuild.PipelineProject(stack, name, {

        buildSpec: codeBuild.BuildSpec.fromObject({
            version: '0.2',
            env: { variables: env },
            phases: phases,
            artifacts: artifacts,

        }),
        environment: {
            buildImage: codeBuild.LinuxBuildImage.AMAZON_LINUX_2_4,
            privileged: isPrivileged// needed for docker build
        },


    })
}