using System.Runtime.Serialization;

namespace LogisticsAPI.DTOs
{
    [DataContract]
    public class ReservationResponse
    {
        [DataMember]
        public int Id { get; set; }

        [DataMember]
        public string ConfirmationCode { get; set; } = string.Empty;

        [DataMember]
        public string? GuestName { get; set; }

        [DataMember]
        public DateTime CheckIn { get; set; }

        [DataMember]
        public DateTime CheckOut { get; set; }

        [DataMember]
        public int Nights { get; set; }

        [DataMember]
        public int? PropertyId { get; set; }

        [DataMember]
        public string? PropertyName { get; set; }

        [DataMember]
        public decimal NightlyRate { get; set; }

        [DataMember]
        public decimal AccommodationRevenue { get; set; }

        [DataMember]
        public decimal CleaningFee { get; set; }

        [DataMember]
        public decimal ServiceFee { get; set; }

        [DataMember]
        public decimal TotalPayout { get; set; }

        [DataMember]
        public decimal ManagementFeeAmount { get; set; }

        [DataMember]
        public decimal OwnerNetEarnings { get; set; }

        [DataMember]
        public string? BookingSource { get; set; }

        [DataMember]
        public int TenantId { get; set; }
    }

    [DataContract]
    public class ReservationUploadResult
    {
        [DataMember]
        public int Imported { get; set; }

        [DataMember]
        public List<string> Errors { get; set; } = new();
    }
}
