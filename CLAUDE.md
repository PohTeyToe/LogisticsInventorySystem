# LogisticsInventorySystem

Logistics inventory management platform with .NET Core API and React frontend.

## Projects
- `src/LogisticsAPI/` — ASP.NET Core 8.0 Web API (EF Core, multi-tenant, Serilog)
- `src/LogisticsUI/` — Blazor Server-Side frontend (legacy, being replaced by React)
- `src/logistics-dashboard/` — React 19 + TypeScript 5.9 + Vite frontend (active development)
- `tests/LogisticsAPI.Tests/` — xUnit test project (68 tests)
- `design-proposals/` — UI direction mockups

## Key files

| Path | Purpose |
|-|-|
| `src/LogisticsAPI/Program.cs` | API entry point, middleware pipeline, DI setup |
| `src/LogisticsAPI/Controllers/` | REST controllers (Category, Inventory, Warehouse, Supplier, PurchaseOrder, StockMovement, Reports) |
| `src/LogisticsAPI/Data/LogisticsDbContext.cs` | EF Core context, multi-tenant query filters, seed data |
| `src/LogisticsAPI/Models/` | Entity models and DTOs |
| `src/LogisticsAPI/Middleware/TenantMiddleware.cs` | Extracts TenantId from X-Tenant-Id header |
| `src/logistics-dashboard/src/services/api.ts` | Axios client, interceptors (camelCase transform, auth token, tenant header) |
| `src/logistics-dashboard/src/hooks/` | TanStack Query hooks for all API endpoints |
| `src/logistics-dashboard/src/components/` | React components (pages, shared UI) |
| `src/logistics-dashboard/src/styles/theme.css` | CSS variables (all colors, spacing, typography) |
| `src/logistics-dashboard/src/contexts/AuthContext.tsx` | JWT auth context + login/logout |
| `docker-compose.yml` | Local dev stack: SQL Server 2022 + API + React/nginx |
| `Makefile` | Dev commands (see below) |

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
- `.github/workflows/azure-deploy.yml` — builds, tests, and deploys API to Azure on push to main (path-filtered to API changes)
- `.github/workflows/frontend-ci.yml` — lint (parallel), typecheck, test, build for React on push/PR touching `src/logistics-dashboard/`
- `.github/workflows/claude-review.yml` — AI code review on PR open + `@claude` mentions in PR comments
- `.github/workflows/codeql.yml` — security scanning for C# and JS/TS (PRs + weekly)
- `.github/workflows/commit-lint.yml` — validates PR titles follow conventional commits
- `.github/dependabot.yml` — automated dependency updates (NuGet weekly, npm weekly, Actions weekly, Docker monthly)
- `.github/workflows/vercel-preview.yml` — deploys frontend preview URLs on PRs (Vercel CLI)
- All workflows use concurrency groups to cancel stale runs
- Full pipeline docs: `.github/CI_CD.md`

### Secrets required for CI
| Secret | Purpose |
|-|-|
| `AZURE_WEBAPP_PUBLISH_PROFILE` | Azure App Service deployment |
| `CLAUDE_CODE_OAUTH_TOKEN` | Claude Code OAuth for PR review bot |
| `VERCEL_TOKEN` | Vercel CLI preview deploys |

## Database
- Dev: SQLite at `data/logistics.db`
- Prod: Azure SQL (`LogisticsInventory` database)
- Docker: SQL Server 2022 container
- Multi-tenant: all entities scoped by `TenantId`

## Development workflow (agents must follow)

1. **Create a feature branch** from main: `git checkout -b feat/description`, `fix/description`, or `chore/description`
2. **Make changes**, run `make test` and `make lint` to verify
3. **Commit and push** the branch: `git push -u origin <branch-name>`
4. **Create a PR** via `gh pr create` — CI runs automatically, Claude reviews the PR
5. **Check CI status** with `gh pr checks <pr-number>` — fix any failures
6. **Read Claude's review** with `gh pr view <pr-number> --comments` — address feedback if needed
7. **Merge** when CI is green: `gh pr merge <pr-number> --squash --delete-branch`

Never push directly to main — except for **docs-only changes** (`.md` files, comments, no code). Those can go straight to main.

PR titles must follow conventional commits: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`, `perf:`, `ci:`

## Agent tips
- The frontend Axios interceptor auto-adds `X-Tenant-Id: 1` and the JWT auth token — don't add these manually in frontend code
- All new components need CSS Modules (`.module.css`) — never inline styles or hardcoded colors
- When adding API endpoints: add controller action, register route, add xUnit test, add frontend hook
- When modifying EF Core models: check that TenantId filter is applied, update seed data if needed
- SignalR hubs are at `/hubs/inventory` — the Vite proxy handles WebSocket forwarding in dev
