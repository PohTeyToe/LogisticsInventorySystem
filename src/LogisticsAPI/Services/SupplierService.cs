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
                    ActiveOrderCount = s.PurchaseOrders.Count(po => po.Status != PurchaseOrderStatus.Cancelled && po.Status != PurchaseOrderStatus.Delivered)
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
                ActiveOrderCount = supplier.PurchaseOrders.Count(po => po.Status != PurchaseOrderStatus.Cancelled && po.Status != PurchaseOrderStatus.Delivered)
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
                    po => po.SupplierId == id && po.Status != PurchaseOrderStatus.Cancelled && po.Status != PurchaseOrderStatus.Delivered)
            };
        }

        public async Task<bool> DeleteSupplierAsync(int id)
        {
            var supplier = await _context.Suppliers
                .Include(s => s.PurchaseOrders)
                .FirstOrDefaultAsync(s => s.Id == id);

            if (supplier == null)
                return false;

            if (supplier.PurchaseOrders.Any(po => po.Status != PurchaseOrderStatus.Cancelled && po.Status != PurchaseOrderStatus.Delivered))
                throw new InvalidOperationException("Cannot delete supplier with active purchase orders.");

            _context.Suppliers.Remove(supplier);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<SupplierPerformanceResponse?> GetSupplierPerformanceAsync(int id)
        {
            var supplier = await _context.Suppliers.FindAsync(id);
            if (supplier == null)
                return null;

            var orders = await _context.PurchaseOrders
                .Where(po => po.SupplierId == id)
                .ToListAsync();

            var totalOrders = orders.Count;
            var completedOrders = orders.Count(po => po.Status == PurchaseOrderStatus.Delivered);

            var deliveredWithExpected = orders
                .Where(po => po.Status == PurchaseOrderStatus.Delivered
                    && po.ExpectedDeliveryDate.HasValue
                    && po.DeliveredDate.HasValue)
                .ToList();

            var onTimeCount = deliveredWithExpected
                .Count(po => po.DeliveredDate!.Value <= po.ExpectedDeliveryDate!.Value);

            var onTimeDeliveryRate = deliveredWithExpected.Count > 0
                ? Math.Round((double)onTimeCount / deliveredWithExpected.Count * 100, 1)
                : 0;

            var deliveredOrders = orders
                .Where(po => po.Status == PurchaseOrderStatus.Delivered && po.DeliveredDate.HasValue)
                .ToList();

            var averageLeadTimeDays = deliveredOrders.Count > 0
                ? Math.Round(deliveredOrders.Average(po => (po.DeliveredDate!.Value - po.OrderDate).TotalDays), 1)
                : 0;

            var totalSpend = orders
                .Where(po => po.Status == PurchaseOrderStatus.Delivered)
                .Sum(po => po.TotalAmount);

            return new SupplierPerformanceResponse
            {
                TotalOrders = totalOrders,
                CompletedOrders = completedOrders,
                OnTimeDeliveryRate = onTimeDeliveryRate,
                AverageLeadTimeDays = averageLeadTimeDays,
                TotalSpend = totalSpend
            };
        }
    }
}
