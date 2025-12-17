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
        context.log(`FunctionTelemetry triggered - Processing ${messages.length} message(s)`);

        if (!messages || messages.length === 0) {
            context.log('No messages to process');
            return;
        }

        try {
            const container = await getCosmosContainer();
            let successCount = 0;
            let errorCount = 0;
            
            for (const message of messages) {
                try {
                    let telemetryData = message;
                    if (typeof message === 'string') {
                        telemetryData = JSON.parse(message);
                    }

                    const document = {
                        id: `${telemetryData.deviceId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                        deviceId: telemetryData.deviceId,
                        distance_cm: telemetryData.distance_cm,
                        timestamp: telemetryData.timestamp || new Date().toISOString(),
                        receivedAt: new Date().toISOString(),
                        ...telemetryData
                    };

                    context.log(`Saving telemetry: Device=${document.deviceId}, Distance=${document.distance_cm}cm`);
                    
                    await container.items.create(document);
                    successCount++;
                } catch (messageError) {
                    errorCount++;
                    context.log.error(`Error processing message: ${messageError.message}`);
                    context.log.error(`Message content: ${JSON.stringify(message)}`);
                }
            }

            context.log(`FunctionTelemetry completed: ${successCount} saved, ${errorCount} errors`);
        } catch (error) {
            context.log.error(`Error during work with Cosmos DB: ${error.message}`);
            context.log.error(`Stack trace: ${error.stack}`);
            throw error; 
        }
    }
});
