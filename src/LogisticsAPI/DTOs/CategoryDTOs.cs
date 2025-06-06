using System.ComponentModel.DataAnnotations;
using System.Runtime.Serialization;

namespace LogisticsAPI.DTOs
{
    [DataContract]
    public class CreateCategoryRequest
    {
        [Required]
        [StringLength(100)]
        [DataMember]
        public string Name { get; set; } = string.Empty;

        [StringLength(500)]
        [DataMember]
        public string? Description { get; set; }
    }

    [DataContract]
    public class CategoryResponse
    {
        [DataMember]
        public int Id { get; set; }

        [DataMember]
        public string Name { get; set; } = string.Empty;

        [DataMember]
        public string? Description { get; set; }

        [DataMember]
        public int ItemCount { get; set; }
    }
}
