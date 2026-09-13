-- 工作週誌 後端資料庫 預設資料（Seed Data）
-- 用途：全新資料庫第一次建立後，補上「至少一組可登入的管理員帳號」，
--       讓系統一開始就能正常登入，不必額外呼叫 /api/auth/register。
-- 用法：先執行 schema.sql 建好所有資料表，再執行本檔案。
--       sqlcmd -S 你的伺服器 -E -i seed.sql -f 65001
--
-- 各資料表預設資料涵蓋範圍：
--   AppSettings、Departments：schema.sql 本身已經會自動補上預設值，這裡不重複處理。
--   Journals、AuditLogs、PasswordResetRequests：這三個表沒有「必要」的預設資料，
--       都是系統執行過程中才會產生的紀錄，保持空表即可，故不在此檔案處理。
--   Users、UserDepartments：本檔案負責補上，見下方。
--
-- 重要：密碼絕對不會、也不能用明文存進資料庫。下面帳號的密碼雜湊值是
--       用系統實際的雜湊演算法（PBKDF2-SHA256，10 萬次疊代）預先算好的，
--       格式為 {疊代次數}.{鹽值Base64}.{雜湊值Base64}，對應原始密碼是：
--
--           帳號：admin
--           密碼：Admin@2026Init
--
--       請務必在第一次登入後，立刻到「設定」頁把密碼改掉。

USE WorkJournalDb;
GO

-- 只在 Users 資料表完全是空的時候才建立這組預設管理員，
-- 避免覆蓋掉正式環境裡已經存在的真實帳號。
IF NOT EXISTS (SELECT * FROM Users)
BEGIN
    INSERT INTO Users (Username, PasswordHash, DisplayName, Role, IsApproved, TokenVersion)
    VALUES (
        N'admin',
        N'100000.nzwYm05lGw0GjuRSmo/fTQ==.Du+TEbYJR+tfCLtiS2oXqPcd9t+PGuMVioCu7+9Ips0=',
        N'系統管理員',
        'Admin',
        1,
        1
    );
END
GO

-- 把這組預設管理員指派到目前所有已存在的餐廳（部門），並給予可編輯權限，
-- 避免上線後被鎖在自己的帳號外面。schema.sql 執行到這裡時，Departments
-- 至少會有 AppSettings 預設部門那一筆。
INSERT INTO UserDepartments (UserId, DepartmentId, CanEdit)
SELECT u.Id, d.Id, 1
FROM Users u
CROSS JOIN Departments d
WHERE u.Username = N'admin'
  AND NOT EXISTS (SELECT 1 FROM UserDepartments ud WHERE ud.UserId = u.Id AND ud.DepartmentId = d.Id);
GO
