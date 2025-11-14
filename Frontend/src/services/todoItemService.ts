import { apiClient, ApiResponse } from '@/lib/api';
import {
  TodoItemCreateDto,
  TodoItemReadDto,
  TodoItemUpdateDto,
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
// TodoItem Service
// ======================================================================================

export const todoItemService = {
  /**
   * Creates a new todo item.
   * @param payload - The data for creating the todo item.
   * @returns A promise that resolves to the created todo item.
   */
  create: (payload: TodoItemCreateDto): Promise<TodoItemReadDto> => {
    return handleResponse(apiClient.post<TodoItemReadDto>('/todoitems', payload));
  },

  /**
   * Retrieves all todo items for a specific project task.
   * @param projectTaskId - The ID of the project task.
   * @returns A promise that resolves to a list of todo items.
   */
  getByProjectTask: (projectTaskId: number): Promise<TodoItemReadDto[]> => {
    return handleResponse(apiClient.get<TodoItemReadDto[]>(`/todoitems/projecttask/${projectTaskId}`));
  },

  /**
   * Retrieves a single todo item by its ID.
   * @param id - The ID of the todo item.
   * @returns A promise that resolves to the todo item data.
   */
  getById: (id: number): Promise<TodoItemReadDto> => {
    return handleResponse(apiClient.get<TodoItemReadDto>(`/todoitems/${id}`));
  },

  /**
   * Updates an existing todo item.
   * @param id - The ID of the todo item to update.
   * @param payload - The data for updating the todo item.
   * @returns A promise that resolves to the updated todo item.
   */
  update: (id: number, payload: TodoItemUpdateDto): Promise<TodoItemReadDto> => {
    return handleResponse(apiClient.put<TodoItemReadDto>(`/todoitems/${id}`, payload));
  },

  /**
   * Deletes a todo item by its ID.
   * @param id - The ID of the todo item to delete.
   * @returns A promise that resolves when the todo item is deleted.
   */
  delete: (id: number): Promise<void> => {
    return handleVoidResponse(apiClient.delete<void>(`/todoitems/${id}`));
  },

  /**
   * Accepts the assignment of a todo item (Pending → Accepted).
   * @param id - The ID of the todo item.
   * @returns A promise that resolves when the assignment is accepted.
   */
  acceptAssignment: (id: number): Promise<void> => {
    return handleVoidResponse(apiClient.put<void>(`/todoitems/${id}/acceptassignment`, {}));
  },

  /**
   * Rejects the assignment of a todo item (Pending → Rejected).
   * @param id - The ID of the todo item.
   * @param reason - The reason for rejection.
   * @returns A promise that resolves when the assignment is rejected.
   */
  rejectAssignment: (id: number, reason: string): Promise<void> => {
    return handleVoidResponse(apiClient.put<void>(`/todoitems/${id}/rejectassignment`, reason, {
      headers: { 'Content-Type': 'application/json' }
    }));
  },

  /**
   * Starts progress on a todo item (Accepted → InProgress).
   * @param id - The ID of the todo item.
   * @returns A promise that resolves when the todo item is started.
   */
  start: (id: number): Promise<void> => {
    return handleVoidResponse(apiClient.put<void>(`/todoitems/${id}/start`, {}));
  },

  /**
   * Marks a todo item as complete (InProgress → WaitingForReview).
   * @param id - The ID of the todo item.
   * @param progress - The completion progress (0-100).
   * @param detailsForLateCompletion - Reason if completed late.
   * @param completionDetails - Additional completion details.
   * @returns A promise that resolves when the todo item is marked complete.
   */
  complete: (id: number, progress: number, detailsForLateCompletion?: string, completionDetails?: string): Promise<void> => {
    return handleVoidResponse(apiClient.put<void>(`/todoitems/${id}/complete?progress=${progress}`, {
      detailsForLateCompletion: detailsForLateCompletion || null,
      completionDetails: completionDetails || ''
    }));
  },

  /**
   * Rejects the completion of a todo item (WaitingForReview → Reopened) - Team Leader only.
   * @param id - The ID of the todo item.
   * @param reason - The reason for rejection.
   * @returns A promise that resolves when the completion is rejected.
   */
  rejectCompletion: (id: number, reason: string): Promise<void> => {
    return handleVoidResponse(apiClient.put<void>(`/todoitems/${id}/rejectcompletion`, reason, {
      headers: { 'Content-Type': 'application/json' }
    }));
  },

  /**
   * Approves a completed todo item (WaitingForReview → Approved) - Team Leader only.
   * @param id - The ID of the todo item.
   * @returns A promise that resolves when the todo item is approved.
   */
  acceptApproval: (id: number): Promise<void> => {
    return handleVoidResponse(apiClient.put<void>(`/todoitems/${id}/acceptapproval`, {}));
  },

  /**
   * Reopens a closed todo item.
   * @param id - The ID of the todo item.
   * @returns A promise that resolves when the todo item is reopened.
   */
  reopen: (id: number): Promise<void> => {
    return handleVoidResponse(apiClient.put<void>(`/todoitems/${id}/reopen`));
  },

  /**
   * Updates the progress of a todo item.
   * @param id - The ID of the todo item.
   * @param progress - The new progress value (0-100).
   * @returns A promise that resolves when the progress is updated.
   */
  updateProgress: (id: number, progress: number): Promise<void> => {
    return handleVoidResponse(apiClient.put<void>(`/todoitems/${id}/progress`, { progress }));
  },

  /**
   * Retrieves the progress of a todo item.
   * @param id - The ID of the todo item.
   * @returns A promise that resolves to the progress value.
   */
  getProgress: (id: number): Promise<number> => {
    return handleResponse(apiClient.get<number>(`/todoitems/${id}/progress`));
  },

  // ✅ Get all TodoItems for a specific project task (with proper response handling)
  getTodoItemsByProjectTaskId: (projectTaskId: number): Promise<TodoItemReadDto[]> => {
    return handleResponse(apiClient.get<TodoItemReadDto[]>(`/todoitems/projecttask/${projectTaskId}`));
  },

  createTodoItem: (payload: TodoItemCreateDto) => {
    return apiClient.post<TodoItemReadDto>('/todoitems', payload);
  },

  updateTodoItemProgress: async (id: number, progress: number) => {
    return handleVoidResponse(apiClient.put<void>(`/todoitems/${id}/progress`, { progress }));
  },

  completeTodoItem: async (id: number, progress: number, lateReason: string | null, details: string) => {
    return handleVoidResponse(apiClient.put<void>(`/todoitems/${id}/complete?progress=${progress}`, {
      detailsForLateCompletion: lateReason,
      completionDetails: details
    }));
  },

  deleteTodoItem: async (id: number) => {
    return handleVoidResponse(apiClient.delete<void>(`/todoitems/${id}`));
  },
};
