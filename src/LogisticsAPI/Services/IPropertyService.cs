using LogisticsAPI.DTOs;

namespace LogisticsAPI.Services
{
    public interface IPropertyService
    {
        Task<IEnumerable<PropertyResponse>> GetAllPropertiesAsync();
        Task<PropertyResponse?> GetPropertyByIdAsync(int id);
        Task<PropertyResponse> CreatePropertyAsync(CreatePropertyRequest request);
        Task<PropertyResponse?> UpdatePropertyAsync(int id, UpdatePropertyRequest request);
        Task<bool> DeletePropertyAsync(int id);
        Task<IEnumerable<PropertyOwnerResponse>> GetAllOwnersAsync();
        Task<PropertyOwnerResponse> CreateOwnerAsync(CreatePropertyOwnerRequest request);
    }
}
