-- ===================================================================
-- VERIFICATION SCRIPT - Run After Migration
-- Confirms all users have Employee IDs
-- ===================================================================

PRINT '========================================';
PRINT 'EMPLOYEE ID VERIFICATION REPORT';
PRINT '========================================';
PRINT '';

-- 1. Total user count
DECLARE @TotalUsers INT;
SELECT @TotalUsers = COUNT(*) FROM AspNetUsers;
PRINT 'Total Users in System: ' + CAST(@TotalUsers AS VARCHAR(10));
PRINT '';

-- 2. Users with Employee IDs
DECLARE @UsersWithEmployeeId INT;
SELECT @UsersWithEmployeeId = COUNT(*) 
FROM AspNetUsers 
WHERE EmployeeId IS NOT NULL AND EmployeeId != '';
PRINT 'Users WITH Employee ID: ' + CAST(@UsersWithEmployeeId AS VARCHAR(10));

-- 3. Users WITHOUT Employee IDs (should be 0)
DECLARE @UsersWithoutEmployeeId INT;
SELECT @UsersWithoutEmployeeId = COUNT(*) 
FROM AspNetUsers 
WHERE EmployeeId IS NULL OR EmployeeId = '';
PRINT 'Users WITHOUT Employee ID: ' + CAST(@UsersWithoutEmployeeId AS VARCHAR(10));
PRINT '';

-- 4. Validation Result
IF @UsersWithoutEmployeeId = 0
BEGIN
    PRINT '✅ SUCCESS: All users have Employee IDs!';
END
ELSE
BEGIN
    PRINT '❌ WARNING: Some users are missing Employee IDs!';
    PRINT 'Run the following to see details:';
    PRINT 'SELECT * FROM AspNetUsers WHERE EmployeeId IS NULL OR EmployeeId = ''''';
END
PRINT '';

-- 5. Sample of auto-generated Employee IDs
PRINT '========================================';
PRINT 'SAMPLE OF AUTO-GENERATED EMPLOYEE IDs:';
PRINT '========================================';
SELECT TOP 10
    Id,
    UserName,
    EmployeeId,
    FullName,
    Department,
    CreatedDate
FROM AspNetUsers
WHERE EmployeeId LIKE 'EMP-%'
ORDER BY CreatedDate DESC;
PRINT '';

-- 6. Summary Statistics
PRINT '========================================';
PRINT 'EMPLOYEE ID FORMAT BREAKDOWN:';
PRINT '========================================';
SELECT 
    CASE 
        WHEN EmployeeId LIKE 'EMP-%' THEN 'Auto-Generated (EMP-xxx)'
        ELSE 'Custom Format'
    END AS EmployeeIdType,
    COUNT(*) AS Count
FROM AspNetUsers
GROUP BY 
    CASE 
        WHEN EmployeeId LIKE 'EMP-%' THEN 'Auto-Generated (EMP-xxx)'
        ELSE 'Custom Format'
    END;

PRINT '';
PRINT '========================================';
PRINT 'VERIFICATION COMPLETE';
PRINT '========================================';

