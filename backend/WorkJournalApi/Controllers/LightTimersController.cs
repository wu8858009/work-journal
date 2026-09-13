using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using WorkJournalApi.Data;
using WorkJournalApi.Models;

namespace WorkJournalApi.Controllers;

[ApiController]
[Route("api/light-timers")]
[Authorize]
public class LightTimersController : ControllerBase
{
    private readonly MongoContext _db;

    public LightTimersController(MongoContext db)
    {
        _db = db;
    }

    [HttpGet("{department}")]
    public async Task<IActionResult> Get(string department)
    {
        var doc = await _db.LightTimers.Find(t => t.Id == department).FirstOrDefaultAsync();
        return Ok(new LightTimerTableDto
        {
            Department = department,
            Rows = doc?.Rows ?? new List<LightTimerRowDto>(),
        });
    }

    [HttpPut("{department}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(string department, [FromBody] LightTimerTableDto dto)
    {
        foreach (var row in dto.Rows)
        {
            if (string.IsNullOrWhiteSpace(row.Id)) row.Id = Guid.NewGuid().ToString();
        }

        var update = Builders<LightTimerDocument>.Update
            .Set(t => t.Department, department)
            .Set(t => t.Rows, dto.Rows);
        await _db.LightTimers.UpdateOneAsync(t => t.Id == department, update, new UpdateOptions { IsUpsert = true });

        dto.Department = department;
        return Ok(dto);
    }
}
