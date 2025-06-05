using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LogisticsAPI.Models
{
    public class StockMovement
    {
        public int Id { get; set; }

        [Required]
        public int InventoryItemId { get; set; }

        [Required]
        [StringLength(20)]
        public string Type { get; set; } = string.Empty; // IN, OUT, ADJUSTMENT

        [Range(1, int.MaxValue)]
        public int Quantity { get; set; }

        [StringLength(500)]
        public string? Reason { get; set; }

        public DateTime Timestamp { get; set; } = DateTime.UtcNow;

        public int TenantId { get; set; }

        // Navigation properties
        [ForeignKey("InventoryItemId")]
        public InventoryItem? InventoryItem { get; set; }
    }
}
