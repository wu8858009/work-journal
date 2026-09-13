using MongoDB.Driver;

namespace WorkJournalApi.Data;

// Runs once at startup, idempotently. Replaces the old backend/sql/schema.sql +
// seed.sql, which had to be run manually with sqlcmd against SQL Server — Mongo has
// no schema to create up front, so this just ensures indexes and default data exist.
public class MongoSeeder
{
    private readonly MongoContext _db;

    private const string DefaultCompanyName = "水灣企業股份有限公司";
    private const string DefaultDepartmentName = "碧潭工程";

    // PBKDF2-SHA256, 100k iterations, for password "Admin@2026Init" — same precomputed
    // hash backend/sql/seed.sql used, so the default admin login stays unchanged.
    private const string DefaultAdminPasswordHash =
        "100000.nzwYm05lGw0GjuRSmo/fTQ==.Du+TEbYJR+tfCLtiS2oXqPcd9t+PGuMVioCu7+9Ips0=";

    public MongoSeeder(MongoContext db)
    {
        _db = db;
    }

    public async Task RunAsync()
    {
        await _db.Users.Indexes.CreateOneAsync(new CreateIndexModel<UserDocument>(
            Builders<UserDocument>.IndexKeys.Ascending(u => u.Username),
            new CreateIndexOptions { Unique = true }));

        await _db.Departments.Indexes.CreateOneAsync(new CreateIndexModel<DepartmentDocument>(
            Builders<DepartmentDocument>.IndexKeys.Ascending(d => d.Name),
            new CreateIndexOptions { Unique = true }));

        var settingsExist = await _db.AppSettings.Find(s => s.Id == 1).AnyAsync();
        if (!settingsExist)
        {
            await _db.AppSettings.InsertOneAsync(new AppSettingsDocument
            {
                Id = 1,
                CompanyName = DefaultCompanyName,
                DefaultDepartment = DefaultDepartmentName,
            });
        }

        // Only bootstrap the first admin + department when there are no users yet at
        // all, mirroring seed.sql's "only seed an empty Users table" guard so this
        // never overwrites a real, already-running deployment.
        var usersExist = await _db.Users.Find(FilterDefinition<UserDocument>.Empty).AnyAsync();
        if (usersExist) return;

        var department = await _db.Departments.Find(d => d.Name == DefaultDepartmentName).FirstOrDefaultAsync();
        if (department is null)
        {
            department = new DepartmentDocument { Id = await _db.NextIdAsync("departments"), Name = DefaultDepartmentName };
            await _db.Departments.InsertOneAsync(department);
        }

        await _db.Users.InsertOneAsync(new UserDocument
        {
            Id = await _db.NextIdAsync("users"),
            Username = "admin",
            PasswordHash = DefaultAdminPasswordHash,
            DisplayName = "系統管理員",
            Role = "Admin",
            IsApproved = true,
            TokenVersion = 1,
            CreatedAt = DateTime.UtcNow,
            Departments = new List<UserDepartmentAccessDocument>
            {
                new() { DepartmentId = department.Id, CanEdit = true },
            },
        });
    }
}
