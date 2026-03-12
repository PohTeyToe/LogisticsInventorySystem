# LogisticsInventorySystem

Logistics inventory management platform with .NET Core API and React frontend.

## Projects
- `src/LogisticsAPI/` — ASP.NET Core 8.0 Web API (EF Core, multi-tenant, Serilog)
- `src/LogisticsUI/` — Blazor Server-Side frontend (legacy, being replaced by React)
- `src/logistics-dashboard/` — React 19 + TypeScript 5.9 + Vite frontend (active development)
- `tests/LogisticsAPI.Tests/` — xUnit test project (68 tests)
- `design-proposals/` — UI direction mockups

## Makefile commands (use these)
- `make dev` — run API + React frontend concurrently
- `make dev-api` — run .NET API only
- `make dev-frontend` — run React dev server only
- `make test` — run all tests (API + frontend)
- `make test-api` — run .NET xUnit tests
- `make test-frontend` — run React Vitest tests
- `make build` — build everything
- `make lint` — lint React frontend
- `make docker-up` / `make docker-down` — Docker Compose (SQL Server + API + Frontend)

## Testing
- **API:** `dotnet test` — 68 xUnit tests
- **Frontend:** `cd src/logistics-dashboard && npm test` — Vitest + React Testing Library (12 tests)
- Tests must pass before committing

## Docker
- `docker compose up -d` starts SQL Server 2022, .NET API, and React frontend (nginx)
- API runs on port 7001, frontend on port 3000, SQL Server on 1433
- Docker API uses `ASPNETCORE_ENVIRONMENT=Production` to connect to SQL Server (not SQLite)

## MCP servers available
- **playwright** — E2E browser testing against the React dashboard. Use for UI verification, screenshot testing, or debugging rendering issues.
- **sqlite** — Query the local dev database at `data/logistics.db`. Use for inspecting seed data, debugging queries, or verifying schema.
- **azure** — Manage Azure resources (App Service, SQL, deployments). Use for checking deployment status, logs, or CORS config.
- **context7** — Fetch up-to-date library documentation.

## API details
- Base URL (prod): `https://logistics-inventory-api-abdallah.azurewebsites.net`
- All requests require `X-Tenant-Id` header (default: `1`)
- PascalCase JSON responses, frontend converts to camelCase via Axios interceptor
- Rate limit: 100 req/min (fixed window)
- Endpoints: `/api/Category`, `/api/Inventory`, `/api/Warehouse`, `/api/Supplier`, `/api/PurchaseOrder`, `/api/StockMovement`, `/api/Reports`, `/api/health`

## Frontend constraints
- CSS variables only (no hardcoded hex) — `src/logistics-dashboard/src/styles/theme.css`
- CSS Modules for all component styling
- Run `npm run build` in `src/logistics-dashboard/` after changes to verify clean build
- Deployment target: Vercel (not yet deployed)

## CI/CD
- `.github/workflows/azure-deploy.yml` — builds, tests, and deploys API to Azure on push to main
- `.github/workflows/frontend-ci.yml` — lint, typecheck, test, build for React on push/PR touching `src/logistics-dashboard/`

## Database
- Dev: SQLite at `data/logistics.db`
- Prod: Azure SQL (`LogisticsInventory` database)
- Docker: SQL Server 2022 container
- Multi-tenant: all entities scoped by `TenantId`
