import { AssignmentDto, AssignmentsByDepartment, ProjectRole } from '@/types/assignment';

/**
 * Group assignments by department
 * Useful for displaying multiple Scrum Masters/Team Leaders organized by department
 */
export const groupAssignmentsByDepartment = (
  assignments: AssignmentDto[]
): AssignmentsByDepartment => {
  return assignments.reduce((acc, assignment) => {
    const dept = assignment.memberDepartment || 'Unknown Department';
    if (!acc[dept]) {
      acc[dept] = [];
    }
    acc[dept].push(assignment);
    return acc;
  }, {} as AssignmentsByDepartment);
};

/**
 * Filter assignments by project role (Scrum Master, Team Leader, Member)
 */
export const filterByProjectRole = (
  assignments: AssignmentDto[],
  role: ProjectRole
): AssignmentDto[] => {
  return assignments.filter(a => a.memberRole === role);
};

/**
 * Get all Scrum Masters for a project, grouped by department
 */
export const getScrumMastersByDepartment = (
  assignments: AssignmentDto[]
): AssignmentsByDepartment => {
  const scrumMasters = filterByProjectRole(assignments, 'Scrum Master');
  return groupAssignmentsByDepartment(scrumMasters);
};

/**
 * Get all Team Leaders for a project, grouped by department
 */
export const getTeamLeadersByDepartment = (
  assignments: AssignmentDto[]
): AssignmentsByDepartment => {
  const teamLeaders = filterByProjectRole(assignments, 'Team Leader');
  return groupAssignmentsByDepartment(teamLeaders);
};

/**
 * Get all regular members for a project, grouped by department
 */
export const getMembersByDepartment = (
  assignments: AssignmentDto[]
): AssignmentsByDepartment => {
  const members = filterByProjectRole(assignments, 'Member');
  return groupAssignmentsByDepartment(members);
};

/**
 * Format assignment for display
 */
export const formatAssignmentDisplay = (assignment: AssignmentDto): string => {
  return `${assignment.memberFullName} (${assignment.memberDepartment}) - ${assignment.memberRole}`;
};

/**
 * Get department color for UI display
 */
export const getDepartmentColor = (department: string): string => {
  const colors: Record<string, string> = {
    'Frontend': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    'Backend': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    'QA': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    'DevOps': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    'Design': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
    'Product': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  };
  
  return colors[department] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
};

/**
 * Get role badge color
 */
export const getRoleBadgeColor = (role: string): string => {
  const colors: Record<string, string> = {
    'Scrum Master': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    'Team Leader': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    'Member': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  };
  
  return colors[role] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
};

