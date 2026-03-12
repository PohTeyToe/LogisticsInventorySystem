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
    public class PurchaseOrderController : ControllerBase
    {
        private readonly IPurchaseOrderService _purchaseOrderService;

        public PurchaseOrderController(IPurchaseOrderService purchaseOrderService)
        {
            _purchaseOrderService = purchaseOrderService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<PurchaseOrderResponse>>> GetOrders(
            [FromQuery] string? status = null)
        {
            var orders = await _purchaseOrderService.GetAllOrdersAsync(status);
            return Ok(orders);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<PurchaseOrderResponse>> GetOrder(int id)
        {
            var order = await _purchaseOrderService.GetOrderByIdAsync(id);
            if (order == null)
                return NotFound();

            return Ok(order);
        }

        [HttpPost]
        public async Task<ActionResult<PurchaseOrderResponse>> CreateOrder(
            [FromBody] CreatePurchaseOrderRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var order = await _purchaseOrderService.CreateOrderAsync(request);
                return CreatedAtAction(nameof(GetOrder), new { id = order.Id }, order);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPut("{id}/status")]
        public async Task<ActionResult<PurchaseOrderResponse>> UpdateStatus(
            int id, [FromBody] UpdatePurchaseOrderStatusRequest request)
        {
            try
            {
                var order = await _purchaseOrderService.UpdateOrderStatusAsync(id, request);
                if (order == null)
                    return NotFound();

                return Ok(order);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteOrder(int id)
        {
            try
            {
                var deleted = await _purchaseOrderService.DeleteOrderAsync(id);
                if (!deleted)
                    return NotFound();

                return NoContent();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}
