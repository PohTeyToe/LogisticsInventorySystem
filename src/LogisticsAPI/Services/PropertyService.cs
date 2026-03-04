using LogisticsAPI.Data;
using LogisticsAPI.DTOs;
using LogisticsAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace LogisticsAPI.Services
{
    public class PropertyService : IPropertyService
    {
        private readonly ApplicationDbContext _context;

        public PropertyService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<PropertyResponse>> GetAllPropertiesAsync()
        {
            var properties = await _context.Properties
                .Include(p => p.Owner)
                .Include(p => p.Reservations)
                .ToListAsync();

            return properties.Select(MapToResponse);
        }

        public async Task<PropertyResponse?> GetPropertyByIdAsync(int id)
        {
            var property = await _context.Properties
                .Include(p => p.Owner)
                .Include(p => p.Reservations)
                .FirstOrDefaultAsync(p => p.Id == id);

            return property != null ? MapToResponse(property) : null;
        }

        public async Task<PropertyResponse> CreatePropertyAsync(CreatePropertyRequest request)
        {
            var property = new Property
            {
                PropertyCode = request.PropertyCode,
                Name = request.Name,
                Address = request.Address,
                PropertyType = request.PropertyType,
                BaseNightlyRate = request.BaseNightlyRate,
                ManagementFeePercentage = request.ManagementFeePercentage,
                PropertyOwnerId = request.PropertyOwnerId
            };

            _context.Properties.Add(property);
            await _context.SaveChangesAsync();

            return MapToResponse(property);
        }

        public async Task<PropertyResponse?> UpdatePropertyAsync(int id, UpdatePropertyRequest request)
        {
            var property = await _context.Properties
                .Include(p => p.Owner)
                .Include(p => p.Reservations)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (property == null) return null;

            if (request.Name != null) property.Name = request.Name;
            if (request.Address != null) property.Address = request.Address;
            if (request.PropertyType != null) property.PropertyType = request.PropertyType;
            if (request.BaseNightlyRate.HasValue) property.BaseNightlyRate = request.BaseNightlyRate.Value;
            if (request.ManagementFeePercentage.HasValue) property.ManagementFeePercentage = request.ManagementFeePercentage.Value;
            if (request.PropertyOwnerId.HasValue) property.PropertyOwnerId = request.PropertyOwnerId.Value;

            await _context.SaveChangesAsync();

            return MapToResponse(property);
        }

        public async Task<bool> DeletePropertyAsync(int id)
        {
            var property = await _context.Properties.FindAsync(id);
            if (property == null) return false;

            _context.Properties.Remove(property);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<IEnumerable<PropertyOwnerResponse>> GetAllOwnersAsync()
        {
            var owners = await _context.PropertyOwners
                .Include(o => o.Properties)
                .ToListAsync();

            return owners.Select(MapOwnerToResponse);
        }

        public async Task<PropertyOwnerResponse> CreateOwnerAsync(CreatePropertyOwnerRequest request)
        {
            var owner = new PropertyOwner
            {
                FirstName = request.FirstName,
                LastName = request.LastName,
                Email = request.Email,
                Phone = request.Phone,
                CompanyName = request.CompanyName
            };

            _context.PropertyOwners.Add(owner);
            await _context.SaveChangesAsync();

            return MapOwnerToResponse(owner);
        }

        private static PropertyResponse MapToResponse(Property property)
        {
            return new PropertyResponse
            {
                Id = property.Id,
                PropertyCode = property.PropertyCode,
                Name = property.Name,
                Address = property.Address,
                PropertyType = property.PropertyType,
                BaseNightlyRate = property.BaseNightlyRate,
                ManagementFeePercentage = property.ManagementFeePercentage,
                TenantId = property.TenantId,
                OwnerName = property.Owner != null
                    ? $"{property.Owner.FirstName} {property.Owner.LastName}"
                    : null,
                ReservationCount = property.Reservations?.Count ?? 0
            };
        }

        private static PropertyOwnerResponse MapOwnerToResponse(PropertyOwner owner)
        {
            return new PropertyOwnerResponse
            {
                Id = owner.Id,
                FirstName = owner.FirstName,
                LastName = owner.LastName,
                Email = owner.Email,
                Phone = owner.Phone,
                CompanyName = owner.CompanyName,
                TenantId = owner.TenantId,
                PropertyCount = owner.Properties?.Count ?? 0
            };
        }
    }
}
