namespace WorkJournalApi.Models;

public class DepartmentDto
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
}

public class UpsertDepartmentRequest
{
    public string Name { get; set; } = "";
}

public class UserDepartmentAccessDto
{
    public int DepartmentId { get; set; }
    public string DepartmentName { get; set; } = "";
    public bool CanEdit { get; set; }
}

public class DepartmentAccessInput
{
    public int DepartmentId { get; set; }
    public bool CanEdit { get; set; } = true;
}

public class SetUserDepartmentsRequest
{
    public List<DepartmentAccessInput> Departments { get; set; } = new();
    public bool AllDepartments { get; set; }
    public bool AllDepartmentsCanEdit { get; set; }
}
