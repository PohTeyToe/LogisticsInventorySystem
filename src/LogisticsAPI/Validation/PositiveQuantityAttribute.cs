using System.ComponentModel.DataAnnotations;

namespace LogisticsAPI.Validation
{
    /// <summary>
    /// Validates that a numeric value is non-negative.
    /// Works with int and decimal types.
    /// </summary>
    [AttributeUsage(AttributeTargets.Property | AttributeTargets.Field, AllowMultiple = false)]
    public class PositiveQuantityAttribute : ValidationAttribute
    {
        public PositiveQuantityAttribute() : base("Value must be a non-negative number.")
        {
        }

        protected override ValidationResult? IsValid(object? value, ValidationContext validationContext)
        {
            if (value == null)
            {
                return ValidationResult.Success;
            }

            return value switch
            {
                int intValue when intValue < 0 => new ValidationResult(ErrorMessage),
                decimal decimalValue when decimalValue < 0 => new ValidationResult(ErrorMessage),
                double doubleValue when doubleValue < 0 => new ValidationResult(ErrorMessage),
                _ => ValidationResult.Success
            };
        }
    }
}
