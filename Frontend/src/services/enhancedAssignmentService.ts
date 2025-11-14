import { apiClient } from '@/lib/api';
import {
  CreateEnhancedAssignmentDto,
  UpdateEnhancedAssignmentDto as UpdateAssignmentDto,
  ReassignmentRequestDto,
} from '@/types/assignment';

// Enhanced Assignment endpoints (/api/EnhancedAssignment...)
// POST    /api/EnhancedAssignment
// PUT     /api/EnhancedAssignment/{assignmentId}
// DELETE  /api/EnhancedAssignment/{assignmentId}
// GET     /api/EnhancedAssignment/{assignmentId}
// GET     /api/EnhancedAssignment/project/{projectId}
// GET     /api/EnhancedAssignment/project/{projectId}/scrum-masters
// GET     /api/EnhancedAssignment/project/{projectId}/multiple-scrum-masters
// POST    /api/EnhancedAssignment/project/{projectId}/set-primary-scrum-master  (body: string memberId)
// POST    /api/EnhancedAssignment/project/{projectId}/add-scrum-master (AddScrumMasterRequest)
// DELETE  /api/EnhancedAssignment/project/{projectId}/remove-scrum-master/{memberId}
// GET     /api/EnhancedAssignment/availability/{memberId}
// GET     /api/EnhancedAssignment/availability
// GET     /api/EnhancedAssignment/project/{projectId}/available-members?requiredWorkload=
// GET     /api/EnhancedAssignment/availability/check/{memberId}?requiredWorkload=
// POST    /api/EnhancedAssignment/reassign (ReassignmentRequestDto)
// GET     /api/EnhancedAssignment/reassignment-history/{memberId}
// GET     /api/EnhancedAssignment/workload/{memberId}
// GET     /api/EnhancedAssignment/workload/{memberId}/projects

// DTO interfaces now imported from '@/types/assignment'

export class EnhancedAssignmentService {
  create(dto: CreateEnhancedAssignmentDto) {
    return apiClient.post('/EnhancedAssignment', dto);
  }
  update(assignmentId: number, dto: UpdateAssignmentDto) {
    return apiClient.put(`/EnhancedAssignment/${assignmentId}`, dto);
  }
  delete(assignmentId: number) {
    return apiClient.delete(`/EnhancedAssignment/${assignmentId}`);
  }
  getById(assignmentId: number) {
    return apiClient.get(`/EnhancedAssignment/${assignmentId}`);
  }
  getByProject(projectId: number) {
    return apiClient.get(`/EnhancedAssignment/project/${projectId}`);
  }
  getScrumMasters(projectId: number) {
    return apiClient.get(`/EnhancedAssignment/project/${projectId}/scrum-masters`);
  }
  getMultipleScrumMasters(projectId: number) {
    return apiClient.get(`/EnhancedAssignment/project/${projectId}/multiple-scrum-masters`);
  }
  setPrimaryScrumMaster(projectId: number, memberId: string) {
    return apiClient.post(`/EnhancedAssignment/project/${projectId}/set-primary-scrum-master`, memberId);
  }
  addScrumMaster(projectId: number, payload: { memberId: string; isPrimary: boolean }) {
    return apiClient.post(`/EnhancedAssignment/project/${projectId}/add-scrum-master`, payload);
  }
  removeScrumMaster(projectId: number, memberId: string) {
    return apiClient.delete(`/EnhancedAssignment/project/${projectId}/remove-scrum-master/${memberId}`);
  }
  getAvailability(memberId: string) {
    return apiClient.get(`/EnhancedAssignment/availability/${memberId}`);
  }
  listAvailability() {
    return apiClient.get('/EnhancedAssignment/availability');
  }
  getAvailableMembers(projectId: number, requiredWorkload = 100) {
    return apiClient.get(`/EnhancedAssignment/project/${projectId}/available-members?requiredWorkload=${requiredWorkload}`);
  }
  checkMemberAvailability(memberId: string, requiredWorkload?: number) {
    const suffix = requiredWorkload != null ? `?requiredWorkload=${requiredWorkload}` : '';
    return apiClient.get(`/EnhancedAssignment/availability/check/${memberId}${suffix}`);
  }
  reassign(dto: ReassignmentRequestDto) {
    return apiClient.post('/EnhancedAssignment/reassign', dto);
  }
  getReassignmentHistory(memberId: string) {
    return apiClient.get(`/EnhancedAssignment/reassignment-history/${memberId}`);
  }
  getWorkload(memberId: string) {
    return apiClient.get(`/EnhancedAssignment/workload/${memberId}`);
  }
  getWorkloadProjects(memberId: string) {
    return apiClient.get(`/EnhancedAssignment/workload/${memberId}/projects`);
  }
}

export const enhancedAssignmentService = new EnhancedAssignmentService();
