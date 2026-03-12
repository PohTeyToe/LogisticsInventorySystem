using LogisticsAPI.DTOs;
using LogisticsAPI.Models;
using LogisticsAPI.Repositories;
using Microsoft.Extensions.Caching.Memory;

namespace LogisticsAPI.Services
{
    public class InventoryService : IInventoryService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly INotificationService _notificationService;
        private readonly IMemoryCache _cache;

        public InventoryService(IUnitOfWork unitOfWork, INotificationService notificationService, IMemoryCache cache)
        {
            _unitOfWork = unitOfWork;
            _notificationService = notificationService;
            _cache = cache;
        }

        public async Task<PaginatedResponse<InventoryItemResponse>> GetItemsAsync(
            int page, int pageSize, string? search = null)
        {
            var (items, totalCount) = await _unitOfWork.Inventory.GetPagedAsync(page, pageSize, search);
            return new PaginatedResponse<InventoryItemResponse>
            {
                Items = items.Select(MapToResponse),
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize
            };
        }

        public async Task<InventoryItemResponse?> GetItemByIdAsync(int id)
        {
            var item = await _unitOfWork.Inventory.GetByIdWithDetailsAsync(id);
            return item != null ? MapToResponse(item) : null;
        }

        public async Task<InventoryItemResponse> CreateItemAsync(CreateInventoryItemRequest request)
        {
            // Check for duplicate SKU
            var existing = await _unitOfWork.Inventory.GetBySkuAsync(request.SKU);
            if (existing != null)
                throw new InvalidOperationException($"An item with SKU '{request.SKU}' already exists.");

            var item = new InventoryItem
            {
                SKU = request.SKU,
                Name = request.Name,
                Description = request.Description,
                Quantity = request.Quantity,
                Location = request.Location,
                UnitPrice = request.UnitPrice,
                CategoryId = request.CategoryId,
                WarehouseId = request.WarehouseId,
                ReorderLevel = request.ReorderLevel,
                LotNumber = request.LotNumber,
                SerialNumber = request.SerialNumber,
                ExpiryDate = request.ExpiryDate,
                UnitOfMeasure = request.UnitOfMeasure ?? "EA",
                WarehouseZone = request.WarehouseZone,
                CurrencyCode = request.CurrencyCode ?? "USD",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _unitOfWork.Inventory.AddAsync(item);
            await _unitOfWork.SaveChangesAsync();
            InvalidateReportCaches();

            await _notificationService.NotifyInventoryChangedAsync(item.Id, "Created");
            if (item.Quantity <= item.ReorderLevel)
            {
                await _notificationService.NotifyLowStockAsync(
                    item.Id, item.Name, item.SKU, item.Quantity, item.ReorderLevel);
            }

            return MapToResponse(item);
        }

        public async Task<InventoryItemResponse?> UpdateItemAsync(int id, UpdateInventoryItemRequest request)
        {
            var item = await _unitOfWork.Inventory.GetByIdAsync(id);
            if (item == null) return null;

            if (request.Name != null) item.Name = request.Name;
            if (request.Description != null) item.Description = request.Description;
            if (request.Quantity.HasValue) item.Quantity = request.Quantity.Value;
            if (request.Location != null) item.Location = request.Location;
            if (request.UnitPrice.HasValue) item.UnitPrice = request.UnitPrice.Value;
            if (request.CategoryId.HasValue) item.CategoryId = request.CategoryId.Value;
            if (request.WarehouseId.HasValue) item.WarehouseId = request.WarehouseId.Value;
            if (request.ReorderLevel.HasValue) item.ReorderLevel = request.ReorderLevel.Value;
            if (request.LotNumber != null) item.LotNumber = request.LotNumber;
            if (request.SerialNumber != null) item.SerialNumber = request.SerialNumber;
            if (request.ExpiryDate.HasValue) item.ExpiryDate = request.ExpiryDate.Value;
            if (request.UnitOfMeasure != null) item.UnitOfMeasure = request.UnitOfMeasure;
            if (request.WarehouseZone != null) item.WarehouseZone = request.WarehouseZone;
            if (request.CurrencyCode != null) item.CurrencyCode = request.CurrencyCode;
            item.UpdatedAt = DateTime.UtcNow;

            await _unitOfWork.Inventory.UpdateAsync(item);
            await _unitOfWork.SaveChangesAsync();
            InvalidateReportCaches();

            await _notificationService.NotifyInventoryChangedAsync(item.Id, "Updated");
            if (item.Quantity <= item.ReorderLevel)
            {
                await _notificationService.NotifyLowStockAsync(
                    item.Id, item.Name, item.SKU, item.Quantity, item.ReorderLevel);
            }

            return MapToResponse(item);
        }

        public async Task<bool> DeleteItemAsync(int id)
        {
            var item = await _unitOfWork.Inventory.GetByIdAsync(id);
            if (item == null) return false;

            await _unitOfWork.Inventory.DeleteAsync(item);
            await _unitOfWork.SaveChangesAsync();
            InvalidateReportCaches();

            await _notificationService.NotifyInventoryChangedAsync(id, "Deleted");

            return true;
        }

        public async Task<IEnumerable<InventoryItemResponse>> GetLowStockAlertsAsync(int threshold)
        {
            var items = await _unitOfWork.Inventory.GetLowStockItemsAsync(threshold);
            return items.Select(MapToResponse);
        }

        public async Task<InventoryValuationReport> GetValuationReportAsync()
        {
            var items = await _unitOfWork.Inventory.GetAllWithDetailsAsync();
            var itemList = items.ToList();

            return new InventoryValuationReport
            {
                TotalItems = itemList.Count,
                TotalQuantity = itemList.Sum(i => i.Quantity),
                TotalValue = itemList.Sum(i => i.Quantity * i.UnitPrice),
                CategoryBreakdown = itemList
                    .GroupBy(i => i.Category?.Name ?? "Uncategorized")
                    .Select(g => new CategoryValuation
                    {
                        CategoryName = g.Key,
                        ItemCount = g.Count(),
                        TotalValue = g.Sum(i => i.Quantity * i.UnitPrice)
                    })
                    .ToList(),
                WarehouseBreakdown = itemList
                    .GroupBy(i => i.Warehouse?.Name ?? "Unassigned")
                    .Select(g => new WarehouseValuation
                    {
                        WarehouseName = g.Key,
                        ItemCount = g.Count(),
                        TotalValue = g.Sum(i => i.Quantity * i.UnitPrice)
                    })
                    .ToList()
            };
        }

        private void InvalidateReportCaches()
        {
            _cache.Remove("report:valuation");
            _cache.Remove("report:low-stock");
            _cache.Remove("report:total-value");
        }

        private static InventoryItemResponse MapToResponse(InventoryItem item)
        {
            return new InventoryItemResponse
            {
                Id = item.Id,
                SKU = item.SKU,
                Name = item.Name,
                Description = item.Description,
                Quantity = item.Quantity,
                Location = item.Location,
                UnitPrice = item.UnitPrice,
                CategoryName = item.Category?.Name,
                WarehouseName = item.Warehouse?.Name,
                ReorderLevel = item.ReorderLevel,
                TenantId = item.TenantId,
                CreatedAt = item.CreatedAt,
                UpdatedAt = item.UpdatedAt,
                LotNumber = item.LotNumber,
                SerialNumber = item.SerialNumber,
                ExpiryDate = item.ExpiryDate,
                UnitOfMeasure = item.UnitOfMeasure,
                WarehouseZone = item.WarehouseZone,
                CurrencyCode = item.CurrencyCode
            };
        }
    }
}
