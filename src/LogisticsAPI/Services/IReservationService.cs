using LogisticsAPI.DTOs;

namespace LogisticsAPI.Services
{
    public interface IReservationService
    {
        Task<IEnumerable<ReservationResponse>> GetReservationsAsync(string? source, DateTime? from, DateTime? to);
        Task<ReservationResponse?> GetReservationByIdAsync(int id);
        Task<ReservationUploadResult> UploadReservationsAsync(Stream fileStream);
        Task<MonthlyReport> GetMonthlyReportAsync(int year, int month);
    }
}
