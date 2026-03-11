using LogisticsAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace LogisticsAPI.Data
{
    public static class SeedData
    {
        public static async Task InitializeAsync(ApplicationDbContext context)
        {
            await context.Database.EnsureCreatedAsync();

            // Skip if data already exists
            if (await context.Categories.IgnoreQueryFilters().AnyAsync())
                return;

            // Tenant
            var tenant = new Tenant
            {
                Name = "Default Organization",
                ContactEmail = "admin@logistics.local",
                IsActive = true
            };
            context.Tenants.Add(tenant);
            await context.SaveChangesAsync();

            var tenantId = tenant.Id;

            // Categories
            var categories = new[]
            {
                new Category { Name = "Electronics", Description = "Electronic components and devices", TenantId = tenantId },
                new Category { Name = "Office Supplies", Description = "General office and stationery items", TenantId = tenantId },
                new Category { Name = "Warehouse Equipment", Description = "Shelving, pallets, and handling tools", TenantId = tenantId },
                new Category { Name = "Safety Gear", Description = "PPE and safety equipment", TenantId = tenantId }
            };
            context.Categories.AddRange(categories);
            await context.SaveChangesAsync();

            // Warehouses
            var warehouses = new[]
            {
                new Warehouse { Name = "Main Warehouse", Address = "100 Industrial Blvd, Toronto, ON", Capacity = 5000, TenantId = tenantId },
                new Warehouse { Name = "East Distribution Center", Address = "450 Logistics Dr, Markham, ON", Capacity = 3000, TenantId = tenantId },
                new Warehouse { Name = "West Storage", Address = "22 Commerce St, Mississauga, ON", Capacity = 2000, TenantId = tenantId }
            };
            context.Warehouses.AddRange(warehouses);
            await context.SaveChangesAsync();

            // Suppliers
            var suppliers = new[]
            {
                new Supplier { Name = "TechParts Inc", ContactEmail = "sales@techparts.com", Phone = "416-555-0101", Address = "200 Tech Park, Toronto, ON", TenantId = tenantId },
                new Supplier { Name = "Office Direct", ContactEmail = "orders@officedirect.ca", Phone = "905-555-0202", Address = "88 Supply Chain Rd, Brampton, ON", TenantId = tenantId },
                new Supplier { Name = "SafetyFirst Supply", ContactEmail = "info@safetyfirst.ca", Phone = "647-555-0303", Address = "15 Industrial Safety Ave, Hamilton, ON", TenantId = tenantId }
            };
            context.Suppliers.AddRange(suppliers);
            await context.SaveChangesAsync();

            // Inventory Items
            var items = new[]
            {
                new InventoryItem { SKU = "ELEC-001", Name = "USB-C Cable 2m", Description = "Braided USB-C to USB-C cable", Quantity = 250, UnitPrice = 12.99m, CategoryId = categories[0].Id, WarehouseId = warehouses[0].Id, ReorderLevel = 50, TenantId = tenantId },
                new InventoryItem { SKU = "ELEC-002", Name = "Wireless Mouse", Description = "Ergonomic wireless mouse with USB receiver", Quantity = 80, UnitPrice = 29.99m, CategoryId = categories[0].Id, WarehouseId = warehouses[0].Id, ReorderLevel = 20, TenantId = tenantId },
                new InventoryItem { SKU = "ELEC-003", Name = "HDMI Adapter", Description = "USB-C to HDMI 4K adapter", Quantity = 5, UnitPrice = 24.50m, CategoryId = categories[0].Id, WarehouseId = warehouses[1].Id, ReorderLevel = 15, TenantId = tenantId },
                new InventoryItem { SKU = "OFFC-001", Name = "A4 Paper Ream", Description = "500 sheets, 80gsm white paper", Quantity = 400, UnitPrice = 8.49m, CategoryId = categories[1].Id, WarehouseId = warehouses[0].Id, ReorderLevel = 100, TenantId = tenantId },
                new InventoryItem { SKU = "OFFC-002", Name = "Ballpoint Pen Box", Description = "Box of 50 blue ballpoint pens", Quantity = 60, UnitPrice = 14.99m, CategoryId = categories[1].Id, WarehouseId = warehouses[1].Id, ReorderLevel = 15, TenantId = tenantId },
                new InventoryItem { SKU = "OFFC-003", Name = "Whiteboard Markers Set", Description = "Pack of 12 assorted dry-erase markers", Quantity = 3, UnitPrice = 18.75m, CategoryId = categories[1].Id, WarehouseId = warehouses[2].Id, ReorderLevel = 10, TenantId = tenantId },
                new InventoryItem { SKU = "WHSE-001", Name = "Steel Shelving Unit", Description = "5-tier heavy-duty shelving, 2m tall", Quantity = 15, UnitPrice = 189.99m, CategoryId = categories[2].Id, WarehouseId = warehouses[0].Id, ReorderLevel = 5, TenantId = tenantId },
                new InventoryItem { SKU = "WHSE-002", Name = "Pallet Jack", Description = "Manual hydraulic pallet jack, 2500kg capacity", Quantity = 4, UnitPrice = 449.00m, CategoryId = categories[2].Id, WarehouseId = warehouses[0].Id, ReorderLevel = 2, TenantId = tenantId },
                new InventoryItem { SKU = "WHSE-003", Name = "Stretch Wrap Roll", Description = "500mm x 300m clear stretch wrap", Quantity = 45, UnitPrice = 22.00m, CategoryId = categories[2].Id, WarehouseId = warehouses[1].Id, ReorderLevel = 10, TenantId = tenantId },
                new InventoryItem { SKU = "SAFE-001", Name = "Safety Goggles", Description = "Anti-fog splash-proof safety goggles", Quantity = 120, UnitPrice = 11.50m, CategoryId = categories[3].Id, WarehouseId = warehouses[0].Id, ReorderLevel = 30, TenantId = tenantId },
                new InventoryItem { SKU = "SAFE-002", Name = "High-Vis Vest", Description = "Class 2 high-visibility safety vest", Quantity = 200, UnitPrice = 9.99m, CategoryId = categories[3].Id, WarehouseId = warehouses[1].Id, ReorderLevel = 40, TenantId = tenantId },
                new InventoryItem { SKU = "SAFE-003", Name = "Steel-Toe Boots", Description = "CSA-approved steel-toe work boots", Quantity = 8, UnitPrice = 129.99m, CategoryId = categories[3].Id, WarehouseId = warehouses[2].Id, ReorderLevel = 10, TenantId = tenantId },
                new InventoryItem { SKU = "ELEC-004", Name = "Surge Protector", Description = "6-outlet surge protector with USB ports", Quantity = 35, UnitPrice = 34.99m, CategoryId = categories[0].Id, WarehouseId = warehouses[2].Id, ReorderLevel = 10, TenantId = tenantId },
                new InventoryItem { SKU = "WHSE-004", Name = "Barcode Scanner", Description = "Handheld 2D barcode scanner, USB", Quantity = 12, UnitPrice = 89.99m, CategoryId = categories[2].Id, WarehouseId = warehouses[0].Id, ReorderLevel = 3, TenantId = tenantId },
                new InventoryItem { SKU = "SAFE-004", Name = "First Aid Kit", Description = "50-person workplace first aid kit", Quantity = 6, UnitPrice = 64.99m, CategoryId = categories[3].Id, WarehouseId = warehouses[0].Id, ReorderLevel = 3, TenantId = tenantId }
            };
            context.InventoryItems.AddRange(items);
            await context.SaveChangesAsync();

            // Purchase Orders
            var orders = new[]
            {
                new PurchaseOrder
                {
                    SupplierId = suppliers[0].Id,
                    OrderDate = DateTime.UtcNow.AddDays(-10),
                    Status = "Received",
                    TotalAmount = 1249.50m,
                    TenantId = tenantId,
                    Items = new List<PurchaseOrderItem>
                    {
                        new PurchaseOrderItem { InventoryItemId = items[0].Id, Quantity = 50, UnitPrice = 12.99m },
                        new PurchaseOrderItem { InventoryItemId = items[1].Id, Quantity = 20, UnitPrice = 29.99m }
                    }
                },
                new PurchaseOrder
                {
                    SupplierId = suppliers[2].Id,
                    OrderDate = DateTime.UtcNow.AddDays(-3),
                    Status = "Pending",
                    TotalAmount = 1539.70m,
                    TenantId = tenantId,
                    Items = new List<PurchaseOrderItem>
                    {
                        new PurchaseOrderItem { InventoryItemId = items[9].Id, Quantity = 50, UnitPrice = 11.50m },
                        new PurchaseOrderItem { InventoryItemId = items[11].Id, Quantity = 10, UnitPrice = 129.99m }
                    }
                },
                new PurchaseOrder
                {
                    SupplierId = suppliers[1].Id,
                    OrderDate = DateTime.UtcNow.AddDays(-1),
                    Status = "Approved",
                    TotalAmount = 424.50m,
                    TenantId = tenantId,
                    Items = new List<PurchaseOrderItem>
                    {
                        new PurchaseOrderItem { InventoryItemId = items[3].Id, Quantity = 50, UnitPrice = 8.49m }
                    }
                }
            };
            context.PurchaseOrders.AddRange(orders);
            await context.SaveChangesAsync();
        }
    }
}
