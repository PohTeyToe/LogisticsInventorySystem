FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY src/LogisticsAPI/LogisticsAPI.csproj src/LogisticsAPI/
RUN dotnet restore src/LogisticsAPI/LogisticsAPI.csproj
COPY . .
RUN dotnet publish src/LogisticsAPI/LogisticsAPI.csproj -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
RUN mkdir -p /app/data
COPY --from=build /app/publish .
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Development
ENTRYPOINT ["dotnet", "LogisticsAPI.dll"]
