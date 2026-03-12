using System.ComponentModel.DataAnnotations;
using System.Runtime.Serialization;
using LogisticsAPI.Models;

namespace LogisticsAPI.DTOs
{
    [DataContract]
    public class CreatePurchaseOrderRequest
    {
        [Required]
        [DataMember]
        public int SupplierId { get; set; }

        [Required]
        [MinLength(1)]
        [DataMember]
        public List<PurchaseOrderItemRequest> Items { get; set; } = new();
    }

    [DataContract]
    public class PurchaseOrderItemRequest
    {
        [Required]
        [DataMember]
        public int InventoryItemId { get; set; }

        [Range(1, int.MaxValue)]
        [DataMember]
        public int Quantity { get; set; }

        [Range(0.01, double.MaxValue)]
        [DataMember]
        public decimal UnitPrice { get; set; }
    }

    [DataContract]
    public class PurchaseOrderResponse
    {
        [DataMember]
        public int Id { get; set; }

        [DataMember]
        public string SupplierName { get; set; } = string.Empty;

        [DataMember]
        public DateTime OrderDate { get; set; }

        [DataMember]
        public PurchaseOrderStatus Status { get; set; }

        [DataMember]
        public decimal TotalAmount { get; set; }

        [DataMember]
        public List<PurchaseOrderItemResponse> Items { get; set; } = new();
    }

    [DataContract]
    public class PurchaseOrderItemResponse
    {
        [DataMember]
        public int Id { get; set; }

        [DataMember]
        public string ItemName { get; set; } = string.Empty;

        [DataMember]
        public string ItemSKU { get; set; } = string.Empty;

        [DataMember]
        public int Quantity { get; set; }

        [DataMember]
        public decimal UnitPrice { get; set; }

        [DataMember]
        public decimal LineTotal => Quantity * UnitPrice;
    }

    [DataContract]
    public class UpdatePurchaseOrderStatusRequest
    {
        [Required]
        [DataMember]
        public PurchaseOrderStatus Status { get; set; }
    }
}
