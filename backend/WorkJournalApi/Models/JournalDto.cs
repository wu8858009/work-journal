namespace WorkJournalApi.Models;

public class JournalDto
{
    public string Id { get; set; } = "";
    public string Department { get; set; } = "";
    public string PeriodStart { get; set; } = "";
    public string PeriodEnd { get; set; } = "";
    public List<CategoryDto> Categories { get; set; } = new();
    public string? CreatedAt { get; set; }
    public string? UpdatedAt { get; set; }
}

public class CategoryDto
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public bool IsCompletedSection { get; set; }
    public List<ItemDto> Items { get; set; } = new();
}

public class ItemDto
{
    public string Id { get; set; } = "";
    public string Item { get; set; } = "";
    public string Assignee { get; set; } = "";
    public string Progress { get; set; } = "";
    public string ExpectedDate { get; set; } = "";
    public int Percent { get; set; }
    public string? HomeCategoryId { get; set; }
    public bool IsPriority { get; set; }
    public List<PhotoDto> Photos { get; set; } = new();
}

public class PhotoDto
{
    public string Id { get; set; } = "";
    // Data URL (base64), already resized/compressed client-side and with any
    // drawing/text annotations flattened in before upload.
    public string DataUrl { get; set; } = "";
    public string? CreatedAt { get; set; }
}
