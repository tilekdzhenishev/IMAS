# Interactive Museum Artifact System (IMAS)

A comprehensive IoT-based museum artifact interaction system that detects visitor engagement through sensors, processes data via Microsoft Azure REST API, and triggers multi-sensory responses (lights and sound) at physical artifacts.

## 🎯 Project Overview

This system creates an engaging museum experience by:
- **Detecting** visitor interactions through IoT sensors (proximity, touch, motion, temperature)
- **Processing** interaction data through Azure-hosted REST API built with Node.js and Express
- **Responding** with synchronized light and sound displays at the artifact location
- **Logging** all interactions for analytics and insights using Azure services

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

#### 3. Run the Response Controller
In another terminal:
```bash
npm run simulate-response
# or
node simulators/response-controller.js

# Test specific artifact:
node simulators/response-controller.js --test ART001
```

### Testing the API

Check API health:
```bash
curl http://localhost:3000/health
```

## 📡 API Documentation

### Authentication

All protected endpoints require an API key in the request header:
```
X-API-Key: museum-artifact-api-key-2024
```

### Endpoints

#### Artifacts

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/artifacts` | Get all artifacts | No |
| GET | `/api/artifacts/:artifactId` | Get artifact by ID | No |
| POST | `/api/artifacts` | Create new artifact | Yes |
| PUT | `/api/artifacts/:artifactId` | Update artifact | Yes |
| DELETE | `/api/artifacts/:artifactId` | Delete artifact | Yes |
| PATCH | `/api/artifacts/:artifactId/toggle` | Toggle active status | Yes |

**Example: Create Artifact**
```bash
curl -X POST http://localhost:3000/api/artifacts \
  -H "Content-Type: application/json" \
  -H "X-API-Key: museum-artifact-api-key-2024" \
  -d '{
    "name": "Ancient Sculpture",
    "artifactId": "ART006",
    "description": "Beautiful marble sculpture",
    "location": {
      "room": "Greek Gallery",
      "section": "Sculptures"
    },
    "sensorConfig": {
      "type": "proximity",
      "sensitivity": 60,
      "threshold": 50
    },
    "responsePattern": {
      "type": "combined",
      "sound": {
        "enabled": true,
        "file": "greek-music.mp3",
        "volume": 70,
        "duration": 5000
      },
      "light": {
        "enabled": true,
        "color": "#FFFFFF",
        "pattern": "pulse",
        "intensity": 80,
        "duration": 5000
      }
    }
  }'
```

#### Interactions

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/interactions` | Log new interaction | Yes |
| GET | `/api/interactions` | Get all interactions | Yes |
| GET | `/api/interactions/:id` | Get interaction by ID | Yes |
| GET | `/api/interactions/artifact/:artifactId` | Get interactions for artifact | Yes |
| PATCH | `/api/interactions/:id/process` | Mark as processed | Yes |
| DELETE | `/api/interactions/:id` | Delete interaction | Yes |

**Example: Log Interaction**
```bash
curl -X POST http://localhost:3000/api/interactions \
  -H "Content-Type: application/json" \
  -H "X-API-Key: museum-artifact-api-key-2024" \
  -d '{
    "artifactId": "ART001",
    "sensorData": {
      "type": "proximity",
      "value": 45,
      "unit": "cm"
    },
    "interactionType": "detected",
    "deviceInfo": {
      "deviceId": "SENSOR-001",
      "firmwareVersion": "1.0.0"
    }
  }'
```

#### Responses

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/responses/trigger` | Trigger artifact response | Yes |
| POST | `/api/responses/test/:artifactId` | Test artifact response | Yes |
| GET | `/api/responses/history/:artifactId` | Get response history | Yes |

**Example: Trigger Response**
```bash
curl -X POST http://localhost:3000/api/responses/trigger \
  -H "Content-Type: application/json" \
  -H "X-API-Key: museum-artifact-api-key-2024" \
  -d '{
    "artifactId": "ART001",
    "interactionId": "507f1f77bcf86cd799439011"
  }'
```

#### Statistics

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/stats/overview` | System overview stats | Yes |
| GET | `/api/stats/artifact/:artifactId` | Artifact-specific stats | Yes |
| GET | `/api/stats/hourly` | Hourly interaction stats | Yes |

**Example: Get Overview**
```bash
curl http://localhost:3000/api/stats/overview \
  -H "X-API-Key: museum-artifact-api-key-2024"
```

## 🗄️ Data Models

### Artifact Model

```javascript
{
  name: String,                    // Artifact name
  artifactId: String,              // Unique identifier (e.g., "ART001")
  description: String,             // Description
  location: {
    room: String,                  // Room name
    section: String,               // Section within room
    coordinates: { x: Number, y: Number }
  },
  sensorConfig: {
    type: String,                  // proximity|touch|motion|temperature|custom
    sensitivity: Number,           // 0-100
    threshold: Number              // Trigger threshold
  },
  responsePattern: {
    type: String,                  // sound|light|combined
    sound: {
      enabled: Boolean,
      file: String,
      volume: Number,              // 0-100
      duration: Number             // milliseconds
    },
    light: {
      enabled: Boolean,
      color: String,               // Hex color
      pattern: String,             // solid|blink|pulse|rainbow
      intensity: Number,           // 0-100
      duration: Number             // milliseconds
    }
  },
  isActive: Boolean,
  metadata: {
    period: String,
    artist: String,
    yearCreated: Number,
    category: String
  },
  statistics: {
    totalInteractions: Number,
    lastInteraction: Date
  }
}
```

### Interaction Model

```javascript
{
  artifactId: String,              // Reference to artifact
  artifact: ObjectId,              // Populated artifact
  sensorData: {
    type: String,                  // Sensor type
    value: Number,                 // Sensor reading
    unit: String,                  // Measurement unit
    rawData: Mixed                 // Additional data
  },
  interactionType: String,         // detected|engaged|completed
  duration: Number,                // Interaction duration (ms)
  responseTriggered: Boolean,
  responseDetails: {
    sound: { played: Boolean, file: String },
    light: { activated: Boolean, pattern: String },
    triggeredAt: Date
  },
  deviceInfo: {
    deviceId: String,
    firmwareVersion: String,
    batteryLevel: Number,
    signalStrength: Number
  },
  processed: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

## 🔧 Configuration

### Sensor Types

- **proximity**: Detects visitor distance (cm)
- **touch**: Pressure sensors (0-100)
- **motion**: Movement detection (intensity 0-10)
- **temperature**: Temperature changes (°C)
- **custom**: Custom sensor implementations

### Response Patterns

#### Light Patterns
- **solid**: Constant illumination
- **blink**: On/off blinking
- **pulse**: Smooth fade in/out
- **rainbow**: Color cycling

#### Sound Configuration
- Supports MP3 audio files
- Volume control (0-100%)
- Duration in milliseconds

## 📊 Monitoring & Logs

Application logs are stored in the `logs/` directory:
- `combined.log`: All logs
- `error.log`: Error logs only

View logs in real-time:
```bash
tail -f logs/combined.log
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

---

**Built with ❤️ for interactive museum experiences**  
**Powered by Microsoft Azure** ☁️

