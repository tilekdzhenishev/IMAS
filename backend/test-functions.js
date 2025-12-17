const axios = require('axios');

const fs = require('fs');
const path = require('path');

let settings = {};
try {
    const settingsPath = path.join(__dirname, 'local.settings.json');
    const settingsFile = fs.readFileSync(settingsPath, 'utf8');
    settings = JSON.parse(settingsFile).Values;
} catch (error) {
    console.error('Error loading local.settings.json:', error.message);
    console.log('Make sure local.settings.json exists in the backend directory');
    process.exit(1);
}

const FUNCTIONS_URL = process.env.FUNCTIONS_URL || 'http://localhost:7071';

const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

async function checkFunctionsRunning() {
    try {
        await axios.get(`${FUNCTIONS_URL}/api/FunctionApi/health`, { timeout: 2000 });
        return true;
    } catch (error) {
        if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
            log(`\nAzure Functions are not running on ${FUNCTIONS_URL}`, 'yellow');
            log(`   Start functions in another terminal:`, 'yellow');
            log(`   cd backend && npm start`, 'yellow');
            return false;
        }
        return true;
    }
}

async function testHealthCheck() {
    log('\nTesting Health Check Endpoint...', 'cyan');
    try {
        const response = await axios.get(`${FUNCTIONS_URL}/api/FunctionApi/health`, { timeout: 5000 });
        log(`Health Check: ${JSON.stringify(response.data, null, 2)}`, 'green');
        return true;
    } catch (error) {
        log(`Health Check Failed: ${error.message}`, 'red');
        if (error.code === 'ECONNREFUSED') {
            log(`   Failed to connect to ${FUNCTIONS_URL}`, 'red');
            log(`   Make sure functions are running: npm start`, 'yellow');
        } else if (error.code === 'ETIMEDOUT') {
            log(`   Request timeout`, 'red');
        } else if (error.response) {
            log(`   Status: ${error.response.status}`, 'red');
            log(`   Data: ${JSON.stringify(error.response.data)}`, 'red');
        } else {
            log(`   Code: ${error.code}`, 'red');
            log(`   Stack: ${error.stack}`, 'red');
        }
        return false;
    }
}

async function testGetTelemetry() {
    log('\nTesting Get Telemetry Endpoint...', 'cyan');
    try {
        const response = await axios.get(`${FUNCTIONS_URL}/api/FunctionApi/telemetry?limit=5`, { timeout: 10000 });
        log(`Get Telemetry: Found ${response.data.count} records`, 'green');
        if (response.data.data && response.data.data.length > 0) {
            log(`   Sample record:`, 'blue');
            console.log(JSON.stringify(response.data.data[0], null, 2));
        } else {
            log(`   No data in Cosmos DB. Run simulator to generate data.`, 'yellow');
        }
        return true;
    } catch (error) {
        log(`Get Telemetry Failed: ${error.message}`, 'red');
        if (error.code === 'ECONNREFUSED') {
            log(`   Failed to connect to functions`, 'red');
        } else if (error.response) {
            log(`   Status: ${error.response.status}`, 'red');
            log(`   Data: ${JSON.stringify(error.response.data)}`, 'red');
        } else {
            log(`   Code: ${error.code}`, 'red');
        }
        return false;
    }
}

async function testGetTelemetryByDevice() {
    log('\nTesting Get Telemetry by Device ID...', 'cyan');
    try {
        const deviceId = 'MySimulatedDevice';
        const response = await axios.get(`${FUNCTIONS_URL}/api/FunctionApi/telemetry?deviceId=${deviceId}&limit=3`, { timeout: 10000 });
        log(`Get Telemetry by Device: Found ${response.data.count} records for ${deviceId}`, 'green');
        if (response.data.data && response.data.data.length > 0) {
            log(`   Sample record:`, 'blue');
            console.log(JSON.stringify(response.data.data[0], null, 2));
        } else {
            log(`   No data for device ${deviceId}`, 'yellow');
        }
        return true;
    } catch (error) {
        log(`Get Telemetry by Device Failed: ${error.message}`, 'red');
        if (error.code === 'ECONNREFUSED') {
            log(`   Failed to connect to functions`, 'red');
        } else if (error.response) {
            log(`   Status: ${error.response.status}`, 'red');
            log(`   Data: ${JSON.stringify(error.response.data)}`, 'red');
        } else {
            log(`   Code: ${error.code}`, 'red');
        }
        return false;
    }
}

