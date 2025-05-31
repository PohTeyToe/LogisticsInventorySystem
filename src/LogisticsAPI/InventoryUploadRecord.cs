// This is a Data Transfer Object (DTO) used specifically for the CSV upload.
// It mirrors the structure of the CSV file.
public class InventoryUploadRecord
{
    public string SKU { get; set; }
    public string Name { get; set; }
    public string Description { get; set; }
    public int Quantity { get; set; }
    public string Location { get; set; }
    public DateTime LastUpdated { get; set; }
}


