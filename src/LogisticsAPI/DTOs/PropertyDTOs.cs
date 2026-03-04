using System.ComponentModel.DataAnnotations;
using System.Runtime.Serialization;

namespace LogisticsAPI.DTOs
{
    [DataContract]
    public class CreatePropertyRequest
    {
        [Required]
        [StringLength(20)]
        [DataMember]
        public string PropertyCode { get; set; } = string.Empty;

        [Required]
        [StringLength(200)]
        [DataMember]
        public string Name { get; set; } = string.Empty;

        [StringLength(500)]
        [DataMember]
        public string? Address { get; set; }

        [StringLength(50)]
        [DataMember]
        public string? PropertyType { get; set; }

        [Range(0, double.MaxValue)]
        [DataMember]
        public decimal BaseNightlyRate { get; set; }

        [Range(0, 100)]
        [DataMember]
        public decimal ManagementFeePercentage { get; set; } = 20.0m;

        [DataMember]
        public int? PropertyOwnerId { get; set; }
    }

    [DataContract]
    public class UpdatePropertyRequest
    {
        [StringLength(200)]
        [DataMember]
        public string? Name { get; set; }

        [StringLength(500)]
        [DataMember]
        public string? Address { get; set; }

        [StringLength(50)]
        [DataMember]
        public string? PropertyType { get; set; }

        [Range(0, double.MaxValue)]
        [DataMember]
        public decimal? BaseNightlyRate { get; set; }

        [Range(0, 100)]
        [DataMember]
        public decimal? ManagementFeePercentage { get; set; }

        [DataMember]
        public int? PropertyOwnerId { get; set; }
    }

    [DataContract]
    public class PropertyResponse
    {
        [DataMember]
        public int Id { get; set; }

        [DataMember]
        public string PropertyCode { get; set; } = string.Empty;

        [DataMember]
        public string Name { get; set; } = string.Empty;

        [DataMember]
        public string? Address { get; set; }

        [DataMember]
        public string? PropertyType { get; set; }

        [DataMember]
        public decimal BaseNightlyRate { get; set; }

        [DataMember]
        public decimal ManagementFeePercentage { get; set; }

        [DataMember]
        public int TenantId { get; set; }

        [DataMember]
        public string? OwnerName { get; set; }

        [DataMember]
        public int ReservationCount { get; set; }
    }

    [DataContract]
    public class CreatePropertyOwnerRequest
    {
        [Required]
        [StringLength(100)]
        [DataMember]
        public string FirstName { get; set; } = string.Empty;

        [Required]
        [StringLength(100)]
        [DataMember]
        public string LastName { get; set; } = string.Empty;

        [EmailAddress]
        [DataMember]
        public string? Email { get; set; }

        [Phone]
        [DataMember]
        public string? Phone { get; set; }

        [StringLength(200)]
        [DataMember]
        public string? CompanyName { get; set; }
    }

    [DataContract]
    public class PropertyOwnerResponse
    {
        [DataMember]
        public int Id { get; set; }

        [DataMember]
        public string FirstName { get; set; } = string.Empty;

        [DataMember]
        public string LastName { get; set; } = string.Empty;

        [DataMember]
        public string? Email { get; set; }

        [DataMember]
        public string? Phone { get; set; }

        [DataMember]
        public string? CompanyName { get; set; }

        [DataMember]
        public int TenantId { get; set; }

        [DataMember]
        public int PropertyCount { get; set; }
    }
}