async function testGetLatestTelemetry() {
    log('\nTesting Get Latest Telemetry...', 'cyan');
    try {
        const response = await axios.get(`${FUNCTIONS_URL}/api/FunctionApi/telemetry/latest?limit=3`, { timeout: 10000 });
        log(`Get Latest Telemetry: Found ${response.data.count} records`, 'green');
        if (response.data.data && response.data.data.length > 0) {
            log(`   Latest records:`, 'blue');
            response.data.data.forEach((record, index) => {
                log(`   ${index + 1}. Device: ${record.deviceId}, Distance: ${record.distance_cm}cm, Time: ${record.timestamp}`, 'blue');
            });
        } else {
            log(`   No data in Cosmos DB`, 'yellow');
        }
        return true;
    } catch (error) {
        log(`Get Latest Telemetry Failed: ${error.message}`, 'red');
        if (error.code === 'ECONNREFUSED') {
            log(`   Failed to connect to functions`, 'red');
        } else if (error.response) {
            log(`   Status: ${error.response.status}`, 'red');
            log(`   Data: ${JSON.stringify(error.response.data)}`, 'red');
        } else {
            log(`   Code: ${error.code}`, 'red');
        }
        return false;
    }
}

async function testGetStats() {
    log('\nTesting Get Statistics...', 'cyan');
    try {
        const response = await axios.get(`${FUNCTIONS_URL}/api/FunctionApi/telemetry/stats`, { timeout: 10000 });
        log(`Get Statistics:`, 'green');
        console.log(JSON.stringify(response.data.stats, null, 2));
        return true;
    } catch (error) {
        log(`Get Statistics Failed: ${error.message}`, 'red');
        if (error.code === 'ECONNREFUSED') {
            log(`   Failed to connect to functions`, 'red');
        } else if (error.response) {
            log(`   Status: ${error.response.status}`, 'red');
            log(`   Data: ${JSON.stringify(error.response.data)}`, 'red');
        } else {
            log(`   Code: ${error.code}`, 'red');
        }
        return false;
    }
}

async function testApiInfo() {
    log('\nTesting API Info Endpoint...', 'cyan');
    try {
        const response = await axios.get(`${FUNCTIONS_URL}/api/FunctionApi`, { timeout: 5000 });
        log(`API Info:`, 'green');
        console.log(JSON.stringify(response.data, null, 2));
        return true;
    } catch (error) {
        log(`API Info Failed: ${error.message}`, 'red');
        if (error.code === 'ECONNREFUSED') {
            log(`   Failed to connect to ${FUNCTIONS_URL}`, 'red');
            log(`   Make sure functions are running: npm start`, 'yellow');
        } else if (error.response) {
            log(`   Status: ${error.response.status}`, 'red');
            log(`   Data: ${JSON.stringify(error.response.data)}`, 'red');
        } else {
            log(`   Code: ${error.code}`, 'red');
        }
        return false;
    }
}

async function runAllTests() {
    log('\nStarting Azure Functions API Tests', 'yellow');
    log(`Functions URL: ${FUNCTIONS_URL}`, 'yellow');
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'yellow');

    log('\nChecking if Functions are running...', 'cyan');
    const isRunning = await checkFunctionsRunning();
    if (!isRunning) {
        log('\nFunctions are not running. Start them before testing.', 'red');
        process.exit(1);
    }
    log('Functions available\n', 'green');

    const results = {
        healthCheck: await testHealthCheck(),
        apiInfo: await testApiInfo(),
        getTelemetry: await testGetTelemetry(),
        getTelemetryByDevice: await testGetTelemetryByDevice(),
        getLatestTelemetry: await testGetLatestTelemetry(),
        getStats: await testGetStats()
    };

    log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'yellow');
    log('Test Results Summary:', 'yellow');
    
    const passed = Object.values(results).filter(r => r).length;
    const total = Object.keys(results).length;
    
    Object.entries(results).forEach(([test, passed]) => {
        const status = passed ? '✅' : '❌';
        log(`   ${status} ${test}`, passed ? 'green' : 'red');
    });

    log(`\n${passed}/${total} tests passed`, passed === total ? 'green' : 'yellow');
    
    if (passed < total) {
        log('\nMake sure Azure Functions are running:', 'yellow');
        log('   cd backend && npm start', 'yellow');
        log('   Or: func start', 'yellow');
        process.exit(1);
    }
}

if (require.main === module) {
    runAllTests().catch(error => {
        log(`\nTest suite failed: ${error.message}`, 'red');
        process.exit(1);
    });
}

module.exports = {
    testHealthCheck,
    testGetTelemetry,
    testGetTelemetryByDevice,
    testGetLatestTelemetry,
    testGetStats,
    testApiInfo,
    runAllTests
};
