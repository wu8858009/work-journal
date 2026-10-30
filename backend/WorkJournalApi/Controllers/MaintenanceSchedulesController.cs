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
    private readonly DepartmentAccessService _access;

    public MaintenanceSchedulesController(MongoContext db, DepartmentAccessService access)
    {
        _db = db;
        _access = access;
    }

    [HttpGet("{department}")]
    public async Task<IActionResult> Get(string department)
    {
        var access = await _access.GetAccessAsync(User);
        if (access != null && !access.ContainsKey(department))
            return StatusCode(403, new { message = "您沒有這個餐廳的權限" });

        var doc = await _db.MaintenanceSchedules.Find(t => t.Id == department).FirstOrDefaultAsync();
        return Ok(new MaintenanceScheduleDto
        {
            Department = department,
            Tasks = doc?.Tasks ?? new List<MaintenanceTaskDto>(),
        });
    }

    [HttpPut("{department}")]
    public async Task<IActionResult> Update(string department, [FromBody] MaintenanceScheduleDto dto)
    {
        var access = await _access.GetAccessAsync(User);
        if (access != null && (!access.TryGetValue(department, out var canEdit) || !canEdit))
            return StatusCode(403, new { message = "您沒有這個餐廳的編輯權限" });

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
