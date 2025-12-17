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
    cosmosContainer = database.container(containerId);
    
    return cosmosContainer;
}

app.http('FunctionApi', {
    methods: ['GET', 'POST', 'OPTIONS'],
    authLevel: 'anonymous',
    route: '{*restOfPath}',
    handler: async (request, context) => {
        context.log(`Http function processed request for url "${request.url}"`);

        try {
            const url = new URL(request.url);
            let path = url.pathname;
            const routeParam = url.searchParams.get('route') || url.searchParams.get('path');
            if (routeParam) {
                path = routeParam.startsWith('/') ? routeParam : '/' + routeParam;
            }
            const method = request.method;

            const headers = {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            };

            if (method === 'OPTIONS') {
                return {
                    status: 200,
                    headers,
                    body: ''
                };
            }

            let routePath = path.replace(/^\/api\/FunctionApi/, '') || '';
            if (routePath === '' || routePath === '/') {
                routePath = '';
            }
            
            context.log(`Processing route: "${routePath}" (original: ${path}), method: ${method}`);
            
            if (method === 'POST') {
                if (routePath.includes('/telemetry') || path.includes('/telemetry')) {
                    return await handleCreateTelemetry(request, context, headers);
                } else if (routePath.includes('/command') || path.includes('/command')) {
                    return await handleCommand(request, context, headers);
                } else {
                    return {
                        status: 400,
                        headers,
                        body: JSON.stringify({
                            success: false,
                            error: 'POST endpoint not found. Use /telemetry to create telemetry or /command to send commands'
                        })
                    };
                }
            }
            
            if (routePath === '/health' || routePath === 'health' || path.endsWith('/health')) {
                return {
                    status: 200,
                    headers,
                    body: JSON.stringify({ 
                        status: 'ok', 
                        timestamp: new Date().toISOString(),
                        service: 'Azure Functions API'
                    })
                };
            } else if (routePath.includes('/telemetry/stats') || path.includes('/telemetry/stats')) {
                return await handleStats(request, context, headers);
            } else if (routePath.includes('/telemetry/latest') || path.includes('/telemetry/latest')) {
                return await handleLatest(request, context, headers);
            } else if (routePath.includes('/telemetry') || path.includes('/telemetry')) {
                return await handleTelemetry(request, context, headers);
            } else {
                return {
                    status: 200,
                    headers,
                    body: JSON.stringify({
                        message: 'IMAS Azure Functions API',
                        endpoints: {
                            'GET /api/FunctionApi/telemetry': 'Get telemetry data',
                            'GET /api/FunctionApi/telemetry/latest': 'Get latest telemetry',
                            'GET /api/FunctionApi/telemetry/stats': 'Get statistics',
                            'POST /api/FunctionApi/telemetry': 'Create telemetry record',
                            'POST /api/FunctionApi/command': 'Send command to device',
                            'GET /api/FunctionApi/health': 'Health check'
                        }
                    })
                };
            }
        } catch (error) {
            context.log.error(`Error: ${error.message}`);
            return {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    success: false,
                    error: error.message
                })
            };
        }
    }
});

async function handleTelemetry(request, context, headers) {
    const url = new URL(request.url);
    const deviceId = url.searchParams.get('deviceId');
    const limit = parseInt(url.searchParams.get('limit') || '100');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    const container = await getCosmosContainer();
    
    let query = 'SELECT * FROM c';
    const queryParams = [];

    if (deviceId) {
        query += ' WHERE c.deviceId = @deviceId';
        queryParams.push({ name: '@deviceId', value: deviceId });
    }

    query += ' ORDER BY c.timestamp DESC';
    query += ` OFFSET ${offset} LIMIT ${limit}`;

    const querySpec = {
        query: query,
        parameters: queryParams
    };

    const { resources } = await container.items.query(querySpec).fetchAll();

    return {
        status: 200,
        headers,
        body: JSON.stringify({
            success: true,
            count: resources.length,
            data: resources
        })
    };
}

