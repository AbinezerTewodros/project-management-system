export enum NotificationType {
  INFO = "info",
  WARNING = "warning",
  URGENT = "urgent",
  SUCCESS = "success",
  ERROR = "error",
  PROJECT = "project",
}

export enum NotificationCategory {
  PROJECT_UPDATE = "project_update",
  TASK_ASSIGNMENT = "task_assignment",
  ROLE_CHANGE = "role_change",
  DEADLINE_REMINDER = "deadline_reminder",
  ESCALATION = "escalation",
  SYSTEM = "system",
}

export interface Notification {
  id: string
  title: string
  message: string
  type: NotificationType
  category: NotificationCategory
  isRead: boolean
  createdAt: string
  userId: string
  projectId?: string
  taskId?: string
  actionUrl?: string
  metadata?: Record<string, any>
}

export interface NotificationPreferences {
  emailNotifications: boolean
  pushNotifications: boolean
  categories: {
    [key in NotificationCategory]: boolean
  }
  urgentOnly: boolean
}
