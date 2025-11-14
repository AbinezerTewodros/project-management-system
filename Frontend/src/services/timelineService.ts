import { apiClient, ApiResponse } from '@/lib/api';

export type TimelineDto = {
  id: number;
  title: string;
  description?: string;
  startDate?: string;
  dueDate?: string;
  completedDate?: string;
  eventTime?: string;
  status?: string;
  timelineType?: string;
  eventType?: string;
  priority?: string;
  progress?: number;
  redirectUrl?: string;
  projectId?: number | null;
  color?: string;
  userId?: string;
  leadTime?: string | null; // ISO 8601 duration or "hh:mm:ss"
  cycleTime?: string | null; // ISO 8601 duration or "hh:mm:ss"
  requestVerificationDate?: string | null;
  feasibilityTestDate?: string | null;
  phases?: Array<{
    id: number;
    phaseName: string;
    duration?: string;
    phaseStartDate?: string | null;
    phaseEndDate?: string | null;
    phaseStatus?: string;
    order?: number | null;
  }>;
};

export const timelineService = {
  async getEventsByFilters(params?: {
    projectId?: number;
    startDate?: string;
    endDate?: string;
    userId?: string;
  }): Promise<TimelineDto[]> {
    try {
      // Build query string
      const queryParams = new URLSearchParams();
      if (params?.projectId != null) queryParams.set('projectId', String(params.projectId));
      if (params?.startDate) queryParams.set('startDate', params.startDate);
      if (params?.endDate) queryParams.set('endDate', params.endDate);
      if (params?.userId) queryParams.set('userId', params.userId);
      
      const queryString = queryParams.toString();
      const endpoint = `/timeline/events${queryString ? `?${queryString}` : ''}`;
      
      const response = await apiClient.get<TimelineDto[]>(endpoint);
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch timeline events');
      }
      
      return response.data;
    } catch (error: any) {
      console.error('Error fetching timeline events:', error);
      throw new Error(error.message || 'Failed to fetch timeline events');
    }
  },

  async getProjectTimeline(projectId: number): Promise<TimelineDto[]> {
    try {
      const response = await apiClient.get<TimelineDto[]>(`/timeline/projects/${projectId}`);
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch project timeline');
      }
      
      return response.data;
    } catch (error: any) {
      console.error('Error fetching project timeline:', error);
      throw new Error(error.message || 'Failed to fetch project timeline');
    }
  },
};


