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
    public class SupplierController : ControllerBase
    {
        private readonly ISupplierService _supplierService;

        public SupplierController(ISupplierService supplierService)
        {
            _supplierService = supplierService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<SupplierResponse>>> GetSuppliers()
        {
            var suppliers = await _supplierService.GetAllSuppliersAsync();
            return Ok(suppliers);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<SupplierResponse>> GetSupplier(int id)
        {
            var supplier = await _supplierService.GetSupplierByIdAsync(id);
            if (supplier == null)
                return NotFound();

            return Ok(supplier);
        }

        [HttpPost]
        public async Task<ActionResult<SupplierResponse>> CreateSupplier(
            [FromBody] CreateSupplierRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var supplier = await _supplierService.CreateSupplierAsync(request);
            return CreatedAtAction(nameof(GetSupplier), new { id = supplier.Id }, supplier);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<SupplierResponse>> UpdateSupplier(
            int id, [FromBody] CreateSupplierRequest request)
        {
            var supplier = await _supplierService.UpdateSupplierAsync(id, request);
            if (supplier == null)
                return NotFound();

            return Ok(supplier);
        }

        [HttpGet("{id}/performance")]
        public async Task<ActionResult<SupplierPerformanceResponse>> GetSupplierPerformance(int id)
        {
            var performance = await _supplierService.GetSupplierPerformanceAsync(id);
            if (performance == null)
                return NotFound();

            return Ok(performance);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteSupplier(int id)
        {
            try
            {
                var deleted = await _supplierService.DeleteSupplierAsync(id);
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
