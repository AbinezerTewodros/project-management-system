import { apiClient, handleResponse } from '@/lib/api';

export const progressRecalculationService = {
  /**
   * ✅ Recalculate ALL milestone and project progress
   * Use this once to update all existing data
   */
  recalculateAll: async (): Promise<{
    success: boolean;
    message: string;
    milestonesUpdated: number;
    projectsUpdated: number;
    totalMilestones: number;
    totalProjects: number;
  }> => {
    console.log('🔄 Calling recalculate-all API...');
    const response = await handleResponse(
      apiClient.post('/ProgressRecalculation/recalculate-all', {})
    );
    console.log('✅ Recalculate-all response:', response);
    return response;
  },

  /**
   * Recalculate progress for a specific project
   */
  recalculateProject: async (projectId: number): Promise<{
    success: boolean;
    message: string;
    milestonesUpdated: number;
  }> => {
    console.log(`🔄 Recalculating project ${projectId}...`);
    const response = await handleResponse(
      apiClient.post(`/ProgressRecalculation/recalculate-project/${projectId}`, {})
    );
    console.log(`✅ Project ${projectId} recalculated:`, response);
    return response;
  },

  /**
   * Recalculate progress for a specific milestone
   */
  recalculateMilestone: async (milestoneId: number): Promise<{
    success: boolean;
    message: string;
  }> => {
    console.log(`🔄 Recalculating milestone ${milestoneId}...`);
    const response = await handleResponse(
      apiClient.post(`/ProgressRecalculation/recalculate-milestone/${milestoneId}`, {})
    );
    console.log(`✅ Milestone ${milestoneId} recalculated:`, response);
    return response;
  }
};

