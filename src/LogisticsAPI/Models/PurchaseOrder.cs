using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LogisticsAPI.Models
{
    public class PurchaseOrder
    {
        public int Id { get; set; }

        [Required]
        public int SupplierId { get; set; }

        public DateTime OrderDate { get; set; } = DateTime.UtcNow;

        [Required]
        public PurchaseOrderStatus Status { get; set; } = PurchaseOrderStatus.Pending;

        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalAmount { get; set; }

        public DateTime? ExpectedDeliveryDate { get; set; }

        public DateTime? DeliveredDate { get; set; }

        public int TenantId { get; set; }

        // Navigation properties
        [ForeignKey("SupplierId")]
        public Supplier? Supplier { get; set; }

        public ICollection<PurchaseOrderItem> Items { get; set; } = new List<PurchaseOrderItem>();
    }
}
