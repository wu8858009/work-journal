using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using WorkJournalApi.Auth;
using WorkJournalApi.Data;
using WorkJournalApi.Models;

namespace WorkJournalApi.Controllers;

[ApiController]
[Route("api/users")]
[Authorize(Roles = "Admin")]
public class UsersController : ControllerBase
{
    private readonly MongoContext _db;
    private readonly PasswordHasher _hasher;
    private readonly AuditLogger _audit;

    public UsersController(MongoContext db, PasswordHasher hasher, AuditLogger audit)
    {
        _db = db;
        _hasher = hasher;
        _audit = audit;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var users = await _db.Users.Find(FilterDefinition<UserDocument>.Empty).SortBy(u => u.CreatedAt).ToListAsync();
        var deptNameById = (await _db.Departments.Find(FilterDefinition<DepartmentDocument>.Empty).ToListAsync())
            .ToDictionary(d => d.Id, d => d.Name);

        var list = users.Select(u => new UserDto
        {
            Id = u.Id,
            Username = u.Username,
            DisplayName = u.DisplayName,
            Role = u.Role,
            IsApproved = u.IsApproved,
            CreatedAt = u.CreatedAt.ToUtcIsoString(),
            Departments = u.Departments
                .Select(ud => new UserDepartmentAccessDto
                {
                    DepartmentId = ud.DepartmentId,
                    DepartmentName = deptNameById.GetValueOrDefault(ud.DepartmentId, ""),
                    CanEdit = ud.CanEdit,
                })
                .OrderBy(d => d.DepartmentName)
                .ToList(),
        }).ToList();

        return Ok(list);
    }

    [HttpPut("{id:int}/departments")]
    public async Task<IActionResult> SetDepartments(int id, [FromBody] SetUserDepartmentsRequest req)
    {
        var user = await _db.Users.Find(u => u.Id == id).FirstOrDefaultAsync();
        if (user is null) return NotFound();

        var validDeptIds = (await _db.Departments.Find(FilterDefinition<DepartmentDocument>.Empty).Project(d => d.Id).ToListAsync()).ToHashSet();
        var newDepartments = req.Departments
            .DistinctBy(a => a.DepartmentId)
            .Where(a => validDeptIds.Contains(a.DepartmentId))
            .Select(a => new UserDepartmentAccessDocument { DepartmentId = a.DepartmentId, CanEdit = a.CanEdit })
            .ToList();

        await _db.Users.UpdateOneAsync(u => u.Id == id, Builders<UserDocument>.Update.Set(u => u.Departments, newDepartments));

        await _audit.LogAsync(User.FindFirstValue(ClaimTypes.Name), "SetUserDepartments", $"更新帳號 #{id} 的餐廳權限", departmentIds: req.Departments.Select(a => a.DepartmentId));
        return Ok(new { message = "餐廳權限已更新" });
    }

