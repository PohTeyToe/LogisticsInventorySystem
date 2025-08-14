# Azure Deployment Guide

## Prerequisites

- Azure CLI installed and configured
- .NET 8 SDK
- An Azure subscription

## Quick Start

### 1. Create Resource Group

```bash
az group create --name logistics-inventory-rg --location eastus
```

### 2. Deploy Infrastructure

```bash
az deployment group create \
  --resource-group logistics-inventory-rg \
  --template-file azure/arm-template.json \
  --parameters sqlAdminLogin=adminuser sqlAdminPassword=YourSecurePassword123!
```

### 3. Configure App Service

```bash
az webapp config appsettings set \
  --resource-group logistics-inventory-rg \
  --name logistics-inventory-api \
  --settings ASPNETCORE_ENVIRONMENT=Production
```

### 4. Deploy Application

#### Option A: GitHub Actions (Recommended)

1. Go to Azure Portal > App Service > Deployment Center
2. Download the publish profile
3. Add it as a GitHub secret named `AZURE_WEBAPP_PUBLISH_PROFILE`
4. Push to `main` branch to trigger deployment

#### Option B: Manual Deployment

```bash
dotnet publish src/LogisticsAPI/LogisticsAPI.csproj -c Release -o ./publish
cd publish
zip -r ../deploy.zip .
az webapp deploy --resource-group logistics-inventory-rg \
  --name logistics-inventory-api \
  --src-path ../deploy.zip
```

### 5. Run Database Migrations

```bash
dotnet ef database update \
  --project src/LogisticsAPI/LogisticsAPI.csproj \
  --connection "Server=tcp:logistics-sql-server.database.windows.net,1433;Database=LogisticsInventory;User ID=adminuser;Password=YourSecurePassword123!;Encrypt=True;"
```

## Multi-Tenant Configuration

The application supports multi-tenant architecture:

- Each request includes an `X-Tenant-Id` header
- Tenant data is automatically isolated via EF Core global query filters
- Default tenant ID is 1 when no header is provided

## Environment Variables

| Variable | Description |
|-|-|
| `ASPNETCORE_ENVIRONMENT` | Set to `Production` for Azure |
| `ConnectionStrings__SqlServer` | Azure SQL connection string |

## Monitoring

- Application Insights is recommended for production monitoring
- Health check endpoint: `GET /api/report/total-value`

## Scaling

The ARM template deploys a B1 tier by default. Upgrade via:

```bash
az appservice plan update \
  --resource-group logistics-inventory-rg \
  --name logistics-inventory-plan \
  --sku S1
```
