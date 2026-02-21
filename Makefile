.PHONY: build run run-ui test migrate clean docker-up docker-down

build:
	dotnet build

run:
	dotnet run --project src/LogisticsAPI

run-ui:
	dotnet run --project src/LogisticsUI

test:
	dotnet test tests/LogisticsAPI.Tests

migrate:
	dotnet ef database update --project src/LogisticsAPI

clean:
	dotnet clean
	rm -rf **/bin **/obj

docker-up:
	docker-compose up -d --build

docker-down:
	docker-compose down -v
