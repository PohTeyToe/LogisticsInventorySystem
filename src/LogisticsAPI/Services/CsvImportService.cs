using System.Globalization;
using CsvHelper;
using CsvHelper.Configuration;
using LogisticsAPI.Data;
using LogisticsAPI.DTOs;
using LogisticsAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace LogisticsAPI.Services
{
    public class CsvImportService : ICsvImportService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<CsvImportService> _logger;

        public CsvImportService(ApplicationDbContext context, ILogger<CsvImportService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<ImportResult> ImportInventoryItemsAsync(Stream csvStream)
        {
            var result = new ImportResult();
            var records = ParseCsvRecords(csvStream, result);

            if (records == null || !records.Any())
            {
                return result;
            }

            foreach (var (record, rowIndex) in records.Select((r, i) => (r, i + 2))) // +2 for header + 1-based
            {
                try
                {
                    var validationErrors = ValidateRecord(record, rowIndex);
                    if (validationErrors.Any())
                    {
                        result.Errors.AddRange(validationErrors);
                        result.ErrorCount++;
                        continue;
                    }

                    // Check for duplicate SKU
                    var existingItem = await _context.InventoryItems
                        .IgnoreQueryFilters()
                        .FirstOrDefaultAsync(i => i.SKU == record.SKU);

                    if (existingItem != null)
                    {
                        // Update existing item
                        existingItem.Name = record.Name;
                        existingItem.Description = record.Description;
                        existingItem.Quantity = record.Quantity;
                        existingItem.Location = record.Location;
                        existingItem.UnitPrice = record.UnitPrice;
                        existingItem.UpdatedAt = DateTime.UtcNow;
                        _logger.LogInformation("Updated existing item with SKU {SKU}", record.SKU);
                    }
                    else
                    {
                        // Create new item
                        var item = new InventoryItem
                        {
                            SKU = record.SKU,
                            Name = record.Name,
                            Description = record.Description,
                            Quantity = record.Quantity,
                            Location = record.Location,
                            UnitPrice = record.UnitPrice,
                            CreatedAt = DateTime.UtcNow,
                            UpdatedAt = DateTime.UtcNow
                        };

                        _context.InventoryItems.Add(item);
                    }

                    result.SuccessCount++;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error processing row {Row}", rowIndex);
                    result.Errors.Add(new ImportError
                    {
                        Row = rowIndex,
                        Field = "General",
                        Message = $"Unexpected error: {ex.Message}"
                    });
                    result.ErrorCount++;
                }
            }

            if (result.SuccessCount > 0)
            {
                await _context.SaveChangesAsync();
            }

            result.TotalRows = result.SuccessCount + result.ErrorCount;
            return result;
        }

        public async Task<ImportResult> ValidateInventoryItemsAsync(Stream csvStream)
        {
            var result = new ImportResult();
            var records = ParseCsvRecords(csvStream, result);

            if (records == null || !records.Any())
            {
                return result;
            }

            var seenSkus = new HashSet<string>();

            foreach (var (record, rowIndex) in records.Select((r, i) => (r, i + 2)))
            {
                var validationErrors = ValidateRecord(record, rowIndex);
                if (validationErrors.Any())
                {
                    result.Errors.AddRange(validationErrors);
                    result.ErrorCount++;
                }
                else
                {
                    // Check for duplicate SKU within the file
                    if (!seenSkus.Add(record.SKU))
                    {
                        result.Errors.Add(new ImportError
                        {
                            Row = rowIndex,
                            Field = "SKU",
                            Message = $"Duplicate SKU '{record.SKU}' found in file."
                        });
                        result.ErrorCount++;
                    }
                    else
                    {
                        result.SuccessCount++;
                    }
                }
            }

            result.TotalRows = result.SuccessCount + result.ErrorCount;
            return await Task.FromResult(result);
        }

        private List<CsvInventoryRecord>? ParseCsvRecords(Stream csvStream, ImportResult result)
        {
            try
            {
                using var reader = new StreamReader(csvStream);
                using var csv = new CsvReader(reader, new CsvConfiguration(CultureInfo.InvariantCulture)
                {
                    HasHeaderRecord = true,
                    MissingFieldFound = null,
                    HeaderValidated = null,
                    BadDataFound = context =>
                    {
                        _logger.LogWarning("Bad data found in CSV: {RawRecord}", context.RawRecord);
                    }
                });

                return csv.GetRecords<CsvInventoryRecord>().ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error parsing CSV file");
                result.Errors.Add(new ImportError
                {
                    Row = 0,
                    Field = "File",
                    Message = $"Error parsing CSV: {ex.Message}"
                });
                result.ErrorCount++;
                return null;
            }
        }

        private static List<ImportError> ValidateRecord(CsvInventoryRecord record, int rowIndex)
        {
            var errors = new List<ImportError>();

            if (string.IsNullOrWhiteSpace(record.SKU))
            {
                errors.Add(new ImportError
                {
                    Row = rowIndex,
                    Field = "SKU",
                    Message = "SKU is required."
                });
            }

            if (string.IsNullOrWhiteSpace(record.Name))
            {
                errors.Add(new ImportError
                {
                    Row = rowIndex,
                    Field = "Name",
                    Message = "Name is required."
                });
            }

            if (record.Quantity < 0)
            {
                errors.Add(new ImportError
                {
                    Row = rowIndex,
                    Field = "Quantity",
                    Message = "Quantity cannot be negative."
                });
            }

            if (record.UnitPrice < 0)
            {
                errors.Add(new ImportError
                {
                    Row = rowIndex,
                    Field = "UnitPrice",
                    Message = "Unit price cannot be negative."
                });
            }

            return errors;
        }
    }

    public class CsvInventoryRecord
    {
        public string SKU { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int Quantity { get; set; }
        public string? Location { get; set; }
        public decimal UnitPrice { get; set; }
        public string? Category { get; set; }
        public string? Warehouse { get; set; }
    }
}
