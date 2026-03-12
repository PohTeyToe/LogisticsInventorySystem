using LogisticsAPI.DTOs;

namespace LogisticsAPI.Services
{
    public interface ISupplierService
    {
        Task<IEnumerable<SupplierResponse>> GetAllSuppliersAsync();
        Task<SupplierResponse?> GetSupplierByIdAsync(int id);
        Task<SupplierResponse> CreateSupplierAsync(CreateSupplierRequest request);
        Task<SupplierResponse?> UpdateSupplierAsync(int id, CreateSupplierRequest request);
        Task<bool> DeleteSupplierAsync(int id);
        Task<SupplierPerformanceResponse?> GetSupplierPerformanceAsync(int id);
    }
}
