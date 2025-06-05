using System.ComponentModel.DataAnnotations;

namespace LogisticsAPI.Models
{
    public class Supplier
    {
        public int Id { get; set; }

        [Required]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;

        [EmailAddress]
        public string? ContactEmail { get; set; }

        [Phone]
        public string? Phone { get; set; }

        [StringLength(500)]
        public string? Address { get; set; }

        public int TenantId { get; set; }

        // Navigation properties
        public ICollection<PurchaseOrder> PurchaseOrders { get; set; } = new List<PurchaseOrder>();
    }
}
