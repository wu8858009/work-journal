using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using WorkJournalApi.Data;

namespace WorkJournalApi.Controllers;

[ApiController]
[Route("api/users/{id:int}/display-name")]
[Authorize(Roles = "Admin")]
public class UserDisplayNameController : ControllerBase
{
    private readonly MongoContext _db;
    private readonly AuditLogger _audit;

    public UserDisplayNameController(MongoContext db, AuditLogger audit)
    {
        _db = db;
        _audit = audit;
    }

    public class RenameRequest
    {
        public string? DisplayName { get; set; }
    }

    // Only the display name changes — the login username, password and TokenVersion are
    // untouched, so nobody gets logged out. Already-issued tokens keep the old name until the
    // account signs in again.
    [HttpPut]
    public async Task<IActionResult> Rename(int id, [FromBody] RenameRequest req)
    {
        var name = req.DisplayName?.Trim();
        if (string.IsNullOrEmpty(name)) return BadRequest(new { message = "請輸入名稱" });
        if (name.Length > 50) return BadRequest(new { message = "名稱最多 50 個字" });

        var before = await _db.Users.FindOneAndUpdateAsync(
            u => u.Id == id,
            Builders<UserDocument>.Update.Set(u => u.DisplayName, name));
        if (before is null) return NotFound();

        await _audit.LogAsync(User.FindFirstValue(ClaimTypes.Name), "RenameUser",
            $"將帳號 {before.Username} 的名稱從「{before.DisplayName}」改為「{name}」", relatedUserId: id);
        return Ok(new { message = "名稱已更新", displayName = name });
    }
}
