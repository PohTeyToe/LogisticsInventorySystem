using LogisticsAPI.Data;
using LogisticsAPI.DTOs;
using Microsoft.EntityFrameworkCore;

namespace LogisticsAPI.Services
{
    public class ReportingService : IReportingService
    {
        private readonly ApplicationDbContext _context;

        public ReportingService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<LowStockAlert>> GetLowStockAlertsAsync(int threshold)
        {
            return await _context.InventoryItems
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
                    WarehouseName = i.Warehouse != null ? i.Warehouse.Name : null
                })
                .ToListAsync();
        }

        public async Task<decimal> CalculateTotalInventoryValueAsync()
        {
            return await _context.InventoryItems
                .SumAsync(i => i.Quantity * i.UnitPrice);
        }
    }
}
