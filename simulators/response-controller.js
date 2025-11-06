const axios = require('axios');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const API_KEY = process.env.API_KEY || 'museum-artifact-api-key-2024';
const POLLING_INTERVAL = 3000;

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

function playSound(soundConfig) {
  console.log(`\n${colors.cyan}🔊 SOUND SYSTEM${colors.reset}`);
  console.log(`   File: ${colors.bright}${soundConfig.file}${colors.reset}`);
  console.log(`   Volume: ${soundConfig.volume}%`);
  console.log(`   Duration: ${soundConfig.duration}ms`);
  
  const duration = soundConfig.duration;
  const steps = 20;
  const stepTime = duration / steps;
  
  let progress = 0;
  const interval = setInterval(() => {
    progress++;
    const bar = '█'.repeat(progress) + '░'.repeat(steps - progress);
    process.stdout.write(`\r   Playing: [${bar}] ${Math.floor(progress / steps * 100)}%`);
    
    if (progress >= steps) {
      clearInterval(interval);
      console.log(`\n   ${colors.green}✓ Sound playback complete${colors.reset}`);
    }
  }, stepTime);
}

function controlLights(lightConfig) {
  console.log(`\n${colors.yellow}💡 LIGHT SYSTEM${colors.reset}`);
  console.log(`   Color: ${colors.bright}${lightConfig.color}${colors.reset}`);
  console.log(`   Pattern: ${lightConfig.pattern}`);
  console.log(`   Intensity: ${lightConfig.intensity}%`);
  console.log(`   Duration: ${lightConfig.duration}ms`);
  
  const patterns = {
    solid: '●●●●●●●●●●',
    blink: '●○●○●○●○●○',
    pulse: '◐◑◐◑◐◑◐◑◐◑',
    rainbow: '🔴🟠🟡🟢🔵🟣',
  };
  
  console.log(`   Display: ${patterns[lightConfig.pattern] || '●●●●●●●●●●'}`);
  
  setTimeout(() => {
    console.log(`   ${colors.green}✓ Light sequence complete${colors.reset}`);
  }, lightConfig.duration);
}

function executeResponse(responseData) {
  const { artifactId, artifactName, response, triggeredAt } = responseData;
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`${colors.bright}🎯 RESPONSE TRIGGERED${colors.reset}`);
  console.log(`   Artifact: ${artifactName} (${artifactId})`);
  console.log(`   Time: ${new Date(triggeredAt).toLocaleString()}`);
  console.log(`   Type: ${response.type.toUpperCase()}`);
  console.log(`${'='.repeat(60)}`);
  
  if (response.sound) {
    playSound(response.sound);
  }
  
  if (response.light) {
    controlLights(response.light);
  }
  
  if (!response.sound && !response.light) {
    console.log(`\n   ${colors.red}⚠️  No response configured${colors.reset}`);
  }
}

async function monitorInteractions() {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/api/interactions`,
      {
        params: {
          processed: false,
          limit: 10,
          hours: 1,
        },
        headers: {
          'X-API-Key': API_KEY,
        },
      }
    );

    if (response.data.success && response.data.count > 0) {
      for (const interaction of response.data.data) {
        if (interaction.sensorData.value > 60 && !interaction.responseTriggered) {
          const triggerResponse = await axios.post(
            `${API_BASE_URL}/api/responses/trigger`,
            {
              artifactId: interaction.artifactId,
              interactionId: interaction._id,
            },
            {
              headers: {
                'Content-Type': 'application/json',
                'X-API-Key': API_KEY,
              },
            }
          );

          if (triggerResponse.data.success) {
            executeResponse(triggerResponse.data.data);
          }

          await axios.patch(
            `${API_BASE_URL}/api/interactions/${interaction._id}/process`,
            {},
            {
              headers: {
                'X-API-Key': API_KEY,
              },
            }
          );
        }
      }
    }
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error(`${colors.red}❌ Cannot connect to API at ${API_BASE_URL}${colors.reset}`);
    } else {
      console.error(`${colors.red}❌ Error:${colors.reset}`, error.response?.data || error.message);
    }
  }
}

async function testArtifactResponse(artifactId) {
  try {
    console.log(`\n${colors.cyan}🧪 Testing response for artifact: ${artifactId}${colors.reset}\n`);
    
    const response = await axios.post(
      `${API_BASE_URL}/api/responses/test/${artifactId}`,
      {},
      {
        headers: {
          'X-API-Key': API_KEY,
        },
      }
    );

    if (response.data.success) {
      executeResponse({
        artifactId: response.data.data.artifactId,
        artifactName: response.data.data.artifactName,
        response: response.data.data.testResponse,
        triggeredAt: new Date(),
      });
    }
  } catch (error) {
    console.error(`${colors.red}❌ Error:${colors.reset}`, error.response?.data || error.message);
  }
}

function startMonitoring() {
  console.log(`${colors.bright}🚀 Response Controller Simulator Started${colors.reset}`);
  console.log(`📍 API URL: ${API_BASE_URL}`);
  console.log(`🔑 API Key: ${API_KEY.substring(0, 10)}...`);
  console.log(`⏱️  Polling Interval: ${POLLING_INTERVAL}ms`);
  console.log(`\n${colors.green}Monitoring for interactions...${colors.reset}`);
  console.log('Press Ctrl+C to stop\n');

  setInterval(monitorInteractions, POLLING_INTERVAL);
}

const args = process.argv.slice(2);

if (args.includes('--test') && args.length >= 2) {
  // Test mode with artifact ID
  const artifactId = args[args.indexOf('--test') + 1];
  testArtifactResponse(artifactId).then(() => {
    setTimeout(() => process.exit(0), 6000); // Exit after response completes
  });
} else if (args.includes('--help')) {
  console.log(`
${colors.bright}Response Controller Simulator${colors.reset}

Usage:
  node response-controller.js              ${colors.cyan}# Start monitoring mode${colors.reset}
  node response-controller.js --test ART001  ${colors.cyan}# Test specific artifact${colors.reset}
  node response-controller.js --help         ${colors.cyan}# Show this help${colors.reset}

Environment Variables:
  API_BASE_URL  API server URL (default: http://localhost:3000)
  API_KEY       API authentication key
  `);
  process.exit(0);
} else {
  startMonitoring();
}

process.on('SIGINT', () => {
  console.log(`\n\n${colors.yellow}👋 Stopping response controller...${colors.reset}`);
  process.exit(0);
});

