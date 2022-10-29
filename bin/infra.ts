#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { CommonConfigs, StackConfigs } from '../lib/model/configurations';
import { InfraStack } from '../lib/infra-stack';
import { PipelineStack } from '../lib/pipeline-stack';

const nonProdConfigs: StackConfigs = require('../lib/configuration/nonProdConfigs.json')
const prodConfigs: StackConfigs = require('../lib/configuration/prodConfigs.json')
const commonConfigs: CommonConfigs = require('../lib/configuration/commonConfigs.json')

const app = new cdk.App();
const nonProdInfra = new InfraStack(app, 'NonProdInfraStack', {
    deployENV: "NonProd",
    stackConfigs: nonProdConfigs,
    commonConfigs: commonConfigs,
    stackName: 'NonProdInfraStack',
    env: {
        region: commonConfigs.account.region,
        account: nonProdConfigs.account,
    }
});

const prodInfra = new InfraStack(app, 'ProdInfraStack', {
    deployENV: "Prod",
    stackConfigs: prodConfigs,
    commonConfigs: commonConfigs,
    stackName: 'ProdInfraStack',
    env: {
        region: commonConfigs.account.region,
        account: prodConfigs.account,
    }
});

const pipelineStack = new PipelineStack(app, 'InfraPipelineStack', {
    commonConfigs: commonConfigs,
    nonProdConfigs: nonProdConfigs,
    prodConfigs: prodConfigs,
    nonProdInfraStack: nonProdInfra,
    prodInfraStack: prodInfra,
    stackName: 'InfraPipelineStack',

})
