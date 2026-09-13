-- 工作週誌 後端資料庫 Schema
-- 適用：SQL Server 2014 (MSSQL 2014)
-- 用法：先建立資料庫 WorkJournalDb，再執行本腳本建立資料表。
-- 若用 sqlcmd 執行本檔，務必加上 -f 65001（UTF-8），否則內含的中文預設值會變成亂碼，例如：
--   sqlcmd -S 你的伺服器 -E -i schema.sql -f 65001

IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'WorkJournalDb')
BEGIN
    CREATE DATABASE WorkJournalDb;
END
GO

USE WorkJournalDb;
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Users')
BEGIN
    CREATE TABLE Users (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Username NVARCHAR(50) NOT NULL,
        PasswordHash NVARCHAR(256) NOT NULL,
        DisplayName NVARCHAR(100) NOT NULL,
        Role NVARCHAR(20) NOT NULL DEFAULT 'User',
        IsApproved BIT NOT NULL DEFAULT 1,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT UQ_Users_Username UNIQUE (Username),
        CONSTRAINT CK_Users_Role CHECK (Role IN ('Admin', 'User'))
    );
END
GO

-- 升級既有資料庫：補上 Role 欄位（若是舊版已建立的 Users 表）
IF NOT EXISTS (SELECT * FROM sys.columns WHERE Name = 'Role' AND Object_ID = Object_ID('Users'))
BEGIN
    ALTER TABLE Users ADD Role NVARCHAR(20) NOT NULL DEFAULT 'User';
END
GO

-- 升級既有資料庫：補上 IsApproved 欄位（自行註冊的一般使用者需管理員核准才能登入）
IF NOT EXISTS (SELECT * FROM sys.columns WHERE Name = 'IsApproved' AND Object_ID = Object_ID('Users'))
BEGIN
    ALTER TABLE Users ADD IsApproved BIT NOT NULL DEFAULT 1;
END
GO

-- 確保至少有一組管理員（例如 Role 欄位是後補的情況，將最早建立的帳號設為管理員）
IF EXISTS (SELECT * FROM Users) AND NOT EXISTS (SELECT * FROM Users WHERE Role = 'Admin')
BEGIN
    UPDATE Users SET Role = 'Admin' WHERE Id = (SELECT MIN(Id) FROM Users);
END
GO

-- 升級既有資料庫：補上 TokenVersion 欄位（角色變更/密碼重設時遞增，讓舊登入立即失效）
IF NOT EXISTS (SELECT * FROM sys.columns WHERE Name = 'TokenVersion' AND Object_ID = Object_ID('Users'))
BEGIN
    ALTER TABLE Users ADD TokenVersion INT NOT NULL DEFAULT 1;
END
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PasswordResetRequests')
BEGIN
    CREATE TABLE PasswordResetRequests (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        UserId INT NOT NULL,
        Status NVARCHAR(20) NOT NULL DEFAULT 'Pending',
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        ResolvedAt DATETIME2 NULL,
        CONSTRAINT FK_PasswordResetRequests_Users FOREIGN KEY (UserId) REFERENCES Users(Id),
        CONSTRAINT CK_PasswordResetRequests_Status CHECK (Status IN ('Pending', 'Approved', 'Rejected'))
    );
