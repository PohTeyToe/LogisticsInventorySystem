using System.ComponentModel.DataAnnotations;

namespace LogisticsAPI.Models
{
    public class PropertyOwner
    {
        public int Id { get; set; }

        [Required]
        [StringLength(100)]
        public string FirstName { get; set; } = string.Empty;

        [Required]
        [StringLength(100)]
        public string LastName { get; set; } = string.Empty;

        [EmailAddress]
        public string? Email { get; set; }

        [Phone]
        public string? Phone { get; set; }

        [StringLength(200)]
        public string? CompanyName { get; set; }

        public int TenantId { get; set; }

        public ICollection<Property> Properties { get; set; } = new List<Property>();
    }
}