    [HttpPut("{id:int}/approve")]
    public async Task<IActionResult> Approve(int id)
    {
        var result = await _db.Users.FindOneAndUpdateAsync(
            u => u.Id == id,
            Builders<UserDocument>.Update.Set(u => u.IsApproved, true),
            new FindOneAndUpdateOptions<UserDocument> { ReturnDocument = ReturnDocument.After });
        if (result is null) return NotFound();

        await _audit.LogAsync(User.FindFirstValue(ClaimTypes.Name), "ApproveUser", $"核准帳號 {result.Username}", relatedUserId: id);
        return Ok(new { message = "已核准" });
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateUserRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Username) || string.IsNullOrWhiteSpace(req.Password))
            return BadRequest(new { message = "請輸入帳號密碼" });

        var role = req.Role == "Admin" ? "Admin" : "User";
        var displayName = string.IsNullOrWhiteSpace(req.DisplayName) ? req.Username : req.DisplayName;
        var hash = _hasher.Hash(req.Password);

        var existing = await _db.Users.Find(u => u.Username == req.Username).AnyAsync();
        if (existing) return Conflict(new { message = "此帳號已存在" });

        var departments = new List<UserDepartmentAccessDocument>();
        if (req.Departments.Count > 0)
        {
            var validDeptIds = (await _db.Departments.Find(FilterDefinition<DepartmentDocument>.Empty).Project(d => d.Id).ToListAsync()).ToHashSet();
            departments = req.Departments
                .DistinctBy(a => a.DepartmentId)
                .Where(a => validDeptIds.Contains(a.DepartmentId))
                .Select(a => new UserDepartmentAccessDocument { DepartmentId = a.DepartmentId, CanEdit = a.CanEdit })
                .ToList();
        }

        var newId = await _db.NextIdAsync("users");
        try
        {
            await _db.Users.InsertOneAsync(new UserDocument
            {
                Id = newId,
                Username = req.Username,
                PasswordHash = hash,
                DisplayName = displayName,
                Role = role,
                IsApproved = true,
                TokenVersion = 1,
                CreatedAt = DateTime.UtcNow,
                Departments = departments,
            });
        }
        catch (MongoWriteException ex) when (ex.IsDuplicateKey())
        {
            return Conflict(new { message = "此帳號已存在" });
        }

        await _audit.LogAsync(User.FindFirstValue(ClaimTypes.Name), "CreateUser", $"建立帳號 {req.Username}（角色：{role}）", departmentIds: req.Departments.Select(a => a.DepartmentId));
        return Ok(new { message = "帳號已建立", id = newId });
    }

    [HttpPut("{id:int}/password")]
    public async Task<IActionResult> ResetPassword(int id, [FromBody] ChangePasswordRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Password))
            return BadRequest(new { message = "請輸入新密碼" });

        var hash = _hasher.Hash(req.Password);
        var result = await _db.Users.FindOneAndUpdateAsync(
            u => u.Id == id,
            Builders<UserDocument>.Update.Set(u => u.PasswordHash, hash).Inc(u => u.TokenVersion, 1),
            new FindOneAndUpdateOptions<UserDocument> { ReturnDocument = ReturnDocument.After });
        if (result is null) return NotFound();

        await _audit.LogAsync(User.FindFirstValue(ClaimTypes.Name), "ResetPassword", $"重設 {result.Username} 的密碼", relatedUserId: id);
        return Ok(new { message = "密碼已更新" });
    }

    [HttpPut("{id:int}/role")]
    public async Task<IActionResult> ChangeRole(int id, [FromBody] ChangeRoleRequest req)
    {
        if (req.Role != "Admin" && req.Role != "User")
            return BadRequest(new { message = "角色必須是 Admin 或 User" });

        var user = await _db.Users.Find(u => u.Id == id).FirstOrDefaultAsync();
        if (user is null) return NotFound();

        if (user.Role == "Admin" && req.Role == "User")
        {
            var adminCount = await _db.Users.CountDocumentsAsync(u => u.Role == "Admin");
            if (adminCount <= 1)
                return BadRequest(new { message = "至少需保留一組管理員帳號" });
        }

        await _db.Users.UpdateOneAsync(
            u => u.Id == id,
            Builders<UserDocument>.Update.Set(u => u.Role, req.Role).Inc(u => u.TokenVersion, 1));

        await _audit.LogAsync(User.FindFirstValue(ClaimTypes.Name), "ChangeRole", $"將 {user.Username} 的角色從 {user.Role} 改為 {req.Role}", relatedUserId: id);
        return Ok(new { message = "角色已更新" });
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var currentUserId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        if (id == currentUserId)
            return BadRequest(new { message = "無法刪除目前登入中的帳號" });

        var user = await _db.Users.Find(u => u.Id == id).FirstOrDefaultAsync();
        if (user is null) return NotFound();

        if (user.Role == "Admin")
        {
            var adminCount = await _db.Users.CountDocumentsAsync(u => u.Role == "Admin");
            if (adminCount <= 1)
                return BadRequest(new { message = "至少需保留一組管理員帳號" });
        }

        // Department names have to be captured before the delete below, otherwise the
        // audit log would have nothing to filter on.
        var departmentNames = new List<string>();
        if (user.Departments.Count > 0)
        {
            var deptIds = user.Departments.Select(d => d.DepartmentId).ToList();
            departmentNames = await _db.Departments
                .Find(Builders<DepartmentDocument>.Filter.In(d => d.Id, deptIds))
                .SortBy(d => d.Name)
                .Project(d => d.Name)
                .ToListAsync();
        }

        await _db.PasswordResetRequests.DeleteManyAsync(r => r.UserId == id);
        await _db.Users.DeleteOneAsync(u => u.Id == id);

        await _audit.LogAsync(User.FindFirstValue(ClaimTypes.Name), "DeleteUser", $"刪除帳號 {user.Username}",
            department: departmentNames.Count > 0 ? string.Join("、", departmentNames) : null);
        return NoContent();
    }
}
