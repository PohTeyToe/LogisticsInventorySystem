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

## Quick Start

```bash
# 1. Clone and restore
git clone https://github.com/yourusername/LogisticsInventorySystem.git
cd LogisticsInventorySystem
dotnet restore

# 2. Start the API (runs on https://localhost:7001)
dotnet run --project src/LogisticsAPI

# 3. In a separate terminal, start the Blazor frontend (runs on https://localhost:7002)
dotnet run --project src/LogisticsUI

# 4. Open https://localhost:7002 in your browser
```

Try the API directly with curl:

```bash
# List inventory items
curl https://localhost:7001/api/inventory

# Check low stock (threshold defaults to 10)
curl https://localhost:7001/api/inventory/low-stock?threshold=5

# Import items from CSV
curl -X POST https://localhost:7001/api/import/inventory \
  -F "file=@data/samples/inventory.csv"
```

### Prerequisites

- .NET 8 SDK
- Node.js (optional, for frontend tooling)

### Configuration

Development uses SQLite by default. For SQL Server, update `appsettings.json`:

```json
{
  "ConnectionStrings": {
    "SqlServer": "Server=localhost;Database=LogisticsInventory;Trusted_Connection=True;"
  }
}
```

## Common Issues

| Problem | Solution |
|-|-|
| `HTTPS certificate error` | Run `dotnet dev-certs https --trust` to trust the dev certificate |
| `Port already in use` | Change the port in `Properties/launchSettings.json` or stop the other process |
| `SQLite database locked` | Ensure only one instance of the API is running at a time |
| `CSV import returns 400` | Verify the file has a `.csv` extension and includes header row with `SKU,Name,Quantity,UnitPrice` |
| `EF Core migration errors` | Delete `logistics.db` and restart — the database is auto-created on first run |

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

## Known Issues

- CSV import limited to ~10,000 rows per batch before timeout; larger files need chunking
- Multi-tenant query filter adds overhead to every database query, even single-tenant deployments
- Blazor Server requires persistent SignalR connection — poor experience on unreliable networks
- No barcode/QR code scanning integration for physical inventory counts
- Audit trail stores changes but doesn't support point-in-time inventory snapshots

## Roadmap

- [ ] Barcode scanning integration via mobile camera (Blazor WASM PWA)
- [ ] Real-time inventory sync across multiple warehouse locations
- [ ] Low-stock alerts with configurable thresholds per item
- [ ] Bulk export to Excel/CSV with custom column selection
- [ ] Integration with shipping providers (Canada Post, UPS) for order fulfillment

## Deployment

See [AZURE_DEPLOYMENT.md](AZURE_DEPLOYMENT.md) for detailed Azure deployment instructions.
