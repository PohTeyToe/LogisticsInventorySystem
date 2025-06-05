using System.ComponentModel.DataAnnotations;

namespace LogisticsAPI.Models
{
    public class Warehouse
    {
        public int Id { get; set; }

        [Required]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;

        [StringLength(500)]
        public string? Address { get; set; }

        [Range(0, int.MaxValue)]
        public int Capacity { get; set; }

        public int TenantId { get; set; }

        public bool IsActive { get; set; } = true;

        // Navigation properties
        public ICollection<InventoryItem> InventoryItems { get; set; } = new List<InventoryItem>();
    }
}
