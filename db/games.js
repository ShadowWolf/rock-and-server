const { cosmosClientFactory, databaseName, containerId } = require('./auth');
const fetch = require('node-fetch');

const ResponseTypes = {
    IGNORE: 0,
    UNKNOWN_GAME: 'Unknown Game',
    INVALID_GUILD_ID: 'Invalid source server',
    INVALID_CONFIGURATION: 'Missing key configuration requirements',
    GAME_STATE_CHANGE_FAILED: 'Failed to update game state',
    GAME_STATE_CHANGED: 'Game state successfully updated',
};

const listGames = async (sourceGuildId) => {
    const client = cosmosClientFactory();
    const database = client.database(databaseName);

    const querySpec = {
        query: 'SELECT c.id FROM c where array_contains(c.validGuildIds, @sourceGuild)',
        parameters: [
            {
                'name': '@sourceGuild',
                'value': sourceGuildId,
            },
        ],
    };

    const { resources } = await database.container(containerId).items.query(querySpec).fetchAll();

    console.log(resources);

    const gameNames = [];

    for (const item of resources) {
        gameNames.push(item['id']);
    }

    return gameNames;
};

const getState = async (gameName, sourceGuildId) => {
    const client = cosmosClientFactory();
    const { statusUrl } = await findGame(client, gameName, sourceGuildId);

    const response = await fetch(`${statusUrl}`);
    const data = await response.json();

    return data['PowerState'];
};

const manageGame = async (gameName, actionName, sourceGuildId) => {
    const client = cosmosClientFactory();
    console.log(`Performing ${actionName} on ${gameName} for ${sourceGuildId}`);

    const { vmName, azFunctionUrl, resourceGroup, validGuildIds } = await findGame(client, gameName, sourceGuildId);

    console.log(`Response: vmname = '${vmName}' azFunctionUrl = '${azFunctionUrl}' resourceGroup = '${resourceGroup}' validGuildIds = '${validGuildIds}'`);

    if (validGuildIds.toString().valueOf() !== sourceGuildId.valueOf()) {
        console.error(`${sourceGuildId} doesn't match ${validGuildIds}`);
        return ResponseTypes.INVALID_GUILD_ID;
    }

    if (!azFunctionUrl) {
        console.error(`${gameName} is missing the azFunctionUrl param`);
        return ResponseTypes.INVALID_CONFIGURATION;
    }

    if (!resourceGroup) {
        console.error(`${gameName} is missing the resourceGroup param`);
        return ResponseTypes.INVALID_CONFIGURATION;
    }

    if (!vmName) {
        console.error(`${gameName} is missing the vmName param`);
        return ResponseTypes.INVALID_CONFIGURATION;
    }

    if (actionName.toUpperCase() === 'GET') {
        const response = await fetch(`${azFunctionUrl}&resourceGroup=${resourceGroup}`);

        const data = await response.json();
        return data['PowerState'];
    }
    else {
        const method = actionName.toUpperCase() === 'START' ? 'POST' : 'DELETE';

        const response = await fetch(`${azFunctionUrl}`, {
            method: method,
            body: JSON.stringify({
                virtualMachineName: vmName,
                resourceGroup: resourceGroup,
            }),
        });

        if (!response.ok) {
            console.error(response);
            return ResponseTypes.GAME_STATE_CHANGE_FAILED;
        }

        return ResponseTypes.GAME_STATE_CHANGED;
    }
};

async function findGame(client, gameName, sourceGuildId) {
    const database = client.database(databaseName);

    const querySpec = {
        query: 'SELECT * from c where c.id = @gameName and array_contains(c.validGuildIds, @sourceGuildId)',
        parameters: [
            {
                name: '@gameName',
                value: gameName,
            },
            {
                name: '@sourceGuildId',
                value: sourceGuildId,
            },
        ],
    };

    const { resources } = await database.container(containerId).items.query(querySpec).fetchAll();

    if (resources.length > 1) {
        console.error(`The request for ${gameName} returned more than one response`);
        throw new Error('Incorrect game information');
    }

    return resources[0];
}

module.exports = {
    manageGame,
    listGames,
    getState,
};
