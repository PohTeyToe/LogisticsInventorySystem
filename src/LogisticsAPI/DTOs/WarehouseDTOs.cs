using System.ComponentModel.DataAnnotations;
using System.Runtime.Serialization;

namespace LogisticsAPI.DTOs
{
    [DataContract]
    public class CreateWarehouseRequest
    {
        [Required]
        [StringLength(100)]
        [DataMember]
        public string Name { get; set; } = string.Empty;

        [StringLength(500)]
        [DataMember]
        public string? Address { get; set; }

        [Range(0, int.MaxValue)]
        [DataMember]
        public int Capacity { get; set; }
    }

    [DataContract]
    public class WarehouseResponse
    {
        [DataMember]
        public int Id { get; set; }

        [DataMember]
        public string Name { get; set; } = string.Empty;

        [DataMember]
        public string? Address { get; set; }

        [DataMember]
        public int Capacity { get; set; }

        [DataMember]
        public bool IsActive { get; set; }

        [DataMember]
        public int ItemCount { get; set; }

        [DataMember]
        public double UtilizationPercentage { get; set; }
    }
}
