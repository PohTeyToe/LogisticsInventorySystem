using System.ComponentModel.DataAnnotations;
using System.Runtime.Serialization;

namespace LogisticsAPI.DTOs
{
    [DataContract]
    public class CreateSupplierRequest
    {
        [Required]
        [StringLength(100)]
        [DataMember]
        public string Name { get; set; } = string.Empty;

        [EmailAddress]
        [DataMember]
        public string? ContactEmail { get; set; }

        [Phone]
        [DataMember]
        public string? Phone { get; set; }

        [StringLength(500)]
        [DataMember]
        public string? Address { get; set; }
    }

    [DataContract]
    public class SupplierResponse
    {
        [DataMember]
        public int Id { get; set; }

        [DataMember]
        public string Name { get; set; } = string.Empty;

        [DataMember]
        public string? ContactEmail { get; set; }

        [DataMember]
        public string? Phone { get; set; }

        [DataMember]
        public string? Address { get; set; }

        [DataMember]
        public int ActiveOrderCount { get; set; }
    }
}
