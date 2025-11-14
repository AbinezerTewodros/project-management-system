-- ===================================================================
-- Script to Check for Users with Missing or Empty Employee IDs
-- Run this BEFORE applying the MakeEmployeeIdRequired migration
-- ===================================================================

-- 1. Count users with missing Employee IDs
SELECT 
    COUNT(*) AS UsersWithMissingEmployeeId
FROM AspNetUsers
WHERE EmployeeId IS NULL OR EmployeeId = '';

-- 2. List all users with missing Employee IDs
SELECT 
    Id,
    UserName,
    Email,
    FullName,
    EmployeeId,
    Department,
    Title,
    Company,
    CreatedDate
FROM AspNetUsers
WHERE EmployeeId IS NULL OR EmployeeId = ''
ORDER BY CreatedDate DESC;

-- 3. Count users with missing other required fields
SELECT 
    'FullName' AS Field,
    COUNT(*) AS MissingCount
FROM AspNetUsers
WHERE FullName IS NULL OR FullName = ''
UNION ALL
SELECT 
    'Department' AS Field,
    COUNT(*) AS MissingCount
FROM AspNetUsers
WHERE Department IS NULL OR Department = ''
UNION ALL
SELECT 
    'Title' AS Field,
    COUNT(*) AS MissingCount
FROM AspNetUsers
WHERE Title IS NULL OR Title = ''
UNION ALL
SELECT 
    'Company' AS Field,
    COUNT(*) AS MissingCount
FROM AspNetUsers
WHERE Company IS NULL OR Company = '';

-- 4. List ALL incomplete user records
SELECT 
    Id,
    UserName,
    Email,
    FullName,
    EmployeeId,
    Department,
    Title,
    Company,
    CASE 
        WHEN EmployeeId IS NULL OR EmployeeId = '' THEN 'Missing EmployeeId, '
        ELSE ''
    END +
    CASE 
        WHEN FullName IS NULL OR FullName = '' THEN 'Missing FullName, '
        ELSE ''
    END +
    CASE 
        WHEN Department IS NULL OR Department = '' THEN 'Missing Department, '
        ELSE ''
    END +
    CASE 
        WHEN Title IS NULL OR Title = '' THEN 'Missing Title, '
        ELSE ''
    END +
    CASE 
        WHEN Company IS NULL OR Company = '' THEN 'Missing Company'
        ELSE ''
    END AS MissingFields
FROM AspNetUsers
WHERE 
    (EmployeeId IS NULL OR EmployeeId = '')
    OR (FullName IS NULL OR FullName = '')
    OR (Department IS NULL OR Department = '')
    OR (Title IS NULL OR Title = '')
    OR (Company IS NULL OR Company = '')
ORDER BY CreatedDate DESC;

