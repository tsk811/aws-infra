# AWS Basic Infra Setup

This stack contains few constructs to create basic infra setup with few other services. 
This project will be treated as a prerequisite for other AWS projects under this user.

Please customize this stack by adding or removing the constructs which may or may not be needed for your use cases. 

** Please note that some of the AWS resources which are created by this stack are not covered under AWS Free tier. **


## Stacks
-----

* InfraPipelineStack
* NonProdInfraStack
* ProdInfraStack


## Prerequisites
-----

* It is assumed that this project code is managed in AWS Code Commit. Hosting the code in other repositories will need require changes in the code for triggers and pipeline setup. The repo name should be "global-infra" and in case of a different name, make the necessary changes under "lib/configuration".
* If the Production account is different than the one where Pipeline is deployed, necessary roles should be available in Prod and pipeline's account for cross account deployment. Code changes to import those roles should be added in the pipeline stack and used accordingly.

## Resources
-----

* VPC with 3 Public and 3 Private subnets along with a NAT Gateway.
* ECR Repo
* ECS Cluster
* S3 Bucket (to store build artifacts for other projects)


## Flow
-----

1. Deploy "InfraPipelineStack" from local for the first time.
2. Refer the created pipeline in Code Pipeline to visualize the flow. Pipeline will handle the deployment to Non Prod and Prod accounts.

### Notes
-----

* All the resources created by this stack are saved to Parameter store. These will be referred by the other stacks.
* Only 3 AZs are used in this stack and it is configured for "us-east-1". Specify the AZs in the configs if you need this is a different region. Specify the AZs under "lib/configuration" and in Infra stack(ref: override method for AZs) if this is needed in a different region.


### Backlog
-----

* Code to enable cross account deployment(Prod)