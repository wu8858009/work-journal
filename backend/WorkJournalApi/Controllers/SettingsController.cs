using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using WorkJournalApi.Data;
using WorkJournalApi.Models;

namespace WorkJournalApi.Controllers;

[ApiController]
[Route("api/settings")]
[Authorize]
public class SettingsController : ControllerBase
{
    private readonly MongoContext _db;

    public SettingsController(MongoContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var doc = await _db.AppSettings.Find(s => s.Id == 1).FirstOrDefaultAsync();
        if (doc is null) return Ok(new SettingsDto());

        return Ok(new SettingsDto { CompanyName = doc.CompanyName, DefaultDepartment = doc.DefaultDepartment });
    }

    [HttpPut]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update([FromBody] SettingsDto dto)
    {
        var update = Builders<AppSettingsDocument>.Update
            .Set(s => s.CompanyName, dto.CompanyName ?? "")
            .Set(s => s.DefaultDepartment, dto.DefaultDepartment ?? "");
        await _db.AppSettings.UpdateOneAsync(s => s.Id == 1, update, new UpdateOptions { IsUpsert = true });

        return Ok(dto);
    }
}
