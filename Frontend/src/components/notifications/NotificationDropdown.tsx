import React from "react";
import { X, Check, Trash2, RefreshCw, BellOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../../context/NotificationContext";
import { NotificationItem } from "./NotificationItem";
import { useAuth } from "../../context/AuthContext";

interface NotificationDropdownProps {
  onClose: () => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  onClose,
}) => {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    isLoading,
    markAllAsRead,
    refreshNotifications,
    error,
  } = useNotifications();
  const { user } = useAuth();

  const handleMarkAllRead = async () => {
    if (unreadCount > 0) {
      await markAllAsRead();
    }
  };

  const handleRefresh = async () => {
    await refreshNotifications();
  };

  const handleViewAllNotifications = () => {
    let roleRoute = "/dashboard/member/notifications";
    if (user?.role) {
      const role = user.role.toLowerCase();
      if (role === "admin") roleRoute = "/dashboard/admin/notifications";
      else if (role === "manager")
        roleRoute = "/dashboard/manager/notifications";
      else if (role === "director")
        roleRoute = "/dashboard/director/notifications";
      else if (role === "vice_president")
        roleRoute = "/dashboard/vice-president/notifications";
      else if (role === "president")
        roleRoute = "/dashboard/president/notifications";
      else if (role === "supervisor")
        roleRoute = "/dashboard/supervisor/notifications";
      else roleRoute = "/dashboard/member/notifications";
    }
    navigate(roleRoute);
    onClose();
  };

  return (
    <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
          {unreadCount > 0 && (
            <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
              {unreadCount} new
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
            title="Refresh notifications"
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
          </button>

          {/* Mark All Read Button */}
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
              title="Mark all as read"
            >
              <Check className="h-4 w-4" />
            </button>
          )}

          {/* Close Button */}
          <button
            onClick={onClose}
            className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
            title="Close notifications"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-h-96 overflow-y-auto">
        {error && (
          <div className="px-4 py-3 text-red-600 text-sm bg-red-50 border-b border-red-200">
            {error}
          </div>
        )}

        {isLoading && notifications.length === 0 ? (
          <div className="px-4 py-8 text-center text-gray-500">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
            <p>Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="px-4 py-8 text-center text-gray-500">
            <BellOff className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p className="font-medium">No notifications</p>
            <p className="text-sm">You're all caught up!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleViewAllNotifications}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            View all notifications
          </button>
        </div>
      )}
    </div>
  );
};
