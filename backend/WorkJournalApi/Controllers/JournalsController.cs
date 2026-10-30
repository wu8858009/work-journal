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
    private readonly DepartmentAccessService _access;

    public JournalsController(MongoContext db, DepartmentAccessService access)
    {
        _db = db;
        _access = access;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var access = await _access.GetAccessAsync(User);
        var docs = await _db.Journals.Find(FilterDefinition<JournalDocument>.Empty).SortByDescending(j => j.PeriodStart).ToListAsync();

        var list = docs
            .Where(d => access is null || access.ContainsKey(d.Department))
            .Select(MapDoc)
            .ToList();
        return Ok(list);
    }

    // 自動同步用：只回傳每份週誌的 Id 和版本號（不含項目和照片），前端每隔幾秒查一次，
    // 只有版本變了的週誌才另外抓完整內容。
    [HttpGet("versions")]
    public async Task<IActionResult> GetVersions()
    {
        var access = await _access.GetAccessAsync(User);
        var docs = await _db.Journals.Find(FilterDefinition<JournalDocument>.Empty)
            .Project(j => new JournalVersionDto { Id = j.Id, Department = j.Department, Version = j.Version })
            .ToListAsync();
        return Ok(docs.Where(d => access is null || access.ContainsKey(d.Department)));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(string id)
    {
        if (!Guid.TryParse(id, out var guid)) return BadRequest(new { message = "無效的週誌 Id" });

        var doc = await _db.Journals.Find(j => j.Id == guid.ToString()).FirstOrDefaultAsync();
        if (doc is null) return NotFound();

        var access = await _access.GetAccessAsync(User);
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

        var access = await _access.GetAccessAsync(User);
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
            .Inc(j => j.Version, 1)
            .SetOnInsert(j => j.CreatedAt, now);
        var byId = Builders<JournalDocument>.Filter.Eq(j => j.Id, normalizedId);

        if (dto.BaseVersion is null)
        {
            // 舊版前端（還沒更新到有自動同步的版本）：維持原本「直接覆蓋」的行為。
            await _db.Journals.UpdateOneAsync(byId, update, new UpdateOptions { IsUpsert = true });
        }
        else
        {
            // 只有資料庫裡還是「我改之前那一版」才寫入；舊資料沒有 Version 欄位，視為第 0 版。
            var baseVersion = dto.BaseVersion.Value;
            var versionMatches = baseVersion == 0
                ? Builders<JournalDocument>.Filter.Or(
                    Builders<JournalDocument>.Filter.Eq(j => j.Version, 0),
                    Builders<JournalDocument>.Filter.Exists(j => j.Version, false))
                : Builders<JournalDocument>.Filter.Eq(j => j.Version, baseVersion);
            var result = await _db.Journals.UpdateOneAsync(byId & versionMatches, update);

            if (result.MatchedCount == 0)
            {
                var current = await _db.Journals.Find(byId).FirstOrDefaultAsync();
                if (current is not null)
                    return Conflict(new { message = "這份週誌剛被其他裝置修改過", current = MapDoc(current) });

                // 全新的週誌（前端自己產生 Id）：直接新增；萬一同時有人也新增了同一份，視為衝突。
                try
                {
                    await _db.Journals.InsertOneAsync(new JournalDocument
                    {
                        Id = normalizedId,
                        Department = department,
                        PeriodStart = dto.PeriodStart,
                        PeriodEnd = dto.PeriodEnd,
                        Categories = dto.Categories,
                        CreatedAt = now,
                        UpdatedAt = now,
                        Version = 1,
                    });
                }
                catch (MongoWriteException ex) when (ex.IsDuplicateKey())
                {
                    var raced = await _db.Journals.Find(byId).FirstAsync();
                    return Conflict(new { message = "這份週誌剛被其他裝置修改過", current = MapDoc(raced) });
                }
            }
        }

        var saved = await _db.Journals.Find(byId).FirstAsync();
        return Ok(MapDoc(saved));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        if (!Guid.TryParse(id, out var guid)) return BadRequest(new { message = "無效的週誌 Id" });
        var normalizedId = guid.ToString();

        var access = await _access.GetAccessAsync(User);
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
        Version = doc.Version,
    };
}
