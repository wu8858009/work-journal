using MongoDB.Driver;

namespace WorkJournalApi.Data;

public static class MongoExceptionExtensions
{
    // Stands in for the SqlException.Number is 2601 or 2627 checks the old code used
    // to detect a violated unique index (e.g. Username, Department Name).
    public static bool IsDuplicateKey(this MongoWriteException ex) =>
        ex.WriteError?.Category == ServerErrorCategory.DuplicateKey;
}
