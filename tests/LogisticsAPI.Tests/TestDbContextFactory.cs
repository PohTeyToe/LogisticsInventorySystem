using LogisticsAPI.Data;
using Microsoft.EntityFrameworkCore;

namespace LogisticsAPI.Tests
{
    public static class TestDbContextFactory
    {
        public static ApplicationDbContext Create(string? databaseName = null)
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName ?? Guid.NewGuid().ToString())
                .Options;

            var context = new ApplicationDbContext(options);
            context.Database.EnsureCreated();
            return context;
        }
    }
}
