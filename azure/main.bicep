@description('Define the project name or prefix for all objects.')
@minLength(1)
@maxLength(11)
param projectName string = 'imas'

@description('The datacenter to use for the deployment.')
param location string = resourceGroup().location

@description('The SKU to use for the IoT Hub.')
param skuName string = 'S1'

@description('The number of IoT Hub units.')
param skuUnits int = 1

@description('Partitions used for the event stream.')
param d2cPartitions int = 4

@description('The name of the Cosmos DB database.')
param databaseName string = 'PlantDB'

@description('The name of the Cosmos DB container (table) for the current status.')
param containerName string = 'CurrentStatus'

param appInsightsLocation string = location

var iotHubName = '${projectName}Hub${uniqueString(resourceGroup().id)}'
var storageAccountName = '${toLower(projectName)}${uniqueString(resourceGroup().id)}'
var storageContainerName = '${toLower(projectName)}results'
var cosmosAccountName = '${toLower(projectName)}${uniqueString(resourceGroup().id)}cosmos'
var functionAppName = '${projectName}Func${uniqueString(resourceGroup().id)}'
var appServicePlanName = '${projectName}Plan${uniqueString(resourceGroup().id)}'
var applicationInsightsName = '${projectName}AppInsights${uniqueString(resourceGroup().id)}'

resource applicationInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: applicationInsightsName
  location: appInsightsLocation
  kind: 'web'
  properties: {
    Application_Type: 'web'
    Request_Source: 'rest'
  }
}

resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: storageAccountName
  location: location
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'Storage'
  properties: {
    allowBlobPublicAccess: false
    minimumTlsVersion: 'TLS1_2'
    supportsHttpsTrafficOnly: true
  }
}

resource container 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  name: '${storageAccountName}/default/${storageContainerName}'
  properties: {
    publicAccess: 'None'
  }
  dependsOn: [
    storageAccount
  ]
}

resource cosmosAccount 'Microsoft.DocumentDB/databaseAccounts@2023-09-15' = {
  name: cosmosAccountName
  location: location
  properties: {
    databaseAccountOfferType: 'Standard'
    locations: [
      {
        locationName: location
        failoverPriority: 0
      }
    ]
    consistencyPolicy: {
      defaultConsistencyLevel: 'Session'
    }
  }
}

resource cosmosDatabase 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases@2023-09-15' = {
  parent: cosmosAccount
  name: databaseName
  properties: {
    resource: {
      id: databaseName
    }
    options: {
      throughput: 400
    }
  }
}

resource cosmosContainer 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2023-09-15' = {
  parent: cosmosDatabase
  name: containerName
  properties: {
    resource: {
      id: containerName
      partitionKey: {
        paths: [
          '/id'
        ]
        kind: 'Hash'
      }
    }
    options: {}
  }
}

resource IoTHub 'Microsoft.Devices/IotHubs@2023-06-30' = {
  name: iotHubName
  location: location
  sku: {
    name: skuName
    capacity: skuUnits
  }
  properties: {
    minTlsVersion: '1.2'
    eventHubEndpoints: {
      events: {
        retentionTimeInDays: 1
        partitionCount: d2cPartitions
      }
    }
    routing: {
      fallbackRoute: {
        name: '$fallback'
        source: 'DeviceMessages'
        condition: 'true'
        endpointNames: [
          'events'
        ]
        isEnabled: true
      }
    }
    cloudToDevice: {
      maxDeliveryCount: 10
      defaultTtlAsIso8601: 'PT1H'
      feedback: {
        lockDurationAsIso8601: 'PT1M'
        ttlAsIso8601: 'PT1H'
        maxDeliveryCount: 10
      }
    }
  }
}

resource appServicePlan 'Microsoft.Web/serverfarms@2022-09-01' = {
  name: appServicePlanName
  location: location
  sku: {
    name: 'Y1' // Consumption Plan (Pay-as-you-go / Free tier)
    tier: 'Dynamic'
  }
}

