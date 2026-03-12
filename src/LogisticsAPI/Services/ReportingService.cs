using LogisticsAPI.Data;
using LogisticsAPI.DTOs;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

namespace LogisticsAPI.Services
{
    public class ReportingService : IReportingService
    {
        private readonly ApplicationDbContext _context;
        private readonly IMemoryCache _cache;

        private static readonly TimeSpan LowStockCacheDuration = TimeSpan.FromMinutes(2);
        private static readonly TimeSpan TotalValueCacheDuration = TimeSpan.FromMinutes(5);

        public ReportingService(ApplicationDbContext context, IMemoryCache cache)
        {
            _context = context;
            _cache = cache;
        }

        public async Task<IEnumerable<LowStockAlert>> GetLowStockAlertsAsync(int threshold)
        {
            var cacheKey = $"report:low-stock:{threshold}";

            if (_cache.TryGetValue(cacheKey, out IEnumerable<LowStockAlert>? cached) && cached != null)
                return cached;

            var result = await _context.InventoryItems
                .Include(i => i.Category)
                .Include(i => i.Warehouse)
                .Where(i => i.Quantity <= threshold || i.Quantity <= i.ReorderLevel)
                .OrderBy(i => i.Quantity)
                .Select(i => new LowStockAlert
                {
                    ItemId = i.Id,
                    SKU = i.SKU,
                    Name = i.Name,
                    CurrentQuantity = i.Quantity,
                    ReorderLevel = i.ReorderLevel,
                    CategoryName = i.Category != null ? i.Category.Name : null,
                    WarehouseName = i.Warehouse != null ? i.Warehouse.Name : null
                })
                .ToListAsync();

            _cache.Set(cacheKey, result, LowStockCacheDuration);
            return result;
        }

        public async Task<decimal> CalculateTotalInventoryValueAsync()
        {
            const string cacheKey = "report:total-value";

            if (_cache.TryGetValue(cacheKey, out decimal cached))
                return cached;

            var result = await _context.InventoryItems
                .SumAsync(i => i.Quantity * i.UnitPrice);

            _cache.Set(cacheKey, result, TotalValueCacheDuration);
            return result;
        }
    }
}
