using System.Globalization;
using CsvHelper;
using CsvHelper.Configuration;
using LogisticsAPI.Data;
using LogisticsAPI.Models;
using LogisticsAPI.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LogisticsAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Produces("application/json", "application/xml")]
    public class ReservationsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IFinancialCalculationService _financialService;

        public ReservationsController(ApplicationDbContext context, IFinancialCalculationService financialService)
        {
            _context = context;
            _financialService = financialService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Reservation>>> GetReservations(
            [FromQuery] string? source = null,
            [FromQuery] DateTime? from = null,
            [FromQuery] DateTime? to = null)
        {
            var query = _context.Reservations
                .Include(r => r.Property)
                .AsQueryable();

            if (!string.IsNullOrEmpty(source))
                query = query.Where(r => r.BookingSource == source);
            if (from.HasValue)
                query = query.Where(r => r.CheckIn >= from.Value);
            if (to.HasValue)
                query = query.Where(r => r.CheckOut <= to.Value);

            return Ok(await query.OrderByDescending(r => r.CheckIn).ToListAsync());
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Reservation>> GetReservation(int id)
        {
            var reservation = await _context.Reservations
                .Include(r => r.Property)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (reservation == null) return NotFound();
            return Ok(reservation);
        }

        [HttpPost("upload")]
        [Consumes("multipart/form-data")]
        public async Task<ActionResult<object>> UploadReservations(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest("No file uploaded.");

            var results = new { imported = 0, errors = new List<string>() };
            var imported = 0;
            var errors = new List<string>();

            using var reader = new StreamReader(file.OpenReadStream());
            using var csv = new CsvReader(reader, new CsvConfiguration(CultureInfo.InvariantCulture)
            {
                HasHeaderRecord = true,
                MissingFieldFound = null,
                HeaderValidated = null
            });

            var records = csv.GetRecords<ReservationUploadRecord>().ToList();
            var defaultFeePercentage = 20m;

            foreach (var record in records)
            {
                try
                {
                    var grossRevenue = record.NightlyRate * record.Nights + record.CleaningFee;
                    var managementFee = _financialService.CalculateManagementFee(grossRevenue, defaultFeePercentage);

                    var reservation = new Reservation
                    {
                        ConfirmationCode = record.ConfirmationCode,
                        GuestName = record.GuestName,
                        CheckIn = record.CheckIn,
                        CheckOut = record.CheckOut,
                        Nights = record.Nights,
                        NightlyRate = record.NightlyRate,
                        AccommodationRevenue = record.NightlyRate * record.Nights,
                        CleaningFee = record.CleaningFee,
                        ServiceFee = record.ServiceFee,
                        TotalPayout = record.TotalPayout,
                        ManagementFeeAmount = managementFee,
                        OwnerNetEarnings = grossRevenue - managementFee,
                        BookingSource = record.BookingSource
                    };

                    _context.Reservations.Add(reservation);
                    imported++;
                }
                catch (Exception ex)
                {
                    errors.Add($"Row {record.ConfirmationCode}: {ex.Message}");
                }
            }

            await _context.SaveChangesAsync();

            return Ok(new { Imported = imported, Errors = errors });
        }

        [HttpGet("report/monthly")]
        public async Task<ActionResult<MonthlyReport>> GetMonthlyReport(
            [FromQuery] int year, [FromQuery] int month)
        {
            var reservations = await _context.Reservations
                .Where(r => r.CheckIn.Year == year && r.CheckIn.Month == month)
                .ToListAsync();

            var report = _financialService.GenerateMonthlyReport(reservations, 20m);
            return Ok(report);
        }
    }
}
