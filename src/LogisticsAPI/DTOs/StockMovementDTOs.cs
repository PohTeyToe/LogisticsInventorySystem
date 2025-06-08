using System.ComponentModel.DataAnnotations;
using System.Runtime.Serialization;

namespace LogisticsAPI.DTOs
{
    [DataContract]
    public class CreateStockMovementRequest
    {
        [Required]
        [DataMember]
        public int InventoryItemId { get; set; }

        [Required]
        [RegularExpression("^(IN|OUT|ADJUSTMENT)$", ErrorMessage = "Type must be IN, OUT, or ADJUSTMENT.")]
        [DataMember]
        public string Type { get; set; } = string.Empty;

        [Range(1, int.MaxValue)]
        [DataMember]
        public int Quantity { get; set; }

        [StringLength(500)]
        [DataMember]
        public string? Reason { get; set; }
    }

    [DataContract]
    public class StockMovementResponse
    {
        [DataMember]
        public int Id { get; set; }

        [DataMember]
        public string ItemName { get; set; } = string.Empty;

        [DataMember]
        public string ItemSKU { get; set; } = string.Empty;

        [DataMember]
        public string Type { get; set; } = string.Empty;

        [DataMember]
        public int Quantity { get; set; }

        [DataMember]
        public string? Reason { get; set; }

        [DataMember]
        public DateTime Timestamp { get; set; }
    }
}
