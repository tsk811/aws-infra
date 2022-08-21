# AWS Basic Infra Setup

This stack contains few constructs to create basic VPC setup along with few other services. 
This project will be treated as a basic requirement for other AWS projects which you might find in my profile.

Please customize this stack by adding or removing the constructs which may or may not be needed for your usecases. 

** Please note that some of the AWS resources which are created by this stack are not covered under AWS Free tier. **

## Resources
* VPC with 3 Public and 3 Private subnets along with a NAT Gateway.
* ECR Repo
* ECS Cluster
* S3 Bucket (to store build artifacts)


### Notes
* All the resources created by this stack are saved to Parameter store. These will be referred by other stacks.
* Only 3 AZs are used in this stack and it is configured for "us-east-1". Specify the AZs in the configs if you need this is a different region.

### Backlog
* Provisions and configs to deploy the stack to Non Prod and Prod environment.
* Code Pipeline for automated deployments.