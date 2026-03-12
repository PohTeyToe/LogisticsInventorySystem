using System.Runtime.Serialization;

namespace LogisticsAPI.DTOs
{
    [DataContract]
    public class AuditLogResponse
    {
        [DataMember]
        public int Id { get; set; }

        [DataMember]
        public string EntityType { get; set; } = string.Empty;

        [DataMember]
        public int EntityId { get; set; }

        [DataMember]
        public string Action { get; set; } = string.Empty;

        [DataMember]
        public string? Changes { get; set; }

        [DataMember]
        public string? UserId { get; set; }

        [DataMember]
        public DateTime Timestamp { get; set; }

        [DataMember]
        public int TenantId { get; set; }
    }

    [DataContract]
    public class PaginatedAuditLogResponse
    {
        [DataMember]
        public List<AuditLogResponse> Items { get; set; } = new();

        [DataMember]
        public int TotalCount { get; set; }

        [DataMember]
        public int Page { get; set; }

        [DataMember]
        public int PageSize { get; set; }

        [DataMember]
        public int TotalPages { get; set; }
    }
}
