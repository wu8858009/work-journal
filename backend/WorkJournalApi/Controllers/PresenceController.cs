using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using WorkJournalApi.Data;

namespace WorkJournalApi.Controllers;

[ApiController]
[Route("api/presence")]
[Authorize]
public class PresenceController : ControllerBase
{
    // Clients ping every 10s and sign off explicitly on close, so this window only matters for
    // crashes/lost connections. It stays generous because browsers throttle timers in
    // long-hidden tabs to about once a minute, which must not read as "went offline".
    private static readonly TimeSpan OnlineWindow = TimeSpan.FromSeconds(75);

    private readonly MongoContext _db;

    public PresenceController(MongoContext db) => _db = db;

    public class HeartbeatRequest
    {
        public string? Department { get; set; }
    }

    [HttpPost("heartbeat")]
    public async Task<IActionResult> Heartbeat([FromBody] HeartbeatRequest? req)
    {
        var username = User.FindFirstValue(ClaimTypes.Name);
        if (string.IsNullOrEmpty(username)) return Unauthorized();

        var update = Builders<PresenceDocument>.Update
            .Set(p => p.DisplayName, User.FindFirstValue("displayName") ?? username)
            .Set(p => p.Role, User.FindFirstValue(ClaimTypes.Role) ?? "")
            .Set(p => p.Department, req?.Department ?? "")
            .Set(p => p.LastSeenAt, DateTime.UtcNow);
        await _db.Presence.UpdateOneAsync(p => p.Id == username, update, new UpdateOptions { IsUpsert = true });
        return NoContent();
    }

    [HttpDelete]
    public async Task<IActionResult> SignOff()
    {
        var username = User.FindFirstValue(ClaimTypes.Name);
        if (!string.IsNullOrEmpty(username))
            await _db.Presence.DeleteOneAsync(p => p.Id == username);
        return NoContent();
    }

    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetOnline()
    {
        var cutoff = DateTime.UtcNow - OnlineWindow;
        var docs = await _db.Presence.Find(p => p.LastSeenAt >= cutoff).SortBy(p => p.DisplayName).ToListAsync();
        var me = User.FindFirstValue(ClaimTypes.Name);
        return Ok(docs.Select(d => new
        {
            username = d.Id,
            displayName = d.DisplayName,
            role = d.Role,
            department = d.Department,
            lastSeenAt = DateTime.SpecifyKind(d.LastSeenAt, DateTimeKind.Utc).ToString("o"),
            isSelf = d.Id == me,
        }));
    }
}
