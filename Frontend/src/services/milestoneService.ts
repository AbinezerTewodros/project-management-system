import { apiClient } from '@/lib/api';

export interface Milestone {
    milestoneId: number;
    milestoneName: string;
    description: string;
    assignedMemberId: string;
    dueDate: string;
    weight: number;
    status: 'Pending' | 'Planning' | 'InProgress' | 'OnHold' | 'Completed' | 'Cancelled';
    projectId: number;
    createdAt: string;
    updatedAt?: string;
    progress: number;
    startDate?: string;
}

export interface CreateMilestoneRequest {
    milestoneName: string;
    description?: string; // ✅ Make optional to match backend DTO
    assignedMemberId?: string; // ✅ Make optional to match backend DTO
    dueDate: string;
    weight?: number; // ✅ Make optional with default value
    projectId: number;
    startDate: string; // Required field
    status?: 'Pending' | 'Planning' | 'InProgress' | 'OnHold' | 'Completed' | 'Cancelled'; // ✅ Make optional with default
}

export interface UpdateMilestoneRequest {
    milestoneId: number;
    milestoneName?: string;
    description?: string;
    assignedMemberId?: string;
    dueDate?: string;
    weight?: number;
    status?: 'Pending' | 'Planning' | 'InProgress' | 'OnHold' | 'Completed' | 'Cancelled';
    progress?: number;
}

export interface MilestoneProgress {
    milestoneId: number;
    progress: number;
}

export interface ValidateMilestoneDatesRequest {
    milestoneId?: number;
    taskStartDate?: string;
    taskDueDate?: string;
}

export class MilestoneService {
    async getAllMilestones() {
        return apiClient.get<Milestone[]>('/Milestone');
    }

    async getMilestoneById(id: number) {
        return apiClient.get<Milestone>(`/Milestone/${id}`);
    }

    async getMilestonesByProjectId(projectId: number) {
        return apiClient.get<Milestone[]>(`/Milestone/project/${projectId}`);
    }
 
    async createMilestone(milestoneData: CreateMilestoneRequest) {
        return apiClient.post<Milestone>('/Milestone/create-milestone', milestoneData);
    }

    async updateMilestone(id: number, milestoneData: UpdateMilestoneRequest) {
        return apiClient.put<Milestone>(`/Milestone/${id}`, milestoneData);
    }

    async deleteMilestone(id: number) {
        return apiClient.delete(`/Milestone/${id}`);
    }

    async getMilestoneProgress(milestoneId: number) {
        return apiClient.get<number>(`/Milestone/${milestoneId}/progress`);
    }

    async validateMilestoneDates(validationData: ValidateMilestoneDatesRequest) {
        // OpenAPI: POST /api/ProjectTask/validate-milestone-dates
        return apiClient.post('/ProjectTask/validate-milestone-dates', validationData);
    }

    // ✅ Accept milestone assignment
    async acceptMilestoneAssignment(milestoneId: number) {
        console.log('🎯 MilestoneService.acceptMilestoneAssignment called');
        console.log('🎯 Milestone ID:', milestoneId, 'Type:', typeof milestoneId);
        console.log('🎯 API Endpoint:', `/Milestone/${milestoneId}/accept-assignment`);
        console.log('🎯 Request body:', {});
        
        const response = await apiClient.put(`/Milestone/${milestoneId}/accept-assignment`, {});
        
        console.log('🎯 Service response:', response);
        console.log('🎯 Response success:', response.success);
        console.log('🎯 Response status:', response.status);
        console.log('🎯 Response data:', response.data);
        
        return response;
    }

    // ✅ Reject milestone assignment
    async rejectMilestoneAssignment(milestoneId: number, reason: string) {
        console.log('🎯 MilestoneService.rejectMilestoneAssignment called');
        console.log('🎯 Milestone ID:', milestoneId);
        console.log('🎯 Rejection reason:', reason);
        console.log('🎯 API Endpoint:', `/Milestone/${milestoneId}/reject-assignment`);
        
        // ✅ Send reason as JSON string in the body
        const response = await apiClient.put(`/Milestone/${milestoneId}/reject-assignment`, JSON.stringify(reason), {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('🎯 Service response:', response);
        return response;
    }
}

export const milestoneService = new MilestoneService();
