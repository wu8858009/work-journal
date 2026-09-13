using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using WorkJournalApi.Data;
using WorkJournalApi.Models;

namespace WorkJournalApi.Controllers;

[ApiController]
[Route("api/journals")]
[Authorize]
public class JournalsController : ControllerBase
{
    private readonly MongoContext _db;

    public JournalsController(MongoContext db)
    {
        _db = db;
    }

    private bool IsAdmin => User.IsInRole("Admin");
    private int CurrentUserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    // 非管理員：依帳號在使用者文件內嵌的餐廳清單，回傳「餐廳名稱 -> 是否可編輯」。
    // 管理員不受限制，回傳 null 代表不需篩選/檢查。
    private async Task<Dictionary<string, bool>?> GetDepartmentAccessAsync()
    {
        if (IsAdmin) return null;

        var access = new Dictionary<string, bool>();
        var user = await _db.Users.Find(u => u.Id == CurrentUserId).FirstOrDefaultAsync();
        if (user is null || user.Departments.Count == 0) return access;

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

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var access = await GetDepartmentAccessAsync();
        var docs = await _db.Journals.Find(FilterDefinition<JournalDocument>.Empty).SortByDescending(j => j.PeriodStart).ToListAsync();

        var list = docs
            .Where(d => access is null || access.ContainsKey(d.Department))
            .Select(MapDoc)
            .ToList();
        return Ok(list);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(string id)
    {
        if (!Guid.TryParse(id, out var guid)) return BadRequest(new { message = "無效的週誌 Id" });

        var doc = await _db.Journals.Find(j => j.Id == guid.ToString()).FirstOrDefaultAsync();
        if (doc is null) return NotFound();

        var access = await GetDepartmentAccessAsync();
        if (access != null && !access.ContainsKey(doc.Department))
            return StatusCode(403, new { message = "您沒有這個餐廳的權限" });

        return Ok(MapDoc(doc));
    }

    // Upsert: the frontend generates the Id client-side, so PUT both creates and updates.
    [HttpPut("{id}")]
    public async Task<IActionResult> Upsert(string id, [FromBody] JournalDto dto)
    {
        if (!Guid.TryParse(id, out var guid)) return BadRequest(new { message = "無效的週誌 Id" });
        if (!DateOnly.TryParse(dto.PeriodStart, out _) || !DateOnly.TryParse(dto.PeriodEnd, out _))
            return BadRequest(new { message = "期間日期格式錯誤" });

        var normalizedId = guid.ToString();
        var department = dto.Department ?? "";

        var access = await GetDepartmentAccessAsync();
        if (access != null)
        {
            if (!access.TryGetValue(department, out var canEditTarget) || !canEditTarget)
                return StatusCode(403, new { message = "您沒有這個餐廳的編輯權限" });

            var existing = await _db.Journals.Find(j => j.Id == normalizedId).FirstOrDefaultAsync();
            if (existing is not null && (!access.TryGetValue(existing.Department, out var canEditExisting) || !canEditExisting))
                return StatusCode(403, new { message = "您沒有這個餐廳的編輯權限" });
        }

        var now = DateTime.UtcNow;
        var update = Builders<JournalDocument>.Update
            .Set(j => j.Department, department)
            .Set(j => j.PeriodStart, dto.PeriodStart)
            .Set(j => j.PeriodEnd, dto.PeriodEnd)
            .Set(j => j.Categories, dto.Categories)
            .Set(j => j.UpdatedAt, now)
            .SetOnInsert(j => j.CreatedAt, now);
        await _db.Journals.UpdateOneAsync(j => j.Id == normalizedId, update, new UpdateOptions { IsUpsert = true });

        dto.Id = normalizedId;
        return Ok(dto);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        if (!Guid.TryParse(id, out var guid)) return BadRequest(new { message = "無效的週誌 Id" });
        var normalizedId = guid.ToString();

        var access = await GetDepartmentAccessAsync();
        if (access != null)
        {
            var existing = await _db.Journals.Find(j => j.Id == normalizedId).FirstOrDefaultAsync();
            if (existing is not null && (!access.TryGetValue(existing.Department, out var canEditExisting) || !canEditExisting))
                return StatusCode(403, new { message = "您沒有這個餐廳的編輯權限" });
        }

        await _db.Journals.DeleteOneAsync(j => j.Id == normalizedId);
        return NoContent();
    }

    private static JournalDto MapDoc(JournalDocument doc) => new()
    {
        Id = doc.Id,
        Department = doc.Department,
        PeriodStart = doc.PeriodStart,
        PeriodEnd = doc.PeriodEnd,
        Categories = doc.Categories,
        CreatedAt = doc.CreatedAt.ToUtcIsoString(),
        UpdatedAt = doc.UpdatedAt.ToUtcIsoString(),
    };
}
