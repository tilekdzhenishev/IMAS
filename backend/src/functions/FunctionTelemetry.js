const { app } = require('@azure/functions');
const { CosmosClient } = require('@azure/cosmos');

let cosmosContainer;

async function getCosmosContainer() {
    if (cosmosContainer) {
        return cosmosContainer; 
    }

    const endpoint = process.env.COSMOS_DB_ENDPOINT;
    const key = process.env.COSMOS_DB_KEY;
    const databaseId = process.env.COSMOS_DB_DATABASE;
    const containerId = process.env.COSMOS_DB_CONTAINER;

    if (!endpoint || !key || !databaseId || !containerId) {
        throw new Error("Cosmos DB connection settings are missing or incomplete.");
    }
    
    const client = new CosmosClient({ endpoint, key });
    
    const database = client.database(databaseId);
    const container = database.container(containerId);

    cosmosContainer = container;
    
    return cosmosContainer;
}


app.eventHub('FunctionTelemetry', {
    connection: 'EVENT_HUB_CONNECTION_STRING',
    eventHubName: '%EVENT_HUB_NAME%',
    cardinality: 'many',
    consumerGroup: '$Default',
    handler: async (messages, context) => {
        context.log('🔥 FunctionTelemetry TRIGGERED');

        try {
            const container = await getCosmosContainer();
            
            for (const message of messages) {
                context.log('Message:', JSON.stringify(message));
                
                await container.items.create(message); 
            }
        } catch (error) {
            context.log.error(`❌ Erroe during work with Cosmos DB: ${error.message}`);
            throw error; 
        }
    }
});
