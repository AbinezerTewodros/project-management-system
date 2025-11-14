import { apiClient, ApiResponse } from "@/lib/api";
import {
  CreateMessageDto,
  EditMessageDto,
  MessageDto,
  UnreadCountDto,
} from "@/types/messageTypes";

// ======================================================================================
// Helper function to extract data from ApiResponse
// ======================================================================================
async function handleResponse<T>(promise: Promise<ApiResponse<T>>): Promise<T> {
  const response = await promise;
  if (response.success && response.data !== null) {
    return response.data;
  } else {
    throw new Error(response.message || "API request failed");
  }
}

// ======================================================================================
// Message Service
// ======================================================================================

const BASE_PATH = "/message";

export const messageService = {
  /**
   * Sends a new message using the JSON DTO defined in the backend.
   */
  sendMessage: (payload: CreateMessageDto): Promise<MessageDto> => {
    return handleResponse(
      apiClient.post<MessageDto>(`${BASE_PATH}/Send-Message`, payload)
    );
  },

  /**
   * Retrieves all department scoped messages for the current user.
   */
  getDepartmentMessages: (): Promise<MessageDto[]> => {
    return handleResponse(
      apiClient.get<MessageDto[]>(`${BASE_PATH}/department`)
    );
  },

  /**
   * Retrieves all project scoped messages available to the authenticated user.
   * Optionally filter client-side by projectId.
   */
  getProjectMessages: (): Promise<MessageDto[]> => {
    return handleResponse(apiClient.get<MessageDto[]>(`${BASE_PATH}/project`));
  },

  /**
   * Retrieves all personal messages involving the authenticated user.
   */
  getPersonalMessages: (): Promise<MessageDto[]> => {
    return handleResponse(apiClient.get<MessageDto[]>(`${BASE_PATH}/personal`));
  },

  /**
   * Updates an existing message authored by the current user.
   */
  editMessage: (payload: EditMessageDto): Promise<string> => {
    return handleResponse(apiClient.put<string>(`${BASE_PATH}/edit`, payload));
  },

  /**
   * Soft deletes a message authored by the current user.
   */
  deleteMessage: (messageId: number): Promise<string> => {
    return handleResponse(
      apiClient.delete<string>(`${BASE_PATH}/delete/${messageId}`)
    );
  },

  /**
   * Returns unread counts for personal and group messages.
   */
  getUnreadCount: (): Promise<UnreadCountDto> => {
    return handleResponse(
      apiClient.get<UnreadCountDto>(`${BASE_PATH}/unread-count`)
    );
  },

  /**
   * Marks a personal message as read.
   */
  markMessageAsRead: (messageId: number): Promise<string> => {
    return handleResponse(
      apiClient.post<string>(`${BASE_PATH}/mark-read/${messageId}`)
    );
  },

  /**
   * Marks a group message (project or department) as read.
   */
  markGroupMessageAsRead: (messageId: number): Promise<string> => {
    return handleResponse(
      apiClient.post<string>(
        `${BASE_PATH}/mark-group-message-read/${messageId}`
      )
    );
  },

  /**
   * Retrieves project messages for a specific project ID.
   */
  getProjectMessagesById: (projectId: number): Promise<MessageDto[]> => {
    return handleResponse(
      apiClient.get<MessageDto[]>(`${BASE_PATH}/project/${projectId}`)
    );
  },

  /**
   * Retrieves personal messages with a specific user by their employeeId.
   */
  getPersonalMessagesWith: (employeeId: string): Promise<MessageDto[]> => {
    return handleResponse(
      apiClient.get<MessageDto[]>(`${BASE_PATH}/personal/${employeeId}`)
    );
  },

  /**
   * Retrieves members of a specific project.
   */
  getProjectMembers: (
    projectId: number
  ): Promise<
    Array<{
      id: string;
      fullName: string;
      employeeId: string;
      email: string;
      department: string;
    }>
  > => {
    return handleResponse(
      apiClient.get(`${BASE_PATH}/project/${projectId}/members`)
    );
  },
};
