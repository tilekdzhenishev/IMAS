# Interactive Museum Artifact System (IMAS)

IoT-based museum artifact interaction system with Azure Functions for telemetry processing and REST API.

## Architecture

### System Overview

```
IoT Device → IoT Hub → Event Hub → FunctionTelemetry → Cosmos DB
                                                              ↓
                                                    FunctionApi (HTTP)
                                                              ↓
                                                      TouchDesigner
```

### C4 Diagrams

#### Context Diagram

![C4 Context Diagram](public/images/Untitled%20Diagram-C4%20-%20Context.drawio.png)

High-level view of the system showing interactions between users, IoT devices, and external systems.

#### Container Diagram

![C4 Container Diagram](public/images/Container.drawio.png)

Detailed view of the system's containers (Azure Functions, databases, and external services) and their interactions.

## Project Structure

```
IMAS/
├── backend/              # Azure Functions
│   ├── src/
│   │   ├── functions/
│   │   │   ├── FunctionApi.js          # HTTP API
│   │   │   └── FunctionTelemetry.js    # Event Hub trigger
│   │   └── index.js
│   ├── package.json
│   └── README.md
├── simulator/            # IoT device simulator
│   └── iot-simulator.js
├── touchdesigner/        # TouchDesigner integration scripts
│   └── simple_script.py
└── README.md
```

## Quick Start

### Backend (Azure Functions)

```bash
cd backend
npm install
npm start
```

### IoT Simulator

```bash
cd simulator
npm install

# Create .env file in project root with IOT_DEVICE_CONNECTION_STRING
cp ../.env.example ../.env
# Edit .env with your connection string

node iot-simulator.js
```

### TouchDesigner

See `touchdesigner/simple_script.py` for integration example.

## Deployment

```bash
cd backend
func azure functionapp publish imasFuncxjnonrzaxqrsg
```

## Documentation

- [Backend README](./backend/README.md) - Azure Functions documentation
- [TouchDesigner Scripts](./touchdesigner/) - Integration examples

## Technologies

- Azure Functions (Node.js)
- Azure IoT Hub
- Azure Cosmos DB
- Azure Event Hub
- TouchDesigner
