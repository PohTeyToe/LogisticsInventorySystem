using LogisticsAPI.DTOs;

namespace LogisticsAPI.Services
{
    public interface IReportingService
    {
        Task<IEnumerable<LowStockAlert>> GetLowStockAlertsAsync(int threshold);
        Task<decimal> CalculateTotalInventoryValueAsync();
    }
}
