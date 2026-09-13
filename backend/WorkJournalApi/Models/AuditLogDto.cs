namespace WorkJournalApi.Models;

public class AuditLogDto
{
    public int Id { get; set; }
    public string? ActorUsername { get; set; }
    public string Action { get; set; } = "";
    public string? TargetDescription { get; set; }
    public string? Department { get; set; }
    public string CreatedAt { get; set; } = "";
}
