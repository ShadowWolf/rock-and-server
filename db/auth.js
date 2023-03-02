const { DefaultAzureCredential } = require('@azure/identity');
const { CosmosClient } = require('@azure/cosmos');

const endpoint = process.env.COSMOS_ENDPOINT;
const databaseName = 'rockandserver';
const containerId = 'rockandserver-config';

const cosmosClientFactory = () => {
    return new CosmosClient({
        endpoint,
        aadCredentials: new DefaultAzureCredential(),
    });
};

module.exports = {
    databaseName,
    containerId,
    cosmosClientFactory,
};
