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
    public class InventoryController : ControllerBase
    {
        private readonly IInventoryService _inventoryService;

        public InventoryController(IInventoryService inventoryService)
        {
            _inventoryService = inventoryService;
        }

        [HttpGet]
        public async Task<ActionResult<PaginatedResponse<InventoryItemResponse>>> GetItems(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20,
            [FromQuery] string? search = null)
        {
            if (page < 1)
                return BadRequest(new { error = "Page must be greater than or equal to 1.", field = "page" });

            if (pageSize < 1 || pageSize > 100)
                return BadRequest(new { error = "PageSize must be between 1 and 100.", field = "pageSize" });

            var result = await _inventoryService.GetItemsAsync(page, pageSize, search);
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<InventoryItemResponse>> GetItem(int id)
        {
            var item = await _inventoryService.GetItemByIdAsync(id);
            if (item == null)
                return NotFound();

            return Ok(item);
        }

        [HttpPost]
        public async Task<ActionResult<InventoryItemResponse>> CreateItem(
            [FromBody] CreateInventoryItemRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var item = await _inventoryService.CreateItemAsync(request);
            return CreatedAtAction(nameof(GetItem), new { id = item.Id }, item);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<InventoryItemResponse>> UpdateItem(
            int id, [FromBody] UpdateInventoryItemRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var item = await _inventoryService.UpdateItemAsync(id, request);
            if (item == null)
                return NotFound();

            return Ok(item);
        }

        // TODO: add bulk delete endpoint
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteItem(int id)
        {
            var result = await _inventoryService.DeleteItemAsync(id);
            if (!result)
                return NotFound();

            return NoContent();
        }

        [HttpGet("low-stock")]
        public async Task<ActionResult<IEnumerable<InventoryItemResponse>>> GetLowStockItems(
            [FromQuery] int threshold = 10)
        {
            if (threshold < 0)
                return BadRequest(new { error = "Threshold cannot be negative.", field = "threshold" });

            var items = await _inventoryService.GetLowStockAlertsAsync(threshold);
            return Ok(items);
        }
    }
}
