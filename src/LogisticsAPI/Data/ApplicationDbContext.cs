using Microsoft.EntityFrameworkCore;

namespace LogisticsAPI.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        {
        }

        // This DbSet property will become a table in the database named "InventoryItems"
        public DbSet<InventoryItem> InventoryItems { get; set; }
    }
}
