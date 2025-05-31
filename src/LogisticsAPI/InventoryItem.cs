// src/LogisticsAPI/InventoryItem.cs
using System.ComponentModel.DataAnnotations;

public class InventoryItem
{
    public int Id { get; set; } // Primary Key

    [Required]
    public string SKU { get; set; } // Stock Keeping Unit

    [Required]
    public string Name { get; set; }

    public string Description { get; set; }

    [Range(0, int.MaxValue)]
    public int Quantity { get; set; }

    public string Location { get; set; } // e.g.,  Aisle 3 Shelf B

    public DateTime LastUpdated { get; set; }
}
