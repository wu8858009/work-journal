using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using WorkJournalApi.Data;
using WorkJournalApi.Models;

namespace WorkJournalApi.Controllers;

[ApiController]
[Route("api/audit-logs")]
[Authorize(Roles = "Admin")]
public class AuditLogsController : ControllerBase
{
    private readonly MongoContext _db;

    public AuditLogsController(MongoContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var docs = await _db.AuditLogs.Find(FilterDefinition<AuditLogDocument>.Empty)
            .SortByDescending(l => l.Id)
            .Limit(100)
            .ToListAsync();

        var list = docs.Select(l => new AuditLogDto
        {
            Id = l.Id,
            ActorUsername = l.ActorUsername,
            Action = l.Action,
            TargetDescription = l.TargetDescription,
            Department = l.Department,
            CreatedAt = l.CreatedAt.ToUtcIsoString(),
        }).ToList();
        return Ok(list);
    }
}
