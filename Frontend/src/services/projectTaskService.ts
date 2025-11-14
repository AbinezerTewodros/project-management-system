import { apiClient, ApiResponse } from "@/lib/api";
import {
  ProjectTaskReadDto,
  ProjectTaskCreateDto,
  TaskCommentReadDto,
  TaskCommentCreateDto,
  TaskHistoryReadDto,
  GanttChartDataDto,
  TaskStatusSummaryDto,
  TaskPrioritySummaryDto,
  UserTaskLoadDto,
  PaginatedResult,
  TaskStatus,
  TaskPriority,
} from "@/types/taskTypes";

// ======================================================================================
// Helper function to extract data from ApiResponse
// ======================================================================================
async function handleResponse<T>(promise: Promise<ApiResponse<T>>): Promise<T> {
  const response = await promise;
  if (response.success && response.data !== null) {
    return response.data;
  } else {
    // ✅ Enhanced error with more details
    let errorMessage = response.message || "API request failed";
    
    // Add validation errors if present
    if (response.errors && response.errors.length > 0) {
      errorMessage += '\n\nValidation Errors:\n' + response.errors.join('\n');
    }
    
    // Add raw backend errors if present
    if (response.raw && typeof response.raw === 'object') {
      if (response.raw.errors) {
        errorMessage += '\n\nBackend Errors:\n' + JSON.stringify(response.raw.errors, null, 2);
      }
      if (response.raw.title) {
        errorMessage += '\n\nError Type: ' + response.raw.title;
      }
    }
    
    console.error('❌ handleResponse error details:', {
      message: response.message,
      errors: response.errors,
      status: response.status,
      raw: response.raw
    });
    
    throw new Error(errorMessage);
  }
}

async function handleVoidResponse(
  promise: Promise<ApiResponse<void>>
): Promise<void> {
  const response = await promise;
  if (!response.success) {
    throw new Error(response.message || "API request failed");
  }
}

// ======================================================================================
// ProjectTask Service
// ======================================================================================

/**
 * A comprehensive service for interacting with the ProjectTask API endpoints.
 */
