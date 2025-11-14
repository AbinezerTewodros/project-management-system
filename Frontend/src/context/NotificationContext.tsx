import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import {
  notificationService,
  NotificationDto,
} from "../services/notificationService";
import { useAuth } from "./AuthContext";

interface NotificationContextType {
  notifications: NotificationDto[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchNotifications: (pageNumber?: number, pageSize?: number) => Promise<void>;
  markAsRead: (notificationId: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: number) => Promise<void>;
  refreshNotifications: () => Promise<void>;
  clearError: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
}) => {
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Fetch notifications
  const fetchNotifications = useCallback(
    async (pageNumber: number = 1, pageSize: number = 20) => {
      if (!user) return;

      try {
        setIsLoading(true);
        setError(null);

        const response = await notificationService.getNotifications(
          pageNumber,
          pageSize
        );
        console.log("Fetched notifications response:", response);
        // The response will have a shape { success, message, data: [], ... } so assign setNotifications(response.data) if correct, else setNotifications(response.data.data)
        setNotifications(
          Array.isArray(response.data)
            ? response.data
            : Array.isArray(response.data?.data)
            ? response.data.data
            : []
        );
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch notifications";
        setError(errorMessage);
        console.error("Error fetching notifications:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [user]
  );

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;

    try {
      const response = await notificationService.getUnreadCount();
      setUnreadCount(response.unreadCount);
    } catch (err) {
      console.error("Error fetching unread count:", err);
    }
  }, [user]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: number) => {
    try {
      await notificationService.markAsRead(notificationId);

      // Update local state
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === notificationId
            ? { ...notification, status: 1 } // Mark as sent/read
            : notification
        )
      );

      // Update unread count
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to mark notification as read";
      setError(errorMessage);
      console.error("Error marking notification as read:", err);
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      await notificationService.markAllAsRead();

      // Update local state
      setNotifications((prev) =>
        prev.map((notification) => ({ ...notification, status: 1 }))
      );

      setUnreadCount(0);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to mark all notifications as read";
      setError(errorMessage);
      console.error("Error marking all notifications as read:", err);
    }
  }, []);

  // Delete notification
  const deleteNotification = useCallback(
    async (notificationId: number) => {
      try {
        await notificationService.deleteNotification(notificationId);

        // Update local state
        setNotifications((prev) =>
          prev.filter((notification) => notification.id !== notificationId)
        );

        // Update unread count if notification was unread
        const deletedNotification = notifications.find(
          (n) => n.id === notificationId
        );
        if (deletedNotification && deletedNotification.status === 0) {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to delete notification";
        setError(errorMessage);
        console.error("Error deleting notification:", err);
      }
    },
    [notifications]
  );

  // Refresh notifications (fetch both notifications and unread count)
  const refreshNotifications = useCallback(async () => {
    await Promise.all([fetchNotifications(), fetchUnreadCount()]);
  }, [fetchNotifications, fetchUnreadCount]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Initial load when user is authenticated
  useEffect(() => {
    if (user) {
      refreshNotifications();
    } else {
      // Clear notifications when user logs out
      setNotifications([]);
      setUnreadCount(0);
      setError(null);
    }
  }, [user, refreshNotifications]);

  // Auto-refresh notifications every 30 seconds
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      fetchUnreadCount(); // Only fetch unread count for performance
    }, 30000);

    return () => clearInterval(interval);
  }, [user, fetchUnreadCount]);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    isLoading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications,
    clearError,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
