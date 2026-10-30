using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using WorkJournalApi.Auth;
using WorkJournalApi.Data;
using WorkJournalApi.Models;

namespace WorkJournalApi.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly MongoContext _db;
    private readonly PasswordHasher _hasher;
    private readonly JwtTokenService _jwt;
    private readonly AuditLogger _audit;
    private readonly DepartmentAccessService _access;

    public AuthController(MongoContext db, PasswordHasher hasher, JwtTokenService jwt, AuditLogger audit, DepartmentAccessService access)
    {
        _db = db;
        _hasher = hasher;
        _jwt = jwt;
        _audit = audit;
        _access = access;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Username) || string.IsNullOrWhiteSpace(req.Password))
            return BadRequest(new { message = "請輸入帳號密碼" });

        var user = await _db.Users.Find(u => u.Username == req.Username).FirstOrDefaultAsync();
        if (user is null)
            return Unauthorized(new { message = "帳號或密碼錯誤" });

        if (!_hasher.Verify(req.Password, user.PasswordHash))
            return Unauthorized(new { message = "帳號或密碼錯誤" });

        if (!user.IsApproved)
            return StatusCode(403, new { message = "帳號尚待管理員審核，請等待核准後再登入" });

        var departments = await _access.ResolveUserDepartmentsAsync(user);

        var token = _jwt.CreateToken(user.Id, user.Username, user.DisplayName, user.Role, user.TokenVersion);
        return Ok(new LoginResponse { Token = token, Username = user.Username, DisplayName = user.DisplayName, Role = user.Role, Departments = departments });
    }

    // One-time bootstrap: only works while the Users collection is empty.
    // Call this once after deploying to create the first (Admin) account, then it locks itself.
    // Further accounts are created via POST /api/users by a logged-in Admin.
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] LoginRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Username) || string.IsNullOrWhiteSpace(req.Password))
            return BadRequest(new { message = "請輸入帳號密碼" });

        var anyUsers = await _db.Users.Find(FilterDefinition<UserDocument>.Empty).AnyAsync();
        if (anyUsers)
            return StatusCode(403, new { message = "已存在帳號，請改用已登入的管理員帳號新增使用者" });

        var hash = _hasher.Hash(req.Password);
        try
        {
            await _db.Users.InsertOneAsync(new UserDocument
            {
                Id = await _db.NextIdAsync("users"),
                Username = req.Username,
                PasswordHash = hash,
                DisplayName = req.Username,
                Role = "Admin",
                IsApproved = true,
                TokenVersion = 1,
                CreatedAt = DateTime.UtcNow,
            });
        }
        catch (MongoWriteException ex) when (ex.IsDuplicateKey())
        {
            return StatusCode(403, new { message = "已存在帳號，請改用已登入的管理員帳號新增使用者" });
        }

        return Ok(new { message = "管理員帳號已建立，請改用 /api/auth/login 登入" });
    }

    // Public self-service signup. Always creates a "User" role account — never Admin.
    // Created as pending (IsApproved = false); an Admin must approve it before it can log in.
    [HttpPost("signup")]
    public async Task<IActionResult> Signup([FromBody] SignupRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Username) || string.IsNullOrWhiteSpace(req.Password))
            return BadRequest(new { message = "請輸入帳號密碼" });

        var displayName = string.IsNullOrWhiteSpace(req.DisplayName) ? req.Username : req.DisplayName;
        var hash = _hasher.Hash(req.Password);

        var existing = await _db.Users.Find(u => u.Username == req.Username).AnyAsync();
        if (existing)
            return Conflict(new { message = "此帳號已存在" });

        try
        {
            await _db.Users.InsertOneAsync(new UserDocument
            {
                Id = await _db.NextIdAsync("users"),
                Username = req.Username,
                PasswordHash = hash,
                DisplayName = displayName,
                Role = "User",
                IsApproved = false,
                TokenVersion = 1,
                CreatedAt = DateTime.UtcNow,
            });
        }
        catch (MongoWriteException ex) when (ex.IsDuplicateKey())
        {
            return Conflict(new { message = "此帳號已存在" });
        }

        await _audit.LogAsync(req.Username, "Signup", $"自行註冊帳號 {req.Username}");
        return Ok(new { message = "註冊成功，請等待管理員審核通過後再登入" });
    }

    // Public forgot-password request. Always returns a generic success message
    // regardless of whether the username exists, to avoid leaking which accounts
    // are registered. An Admin reviews pending requests in Settings and sets a
    // new password for the user.
    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Username))
            return BadRequest(new { message = "請輸入帳號" });

        var user = await _db.Users.Find(u => u.Username == req.Username).FirstOrDefaultAsync();
        if (user is not null)
        {
            var pendingExists = await _db.PasswordResetRequests
                .Find(r => r.UserId == user.Id && r.Status == "Pending")
                .AnyAsync();
            if (!pendingExists)
            {
                await _db.PasswordResetRequests.InsertOneAsync(new PasswordResetRequestDocument
                {
                    Id = await _db.NextIdAsync("passwordresetrequests"),
                    UserId = user.Id,
                    Status = "Pending",
                    CreatedAt = DateTime.UtcNow,
                });
            }
            await _audit.LogAsync(req.Username, "ForgotPassword", $"{req.Username} 提出忘記密碼申請");
        }

        return Ok(new { message = "已送出重設密碼申請，請等待管理員處理" });
    }
}
