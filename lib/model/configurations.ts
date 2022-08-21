export interface StackConfigs {
    account: string
    ecrRepo: string
    cidr: string
    cidrMask: number
}

export interface CommonConfigs {
    region: string
    AZs: Array<string>
    codeRepo: CodeRepo
}

export interface CodeRepo {
    name: string
    defaultBranch: string
}
