using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LogisticsAPI.Models
{
    public class Property
    {
        public int Id { get; set; }

        [Required]
        [StringLength(20)]
        public string PropertyCode { get; set; } = string.Empty;

        [Required]
        [StringLength(200)]
        public string Name { get; set; } = string.Empty;

        [StringLength(500)]
        public string? Address { get; set; }

        [StringLength(50)]
        public string? PropertyType { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal BaseNightlyRate { get; set; }

        [Column(TypeName = "decimal(5,2)")]
        public decimal ManagementFeePercentage { get; set; } = 20.0m;

        public int TenantId { get; set; }

        public int? PropertyOwnerId { get; set; }

        [ForeignKey("PropertyOwnerId")]
        public PropertyOwner? Owner { get; set; }

        public ICollection<Reservation> Reservations { get; set; } = new List<Reservation>();
    }
}
