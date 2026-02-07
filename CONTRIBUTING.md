# Contributing to LogisticsInventorySystem

## Prerequisites

- .NET 8 SDK
- SQL Server or PostgreSQL (via Docker or local install)
- Node.js 18+ (for any frontend tooling)

## Development Setup

1. Clone the repository
2. Copy `appsettings.Development.json.example` to `appsettings.Development.json`
3. Update the connection string for your local database
4. Run migrations: `dotnet ef database update`
5. Start the application: `dotnet run --project src/LogisticsInventory.Web`
6. Navigate to `https://localhost:5001`

## Running Tests

```bash
# All tests
dotnet test

# With coverage
dotnet test --collect:"XPlat Code Coverage"

# Specific test project
dotnet test tests/LogisticsInventory.Tests
```

## Code Style

- Follow .NET naming conventions (PascalCase for public members)
- Use nullable reference types (`#nullable enable`)
- Commit messages: conventional commits (`feat:`, `fix:`, `docs:`, `test:`, `chore:`)

## Pull Request Process

1. Create a feature branch from `main`
2. Write unit tests for new functionality
3. Ensure all tests pass: `dotnet test`
4. Update Swagger annotations if adding/changing API endpoints
5. Submit a PR with a description of the changes
