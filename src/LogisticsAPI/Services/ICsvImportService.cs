using LogisticsAPI.DTOs;

namespace LogisticsAPI.Services
{
    public interface ICsvImportService
    {
        Task<ImportResult> ImportInventoryItemsAsync(Stream csvStream);
        Task<ImportResult> ValidateInventoryItemsAsync(Stream csvStream);
    }
}
