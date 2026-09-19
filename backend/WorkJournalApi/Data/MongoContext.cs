using MongoDB.Driver;

namespace WorkJournalApi.Data;

public class MongoContext
{
    public IMongoDatabase Database { get; }

    public MongoContext(IConfiguration config)
    {
        var connectionString = config["Mongo:ConnectionString"]
            ?? throw new InvalidOperationException("Missing Mongo:ConnectionString in appsettings.json");
        var databaseName = config["Mongo:DatabaseName"]
            ?? throw new InvalidOperationException("Missing Mongo:DatabaseName in appsettings.json");

        var client = new MongoClient(connectionString);
        Database = client.GetDatabase(databaseName);
    }

    public IMongoCollection<UserDocument> Users => Database.GetCollection<UserDocument>("Users");
    public IMongoCollection<DepartmentDocument> Departments => Database.GetCollection<DepartmentDocument>("Departments");
    public IMongoCollection<JournalDocument> Journals => Database.GetCollection<JournalDocument>("Journals");
    public IMongoCollection<AppSettingsDocument> AppSettings => Database.GetCollection<AppSettingsDocument>("AppSettings");
    public IMongoCollection<AuditLogDocument> AuditLogs => Database.GetCollection<AuditLogDocument>("AuditLogs");
    public IMongoCollection<PasswordResetRequestDocument> PasswordResetRequests => Database.GetCollection<PasswordResetRequestDocument>("PasswordResetRequests");
    public IMongoCollection<LightTimerDocument> LightTimers => Database.GetCollection<LightTimerDocument>("LightTimers");
    public IMongoCollection<MaintenanceScheduleDocument> MaintenanceSchedules => Database.GetCollection<MaintenanceScheduleDocument>("MaintenanceSchedules");
    public IMongoCollection<PresenceDocument> Presence => Database.GetCollection<PresenceDocument>("Presence");
    private IMongoCollection<CounterDocument> Counters => Database.GetCollection<CounterDocument>("Counters");

    // Atomically hands out the next int id for a given counter (e.g. "users", "departments"),
    // standing in for the SQL Server IDENTITY columns the old schema relied on.
    public async Task<int> NextIdAsync(string counterName)
    {
        var filter = Builders<CounterDocument>.Filter.Eq(c => c.Id, counterName);
        var update = Builders<CounterDocument>.Update.Inc(c => c.Seq, 1);
        var options = new FindOneAndUpdateOptions<CounterDocument>
        {
            IsUpsert = true,
            ReturnDocument = ReturnDocument.After,
        };
        var result = await Counters.FindOneAndUpdateAsync(filter, update, options);
        return result.Seq;
    }
}
