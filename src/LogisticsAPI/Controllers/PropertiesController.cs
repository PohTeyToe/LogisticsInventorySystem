using LogisticsAPI.DTOs;
using LogisticsAPI.Services;
using Microsoft.AspNetCore.Mvc;

namespace LogisticsAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Produces("application/json", "application/xml")]
    public class PropertiesController : ControllerBase
    {
        private readonly IPropertyService _propertyService;

        public PropertiesController(IPropertyService propertyService)
        {
            _propertyService = propertyService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<PropertyResponse>>> GetProperties()
        {
            var properties = await _propertyService.GetAllPropertiesAsync();
            return Ok(properties);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<PropertyResponse>> GetProperty(int id)
        {
            var property = await _propertyService.GetPropertyByIdAsync(id);
            if (property == null) return NotFound();
            return Ok(property);
        }

        [HttpPost]
        public async Task<ActionResult<PropertyResponse>> CreateProperty(
            [FromBody] CreatePropertyRequest request)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var property = await _propertyService.CreatePropertyAsync(request);
            return CreatedAtAction(nameof(GetProperty), new { id = property.Id }, property);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<PropertyResponse>> UpdateProperty(
            int id, [FromBody] UpdatePropertyRequest request)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var property = await _propertyService.UpdatePropertyAsync(id, request);
            if (property == null) return NotFound();
            return Ok(property);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProperty(int id)
        {
            var result = await _propertyService.DeletePropertyAsync(id);
            if (!result) return NotFound();
            return NoContent();
        }

        [HttpGet("owners")]
        public async Task<ActionResult<IEnumerable<PropertyOwnerResponse>>> GetOwners()
        {
            var owners = await _propertyService.GetAllOwnersAsync();
            return Ok(owners);
        }

        [HttpPost("owners")]
        public async Task<ActionResult<PropertyOwnerResponse>> CreateOwner(
            [FromBody] CreatePropertyOwnerRequest request)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var owner = await _propertyService.CreateOwnerAsync(request);
            return CreatedAtAction(nameof(GetOwners), new { id = owner.Id }, owner);
        }
    }
}
