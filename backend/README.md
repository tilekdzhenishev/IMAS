# IMAS Azure Functions

Azure Functions for processing IoT device telemetry and providing REST API access to data.

## Requirements

- Node.js 18+
- Azure Functions Core Tools 4.x
- Azure CLI (for deployment)

## Installation

```bash
npm install
```

## Development

```bash
npm start
npm test
npm run check-deploy
```

## API Endpoints

### GET
- `/api/FunctionApi/health` - Health check
- `/api/FunctionApi/telemetry` - Get telemetry (query: `deviceId`, `limit`, `offset`)
- `/api/FunctionApi/telemetry/latest` - Get latest records (query: `deviceId`, `limit`)
- `/api/FunctionApi/telemetry/stats` - Get statistics

### POST
- `/api/FunctionApi/telemetry` - Create telemetry record
- `/api/FunctionApi/command` - Send command to device

## Deployment

```bash
az login
func azure functionapp publish imasFuncxjnonrzaxqrsg
```

Configure Application Settings in Azure Portal:
- `COSMOS_DB_ENDPOINT`
- `COSMOS_DB_KEY`
- `COSMOS_DB_DATABASE`
- `COSMOS_DB_CONTAINER`
- `EVENT_HUB_CONNECTION_STRING`
- `EVENT_HUB_NAME`
- `IOTHUB_CONNECTION_STRING`

## Architecture

```
IoT Device → IoT Hub → Event Hub → FunctionTelemetry → Cosmos DB
                                                              ↓
                                                    FunctionApi (HTTP)
                                                              ↓
                                                      TouchDesigner
```

## Functions

- **FunctionApi**: HTTP trigger for REST API
- **FunctionTelemetry**: Event Hub trigger for telemetry processing
