using LogisticsAPI.Data;
using LogisticsAPI.DTOs;
using LogisticsAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace LogisticsAPI.Services
{
    public class StockMovementService : IStockMovementService
    {
        private readonly ApplicationDbContext _context;
        private readonly INotificationService _notificationService;

        public StockMovementService(ApplicationDbContext context, INotificationService notificationService)
        {
            _context = context;
            _notificationService = notificationService;
        }

        public async Task<IEnumerable<StockMovementResponse>> GetMovementsAsync(
            int? itemId = null, string? type = null, int limit = 50)
        {
            var query = _context.StockMovements
                .Include(m => m.InventoryItem)
                .AsQueryable();

            if (itemId.HasValue)
                query = query.Where(m => m.InventoryItemId == itemId.Value);

            if (!string.IsNullOrWhiteSpace(type))
                query = query.Where(m => m.Type == type.ToUpper());

            return await query
                .OrderByDescending(m => m.Timestamp)
                .Take(limit)
                .Select(m => new StockMovementResponse
                {
                    Id = m.Id,
                    ItemName = m.InventoryItem != null ? m.InventoryItem.Name : "Unknown",
                    ItemSKU = m.InventoryItem != null ? m.InventoryItem.SKU : "Unknown",
                    Type = m.Type,
                    Quantity = m.Quantity,
                    Reason = m.Reason,
                    Timestamp = m.Timestamp,
                    MovementReasonCode = m.MovementReasonCode
                })
                .ToListAsync();
        }

        public async Task<StockMovementResponse> RecordMovementAsync(CreateStockMovementRequest request)
        {
            var item = await _context.InventoryItems.FindAsync(request.InventoryItemId);
            if (item == null)
                throw new ArgumentException("Inventory item not found.");

            // Validate sufficient stock for OUT movements
            if (request.Type == "OUT" && item.Quantity < request.Quantity)
                throw new InvalidOperationException($"Insufficient stock. Available: {item.Quantity}, Requested: {request.Quantity}");

            // Update inventory quantity
            switch (request.Type)
            {
                case "IN":
                    item.Quantity += request.Quantity;
                    break;
                case "OUT":
                    item.Quantity -= request.Quantity;
                    break;
                case "ADJUSTMENT":
                    item.Quantity = request.Quantity;
                    break;
            }

            item.UpdatedAt = DateTime.UtcNow;

            var movement = new StockMovement
            {
                InventoryItemId = request.InventoryItemId,
                Type = request.Type,
                Quantity = request.Quantity,
                Reason = request.Reason,
                MovementReasonCode = request.MovementReasonCode,
                Timestamp = DateTime.UtcNow
            };

            _context.StockMovements.Add(movement);
            await _context.SaveChangesAsync();

            await _notificationService.NotifyStockMovementAsync(movement.Id, item.Name, movement.Type, movement.Quantity);
            await _notificationService.NotifyInventoryChangedAsync(item.Id, "StockMovement");
            if (item.Quantity <= item.ReorderLevel)
            {
                await _notificationService.NotifyLowStockAsync(
                    item.Id, item.Name, item.SKU, item.Quantity, item.ReorderLevel);
            }

            return new StockMovementResponse
            {
                Id = movement.Id,
                ItemName = item.Name,
                ItemSKU = item.SKU,
                Type = movement.Type,
                Quantity = movement.Quantity,
                Reason = movement.Reason,
                Timestamp = movement.Timestamp,
                MovementReasonCode = movement.MovementReasonCode
            };
        }

        public async Task<IEnumerable<StockMovementResponse>> GetItemHistoryAsync(int itemId)
        {
            return await _context.StockMovements
                .Include(m => m.InventoryItem)
                .Where(m => m.InventoryItemId == itemId)
                .OrderByDescending(m => m.Timestamp)
                .Select(m => new StockMovementResponse
                {
                    Id = m.Id,
                    ItemName = m.InventoryItem != null ? m.InventoryItem.Name : "Unknown",
                    ItemSKU = m.InventoryItem != null ? m.InventoryItem.SKU : "Unknown",
                    Type = m.Type,
                    Quantity = m.Quantity,
                    Reason = m.Reason,
                    Timestamp = m.Timestamp,
                    MovementReasonCode = m.MovementReasonCode
                })
                .ToListAsync();
        }

        public async Task<StockTransferResponse> TransferStockAsync(StockTransferRequest request)
        {
            if (request.SourceWarehouseId == request.DestinationWarehouseId)
                throw new ArgumentException("Source and destination warehouses must be different.");

            var sourceWarehouse = await _context.Warehouses.FindAsync(request.SourceWarehouseId);
            if (sourceWarehouse == null)
                throw new ArgumentException("Source warehouse not found.");

            var destinationWarehouse = await _context.Warehouses.FindAsync(request.DestinationWarehouseId);
            if (destinationWarehouse == null)
                throw new ArgumentException("Destination warehouse not found.");

            var item = await _context.InventoryItems.FindAsync(request.InventoryItemId);
            if (item == null)
                throw new ArgumentException("Inventory item not found.");

            if (item.WarehouseId != request.SourceWarehouseId)
                throw new InvalidOperationException($"Item '{item.Name}' is not located in the source warehouse.");

            if (item.Quantity < request.Quantity)
                throw new InvalidOperationException($"Insufficient stock. Available: {item.Quantity}, Requested: {request.Quantity}");

            using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                var timestamp = DateTime.UtcNow;
                var reason = request.Reason ?? $"Inter-warehouse transfer from {sourceWarehouse.Name} to {destinationWarehouse.Name}";

                // OUT movement from source
                var outMovement = new StockMovement
                {
                    InventoryItemId = request.InventoryItemId,
                    Type = "OUT",
                    Quantity = request.Quantity,
                    Reason = $"Transfer OUT to {destinationWarehouse.Name} - {reason}",
                    Timestamp = timestamp
                };

                // IN movement to destination
                var inMovement = new StockMovement
                {
                    InventoryItemId = request.InventoryItemId,
                    Type = "IN",
                    Quantity = request.Quantity,
                    Reason = $"Transfer IN from {sourceWarehouse.Name} - {reason}",
                    Timestamp = timestamp
                };

                // Update inventory: decrease quantity at source
                item.Quantity -= request.Quantity;
                item.UpdatedAt = timestamp;

                _context.StockMovements.Add(outMovement);
                _context.StockMovements.Add(inMovement);
                await _context.SaveChangesAsync();

                await transaction.CommitAsync();

                await _notificationService.NotifyStockMovementAsync(outMovement.Id, item.Name, "OUT", request.Quantity);
                await _notificationService.NotifyStockMovementAsync(inMovement.Id, item.Name, "IN", request.Quantity);
                await _notificationService.NotifyInventoryChangedAsync(item.Id, "Transfer");
                if (item.Quantity <= item.ReorderLevel)
                {
                    await _notificationService.NotifyLowStockAsync(
                        item.Id, item.Name, item.SKU, item.Quantity, item.ReorderLevel);
                }

                return new StockTransferResponse
                {
                    OutMovement = new StockMovementResponse
                    {
                        Id = outMovement.Id,
                        ItemName = item.Name,
                        ItemSKU = item.SKU,
                        Type = outMovement.Type,
                        Quantity = outMovement.Quantity,
                        Reason = outMovement.Reason,
                        Timestamp = outMovement.Timestamp,
                        MovementReasonCode = outMovement.MovementReasonCode
                    },
                    InMovement = new StockMovementResponse
                    {
                        Id = inMovement.Id,
                        ItemName = item.Name,
                        ItemSKU = item.SKU,
                        Type = inMovement.Type,
                        Quantity = inMovement.Quantity,
                        Reason = inMovement.Reason,
                        Timestamp = inMovement.Timestamp,
                        MovementReasonCode = inMovement.MovementReasonCode
                    }
                };
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }
    }
}

