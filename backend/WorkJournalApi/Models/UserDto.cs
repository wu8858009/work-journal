namespace WorkJournalApi.Models;

public class UserDto
{
    public int Id { get; set; }
    public string Username { get; set; } = "";
    public string DisplayName { get; set; } = "";
    public string Role { get; set; } = "";
    public bool IsApproved { get; set; }
    public string CreatedAt { get; set; } = "";
    public List<UserDepartmentAccessDto> Departments { get; set; } = new();
}

public class CreateUserRequest
{
    public string Username { get; set; } = "";
    public string Password { get; set; } = "";
    public string DisplayName { get; set; } = "";
    public string Role { get; set; } = "User";
    public List<DepartmentAccessInput> Departments { get; set; } = new();
}

public class ChangePasswordRequest
{
    public string Password { get; set; } = "";
}

public class ChangeRoleRequest
{
    public string Role { get; set; } = "";
}
