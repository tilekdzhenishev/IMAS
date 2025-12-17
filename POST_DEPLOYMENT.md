# Post-Deployment Guide

## ✅ Deployment Status

Your Azure Functions are successfully deployed and running at:
- **API URL**: https://imasfuncxjnonrzaxqrsg.azurewebsites.net/api/FunctionApi
- **Health Check**: https://imasfuncxjnonrzaxqrsg.azurewebsites.net/api/FunctionApi/health

## 🔍 Step 1: Verify Azure Configuration

Before running the system, ensure all Application Settings are configured in Azure Portal:

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to your Function App: `imasFuncxjnonrzaxqrsg`
3. Go to **Configuration** → **Application settings**
4. Verify these settings exist:
   - `COSMOS_DB_ENDPOINT`
   - `COSMOS_DB_KEY`
   - `COSMOS_DB_DATABASE` (should be `PlantDB`)
   - `COSMOS_DB_CONTAINER` (should be `CurrentStatus`)
   - `EVENT_HUB_CONNECTION_STRING`
   - `EVENT_HUB_NAME` (should be `events`)
   - `IOTHUB_CONNECTION_STRING`

## 🚀 Step 2: Start IoT Simulator

The IoT simulator sends telemetry data to Azure IoT Hub, which triggers `FunctionTelemetry` to save data to Cosmos DB.

```bash
cd simulator
npm install  # if not already done

# Make sure .env file exists in project root with:
# IOT_DEVICE_CONNECTION_STRING=HostName=imasHubxjnonrzaxqrsg.azure-devices.net;DeviceId=MySimulatedDevice;SharedAccessKey=...

node iot-simulator.js
```

You should see output like:
```
[INFO] Successfully connected to Azure IoT Hub
[SUCCESS] Sent: {"deviceId":"MySimulatedDevice","distance_cm":18.5,"timestamp":"2025-12-17T11:35:00.000Z"}
```

## 📊 Step 3: Verify Data Flow

### Check if data is being received:

```bash
# Check latest telemetry
curl https://imasfuncxjnonrzaxqrsg.azurewebsites.net/api/FunctionApi/telemetry/latest?deviceId=MySimulatedDevice&limit=5

# Check statistics
curl https://imasfuncxjnonrzaxqrsg.azurewebsites.net/api/FunctionApi/telemetry/stats

# Health check
curl https://imasfuncxjnonrzaxqrsg.azurewebsites.net/api/FunctionApi/health
```

### Expected Flow:

```
IoT Simulator → IoT Hub → Event Hub → FunctionTelemetry → Cosmos DB
                                                                    ↓
                                                          FunctionApi (HTTP)
                                                                    ↓
                                                          Your API calls
```

## 🎨 Step 4: Connect TouchDesigner

Update `touchdesigner/simple_script.py` to use the Azure API URL:

```python
API_URL = "https://imasfuncxjnonrzaxqrsg.azurewebsites.net/api/FunctionApi"
```

Or use HTTP Request CHOP in TouchDesigner:
- **URL**: `https://imasfuncxjnonrzaxqrsg.azurewebsites.net/api/FunctionApi/telemetry/latest?deviceId=MySimulatedDevice&limit=1`
- **Method**: GET
- **Update Rate**: 1 second

## 🔧 Troubleshooting

### No data in API responses?

1. **Check FunctionTelemetry logs**:
   - Go to Azure Portal → Function App → Functions → FunctionTelemetry → Monitor
   - Check if the function is being triggered

2. **Verify Event Hub connection**:
   - Check `EVENT_HUB_CONNECTION_STRING` in Application Settings
   - Verify Event Hub name matches `EVENT_HUB_NAME`

3. **Check Cosmos DB**:
   - Verify `COSMOS_DB_ENDPOINT` and `COSMOS_DB_KEY` are correct
   - Check if database `PlantDB` and container `CurrentStatus` exist

4. **Test IoT Hub connection**:
   ```bash
   # In simulator directory
   node iot-simulator.js
   # Should connect successfully without errors
   ```

### API returns empty data?

- Wait 10-15 seconds after starting simulator (data needs to flow through Event Hub)
- Check device ID matches: `MySimulatedDevice`
- Verify FunctionTelemetry is processing messages (check Azure Portal logs)

## 📈 Monitoring

- **Application Insights**: Check Function App → Monitor → Log stream
- **Cosmos DB Metrics**: Azure Portal → Cosmos DB → Metrics
- **IoT Hub Metrics**: Azure Portal → IoT Hub → Metrics

## 🎯 Next Steps

1. ✅ Verify all Application Settings in Azure Portal
2. ✅ Start IoT Simulator and verify data flow
3. ✅ Test API endpoints
4. ✅ Connect TouchDesigner to Azure API
5. ✅ Monitor system performance