END
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'AuditLogs')
BEGIN
    CREATE TABLE AuditLogs (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        ActorUsername NVARCHAR(50) NULL,
        Action NVARCHAR(50) NOT NULL,
        TargetDescription NVARCHAR(200) NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
END
GO

-- 升級既有資料庫：補上 Department 欄位（記錄該筆操作紀錄關聯的餐廳，供設定頁依餐廳篩選操作紀錄；
-- 可能是多間餐廳以「、」分隔，不涉及特定餐廳的操作則維持 NULL）
IF NOT EXISTS (SELECT * FROM sys.columns WHERE Name = 'Department' AND Object_ID = Object_ID('AuditLogs'))
BEGIN
    ALTER TABLE AuditLogs ADD Department NVARCHAR(400) NULL;
END
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Journals')
BEGIN
    CREATE TABLE Journals (
        Id UNIQUEIDENTIFIER PRIMARY KEY,
        Department NVARCHAR(100) NOT NULL,
        PeriodStart DATE NOT NULL,
        PeriodEnd DATE NOT NULL,
        CategoriesJson NVARCHAR(MAX) NOT NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        UpdatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
END
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'AppSettings')
BEGIN
    CREATE TABLE AppSettings (
        Id INT PRIMARY KEY CHECK (Id = 1),
        CompanyName NVARCHAR(200) NOT NULL,
        DefaultDepartment NVARCHAR(100) NOT NULL
    );
END
GO

-- 預設公司設定（與舊版前端 localStorage 預設值一致），可日後在「設定」頁修改
IF NOT EXISTS (SELECT * FROM AppSettings WHERE Id = 1)
BEGIN
    INSERT INTO AppSettings (Id, CompanyName, DefaultDepartment)
    VALUES (1, N'水灣企業股份有限公司', N'碧潭工程');
END
GO

-- 尚未建立任何帳號時，請呼叫一次 POST /api/auth/register {"username":"...","password":"..."}
-- 建立第一組「管理員」帳號；該端點在 Users 資料表已有資料後會自動關閉。
-- 之後新增帳號請改用已登入管理員呼叫 POST /api/users。

-- 餐廳（沿用「部門」概念，改為可由管理員維護的清單，供登入畫面下拉選擇）
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Departments')
BEGIN
    CREATE TABLE Departments (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Name NVARCHAR(100) NOT NULL,
        CONSTRAINT UQ_Departments_Name UNIQUE (Name)
    );
END
GO

-- 帳號可對應多間餐廳（多對多）
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'UserDepartments')
BEGIN
    CREATE TABLE UserDepartments (
        UserId INT NOT NULL,
        DepartmentId INT NOT NULL,
        CONSTRAINT PK_UserDepartments PRIMARY KEY (UserId, DepartmentId),
        CONSTRAINT FK_UserDepartments_Users FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE,
        CONSTRAINT FK_UserDepartments_Departments FOREIGN KEY (DepartmentId) REFERENCES Departments(Id) ON DELETE CASCADE
    );
END
GO

-- 遷移既有資料：把目前用過的部門名稱（AppSettings 預設部門 + 各週誌曾使用過的部門）
-- 灌進 Departments 清單，讓餐廳下拉選單一開始就不是空的。
INSERT INTO Departments (Name)
SELECT DISTINCT d.Name FROM (
    SELECT DefaultDepartment AS Name FROM AppSettings WHERE Id = 1 AND LEN(DefaultDepartment) > 0
    UNION
    SELECT DISTINCT Department AS Name FROM Journals WHERE LEN(Department) > 0
) d
WHERE NOT EXISTS (SELECT 1 FROM Departments WHERE Name = d.Name);
GO

-- 遷移既有資料：既有管理員帳號在功能上線當下，先指派全部餐廳，避免上線後被鎖在自己的帳號外。
-- 之後請於「設定」頁依實際需求調整每個帳號可存取的餐廳。
INSERT INTO UserDepartments (UserId, DepartmentId)
SELECT u.Id, d.Id
FROM Users u
CROSS JOIN Departments d
WHERE u.Role = 'Admin'
  AND NOT EXISTS (SELECT 1 FROM UserDepartments ud WHERE ud.UserId = u.Id AND ud.DepartmentId = d.Id);
GO

-- 升級既有資料庫：每個帳號對每間餐廳可分別設定「可編輯」或「僅能查看」（預設可編輯，不影響既有帳號的既有權限）。
IF NOT EXISTS (SELECT * FROM sys.columns WHERE Name = 'CanEdit' AND Object_ID = Object_ID('UserDepartments'))
BEGIN
    ALTER TABLE UserDepartments ADD CanEdit BIT NOT NULL DEFAULT 1;
END
GO
