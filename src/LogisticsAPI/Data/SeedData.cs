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
                new Category { Name = "Electronics", Description = "Electronic components, boards, and computing peripherals", TenantId = tenantId },
                new Category { Name = "Hardware & Fasteners", Description = "Bolts, screws, nuts, brackets, and structural hardware", TenantId = tenantId },
                new Category { Name = "Packaging Materials", Description = "Boxes, tape, wrap, and shipping supplies", TenantId = tenantId },
                new Category { Name = "Raw Materials", Description = "Steel, copper, aluminum, and other base materials", TenantId = tenantId },
                new Category { Name = "Safety Equipment", Description = "PPE, first aid, fire safety, and compliance gear", TenantId = tenantId },
                new Category { Name = "Lighting & Electrical", Description = "LED panels, wiring, conduit, and electrical components", TenantId = tenantId }
            };
            context.Categories.AddRange(categories);
            await context.SaveChangesAsync();

            // Warehouses
            var warehouses = new[]
            {
                new Warehouse { Name = "Main Distribution Center", Address = "100 Industrial Blvd, Toronto, ON M5V 2T6", Capacity = 1000, TenantId = tenantId },
                new Warehouse { Name = "Overflow Storage B", Address = "450 Logistics Dr, Markham, ON L3R 5Z2", Capacity = 500, TenantId = tenantId },
                new Warehouse { Name = "Cold Storage Unit", Address = "22 Commerce St, Mississauga, ON L5B 1M8", Capacity = 200, TenantId = tenantId },
                new Warehouse { Name = "Hazmat Bay", Address = "88 Restricted Access Rd, Brampton, ON L6T 4E2", Capacity = 150, TenantId = tenantId }
            };
            context.Warehouses.AddRange(warehouses);
            await context.SaveChangesAsync();

            // Suppliers
            var suppliers = new[]
            {
                new Supplier { Name = "Acme Industrial Supply", ContactEmail = "orders@acmeindustrial.com", Phone = "416-555-0101", Address = "200 Tech Park, Toronto, ON", TenantId = tenantId },
                new Supplier { Name = "Pacific Metals Co.", ContactEmail = "sales@pacificmetals.ca", Phone = "905-555-0202", Address = "55 Smelter Way, Hamilton, ON", TenantId = tenantId },
                new Supplier { Name = "Bright Star Lighting", ContactEmail = "wholesale@brightstar.com", Phone = "647-555-0303", Address = "12 Edison Ave, Vaughan, ON", TenantId = tenantId },
                new Supplier { Name = "SafeGuard Equipment Inc.", ContactEmail = "info@safeguardequip.ca", Phone = "905-555-0404", Address = "310 Safety Blvd, Oakville, ON", TenantId = tenantId },
                new Supplier { Name = "PackRight Solutions", ContactEmail = "bulk@packright.com", Phone = "416-555-0505", Address = "78 Corrugated Lane, Etobicoke, ON", TenantId = tenantId }
            };
            context.Suppliers.AddRange(suppliers);
            await context.SaveChangesAsync();

            var catElectronics = categories[0];
            var catHardware = categories[1];
            var catPackaging = categories[2];
            var catRawMaterials = categories[3];
            var catSafety = categories[4];
            var catLighting = categories[5];

            var whMain = warehouses[0];
            var whOverflow = warehouses[1];
            var whCold = warehouses[2];
            var whHazmat = warehouses[3];

            // Inventory Items (30+ items, at least 3 below reorder level)
            var items = new[]
            {
                // Electronics (6 items)
                new InventoryItem { SKU = "MCB-ARM-001", Name = "ARM Cortex-M4 Dev Board", Description = "STM32F4 development board with debugger", Quantity = 45, UnitPrice = 38.50m, CategoryId = catElectronics.Id, WarehouseId = whMain.Id, ReorderLevel = 10, TenantId = tenantId },
                new InventoryItem { SKU = "SEN-TMP-002", Name = "Temperature Sensor Module", Description = "DS18B20 waterproof temperature probe, 1m cable", Quantity = 180, UnitPrice = 6.75m, CategoryId = catElectronics.Id, WarehouseId = whMain.Id, ReorderLevel = 40, TenantId = tenantId },
                new InventoryItem { SKU = "CBL-ETH-003", Name = "Cat6 Ethernet Cable 3m", Description = "Shielded Cat6 patch cable, RJ45, blue", Quantity = 320, UnitPrice = 4.25m, CategoryId = catElectronics.Id, WarehouseId = whOverflow.Id, ReorderLevel = 80, TenantId = tenantId },
                new InventoryItem { SKU = "PSU-24V-004", Name = "24V DC Power Supply 5A", Description = "Industrial DIN-rail mount switching PSU", Quantity = 22, UnitPrice = 47.99m, CategoryId = catElectronics.Id, WarehouseId = whMain.Id, ReorderLevel = 8, TenantId = tenantId },
                new InventoryItem { SKU = "RLY-SSR-005", Name = "Solid State Relay 40A", Description = "DC-AC SSR, 3-32V input, 24-380V output", Quantity = 3, UnitPrice = 18.90m, CategoryId = catElectronics.Id, WarehouseId = whHazmat.Id, ReorderLevel = 15, TenantId = tenantId }, // BELOW REORDER
                new InventoryItem { SKU = "DSP-LCD-006", Name = "7-inch LCD Touch Display", Description = "1024x600 IPS capacitive touch panel, HDMI", Quantity = 14, UnitPrice = 89.00m, CategoryId = catElectronics.Id, WarehouseId = whOverflow.Id, ReorderLevel = 5, TenantId = tenantId },

                // Hardware & Fasteners (6 items)
                new InventoryItem { SKU = "STL-BLT-010", Name = "M8x40 Hex Bolt Grade 8.8", Description = "Hot-dip galvanized steel hex bolt, DIN 931", Quantity = 2400, UnitPrice = 0.18m, CategoryId = catHardware.Id, WarehouseId = whMain.Id, ReorderLevel = 500, TenantId = tenantId },
                new InventoryItem { SKU = "STL-NUT-011", Name = "M8 Hex Nut Grade 8", Description = "Zinc-plated hex nut, DIN 934", Quantity = 3100, UnitPrice = 0.08m, CategoryId = catHardware.Id, WarehouseId = whMain.Id, ReorderLevel = 500, TenantId = tenantId },
                new InventoryItem { SKU = "STL-WSH-012", Name = "M8 Flat Washer", Description = "Stainless steel 304 flat washer, DIN 125", Quantity = 4500, UnitPrice = 0.04m, CategoryId = catHardware.Id, WarehouseId = whOverflow.Id, ReorderLevel = 1000, TenantId = tenantId },
                new InventoryItem { SKU = "CPR-WRE-002", Name = "Copper Wire Spool 2.5mm", Description = "Bare copper wire, 50m spool, 99.9% purity", Quantity = 8, UnitPrice = 62.00m, CategoryId = catHardware.Id, WarehouseId = whHazmat.Id, ReorderLevel = 12, TenantId = tenantId }, // BELOW REORDER
                new InventoryItem { SKU = "BRK-ANG-013", Name = "L-Bracket 90deg 100mm", Description = "Heavy-duty galvanized steel angle bracket", Quantity = 340, UnitPrice = 2.15m, CategoryId = catHardware.Id, WarehouseId = whMain.Id, ReorderLevel = 100, TenantId = tenantId },
                new InventoryItem { SKU = "SCR-WD-014", Name = "Wood Screw #10x2.5in", Description = "Yellow zinc coated, Phillips flat head, box of 100", Quantity = 75, UnitPrice = 8.50m, CategoryId = catHardware.Id, WarehouseId = whOverflow.Id, ReorderLevel = 20, TenantId = tenantId },

                // Packaging Materials (5 items)
                new InventoryItem { SKU = "BOX-CRG-020", Name = "Corrugated Box 18x12x10", Description = "Single-wall 32ECT kraft corrugated shipping box", Quantity = 600, UnitPrice = 1.85m, CategoryId = catPackaging.Id, WarehouseId = whOverflow.Id, ReorderLevel = 150, TenantId = tenantId },
                new InventoryItem { SKU = "TPE-PKG-021", Name = "Packing Tape 48mm Clear", Description = "Hot-melt adhesive, 100m roll, 2.0mil thick", Quantity = 144, UnitPrice = 3.20m, CategoryId = catPackaging.Id, WarehouseId = whOverflow.Id, ReorderLevel = 36, TenantId = tenantId },
                new InventoryItem { SKU = "WRP-BBL-022", Name = "Bubble Wrap Roll 300mm", Description = "Small bubble 10mm, 100m roll, perforated every 30cm", Quantity = 28, UnitPrice = 22.50m, CategoryId = catPackaging.Id, WarehouseId = whMain.Id, ReorderLevel = 10, TenantId = tenantId },
                new InventoryItem { SKU = "PLT-WD-023", Name = "Wooden Pallet 48x40", Description = "GMA standard 4-way entry hardwood pallet", Quantity = 55, UnitPrice = 18.00m, CategoryId = catPackaging.Id, WarehouseId = whMain.Id, ReorderLevel = 15, TenantId = tenantId },
                new InventoryItem { SKU = "LBL-SHP-024", Name = "Shipping Label Roll 4x6", Description = "Direct thermal labels, 500/roll, compatible with Zebra", Quantity = 12, UnitPrice = 14.99m, CategoryId = catPackaging.Id, WarehouseId = whOverflow.Id, ReorderLevel = 8, TenantId = tenantId },

                // Raw Materials (5 items)
                new InventoryItem { SKU = "ALU-SHT-030", Name = "Aluminum Sheet 4x8ft 1mm", Description = "6061-T6 aluminum alloy sheet, mill finish", Quantity = 35, UnitPrice = 145.00m, CategoryId = catRawMaterials.Id, WarehouseId = whMain.Id, ReorderLevel = 10, TenantId = tenantId },
                new InventoryItem { SKU = "STL-BAR-031", Name = "Steel Round Bar 25mm", Description = "AISI 1045 carbon steel, 6ft length", Quantity = 18, UnitPrice = 52.00m, CategoryId = catRawMaterials.Id, WarehouseId = whMain.Id, ReorderLevel = 8, TenantId = tenantId },
                new InventoryItem { SKU = "PVC-PPE-032", Name = "PVC Pipe 2in Schedule 40", Description = "10ft length, white, bell end", Quantity = 90, UnitPrice = 8.75m, CategoryId = catRawMaterials.Id, WarehouseId = whOverflow.Id, ReorderLevel = 25, TenantId = tenantId },
                new InventoryItem { SKU = "RBR-GSK-033", Name = "Neoprene Gasket Sheet", Description = "12x12 inch, 1/8in thick, 60A durometer", Quantity = 2, UnitPrice = 24.00m, CategoryId = catRawMaterials.Id, WarehouseId = whCold.Id, ReorderLevel = 10, TenantId = tenantId }, // BELOW REORDER
                new InventoryItem { SKU = "FBR-GLS-034", Name = "Fiberglass Cloth 50in", Description = "6oz E-glass, plain weave, per yard", Quantity = 42, UnitPrice = 11.50m, CategoryId = catRawMaterials.Id, WarehouseId = whHazmat.Id, ReorderLevel = 15, TenantId = tenantId },

                // Safety Equipment (5 items)
                new InventoryItem { SKU = "PPE-HLM-040", Name = "Hard Hat Type II", Description = "Vented, ratchet suspension, ANSI Z89.1 compliant", Quantity = 65, UnitPrice = 28.99m, CategoryId = catSafety.Id, WarehouseId = whMain.Id, ReorderLevel = 20, TenantId = tenantId },
                new InventoryItem { SKU = "PPE-GLV-041", Name = "Nitrile Gloves Box (L)", Description = "Powder-free, 5mil, 100 gloves per box", Quantity = 48, UnitPrice = 12.50m, CategoryId = catSafety.Id, WarehouseId = whMain.Id, ReorderLevel = 15, TenantId = tenantId },
                new InventoryItem { SKU = "PPE-RSP-042", Name = "N95 Respirator 20-Pack", Description = "NIOSH-approved N95 particulate respirator", Quantity = 5, UnitPrice = 34.00m, CategoryId = catSafety.Id, WarehouseId = whCold.Id, ReorderLevel = 12, TenantId = tenantId }, // BELOW REORDER
                new InventoryItem { SKU = "SAF-EXT-043", Name = "Fire Extinguisher 10lb ABC", Description = "Rechargeable dry chemical, wall bracket included", Quantity = 14, UnitPrice = 58.00m, CategoryId = catSafety.Id, WarehouseId = whHazmat.Id, ReorderLevel = 6, TenantId = tenantId },
                new InventoryItem { SKU = "SAF-KIT-044", Name = "First Aid Kit 100-Person", Description = "OSHA-compliant, metal cabinet, wall-mount", Quantity = 7, UnitPrice = 89.99m, CategoryId = catSafety.Id, WarehouseId = whMain.Id, ReorderLevel = 3, TenantId = tenantId },

                // Lighting & Electrical (5 items)
                new InventoryItem { SKU = "LED-PNL-001", Name = "LED Panel Light 2x4ft 50W", Description = "4000K flat panel, 6250 lumens, DLC listed", Quantity = 36, UnitPrice = 72.00m, CategoryId = catLighting.Id, WarehouseId = whOverflow.Id, ReorderLevel = 10, TenantId = tenantId },
                new InventoryItem { SKU = "LED-HBY-002", Name = "LED High Bay 200W", Description = "5000K UFO high bay, 30000lm, IP65, 120-277V", Quantity = 10, UnitPrice = 145.00m, CategoryId = catLighting.Id, WarehouseId = whMain.Id, ReorderLevel = 4, TenantId = tenantId },
                new InventoryItem { SKU = "WRE-ROM-003", Name = "14/2 Romex Wire 250ft", Description = "NM-B solid copper, white jacket, with ground", Quantity = 15, UnitPrice = 98.50m, CategoryId = catLighting.Id, WarehouseId = whMain.Id, ReorderLevel = 5, TenantId = tenantId },
                new InventoryItem { SKU = "CDT-EMT-004", Name = "EMT Conduit 3/4in 10ft", Description = "Galvanized steel electrical metallic tubing", Quantity = 80, UnitPrice = 6.90m, CategoryId = catLighting.Id, WarehouseId = whOverflow.Id, ReorderLevel = 20, TenantId = tenantId },
                new InventoryItem { SKU = "BRK-CIR-005", Name = "Circuit Breaker 20A SP", Description = "Plug-in type, 120/240V, 10kAIC", Quantity = 24, UnitPrice = 9.75m, CategoryId = catLighting.Id, WarehouseId = whHazmat.Id, ReorderLevel = 8, TenantId = tenantId }
            };
            context.InventoryItems.AddRange(items);
            await context.SaveChangesAsync();

            // Purchase Orders (6 orders in various statuses)
            var now = DateTime.UtcNow;
            var orders = new[]
            {
                new PurchaseOrder
                {
                    SupplierId = suppliers[0].Id, // Acme Industrial
                    OrderDate = now.AddDays(-14),
                    Status = PurchaseOrderStatus.Delivered,
                    TotalAmount = 1362.00m,
                    TenantId = tenantId,
                    Items = new List<PurchaseOrderItem>
                    {
                        new PurchaseOrderItem { InventoryItemId = items[6].Id, Quantity = 5000, UnitPrice = 0.18m }, // M8 Hex Bolts
                        new PurchaseOrderItem { InventoryItemId = items[10].Id, Quantity = 200, UnitPrice = 2.15m }, // L-Brackets
                        new PurchaseOrderItem { InventoryItemId = items[7].Id, Quantity = 2000, UnitPrice = 0.08m }  // M8 Nuts
                    }
                },
                new PurchaseOrder
                {
                    SupplierId = suppliers[1].Id, // Pacific Metals
                    OrderDate = now.AddDays(-7),
                    Status = PurchaseOrderStatus.Shipped,
                    TotalAmount = 2821.00m,
                    TenantId = tenantId,
                    Items = new List<PurchaseOrderItem>
                    {
                        new PurchaseOrderItem { InventoryItemId = items[17].Id, Quantity = 15, UnitPrice = 145.00m }, // Aluminum Sheets
                        new PurchaseOrderItem { InventoryItemId = items[18].Id, Quantity = 12, UnitPrice = 52.00m }   // Steel Round Bar
                    }
                },
                new PurchaseOrder
                {
                    SupplierId = suppliers[2].Id, // Bright Star
                    OrderDate = now.AddDays(-5),
                    Status = PurchaseOrderStatus.Approved,
                    TotalAmount = 4042.00m,
                    TenantId = tenantId,
                    Items = new List<PurchaseOrderItem>
                    {
                        new PurchaseOrderItem { InventoryItemId = items[27].Id, Quantity = 24, UnitPrice = 72.00m },  // LED Panels
                        new PurchaseOrderItem { InventoryItemId = items[28].Id, Quantity = 8, UnitPrice = 145.00m },   // LED High Bay
                        new PurchaseOrderItem { InventoryItemId = items[30].Id, Quantity = 50, UnitPrice = 6.90m }     // EMT Conduit
                    }
                },
                new PurchaseOrder
                {
                    SupplierId = suppliers[3].Id, // SafeGuard
                    OrderDate = now.AddDays(-2),
                    Status = PurchaseOrderStatus.Pending,
                    TotalAmount = 2543.50m,
                    TenantId = tenantId,
                    Items = new List<PurchaseOrderItem>
                    {
                        new PurchaseOrderItem { InventoryItemId = items[24].Id, Quantity = 25, UnitPrice = 34.00m },   // N95 Respirators
                        new PurchaseOrderItem { InventoryItemId = items[22].Id, Quantity = 30, UnitPrice = 28.99m },   // Hard Hats
                        new PurchaseOrderItem { InventoryItemId = items[23].Id, Quantity = 40, UnitPrice = 12.50m }    // Nitrile Gloves
                    }
                },
                new PurchaseOrder
                {
                    SupplierId = suppliers[4].Id, // PackRight
                    OrderDate = now.AddDays(-1),
                    Status = PurchaseOrderStatus.Pending,
                    TotalAmount = 2100.80m,
                    TenantId = tenantId,
                    Items = new List<PurchaseOrderItem>
                    {
                        new PurchaseOrderItem { InventoryItemId = items[12].Id, Quantity = 500, UnitPrice = 1.85m },   // Corrugated Boxes
                        new PurchaseOrderItem { InventoryItemId = items[13].Id, Quantity = 72, UnitPrice = 3.20m },    // Packing Tape
                        new PurchaseOrderItem { InventoryItemId = items[15].Id, Quantity = 30, UnitPrice = 18.00m }    // Wooden Pallets
                    }
                },
                new PurchaseOrder
                {
                    SupplierId = suppliers[0].Id, // Acme Industrial
                    OrderDate = now.AddDays(-21),
                    Status = PurchaseOrderStatus.Delivered,
                    TotalAmount = 756.00m,
                    TenantId = tenantId,
                    Items = new List<PurchaseOrderItem>
                    {
                        new PurchaseOrderItem { InventoryItemId = items[4].Id, Quantity = 40, UnitPrice = 18.90m }  // SSR Relays
                    }
                }
            };
            context.PurchaseOrders.AddRange(orders);
            await context.SaveChangesAsync();

            // Stock Movements (25 movements spread over last 48 hours)
            var movements = new[]
            {
                // --- Inbound from received POs ---
                new StockMovement { InventoryItemId = items[6].Id, Type = "IN", Quantity = 5000, Reason = "PO received - Acme Industrial #1001", Timestamp = now.AddHours(-47), TenantId = tenantId },
                new StockMovement { InventoryItemId = items[10].Id, Type = "IN", Quantity = 200, Reason = "PO received - Acme Industrial #1001", Timestamp = now.AddHours(-47), TenantId = tenantId },
                new StockMovement { InventoryItemId = items[7].Id, Type = "IN", Quantity = 2000, Reason = "PO received - Acme Industrial #1001", Timestamp = now.AddHours(-46.5), TenantId = tenantId },
                new StockMovement { InventoryItemId = items[4].Id, Type = "IN", Quantity = 40, Reason = "PO received - Acme Industrial #1006", Timestamp = now.AddHours(-44), TenantId = tenantId },

                // --- Order fulfillments (OUT) ---
                new StockMovement { InventoryItemId = items[0].Id, Type = "OUT", Quantity = 5, Reason = "Order fulfillment #4521 - Meridian Robotics", Timestamp = now.AddHours(-42), TenantId = tenantId },
                new StockMovement { InventoryItemId = items[6].Id, Type = "OUT", Quantity = 800, Reason = "Order fulfillment #4522 - Atlas Construction", Timestamp = now.AddHours(-40), TenantId = tenantId },
                new StockMovement { InventoryItemId = items[12].Id, Type = "OUT", Quantity = 120, Reason = "Order fulfillment #4523 - Pinnacle Logistics", Timestamp = now.AddHours(-38), TenantId = tenantId },
                new StockMovement { InventoryItemId = items[22].Id, Type = "OUT", Quantity = 10, Reason = "Order fulfillment #4524 - site crew deployment", Timestamp = now.AddHours(-36), TenantId = tenantId },
                new StockMovement { InventoryItemId = items[1].Id, Type = "OUT", Quantity = 30, Reason = "Order fulfillment #4525 - ThermoSys Inc", Timestamp = now.AddHours(-34), TenantId = tenantId },

                // --- Cycle count adjustments ---
                new StockMovement { InventoryItemId = items[8].Id, Type = "ADJUSTMENT", Quantity = 50, Reason = "Cycle count variance - found extra stock in aisle B7", Timestamp = now.AddHours(-32), TenantId = tenantId },
                new StockMovement { InventoryItemId = items[14].Id, Type = "ADJUSTMENT", Quantity = 3, Reason = "Cycle count variance - damaged units removed from shelf", Timestamp = now.AddHours(-30), TenantId = tenantId },
                new StockMovement { InventoryItemId = items[20].Id, Type = "ADJUSTMENT", Quantity = 2, Reason = "Cycle count variance - miscount correction", Timestamp = now.AddHours(-28), TenantId = tenantId },

                // --- Warehouse transfers ---
                new StockMovement { InventoryItemId = items[2].Id, Type = "OUT", Quantity = 50, Reason = "Warehouse transfer - Main to Overflow (rebalance)", Timestamp = now.AddHours(-26), TenantId = tenantId },
                new StockMovement { InventoryItemId = items[2].Id, Type = "IN", Quantity = 50, Reason = "Warehouse transfer - received from Main Distribution", Timestamp = now.AddHours(-25.5), TenantId = tenantId },

                // --- Returns and QA ---
                new StockMovement { InventoryItemId = items[3].Id, Type = "IN", Quantity = 4, Reason = "Return from QA hold - units passed retest", Timestamp = now.AddHours(-24), TenantId = tenantId },
                new StockMovement { InventoryItemId = items[25].Id, Type = "IN", Quantity = 3, Reason = "Return from field - unopened units from job site #78", Timestamp = now.AddHours(-22), TenantId = tenantId },

                // --- More fulfillments ---
                new StockMovement { InventoryItemId = items[17].Id, Type = "OUT", Quantity = 8, Reason = "Order fulfillment #4530 - Apex Fabrication", Timestamp = now.AddHours(-20), TenantId = tenantId },
                new StockMovement { InventoryItemId = items[27].Id, Type = "OUT", Quantity = 12, Reason = "Order fulfillment #4531 - warehouse retrofit project", Timestamp = now.AddHours(-18), TenantId = tenantId },
                new StockMovement { InventoryItemId = items[13].Id, Type = "OUT", Quantity = 24, Reason = "Order fulfillment #4532 - shipping dept replenish", Timestamp = now.AddHours(-16), TenantId = tenantId },
                new StockMovement { InventoryItemId = items[23].Id, Type = "OUT", Quantity = 12, Reason = "Order fulfillment #4533 - cleanroom restock", Timestamp = now.AddHours(-14), TenantId = tenantId },

                // --- Receiving ---
                new StockMovement { InventoryItemId = items[29].Id, Type = "IN", Quantity = 6, Reason = "Spot buy received - urgent Romex restock", Timestamp = now.AddHours(-10), TenantId = tenantId },
                new StockMovement { InventoryItemId = items[16].Id, Type = "IN", Quantity = 10, Reason = "Vendor sample - PackRight new label stock", Timestamp = now.AddHours(-8), TenantId = tenantId },

                // --- Recent adjustments ---
                new StockMovement { InventoryItemId = items[9].Id, Type = "ADJUSTMENT", Quantity = 2, Reason = "Damaged in transit - written off per incident #IR-2026-041", Timestamp = now.AddHours(-6), TenantId = tenantId },
                new StockMovement { InventoryItemId = items[20].Id, Type = "ADJUSTMENT", Quantity = 5, Reason = "Cycle count variance - neoprene gaskets degraded in storage", Timestamp = now.AddHours(-4), TenantId = tenantId },

                // --- Most recent ---
                new StockMovement { InventoryItemId = items[11].Id, Type = "OUT", Quantity = 15, Reason = "Order fulfillment #4538 - maintenance dept", Timestamp = now.AddHours(-2), TenantId = tenantId }
            };
            context.StockMovements.AddRange(movements);
            await context.SaveChangesAsync();
        }
    }
}
