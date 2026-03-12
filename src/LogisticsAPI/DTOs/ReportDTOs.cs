using System.Runtime.Serialization;

namespace LogisticsAPI.DTOs
{
    [DataContract]
    public class InventoryValuationReport
    {
        [DataMember]
        public int TotalItems { get; set; }

        [DataMember]
        public int TotalQuantity { get; set; }

        [DataMember]
        public decimal TotalValue { get; set; }

        [DataMember]
        public List<CategoryValuation> CategoryBreakdown { get; set; } = new();

        [DataMember]
        public List<WarehouseValuation> WarehouseBreakdown { get; set; } = new();
    }

    [DataContract]
    public class CategoryValuation
    {
        [DataMember]
        public string CategoryName { get; set; } = string.Empty;

        [DataMember]
        public int ItemCount { get; set; }

        [DataMember]
        public decimal TotalValue { get; set; }
    }

    [DataContract]
    public class WarehouseValuation
    {
        [DataMember]
        public string WarehouseName { get; set; } = string.Empty;

        [DataMember]
        public int ItemCount { get; set; }

        [DataMember]
        public decimal TotalValue { get; set; }
    }

    [DataContract]
    public class LowStockAlert
    {
        [DataMember]
        public int ItemId { get; set; }

        [DataMember]
        public string SKU { get; set; } = string.Empty;

        [DataMember]
        public string Name { get; set; } = string.Empty;

        [DataMember]
        public int CurrentQuantity { get; set; }

        [DataMember]
        public int ReorderLevel { get; set; }

        [DataMember]
        public string? CategoryName { get; set; }

        [DataMember]
        public string? WarehouseName { get; set; }
    }
}
