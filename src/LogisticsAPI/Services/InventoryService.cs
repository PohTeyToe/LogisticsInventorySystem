using LogisticsAPI.DTOs;
using LogisticsAPI.Models;
using LogisticsAPI.Repositories;

namespace LogisticsAPI.Services
{
    public class InventoryService : IInventoryService
    {
        private readonly IInventoryRepository _repository;

        public InventoryService(IInventoryRepository repository)
        {
            _repository = repository;
        }

        public async Task<PaginatedResponse<InventoryItemResponse>> GetItemsAsync(
            int page, int pageSize, string? search = null)
        {
            var (items, totalCount) = await _repository.GetPagedAsync(page, pageSize, search);
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
            var item = await _repository.GetByIdWithDetailsAsync(id);
            return item != null ? MapToResponse(item) : null;
        }

        public async Task<InventoryItemResponse> CreateItemAsync(CreateInventoryItemRequest request)
        {
            // Check for duplicate SKU
            var existing = await _repository.GetBySkuAsync(request.SKU);
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
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _repository.AddAsync(item);
            return MapToResponse(item);
        }

        public async Task<InventoryItemResponse?> UpdateItemAsync(int id, UpdateInventoryItemRequest request)
        {
            var item = await _repository.GetByIdAsync(id);
            if (item == null) return null;

            if (request.Name != null) item.Name = request.Name;
            if (request.Description != null) item.Description = request.Description;
            if (request.Quantity.HasValue) item.Quantity = request.Quantity.Value;
            if (request.Location != null) item.Location = request.Location;
            if (request.UnitPrice.HasValue) item.UnitPrice = request.UnitPrice.Value;
            if (request.CategoryId.HasValue) item.CategoryId = request.CategoryId.Value;
            if (request.WarehouseId.HasValue) item.WarehouseId = request.WarehouseId.Value;
            if (request.ReorderLevel.HasValue) item.ReorderLevel = request.ReorderLevel.Value;
            item.UpdatedAt = DateTime.UtcNow;

            await _repository.UpdateAsync(item);
            return MapToResponse(item);
        }

        public async Task<bool> DeleteItemAsync(int id)
        {
            var item = await _repository.GetByIdAsync(id);
            if (item == null) return false;

            await _repository.DeleteAsync(item);
            return true;
        }

        public async Task<IEnumerable<InventoryItemResponse>> GetLowStockAlertsAsync(int threshold)
        {
            var items = await _repository.GetLowStockItemsAsync(threshold);
            return items.Select(MapToResponse);
        }

        public async Task<InventoryValuationReport> GetValuationReportAsync()
        {
            var items = await _repository.GetAllAsync();
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
                UpdatedAt = item.UpdatedAt
            };
        }
    }
}
