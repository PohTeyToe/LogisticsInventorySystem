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
    public class SupplierController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public SupplierController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<SupplierResponse>>> GetSuppliers()
        {
            var suppliers = await _context.Suppliers
                .Include(s => s.PurchaseOrders)
                .Select(s => new SupplierResponse
                {
                    Id = s.Id,
                    Name = s.Name,
                    ContactEmail = s.ContactEmail,
                    Phone = s.Phone,
                    Address = s.Address,
                    ActiveOrderCount = s.PurchaseOrders.Count(po => po.Status != "Cancelled" && po.Status != "Received")
                })
                .ToListAsync();

            return Ok(suppliers);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<SupplierResponse>> GetSupplier(int id)
        {
            var supplier = await _context.Suppliers
                .Include(s => s.PurchaseOrders)
                .FirstOrDefaultAsync(s => s.Id == id);

            if (supplier == null)
                return NotFound();

            return Ok(new SupplierResponse
            {
                Id = supplier.Id,
                Name = supplier.Name,
                ContactEmail = supplier.ContactEmail,
                Phone = supplier.Phone,
                Address = supplier.Address,
                ActiveOrderCount = supplier.PurchaseOrders.Count(po => po.Status != "Cancelled" && po.Status != "Received")
            });
        }

        [HttpPost]
        public async Task<ActionResult<SupplierResponse>> CreateSupplier(
            [FromBody] CreateSupplierRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var supplier = new Supplier
            {
                Name = request.Name,
                ContactEmail = request.ContactEmail,
                Phone = request.Phone,
                Address = request.Address
            };

            _context.Suppliers.Add(supplier);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetSupplier), new { id = supplier.Id },
                new SupplierResponse
                {
                    Id = supplier.Id,
                    Name = supplier.Name,
                    ContactEmail = supplier.ContactEmail,
                    Phone = supplier.Phone,
                    Address = supplier.Address,
                    ActiveOrderCount = 0
                });
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<SupplierResponse>> UpdateSupplier(
            int id, [FromBody] CreateSupplierRequest request)
        {
            var supplier = await _context.Suppliers.FindAsync(id);
            if (supplier == null)
                return NotFound();

            supplier.Name = request.Name;
            supplier.ContactEmail = request.ContactEmail;
            supplier.Phone = request.Phone;
            supplier.Address = request.Address;
            await _context.SaveChangesAsync();

            return Ok(new SupplierResponse
            {
                Id = supplier.Id,
                Name = supplier.Name,
                ContactEmail = supplier.ContactEmail,
                Phone = supplier.Phone,
                Address = supplier.Address,
                ActiveOrderCount = await _context.PurchaseOrders.CountAsync(
                    po => po.SupplierId == id && po.Status != "Cancelled" && po.Status != "Received")
            });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteSupplier(int id)
        {
            var supplier = await _context.Suppliers
                .Include(s => s.PurchaseOrders)
                .FirstOrDefaultAsync(s => s.Id == id);

            if (supplier == null)
                return NotFound();

            if (supplier.PurchaseOrders.Any(po => po.Status != "Cancelled" && po.Status != "Received"))
                return BadRequest("Cannot delete supplier with active purchase orders.");

            _context.Suppliers.Remove(supplier);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
