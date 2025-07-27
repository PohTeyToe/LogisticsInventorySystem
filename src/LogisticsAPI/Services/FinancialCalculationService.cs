using LogisticsAPI.Models;

namespace LogisticsAPI.Services
{
    public interface IFinancialCalculationService
    {
        decimal CalculateGrossRevenue(Reservation reservation);
        decimal CalculateManagementFee(decimal grossRevenue, decimal feePercentage);
        decimal CalculateOwnerEarnings(decimal grossRevenue, decimal managementFee);
        MonthlyReport GenerateMonthlyReport(IEnumerable<Reservation> reservations, decimal feePercentage);
        PerformanceSummary GeneratePerformanceSummary(IEnumerable<Reservation> reservations);
    }

    public class FinancialCalculationService : IFinancialCalculationService
    {
        public decimal CalculateGrossRevenue(Reservation reservation)
        {
            return reservation.AccommodationRevenue + reservation.CleaningFee;
        }

        public decimal CalculateManagementFee(decimal grossRevenue, decimal feePercentage)
        {
            return Math.Round(grossRevenue * (feePercentage / 100m), 2);
        }

        public decimal CalculateOwnerEarnings(decimal grossRevenue, decimal managementFee)
        {
            return grossRevenue - managementFee;
        }

        public MonthlyReport GenerateMonthlyReport(IEnumerable<Reservation> reservations, decimal feePercentage)
        {
            var reservationList = reservations.ToList();
            var totalRevenue = reservationList.Sum(r => CalculateGrossRevenue(r));
            var totalFees = CalculateManagementFee(totalRevenue, feePercentage);

            return new MonthlyReport
            {
                TotalReservations = reservationList.Count,
                TotalNights = reservationList.Sum(r => r.Nights),
                GrossRevenue = totalRevenue,
                ManagementFees = totalFees,
                OwnerEarnings = CalculateOwnerEarnings(totalRevenue, totalFees),
                AverageNightlyRate = reservationList.Any()
                    ? Math.Round(reservationList.Average(r => r.NightlyRate), 2)
                    : 0,
                AverageStayLength = reservationList.Any()
                    ? Math.Round(reservationList.Average(r => r.Nights), 1)
                    : 0,
                BookingSourceBreakdown = reservationList
                    .GroupBy(r => r.BookingSource ?? "Unknown")
                    .ToDictionary(g => g.Key, g => g.Count())
            };
        }

        public PerformanceSummary GeneratePerformanceSummary(IEnumerable<Reservation> reservations)
        {
            var reservationList = reservations.ToList();
            if (!reservationList.Any())
            {
                return new PerformanceSummary();
            }

            var totalRevenue = reservationList.Sum(r => CalculateGrossRevenue(r));

            return new PerformanceSummary
            {
                TotalRevenue = totalRevenue,
                TotalReservations = reservationList.Count,
                AverageRevenuePerBooking = Math.Round(totalRevenue / reservationList.Count, 2),
                HighestRevenueBooking = reservationList.Max(r => CalculateGrossRevenue(r)),
                LowestRevenueBooking = reservationList.Min(r => CalculateGrossRevenue(r)),
                TotalNights = reservationList.Sum(r => r.Nights)
            };
        }
    }

    public class MonthlyReport
    {
        public int TotalReservations { get; set; }
        public int TotalNights { get; set; }
        public decimal GrossRevenue { get; set; }
        public decimal ManagementFees { get; set; }
        public decimal OwnerEarnings { get; set; }
        public decimal AverageNightlyRate { get; set; }
        public double AverageStayLength { get; set; }
        public Dictionary<string, int> BookingSourceBreakdown { get; set; } = new();
    }

    public class PerformanceSummary
    {
        public decimal TotalRevenue { get; set; }
        public int TotalReservations { get; set; }
        public decimal AverageRevenuePerBooking { get; set; }
        public decimal HighestRevenueBooking { get; set; }
        public decimal LowestRevenueBooking { get; set; }
        public int TotalNights { get; set; }
    }
}
