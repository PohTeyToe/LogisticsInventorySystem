using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LogisticsAPI.Models
{
    public class Reservation
    {
        public int Id { get; set; }

        [Required]
        [StringLength(50)]
        public string ConfirmationCode { get; set; } = string.Empty;

        [StringLength(200)]
        public string? GuestName { get; set; }

        public DateTime CheckIn { get; set; }

        public DateTime CheckOut { get; set; }

        public int Nights { get; set; }

        public int? PropertyId { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal NightlyRate { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal AccommodationRevenue { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal CleaningFee { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal ServiceFee { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalPayout { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal ManagementFeeAmount { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal OwnerNetEarnings { get; set; }

        [StringLength(50)]
        public string? BookingSource { get; set; }

        [ForeignKey("PropertyId")]
        public Property? Property { get; set; }
    }
}
