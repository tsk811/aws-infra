#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { CommonConfigs } from '../lib/model/configs';
import { InfraStack } from '../lib/infra-stack';

const nonProdConfigs: CommonConfigs = require('../lib/configuration/nonProdConfigs.json')
const prodConfigs: CommonConfigs = require('../lib/configuration/prodConfigs.json')

const app = new cdk.App();
const npnProdInfra = new InfraStack(app, 'NonProdInfraStack',{
    deployENV: "NonProd",
    configs: nonProdConfigs,
    env: {
        region: nonProdConfigs.region,
        account: nonProdConfigs.account,
    }
});

const prodInfra = new InfraStack(app, 'ProdInfraStack',{
    deployENV: "Prod",
    configs: prodConfigs,
    env: {
        region: prodConfigs.region,
        account: prodConfigs.account,
    }
});
