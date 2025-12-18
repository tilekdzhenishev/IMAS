const path = require('path');
// Load .env from project root (parent directory)
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const client = require('azure-iot-device').Client;
const Message = require('azure-iot-device').Message;
const Protocol = require('azure-iot-device-mqtt').Mqtt;

const connectionString = process.env.IOT_DEVICE_CONNECTION_STRING;

if (!connectionString) {
    console.error('Error: IOT_DEVICE_CONNECTION_STRING environment variable is not set');
    console.error('Please create .env file in project root with IOT_DEVICE_CONNECTION_STRING');
    console.error('Example: cp .env.example .env');
    process.exit(1);
}

function getDeviceId(connStr) {
    const parts = connStr.split(';');
    for (const part of parts) {
        if (part.startsWith('DeviceId=')) {
            return part.substring('DeviceId='.length);
        }
    }
    return 'unknown';
}

const deviceId = getDeviceId(connectionString);

const deviceClient = client.fromConnectionString(connectionString, Protocol);

function generateTelemetry() {
    const baseDistance = 20 + (Math.random() * 10 - 5); 
    const distance_cm = parseFloat(baseDistance.toFixed(1));

    return JSON.stringify({
        deviceId: deviceId,
        distance_cm: distance_cm,
        timestamp: new Date().toISOString()
    });
}

function sendTelemetry() {
    const data = generateTelemetry();
    const message = new Message(data);

    deviceClient.sendEvent(message, (err) => {
        if (err) {
            console.error(`[ERROR] Sending error: ${err.toString()}`);
        } else {
            console.log(`[SUCCESS] Sent: ${data}`);
        }
    });
}

deviceClient.open((err) => {
    if (err) {
        console.error(`[CRITICAL] Couldn't connect to IoT Hub: ${err.message}`);
    } else {
        console.log('[INFO] Successfully connected to Azure IoT Hub');
        
        setInterval(sendTelemetry, 5000); 
    }
});
