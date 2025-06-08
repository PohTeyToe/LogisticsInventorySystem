using LogisticsAPI.Data;
using LogisticsAPI.DTOs;
using LogisticsAPI.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LogisticsAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Produces("application/json", "application/xml")]
    public class StockMovementController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public StockMovementController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<StockMovementResponse>>> GetMovements(
            [FromQuery] int? itemId = null,
            [FromQuery] string? type = null,
            [FromQuery] int limit = 50)
        {
            var query = _context.StockMovements
                .Include(m => m.InventoryItem)
                .AsQueryable();

            if (itemId.HasValue)
                query = query.Where(m => m.InventoryItemId == itemId.Value);

            if (!string.IsNullOrWhiteSpace(type))
                query = query.Where(m => m.Type == type.ToUpper());

            var movements = await query
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

            return Ok(movements);
        }

        [HttpPost]
        public async Task<ActionResult<StockMovementResponse>> RecordMovement(
            [FromBody] CreateStockMovementRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var item = await _context.InventoryItems.FindAsync(request.InventoryItemId);
            if (item == null)
                return BadRequest("Inventory item not found.");

            // Validate sufficient stock for OUT movements
            if (request.Type == "OUT" && item.Quantity < request.Quantity)
                return BadRequest($"Insufficient stock. Available: {item.Quantity}, Requested: {request.Quantity}");

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

            return CreatedAtAction(nameof(GetMovements), null,
                new StockMovementResponse
                {
                    Id = movement.Id,
                    ItemName = item.Name,
                    ItemSKU = item.SKU,
                    Type = movement.Type,
                    Quantity = movement.Quantity,
                    Reason = movement.Reason,
                    Timestamp = movement.Timestamp
                });
        }

        [HttpGet("item/{itemId}/history")]
        public async Task<ActionResult<IEnumerable<StockMovementResponse>>> GetItemHistory(int itemId)
        {
            var movements = await _context.StockMovements
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

            return Ok(movements);
        }
    }
}
