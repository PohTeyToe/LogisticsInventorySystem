using System.ComponentModel.DataAnnotations;

namespace LogisticsAPI.Models
{
    public class AuditLog
    {
        public int Id { get; set; }

        [Required]
        [StringLength(100)]
        public string EntityType { get; set; } = string.Empty;

        public int EntityId { get; set; }

        [Required]
        [StringLength(20)]
        public string Action { get; set; } = string.Empty; // Create, Update, Delete

        public string? Changes { get; set; } // JSON string of old→new values

        [StringLength(200)]
        public string? UserId { get; set; }

        public DateTime Timestamp { get; set; } = DateTime.UtcNow;

        public int TenantId { get; set; }
    }
}
