# Logistics Inventory Management System

A full-stack ERP-style inventory management system built with .NET Core Web API and Blazor Server, featuring multi-tenant architecture, CSV import capabilities, and Azure deployment support.

## Architecture

```
LogisticsInventory/
├── src/
│   ├── LogisticsAPI/          # .NET 8 Web API
│   │   ├── Controllers/       # 8 REST controllers (JSON + XML)
│   │   ├── Data/              # EF Core DbContext with multi-tenant filters
│   │   ├── DTOs/              # Request/Response data contracts
│   │   ├── Middleware/        # Tenant resolution, error handling
│   │   ├── Models/            # 8 domain entities with relationships
│   │   ├── Repositories/     # Generic + specialized repository pattern
│   │   ├── Services/         # Business logic layer
│   │   └── Validation/       # Custom validation attributes
│   └── LogisticsUI/          # Blazor Server frontend
│       ├── Pages/            # 9 interactive pages
│       └── Shared/           # Layout and navigation
├── tests/
│   └── LogisticsAPI.Tests/   # xUnit tests (40+ test methods)
├── azure/                    # ARM deployment templates
├── data/samples/             # Sample CSV files
└── .github/workflows/        # CI/CD pipeline
```

## Features

- **Inventory Management**: Full CRUD with pagination, search, and low-stock alerts
- **Category & Warehouse**: Organize items with capacity tracking and utilization metrics
- **Supplier & Purchase Orders**: Manage suppliers with order workflow (Pending → Approved → Received)
- **Stock Movements**: Track IN/OUT/ADJUSTMENT with full audit history
- **CSV Import**: Bulk import with field mapping, validation, and error recovery
- **Property Management**: Track properties, owners, and reservations with financial calculations
- **Reports**: Inventory valuation by category/warehouse, low stock alerts
- **Multi-Tenant**: Data isolation via EF Core global query filters with X-Tenant-Id header

## Tech Stack

- **Backend**: .NET 8, ASP.NET Core Web API, Entity Framework Core 9
- **Frontend**: Blazor Server with Bootstrap 5
- **Database**: SQLite (development), SQL Server (production)
- **Testing**: xUnit, Moq, EF Core InMemory provider
- **CI/CD**: GitHub Actions
- **Deployment**: Azure App Service with ARM templates

## API Endpoints

All endpoints support JSON and XML content negotiation.

| Resource | Endpoints |
|-|-|
| Inventory | `GET/POST/PUT/DELETE /api/inventory`, `GET /api/inventory/low-stock` |
| Categories | `GET/POST/PUT/DELETE /api/category` |
| Warehouses | `GET/POST/PUT/DELETE /api/warehouse`, `GET /api/warehouse/{id}/utilization` |
| Suppliers | `GET/POST/PUT/DELETE /api/supplier` |
| Purchase Orders | `GET/POST /api/purchaseorder`, `PUT /api/purchaseorder/{id}/status` |
| Stock Movements | `GET/POST /api/stockmovement`, `GET /api/stockmovement/item/{id}/history` |
| Import | `POST /api/import/inventory` |
| Reports | `GET /api/report/valuation`, `GET /api/report/low-stock`, `GET /api/report/total-value` |

## Getting Started

### Prerequisites

- .NET 8 SDK
- Node.js (optional, for frontend tooling)

### Run Locally

```bash
# Clone and restore
git clone https://github.com/yourusername/LogisticsInventorySystem.git
cd LogisticsInventorySystem
dotnet restore

# Run the API
dotnet run --project src/LogisticsAPI

# Run the Blazor frontend (separate terminal)
dotnet run --project src/LogisticsUI

# Run tests
dotnet test
```

### Configuration

Development uses SQLite by default. For SQL Server, update `appsettings.json`:

```json
{
  "ConnectionStrings": {
    "SqlServer": "Server=localhost;Database=LogisticsInventory;Trusted_Connection=True;"
  }
}
```

## Design Patterns

- **Repository Pattern**: Generic `IRepository<T>` with specialized `IInventoryRepository`
- **Service Layer**: Business logic encapsulated in services (Inventory, CSV Import, Reporting, Financial)
- **Factory Pattern**: `TestDbContextFactory` for test database creation
- **Strategy Pattern**: Configurable database providers (SQLite/SQL Server) via environment
- **Data Transfer Objects**: Separate request/response models for API contracts
- **Multi-Tenant Architecture**: Global query filters with automatic tenant ID assignment

## Architecture Decisions

- **Blazor Server over React/Angular** — Full-stack C# eliminates JavaScript context switching and allows shared domain models between server and UI. Blazor's component model with SignalR provides real-time updates for inventory changes without building a separate WebSocket layer.

- **Entity Framework Core over Dapper** — EF Core's migrations handle schema evolution as the inventory model grew (adding CSV import, audit fields, tenant isolation). Navigation properties simplify queries across related entities (items → categories → suppliers). LINQ provides type-safe queries that catch errors at compile time.

- **Multi-tenant architecture** — Single deployment serves multiple warehouses or organizations. Tenant isolation via `TenantId` column with global query filters prevents data leaks between tenants. Shared infrastructure reduces operational overhead compared to per-tenant databases.

- **CSV import with validation pipeline** — Bulk data entry is the primary workflow for warehouse inventory. Two-pass validation (parse → validate → commit) prevents partial imports that would leave the database in an inconsistent state. Detailed error reporting per row helps users fix data issues before re-importing.

- **ASP.NET Core Web API + Blazor hybrid** — API-first design allows future mobile/third-party integrations. Blazor Server pages consume the same API endpoints, ensuring the API is battle-tested through daily use. Swagger documentation auto-generated from controller attributes.

## Testing

```bash
dotnet test --verbosity normal
```

Test coverage includes:
- Inventory service CRUD operations and business rules
- CSV import with validation, error recovery, and duplicate handling
- Repository pattern operations (generic and specialized)
- DTO validation with custom attributes
- Multi-tenant data isolation
- Financial calculation accuracy

## Deployment

See [AZURE_DEPLOYMENT.md](AZURE_DEPLOYMENT.md) for detailed Azure deployment instructions.
