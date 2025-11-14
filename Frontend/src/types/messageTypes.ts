export enum MessageType {
  Project = 1,
  Department = 2,
  Personal = 3,
}

export interface MessageAttachmentDto {
  id: string;
  fileName: string;
  fileSize: number;
  contentType: string;
  filePhysicalPath: string;
  url?: string;
  createdAt: string;
  uploadedByUserId: string;
  uploadedByUserName?: string;
}

export interface MessageDto {
  messageId: number;
  content: string;
  senderId: string;
  senderName: string;
  receiverId?: string;
  projectId?: number;
  messageType: MessageType;
  employeeId?: string;
  attachmentId?: string;
  attachment?: MessageAttachmentDto;
  isRead: boolean;
  timeSent: string;
  timeEdited?: string;
}

export interface CreateMessageDto {
  content: string;
  receiverId?: string;
  projectId?: number;
  messageType: MessageType;
  attachmentId?: string;
}

export interface EditMessageDto {
  messageId: number;
  newContent: string;
}

export interface UnreadCountDto {
  personalUnread: number;
  departmentUnread: number;
  projectUnread: number;
  groupUnread: number;
  total: number;
}
