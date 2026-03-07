using LogisticsAPI.DTOs;

namespace LogisticsAPI.Services
{
    public interface IPurchaseOrderService
    {
        Task<IEnumerable<PurchaseOrderResponse>> GetAllOrdersAsync(string? status = null);
        Task<PurchaseOrderResponse?> GetOrderByIdAsync(int id);
        Task<PurchaseOrderResponse> CreateOrderAsync(CreatePurchaseOrderRequest request);
        Task<PurchaseOrderResponse?> UpdateOrderStatusAsync(int id, UpdatePurchaseOrderStatusRequest request);
        Task<bool> DeleteOrderAsync(int id);
    }
}
