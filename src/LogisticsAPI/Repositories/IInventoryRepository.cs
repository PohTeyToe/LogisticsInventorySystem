using LogisticsAPI.Models;

namespace LogisticsAPI.Repositories
{
    public interface IInventoryRepository : IRepository<InventoryItem>
    {
        Task<IEnumerable<InventoryItem>> GetLowStockItemsAsync(int threshold);
        Task<IEnumerable<InventoryItem>> SearchAsync(string searchTerm);
        Task<(IEnumerable<InventoryItem> Items, int TotalCount)> GetPagedAsync(int page, int pageSize, string? search = null);
        Task<InventoryItem?> GetBySkuAsync(string sku);
        Task<InventoryItem?> GetByIdWithDetailsAsync(int id);
    }
}
