using LogisticsAPI.Hubs;
using Microsoft.AspNetCore.SignalR;

namespace LogisticsAPI.Services
{
    public class NotificationService : INotificationService
    {
        private readonly IHubContext<InventoryHub> _hubContext;
        private readonly ILogger<NotificationService> _logger;

        public NotificationService(IHubContext<InventoryHub> hubContext, ILogger<NotificationService> logger)
        {
            _hubContext = hubContext;
            _logger = logger;
        }

        public async Task NotifyInventoryChangedAsync(int itemId, string action)
        {
            _logger.LogInformation("Broadcasting InventoryUpdated: ItemId={ItemId}, Action={Action}", itemId, action);
            await _hubContext.Clients.All.SendAsync("InventoryUpdated", new
            {
                ItemId = itemId,
                Action = action,
                Timestamp = DateTime.UtcNow
            });
        }

        public async Task NotifyStockMovementAsync(int movementId, string itemName, string type, int quantity)
        {
            _logger.LogInformation("Broadcasting StockMovementCreated: MovementId={MovementId}, Item={ItemName}", movementId, itemName);
            await _hubContext.Clients.All.SendAsync("StockMovementCreated", new
            {
                MovementId = movementId,
                ItemName = itemName,
                Type = type,
                Quantity = quantity,
                Timestamp = DateTime.UtcNow
            });
        }

        public async Task NotifyPurchaseOrderUpdatedAsync(int orderId, string status)
        {
            _logger.LogInformation("Broadcasting PurchaseOrderUpdated: OrderId={OrderId}, Status={Status}", orderId, status);
            await _hubContext.Clients.All.SendAsync("PurchaseOrderUpdated", new
            {
                OrderId = orderId,
                Status = status,
                Timestamp = DateTime.UtcNow
            });
        }

        public async Task NotifyLowStockAsync(int itemId, string itemName, string sku, int currentQuantity, int reorderLevel)
        {
            _logger.LogInformation("Broadcasting LowStockAlert: ItemId={ItemId}, Item={ItemName}, Qty={Qty}", itemId, itemName, currentQuantity);
            await _hubContext.Clients.All.SendAsync("LowStockAlert", new
            {
                ItemId = itemId,
                ItemName = itemName,
                SKU = sku,
                CurrentQuantity = currentQuantity,
                ReorderLevel = reorderLevel,
                Timestamp = DateTime.UtcNow
            });
        }
    }
}