resource functionApp 'Microsoft.Web/sites@2022-09-01' = {
  name: functionAppName
  location: location
  kind: 'functionapp'
  properties: {
    serverFarmId: appServicePlan.id
    httpsOnly: true
    siteConfig: {
      appSettings: [
        {
          name: 'AzureWebJobsStorage'
          value: 'DefaultEndpointsProtocol=https;AccountName=${storageAccountName};EndpointSuffix=${environment().suffixes.storage};AccountKey=${listKeys(storageAccount.id, '2023-01-01').keys[0].value}'
        }
        {
          name: 'APPINSIGHTS_INSTRUMENTATIONKEY'
          value: applicationInsights.properties.InstrumentationKey
        }
        {
          name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
          value: applicationInsights.properties.ConnectionString
        }
        {
          name: 'FUNCTIONS_WORKER_RUNTIME'
          value: 'node'
        }
        {
          name: 'FUNCTIONS_EXTENSION_VERSION'
          value: '~4'
        }
        {
          name: 'WEBSITE_NODE_DEFAULT_VERSION'
          value: '20'
        }
        {
          name: 'WEBSITE_CONTENTAZUREFILECONNECTIONSTRING'
          value: 'DefaultEndpointsProtocol=https;AccountName=${storageAccountName};EndpointSuffix=${environment().suffixes.storage};AccountKey=${listKeys(storageAccount.id, '2023-01-01').keys[0].value}'
        }
        {
          name: 'WEBSITE_CONTENTSHARE'
          value: toLower(functionAppName)
        }
        {
          name: 'IOTHUB_CONNECTION_STRING'
          value: 'HostName=${IoTHub.properties.hostName};SharedAccessKeyName=iothubowner;SharedAccessKey=${listKeys(IoTHub.id, '2023-06-30').value[0].primaryKey}'
        }
        {
          name: 'EVENT_HUB_CONNECTION_STRING'
          value: ''
        }
        {
          name: 'EVENT_HUB_NAME'
          value: IoTHub.properties.eventHubEndpoints.events.path
        }
        {
          name: 'COSMOS_DB_ENDPOINT'
          value: cosmosAccount.properties.documentEndpoint
        }
        {
          name: 'COSMOS_DB_KEY'
          value: listKeys(cosmosAccount.id, '2023-09-15').primaryMasterKey
        }
        {
          name: 'COSMOS_DB_DATABASE'
          value: 'PlantDB'
        }
        {
          name: 'COSMOS_DB_CONTAINER'
          value: 'CurrentStatus'
        }
      ]
    }
  }
  dependsOn: [
    storageAccount
    IoTHub
    cosmosAccount
    applicationInsights
  ]
}

output IOT_HUB_HOSTNAME string = IoTHub.properties.hostName
output IOTHUB_CONNECTION_STRING string = 'HostName=${IoTHub.properties.hostName};SharedAccessKeyName=iothubowner;SharedAccessKey=${listKeys(IoTHub.id, '2023-06-30').value[0].primaryKey}'
output EVENT_HUB_ENDPOINT string = IoTHub.properties.eventHubEndpoints.events.endpoint
output EVENT_HUB_NAME string = IoTHub.properties.eventHubEndpoints.events.path
output AzureWebJobsStorage string = 'DefaultEndpointsProtocol=https;AccountName=${storageAccountName};EndpointSuffix=${environment().suffixes.storage};AccountKey=${listKeys(storageAccount.id, '2023-01-01').keys[0].value}'
output WEBSITE_CONTENTAZUREFILECONNECTIONSTRING string = 'DefaultEndpointsProtocol=https;AccountName=${storageAccountName};EndpointSuffix=${environment().suffixes.storage};AccountKey=${listKeys(storageAccount.id, '2023-01-01').keys[0].value}'
output WEBSITE_CONTENTSHARE string = toLower(functionAppName)
output COSMOS_DB_ENDPOINT string = cosmosAccount.properties.documentEndpoint
output COSMOS_DB_KEY string = cosmosAccount.listKeys().primaryMasterKey
output functionAppNameForReference string = functionAppName
output applicationInsightsKey string = applicationInsights.properties.InstrumentationKey
