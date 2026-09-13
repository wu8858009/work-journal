using MongoDB.Driver;

namespace WorkJournalApi.Data;

public class AuditLogger
{
    private readonly MongoContext _db;

    public AuditLogger(MongoContext db)
    {
        _db = db;
    }

    /// <summary>
    /// Logs an admin action. The department context is resolved (in priority order) from
    /// <paramref name="department"/> if given directly, otherwise from <paramref name="departmentIds"/>
    /// (e.g. the restaurant list just assigned to a user), otherwise from the restaurants
    /// currently assigned to <paramref name="relatedUserId"/>. Leave all three null when the
    /// action isn't tied to a specific restaurant (e.g. signup, password reset requests).
    /// </summary>
    public async Task LogAsync(string? actorUsername, string action, string? targetDescription,
        string? department = null, IEnumerable<int>? departmentIds = null, int? relatedUserId = null)
    {
        if (department is null && departmentIds is not null)
        {
            department = await JoinDepartmentNamesByIdAsync(departmentIds);
        }
        else if (department is null && relatedUserId is int uid)
        {
            department = await JoinDepartmentNamesByUserAsync(uid);
        }

        await _db.AuditLogs.InsertOneAsync(new AuditLogDocument
        {
            Id = await _db.NextIdAsync("auditlogs"),
            ActorUsername = actorUsername,
            Action = action,
            TargetDescription = targetDescription,
            Department = department,
            CreatedAt = DateTime.UtcNow,
        });
    }

    private async Task<string?> JoinDepartmentNamesByIdAsync(IEnumerable<int> departmentIds)
    {
        var ids = departmentIds.Distinct().ToList();
        if (ids.Count == 0) return null;

        var names = await _db.Departments
            .Find(Builders<DepartmentDocument>.Filter.In(d => d.Id, ids))
            .SortBy(d => d.Name)
            .Project(d => d.Name)
            .ToListAsync();
        return names.Count > 0 ? string.Join("、", names) : null;
    }

    private async Task<string?> JoinDepartmentNamesByUserAsync(int userId)
    {
        var user = await _db.Users.Find(u => u.Id == userId).FirstOrDefaultAsync();
        if (user is null || user.Departments.Count == 0) return null;
        return await JoinDepartmentNamesByIdAsync(user.Departments.Select(d => d.DepartmentId));
    }
}
