import { apiClient, ApiResponse } from '@/lib/api';
import {
  AttachmentReadDto,
  AttachmentPermissionDto,
  GrantPermissionDto,
  RevokePermissionDto,
  DownloadTokenDto,
  EntityType,
} from '@/types/attachmentTypes';

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
// Attachments Service
// ======================================================================================

export const attachmentsService = {
  /**
   * Uploads one or more files.
   * @param formData - FormData containing the files to upload.
   * @returns A promise that resolves to a list of attachment details.
   */
  upload: (formData: FormData): Promise<AttachmentReadDto[]> => {
    return handleResponse(apiClient.uploadFile<AttachmentReadDto[]>('/Attachments/upload', formData));
  },

  /**
   * Retrieves a list of attachments for a specific entity.
   * @param entityType - The type of the entity (e.g., 'Project', 'Task').
   * @param entityId - The ID of the entity.
   * @returns A promise that resolves to a list of attachments.
   */
  list: (entityType: EntityType, entityId: string): Promise<AttachmentReadDto[]> => {
    return handleResponse(apiClient.get<AttachmentReadDto[]>(`/Attachments/list/${entityType}/${entityId}`));
  },

  /**
   * Deletes an attachment by its ID.
   * @param id - The ID of the attachment to delete.
   * @returns A promise that resolves when the attachment is deleted.
   */
  delete: (id: number): Promise<void> => {
    return handleVoidResponse(apiClient.delete<void>(`/Attachments/${id}`));
  },

  /**
   * Retrieves an attachment by its ID.
   * @param id - The ID of the attachment.
   * @returns A promise that resolves to the attachment details.
   */
  getById: (id: number): Promise<AttachmentReadDto> => {
    return handleResponse(apiClient.get<AttachmentReadDto>(`/Attachments/Get-By-Id/${id}`));
  },

  /**
   * Checks if the current user has access to an attachment.
   * @param id - The ID of the attachment.
   * @returns A promise that resolves to a boolean indicating access.
   */
  checkAccess: (id: number): Promise<boolean> => {
    return handleResponse(apiClient.get<boolean>(`/Attachments/${id}/check-access`));
  },

  /**
   * Gets a short-lived download token for an attachment.
   * @param id - The ID of the attachment.
   * @returns A promise that resolves to a download token.
   */
  getDownloadToken: (id: number): Promise<DownloadTokenDto> => {
    return handleResponse(apiClient.get<DownloadTokenDto>(`/Attachments/${id}/download-token`));
  },

  /**
   * Downloads an attachment securely using a token.
   * @param id - The ID of the attachment.
   * @param token - The download token.
   * @returns A promise that resolves to a Blob containing the file data.
   */
  securedDownload: async (id: number, token: string): Promise<Blob> => {
    const response = await apiClient.get<Blob>(`/Attachments/secured-download/${id}?token=${token}`, { responseType: 'blob' });
    if (response.success && response.data) {
        return response.data;
    }
    throw new Error(response.message || 'Failed to download file');
  },

  /**
   * Grants a permission for an attachment to a user.
   * @param payload - The permission details.
   * @returns A promise that resolves when the permission is granted.
   */
  grantPermission: (payload: GrantPermissionDto): Promise<void> => {
    return handleVoidResponse(apiClient.post<void>('/Attachments/permissions/grant', payload));
  },

  /**
   * Revokes a permission for an attachment from a user.
   * @param payload - The permission details to revoke.
   * @returns A promise that resolves when the permission is revoked.
   */
  revokePermission: (payload: RevokePermissionDto): Promise<void> => {
    return handleVoidResponse(apiClient.post<void>('/Attachments/permissions/revoke', payload));
  },

  /**
   * Retrieves all permissions for a specific attachment.
   * @param id - The ID of the attachment.
   * @returns A promise that resolves to a list of permissions.
   */
  getPermissions: (id: number): Promise<AttachmentPermissionDto[]> => {
    return handleResponse(apiClient.get<AttachmentPermissionDto[]>(`/Attachments/permissions/${id}`));
  },
};
