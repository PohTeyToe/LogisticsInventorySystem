using LogisticsAPI.DTOs;
using LogisticsAPI.Services;
using Microsoft.AspNetCore.Mvc;

namespace LogisticsAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Produces("application/json", "application/xml")]
    public class ImportController : ControllerBase
    {
        private readonly ICsvImportService _csvImportService;

        public ImportController(ICsvImportService csvImportService)
        {
            _csvImportService = csvImportService;
        }

        [HttpPost("inventory")]
        [Consumes("multipart/form-data")]
        public async Task<ActionResult<ImportResult>> ImportInventory(
            IFormFile file,
            [FromQuery] bool validateOnly = false)
        {
            if (file == null || file.Length == 0)
                return BadRequest("No file provided.");

            if (!file.FileName.EndsWith(".csv", StringComparison.OrdinalIgnoreCase))
                return BadRequest("Only CSV files are supported.");

            using var stream = file.OpenReadStream();

            ImportResult result;
            if (validateOnly)
            {
                result = await _csvImportService.ValidateInventoryItemsAsync(stream);
            }
            else
            {
                result = await _csvImportService.ImportInventoryItemsAsync(stream);
            }

            if (result.ErrorCount > 0 && result.SuccessCount == 0)
                return UnprocessableEntity(result);

            return Ok(result);
        }
    }
}
