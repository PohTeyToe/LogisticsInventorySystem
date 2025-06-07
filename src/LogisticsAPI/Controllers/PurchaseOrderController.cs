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
    public class PurchaseOrderController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public PurchaseOrderController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<PurchaseOrderResponse>>> GetOrders(
            [FromQuery] string? status = null)
        {
            var query = _context.PurchaseOrders
                .Include(po => po.Supplier)
                .Include(po => po.Items)
                    .ThenInclude(i => i.InventoryItem)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(status))
                query = query.Where(po => po.Status == status);

            var orders = await query
                .OrderByDescending(po => po.OrderDate)
                .Select(po => MapToResponse(po))
                .ToListAsync();

            return Ok(orders);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<PurchaseOrderResponse>> GetOrder(int id)
        {
            var order = await _context.PurchaseOrders
                .Include(po => po.Supplier)
                .Include(po => po.Items)
                    .ThenInclude(i => i.InventoryItem)
                .FirstOrDefaultAsync(po => po.Id == id);

            if (order == null)
                return NotFound();

            return Ok(MapToResponse(order));
        }

        [HttpPost]
        public async Task<ActionResult<PurchaseOrderResponse>> CreateOrder(
            [FromBody] CreatePurchaseOrderRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var supplier = await _context.Suppliers.FindAsync(request.SupplierId);
            if (supplier == null)
                return BadRequest("Supplier not found.");

            var order = new PurchaseOrder
            {
                SupplierId = request.SupplierId,
                Status = "Pending",
                OrderDate = DateTime.UtcNow
            };

            foreach (var itemRequest in request.Items)
            {
                var inventoryItem = await _context.InventoryItems.FindAsync(itemRequest.InventoryItemId);
                if (inventoryItem == null)
                    return BadRequest($"Inventory item with ID {itemRequest.InventoryItemId} not found.");

                order.Items.Add(new PurchaseOrderItem
                {
                    InventoryItemId = itemRequest.InventoryItemId,
                    Quantity = itemRequest.Quantity,
                    UnitPrice = itemRequest.UnitPrice
                });
            }

            order.TotalAmount = order.Items.Sum(i => i.Quantity * i.UnitPrice);

            _context.PurchaseOrders.Add(order);
            await _context.SaveChangesAsync();

            // Reload with navigation properties
            await _context.Entry(order).Reference(o => o.Supplier).LoadAsync();
            foreach (var item in order.Items)
                await _context.Entry(item).Reference(i => i.InventoryItem).LoadAsync();

            return CreatedAtAction(nameof(GetOrder), new { id = order.Id }, MapToResponse(order));
        }

        [HttpPut("{id}/status")]
        public async Task<ActionResult<PurchaseOrderResponse>> UpdateStatus(
            int id, [FromBody] UpdatePurchaseOrderStatusRequest request)
        {
            var order = await _context.PurchaseOrders
                .Include(po => po.Supplier)
                .Include(po => po.Items)
                    .ThenInclude(i => i.InventoryItem)
                .FirstOrDefaultAsync(po => po.Id == id);

            if (order == null)
                return NotFound();

            var validTransitions = new Dictionary<string, string[]>
            {
                ["Pending"] = new[] { "Approved", "Cancelled" },
                ["Approved"] = new[] { "Received", "Cancelled" },
                ["Received"] = Array.Empty<string>(),
                ["Cancelled"] = Array.Empty<string>()
            };

            if (!validTransitions.ContainsKey(order.Status) ||
                !validTransitions[order.Status].Contains(request.Status))
            {
                return BadRequest($"Cannot transition from '{order.Status}' to '{request.Status}'.");
            }

            order.Status = request.Status;

            // When order is received, update inventory quantities
            if (request.Status == "Received")
            {
                foreach (var item in order.Items)
                {
                    if (item.InventoryItem != null)
                    {
                        item.InventoryItem.Quantity += item.Quantity;
                        item.InventoryItem.UpdatedAt = DateTime.UtcNow;
                    }
                }
            }

            await _context.SaveChangesAsync();

            return Ok(MapToResponse(order));
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteOrder(int id)
        {
            var order = await _context.PurchaseOrders.FindAsync(id);
            if (order == null)
                return NotFound();

            if (order.Status == "Received")
                return BadRequest("Cannot delete a received order.");

            _context.PurchaseOrders.Remove(order);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private static PurchaseOrderResponse MapToResponse(PurchaseOrder order)
        {
            return new PurchaseOrderResponse
            {
                Id = order.Id,
                SupplierName = order.Supplier?.Name ?? "Unknown",
                OrderDate = order.OrderDate,
                Status = order.Status,
                TotalAmount = order.TotalAmount,
                Items = order.Items.Select(i => new PurchaseOrderItemResponse
                {
                    Id = i.Id,
                    ItemName = i.InventoryItem?.Name ?? "Unknown",
                    ItemSKU = i.InventoryItem?.SKU ?? "Unknown",
                    Quantity = i.Quantity,
                    UnitPrice = i.UnitPrice
                }).ToList()
            };
        }
    }
}
