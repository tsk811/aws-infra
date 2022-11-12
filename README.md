# AWS Basic Infra Setup

This stack contains few constructs to create basic infra setup with few other services. 
This project will be treated as a prerequisite for other AWS projects under this user.

Customize this stack by adding or removing the constructs which may or may not be needed for your use cases. 

** Some of the AWS resources which are created by this stack are not covered under AWS Free tier. **


## Stacks
-----

* InfraPipelineStack
* NonProdInfraStack
* ProdInfraStack


## Prerequisites
-----

* Refer "[aws-prerequisites](https://github.com/tsk811/aws-prerequisites)" project for the required setup.
* Update the account IDs and relevant configurations under "lib/configuration"


## Resources
-----

* VPC with 3 Public and 3 Private subnets along with a NAT Gateway.
* ECR Repo
* ECS Cluster


## Description/How to
-----

1. Deploy "InfraPipelineStack" from local for the first time(one time activity).
2. Pipeline will checkout the code from Github repo for every new push to the default branch(main).
3. CDK Build stage prepares the templates for pipeline and infrastructure.
4. Self Mutate stage will alter the pipeline configuration if there are any changes.
5. Infra will be then deployed to Non Prod account.
6. Manual approval stage will be used for Production deployment approval along with a notification to required groups(Email).
7. Infra will be then deployed to Prod account after approval.

Open the Code Pipeline to visualize the flow after the pipeline deployment for better understanding.

### Notes
-----

* All the resources created by this stack are saved to the Parameter store and the same will be referred by the other stacks.
* Only 3 AZs are used in this stack and it is configured for "us-east-1". Specify the AZs in the configs if you need this is a different region. Specify the AZs under "lib/configuration" and in Infra stack(ref: override method for AZs) if this is needed in a different region.
