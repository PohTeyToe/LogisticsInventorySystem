using System.ComponentModel.DataAnnotations;
using LogisticsAPI.DTOs;
using LogisticsAPI.Validation;
using Xunit;

namespace LogisticsAPI.Tests
{
    public class ValidationTests
    {
        private static List<ValidationResult> ValidateModel(object model)
        {
            var results = new List<ValidationResult>();
            var context = new ValidationContext(model);
            Validator.TryValidateObject(model, context, results, true);
            return results;
        }

        [Fact]
        public void CreateInventoryItemRequest_WithValidData_PassesValidation()
        {
            var request = new CreateInventoryItemRequest
            {
                SKU = "TEST-001",
                Name = "Valid Item",
                Quantity = 10,
                UnitPrice = 25.99m
            };

            var results = ValidateModel(request);
            Assert.Empty(results);
        }

        [Fact]
        public void CreateInventoryItemRequest_WithoutSku_FailsValidation()
        {
            var request = new CreateInventoryItemRequest
            {
                Name = "No SKU Item",
                Quantity = 10
            };

            var results = ValidateModel(request);
            Assert.Contains(results, r => r.MemberNames.Contains("SKU"));
        }

        [Fact]
        public void CreateInventoryItemRequest_WithoutName_FailsValidation()
        {
            var request = new CreateInventoryItemRequest
            {
                SKU = "TEST-001",
                Quantity = 10
            };

            var results = ValidateModel(request);
            Assert.Contains(results, r => r.MemberNames.Contains("Name"));
        }

        [Fact]
        public void CreateInventoryItemRequest_WithNegativeQuantity_FailsValidation()
        {
            var request = new CreateInventoryItemRequest
            {
                SKU = "TEST-001",
                Name = "Negative Qty",
                Quantity = -5
            };

            var results = ValidateModel(request);
            Assert.Contains(results, r => r.MemberNames.Contains("Quantity"));
        }

        [Fact]
        public void CreateCategoryRequest_WithValidData_PassesValidation()
        {
            var request = new CreateCategoryRequest
            {
                Name = "Valid Category"
            };

            var results = ValidateModel(request);
            Assert.Empty(results);
        }

        [Fact]
        public void CreateCategoryRequest_WithoutName_FailsValidation()
        {
            var request = new CreateCategoryRequest();

            var results = ValidateModel(request);
            Assert.Contains(results, r => r.MemberNames.Contains("Name"));
        }

        [Fact]
        public void CreateSupplierRequest_WithValidData_PassesValidation()
        {
            var request = new CreateSupplierRequest
            {
                Name = "Valid Supplier",
                ContactEmail = "supplier@test.com"
            };

            var results = ValidateModel(request);
            Assert.Empty(results);
        }

        [Fact]
        public void CreateStockMovementRequest_WithInvalidType_FailsValidation()
        {
            var request = new CreateStockMovementRequest
            {
                InventoryItemId = 1,
                Type = "INVALID",
                Quantity = 10
            };

            var results = ValidateModel(request);
            Assert.Contains(results, r => r.MemberNames.Contains("Type"));
        }

        // Custom attribute tests
        [Theory]
        [InlineData("AB-001", true)]
        [InlineData("ELEC-12345", true)]
        [InlineData("WH-100", true)]
        [InlineData("invalid", false)]
        [InlineData("a-1", false)]
        [InlineData("TOOLONG-001", false)]
        [InlineData("AB-1", false)]
        public void SkuFormatAttribute_ValidatesCorrectly(string sku, bool expected)
        {
            var attribute = new SkuFormatAttribute();
            var context = new ValidationContext(new object()) { MemberName = "SKU" };
            var result = attribute.GetValidationResult(sku, context);

            Assert.Equal(expected, result == ValidationResult.Success);
        }

        [Theory]
        [InlineData(0, true)]
        [InlineData(10, true)]
        [InlineData(100, true)]
        [InlineData(-1, false)]
        [InlineData(-100, false)]
        public void PositiveQuantityAttribute_ValidatesIntegers(int value, bool expected)
        {
            var attribute = new PositiveQuantityAttribute();
            var context = new ValidationContext(new object()) { MemberName = "Quantity" };
            var result = attribute.GetValidationResult(value, context);

            Assert.Equal(expected, result == ValidationResult.Success);
        }

        [Theory]
        [InlineData(0.0, true)]
        [InlineData(10.5, true)]
        [InlineData(-0.01, false)]
        public void PositiveQuantityAttribute_ValidatesDecimals(double value, bool expected)
        {
            var attribute = new PositiveQuantityAttribute();
            var context = new ValidationContext(new object()) { MemberName = "Price" };
            var result = attribute.GetValidationResult((decimal)value, context);

            Assert.Equal(expected, result == ValidationResult.Success);
        }
    }
}
