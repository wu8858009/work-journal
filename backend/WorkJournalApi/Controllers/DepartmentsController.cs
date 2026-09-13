using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using WorkJournalApi.Data;
using WorkJournalApi.Models;

namespace WorkJournalApi.Controllers;

[ApiController]
[Route("api/departments")]
public class DepartmentsController : ControllerBase
{
    private readonly MongoContext _db;
    private readonly AuditLogger _audit;

    public DepartmentsController(MongoContext db, AuditLogger audit)
    {
        _db = db;
        _audit = audit;
    }

    // Public: the login screen needs the restaurant list before the user is authenticated.
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetAll()
    {
        var docs = await _db.Departments.Find(FilterDefinition<DepartmentDocument>.Empty).SortBy(d => d.Name).ToListAsync();
        return Ok(docs.Select(d => new DepartmentDto { Id = d.Id, Name = d.Name }).ToList());
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create([FromBody] UpsertDepartmentRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Name))
            return BadRequest(new { message = "請輸入餐廳名稱" });

        var name = req.Name.Trim();
        var existing = await _db.Departments.Find(d => d.Name == name).AnyAsync();
        if (existing) return Conflict(new { message = "此餐廳已存在" });

        var newId = await _db.NextIdAsync("departments");
        try
        {
            await _db.Departments.InsertOneAsync(new DepartmentDocument { Id = newId, Name = name });
        }
        catch (MongoWriteException ex) when (ex.IsDuplicateKey())
        {
            return Conflict(new { message = "此餐廳已存在" });
        }

        await _audit.LogAsync(User.FindFirstValue(ClaimTypes.Name), "CreateDepartment", $"新增餐廳 {name}", department: name);
        return Ok(new DepartmentDto { Id = newId, Name = name });
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Rename(int id, [FromBody] UpsertDepartmentRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Name))
            return BadRequest(new { message = "請輸入餐廳名稱" });

        var name = req.Name.Trim();
        DepartmentDocument? result;
        try
        {
            result = await _db.Departments.FindOneAndUpdateAsync(
                d => d.Id == id,
                Builders<DepartmentDocument>.Update.Set(d => d.Name, name),
                new FindOneAndUpdateOptions<DepartmentDocument> { ReturnDocument = ReturnDocument.After });
        }
        catch (MongoWriteException ex) when (ex.IsDuplicateKey())
        {
            return Conflict(new { message = "此餐廳已存在" });
        }
        if (result is null) return NotFound();

        await _audit.LogAsync(User.FindFirstValue(ClaimTypes.Name), "RenameDepartment", $"餐廳 #{id} 更名為 {name}", department: name);
        return Ok(new DepartmentDto { Id = id, Name = name });
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await _db.Departments.FindOneAndDeleteAsync(d => d.Id == id);
        if (deleted is null) return NotFound();

        // Stands in for the SQL FK's ON DELETE CASCADE: strip this department out of
        // every user's embedded access list.
        await _db.Users.UpdateManyAsync(
            FilterDefinition<UserDocument>.Empty,
            Builders<UserDocument>.Update.PullFilter(u => u.Departments, ud => ud.DepartmentId == id));

        await _audit.LogAsync(User.FindFirstValue(ClaimTypes.Name), "DeleteDepartment", $"刪除餐廳 {deleted.Name}", department: deleted.Name);
        return NoContent();
    }
}
