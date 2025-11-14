import { apiClient } from "@/lib/api";

// ======================================================================================
// Attachment Service - Complete integration with backend
// ======================================================================================

export interface AttachmentUploadDto {
  file: File;
  category?: string;
  entityType: string;
  entityId: string;
  accessibilityLevel?: number;
}

export interface AttachmentDto {
  id: string;
  fileName: string;
  fileSize: number;
  contentType: string;
  filePhysicalPath: string;
  uploadedByUserId: string;
  uploadedByUserName?: string;
  entityType: string;
  entityId: string;
  category?: string;
  accessibility?: number;
  createdAt: string;
  url?: string;
}

export interface DownloadTokenResponse {
  token: string;
}

export const attachmentService = {
  /**
   * Upload a file attachment
   * POST /api/Attachments/upload
   *
   * Categories: 0=Project, 1=Task, 2=Deliverable, 3=Communication, 4=Financial, 5=Risk, 6=Compliance
   * AccessibilityLevel: 0=Public, 1=Private, 2=Protected, 3=Internal
   */
  uploadFile: async (
    file: File,
    entityType: string,
    entityId: string,
    category: number = 3 // Communication = 3 (for chat)
  ): Promise<AttachmentDto> => {
    const formData = new FormData();
    formData.append("File", file);
    formData.append("Category", category.toString());
    formData.append("EntityType", entityType);
    formData.append("EntityId", entityId);
    formData.append("AccessibilityLevel", "0"); // Public = 0

    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";
    const uploadUrl = `${API_URL}/Attachments/upload`;

    console.log("📤 Uploading to:", uploadUrl);
    console.log("📤 File:", file.name, file.size, "bytes");
    console.log(
      "📤 EntityType:",
      entityType,
      "EntityId:",
      entityId,
      "Category:",
      category
    );

    const response = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: formData,
    });

    console.log(
      "📤 Upload response status:",
      response.status,
      response.statusText
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("📤 Upload error response:", errorText);
      throw new Error(
        `Upload failed: ${response.status} ${response.statusText}`
      );
    }

    const result = await response.json();
    console.log("📤 Upload success:", result);
    return result;
  },

  /**
   * Get download token for secure download
   * GET /api/Attachments/{id}/download-token
   */
  getDownloadToken: async (attachmentId: string): Promise<string> => {
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";
    const response = await fetch(
      `${API_URL}/Attachments/${attachmentId}/download-token`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to get download token");
    }

    const data: DownloadTokenResponse = await response.json();
    return data.token;
  },

  /**
   * Download file using secured endpoint with token
   * GET /api/Attachments/secured-download/{id}?token={token}
   */
  downloadFile: async (attachmentId: string): Promise<void> => {
    try {
      const token = await attachmentService.getDownloadToken(attachmentId);
      const API_URL =
        import.meta.env.VITE_API_URL || "http://localhost:8080/api";
      const downloadUrl = `${API_URL}/Attachments/secured-download/${attachmentId}?token=${token}`;

      // Open in new tab to trigger download
      window.open(downloadUrl, "_blank");
    } catch (error) {
      console.error("Download failed:", error);
      throw error;
    }
  },

  /**
   * Get attachment details by ID
   * GET /api/Attachments/Get-By-Id?id={id}
   */
  getAttachmentById: async (id: string): Promise<AttachmentDto> => {
    const response = await apiClient.get<AttachmentDto>(
      `/Attachments/Get-By-Id?id=${id}`
    );
    return response.data!;
  },

  /**
   * List attachments for an entity
   * GET /api/Attachments/list/{entityType}/{entityId}
   */
  listAttachments: async (
    entityType: string,
    entityId: string
  ): Promise<AttachmentDto[]> => {
    const response = await apiClient.get<AttachmentDto[]>(
      `/Attachments/list/${entityType}/${entityId}`
    );
    return response.data!;
  },

  /**
   * Check if user has access to attachment
   * GET /api/Attachments/{id}/check-access?permission={type}
   */
  checkAccess: async (
    attachmentId: string,
    permission: "View" | "Download" | "Delete" = "View"
  ): Promise<boolean> => {
    const response = await apiClient.get<{ hasAccess: boolean }>(
      `/Attachments/${attachmentId}/check-access?permission=${permission}`
    );
    return response.data?.hasAccess ?? false;
  },

  /**
   * Delete attachment (soft delete)
   * DELETE /api/Attachments/{id}
   */
  deleteAttachment: async (id: string): Promise<void> => {
    await apiClient.delete(`/Attachments/${id}`);
  },

  /**
   * Get preview for file (if supported)
   * GET /api/Attachments/preview/{fileName}
   */
  getPreview: async (fileName: string): Promise<unknown> => {
    const response = await apiClient.get(`/Attachments/preview/${fileName}`);
    return response.data;
  },

  /**
   * Get thumbnail for image
   * GET /api/Attachments/thumbnail/{fileName}?width={w}&height={h}
   */
  getThumbnailUrl: (
    fileName: string,
    width: number = 200,
    height: number = 200
  ): string => {
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";
    return `${API_URL}/Attachments/thumbnail/${fileName}?width=${width}&height=${height}`;
  },

  /**
   * Check if file type is previewable
   * GET /api/Attachments/previewable?contentType={type}
   */
  isPreviewable: async (contentType: string): Promise<boolean> => {
    const response = await apiClient.get<{ isPreviewable: boolean }>(
      `/Attachments/previewable?contentType=${contentType}`
    );
    return response.data?.isPreviewable ?? false;
  },
};
