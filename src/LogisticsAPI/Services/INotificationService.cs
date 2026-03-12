namespace LogisticsAPI.Services
{
    public interface INotificationService
    {
        Task NotifyInventoryChangedAsync(int itemId, string action);
        Task NotifyStockMovementAsync(int movementId, string itemName, string type, int quantity);
        Task NotifyPurchaseOrderUpdatedAsync(int orderId, string status);
        Task NotifyLowStockAsync(int itemId, string itemName, string sku, int currentQuantity, int reorderLevel);
    }
}
