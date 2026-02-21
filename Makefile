.PHONY: build run test migrate clean docker-up docker-down

build:
	dotnet build

run:
	dotnet run --project src/LogisticsInventory.Web

test:
	dotnet test

migrate:
	dotnet ef database update --project src/LogisticsInventory.Web

clean:
	dotnet clean
	rm -rf **/bin **/obj

docker-up:
	docker-compose up -d --build

docker-down:
	docker-compose down -v
