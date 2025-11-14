export type EntityType = 'Project' | 'Task' | 'Comment' | 'Message';

export interface AttachmentReadDto {
  id: number;
  fileName: string;
  fileSize: number;
  contentType: string;
  uploadDate: string;
  entityType: EntityType;
  entityId: string;
  uploadedBy: string;
  url: string;
}

export interface AttachmentPermissionDto {
  attachmentId: number;
  userId: string;
  canRead: boolean;
  canWrite: boolean;
}

export interface GrantPermissionDto {
  attachmentId: number;
  userId: string;
  permissionType: 'Read' | 'Write';
}

export interface RevokePermissionDto {
  attachmentId: number;
  userId: string;
  permissionType: 'Read' | 'Write';
}

export interface DownloadTokenDto {
    token: string;
}
