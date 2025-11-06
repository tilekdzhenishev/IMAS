const axios = require('axios');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const API_KEY = process.env.API_KEY || 'museum-artifact-api-key-2024';
const SIMULATION_INTERVAL = 5000;

const ARTIFACT_IDS = ['ART001', 'ART002', 'ART003'];

const DEVICE_INFO = {
  deviceId: 'SENSOR-SIM-001',
  firmwareVersion: '1.2.3',
  batteryLevel: 85,
  signalStrength: -45,
};

const SENSOR_TYPES = ['proximity', 'touch', 'motion', 'temperature'];

function generateSensorData() {
  const type = SENSOR_TYPES[Math.floor(Math.random() * SENSOR_TYPES.length)];
  let value, unit;

  switch (type) {
    case 'proximity':
      value = Math.floor(Math.random() * 200);
      unit = 'cm';
      break;
    case 'touch':
      value = Math.floor(Math.random() * 100);
      unit = 'pressure';
      break;
    case 'motion':
      value = Math.floor(Math.random() * 10);
      unit = 'intensity';
      break;
    case 'temperature':
      value = 20 + Math.random() * 10;
      unit = 'celsius';
      break;
    default:
      value = Math.floor(Math.random() * 100);
      unit = 'raw';
  }

  return {
    type,
    value: parseFloat(value.toFixed(2)),
    unit,
    rawData: {
      timestamp: new Date().toISOString(),
      sampleRate: 100,
    },
  };
}

async function sendInteraction(artifactId) {
  try {
    const sensorData = generateSensorData();
    
    const payload = {
      artifactId,
      sensorData,
      interactionType: sensorData.value > 50 ? 'engaged' : 'detected',
      deviceInfo: DEVICE_INFO,
      metadata: {
        visitorCount: Math.floor(Math.random() * 5) + 1,
        timeOfDay: new Date().getHours() < 12 ? 'morning' : 'afternoon',
      },
    };

    console.log(`\n📡 Sending sensor data from ${artifactId}:`);
    console.log(`   Sensor Type: ${sensorData.type}`);
    console.log(`   Value: ${sensorData.value} ${sensorData.unit}`);
    console.log(`   Interaction: ${payload.interactionType}`);

    const response = await axios.post(
      `${API_BASE_URL}/api/interactions`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': API_KEY,
        },
      }
    );

    if (response.data.success) {
      console.log(`   ✅ Interaction recorded successfully`);
      console.log(`   📊 Artifact: ${response.data.data.artifact.name}`);
      
      const artifact = response.data.data.artifact;
      if (artifact.responsePattern) {
        console.log(`   🎨 Response Pattern: ${artifact.responsePattern.type}`);
        
        if (sensorData.value > 70) {
          await triggerResponse(artifactId, response.data.data.interaction._id);
        }
      }
    }
  } catch (error) {
    console.error(`   ❌ Error sending interaction:`, error.response?.data || error.message);
  }
}

async function triggerResponse(artifactId, interactionId) {
  try {
    console.log(`   🎯 Triggering response for ${artifactId}...`);
    
    const response = await axios.post(
      `${API_BASE_URL}/api/responses/trigger`,
      {
        artifactId,
        interactionId,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': API_KEY,
        },
      }
    );

    if (response.data.success) {
      const { sound, light } = response.data.data.response;
      console.log(`   🔊 Sound: ${sound ? '✓ Playing ' + sound.file : '✗ Disabled'}`);
      console.log(`   💡 Light: ${light ? '✓ ' + light.pattern + ' (' + light.color + ')' : '✗ Disabled'}`);
    }
  } catch (error) {
    console.error(`   ❌ Error triggering response:`, error.response?.data || error.message);
  }
}

function startSimulation() {
  console.log('🚀 IoT Sensor Simulator Started');
  console.log(`📍 API URL: ${API_BASE_URL}`);
  console.log(`🔑 API Key: ${API_KEY.substring(0, 10)}...`);
  console.log(`⏱️  Simulation Interval: ${SIMULATION_INTERVAL}ms`);
  console.log(`🎨 Monitoring Artifacts: ${ARTIFACT_IDS.join(', ')}`);
  console.log('\nPress Ctrl+C to stop\n');

  setInterval(() => {
    const artifactId = ARTIFACT_IDS[Math.floor(Math.random() * ARTIFACT_IDS.length)];
    
    if (Math.random() < 0.7) {
      sendInteraction(artifactId);
    }
  }, SIMULATION_INTERVAL);
}

async function testMode() {
  console.log('🧪 Test Mode: Sending single interaction\n');
  await sendInteraction(ARTIFACT_IDS[0]);
  console.log('\n✅ Test complete');
  process.exit(0);
}

if (process.argv.includes('--test')) {
  testMode();
} else {
  startSimulation();
}

process.on('SIGINT', () => {
  console.log('\n\n👋 Stopping sensor simulator...');
  process.exit(0);
});

