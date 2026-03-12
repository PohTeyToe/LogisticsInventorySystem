.PHONY: dev dev-api dev-ui dev-frontend test test-api test-frontend build build-api build-frontend lint clean docker-up docker-down help

help: ## Show available commands
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

dev-api: ## Run the .NET API locally
	dotnet run --project src/LogisticsAPI

dev-ui: ## Run the Blazor UI locally
	dotnet run --project src/LogisticsUI

dev-frontend: ## Run the React frontend (dev server)
	cd src/logistics-dashboard && npm run dev

dev: ## Run API + React frontend concurrently
	@echo "Starting API and frontend..."
	$(MAKE) dev-api &
	$(MAKE) dev-frontend
	@wait

test: test-api test-frontend ## Run all tests

test-api: ## Run .NET API tests
	dotnet test

test-frontend: ## Run React frontend tests
	cd src/logistics-dashboard && npm test

build: build-api build-frontend ## Build everything

build-api: ## Build the .NET API
	dotnet build --configuration Release

build-frontend: ## Build the React frontend
	cd src/logistics-dashboard && npm run build

lint: ## Lint the React frontend
	cd src/logistics-dashboard && npm run lint

clean: ## Clean build artifacts
	dotnet clean
	rm -rf src/logistics-dashboard/dist
	rm -rf src/logistics-dashboard/node_modules/.vite

docker-up: ## Start all services via Docker Compose
	docker compose up -d

docker-down: ## Stop all Docker Compose services
	docker compose down

.DEFAULT_GOAL := help
