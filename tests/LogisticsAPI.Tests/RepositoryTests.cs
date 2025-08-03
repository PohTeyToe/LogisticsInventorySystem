using LogisticsAPI.Repositories;
using Xunit;

namespace LogisticsAPI.Tests
{
    public class RepositoryTests
    {
        [Fact]
        public async Task AddAsync_AddsEntityToDatabase()
        {
            using var context = TestDbContextFactory.Create();
            var repo = new InventoryRepository(context);

            var item = new InventoryItem
            {
                SKU = "ADD-001",
                Name = "Added Item",
                Quantity = 10,
                UnitPrice = 5.00m
            };

            var result = await repo.AddAsync(item);

            Assert.True(result.Id > 0);
            Assert.Equal("ADD-001", result.SKU);
        }

        [Fact]
        public async Task GetByIdAsync_ReturnsCorrectEntity()
        {
            using var context = TestDbContextFactory.Create();
            var repo = new InventoryRepository(context);

            var item = new InventoryItem { SKU = "GET-001", Name = "Get Item", Quantity = 5 };
            await repo.AddAsync(item);

            var result = await repo.GetByIdAsync(item.Id);

            Assert.NotNull(result);
            Assert.Equal("GET-001", result!.SKU);
        }

        [Fact]
        public async Task DeleteAsync_RemovesEntity()
        {
            using var context = TestDbContextFactory.Create();
            var repo = new InventoryRepository(context);

            var item = new InventoryItem { SKU = "DEL-001", Name = "Delete Item" };
            await repo.AddAsync(item);

            await repo.DeleteAsync(item);
            var result = await repo.GetByIdAsync(item.Id);

            Assert.Null(result);
        }

        [Fact]
        public async Task FindAsync_ReturnsMatchingEntities()
        {
            using var context = TestDbContextFactory.Create();
            var repo = new InventoryRepository(context);

            await repo.AddAsync(new InventoryItem { SKU = "FIND-001", Name = "Alpha", Quantity = 10 });
            await repo.AddAsync(new InventoryItem { SKU = "FIND-002", Name = "Beta", Quantity = 5 });
            await repo.AddAsync(new InventoryItem { SKU = "FIND-003", Name = "Alpha Plus", Quantity = 20 });

            var results = await repo.FindAsync(i => i.Name.Contains("Alpha"));

            Assert.Equal(2, results.Count());
        }

        [Fact]
        public async Task ExistsAsync_ReturnsTrueForExistingEntity()
        {
            using var context = TestDbContextFactory.Create();
            var repo = new InventoryRepository(context);

            var item = new InventoryItem { SKU = "EX-001", Name = "Exists Item" };
            await repo.AddAsync(item);

            Assert.True(await repo.ExistsAsync(item.Id));
            Assert.False(await repo.ExistsAsync(999));
        }

        [Fact]
        public async Task CountAsync_ReturnsCorrectCount()
        {
            using var context = TestDbContextFactory.Create();
            var repo = new InventoryRepository(context);

            await repo.AddAsync(new InventoryItem { SKU = "CNT-001", Name = "Count 1" });
            await repo.AddAsync(new InventoryItem { SKU = "CNT-002", Name = "Count 2" });
            await repo.AddAsync(new InventoryItem { SKU = "CNT-003", Name = "Count 3" });

            Assert.Equal(3, await repo.CountAsync());
        }

        [Fact]
        public async Task SearchAsync_FindsByNameOrSku()
        {
            using var context = TestDbContextFactory.Create();
            var repo = new InventoryRepository(context);

            await repo.AddAsync(new InventoryItem { SKU = "SRCH-001", Name = "Wireless Mouse" });
            await repo.AddAsync(new InventoryItem { SKU = "SRCH-002", Name = "Wired Keyboard" });
            await repo.AddAsync(new InventoryItem { SKU = "MOUSE-003", Name = "Gaming Pad" });

            var results = await repo.SearchAsync("mouse");

            Assert.Equal(2, results.Count()); // "Wireless Mouse" by name and "MOUSE-003" by SKU
        }

        [Fact]
        public async Task GetBySkuAsync_ReturnsCorrectItem()
        {
            using var context = TestDbContextFactory.Create();
            var repo = new InventoryRepository(context);

            await repo.AddAsync(new InventoryItem { SKU = "SKU-001", Name = "By SKU Item" });

            var result = await repo.GetBySkuAsync("SKU-001");

            Assert.NotNull(result);
            Assert.Equal("By SKU Item", result!.Name);
        }
    }
}
