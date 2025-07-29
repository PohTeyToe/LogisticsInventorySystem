using CsvHelper.Configuration.Attributes;

namespace LogisticsAPI.Models
{
    public class ReservationUploadRecord
    {
        [Name("Confirmation Code", "confirmation_code", "ConfirmationCode")]
        public string ConfirmationCode { get; set; } = string.Empty;

        [Name("Guest Name", "guest_name", "GuestName", "Guest")]
        public string? GuestName { get; set; }

        [Name("Check-In", "check_in", "CheckIn", "Checkin")]
        public DateTime CheckIn { get; set; }

        [Name("Check-Out", "check_out", "CheckOut", "Checkout")]
        public DateTime CheckOut { get; set; }

        [Name("Nights", "nights", "NumNights")]
        public int Nights { get; set; }

        [Name("Listing", "listing", "Property", "PropertyName")]
        public string? Listing { get; set; }

        [Name("Nightly Rate", "nightly_rate", "NightlyRate", "Rate")]
        public decimal NightlyRate { get; set; }

        [Name("Cleaning Fee", "cleaning_fee", "CleaningFee")]
        public decimal CleaningFee { get; set; }

        [Name("Service Fee", "service_fee", "ServiceFee")]
        public decimal ServiceFee { get; set; }

        [Name("Total Payout", "total_payout", "TotalPayout", "Payout")]
        public decimal TotalPayout { get; set; }

        [Name("Booking Source", "booking_source", "BookingSource", "Source")]
        [Optional]
        public string? BookingSource { get; set; }
    }
}
