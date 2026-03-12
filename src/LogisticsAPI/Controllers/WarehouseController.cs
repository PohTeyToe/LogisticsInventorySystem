using LogisticsAPI.DTOs;
using LogisticsAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LogisticsAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Produces("application/json", "application/xml")]
    [Authorize]
    public class WarehouseController : ControllerBase
    {
        private readonly IWarehouseService _warehouseService;

        public WarehouseController(IWarehouseService warehouseService)
        {
            _warehouseService = warehouseService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<WarehouseResponse>>> GetWarehouses()
        {
            var warehouses = await _warehouseService.GetAllWarehousesAsync();
            return Ok(warehouses);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<WarehouseResponse>> GetWarehouse(int id)
        {
            var warehouse = await _warehouseService.GetWarehouseByIdAsync(id);
            if (warehouse == null)
                return NotFound();

            return Ok(warehouse);
        }

        [HttpPost]
        public async Task<ActionResult<WarehouseResponse>> CreateWarehouse(
            [FromBody] CreateWarehouseRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var warehouse = await _warehouseService.CreateWarehouseAsync(request);
            return CreatedAtAction(nameof(GetWarehouse), new { id = warehouse.Id }, warehouse);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<WarehouseResponse>> UpdateWarehouse(
            int id, [FromBody] CreateWarehouseRequest request)
        {
            var warehouse = await _warehouseService.UpdateWarehouseAsync(id, request);
            if (warehouse == null)
                return NotFound();

            return Ok(warehouse);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteWarehouse(int id)
        {
            try
            {
                var deleted = await _warehouseService.DeleteWarehouseAsync(id);
                if (!deleted)
                    return NotFound();

                return NoContent();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpGet("{id}/utilization")]
        public async Task<ActionResult<object>> GetUtilization(int id)
        {
            var utilization = await _warehouseService.GetUtilizationAsync(id);
            if (utilization == null)
                return NotFound();

            return Ok(utilization);
        }
    }
}
