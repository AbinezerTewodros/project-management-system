import { apiClient } from "../lib/api";

export interface NotificationDto {
  id: number;
  recipientUserId: string;
  subject: string;
  message: string;
  relatedEntityType: string;
  relatedEntityId: number;
  createdAt: string;
  status: number; // 0 = Pending, 1 = Sent, 2 = Failed
  deliveryMethod: number; // 0 = Email, 1 = InApp
  scheduledSendTime?: string;
  sentAt?: string;
  failureReason?: string;
  actionUrl?: string;
}

export interface NotificationResponse {
  success: boolean;
  message: string;
  data: NotificationDto[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
}

export interface UnreadCountResponse {
  success: boolean;
  message: string;
  unreadCount: number;
}

export interface TestNotificationRequest {
  userId: string;
  title: string;
  message: string;
}

class NotificationService {
  private baseUrl = "/notification";

  /**
   * Get user notifications with pagination
   */
  async getNotifications(
    pageNumber: number = 1,
    pageSize: number = 20
  ): Promise<NotificationResponse> {
    try {
      const response = await apiClient.get(
        `${this.baseUrl}?pageNumber=${pageNumber}&pageSize=${pageSize}`
      );
      return response.data as NotificationResponse;
    } catch (error) {
      console.error("Error fetching notifications:", error);
      throw error;
    }
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(): Promise<UnreadCountResponse> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/unread-count`);
      return response.data as UnreadCountResponse;
    } catch (error) {
      console.error("Error fetching unread count:", error);
      throw error;
    }
  }

  /**
   * Mark a specific notification as read
   */
  async markAsRead(
    notificationId: number
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.put(
        `${this.baseUrl}/${notificationId}/read`
      );
      return response.data as { success: boolean; message: string };
    } catch (error) {
      console.error("Error marking notification as read:", error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.put(`${this.baseUrl}/mark-all-read`);
      return response.data as { success: boolean; message: string };
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      throw error;
    }
  }

  /**
   * Delete a specific notification
   */
  async deleteNotification(
    notificationId: number
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.delete(
        `${this.baseUrl}/${notificationId}`
      );
      return response.data as { success: boolean; message: string };
    } catch (error) {
      console.error("Error deleting notification:", error);
      throw error;
    }
  }

  /**
   * Send test notification (Admin only)
   */
  async sendTestNotification(
    request: TestNotificationRequest
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/test`, request);
      return response.data as { success: boolean; message: string };
    } catch (error) {
      console.error("Error sending test notification:", error);
      throw error;
    }
  }

  /**
   * Get notification type display name
   */
  getNotificationTypeDisplayName(relatedEntityType: string): string {
    const typeMap: Record<string, string> = {
      Project: "Project",
      Milestone: "Milestone",
      ProjectTask: "Task",
      PersonalTodo: "Personal Todo",
      Comment: "Comment",
      Attachment: "File",
      User: "User",
      System: "System",
      Message: "Message",
      Issue: "Issue",
    };
    return typeMap[relatedEntityType] || relatedEntityType;
  }

  /**
   * Get notification icon based on type
   */
  getNotificationIcon(relatedEntityType: string): string {
    const iconMap: Record<string, string> = {
      Project: "📁",
      Milestone: "🎯",
      ProjectTask: "✅",
      PersonalTodo: "📝",
      Comment: "💬",
      Attachment: "📎",
      User: "👤",
      System: "⚙️",
      Message: "💬",
      Issue: "🐛",
    };
    return iconMap[relatedEntityType] || "🔔";
  }

  /**
   * Format notification time
   */
  formatNotificationTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    if (diffInMinutes < 10080)
      return `${Math.floor(diffInMinutes / 1440)}d ago`;

    return date.toLocaleDateString();
  }

  /**
   * Get notification priority color
   */
  getNotificationPriorityColor(status: number): string {
    // Assuming status: 0 = Pending, 1 = Sent, 2 = Failed
    switch (status) {
      case 0:
        return "text-blue-600"; // Pending
      case 1:
        return "text-green-600"; // Sent
      case 2:
        return "text-red-600"; // Failed
      default:
        return "text-gray-600";
    }
  }
}

export const notificationService = new NotificationService();
