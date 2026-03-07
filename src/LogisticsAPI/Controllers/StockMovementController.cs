using LogisticsAPI.DTOs;
using LogisticsAPI.Services;
using Microsoft.AspNetCore.Mvc;

namespace LogisticsAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Produces("application/json", "application/xml")]
    public class StockMovementController : ControllerBase
    {
        private readonly IStockMovementService _stockMovementService;

        public StockMovementController(IStockMovementService stockMovementService)
        {
            _stockMovementService = stockMovementService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<StockMovementResponse>>> GetMovements(
            [FromQuery] int? itemId = null,
            [FromQuery] string? type = null,
            [FromQuery] int limit = 50)
        {
            var movements = await _stockMovementService.GetMovementsAsync(itemId, type, limit);
            return Ok(movements);
        }

        [HttpPost]
        public async Task<ActionResult<StockMovementResponse>> RecordMovement(
            [FromBody] CreateStockMovementRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var movement = await _stockMovementService.RecordMovementAsync(request);
                return CreatedAtAction(nameof(GetMovements), null, movement);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpGet("item/{itemId}/history")]
        public async Task<ActionResult<IEnumerable<StockMovementResponse>>> GetItemHistory(int itemId)
        {
            var movements = await _stockMovementService.GetItemHistoryAsync(itemId);
            return Ok(movements);
        }
    }
}
