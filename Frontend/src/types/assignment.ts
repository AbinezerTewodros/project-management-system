// DTOs for Project Assignment operations

export interface CreateAssignmentDto {
  projectId: number;
  employeeId: string; // Employee ID (e.g., "EMP12345")
  memberRole?: string; // Project role (e.g., "Scrum Master", "Team Leader", "Member")
  role?: string; // User's organizational role (e.g., "manager", "director", "member")
}

export interface UpdateAssignmentDto {
  memberRole?: string;
  role?: string;
}

// ✅ UPDATED: Response DTO now includes all new fields from backend
export interface AssignmentDto {
  // Assignment identification
  id: number;
  projectId: number;
  projectName: string;
  
  // User identification fields - both UUID and Employee ID
  memberId: string;              // UUID
  employeeId: string;            // ✅ NEW - Employee ID (EMP12345)
  memberFullName: string;
  memberEmail: string;           // ✅ NEW - Email address
  memberPhone: string;           // ✅ NEW - Phone number
  memberDepartment: string;      // ✅ NEW - Department (for grouping!)
  
  // Assignment details
  memberRole: string;            // Project role (Scrum Master, Team Leader, Member)
  role: string;                  // ✅ NEW - Organizational role
  status: number;                // ✅ NEW - Assignment status
  
  // Audit fields
  createdDate: string;           // ✅ NEW - When assignment was created
  updatedDate: string;           // ✅ NEW - Last update timestamp
  createUser: string;
  updateUser: string;
}

// Helper type for grouping assignments by department
export interface AssignmentsByDepartment {
  [department: string]: AssignmentDto[];
}

// Helper type for role-based filtering
export type ProjectRole = 'Scrum Master' | 'Team Leader' | 'Member';
