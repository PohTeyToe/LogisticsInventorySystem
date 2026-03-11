# Azure Deployment Guide

## Live URLs

| Service | URL |
|-|-|
| API (Swagger) | https://logistics-inventory-api-abdallah.azurewebsites.net/swagger |
| Blazor UI | https://logistics-inventory-ui-abdallah.azurewebsites.net/ |
| Health Check | https://logistics-inventory-api-abdallah.azurewebsites.net/api/health |

## Azure Resources

| Resource | Name | SKU |
|-|-|-|
| Resource Group | `logistics-inventory-rg` | N/A |
| Region | Canada Central | N/A |
| App Service Plan | `logistics-inventory-plan` | F1 (Free) |
| API App Service | `logistics-inventory-api-abdallah` | Shared (F1) |
| UI App Service | `logistics-inventory-ui-abdallah` | Shared (F1) |
| SQL Server | `logistics-sql-server` | N/A |
| SQL Database | `LogisticsInventory` | Basic |

## Prerequisites

- Azure CLI installed and configured (`az login`)
- .NET 8 SDK
- An Azure subscription

## Deploying from Scratch

### 1. Create Resource Group

```bash
az group create --name logistics-inventory-rg --location canadacentral
```

### 2. Deploy Infrastructure (ARM Template)

```bash
az deployment group create \
  --resource-group logistics-inventory-rg \
  --template-file azure/arm-template.json \
  --parameters sqlAdminLogin=adminuser sqlAdminPassword=YourSecurePassword123!
```

This creates the SQL Server, database, App Service Plan, and API App Service.

### 3. Create the UI App Service (if not in ARM template)

```bash
az webapp create \
  --resource-group logistics-inventory-rg \
  --plan logistics-inventory-plan \
  --name logistics-inventory-ui-abdallah \
  --runtime "DOTNET|8.0"
```

### 4. Configure App Settings

```bash
# API
az webapp config appsettings set \
  --resource-group logistics-inventory-rg \
  --name logistics-inventory-api-abdallah \
  --settings ASPNETCORE_ENVIRONMENT=Production

# UI
az webapp config appsettings set \
  --resource-group logistics-inventory-rg \
  --name logistics-inventory-ui-abdallah \
  --settings ASPNETCORE_ENVIRONMENT=Production
```

### 5. Deploy Application

#### Option A: ZIP Deploy (Quick)

```bash
# API
dotnet publish src/LogisticsAPI/LogisticsAPI.csproj -c Release -o ./publish/api
cd publish/api && zip -r ../../deploy-api.zip . && cd ../..
az webapp deploy --resource-group logistics-inventory-rg \
  --name logistics-inventory-api-abdallah \
  --src-path deploy-api.zip

# UI
dotnet publish src/LogisticsUI/LogisticsUI.csproj -c Release -o ./publish/ui
cd publish/ui && zip -r ../../deploy-ui.zip . && cd ../..
az webapp deploy --resource-group logistics-inventory-rg \
  --name logistics-inventory-ui-abdallah \
  --src-path deploy-ui.zip
```

#### Option B: GitHub Actions

1. Go to Azure Portal > App Service > Deployment Center
2. Download the publish profile for each App Service
3. Add as GitHub secrets: `AZURE_API_PUBLISH_PROFILE` and `AZURE_UI_PUBLISH_PROFILE`
4. Push to `main` branch to trigger deployment

### 6. Run Database Migrations

```bash
dotnet ef database update \
  --project src/LogisticsAPI/LogisticsAPI.csproj \
  --connection "Server=tcp:logistics-sql-server.database.windows.net,1433;Database=LogisticsInventory;User ID=adminuser;Password=YourSecurePassword123!;Encrypt=True;"
```

## Redeployment (Quick Reference)

After making code changes, redeploy with:

```bash
# Rebuild and deploy API
dotnet publish src/LogisticsAPI/LogisticsAPI.csproj -c Release -o ./publish/api
cd publish/api && zip -r ../../deploy-api.zip . && cd ../..
az webapp deploy --resource-group logistics-inventory-rg \
  --name logistics-inventory-api-abdallah --src-path deploy-api.zip

# Rebuild and deploy UI
dotnet publish src/LogisticsUI/LogisticsUI.csproj -c Release -o ./publish/ui
cd publish/ui && zip -r ../../deploy-ui.zip . && cd ../..
az webapp deploy --resource-group logistics-inventory-rg \
  --name logistics-inventory-ui-abdallah --src-path deploy-ui.zip
```

## Tearing Down

```bash
# Delete everything in the resource group
az group delete --name logistics-inventory-rg --yes --no-wait
```

## Multi-Tenant Configuration

- Each request includes an `X-Tenant-Id` header
- Tenant data is automatically isolated via EF Core global query filters
- Default tenant ID is 1 when no header is provided

## Environment Variables

| Variable | Description |
|-|-|
| `ASPNETCORE_ENVIRONMENT` | Set to `Production` for Azure |
| `ConnectionStrings__SqlServer` | Azure SQL connection string (set via App Service Configuration) |

## Monitoring

- Health check endpoint: `GET /api/health`
- Azure Portal > App Service > Diagnose and solve problems for logs
- Application Insights recommended for production monitoring

## Scaling

The current deployment uses F1 (Free) tier. Upgrade via:

```bash
az appservice plan update \
  --resource-group logistics-inventory-rg \
  --name logistics-inventory-plan \
  --sku B1
```
