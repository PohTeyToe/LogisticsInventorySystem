using LogisticsAPI.DTOs;

namespace LogisticsAPI.Services
{
    public interface IInventoryService
    {
        Task<PaginatedResponse<InventoryItemResponse>> GetItemsAsync(int page, int pageSize, string? search = null);
        Task<InventoryItemResponse?> GetItemByIdAsync(int id);
        Task<InventoryItemResponse> CreateItemAsync(CreateInventoryItemRequest request);
        Task<InventoryItemResponse?> UpdateItemAsync(int id, UpdateInventoryItemRequest request);
        Task<bool> DeleteItemAsync(int id);
        Task<IEnumerable<InventoryItemResponse>> GetLowStockAlertsAsync(int threshold);
        Task<InventoryValuationReport> GetValuationReportAsync();
    }
}
