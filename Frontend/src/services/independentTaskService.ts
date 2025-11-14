import { apiClient, ApiResponse } from '@/lib/api';
import {
  IndependentTaskCreateDto,
  IndependentTaskReadDto,
  IndependentTaskUpdateDto,
  IndependentTaskStatus,
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
// IndependentTask Service
// ======================================================================================

export const independentTaskService = {
  /**
   * Creates a new independent task.
   * @param payload - The data for creating the task.
   * @returns A promise that resolves to the created task data.
   */
  createTask: (payload: IndependentTaskCreateDto): Promise<IndependentTaskReadDto> => {
    return handleResponse(apiClient.post<IndependentTaskReadDto>("/independent-tasks", payload))
  },

  /**
   * Retrieves all independent tasks in a paginated format.
   * @param pageNumber - The page number to retrieve.
   * @param pageSize - The number of items per page.
   * @returns A promise that resolves to a paginated list of tasks.
   */
   getAllTasks: (): Promise<IndependentTaskReadDto[]> => {
  return handleResponse(
    apiClient.get<IndependentTaskReadDto[]>("/independent-tasks")
  ).then(response => {
    console.log('📦 Independent tasks service response:', response);
    // Ensure we return an array of IndependentTaskReadDto
    if (Array.isArray(response)) {
      return response;
    }
    // If backend returns wrapped response, extract the array
    if (response && typeof response === 'object' && 'items' in response) {
      return (response as any).items || [];
    }
    return [];
  }).catch(error => {
    console.error('Independent tasks fetch failed:', error);
    return [];
  });
},

  /**
   * Retrieves a single independent task by its ID.
   * @param id - The ID of the task.
   * @returns A promise that resolves to the task data.
   */
  getTaskById: (id: number): Promise<IndependentTaskReadDto> => {
    return handleResponse(apiClient.get<IndependentTaskReadDto>("/independent-tasks/" + id))
  },

  /**
   * Updates an existing independent task.
   * @param id - The ID of the task to update.
   * @param payload - The data for updating the task.
   * @returns A promise that resolves to the updated task data.
   */
  updateTask: (id: number, payload: IndependentTaskUpdateDto): Promise<IndependentTaskReadDto> => {
    return handleResponse(apiClient.put<IndependentTaskReadDto>("/independent-tasks/" + id, payload))
  },

  /**
   * Deletes an independent task by its ID.
   * @param id - The ID of the task to delete.
   * @returns A promise that resolves when the task is deleted.
   */
  deleteTask: (id: number): Promise<void> => {
    return handleVoidResponse(apiClient.delete<void>("/independent-tasks/" + id))
  },

  /**
   * Accepts an independent task.
   * @param id - The ID of the task to accept.
   * @returns A promise that resolves when the task is accepted.
   */
  acceptTask: (id: number): Promise<void> => {
    return handleVoidResponse(apiClient.post<void>("/independent-tasks/" + id + "/accept"))
  },

  /**
   * Rejects an independent task.
   * @param id - The ID of the task to reject.
   * @param reason - The reason for rejection.
   * @returns A promise that resolves when the task is rejected.
   */
  rejectTask: (id: number, reason: string): Promise<void> => {
    return handleVoidResponse(apiClient.post<void>("/independent-tasks/" + id + "/reject", { reason }))
  },

  /**
   * Marks an independent task as completed.
   * @param id - The ID of the task to complete.
   * @param completionDetails - Details about the completion.
   * @returns A promise that resolves when the task is completed.
   */
  completeTask: (id: number, completionDetails: string): Promise<void> => {
    return handleVoidResponse(apiClient.post<void>("/independent-tasks/" + id + "/complete", { completionDetails }))
  },

  /**
   * Retrieves all tasks assigned to the current user.
   * @returns A promise that resolves to a list of tasks.
   */
  getMyTasks: (): Promise<IndependentTaskReadDto[]> => {
    return handleResponse(apiClient.get<IndependentTaskReadDto[]>("/independent-tasks/user"))
  },

  /**
   * Retrieves all tasks created by the current user.
   * @returns A promise that resolves to a list of tasks.
   */
  getCreatedTasks: (): Promise<IndependentTaskReadDto[]> => {
    return handleResponse(apiClient.get<IndependentTaskReadDto[]>("/independent-tasks/created"))
  },

  /**
   * Searches for independent tasks by a keyword.
   * @param keyword - The search term.
   * @returns A promise that resolves to a list of matching tasks.
   */
  searchTasks: (keyword: string): Promise<IndependentTaskReadDto[]> => {
    return handleResponse(apiClient.get<IndependentTaskReadDto[]>("/independent-tasks/search?keyword=" + keyword))
  },

  /**
   * Filters independent tasks based on status.
   * @param status - The status to filter by.
   * @returns A promise that resolves to a list of matching tasks.
   */
  filterByStatus: (status: IndependentTaskStatus): Promise<IndependentTaskReadDto[]> => {
    return handleResponse(
      apiClient.get<IndependentTaskReadDto[]>("/independent-tasks/filter?status=" + status),
    )
  },

  /**
   * Updates task progress.
   * @param id - The ID of the task.
   * @param progress - The progress percentage (0-100).
   * @param comments - Optional comments about the progress update.
   * @returns A promise that resolves when the progress is updated.
   */
  updateProgress: (id: number, progress: number, comments?: string): Promise<void> => {
    return handleVoidResponse(apiClient.put<void>("/independent-tasks/" + id + "/progress", { progress, comments }))
  },

  /**
   * Approves task completion (for managers/team leads).
   * @param id - The ID of the task.
   * @param comments - Optional approval comments.
   * @returns A promise that resolves when the task is approved.
   */
  approveCompletion: (id: number, comments?: string): Promise<void> => {
    return handleVoidResponse(apiClient.post<void>("/independent-tasks/" + id + "/approve", { comments }))
  },

  /**
   * Rejects task completion (for managers/team leads).
   * @param id - The ID of the task.
   * @param reason - The reason for rejection.
   * @returns A promise that resolves when the completion is rejected.
   */
  rejectCompletion: (id: number, reason: string): Promise<void> => {
    return handleVoidResponse(apiClient.post<void>("/independent-tasks/" + id + "/reject-completion", { reason }))
  },

  /**
   * Restores a deleted independent task.
   * @param id - The ID of the task to restore.
   * @returns A promise that resolves when the task is restored.
   */
  restoreTask: (id: number): Promise<void> => {
    return handleVoidResponse(apiClient.post<void>("/independent-tasks/" + id + "/restore"))
  },

  /**
   * Gets all deleted independent tasks.
   * @returns A promise that resolves to a list of deleted tasks.
   */
  getDeletedTasks: (): Promise<IndependentTaskReadDto[]> => {
    return handleResponse(apiClient.get<IndependentTaskReadDto[]>("/independent-tasks/deleted"))
  },

  /**
   * Reassigns an independent task to a new user.
   * @param id - The ID of the task.
   * @param newAssigneeId - The ID of the new assignee.
   * @returns A promise that resolves when the task is reassigned.
   */
  reassignTask: (id: number, newAssigneeId: string): Promise<void> => {
    return handleVoidResponse(apiClient.post<void>("/independent-tasks/" + id + "/reassign", { newAssigneeId }))
  },

  /**
   * Gets all attachments for an independent task.
   * @param id - The ID of the task.
   * @returns A promise that resolves to a list of attachments.
   */
  getAttachments: (id: number): Promise<any[]> => {
    return handleResponse(apiClient.get<any[]>("/independent-tasks/" + id + "/attachments"))
  },
};

// Add this to your independentTaskService.ts temporarily:

export const testIndependentTasksEndpoint = async () => {
  console.log('🧪 Testing independent tasks endpoint...');
  
  try {
    // Test without leading slash
    const response = await apiClient.get<IndependentTaskReadDto[]>("/independent-tasks");
    console.log('✅ Independent tasks test result:', response);
    
    if (response.success && response.data) {
      console.log(`🎯 Found ${Array.isArray(response.data) ? response.data.length : 'unknown'} independent tasks`);
      console.log('📋 Tasks data:', response.data);
    } else {
      console.log('❌ Independent tasks call failed:', response);
    }
    
    return response;
  } catch (error) {
    console.error('💥 Independent tasks test failed:', error);
    return null;
  }
};

// // Add this to your independentTaskService.ts temporarily:

// export const testIndependentTasksEndpoint = async () => {
//   console.log('🧪 Testing independent tasks endpoint...');
  
//   try {
//     // Test without leading slash
//     const response = await apiClient.get<IndependentTaskReadDto[]>("/independent-tasks");
//     console.log('✅ Independent tasks test result:', response);
    
//     if (response.success && response.data) {
//       console.log(`🎯 Found ${Array.isArray(response.data) ? response.data.length : 'unknown'} independent tasks`);
//       console.log('📋 Tasks data:', response.data);
//     } else {
//       console.log('❌ Independent tasks call failed:', response);
//     }
    
//     return response;
//   } catch (error) {
//     console.error('💥 Independent tasks test failed:', error);
//     return null;
//   }
// };


