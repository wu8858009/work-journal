using System.Diagnostics;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.FileProviders;
using Microsoft.IdentityModel.Tokens;
using MongoDB.Driver;
using WorkJournalApi.Auth;
using WorkJournalApi.Data;

var builder = WebApplication.CreateBuilder(args);

// Journals now embed item photos as base64 data URLs, which pushes some request bodies
// past Kestrel's ~28.6MB default well before hitting MongoDB's 16MB per-document cap.
builder.WebHost.ConfigureKestrel(o => o.Limits.MaxRequestBodySize = 64_000_000);

builder.Services.AddControllers();

builder.Services.AddSingleton<PasswordHasher>();
builder.Services.AddSingleton<JwtTokenService>();
// MongoClient is thread-safe and meant to be reused as a singleton rather than
// opened per-request the way the old SqlConnection was.
builder.Services.AddSingleton<MongoContext>();
builder.Services.AddSingleton<MongoSeeder>();
builder.Services.AddScoped<AuditLogger>();

var jwtSection = builder.Configuration.GetSection("Jwt");
var jwtKey = jwtSection["Key"] ?? throw new InvalidOperationException("Missing Jwt:Key in appsettings.json");
var jwtIssuer = jwtSection["Issuer"] ?? "WorkJournalApi";

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwtIssuer,
            ValidateAudience = false,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            ClockSkew = TimeSpan.FromMinutes(2),
        };
        // Re-check TokenVersion/IsApproved against the DB on every request so that
        // a role change, password reset, or de-approval invalidates already-issued
        // tokens immediately instead of waiting for them to expire.
        options.Events = new JwtBearerEvents
        {
            OnTokenValidated = async context =>
            {
                var principal = context.Principal!;
                var userId = int.Parse(principal.FindFirstValue(ClaimTypes.NameIdentifier)!);
                var tokenVersion = int.Parse(principal.FindFirstValue("tokenVersion") ?? "0");

                var db = context.HttpContext.RequestServices.GetRequiredService<MongoContext>();
                UserDocument? user;
                try
                {
                    user = await db.Users.Find(u => u.Id == userId).FirstOrDefaultAsync();
                }
                catch (Exception ex)
                {
                    // A transient DB hiccup (e.g. a free-tier host waking up, a brief Atlas
                    // connection blip) shouldn't log the user out on every single request that
                    // happens to land during it — the token already passed signature/expiry
                    // validation. Skip the revocation check for this one request instead of
                    // treating "couldn't check" the same as "definitely revoked".
                    context.HttpContext.RequestServices.GetRequiredService<ILogger<Program>>()
                        .LogWarning(ex, "Skipping token revocation check for user {UserId}: database unavailable", userId);
                    return;
                }
                if (user is null)
                {
                    context.Fail("帳號不存在");
                    return;
                }
                if (user.TokenVersion != tokenVersion || !user.IsApproved)
                {
                    context.Fail("登入已失效，請重新登入");
                }
            },
        };
    });

builder.Services.AddAuthorization();

var allowedOrigins = builder.Configuration.GetSection("AllowedOrigins").Get<string[]>() ?? Array.Empty<string>();
builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy => policy
        .WithOrigins(allowedOrigins)
        .AllowAnyHeader()
        .AllowAnyMethod());
});

var app = builder.Build();

await app.Services.GetRequiredService<MongoSeeder>().RunAsync();

// Also serve the static frontend from the same origin whenever the files are found next
// to this app, so there's no separate static server and no CORS to configure. This covers
// two layouts: running from source (frontend sits two folders up, in the repo root) and the
// portable single-file publish (frontend files copied next to the exe).
// A real IIS-hosted deployment has neither, so this stays a no-op there.
var candidateFrontendRoots = new[]
{
    Path.GetFullPath(Path.Combine(app.Environment.ContentRootPath, "..", "..")),
    AppContext.BaseDirectory,
};
var frontendRoot = candidateFrontendRoots.FirstOrDefault(p => File.Exists(Path.Combine(p, "index.html")));
if (frontendRoot is not null)
{
    var fileProvider = new PhysicalFileProvider(frontendRoot);
    app.UseDefaultFiles(new DefaultFilesOptions { FileProvider = fileProvider });
    app.UseStaticFiles(new StaticFileOptions { FileProvider = fileProvider });

    // Portable desktop launcher: if nothing already told Kestrel which address to bind
    // (--urls, ASPNETCORE_URLS, appsettings Urls), pick a default and open it in the
    // browser a moment after startup — so double-clicking the exe just works.
    if (string.IsNullOrEmpty(builder.Configuration["urls"]))
    {
        const string defaultUrl = "http://localhost:5080";
        app.Urls.Add(defaultUrl);

        // The WorkJournalDesktop shell launches this exe itself and shows the app in its
        // own WebView2 window, so it sets this to skip opening a second, redundant browser tab.
        var skipAutoLaunch = Environment.GetEnvironmentVariable("WORKJOURNAL_NO_AUTOLAUNCH") == "1";
        if (!skipAutoLaunch)
        {
            _ = Task.Run(async () =>
            {
                await Task.Delay(1200);
                try { Process.Start(new ProcessStartInfo(defaultUrl) { UseShellExecute = true }); }
                catch { /* no desktop session or no default browser — ignore */ }
            });
        }
    }
}

app.UseCors("Frontend");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
