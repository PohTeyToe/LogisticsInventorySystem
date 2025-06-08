using LogisticsAPI.DTOs;
using LogisticsAPI.Services;
using Microsoft.AspNetCore.Mvc;

namespace LogisticsAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Produces("application/json", "application/xml")]
    public class ReportController : ControllerBase
    {
        private readonly IReportingService _reportingService;
        private readonly IInventoryService _inventoryService;

        public ReportController(IReportingService reportingService, IInventoryService inventoryService)
        {
            _reportingService = reportingService;
            _inventoryService = inventoryService;
        }

        [HttpGet("valuation")]
        public async Task<ActionResult<InventoryValuationReport>> GetValuation()
        {
            var report = await _inventoryService.GetValuationReportAsync();
            return Ok(report);
        }

        [HttpGet("low-stock")]
        public async Task<ActionResult<IEnumerable<LowStockAlert>>> GetLowStockAlerts(
            [FromQuery] int threshold = 10)
        {
            var alerts = await _reportingService.GetLowStockAlertsAsync(threshold);
            return Ok(alerts);
        }

        [HttpGet("total-value")]
        public async Task<ActionResult<object>> GetTotalValue()
        {
            var totalValue = await _reportingService.CalculateTotalInventoryValueAsync();
            return Ok(new { TotalInventoryValue = totalValue });
        }
    }
}
