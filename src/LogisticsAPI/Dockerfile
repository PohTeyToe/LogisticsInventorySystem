FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY *.sln ./
COPY src/LogisticsAPI/LogisticsAPI.csproj src/LogisticsAPI/
COPY tests/LogisticsAPI.Tests/LogisticsAPI.Tests.csproj tests/LogisticsAPI.Tests/
RUN dotnet restore src/LogisticsAPI/LogisticsAPI.csproj

COPY . .
RUN dotnet publish src/LogisticsAPI/LogisticsAPI.csproj -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .
EXPOSE 8080
ENTRYPOINT ["dotnet", "LogisticsAPI.dll"]
