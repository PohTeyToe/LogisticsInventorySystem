using LogisticsAPI.DTOs;
using LogisticsAPI.Models;
using LogisticsAPI.Repositories;
using LogisticsAPI.Services;
using Microsoft.Extensions.Caching.Memory;
using Moq;
using Xunit;

namespace LogisticsAPI.Tests
{
    public class InventoryServiceTests
    {
        private readonly Mock<IUnitOfWork> _mockUow;
        private readonly Mock<IInventoryRepository> _mockRepo;
        private readonly Mock<INotificationService> _mockNotification;
        private readonly IMemoryCache _cache;
        private readonly InventoryService _service;

        public InventoryServiceTests()
        {
            _mockUow = new Mock<IUnitOfWork>();
            _mockRepo = new Mock<IInventoryRepository>();
            _mockNotification = new Mock<INotificationService>();
            _cache = new MemoryCache(new MemoryCacheOptions());

            _mockUow.Setup(u => u.Inventory).Returns(_mockRepo.Object);
            _mockUow.Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

            _service = new InventoryService(_mockUow.Object, _mockNotification.Object, _cache);
        }

        [Fact]
        public async Task CreateItem_WithValidData_ReturnsResponse()
        {
            var request = new CreateInventoryItemRequest
            {
                SKU = "TEST-001",
                Name = "Test Item",
                Quantity = 10,
                UnitPrice = 25.99m
            };

            _mockRepo.Setup(r => r.GetBySkuAsync("TEST-001")).ReturnsAsync((InventoryItem?)null);
            _mockRepo.Setup(r => r.AddAsync(It.IsAny<InventoryItem>()))
                .ReturnsAsync((InventoryItem item) => item);

            var result = await _service.CreateItemAsync(request);

            Assert.NotNull(result);
            Assert.Equal("TEST-001", result.SKU);
            Assert.Equal("Test Item", result.Name);
            Assert.Equal(10, result.Quantity);
            _mockUow.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
        }

        [Fact]
        public async Task CreateItem_WithDuplicateSku_ThrowsException()
        {
            var request = new CreateInventoryItemRequest
            {
                SKU = "DUP-001",
                Name = "Duplicate Item"
            };

            _mockRepo.Setup(r => r.GetBySkuAsync("DUP-001"))
                .ReturnsAsync(new InventoryItem { SKU = "DUP-001" });

            await Assert.ThrowsAsync<InvalidOperationException>(
                () => _service.CreateItemAsync(request));
        }

        [Fact]
        public async Task GetItemById_WithExistingId_ReturnsItem()
        {
            var item = new InventoryItem
            {
                Id = 1,
                SKU = "GET-001",
                Name = "Get Test",
                Quantity = 5,
                UnitPrice = 10m
            };

            _mockRepo.Setup(r => r.GetByIdWithDetailsAsync(1)).ReturnsAsync(item);

            var result = await _service.GetItemByIdAsync(1);

            Assert.NotNull(result);
            Assert.Equal("GET-001", result!.SKU);
        }

        [Fact]
        public async Task GetItemById_WithNonExistingId_ReturnsNull()
        {
            _mockRepo.Setup(r => r.GetByIdWithDetailsAsync(999)).ReturnsAsync((InventoryItem?)null);

            var result = await _service.GetItemByIdAsync(999);

            Assert.Null(result);
        }

        [Fact]
        public async Task UpdateItem_WithValidData_ReturnsUpdatedItem()
        {
            var existingItem = new InventoryItem
            {
                Id = 1,
                SKU = "UPD-001",
                Name = "Original",
                Quantity = 5,
                UnitPrice = 10m
            };

            _mockRepo.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(existingItem);
            _mockRepo.Setup(r => r.UpdateAsync(It.IsAny<InventoryItem>())).Returns(Task.CompletedTask);

            var request = new UpdateInventoryItemRequest { Name = "Updated", Quantity = 15 };
            var result = await _service.UpdateItemAsync(1, request);

            Assert.NotNull(result);
            Assert.Equal("Updated", result!.Name);
            Assert.Equal(15, result.Quantity);
            _mockUow.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
        }

        [Fact]
        public async Task DeleteItem_WithExistingId_ReturnsTrue()
        {
            var item = new InventoryItem { Id = 1, SKU = "DEL-001", Name = "Delete Me" };

            _mockRepo.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(item);
            _mockRepo.Setup(r => r.DeleteAsync(item)).Returns(Task.CompletedTask);

            var result = await _service.DeleteItemAsync(1);

            Assert.True(result);
            _mockUow.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
        }

        [Fact]
        public async Task DeleteItem_WithNonExistingId_ReturnsFalse()
        {
            _mockRepo.Setup(r => r.GetByIdAsync(999)).ReturnsAsync((InventoryItem?)null);

            var result = await _service.DeleteItemAsync(999);

            Assert.False(result);
        }

        [Fact]
        public async Task GetLowStockAlerts_ReturnsCorrectItems()
        {
            var lowStockItems = new List<InventoryItem>
            {
                new() { Id = 1, SKU = "LOW-001", Name = "Low Stock 1", Quantity = 3, ReorderLevel = 10 },
                new() { Id = 2, SKU = "LOW-002", Name = "Low Stock 2", Quantity = 0, ReorderLevel = 5 }
            };

            _mockRepo.Setup(r => r.GetLowStockItemsAsync(10)).ReturnsAsync(lowStockItems);

            var result = await _service.GetLowStockAlertsAsync(10);

            Assert.Equal(2, result.Count());
        }

        [Fact]
        public async Task GetItems_WithPagination_ReturnsPagedResults()
        {
            var items = Enumerable.Range(1, 5).Select(i => new InventoryItem
            {
                Id = i,
                SKU = $"PAGE-{i:D3}",
                Name = $"Item {i}",
                Quantity = i * 10
            });

            _mockRepo.Setup(r => r.GetPagedAsync(1, 20, null))
                .ReturnsAsync((items, 50));

            var result = await _service.GetItemsAsync(1, 20);

            Assert.Equal(5, result.Items.Count());
            Assert.Equal(50, result.TotalCount);
            Assert.Equal(3, result.TotalPages);
        }

        [Fact]
        public async Task GetValuationReport_CalculatesCorrectTotals()
        {
            var items = new List<InventoryItem>
            {
                new() { Id = 1, SKU = "VAL-001", Name = "Item 1", Quantity = 10, UnitPrice = 25m },
                new() { Id = 2, SKU = "VAL-002", Name = "Item 2", Quantity = 5, UnitPrice = 50m }
            };

            _mockRepo.Setup(r => r.GetAllWithDetailsAsync()).ReturnsAsync(items);

            var result = await _service.GetValuationReportAsync();

            Assert.Equal(2, result.TotalItems);
            Assert.Equal(15, result.TotalQuantity);
            Assert.Equal(500m, result.TotalValue); // 10*25 + 5*50
        }
    }
}
