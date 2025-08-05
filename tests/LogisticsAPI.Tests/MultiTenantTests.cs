using LogisticsAPI.Models;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace LogisticsAPI.Tests
{
    public class MultiTenantTests
    {
        [Fact]
        public async Task QueryFilter_IsolatesTenantData()
        {
            using var context = TestDbContextFactory.Create();
            context.SetTenantId(1);

            context.InventoryItems.Add(new InventoryItem
            {
                SKU = "T1-001",
                Name = "Tenant 1 Item",
                TenantId = 1
            });
            context.InventoryItems.Add(new InventoryItem
            {
                SKU = "T2-001",
                Name = "Tenant 2 Item",
                TenantId = 2
            });
            await context.SaveChangesAsync();

            context.SetTenantId(1);
            var tenant1Items = await context.InventoryItems.ToListAsync();
            Assert.Single(tenant1Items);
            Assert.Equal("Tenant 1 Item", tenant1Items[0].Name);
        }

        [Fact]
        public async Task QueryFilter_SwitchTenant_ShowsDifferentData()
        {
            var dbName = Guid.NewGuid().ToString();

            using (var context = TestDbContextFactory.Create(dbName))
            {
                context.InventoryItems.Add(new InventoryItem { SKU = "T1-001", Name = "T1 Item", TenantId = 1 });
                context.InventoryItems.Add(new InventoryItem { SKU = "T2-001", Name = "T2 Item", TenantId = 2 });
                await context.SaveChangesAsync();
            }

            // Query as tenant 2
            using (var context = TestDbContextFactory.Create(dbName))
            {
                context.SetTenantId(2);
                var items = await context.InventoryItems.ToListAsync();
                Assert.Single(items);
                Assert.Equal("T2 Item", items[0].Name);
            }
        }

        [Fact]
        public async Task SaveChanges_AutoSetsTenantId()
        {
            using var context = TestDbContextFactory.Create();
            context.SetTenantId(5);

            var category = new Category { Name = "Auto Tenant Category" };
            context.Categories.Add(category);
            await context.SaveChangesAsync();

            Assert.Equal(5, category.TenantId);
        }

        [Fact]
        public async Task IgnoreQueryFilters_ReturnsAllTenantData()
        {
            using var context = TestDbContextFactory.Create();

            context.InventoryItems.Add(new InventoryItem { SKU = "ALL-001", Name = "Item T1", TenantId = 1 });
            context.InventoryItems.Add(new InventoryItem { SKU = "ALL-002", Name = "Item T2", TenantId = 2 });
            context.InventoryItems.Add(new InventoryItem { SKU = "ALL-003", Name = "Item T3", TenantId = 3 });
            await context.SaveChangesAsync();

            var allItems = await context.InventoryItems.IgnoreQueryFilters().ToListAsync();
            Assert.Equal(3, allItems.Count);
        }

        [Fact]
        public async Task Categories_AreIsolatedByTenant()
        {
            using var context = TestDbContextFactory.Create();

            context.Categories.Add(new Category { Name = "Cat T1", TenantId = 1 });
            context.Categories.Add(new Category { Name = "Cat T2", TenantId = 2 });
            await context.SaveChangesAsync();

            context.SetTenantId(1);
            var categories = await context.Categories.ToListAsync();
            Assert.Single(categories);
            Assert.Equal("Cat T1", categories[0].Name);
        }
    }
}
