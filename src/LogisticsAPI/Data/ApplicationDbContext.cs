using LogisticsAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace LogisticsAPI.Data
{
    public class ApplicationDbContext : DbContext
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
        }

        public override int SaveChanges()
        {
            SetTenantIdOnEntities();
            return base.SaveChanges();
        }

        public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            SetTenantIdOnEntities();
            return await base.SaveChangesAsync(cancellationToken);
        }

        private void SetTenantIdOnEntities()
        {
            foreach (var entry in ChangeTracker.Entries())
            {
                if (entry.State == EntityState.Added)
                {
                    var tenantProp = entry.Entity.GetType().GetProperty("TenantId");
                    if (tenantProp != null && (int)tenantProp.GetValue(entry.Entity)! == 0)
                    {
                        tenantProp.SetValue(entry.Entity, _tenantId);
                    }
                }
            }
        }
    }
}
