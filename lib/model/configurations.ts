export interface StackConfigs {
    account: string
    ecrRepo: string
    cidr: string
    cidrMask: number
}

export interface CommonConfigs {
    account: Account
    AZs: Array<string>
    codeRepo: CodeRepo
    kms: KMS
    roles: Roles
    artifactBucket: string
    secretsManager: SecretsManager
}

export interface Account {
    nonProd: string
    prod: string
    region: string
}

export interface CodeRepo {
    name: string
    defaultBranch: string
}

export interface KMS {
    arn: string
}

export interface Roles {
    deployRole: string
    crossAccountRole: string
}

export interface SecretsManager {
    name: string
    key: string
}