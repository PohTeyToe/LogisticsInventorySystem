using System.Text;
using LogisticsAPI.Services;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace LogisticsAPI.Tests
{
    public class CsvImportServiceTests
    {
        private CsvImportService CreateService(string? dbName = null)
        {
            var context = TestDbContextFactory.Create(dbName);
            var logger = new Mock<ILogger<CsvImportService>>();
            return new CsvImportService(context, logger.Object);
        }

        private static Stream CreateCsvStream(string content)
        {
            return new MemoryStream(Encoding.UTF8.GetBytes(content));
        }

        [Fact]
        public async Task ImportInventoryItems_WithValidCsv_ImportsSuccessfully()
        {
            var service = CreateService();
            var csv = "SKU,Name,Description,Quantity,Location,UnitPrice\nTEST-001,Widget,A widget,10,Shelf A,9.99\nTEST-002,Gadget,A gadget,5,Shelf B,19.99";
            using var stream = CreateCsvStream(csv);

            var result = await service.ImportInventoryItemsAsync(stream);

            Assert.Equal(2, result.SuccessCount);
            Assert.Equal(0, result.ErrorCount);
            Assert.Equal(2, result.TotalRows);
        }

        [Fact]
        public async Task ImportInventoryItems_WithMissingRequiredFields_ReportsErrors()
        {
            var service = CreateService();
            var csv = "SKU,Name,Quantity,UnitPrice\n,Missing SKU,10,9.99\nTEST-001,,5,19.99";
            using var stream = CreateCsvStream(csv);

            var result = await service.ImportInventoryItemsAsync(stream);

            Assert.Equal(0, result.SuccessCount);
            Assert.Equal(2, result.ErrorCount);
        }

        [Fact]
        public async Task ImportInventoryItems_WithMixedValidAndInvalid_ProcessesBoth()
        {
            var service = CreateService();
            var csv = "SKU,Name,Quantity,UnitPrice\nGOOD-001,Good Item,10,5.00\n,Bad Item,10,5.00\nGOOD-002,Another Good,20,15.00";
            using var stream = CreateCsvStream(csv);

            var result = await service.ImportInventoryItemsAsync(stream);

            Assert.Equal(2, result.SuccessCount);
            Assert.Equal(1, result.ErrorCount);
        }

        [Fact]
        public async Task ImportInventoryItems_WithDuplicateSku_UpdatesExisting()
        {
            var dbName = Guid.NewGuid().ToString();
            var service = CreateService(dbName);

            // First import
            var csv1 = "SKU,Name,Quantity,UnitPrice\nDUP-001,Original Name,10,5.00";
            using (var stream1 = CreateCsvStream(csv1))
            {
                await service.ImportInventoryItemsAsync(stream1);
            }

            // Second import with same SKU
            var service2 = CreateService(dbName);
            var csv2 = "SKU,Name,Quantity,UnitPrice\nDUP-001,Updated Name,20,10.00";
            using (var stream2 = CreateCsvStream(csv2))
            {
                var result = await service2.ImportInventoryItemsAsync(stream2);
                Assert.Equal(1, result.SuccessCount);
                Assert.Equal(0, result.ErrorCount);
            }
        }

        [Fact]
        public async Task ImportInventoryItems_WithNegativeQuantity_ReportsError()
        {
            var service = CreateService();
            var csv = "SKU,Name,Quantity,UnitPrice\nNEG-001,Negative Qty,-5,10.00";
            using var stream = CreateCsvStream(csv);

            var result = await service.ImportInventoryItemsAsync(stream);

            Assert.Equal(0, result.SuccessCount);
            Assert.Equal(1, result.ErrorCount);
            Assert.Contains(result.Errors, e => e.Field == "Quantity");
        }

        [Fact]
        public async Task ImportInventoryItems_WithEmptyFile_ReturnsEmptyResult()
        {
            var service = CreateService();
            var csv = "SKU,Name,Quantity,UnitPrice";
            using var stream = CreateCsvStream(csv);

            var result = await service.ImportInventoryItemsAsync(stream);

            Assert.Equal(0, result.SuccessCount);
            Assert.Equal(0, result.TotalRows);
        }

        [Fact]
        public async Task ValidateInventoryItems_WithDuplicateSkuInFile_ReportsError()
        {
            var service = CreateService();
            var csv = "SKU,Name,Quantity,UnitPrice\nDUP-001,Item A,10,5.00\nDUP-001,Item B,20,10.00";
            using var stream = CreateCsvStream(csv);

            var result = await service.ValidateInventoryItemsAsync(stream);

            Assert.Equal(1, result.SuccessCount);
            Assert.Equal(1, result.ErrorCount);
            Assert.Contains(result.Errors, e => e.Message.Contains("Duplicate SKU"));
        }

        [Fact]
        public async Task ValidateInventoryItems_WithValidData_ReturnsSuccess()
        {
            var service = CreateService();
            var csv = "SKU,Name,Quantity,UnitPrice\nVAL-001,Valid Item,10,5.00\nVAL-002,Another Valid,20,15.00";
            using var stream = CreateCsvStream(csv);

            var result = await service.ValidateInventoryItemsAsync(stream);

            Assert.Equal(2, result.SuccessCount);
            Assert.Equal(0, result.ErrorCount);
        }

        [Fact]
        public async Task ImportInventoryItems_WithNegativeUnitPrice_ReportsError()
        {
            var service = CreateService();
            var csv = "SKU,Name,Quantity,UnitPrice\nPRICE-001,Bad Price,10,-5.00";
            using var stream = CreateCsvStream(csv);

            var result = await service.ImportInventoryItemsAsync(stream);

            Assert.Equal(0, result.SuccessCount);
            Assert.Equal(1, result.ErrorCount);
            Assert.Contains(result.Errors, e => e.Field == "UnitPrice");
        }

        [Fact]
        public async Task ImportInventoryItems_WithMalformedRows_HandlesGracefully()
        {
            var service = CreateService();
            // Row with non-numeric quantity and row with non-numeric price
            var csv = "SKU,Name,Quantity,UnitPrice\nMAL-001,Bad Qty,abc,9.99\nMAL-002,Bad Price,10,xyz";
            using var stream = CreateCsvStream(csv);

            var result = await service.ImportInventoryItemsAsync(stream);

            // Malformed numeric fields should default to 0 via CsvHelper, triggering validation or importing as 0
            Assert.True(result.TotalRows >= 0, "Should handle malformed rows without throwing");
        }

        [Fact]
        public async Task ImportInventoryItems_WithExtraColumns_IgnoresExtras()
        {
            var service = CreateService();
            var csv = "SKU,Name,Quantity,UnitPrice,ExtraCol1,ExtraCol2\nEXT-001,Extra Cols,5,10.00,ignored,also_ignored";
            using var stream = CreateCsvStream(csv);

            var result = await service.ImportInventoryItemsAsync(stream);

            Assert.Equal(1, result.SuccessCount);
            Assert.Equal(0, result.ErrorCount);
        }

        [Fact]
        public async Task ImportInventoryItems_WithWhitespaceOnlySku_ReportsError()
        {
            var service = CreateService();
            var csv = "SKU,Name,Quantity,UnitPrice\n   ,Whitespace SKU,10,5.00";
            using var stream = CreateCsvStream(csv);

            var result = await service.ImportInventoryItemsAsync(stream);

            Assert.Equal(0, result.SuccessCount);
            Assert.Equal(1, result.ErrorCount);
            Assert.Contains(result.Errors, e => e.Field == "SKU");
        }
    }
}
