using System.ComponentModel.DataAnnotations;
using System.Text.RegularExpressions;

namespace LogisticsAPI.Validation
{
    /// <summary>
    /// Validates that a SKU follows the expected format: 2-4 uppercase letters followed by a hyphen and 3-6 digits.
    /// Examples: SKU-001, ELEC-12345, WH-100
    /// </summary>
    [AttributeUsage(AttributeTargets.Property | AttributeTargets.Field, AllowMultiple = false)]
    public class SkuFormatAttribute : ValidationAttribute
    {
        private const string Pattern = @"^[A-Z]{2,4}-\d{3,6}$";

        public SkuFormatAttribute() : base("SKU must follow the format: 2-4 uppercase letters, hyphen, 3-6 digits (e.g., SKU-001).")
        {
        }

        protected override ValidationResult? IsValid(object? value, ValidationContext validationContext)
        {
            if (value == null || string.IsNullOrWhiteSpace(value.ToString()))
            {
                return ValidationResult.Success; // Let [Required] handle null checks
            }

            var sku = value.ToString()!;
            if (!Regex.IsMatch(sku, Pattern))
            {
                return new ValidationResult(ErrorMessage);
            }

            return ValidationResult.Success;
        }
    }
}