export const projectTaskService = {
  /**
   * Creates a new project task.
   * @param payload - The data for creating the task as JSON.
   * @returns A promise that resolves to the created task data.
   */
  createTask: (payload: any): Promise<ProjectTaskReadDto> => {
    return handleResponse(apiClient.post<ProjectTaskReadDto>('/ProjectTask/create-task', payload));
  },

  /**
   * Retrieves all project tasks.
   * @returns A promise that resolves to a list of tasks.
   */
  getAllTasks: (): Promise<ProjectTaskReadDto[]> => {
  return handleResponse(
    apiClient.get<ProjectTaskReadDto[]>("/ProjectTask/Get-all-tasks")
  ).then(response => {
    // Backend returns a plain array, not a PaginatedResult
    console.log('📦 getAllTasks - Raw response:', response);
    console.log('📦 getAllTasks - Is array?', Array.isArray(response));
    return Array.isArray(response) ? response : [];
  }).catch(error => {
    console.error('❌ Project tasks fetch failed:', error);
    return []; // Return empty array on error
  });
},

  /**
   * Retrieves a single project task by its ID.
   * @param id - The ID of the task.
   * @returns A promise that resolves to the task data.
   */
  getTaskById: (id: number): Promise<ProjectTaskReadDto> => {
    return handleResponse(
      apiClient.get<ProjectTaskReadDto>(`/ProjectTask/Get-task-by-id/${id}`)
    );
  },

  /**
   * Updates an existing project task.
   * Note: This endpoint uses multipart/form-data for file uploads.
   * @param id - The ID of the task to update.
   * @param payload - The data for updating the task.
   * @returns A promise that resolves to the updated task data.
   */
  updateTask: (id: number, payload: FormData): Promise<ProjectTaskReadDto> => {
    // apiClient doesn't have a dedicated upload method for PUT, so we use a custom post with a method override pattern if the backend supports it,
    // or we assume the apiClient's `put` can handle FormData. Let's assume the latter for now.
    // If the backend requires a POST for multipart updates, this would need to be changed.
    return handleResponse(
      apiClient.put<ProjectTaskReadDto>(
        `/ProjectTask/update-task/${id}`,
        payload
      )
    );
  },

  /**
   * Deletes a project task by its ID.
   * @param id - The ID of the task to delete.
   * @returns A promise that resolves when the task is deleted.
   */
  deleteTask: (id: number): Promise<void> => {
    return handleVoidResponse(
      apiClient.delete<void>(`/ProjectTask/Delete-task?id=${id}`)
    );
  },

  /**
   * Filters tasks based on a set of criteria.
   * @param filters - The filtering parameters.
   * @returns A promise that resolves to a paginated list of matching tasks.
   */
  filterTasks: (filters: {
    projectAssignmentId?: number;
    assignedMemberId?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    searchTerm?: string;
    pageNumber?: number;
    pageSize?: number;
  }): Promise<PaginatedResult<ProjectTaskReadDto>> => {
    const query = new URLSearchParams(filters as any).toString();
    return handleResponse(
      apiClient.get<PaginatedResult<ProjectTaskReadDto>>(
        `ProjectTask/filter?${query}`
      )
    );
  },

  /**
   * Searches for tasks by a keyword.
   * @param keyword - The search term.
   * @returns A promise that resolves to a list of matching tasks.
   */
  searchTasks: (keyword: string): Promise<ProjectTaskReadDto[]> => {
    return handleResponse(
      apiClient.get<ProjectTaskReadDto[]>(
        `/ProjectTask/search?keyword=${keyword}`
      )
    );
  },

  /**
   * Updates the progress of a specific task.
   * @param id - The ID of the task.
   * @param progress - The new progress value (0-100).
   * @returns A promise that resolves when the progress is updated.
   */
  updateProgress: (id: number, progress: number): Promise<void> => {
    return handleVoidResponse(
      apiClient.put<void>(`/ProjectTask/${id}/progress`, { progress })
    );
  },

  /**
   * Adds a comment to a specific task.
   * @param taskId - The ID of the task.
   * @param payload - The comment data.
   * @returns A promise that resolves to the created comment.
   */
  addComment: (
    taskId: number,
    payload: TaskCommentCreateDto
  ): Promise<TaskCommentReadDto> => {
    return handleResponse(
      apiClient.post<TaskCommentReadDto>(
        `/ProjectTask/${taskId}/comments`,
        payload
      )
    );
  },

  /**
   * Retrieves all comments for a specific task.
   * @param taskId - The ID of the task.
   * @returns A promise that resolves to a list of comments.
   */
  getComments: (taskId: number): Promise<TaskCommentReadDto[]> => {
    return handleResponse(
      apiClient.get<TaskCommentReadDto[]>(`/ProjectTask/${taskId}/comments`)
    );
  },

  /**
   * Exports tasks to a file (e.g., CSV or Excel).
   * @param format - The desired file format ('csv' or 'excel').
   * @param projectId - Optional project ID to filter which tasks to export.
   * @returns A promise that resolves to a Blob containing the file data.
   */
  exportTasks: async (
    format: "csv" | "excel",
    projectId?: number
  ): Promise<Blob> => {
    const response = await apiClient.get<Blob>("/ProjectTask/export", {
      params: { format, projectId },
      responseType: "blob",
    });
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || "Failed to export tasks");
  },

  /**
   * Imports tasks from a file.
   * @param payload - FormData containing the file to import.
   * @returns A promise that resolves with the result of the import operation.
   */
  importTasks: (payload: FormData): Promise<any> => {
    return handleResponse(
      apiClient.uploadFile<any>("/ProjectTask/import", payload)
    );
  },

  /**
   * Retrieves all tasks associated with a specific project.
   * @param projectId - The ID of the project.
   * @returns A promise that resolves to a list of tasks.
   */
  getTasksByProject: (projectId: number): Promise<ProjectTaskReadDto[]> => {
    // ✅ FIXED: Use correct endpoint from CascadedFilterController
    return handleResponse(
      apiClient.get<ProjectTaskReadDto[]>(
        `/CascadedFilter/tasks?projectId=${projectId}`
      )
    );
  },

  /**
   * Retrieves all tasks assigned to a specific user.
   * @param userId - The ID of the user.
   * @returns A promise that resolves to a list of tasks.
   */
  getTasksByUser: (userId: string): Promise<ProjectTaskReadDto[]> => {
    return handleResponse(
      apiClient.get<ProjectTaskReadDto[]>(
        `/ProjectTask/tasks-by-user/${userId}`
      )
    );
  },

  /**
   * Retrieves all tasks that are overdue.
   * @returns A promise that resolves to a list of overdue tasks.
   */
  getOverdueTasks: (): Promise<ProjectTaskReadDto[]> => {
    return handleResponse(
      apiClient.get<ProjectTaskReadDto[]>("/ProjectTask/overdue-tasks")
    );
  },

  /**
   * Retrieves tasks that are due soon.
   * @param days - The number of days to look ahead for due dates.
   * @returns A promise that resolves to a list of tasks due soon.
   */
  getTasksDueSoon: (days: number = 7): Promise<ProjectTaskReadDto[]> => {
    return handleResponse(
      apiClient.get<ProjectTaskReadDto[]>(
        `/ProjectTask/tasks-due-soon?days=${days}`
      )
    );
  },

  /**
   * Assigns a user to a specific task.
   * @param taskId - The ID of the task.
   * @param userId - The ID of the user to assign.
   * @returns A promise that resolves when the user is assigned.
   */
  assignUserToTask: (taskId: number, userId: string): Promise<void> => {
    return handleVoidResponse(
      apiClient.post<void>(`/ProjectTask/${taskId}/assign-user/${userId}`)
    );
  },

  /**
   * Unassigns a user from a specific task.
   * @param taskId - The ID of the task.
   * @param userId - The ID of the user to unassign.
   * @returns A promise that resolves when the user is unassigned.
   */
  unassignUserFromTask: (taskId: number, userId: string): Promise<void> => {
    return handleVoidResponse(
      apiClient.delete<void>(`/ProjectTask/${taskId}/unassign-user/${userId}`)
    );
  },

  /**
   * Retrieves the history of changes for a specific task.
   * @param taskId - The ID of the task.
   * @returns A promise that resolves to a list of history records.
   */
  getTaskHistory: (taskId: number): Promise<TaskHistoryReadDto[]> => {
    return handleResponse(
      apiClient.get<TaskHistoryReadDto[]>(`/ProjectTask/${taskId}/history`)
    );
  },

  /**
   * Adds a dependency between two tasks.
   * @param taskId - The ID of the dependent task.
   * @param dependencyTaskId - The ID of the task it depends on.
   * @returns A promise that resolves when the dependency is created.
   */
  addTaskDependency: (
    taskId: number,
    dependencyTaskId: number
  ): Promise<void> => {
    return handleVoidResponse(
      apiClient.post<void>(
        `/ProjectTask/${taskId}/dependencies/${dependencyTaskId}`
      )
    );
  },

  /**
   * Removes a dependency between two tasks.
   * @param taskId - The ID of the dependent task.
   * @param dependencyTaskId - The ID of the task it depends on.
   * @returns A promise that resolves when the dependency is removed.
   */
  removeTaskDependency: (
    taskId: number,
    dependencyTaskId: number
  ): Promise<void> => {
    return handleVoidResponse(
      apiClient.delete<void>(
        `/ProjectTask/${taskId}/dependencies/${dependencyTaskId}`
      )
    );
  },

  /**
   * Retrieves a summary of tasks by their status.
   * @param projectId - Optional project ID to filter the summary.
   * @returns A promise that resolves to the status summary data.
   */
  getTaskStatusSummary: (projectId?: number): Promise<TaskStatusSummaryDto> => {
    const params = projectId ? { projectId } : {};
    return handleResponse(
      apiClient.get<TaskStatusSummaryDto>("/ProjectTask/task-status-summary", {
        params,
      })
    );
  },

  /**
   * Retrieves a summary of tasks by their priority.
   * @param projectId - Optional project ID to filter the summary.
   * @returns A promise that resolves to the priority summary data.
   */
  getTaskPrioritySummary: (
    projectId?: number
  ): Promise<TaskPrioritySummaryDto> => {
    const params = projectId ? { projectId } : {};
    return handleResponse(
      apiClient.get<TaskPrioritySummaryDto>(
        "/ProjectTask/task-priority-summary",
        { params }
      )
    );
  },

  /**
   * Updates the status of a specific task.
   * @param id - The ID of the task.
   * @param status - The new status.
   * @returns A promise that resolves when the status is updated.
   */
  updateStatus: (id: number, status: TaskStatus): Promise<void> => {
    return handleVoidResponse(
      apiClient.put<void>(`/ProjectTask/${id}/update-status`, `"${status}"`, {
        headers: { "Content-Type": "application/json" },
      })
    );
  },

  /**
   * Updates the priority of a specific task.
   * @param id - The ID of the task.
   * @param priority - The new priority.
   * @returns A promise that resolves when the priority is updated.
   */
  updatePriority: (id: number, priority: TaskPriority): Promise<void> => {
    return handleVoidResponse(
      apiClient.put<void>(
        `/ProjectTask/${id}/update-priority`,
        `"${priority}"`,
        { headers: { "Content-Type": "application/json" } }
      )
    );
  },

  /**
   * Retrieves the task load for each user in a project.
   * @param projectId - The ID of the project.
   * @returns A promise that resolves to a list of user task loads.
   */
  getUserTaskLoad: (projectId: number): Promise<UserTaskLoadDto[]> => {
    return handleResponse(
      apiClient.get<UserTaskLoadDto[]>("/ProjectTask/user-task-load", {
        params: { projectId },
      })
    );
  },

  /**
   * Retrieves data formatted for a Gantt chart.
   * @param projectId - The ID of the project.
   * @returns A promise that resolves to Gantt chart data.
   */
  getGanttChartData: (projectId: number): Promise<GanttChartDataDto[]> => {
    return handleResponse(
      apiClient.get<GanttChartDataDto[]>("/ProjectTask/gantt-chart-data", {
        params: { projectId },
      })
    );
  },

  /**
   * Updates the status for multiple tasks in bulk.
   * @param taskIds - An array of task IDs to update.
   * @param status - The new status to set.
   * @returns A promise that resolves when the tasks are updated.
   */
  bulkUpdateStatus: (taskIds: number[], status: TaskStatus): Promise<void> => {
    return handleVoidResponse(
      apiClient.post<void>("/ProjectTask/bulk-update-status", {
        taskIds,
        status,
      })
    );
  },

  /**
   * Deletes multiple tasks in bulk.
   * @param taskIds - An array of task IDs to delete.
   * @returns A promise that resolves when the tasks are deleted.
   */
  bulkDelete: (taskIds: number[]): Promise<void> => {
    return handleVoidResponse(apiClient.post<void>('/ProjectTask/bulk-delete', { taskIds }));
  },

  // ======================================================================================
  // Task Assignment Actions
  // ======================================================================================

  /**
   * Accept a task assignment (Pending → Accepted).
   * @param taskId - The ID of the task to accept.
   * @returns A promise that resolves when the task is accepted.
   */
  acceptTaskAssignment: (taskId: number): Promise<void> => {
    return handleVoidResponse(apiClient.put<void>(`/ProjectTask/${taskId}/accept`, {}));
  },

  /**
   * Reject a task assignment (Pending → Rejected).
   * @param taskId - The ID of the task to reject.
   * @param reason - The reason for rejection.
   * @returns A promise that resolves when the task is rejected.
   */
  rejectTaskAssignment: (taskId: number, reason: string): Promise<void> => {
    return handleVoidResponse(apiClient.put<void>(`/ProjectTask/${taskId}/reject`, reason, {
      headers: { 'Content-Type': 'application/json' }
    }));
  },

  /**
   * Accept task completion (WaitingForReview → Completed) - Team Leader only.
   * @param taskId - The ID of the task to approve.
   * @returns A promise that resolves when the task completion is approved.
   */
  acceptTaskCompletion: (taskId: number): Promise<void> => {
    return handleVoidResponse(apiClient.put<void>(`/ProjectTask/${taskId}/acceptcompletion`, {}));
  },

  /**
   * Reject task completion (WaitingForReview → InProgress) - Team Leader only.
   * @param taskId - The ID of the task to reject.
   * @param reason - The reason for rejection.
   * @returns A promise that resolves when the task completion is rejected.
   */
  rejectTaskCompletion: (taskId: number, reason: string): Promise<void> => {
    return handleVoidResponse(apiClient.put<void>(`/ProjectTask/${taskId}/rejectcompletion`, reason, {
      headers: { 'Content-Type': 'application/json' }
    }));
  },
};
