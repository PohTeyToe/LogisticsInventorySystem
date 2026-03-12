using LogisticsAPI.Data;
using LogisticsAPI.DTOs;
using LogisticsAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace LogisticsAPI.Services
{
    public class PurchaseOrderService : IPurchaseOrderService
    {
        private readonly ApplicationDbContext _context;
        private readonly INotificationService _notificationService;

        public PurchaseOrderService(ApplicationDbContext context, INotificationService notificationService)
        {
            _context = context;
            _notificationService = notificationService;
        }

        public async Task<IEnumerable<PurchaseOrderResponse>> GetAllOrdersAsync(string? status = null)
        {
            var query = _context.PurchaseOrders
                .Include(po => po.Supplier)
                .Include(po => po.Items)
                    .ThenInclude(i => i.InventoryItem)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<PurchaseOrderStatus>(status, true, out var parsedStatus))
                query = query.Where(po => po.Status == parsedStatus);

            var orders = await query
                .OrderByDescending(po => po.OrderDate)
                .ToListAsync();

            return orders.Select(MapToResponse);
        }

        public async Task<PurchaseOrderResponse?> GetOrderByIdAsync(int id)
        {
            var order = await _context.PurchaseOrders
                .Include(po => po.Supplier)
                .Include(po => po.Items)
                    .ThenInclude(i => i.InventoryItem)
                .FirstOrDefaultAsync(po => po.Id == id);

            return order != null ? MapToResponse(order) : null;
        }

        public async Task<PurchaseOrderResponse> CreateOrderAsync(CreatePurchaseOrderRequest request)
        {
            var supplier = await _context.Suppliers.FindAsync(request.SupplierId);
            if (supplier == null)
                throw new ArgumentException("Supplier not found.");

            var order = new PurchaseOrder
            {
                SupplierId = request.SupplierId,
                Status = PurchaseOrderStatus.Pending,
                OrderDate = DateTime.UtcNow
            };

            foreach (var itemRequest in request.Items)
            {
                var inventoryItem = await _context.InventoryItems.FindAsync(itemRequest.InventoryItemId);
                if (inventoryItem == null)
                    throw new ArgumentException($"Inventory item with ID {itemRequest.InventoryItemId} not found.");

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

            await _notificationService.NotifyPurchaseOrderUpdatedAsync(order.Id, order.Status.ToString());

            return MapToResponse(order);
        }

        public async Task<PurchaseOrderResponse?> UpdateOrderStatusAsync(int id, UpdatePurchaseOrderStatusRequest request)
        {
            var order = await _context.PurchaseOrders
                .Include(po => po.Supplier)
                .Include(po => po.Items)
                    .ThenInclude(i => i.InventoryItem)
                .FirstOrDefaultAsync(po => po.Id == id);

            if (order == null)
                return null;

            var validTransitions = new Dictionary<PurchaseOrderStatus, PurchaseOrderStatus[]>
            {
                [PurchaseOrderStatus.Pending] = new[] { PurchaseOrderStatus.Approved, PurchaseOrderStatus.Cancelled },
                [PurchaseOrderStatus.Approved] = new[] { PurchaseOrderStatus.Shipped, PurchaseOrderStatus.Cancelled },
                [PurchaseOrderStatus.Shipped] = new[] { PurchaseOrderStatus.Delivered, PurchaseOrderStatus.Cancelled },
                [PurchaseOrderStatus.Delivered] = Array.Empty<PurchaseOrderStatus>(),
                [PurchaseOrderStatus.Cancelled] = Array.Empty<PurchaseOrderStatus>()
            };

            if (!validTransitions.ContainsKey(order.Status) ||
                !validTransitions[order.Status].Contains(request.Status))
            {
                throw new InvalidOperationException($"Cannot transition from '{order.Status}' to '{request.Status}'.");
            }

            order.Status = request.Status;

            // When order is delivered, update inventory quantities
            if (request.Status == PurchaseOrderStatus.Delivered)
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

            await _notificationService.NotifyPurchaseOrderUpdatedAsync(order.Id, order.Status.ToString());

            // If delivered, inventory quantities changed — notify for each item
            if (request.Status == PurchaseOrderStatus.Delivered)
            {
                foreach (var item in order.Items)
                {
                    if (item.InventoryItem != null)
                    {
                        await _notificationService.NotifyInventoryChangedAsync(item.InventoryItemId, "PurchaseOrderDelivered");
                    }
                }
            }

            return MapToResponse(order);
        }

        public async Task<bool> DeleteOrderAsync(int id)
        {
            var order = await _context.PurchaseOrders.FindAsync(id);
            if (order == null)
                return false;

            if (order.Status == PurchaseOrderStatus.Delivered)
                throw new InvalidOperationException("Cannot delete a delivered order.");

            _context.PurchaseOrders.Remove(order);
            await _context.SaveChangesAsync();
            return true;
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
