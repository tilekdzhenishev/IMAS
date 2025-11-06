/**
 * Simple API test script
 * Tests basic endpoints to verify the API is working
 */

const axios = require('axios');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const API_KEY = process.env.API_KEY || 'museum-artifact-api-key-2024';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bright: '\x1b[1m',
};

let testsPassed = 0;
let testsFailed = 0;

async function runTest(name, testFn) {
  try {
    process.stdout.write(`${colors.cyan}Testing: ${name}${colors.reset} ... `);
    await testFn();
    console.log(`${colors.green}✓ PASSED${colors.reset}`);
    testsPassed++;
  } catch (error) {
    console.log(`${colors.red}✗ FAILED${colors.reset}`);
    console.log(`  Error: ${error.message}`);
    if (error.response?.data) {
      console.log(`  Response: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    testsFailed++;
  }
}

async function testHealthCheck() {
  const response = await axios.get(`${API_BASE_URL}/health`);
  if (!response.data.success) throw new Error('Health check failed');
}

async function testGetArtifacts() {
  const response = await axios.get(`${API_BASE_URL}/api/artifacts`);
  if (!response.data.success) throw new Error('Get artifacts failed');
  if (!Array.isArray(response.data.data)) throw new Error('Response data is not an array');
}

async function testGetSingleArtifact() {
  const response = await axios.get(`${API_BASE_URL}/api/artifacts/ART001`);
  if (!response.data.success) throw new Error('Get single artifact failed');
  if (response.data.data.artifactId !== 'ART001') throw new Error('Wrong artifact returned');
}

async function testCreateInteraction() {
  const response = await axios.post(
    `${API_BASE_URL}/api/interactions`,
    {
      artifactId: 'ART001',
      sensorData: {
        type: 'proximity',
        value: 75,
        unit: 'cm',
      },
      interactionType: 'detected',
      deviceInfo: {
        deviceId: 'TEST-DEVICE-001',
      },
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,
      },
    }
  );
  if (!response.data.success) throw new Error('Create interaction failed');
}

async function testTriggerResponse() {
  const response = await axios.post(
    `${API_BASE_URL}/api/responses/trigger`,
    {
      artifactId: 'ART001',
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,
      },
    }
  );
  if (!response.data.success) throw new Error('Trigger response failed');
}

async function testGetStats() {
  const response = await axios.get(`${API_BASE_URL}/api/stats/overview`, {
    headers: {
      'X-API-Key': API_KEY,
    },
  });
  if (!response.data.success) throw new Error('Get stats failed');
}

async function testAuthenticationRequired() {
  try {
    await axios.post(`${API_BASE_URL}/api/interactions`, {
      artifactId: 'ART001',
      sensorData: { type: 'proximity', value: 50 },
    });
    throw new Error('Should have failed without API key');
  } catch (error) {
    if (error.response?.status !== 401) {
      throw new Error('Expected 401 unauthorized');
    }
  }
}

async function testInvalidArtifact() {
  try {
    await axios.get(`${API_BASE_URL}/api/artifacts/INVALID999`);
    throw new Error('Should have returned 404');
  } catch (error) {
    if (error.response?.status !== 404) {
      throw new Error('Expected 404 not found');
    }
  }
}

async function runAllTests() {
  console.log(`\n${colors.bright}${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.bright}  Interactive Museum Artifact System${colors.reset}`);
  console.log(`${colors.bright}  API Test Suite${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);
  console.log(`API URL: ${API_BASE_URL}\n`);

  await runTest('Health Check', testHealthCheck);
  await runTest('Get All Artifacts', testGetArtifacts);
  await runTest('Get Single Artifact', testGetSingleArtifact);
  await runTest('Create Interaction', testCreateInteraction);
  await runTest('Trigger Response', testTriggerResponse);
  await runTest('Get Statistics', testGetStats);
  await runTest('Authentication Required', testAuthenticationRequired);
  await runTest('Invalid Artifact (404)', testInvalidArtifact);

  console.log(`\n${colors.bright}${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.bright}Test Results:${colors.reset}`);
  console.log(`${colors.green}  ✓ Passed: ${testsPassed}${colors.reset}`);
  if (testsFailed > 0) {
    console.log(`${colors.red}  ✗ Failed: ${testsFailed}${colors.reset}`);
  }
  console.log(`  Total: ${testsPassed + testsFailed}`);
  console.log(`${colors.bright}${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

  process.exit(testsFailed > 0 ? 1 : 0);
}

// Check if server is running before starting tests
axios
  .get(`${API_BASE_URL}/health`)
  .then(() => {
    runAllTests();
  })
  .catch((error) => {
    console.error(`\n${colors.red}${colors.bright}Error: Cannot connect to API server${colors.reset}`);
    console.error(`${colors.yellow}Make sure the server is running at ${API_BASE_URL}${colors.reset}`);
    console.error(`${colors.yellow}Start the server with: npm start${colors.reset}\n`);
    process.exit(1);
  });

