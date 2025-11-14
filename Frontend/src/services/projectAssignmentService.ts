import { apiClient } from '@/lib/api';
import { CreateAssignmentDto, UpdateAssignmentDto } from '@/types/assignment';

// Service wrapping /api/ProjectAssignment endpoints per OpenAPI spec
// Endpoints:
// GET    /api/ProjectAssignment/All-members?projectId=...
// GET    /api/ProjectAssignment/User-projects?employeeId=...
// POST   /api/ProjectAssignment/Add-members
// PUT    /api/ProjectAssignment/edit-role
// PUT    /api/ProjectAssignment/{id}/approve
// PUT    /api/ProjectAssignment/{id}/reject (body: string reason)
// DELETE /api/ProjectAssignment/delete-member  (spec uses body UpdateAssignmentDto; legacy UI used query params)

// NOTE: DTO interfaces centralized in '@/types/assignment'

export class ProjectAssignmentService {
  getProjectMembers(projectId: number) {
    return apiClient.get(`/ProjectAssignment/All-members?projectId=${projectId}`);
  }

  getUserProjects(employeeId: string) {
    return apiClient.get(`/ProjectAssignment/User-projects?employeeId=${employeeId}`);
  }

  addMembers(dto: CreateAssignmentDto) {
    return apiClient.post('/ProjectAssignment/Add-members', dto);
  }

  editRole(dto: UpdateAssignmentDto) {
    return apiClient.put('/ProjectAssignment/edit-role', dto);
  }

  approve(assignmentId: number) {
    return apiClient.put(`/ProjectAssignment/${assignmentId}/approve`);
  }

  reject(assignmentId: number, reason: string) {
    // OpenAPI shows string body
    return apiClient.put(`/ProjectAssignment/${assignmentId}/reject`, reason);
  }

  deleteMember(dto: UpdateAssignmentDto) {
    // Use DELETE with JSON body via axios config (apiClient.delete supports config)
    return apiClient.delete(`/ProjectAssignment/delete-member`, { data: dto });
  }
}

export const projectAssignmentService = new ProjectAssignmentService();
