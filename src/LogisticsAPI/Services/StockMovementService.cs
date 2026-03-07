using LogisticsAPI.Data;
using LogisticsAPI.DTOs;
using LogisticsAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace LogisticsAPI.Services
{
    public class StockMovementService : IStockMovementService
    {
        private readonly ApplicationDbContext _context;

        public StockMovementService(ApplicationDbContext context)
        {
            _context = context;
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
                    Timestamp = m.Timestamp
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
                Timestamp = DateTime.UtcNow
            };

            _context.StockMovements.Add(movement);
            await _context.SaveChangesAsync();

            return new StockMovementResponse
            {
                Id = movement.Id,
                ItemName = item.Name,
                ItemSKU = item.SKU,
                Type = movement.Type,
                Quantity = movement.Quantity,
                Reason = movement.Reason,
                Timestamp = movement.Timestamp
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
                    Timestamp = m.Timestamp
                })
                .ToListAsync();
        }
    }
}
