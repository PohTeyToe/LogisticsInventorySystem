# LogisticsInventorySystem

[![API CI/CD](https://github.com/PohTeyToe/LogisticsInventorySystem/actions/workflows/azure-deploy.yml/badge.svg)](https://github.com/PohTeyToe/LogisticsInventorySystem/actions/workflows/azure-deploy.yml)
[![Frontend CI](https://github.com/PohTeyToe/LogisticsInventorySystem/actions/workflows/frontend-ci.yml/badge.svg)](https://github.com/PohTeyToe/LogisticsInventorySystem/actions/workflows/frontend-ci.yml)
[![CodeQL](https://github.com/PohTeyToe/LogisticsInventorySystem/actions/workflows/codeql.yml/badge.svg)](https://github.com/PohTeyToe/LogisticsInventorySystem/actions/workflows/codeql.yml)

Multi-tenant logistics inventory management platform with a .NET Core API and React dashboard. Built to explore enterprise patterns — multi-tenancy with tenant-isolated data, bulk import with row-level validation, and ERP-style CRUD — using a logistics/warehouse domain.

## Tech Stack

**Backend:** ASP.NET Core 8.0, Entity Framework Core, SQLite (dev) / Azure SQL (prod), JWT auth, SignalR, Serilog

**Frontend:** React 19, TypeScript 5.9, Vite, TanStack Query, CSS Modules, Recharts

**Infrastructure:** Azure App Service, Docker Compose, GitHub Actions CI/CD, Claude AI code review

## Quick Start

```bash
# Run API + React frontend together
make dev

# Run tests (API + frontend)
make test

# Lint frontend
make lint

# Docker (SQL Server + API + frontend)
make docker-up
```

### Prerequisites

- .NET 8 SDK
- Node.js 22+
- Docker (optional, for full stack)

## Architecture

```
src/
├── LogisticsAPI/              # ASP.NET Core 8.0 Web API
│   ├── Controllers/           # REST endpoints (JSON + XML)
│   ├── Data/                  # EF Core context, multi-tenant filters, migrations
│   ├── Models/                # Domain entities & DTOs
│   ├── Middleware/            # Tenant resolution, rate limiting, error handling
│   ├── Repositories/         # Generic + specialized repository pattern
│   ├── Services/             # Business logic layer
│   ├── Hubs/                 # SignalR real-time inventory updates
│   └── Validation/           # Custom validation attributes
├── logistics-dashboard/       # React 19 + TypeScript frontend
│   └── src/
│       ├── components/        # Pages & shared UI
│       ├── hooks/             # TanStack Query data hooks
│       ├── services/          # Axios API client with interceptors
│       ├── contexts/          # Auth, theme contexts
│       └── styles/            # CSS variables & modules
└── LogisticsUI/               # Blazor Server frontend (legacy)

tests/
└── LogisticsAPI.Tests/        # 68 xUnit tests
```

## Features

- **Inventory Management** — Full CRUD with pagination, search, and low-stock alerts
- **Category & Warehouse** — Organize items with capacity tracking and utilization metrics
- **Supplier & Purchase Orders** — Manage suppliers with order workflow (Pending → Approved → Received)
- **Stock Movements** — Track IN/OUT/ADJUSTMENT with full audit history
- **CSV Import** — Bulk import with field mapping, validation, and error recovery
- **Reports** — Inventory valuation by category/warehouse, low stock alerts
- **Real-time Updates** — SignalR pushes inventory changes to connected dashboards
- **Multi-Tenant** — Data isolation via EF Core global query filters with X-Tenant-Id header

## API

**Production:** https://logistics-inventory-api-abdallah.azurewebsites.net

All requests require `X-Tenant-Id` header. Responses use PascalCase JSON.

| Endpoint | Description |
|-|-|
| `/api/Inventory` | Inventory items CRUD, low-stock alerts |
| `/api/Category` | Product categories |
| `/api/Warehouse` | Warehouse management, utilization |
| `/api/Supplier` | Supplier directory |
| `/api/PurchaseOrder` | Purchase order workflow |
| `/api/StockMovement` | Stock transfer tracking, history |
| `/api/Reports` | Valuation, analytics |
| `/api/health` | Health check |

## CI/CD Pipeline

| Workflow | Trigger | Purpose |
|-|-|-|
| [Azure Deploy](/.github/workflows/azure-deploy.yml) | Push to main (API paths) | Build, test (68 xUnit), deploy to Azure |
| [Frontend CI](/.github/workflows/frontend-ci.yml) | Push to main (frontend paths) | Lint, typecheck, test (12 Vitest), build |
| [Claude Review](/.github/workflows/claude-review.yml) | PR open + `@claude` | AI-powered code review (Claude Opus) |
| [CodeQL](/.github/workflows/codeql.yml) | PR + weekly schedule | Security vulnerability scanning (C# + JS/TS) |
| [Commit Lint](/.github/workflows/commit-lint.yml) | PR title | Conventional commit enforcement |
| [Dependabot](/.github/dependabot.yml) | Weekly/monthly | Automated dependency updates |

All CI workflows use **concurrency groups** to cancel stale runs when new commits are pushed.

Full pipeline documentation: [`.github/CI_CD.md`](/.github/CI_CD.md)

## Development Workflow

```
feature branch → push → PR → CI + Claude review → fix feedback → merge
```

Uses [conventional commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`, `perf:`, `ci:`

## Design Patterns

- **Repository Pattern** — Generic `IRepository<T>` with specialized repositories
- **Service Layer** — Business logic encapsulated in services
- **Multi-Tenant Architecture** — Global query filters with automatic tenant scoping
- **CQRS-lite** — TanStack Query on frontend separates read/write concerns
- **Interceptor Pattern** — Axios interceptors handle auth tokens, tenant headers, case conversion

## Deployment

| Service | URL |
|-|-|
| API (Swagger) | https://logistics-inventory-api-abdallah.azurewebsites.net/swagger |
| Health Check | https://logistics-inventory-api-abdallah.azurewebsites.net/api/health |

Deployed on Azure App Service (Canada Central) with Azure SQL Database. Infrastructure defined as ARM templates in `azure/`.

### Docker (Local Development)

```bash
# Full stack: SQL Server 2022 + API + React frontend
docker compose up -d

# API: http://localhost:7001
# Frontend: http://localhost:3000
# SQL Server: localhost:1433
```

## Testing

```bash
# All tests
make test

# API only (68 xUnit tests)
make test-api

# Frontend only (12 Vitest tests)
make test-frontend
```

## License

Private
