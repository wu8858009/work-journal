namespace WorkJournalApi.Models;

public class MaintenanceTaskDto
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public string FrequencyLabel { get; set; } = "";
    public string TimesPerYear { get; set; } = "";
    public string MonthsText { get; set; } = "";
    public List<int> ActiveMonths { get; set; } = new();
}

public class MaintenanceScheduleDto
{
    public string Department { get; set; } = "";
    public List<MaintenanceTaskDto> Tasks { get; set; } = new();
}
