using LogisticsAPI.Data;
using LogisticsAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace LogisticsAPI.Repositories
{
    public class InventoryRepository : Repository<InventoryItem>, IInventoryRepository
    {
        public InventoryRepository(ApplicationDbContext context) : base(context)
        {
        }

        public async Task<IEnumerable<InventoryItem>> GetLowStockItemsAsync(int threshold)
        {
            return await _dbSet
                .Where(i => i.Quantity <= threshold)
                .OrderBy(i => i.Quantity)
                .ToListAsync();
        }

        public async Task<IEnumerable<InventoryItem>> SearchAsync(string searchTerm)
        {
            var term = searchTerm.ToLower();
            return await _dbSet
                .Where(i => i.Name.ToLower().Contains(term) ||
                            i.SKU.ToLower().Contains(term) ||
                            (i.Description != null && i.Description.ToLower().Contains(term)))
                .ToListAsync();
        }

        public async Task<(IEnumerable<InventoryItem> Items, int TotalCount)> GetPagedAsync(
            int page, int pageSize, string? search = null)
        {
            var query = _dbSet.AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.ToLower();
                query = query.Where(i => i.Name.ToLower().Contains(term) ||
                                         i.SKU.ToLower().Contains(term));
            }

            var totalCount = await query.CountAsync();
            var items = await query
                .OrderBy(i => i.Name)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Include(i => i.Category)
                .Include(i => i.Warehouse)
                .ToListAsync();

            return (items, totalCount);
        }

        public async Task<InventoryItem?> GetBySkuAsync(string sku)
        {
            return await _dbSet.FirstOrDefaultAsync(i => i.SKU == sku);
        }

        public async Task<InventoryItem?> GetByIdWithDetailsAsync(int id)
        {
            return await _dbSet
                .Include(i => i.Category)
                .Include(i => i.Warehouse)
                .FirstOrDefaultAsync(i => i.Id == id);
        }
    }
}
