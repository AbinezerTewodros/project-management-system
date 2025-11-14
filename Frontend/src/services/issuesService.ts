import { apiClient, ApiResponse } from '@/lib/api';
import {
  IssueCreateDto,
  IssueReadDto,
  IssueUpdateDto,
  IssueReportDto,
  PaginatedResult,
  IssueStatus,
  IssuePriority,
} from '@/types/taskTypes';

// ======================================================================================
// Helper function to extract data from ApiResponse
// ======================================================================================
async function handleResponse<T>(promise: Promise<ApiResponse<T>>): Promise<T> {
  const response = await promise;
  if (response.success && response.data !== null) {
    return response.data;
  } else {
    throw new Error(response.message || 'API request failed');
  }
}

async function handleVoidResponse(promise: Promise<ApiResponse<void>>): Promise<void> {
    const response = await promise;
    if (!response.success) {
        throw new Error(response.message || 'API request failed');
    }
}

// ======================================================================================
// Issues Service
// ======================================================================================

export const issuesService = {
  /**
   * Creates a new issue.
   * @param payload - The data for creating the issue.
   * @returns A promise that resolves to the created issue.
   */
  create: (payload: IssueCreateDto): Promise<IssueReadDto> => {
    return handleResponse(apiClient.post<IssueReadDto>('/api/Issues', payload));
  },

  /**
   * Retrieves a paginated list of all issues.
   * @param pageNumber - The page number to retrieve.
   * @param pageSize - The number of items per page.
   * @returns A promise that resolves to a paginated list of issues.
   */
  list: (pageNumber: number = 1, pageSize: number = 10): Promise<PaginatedResult<IssueReadDto>> => {
    return handleResponse(apiClient.get<PaginatedResult<IssueReadDto>>(`/api/Issues?pageNumber=${pageNumber}&pageSize=${pageSize}`));
  },

  /**
   * Retrieves a single issue by its ID.
   * @param issueId - The ID of the issue.
   * @returns A promise that resolves to the issue data.
   */
  get: (issueId: number): Promise<IssueReadDto> => {
    return handleResponse(apiClient.get<IssueReadDto>(`/api/Issues/${issueId}`));
  },

  /**
   * Updates an existing issue.
   * @param issueId - The ID of the issue to update.
   * @param payload - The data for updating the issue.
   * @returns A promise that resolves to the updated issue.
   */
  update: (issueId: number, payload: IssueUpdateDto): Promise<IssueReadDto> => {
    return handleResponse(apiClient.patch<IssueReadDto>(`/api/Issues/${issueId}`, payload));
  },

  /**
   * Deletes an issue by its ID.
   * @param issueId - The ID of the issue to delete.
   * @returns A promise that resolves when the issue is deleted.
   */
  delete: (issueId: number): Promise<void> => {
    return handleVoidResponse(apiClient.delete<void>(`/api/Issues/${issueId}`));
  },

  /**
   * Searches for issues based on a set of criteria.
   * @param params - The search parameters.
   * @returns A promise that resolves to a list of matching issues.
   */
  search: (params: {
    keyword?: string;
    status?: IssueStatus;
    priority?: IssuePriority;
    assignedToId?: string;
  }): Promise<IssueReadDto[]> => {
    const query = new URLSearchParams(params as any).toString();
    return handleResponse(apiClient.get<IssueReadDto[]>(`/api/Issues/search?${query}`));
  },

  /**
   * Retrieves a report summarizing issue data.
   * @param projectId - Optional project ID to filter the report.
   * @returns A promise that resolves to the issue report data.
   */
  getReports: (projectId?: number): Promise<IssueReportDto> => {
    const params: Record<string, string> = {};
    if (projectId) {
      params.projectId = projectId.toString();
    }
    const query = new URLSearchParams(params).toString();
    return handleResponse(apiClient.get<IssueReportDto>(`/api/Issues/reports?${query}`));
  },
};
