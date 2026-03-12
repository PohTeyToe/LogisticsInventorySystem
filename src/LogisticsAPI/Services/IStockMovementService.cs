using LogisticsAPI.DTOs;

namespace LogisticsAPI.Services
{
    public interface IStockMovementService
    {
        Task<IEnumerable<StockMovementResponse>> GetMovementsAsync(int? itemId = null, string? type = null, int limit = 50);
        Task<StockMovementResponse> RecordMovementAsync(CreateStockMovementRequest request);
        Task<IEnumerable<StockMovementResponse>> GetItemHistoryAsync(int itemId);
        Task<StockTransferResponse> TransferStockAsync(StockTransferRequest request);
    }
}
