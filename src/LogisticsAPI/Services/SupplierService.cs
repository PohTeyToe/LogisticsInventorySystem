using LogisticsAPI.Data;
using LogisticsAPI.DTOs;
using LogisticsAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace LogisticsAPI.Services
{
    public class SupplierService : ISupplierService
    {
        private readonly ApplicationDbContext _context;

        public SupplierService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<SupplierResponse>> GetAllSuppliersAsync()
        {
            return await _context.Suppliers
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
        }

        public async Task<SupplierResponse?> GetSupplierByIdAsync(int id)
        {
            var supplier = await _context.Suppliers
                .Include(s => s.PurchaseOrders)
                .FirstOrDefaultAsync(s => s.Id == id);

            if (supplier == null)
                return null;

            return new SupplierResponse
            {
                Id = supplier.Id,
                Name = supplier.Name,
                ContactEmail = supplier.ContactEmail,
                Phone = supplier.Phone,
                Address = supplier.Address,
                ActiveOrderCount = supplier.PurchaseOrders.Count(po => po.Status != "Cancelled" && po.Status != "Received")
            };
        }

        public async Task<SupplierResponse> CreateSupplierAsync(CreateSupplierRequest request)
        {
            var supplier = new Supplier
            {
                Name = request.Name,
                ContactEmail = request.ContactEmail,
                Phone = request.Phone,
                Address = request.Address
            };

            _context.Suppliers.Add(supplier);
            await _context.SaveChangesAsync();

            return new SupplierResponse
            {
                Id = supplier.Id,
                Name = supplier.Name,
                ContactEmail = supplier.ContactEmail,
                Phone = supplier.Phone,
                Address = supplier.Address,
                ActiveOrderCount = 0
            };
        }

        public async Task<SupplierResponse?> UpdateSupplierAsync(int id, CreateSupplierRequest request)
        {
            var supplier = await _context.Suppliers.FindAsync(id);
            if (supplier == null)
                return null;

            supplier.Name = request.Name;
            supplier.ContactEmail = request.ContactEmail;
            supplier.Phone = request.Phone;
            supplier.Address = request.Address;
            await _context.SaveChangesAsync();

            return new SupplierResponse
            {
                Id = supplier.Id,
                Name = supplier.Name,
                ContactEmail = supplier.ContactEmail,
                Phone = supplier.Phone,
                Address = supplier.Address,
                ActiveOrderCount = await _context.PurchaseOrders.CountAsync(
                    po => po.SupplierId == id && po.Status != "Cancelled" && po.Status != "Received")
            };
        }

        public async Task<bool> DeleteSupplierAsync(int id)
        {
            var supplier = await _context.Suppliers
                .Include(s => s.PurchaseOrders)
                .FirstOrDefaultAsync(s => s.Id == id);

            if (supplier == null)
                return false;

            if (supplier.PurchaseOrders.Any(po => po.Status != "Cancelled" && po.Status != "Received"))
                throw new InvalidOperationException("Cannot delete supplier with active purchase orders.");

            _context.Suppliers.Remove(supplier);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