async function handleLatest(request, context, headers) {
    const url = new URL(request.url);
    const deviceId = url.searchParams.get('deviceId');
    const limit = parseInt(url.searchParams.get('limit') || '10');

    const container = await getCosmosContainer();
    
    let query = 'SELECT TOP @limit * FROM c';
    const queryParams = [{ name: '@limit', value: limit }];

    if (deviceId) {
        query = 'SELECT TOP @limit * FROM c WHERE c.deviceId = @deviceId';
        queryParams.push({ name: '@deviceId', value: deviceId });
    }

    query += ' ORDER BY c.timestamp DESC';

    const querySpec = {
        query: query,
        parameters: queryParams
    };

    const { resources } = await container.items.query(querySpec).fetchAll();

    return {
        status: 200,
        headers,
        body: JSON.stringify({
            success: true,
            count: resources.length,
            data: resources
        })
    };
}

async function handleStats(request, context, headers) {
    const container = await getCosmosContainer();
    
    const countQuery = 'SELECT VALUE COUNT(1) FROM c';
    const { resources: countResult } = await container.items.query({ query: countQuery }).fetchAll();
    const totalCount = countResult[0] || 0;

    const deviceStatsQuery = `
        SELECT c.deviceId, COUNT(1) as count 
        FROM c 
        GROUP BY c.deviceId
    `;
    const { resources: deviceStats } = await container.items.query({ query: deviceStatsQuery }).fetchAll();

    const latestQuery = 'SELECT TOP 1 * FROM c ORDER BY c.timestamp DESC';
    const { resources: latest } = await container.items.query({ query: latestQuery }).fetchAll();

    const avgQuery = 'SELECT VALUE AVG(c.distance_cm) FROM c';
    const { resources: avgResult } = await container.items.query({ query: avgQuery }).fetchAll();
    const avgDistance = avgResult[0] || 0;

    return {
        status: 200,
        headers,
        body: JSON.stringify({
            success: true,
            stats: {
                totalRecords: totalCount,
                averageDistance: parseFloat(avgDistance.toFixed(2)),
                deviceCount: deviceStats.length,
                devices: deviceStats,
                latestEntry: latest[0] || null
            }
        })
    };
}

async function handleCreateTelemetry(request, context, headers) {
    try {
        const body = await request.json();
        
        if (!body.deviceId || body.distance_cm === undefined) {
            return {
                status: 400,
                headers,
                body: JSON.stringify({
                    success: false,
                    error: 'Missing required fields: deviceId and distance_cm'
                })
            };
        }

        const container = await getCosmosContainer();
        
        const document = {
            id: `${body.deviceId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            deviceId: body.deviceId,
            distance_cm: parseFloat(body.distance_cm),
            timestamp: body.timestamp || new Date().toISOString(),
            receivedAt: new Date().toISOString(),
            ...body
        };

        const { resource } = await container.items.create(document);

        context.log(`Created telemetry: Device=${document.deviceId}, Distance=${document.distance_cm}cm`);

        return {
            status: 201,
            headers,
            body: JSON.stringify({
                success: true,
                message: 'Telemetry created successfully',
                data: resource
            })
        };
    } catch (error) {
        context.log.error(`Error creating telemetry: ${error.message}`);
        return {
            status: 500,
            headers,
            body: JSON.stringify({
                success: false,
                error: error.message
            })
        };
    }
}

async function handleCommand(request, context, headers) {
    try {
        const body = await request.json();
        
        if (!body.deviceId || !body.command) {
            return {
                status: 400,
                headers,
                body: JSON.stringify({
                    success: false,
                    error: 'Missing required fields: deviceId and command'
                })
            };
        }

        context.log(`Command sent: Device=${body.deviceId}, Command=${body.command}`);

        return {
            status: 200,
            headers,
            body: JSON.stringify({
                success: true,
                message: 'Command sent successfully',
                data: {
                    deviceId: body.deviceId,
                    command: body.command,
                    timestamp: new Date().toISOString(),
                    status: 'sent'
                }
            })
        };
    } catch (error) {
        context.log.error(`Error sending command: ${error.message}`);
        return {
            status: 500,
            headers,
            body: JSON.stringify({
                success: false,
                error: error.message
            })
        };
    }
}
