using LogisticsAPI.Data;
using LogisticsAPI.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LogisticsAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Produces("application/json", "application/xml")]
    public class PropertiesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public PropertiesController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Property>>> GetProperties()
        {
            return Ok(await _context.Properties
                .Include(p => p.Owner)
                .ToListAsync());
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Property>> GetProperty(int id)
        {
            var property = await _context.Properties
                .Include(p => p.Owner)
                .Include(p => p.Reservations)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (property == null) return NotFound();
            return Ok(property);
        }

        [HttpPost]
        public async Task<ActionResult<Property>> CreateProperty([FromBody] Property property)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            _context.Properties.Add(property);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetProperty), new { id = property.Id }, property);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateProperty(int id, [FromBody] Property property)
        {
            if (id != property.Id) return BadRequest();

            _context.Entry(property).State = EntityState.Modified;
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProperty(int id)
        {
            var property = await _context.Properties.FindAsync(id);
            if (property == null) return NotFound();

            _context.Properties.Remove(property);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpGet("owners")]
        public async Task<ActionResult<IEnumerable<PropertyOwner>>> GetOwners()
        {
            return Ok(await _context.PropertyOwners
                .Include(o => o.Properties)
                .ToListAsync());
        }

        [HttpPost("owners")]
        public async Task<ActionResult<PropertyOwner>> CreateOwner([FromBody] PropertyOwner owner)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            _context.PropertyOwners.Add(owner);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetOwners), new { id = owner.Id }, owner);
        }
    }
}
