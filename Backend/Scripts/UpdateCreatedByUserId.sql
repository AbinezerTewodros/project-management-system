-- ============================================
-- Script to Update CreatedByUserId for Existing Tasks
-- ============================================
-- Purpose: Set CreatedByUserId for tasks that were created before this field existed

-- OPTION 1: Set creator to the assigned member (most logical)
-- This assumes the person assigned to the task is also the one who created it
UPDATE ProjectTasks 
SET CreatedByUserId = AssignedMemberId
WHERE CreatedByUserId IS NULL 
  AND AssignedMemberId IS NOT NULL;

-- OPTION 2: Set creator to a specific user (your user ID)
-- Use this if you want to claim all unassigned tasks as yours
-- Replace 'YOUR-USER-ID-HERE' with your actual user ID
-- UPDATE ProjectTasks 
-- SET CreatedByUserId = '91506b85-3009-4cd1-9189-d51ac31421b3'
-- WHERE CreatedByUserId IS NULL;

-- OPTION 3: Set creator based on ProjectAssignment ownership
-- This sets the creator to the member who has the project assignment
UPDATE PT
SET PT.CreatedByUserId = PA.MemberId
FROM ProjectTasks PT
INNER JOIN ProjectAssignments PA ON PT.ProjectAssignmentId = PA.Id
WHERE PT.CreatedByUserId IS NULL
  AND PA.MemberId IS NOT NULL;

-- Verify the update
SELECT 
    Id,
    Title,
    AssignedMemberId,
    CreatedByUserId,
    ProjectAssignmentId,
    CreatedAt
FROM ProjectTasks
WHERE CreatedByUserId IS NULL
ORDER BY CreatedAt DESC;

-- Expected result: Should return 0 rows if all tasks now have a creator

