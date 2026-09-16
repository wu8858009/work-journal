using MongoDB.Bson.Serialization.Attributes;
using WorkJournalApi.Models;

namespace WorkJournalApi.Data;

// Mongo storage shapes. Ids stay plain ints/strings (not ObjectId) so routes like
// {id:int}, JWT claims, and the frontend's existing id contracts don't have to change.

public class UserDocument
{
    [BsonId]
    public int Id { get; set; }
    public string Username { get; set; } = "";
    public string PasswordHash { get; set; } = "";
    public string DisplayName { get; set; } = "";
    public string Role { get; set; } = "";
    public bool IsApproved { get; set; }
    public int TokenVersion { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<UserDepartmentAccessDocument> Departments { get; set; } = new();
    // 「全部餐廳」開關：開啟後不看 Departments 清單，一律套用到現有及日後新增的每一間餐廳，
    // 不用管理員每新增一間餐廳就要記得回來替這個帳號多勾一次。
    public bool AllDepartments { get; set; }
    public bool AllDepartmentsCanEdit { get; set; }
}

public class UserDepartmentAccessDocument
{
    public int DepartmentId { get; set; }
    public bool CanEdit { get; set; }
}

public class DepartmentDocument
{
    [BsonId]
    public int Id { get; set; }
    public string Name { get; set; } = "";
}

public class JournalDocument
{
    [BsonId]
    public string Id { get; set; } = "";
    public string Department { get; set; } = "";
    public string PeriodStart { get; set; } = "";
    public string PeriodEnd { get; set; } = "";
    public List<CategoryDto> Categories { get; set; } = new();
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class AppSettingsDocument
{
    [BsonId]
    public int Id { get; set; }
    public string CompanyName { get; set; } = "";
    public string DefaultDepartment { get; set; } = "";
}

public class AuditLogDocument
{
    [BsonId]
    public int Id { get; set; }
    public string? ActorUsername { get; set; }
    public string Action { get; set; } = "";
    public string? TargetDescription { get; set; }
    public string? Department { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class PasswordResetRequestDocument
{
    [BsonId]
    public int Id { get; set; }
    public int UserId { get; set; }
    public string Status { get; set; } = "Pending";
    public DateTime CreatedAt { get; set; }
    public DateTime? ResolvedAt { get; set; }
}

// One light-timer table per department, keyed by department name (departments are already
// unique by Name, so this doubles as a natural id without needing a counter).
public class LightTimerDocument
{
    [BsonId]
    public string Id { get; set; } = "";
    public string Department { get; set; } = "";
    public List<LightTimerRowDto> Rows { get; set; } = new();
}

// One maintenance schedule per department, keyed by department name — same shape as
// LightTimerDocument above.
public class MaintenanceScheduleDocument
{
    [BsonId]
    public string Id { get; set; } = "";
    public string Department { get; set; } = "";
    public List<MaintenanceTaskDto> Tasks { get; set; } = new();
}

// Backs the auto-increment ids above: one document per counter name, e.g. {_id:"users", Seq: 3}.
public class CounterDocument
{
    [BsonId]
    public string Id { get; set; } = "";
    public int Seq { get; set; }
}
