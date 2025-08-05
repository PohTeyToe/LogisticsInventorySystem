using LogisticsAPI.Models;
using LogisticsAPI.Services;
using Xunit;

namespace LogisticsAPI.Tests
{
    public class FinancialServiceTests
    {
        private readonly FinancialCalculationService _service;

        public FinancialServiceTests()
        {
            _service = new FinancialCalculationService();
        }

        [Fact]
        public void CalculateGrossRevenue_SumsAccommodationAndCleaningFee()
        {
            var reservation = new Reservation
            {
                AccommodationRevenue = 450.00m,
                CleaningFee = 75.00m
            };

            var result = _service.CalculateGrossRevenue(reservation);

            Assert.Equal(525.00m, result);
        }

        [Fact]
        public void CalculateManagementFee_AppliesCorrectPercentage()
        {
            var result = _service.CalculateManagementFee(1000.00m, 20m);

            Assert.Equal(200.00m, result);
        }

        [Fact]
        public void CalculateOwnerEarnings_SubtractsFeeFromRevenue()
        {
            var result = _service.CalculateOwnerEarnings(1000.00m, 200.00m);

            Assert.Equal(800.00m, result);
        }

        [Fact]
        public void GenerateMonthlyReport_CalculatesAllFields()
        {
            var reservations = new List<Reservation>
            {
                new()
                {
                    ConfirmationCode = "RES001",
                    CheckIn = new DateTime(2025, 1, 1),
                    CheckOut = new DateTime(2025, 1, 4),
                    Nights = 3,
                    NightlyRate = 150.00m,
                    AccommodationRevenue = 450.00m,
                    CleaningFee = 75.00m,
                    BookingSource = "Airbnb"
                },
                new()
                {
                    ConfirmationCode = "RES002",
                    CheckIn = new DateTime(2025, 1, 10),
                    CheckOut = new DateTime(2025, 1, 12),
                    Nights = 2,
                    NightlyRate = 200.00m,
                    AccommodationRevenue = 400.00m,
                    CleaningFee = 50.00m,
                    BookingSource = "VRBO"
                }
            };

            var report = _service.GenerateMonthlyReport(reservations, 20m);

            Assert.Equal(2, report.TotalReservations);
            Assert.Equal(5, report.TotalNights);
            Assert.Equal(975.00m, report.GrossRevenue); // 525 + 450
            Assert.Equal(195.00m, report.ManagementFees); // 975 * 0.20
            Assert.Equal(780.00m, report.OwnerEarnings); // 975 - 195
            Assert.Equal(175.00m, report.AverageNightlyRate); // (150+200)/2
            Assert.Equal(2, report.BookingSourceBreakdown.Count);
        }
    }
}
