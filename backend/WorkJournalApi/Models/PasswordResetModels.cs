namespace WorkJournalApi.Models;

public class ForgotPasswordRequest
{
    public string Username { get; set; } = "";
}

public class PasswordResetRequestDto
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string Username { get; set; } = "";
    public string DisplayName { get; set; } = "";
    public string CreatedAt { get; set; } = "";
}

public class ApprovePasswordResetRequest
{
    public string Password { get; set; } = "";
}
