using System.Text.Json;
using LogisticsAPI.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace LogisticsAPI.Data
{
    public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
    {
        private int _tenantId = 1;

        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        {
        }

        public void SetTenantId(int tenantId)
        {
            _tenantId = tenantId;
        }

        public DbSet<InventoryItem> InventoryItems { get; set; }
        public DbSet<Category> Categories { get; set; }
        public DbSet<Warehouse> Warehouses { get; set; }
        public DbSet<Supplier> Suppliers { get; set; }
        public DbSet<PurchaseOrder> PurchaseOrders { get; set; }
        public DbSet<PurchaseOrderItem> PurchaseOrderItems { get; set; }
        public DbSet<StockMovement> StockMovements { get; set; }
        public DbSet<Tenant> Tenants { get; set; }
        public DbSet<Property> Properties { get; set; }
        public DbSet<PropertyOwner> PropertyOwners { get; set; }
        public DbSet<Reservation> Reservations { get; set; }
        public DbSet<AuditLog> AuditLogs { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Inventory Item configuration
            modelBuilder.Entity<InventoryItem>(entity =>
            {
                entity.HasIndex(e => e.SKU).IsUnique();
                entity.HasIndex(e => e.TenantId);
                entity.HasIndex(e => new { e.TenantId, e.SKU }).IsUnique();

                entity.HasOne(e => e.Category)
                    .WithMany(c => c.InventoryItems)
                    .HasForeignKey(e => e.CategoryId)
                    .OnDelete(DeleteBehavior.SetNull);

                entity.HasOne(e => e.Warehouse)
                    .WithMany(w => w.InventoryItems)
                    .HasForeignKey(e => e.WarehouseId)
                    .OnDelete(DeleteBehavior.SetNull);

                // Multi-tenant query filter
                entity.HasQueryFilter(e => e.TenantId == _tenantId);
            });

            // Category configuration
            modelBuilder.Entity<Category>(entity =>
            {
                entity.HasIndex(e => e.TenantId);
                entity.HasIndex(e => new { e.TenantId, e.Name }).IsUnique();
                entity.HasQueryFilter(e => e.TenantId == _tenantId);
            });

            // Warehouse configuration
            modelBuilder.Entity<Warehouse>(entity =>
            {
                entity.HasIndex(e => e.TenantId);
                entity.HasQueryFilter(e => e.TenantId == _tenantId);
            });

            // Supplier configuration
            modelBuilder.Entity<Supplier>(entity =>
            {
                entity.HasIndex(e => e.TenantId);
                entity.HasQueryFilter(e => e.TenantId == _tenantId);
            });

            // Purchase Order configuration
            modelBuilder.Entity<PurchaseOrder>(entity =>
            {
                entity.HasIndex(e => e.TenantId);
                entity.HasIndex(e => e.Status);

                entity.Property(e => e.Status)
                    .HasConversion<string>()
                    .HasMaxLength(20);

                entity.HasOne(e => e.Supplier)
                    .WithMany(s => s.PurchaseOrders)
                    .HasForeignKey(e => e.SupplierId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasQueryFilter(e => e.TenantId == _tenantId);
            });

            // Purchase Order Item configuration
            modelBuilder.Entity<PurchaseOrderItem>(entity =>
            {
                entity.HasOne(e => e.PurchaseOrder)
                    .WithMany(po => po.Items)
                    .HasForeignKey(e => e.PurchaseOrderId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.InventoryItem)
                    .WithMany()
                    .HasForeignKey(e => e.InventoryItemId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // Stock Movement configuration
            modelBuilder.Entity<StockMovement>(entity =>
            {
                entity.HasIndex(e => e.TenantId);
                entity.HasIndex(e => e.Timestamp);

                entity.HasOne(e => e.InventoryItem)
                    .WithMany()
                    .HasForeignKey(e => e.InventoryItemId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasQueryFilter(e => e.TenantId == _tenantId);
            });

            // Property configuration
            modelBuilder.Entity<Property>(entity =>
            {
                entity.HasIndex(e => e.TenantId);
                entity.HasQueryFilter(e => e.TenantId == _tenantId);
            });

            // PropertyOwner configuration
            modelBuilder.Entity<PropertyOwner>(entity =>
            {
                entity.HasIndex(e => e.TenantId);
                entity.HasQueryFilter(e => e.TenantId == _tenantId);
            });

            // Reservation configuration
            modelBuilder.Entity<Reservation>(entity =>
            {
                entity.HasIndex(e => e.TenantId);
                entity.HasQueryFilter(e => e.TenantId == _tenantId);
            });

            // AuditLog configuration
            modelBuilder.Entity<AuditLog>(entity =>
            {
                entity.HasIndex(e => e.TenantId);
                entity.HasIndex(e => e.Timestamp);
                entity.HasIndex(e => new { e.EntityType, e.EntityId });
                entity.HasQueryFilter(e => e.TenantId == _tenantId);
            });
        }

        public override int SaveChanges()
        {
            SetTenantIdOnEntities();
            var auditEntries = CaptureAuditEntries();
            var result = base.SaveChanges();
            if (auditEntries.Count > 0)
            {
                AuditLogs.AddRange(auditEntries);
                base.SaveChanges();
            }
            return result;
        }

        public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            SetTenantIdOnEntities();
            var auditEntries = CaptureAuditEntries();
            var result = await base.SaveChangesAsync(cancellationToken);
            if (auditEntries.Count > 0)
            {
                AuditLogs.AddRange(auditEntries);
                await base.SaveChangesAsync(cancellationToken);
            }
            return result;
        }

        private List<AuditLog> CaptureAuditEntries()
        {
            var auditEntries = new List<AuditLog>();

            foreach (var entry in ChangeTracker.Entries())
            {
                // Skip AuditLog itself to avoid recursion
                if (entry.Entity is AuditLog)
                    continue;

                // Skip unchanged or detached
                if (entry.State == EntityState.Unchanged || entry.State == EntityState.Detached)
                    continue;

                var entityType = entry.Entity.GetType().Name;
                var idProp = entry.Entity.GetType().GetProperty("Id");
                int entityId = 0;
                if (idProp != null)
                {
                    var idValue = idProp.GetValue(entry.Entity);
                    if (idValue is int intId) entityId = intId;
                    else if (idValue != null && int.TryParse(idValue.ToString(), out var parsed)) entityId = parsed;
                }

                string action = entry.State switch
                {
                    EntityState.Added => "Create",
                    EntityState.Modified => "Update",
                    EntityState.Deleted => "Delete",
                    _ => string.Empty
                };

                if (string.IsNullOrEmpty(action))
                    continue;

                string? changes = null;

                if (entry.State == EntityState.Modified)
                {
                    var changesDict = new Dictionary<string, object?>();
                    foreach (var prop in entry.Properties.Where(p => p.IsModified))
                    {
                        changesDict[prop.Metadata.Name] = new
                        {
                            Old = prop.OriginalValue,
                            New = prop.CurrentValue
                        };
                    }
                    if (changesDict.Count > 0)
                        changes = JsonSerializer.Serialize(changesDict);
                }
                else if (entry.State == EntityState.Added)
                {
                    var valuesDict = new Dictionary<string, object?>();
                    foreach (var prop in entry.Properties)
                    {
                        valuesDict[prop.Metadata.Name] = prop.CurrentValue;
                    }
                    changes = JsonSerializer.Serialize(valuesDict);
                }
                else if (entry.State == EntityState.Deleted)
                {
                    var valuesDict = new Dictionary<string, object?>();
                    foreach (var prop in entry.Properties)
                    {
                        valuesDict[prop.Metadata.Name] = prop.OriginalValue;
                    }
                    changes = JsonSerializer.Serialize(valuesDict);
                }

                auditEntries.Add(new AuditLog
                {
                    EntityType = entityType,
                    EntityId = entityId,
                    Action = action,
                    Changes = changes,
                    Timestamp = DateTime.UtcNow,
                    TenantId = _tenantId
                });
            }

            return auditEntries;
        }

        private void SetTenantIdOnEntities()
        {
            foreach (var entry in ChangeTracker.Entries())
            {
                if (entry.State == EntityState.Added)
                {
                    var tenantProp = entry.Entity.GetType().GetProperty("TenantId");
                    if (tenantProp != null && tenantProp.GetValue(entry.Entity) is int tid && tid == 0)
                    {
                        tenantProp.SetValue(entry.Entity, _tenantId);
                    }
                }
            }
        }
    }
}
