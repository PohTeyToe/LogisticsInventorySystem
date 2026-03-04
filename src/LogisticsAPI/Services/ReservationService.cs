using System.Globalization;
using CsvHelper;
using CsvHelper.Configuration;
using LogisticsAPI.Data;
using LogisticsAPI.DTOs;
using LogisticsAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace LogisticsAPI.Services
{
    public class ReservationService : IReservationService
    {
        private readonly ApplicationDbContext _context;
        private readonly IFinancialCalculationService _financialService;

        public ReservationService(ApplicationDbContext context, IFinancialCalculationService financialService)
        {
            _context = context;
            _financialService = financialService;
        }

        public async Task<IEnumerable<ReservationResponse>> GetReservationsAsync(
            string? source, DateTime? from, DateTime? to)
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

            var reservations = await query.OrderByDescending(r => r.CheckIn).ToListAsync();
            return reservations.Select(MapToResponse);
        }

        public async Task<ReservationResponse?> GetReservationByIdAsync(int id)
        {
            var reservation = await _context.Reservations
                .Include(r => r.Property)
                .FirstOrDefaultAsync(r => r.Id == id);

            return reservation != null ? MapToResponse(reservation) : null;
        }

        public async Task<ReservationUploadResult> UploadReservationsAsync(Stream fileStream)
        {
            var imported = 0;
            var errors = new List<string>();

            using var reader = new StreamReader(fileStream);
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

            return new ReservationUploadResult { Imported = imported, Errors = errors };
        }

        public async Task<MonthlyReport> GetMonthlyReportAsync(int year, int month)
        {
            var reservations = await _context.Reservations
                .Where(r => r.CheckIn.Year == year && r.CheckIn.Month == month)
                .ToListAsync();

            return _financialService.GenerateMonthlyReport(reservations, 20m);
        }

        private static ReservationResponse MapToResponse(Reservation reservation)
        {
            return new ReservationResponse
            {
                Id = reservation.Id,
                ConfirmationCode = reservation.ConfirmationCode,
                GuestName = reservation.GuestName,
                CheckIn = reservation.CheckIn,
                CheckOut = reservation.CheckOut,
                Nights = reservation.Nights,
                PropertyId = reservation.PropertyId,
                PropertyName = reservation.Property?.Name,
                NightlyRate = reservation.NightlyRate,
                AccommodationRevenue = reservation.AccommodationRevenue,
                CleaningFee = reservation.CleaningFee,
                ServiceFee = reservation.ServiceFee,
                TotalPayout = reservation.TotalPayout,
                ManagementFeeAmount = reservation.ManagementFeeAmount,
                OwnerNetEarnings = reservation.OwnerNetEarnings,
                BookingSource = reservation.BookingSource,
                TenantId = reservation.TenantId
            };
        }
    }
}
