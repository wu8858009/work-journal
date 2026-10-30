using System.Security.Claims;
using MongoDB.Driver;
using WorkJournalApi.Models;

namespace WorkJournalApi.Data;

// Shared by JournalsController, LightTimersController, MaintenanceSchedulesController,
// AuthController and UsersController — all department-scoped access/display logic lives
// here instead of being copied into each of them.
public class DepartmentAccessService
{
    private readonly MongoContext _db;

    public DepartmentAccessService(MongoContext db)
    {
        _db = db;
    }

    // 非管理員：依帳號的餐廳設定，回傳「餐廳名稱 -> 是否可編輯」。
    // 管理員、或帳號開了「全部餐廳＋可編輯」：回傳 null 代表不需篩選/檢查（可看見、編輯全部餐廳）。
    // 帳號開了「全部餐廳」但不可編輯：回傳「目前所有餐廳 -> false」，之後新增的餐廳也會自動涵蓋在內。
    public async Task<Dictionary<string, bool>?> GetAccessAsync(ClaimsPrincipal principal)
    {
        if (principal.IsInRole("Admin")) return null;

        var userId = int.Parse(principal.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var user = await _db.Users.Find(u => u.Id == userId).FirstOrDefaultAsync();
        if (user is null) return new Dictionary<string, bool>();

        if (user.AllDepartments)
        {
            if (user.AllDepartmentsCanEdit) return null;
            var allNames = await _db.Departments.Find(FilterDefinition<DepartmentDocument>.Empty).Project(d => d.Name).ToListAsync();
            return allNames.ToDictionary(n => n, n => false);
        }

        var access = new Dictionary<string, bool>();
        if (user.Departments.Count == 0) return access;

        var deptIds = user.Departments.Select(d => d.DepartmentId).ToList();
        var nameById = (await _db.Departments.Find(Builders<DepartmentDocument>.Filter.In(d => d.Id, deptIds)).ToListAsync())
            .ToDictionary(d => d.Id, d => d.Name);

        foreach (var ud in user.Departments)
        {
            if (nameById.TryGetValue(ud.DepartmentId, out var name))
                access[name] = ud.CanEdit;
        }
        return access;
    }

    // 把一個帳號的餐廳設定「攤開」成給前端用的清單（登入回應、帳號管理列表都用得到）。
    // 開了「全部餐廳」的帳號，這裡會直接列出資料庫裡現有的每一間餐廳，前端完全不用另外
    // 認識「全部餐廳」這個概念，跟平常個別勾選的帳號看起來一樣，之後新增餐廳也會自動出現。
    public async Task<List<UserDepartmentAccessDto>> ResolveUserDepartmentsAsync(UserDocument user)
    {
        if (user.AllDepartments)
        {
            var all = await _db.Departments.Find(FilterDefinition<DepartmentDocument>.Empty).SortBy(d => d.Name).ToListAsync();
            return all.Select(d => new UserDepartmentAccessDto
            {
                DepartmentId = d.Id,
                DepartmentName = d.Name,
                CanEdit = user.AllDepartmentsCanEdit,
            }).ToList();
        }

        if (user.Departments.Count == 0) return new();

        var deptIds = user.Departments.Select(d => d.DepartmentId).ToList();
        var nameById = (await _db.Departments.Find(Builders<DepartmentDocument>.Filter.In(d => d.Id, deptIds)).ToListAsync())
            .ToDictionary(d => d.Id, d => d.Name);

        return user.Departments
            .Select(ud => new UserDepartmentAccessDto
            {
                DepartmentId = ud.DepartmentId,
                DepartmentName = nameById.GetValueOrDefault(ud.DepartmentId, ""),
                CanEdit = ud.CanEdit,
            })
            .OrderBy(d => d.DepartmentName)
            .ToList();
    }
}
