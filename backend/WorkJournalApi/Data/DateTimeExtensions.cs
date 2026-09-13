namespace WorkJournalApi.Data;

public static class DateTimeExtensions
{
    // Belt-and-braces: make sure the Kind is explicitly Utc before formatting, so
    // ToString("o") always emits the "Z" suffix and browsers don't parse the value
    // as local time.
    public static string ToUtcIsoString(this DateTime dt) => DateTime.SpecifyKind(dt, DateTimeKind.Utc).ToString("o");
}
