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
    public class WarehouseController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public WarehouseController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<WarehouseResponse>>> GetWarehouses()
        {
            var warehouses = await _context.Warehouses
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

            return Ok(warehouses);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<WarehouseResponse>> GetWarehouse(int id)
        {
            var warehouse = await _context.Warehouses
                .Include(w => w.InventoryItems)
                .FirstOrDefaultAsync(w => w.Id == id);

            if (warehouse == null)
                return NotFound();

            var totalQuantity = warehouse.InventoryItems.Sum(i => i.Quantity);

            return Ok(new WarehouseResponse
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
            });
        }

        [HttpPost]
        public async Task<ActionResult<WarehouseResponse>> CreateWarehouse(
            [FromBody] CreateWarehouseRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var warehouse = new Warehouse
            {
                Name = request.Name,
                Address = request.Address,
                Capacity = request.Capacity
            };

            _context.Warehouses.Add(warehouse);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetWarehouse), new { id = warehouse.Id },
                new WarehouseResponse
                {
                    Id = warehouse.Id,
                    Name = warehouse.Name,
                    Address = warehouse.Address,
                    Capacity = warehouse.Capacity,
                    IsActive = true,
                    ItemCount = 0,
                    UtilizationPercentage = 0
                });
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<WarehouseResponse>> UpdateWarehouse(
            int id, [FromBody] CreateWarehouseRequest request)
        {
            var warehouse = await _context.Warehouses.FindAsync(id);
            if (warehouse == null)
                return NotFound();

            warehouse.Name = request.Name;
            warehouse.Address = request.Address;
            warehouse.Capacity = request.Capacity;
            await _context.SaveChangesAsync();

            return Ok(new WarehouseResponse
            {
                Id = warehouse.Id,
                Name = warehouse.Name,
                Address = warehouse.Address,
                Capacity = warehouse.Capacity,
                IsActive = warehouse.IsActive,
                ItemCount = await _context.InventoryItems.CountAsync(i => i.WarehouseId == id),
                UtilizationPercentage = 0
            });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteWarehouse(int id)
        {
            var warehouse = await _context.Warehouses
                .Include(w => w.InventoryItems)
                .FirstOrDefaultAsync(w => w.Id == id);

            if (warehouse == null)
                return NotFound();

            if (warehouse.InventoryItems.Any())
                return BadRequest("Cannot delete warehouse with associated inventory items.");

            _context.Warehouses.Remove(warehouse);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpGet("{id}/utilization")]
        public async Task<ActionResult<object>> GetUtilization(int id)
        {
            var warehouse = await _context.Warehouses
                .Include(w => w.InventoryItems)
                .FirstOrDefaultAsync(w => w.Id == id);

            if (warehouse == null)
                return NotFound();

            var totalQuantity = warehouse.InventoryItems.Sum(i => i.Quantity);
            var utilization = warehouse.Capacity > 0
                ? Math.Round((double)totalQuantity / warehouse.Capacity * 100, 1)
                : 0;

            return Ok(new
            {
                WarehouseId = warehouse.Id,
                WarehouseName = warehouse.Name,
                Capacity = warehouse.Capacity,
                CurrentStock = totalQuantity,
                UtilizationPercentage = utilization,
                AvailableCapacity = Math.Max(0, warehouse.Capacity - totalQuantity)
            });
        }
    }
}
