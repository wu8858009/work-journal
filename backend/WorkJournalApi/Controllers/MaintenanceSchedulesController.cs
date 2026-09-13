using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using WorkJournalApi.Data;
using WorkJournalApi.Models;

namespace WorkJournalApi.Controllers;

[ApiController]
[Route("api/maintenance-schedules")]
[Authorize]
public class MaintenanceSchedulesController : ControllerBase
{
    private readonly MongoContext _db;

    public MaintenanceSchedulesController(MongoContext db)
    {
        _db = db;
    }

    [HttpGet("{department}")]
    public async Task<IActionResult> Get(string department)
    {
        var doc = await _db.MaintenanceSchedules.Find(t => t.Id == department).FirstOrDefaultAsync();
        return Ok(new MaintenanceScheduleDto
        {
            Department = department,
            Tasks = doc?.Tasks ?? new List<MaintenanceTaskDto>(),
        });
    }

    [HttpPut("{department}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(string department, [FromBody] MaintenanceScheduleDto dto)
    {
        foreach (var task in dto.Tasks)
        {
            if (string.IsNullOrWhiteSpace(task.Id)) task.Id = Guid.NewGuid().ToString();
        }

        var update = Builders<MaintenanceScheduleDocument>.Update
            .Set(t => t.Department, department)
            .Set(t => t.Tasks, dto.Tasks);
        await _db.MaintenanceSchedules.UpdateOneAsync(t => t.Id == department, update, new UpdateOptions { IsUpsert = true });

        dto.Department = department;
        return Ok(dto);
    }
}
