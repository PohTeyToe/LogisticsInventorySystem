using LogisticsAPI.DTOs;
using LogisticsAPI.Services;
using Microsoft.AspNetCore.Mvc;

namespace LogisticsAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Produces("application/json", "application/xml")]
    public class ReservationsController : ControllerBase
    {
        private readonly IReservationService _reservationService;

        public ReservationsController(IReservationService reservationService)
        {
            _reservationService = reservationService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<ReservationResponse>>> GetReservations(
            [FromQuery] string? source = null,
            [FromQuery] DateTime? from = null,
            [FromQuery] DateTime? to = null)
        {
            var reservations = await _reservationService.GetReservationsAsync(source, from, to);
            return Ok(reservations);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ReservationResponse>> GetReservation(int id)
        {
            var reservation = await _reservationService.GetReservationByIdAsync(id);
            if (reservation == null) return NotFound();
            return Ok(reservation);
        }

        [HttpPost("upload")]
        [Consumes("multipart/form-data")]
        public async Task<ActionResult<ReservationUploadResult>> UploadReservations(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest("No file uploaded.");

            using var stream = file.OpenReadStream();
            var result = await _reservationService.UploadReservationsAsync(stream);
            return Ok(result);
        }

        [HttpGet("report/monthly")]
        public async Task<ActionResult<MonthlyReport>> GetMonthlyReport(
            [FromQuery] int year, [FromQuery] int month)
        {
            var report = await _reservationService.GetMonthlyReportAsync(year, month);
            return Ok(report);
        }
    }
}
