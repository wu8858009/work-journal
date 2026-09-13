using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using WorkJournalApi.Auth;
using WorkJournalApi.Data;
using WorkJournalApi.Models;

namespace WorkJournalApi.Controllers;

[ApiController]
[Route("api/password-reset-requests")]
[Authorize(Roles = "Admin")]
public class PasswordResetController : ControllerBase
{
    private readonly MongoContext _db;
    private readonly PasswordHasher _hasher;
    private readonly AuditLogger _audit;

    public PasswordResetController(MongoContext db, PasswordHasher hasher, AuditLogger audit)
    {
        _db = db;
        _hasher = hasher;
        _audit = audit;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var requests = await _db.PasswordResetRequests.Find(r => r.Status == "Pending").SortBy(r => r.CreatedAt).ToListAsync();

        var userIds = requests.Select(r => r.UserId).Distinct().ToList();
        var usersById = (await _db.Users.Find(Builders<UserDocument>.Filter.In(u => u.Id, userIds)).ToListAsync())
            .ToDictionary(u => u.Id);

        var list = requests.Select(r =>
        {
            usersById.TryGetValue(r.UserId, out var user);
            return new PasswordResetRequestDto
            {
                Id = r.Id,
                UserId = r.UserId,
                Username = user?.Username ?? "",
                DisplayName = user?.DisplayName ?? "",
                CreatedAt = r.CreatedAt.ToUtcIsoString(),
            };
        }).ToList();
        return Ok(list);
    }

    [HttpPut("{id:int}/approve")]
    public async Task<IActionResult> Approve(int id, [FromBody] ApprovePasswordResetRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Password))
            return BadRequest(new { message = "請輸入新密碼" });

        var request = await _db.PasswordResetRequests.Find(r => r.Id == id && r.Status == "Pending").FirstOrDefaultAsync();
        if (request is null) return NotFound();

        var hash = _hasher.Hash(req.Password);
        var user = await _db.Users.FindOneAndUpdateAsync(
            u => u.Id == request.UserId,
            Builders<UserDocument>.Update.Set(u => u.PasswordHash, hash).Inc(u => u.TokenVersion, 1),
            new FindOneAndUpdateOptions<UserDocument> { ReturnDocument = ReturnDocument.After });

        await _db.PasswordResetRequests.UpdateOneAsync(
            r => r.Id == id,
            Builders<PasswordResetRequestDocument>.Update.Set(r => r.Status, "Approved").Set(r => r.ResolvedAt, DateTime.UtcNow));

        await _audit.LogAsync(User.FindFirstValue(ClaimTypes.Name), "ApprovePasswordReset", $"核准 {user?.Username} 的忘記密碼申請並設定新密碼");
        return Ok(new { message = "已核准並更新密碼" });
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Reject(int id)
    {
        var result = await _db.PasswordResetRequests.FindOneAndUpdateAsync(
            r => r.Id == id && r.Status == "Pending",
            Builders<PasswordResetRequestDocument>.Update.Set(r => r.Status, "Rejected").Set(r => r.ResolvedAt, DateTime.UtcNow));
        if (result is null) return NotFound();

        await _audit.LogAsync(User.FindFirstValue(ClaimTypes.Name), "RejectPasswordReset", $"駁回忘記密碼申請 #{id}");
        return NoContent();
    }
}
