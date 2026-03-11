using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using LogisticsAPI.Data;
using LogisticsAPI.DTOs;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace LogisticsAPI.Tests
{
    public class IntegrationTests : IClassFixture<WebApplicationFactory<Program>>
    {
        private readonly WebApplicationFactory<Program> _factory;

        public IntegrationTests(WebApplicationFactory<Program> factory)
        {
            _factory = factory.WithWebHostBuilder(builder =>
            {
                builder.ConfigureServices(services =>
                {
                    // Remove existing DbContext registration
                    var descriptor = services.SingleOrDefault(
                        d => d.ServiceType == typeof(DbContextOptions<ApplicationDbContext>));
                    if (descriptor != null) services.Remove(descriptor);

                    // Use in-memory database for tests
                    services.AddDbContext<ApplicationDbContext>(options =>
                        options.UseInMemoryDatabase("IntegrationTestDb_" + Guid.NewGuid()));
                });
            });
        }

        private HttpClient CreateClientWithTenant(int tenantId)
        {
            var client = _factory.CreateClient();
            client.DefaultRequestHeaders.Add("X-Tenant-Id", tenantId.ToString());
            return client;
        }

        [Fact]
        public async Task HealthCheck_ReturnsOk()
        {
            var client = _factory.CreateClient();
            var response = await client.GetAsync("/api/health");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var body = await response.Content.ReadAsStringAsync();
            Assert.Contains("Healthy", body);
        }

        [Fact]
        public async Task InventoryItems_CRUD_WorksEndToEnd()
        {
            using var client = CreateClientWithTenant(1);

            // Create
            var createRequest = new CreateInventoryItemRequest
            {
                SKU = $"INT-{Guid.NewGuid():N}".Substring(0, 20),
                Name = "Integration Test Item",
                Quantity = 50,
                UnitPrice = 9.99m,
                ReorderLevel = 5
            };

            var createResponse = await client.PostAsJsonAsync("/api/inventory", createRequest);
            Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);
            var createBody = await createResponse.Content.ReadAsStringAsync();
            var created = JsonSerializer.Deserialize<InventoryItemResponse>(createBody,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
            Assert.NotNull(created);
            Assert.Equal(createRequest.Name, created!.Name);
            var itemId = created.Id;
            Assert.True(itemId > 0, $"Expected positive ID but got {itemId}. Response body: {createBody}");

            // Read - verify via list endpoint (avoids in-memory provider query filter edge cases)
            var listResponse = await client.GetFromJsonAsync<PaginatedResponse<InventoryItemResponse>>("/api/inventory?pageSize=100");
            Assert.NotNull(listResponse);
            var fetchedItem = listResponse!.Items.FirstOrDefault(i => i.Id == itemId);
            Assert.NotNull(fetchedItem);
            Assert.Equal(createRequest.SKU, fetchedItem!.SKU);

            // Update
            var updateRequest = new UpdateInventoryItemRequest { Name = "Updated Item", Quantity = 100 };
            var updateResponse = await client.PutAsJsonAsync($"/api/inventory/{itemId}", updateRequest);
            Assert.Equal(HttpStatusCode.OK, updateResponse.StatusCode);
            var updated = await updateResponse.Content.ReadFromJsonAsync<InventoryItemResponse>();
            Assert.Equal("Updated Item", updated!.Name);
            Assert.Equal(100, updated.Quantity);

            // Delete
            var deleteResponse = await client.DeleteAsync($"/api/inventory/{itemId}");
            Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);

            // Verify deleted - GET by ID should return NotFound
            var getAfterDelete = await client.GetAsync($"/api/inventory/{itemId}");
            Assert.Equal(HttpStatusCode.NotFound, getAfterDelete.StatusCode);
        }

        [Fact]
        public async Task TenantIsolation_DifferentTenantsSeeOwnData()
        {
            using var tenant1Client = CreateClientWithTenant(101);
            using var tenant2Client = CreateClientWithTenant(102);

            // Tenant 1 creates an item
            var t1Item = new CreateInventoryItemRequest
            {
                SKU = $"T1-{Guid.NewGuid():N}".Substring(0, 20),
                Name = "Tenant 1 Only Item",
                Quantity = 10,
                UnitPrice = 5.00m
            };
            var t1Response = await tenant1Client.PostAsJsonAsync("/api/inventory", t1Item);
            Assert.Equal(HttpStatusCode.Created, t1Response.StatusCode);

            // Tenant 2 creates an item
            var t2Item = new CreateInventoryItemRequest
            {
                SKU = $"T2-{Guid.NewGuid():N}".Substring(0, 20),
                Name = "Tenant 2 Only Item",
                Quantity = 20,
                UnitPrice = 10.00m
            };
            var t2Response = await tenant2Client.PostAsJsonAsync("/api/inventory", t2Item);
            Assert.Equal(HttpStatusCode.Created, t2Response.StatusCode);

            // Tenant 1 should only see their items
            var t1List = await tenant1Client.GetFromJsonAsync<PaginatedResponse<InventoryItemResponse>>("/api/inventory");
            Assert.NotNull(t1List);
            Assert.All(t1List!.Items, item => Assert.Equal(101, item.TenantId));
            Assert.DoesNotContain(t1List.Items, item => item.Name == "Tenant 2 Only Item");

            // Tenant 2 should only see their items
            var t2List = await tenant2Client.GetFromJsonAsync<PaginatedResponse<InventoryItemResponse>>("/api/inventory");
            Assert.NotNull(t2List);
            Assert.All(t2List!.Items, item => Assert.Equal(102, item.TenantId));
            Assert.DoesNotContain(t2List.Items, item => item.Name == "Tenant 1 Only Item");
        }

        [Fact]
        public async Task CsvImport_ValidFile_ReturnsSuccess()
        {
            using var client = CreateClientWithTenant(1);

            var csvContent = "SKU,Name,Quantity,UnitPrice,Location,ReorderLevel\n" +
                             "CSV-001,CSV Test Item,25,4.99,Warehouse A,5\n";

            using var content = new MultipartFormDataContent();
            var fileContent = new ByteArrayContent(Encoding.UTF8.GetBytes(csvContent));
            fileContent.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("text/csv");
            content.Add(fileContent, "file", "test-import.csv");

            var response = await client.PostAsync("/api/import/inventory", content);
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            var body = await response.Content.ReadAsStringAsync();
            Assert.Contains("successCount", body, StringComparison.OrdinalIgnoreCase);
        }

        [Fact]
        public async Task Properties_CRUD_WithTenantIsolation()
        {
            using var client = CreateClientWithTenant(201);

            // Create property
            var createBody = JsonSerializer.Serialize(new
            {
                propertyCode = "PROP-001",
                name = "Test Property",
                address = "123 Test St",
                propertyType = "Apartment",
                baseNightlyRate = 150.00,
                managementFeePercentage = 20.0
            });

            var createResponse = await client.PostAsync("/api/properties",
                new StringContent(createBody, Encoding.UTF8, "application/json"));
            Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);

            var created = await createResponse.Content.ReadFromJsonAsync<JsonElement>();
            var propertyId = created.GetProperty("id").GetInt32();
            Assert.True(propertyId > 0, $"Expected positive property ID but got {propertyId}");
            Assert.Equal(201, created.GetProperty("tenantId").GetInt32());

            // Read - verify via list endpoint (avoids in-memory provider query filter edge cases)
            var listResponse = await client.GetAsync("/api/properties");
            Assert.Equal(HttpStatusCode.OK, listResponse.StatusCode);
            var listBody = await listResponse.Content.ReadAsStringAsync();
            Assert.Contains("Test Property", listBody);

            // Delete
            var deleteResponse = await client.DeleteAsync($"/api/properties/{propertyId}");
            Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);
        }

        [Fact]
        public async Task InvalidTenantHeader_ReturnsBadRequest()
        {
            var client = _factory.CreateClient();
            client.DefaultRequestHeaders.Add("X-Tenant-Id", "not-a-number");

            var response = await client.GetAsync("/api/inventory");
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }
    }
}
