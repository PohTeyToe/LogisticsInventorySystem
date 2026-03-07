using LogisticsAPI.Data;
using LogisticsAPI.DTOs;
using LogisticsAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace LogisticsAPI.Services
{
    public class WarehouseService : IWarehouseService
    {
        private readonly ApplicationDbContext _context;

        public WarehouseService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<WarehouseResponse>> GetAllWarehousesAsync()
        {
            return await _context.Warehouses
                .Include(w => w.InventoryItems)
                .Select(w => new WarehouseResponse
                {
                    Id = w.Id,
                    Name = w.Name,
                    Address = w.Address,
                    Capacity = w.Capacity,
                    IsActive = w.IsActive,
                    ItemCount = w.InventoryItems.Count,
                    UtilizationPercentage = w.Capacity > 0
                        ? Math.Round((double)w.InventoryItems.Sum(i => i.Quantity) / w.Capacity * 100, 1)
                        : 0
                })
                .ToListAsync();
        }

        public async Task<WarehouseResponse?> GetWarehouseByIdAsync(int id)
        {
            var warehouse = await _context.Warehouses
                .Include(w => w.InventoryItems)
                .FirstOrDefaultAsync(w => w.Id == id);

            if (warehouse == null)
                return null;

            var totalQuantity = warehouse.InventoryItems.Sum(i => i.Quantity);

            return new WarehouseResponse
            {
                Id = warehouse.Id,
                Name = warehouse.Name,
                Address = warehouse.Address,
                Capacity = warehouse.Capacity,
                IsActive = warehouse.IsActive,
                ItemCount = warehouse.InventoryItems.Count,
                UtilizationPercentage = warehouse.Capacity > 0
                    ? Math.Round((double)totalQuantity / warehouse.Capacity * 100, 1)
                    : 0
            };
        }

        public async Task<WarehouseResponse> CreateWarehouseAsync(CreateWarehouseRequest request)
        {
            var warehouse = new Warehouse
            {
                Name = request.Name,
                Address = request.Address,
                Capacity = request.Capacity
            };

            _context.Warehouses.Add(warehouse);
            await _context.SaveChangesAsync();

            return new WarehouseResponse
            {
                Id = warehouse.Id,
                Name = warehouse.Name,
                Address = warehouse.Address,
                Capacity = warehouse.Capacity,
                IsActive = true,
                ItemCount = 0,
                UtilizationPercentage = 0
            };
        }

        public async Task<WarehouseResponse?> UpdateWarehouseAsync(int id, CreateWarehouseRequest request)
        {
            var warehouse = await _context.Warehouses.FindAsync(id);
            if (warehouse == null)
                return null;

            warehouse.Name = request.Name;
            warehouse.Address = request.Address;
            warehouse.Capacity = request.Capacity;
            await _context.SaveChangesAsync();

            return new WarehouseResponse
            {
                Id = warehouse.Id,
                Name = warehouse.Name,
                Address = warehouse.Address,
                Capacity = warehouse.Capacity,
                IsActive = warehouse.IsActive,
                ItemCount = await _context.InventoryItems.CountAsync(i => i.WarehouseId == id),
                UtilizationPercentage = 0
            };
        }

        public async Task<bool> DeleteWarehouseAsync(int id)
        {
            var warehouse = await _context.Warehouses
                .Include(w => w.InventoryItems)
                .FirstOrDefaultAsync(w => w.Id == id);

            if (warehouse == null)
                return false;

            if (warehouse.InventoryItems.Any())
                throw new InvalidOperationException("Cannot delete warehouse with associated inventory items.");

            _context.Warehouses.Remove(warehouse);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<object?> GetUtilizationAsync(int id)
        {
            var warehouse = await _context.Warehouses
                .Include(w => w.InventoryItems)
                .FirstOrDefaultAsync(w => w.Id == id);

            if (warehouse == null)
                return null;

            var totalQuantity = warehouse.InventoryItems.Sum(i => i.Quantity);
            var utilization = warehouse.Capacity > 0
                ? Math.Round((double)totalQuantity / warehouse.Capacity * 100, 1)
                : 0;

            return new
            {
                WarehouseId = warehouse.Id,
                WarehouseName = warehouse.Name,
                Capacity = warehouse.Capacity,
                CurrentStock = totalQuantity,
                UtilizationPercentage = utilization,
                AvailableCapacity = Math.Max(0, warehouse.Capacity - totalQuantity)
            };
        }
    }
}
