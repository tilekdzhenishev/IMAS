# Interactive Museum Artifact System (IMAS)

IoT-based museum artifact interaction system with Azure Functions for telemetry processing and REST API.

## Architecture

### System Overview

## 🏗️ Architecture

```
┌─────────────────┐
│  IoT Sensors    │  (Proximity, Touch, Motion, Temperature)
│  at Artifacts   │
└────────┬────────┘
         │ HTTP POST (Sensor Data)
         ▼
┌─────────────────┐
│   REST API      │  (Node.js + Express + MongoDB)
│ Microsoft Azure │  • Authentication
│   App Service   │  • Data Validation
│                 │  • Business Logic
│                 │  • Analytics
└────────┬────────┘
         │ HTTP POST (Response Commands)
         ▼
┌─────────────────┐
│   Response      │  (Lights + Sound Controller)
│   Controllers   │
└─────────────────┘
```

## 📁 Project Structure

```
IMAS/
├── src/
│   ├── config/
│   │   ├── database.js          # MongoDB connection
│   │   └── logger.js            # Winston logger configuration
│   ├── middleware/
│   │   ├── auth.js              # API key authentication
│   │   └── errorHandler.js     # Error handling middleware
│   ├── models/
│   │   ├── Artifact.js          # Artifact schema & model
│   │   └── Interaction.js       # Interaction schema & model
│   ├── routes/
│   │   ├── artifacts.js         # Artifact CRUD endpoints
│   │   ├── interactions.js      # Interaction logging endpoints
│   │   ├── responses.js         # Response trigger endpoints
│   │   └── stats.js             # Analytics endpoints
│   └── server.js                # Express app & server setup
├── simulators/
│   ├── sensor-simulator.js      # IoT sensor simulator
│   └── response-controller.js   # Response system simulator
├── scripts/
│   └── seed-data.js             # Database seeding script
├── logs/                        # Application logs
├── .env.example                 # Environment variables template
├── .gitignore
├── package.json
├──README.md
├── diagram1.jpg
└── diagram2.jpg
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v14 or higher)
- **MongoDB** (v4.4 or higher)
  - Azure Cosmos DB (MongoDB API) OR
  - MongoDB Atlas OR
  - Local MongoDB installation

### Installation

1. **Clone the repository**
   ```bash
   cd /Users/tilek/Desktop/IMAS
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   # Server Configuration
   PORT=3000
   NODE_ENV=development

   # Database Configuration (Azure Cosmos DB)
   MONGODB_URI=mongodb://localhost:27017/museum-artifacts
   # For Azure Cosmos DB (MongoDB API):
   # MONGODB_URI=mongodb://your-account:your-key@your-account.mongo.cosmos.azure.com:10255/?ssl=true&replicaSet=globaldb

   # Azure Configuration
   AZURE_REGION=eastus
   API_BASE_URL=http://localhost:3000

   # Security
   API_KEY=museum-artifact-api-key-2024

   # Logging
   LOG_LEVEL=info
   ```

4. **Start MongoDB** (if using local installation)
   ```bash
   mongod
   ```

5. **Seed the database** with sample artifacts
   ```bash
   node scripts/seed-data.js
   ```

6. **Start the API server**
   ```bash
   npm start
   # or for development with auto-reload:
   npm run dev
   ```

   The server will start at `http://localhost:3000`

## 🎮 Usage

### Running the System

#### 1. Start the API Server
```bash
npm start
```

#### 2. Run the IoT Sensor Simulator
In a new terminal:
```bash
npm run simulate-sensor
# or
node simulators/sensor-simulator.js

# Test mode (single interaction):
node simulators/sensor-simulator.js --test
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

## 🧪 Testing

Run test script:
```bash
npm test
```

Test individual components:
```bash
# Test sensor simulation (single event)
node simulators/sensor-simulator.js --test

# Test response for specific artifact
node simulators/response-controller.js --test ART001
```

## 🚢 Deployment to Microsoft Azure

### Azure App Service Deployment

1. **Create Azure Resources**
   ```bash
   # Login to Azure
   az login
   
   # Create resource group
   az group create --name imas-rg --location eastus
   
   # Create App Service plan
   az appservice plan create --name imas-plan --resource-group imas-rg --sku B1 --is-linux
   
   # Create Web App
   az webapp create --resource-group imas-rg --plan imas-plan --name imas-api --runtime "NODE|18-lts"
   ```

2. **Configure Azure Cosmos DB (MongoDB API)**
   ```bash
   # Create Cosmos DB account
   az cosmosdb create --name imas-cosmos --resource-group imas-rg --kind MongoDB
   
   # Get connection string
   az cosmosdb keys list --name imas-cosmos --resource-group imas-rg --type connection-strings
   ```

3. **Set Environment Variables**
   ```bash
   az webapp config appsettings set --resource-group imas-rg --name imas-api --settings \
     NODE_ENV=production \
     API_KEY=your-secure-key \
     MONGODB_URI=your-cosmos-db-connection-string \
     LOG_LEVEL=info
   ```

4. **Deploy Application**
   ```bash
   # Using Azure CLI
   az webapp up --name imas-api --resource-group imas-rg
   
   # Or using Git deployment
   git remote add azure https://imas-api.scm.azurewebsites.net:443/imas-api.git
   git push azure main
   ```

5. **Enable Azure Application Insights**
   ```bash
   az extension add --name application-insights
   az monitor app-insights component create --app imas-insights --location eastus --resource-group imas-rg
   ```

### Production Checklist

- ✅ Set `NODE_ENV=production`
- ✅ Use strong `API_KEY`
- ✅ Configure Azure Cosmos DB connection
- ✅ Enable HTTPS (automatic with Azure App Service)
- ✅ Configure CORS in Azure portal
- ✅ Enable Azure Application Insights for monitoring
- ✅ Set up Azure Monitor alerts
- ✅ Configure auto-scaling in App Service plan

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 👥 Authors

- **Your Name** - Initial work

## 🙏 Acknowledgments

- Museum IoT best practices
- Express.js community
- MongoDB documentation
- Node.js ecosystem

## System Architecture

System Architecture Diagram(diagram1.jpg, diagram2.jpg)

## 📞 Support

For support, please open an issue in the GitHub repository or contact the development team.

## 🔗 Additional Resources

- [Azure Deployment Guide](AZURE_DEPLOYMENT.md) - Complete guide for deploying to Microsoft Azure
- [API Examples](API_EXAMPLES.md) - Ready-to-use API request examples
- [Quick Start](QUICKSTART.md) - Get started in 5 minutes

- [Backend README](./backend/README.md) - Azure Functions documentation
- [TouchDesigner Scripts](./touchdesigner/) - Integration examples

## Technologies

- Azure Functions (Node.js)
- Azure IoT Hub
- Azure Cosmos DB
- Azure Event Hub
- TouchDesigner
