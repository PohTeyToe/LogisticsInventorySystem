using LogisticsAPI.DTOs;

namespace LogisticsAPI.Services
{
    public interface IWarehouseService
    {
        Task<IEnumerable<WarehouseResponse>> GetAllWarehousesAsync();
        Task<WarehouseResponse?> GetWarehouseByIdAsync(int id);
        Task<WarehouseResponse> CreateWarehouseAsync(CreateWarehouseRequest request);
        Task<WarehouseResponse?> UpdateWarehouseAsync(int id, CreateWarehouseRequest request);
        Task<bool> DeleteWarehouseAsync(int id);
        Task<object?> GetUtilizationAsync(int id);
    }
}
