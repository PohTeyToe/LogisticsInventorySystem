using System.ComponentModel.DataAnnotations;
using System.Runtime.Serialization;

namespace LogisticsAPI.DTOs
{
    [DataContract]
    public class CreateInventoryItemRequest
    {
        [Required]
        [StringLength(50)]
        [DataMember]
        public string SKU { get; set; } = string.Empty;

        [Required]
        [StringLength(200)]
        [DataMember]
        public string Name { get; set; } = string.Empty;

        [StringLength(1000)]
        [DataMember]
        public string? Description { get; set; }

        [Range(0, int.MaxValue)]
        [DataMember]
        public int Quantity { get; set; }

        [StringLength(100)]
        [DataMember]
        public string? Location { get; set; }

        [Range(0, double.MaxValue)]
        [DataMember]
        public decimal UnitPrice { get; set; }

        [DataMember]
        public int? CategoryId { get; set; }

        [DataMember]
        public int? WarehouseId { get; set; }

        [Range(0, int.MaxValue)]
        [DataMember]
        public int ReorderLevel { get; set; } = 10;
    }

    [DataContract]
    public class UpdateInventoryItemRequest
    {
        [StringLength(200)]
        [DataMember]
        public string? Name { get; set; }

        [StringLength(1000)]
        [DataMember]
        public string? Description { get; set; }

        [Range(0, int.MaxValue)]
        [DataMember]
        public int? Quantity { get; set; }

        [StringLength(100)]
        [DataMember]
        public string? Location { get; set; }

        [Range(0, double.MaxValue)]
        [DataMember]
        public decimal? UnitPrice { get; set; }

        [DataMember]
        public int? CategoryId { get; set; }

        [DataMember]
        public int? WarehouseId { get; set; }

        [Range(0, int.MaxValue)]
        [DataMember]
        public int? ReorderLevel { get; set; }
    }

    [DataContract]
    public class InventoryItemResponse
    {
        [DataMember]
        public int Id { get; set; }

        [DataMember]
        public string SKU { get; set; } = string.Empty;

        [DataMember]
        public string Name { get; set; } = string.Empty;

        [DataMember]
        public string? Description { get; set; }

        [DataMember]
        public int Quantity { get; set; }

        [DataMember]
        public string? Location { get; set; }

        [DataMember]
        public decimal UnitPrice { get; set; }

        [DataMember]
        public string? CategoryName { get; set; }

        [DataMember]
        public string? WarehouseName { get; set; }

        [DataMember]
        public int ReorderLevel { get; set; }

        [DataMember]
        public int TenantId { get; set; }

        [DataMember]
        public DateTime CreatedAt { get; set; }

        [DataMember]
        public DateTime UpdatedAt { get; set; }
    }

    [DataContract]
    public class PaginatedResponse<T>
    {
        [DataMember]
        public IEnumerable<T> Items { get; set; } = Enumerable.Empty<T>();

        [DataMember]
        public int TotalCount { get; set; }

        [DataMember]
        public int Page { get; set; }

        [DataMember]
        public int PageSize { get; set; }

        [DataMember]
        public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
    }

    [DataContract]
    public class ImportResult
    {
        [DataMember]
        public int TotalRows { get; set; }

        [DataMember]
        public int SuccessCount { get; set; }

        [DataMember]
        public int ErrorCount { get; set; }

        [DataMember]
        public List<ImportError> Errors { get; set; } = new();
    }

    [DataContract]
    public class ImportError
    {
        [DataMember]
        public int Row { get; set; }

        [DataMember]
        public string Field { get; set; } = string.Empty;

        [DataMember]
        public string Message { get; set; } = string.Empty;
    }
}
