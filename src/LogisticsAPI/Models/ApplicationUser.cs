using Microsoft.AspNetCore.Identity;

namespace LogisticsAPI.Models
{
    public class ApplicationUser : IdentityUser
    {
        public string? FullName { get; set; }

        /// <summary>
        /// The tenant this user belongs to. Used to scope data access.
        /// </summary>
        public int TenantId { get; set; } = 1;

        /// <summary>
        /// Stored hashed refresh token for token rotation.
        /// </summary>
        public string? RefreshToken { get; set; }

        public DateTime? RefreshTokenExpiry { get; set; }
    }
}
