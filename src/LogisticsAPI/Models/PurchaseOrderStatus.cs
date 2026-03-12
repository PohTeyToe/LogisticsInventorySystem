using System.Text.Json.Serialization;

namespace LogisticsAPI.Models
{
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public enum PurchaseOrderStatus
    {
        Pending,
        Approved,
        Shipped,
        Delivered,
        Cancelled
    }
}
