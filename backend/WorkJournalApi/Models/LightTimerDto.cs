namespace WorkJournalApi.Models;

public class LightTimerRowDto
{
    public string Id { get; set; } = "";
    public string Location { get; set; } = "";
    public string SummerStart { get; set; } = "";
    public string SummerEnd { get; set; } = "";
    public string SpringAutumnStart { get; set; } = "";
    public string SpringAutumnEnd { get; set; } = "";
    public string WinterStart { get; set; } = "";
    public string WinterEnd { get; set; } = "";
    public string Note { get; set; } = "";
}

public class LightTimerTableDto
{
    public string Department { get; set; } = "";
    public List<LightTimerRowDto> Rows { get; set; } = new();
}
