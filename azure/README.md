# Setup Guide

### Prerequisites

- **Node.js 20** (LTS)
- **Azure Functions Core Tools v4**
- **Azure CLI**
- **VS Code Extensions**: Azure Functions & Bicep

### Deploy Infrastructure

Use the provided Bicep template to provision all necessary Azure resources (IoT Hub, Cosmos DB, Functions, etc.).

```bash
# Login to Azure
az login

# Create a Resource Group
Step 1:
az group create --name <your resource group name> --location <location>
# Deploy the Bicep file
az deployment group create --resource-group <your resource group name> --template-file main.bicep

Step 2: Configure Backend
Navigate to the /backend directory.
Create a local.settings.json file.
Fill it with the values provided in the deployment outputs.

Important: For EVENT_HUB_CONNECTION_STRING, go to:
Azure Portal > IoT Hub > Hub Settings > Built-in endpoints. Copy the Event Hub-compatible endpoint (choose 'service' policy).

Step 3: Create and start the IoT Simulator
Register your device and start sending data:

# Create the device identity
az iot hub device-identity create --hub-name <your_hub_name> --device-id <your device name>

# Get the connection string
az iot hub device-identity connection-string show --hub-name <your_hub_name> --device-id <your device name>
Paste the connection string into simulator/iot-simulator.js.
Run: cd simulator && npm install && node iot-simulator.js

Step 4: Run Locally
To test the functions on your machine:
cd backend
npm install
func start

Step 5: Deploy to Production
To make your functions work in the cloud (not just locally), publish your code:
func azure functionapp publish <functionAppName_from_outputs>
```
