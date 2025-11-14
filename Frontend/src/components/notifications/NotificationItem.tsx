import React from "react";
import { Trash2, Check } from "lucide-react";
import {
  NotificationDto,
  notificationService,
} from "../../services/notificationService";
import { useNotifications } from "../../context/NotificationContext";
import { useNavigate } from "react-router-dom";

interface NotificationItemProps {
  notification: NotificationDto;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
}) => {
  const { markAsRead, deleteNotification } = useNotifications();
  const navigate = useNavigate();

  const handleMarkAsRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (notification.status === 0) {
      // Only mark as read if unread
      await markAsRead(notification.id);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteNotification(notification.id);
  };

  const handleNotificationClick = async () => {
    if (notification.status === 0) {
      await markAsRead(notification.id);
    }
    // 1. Direct URL
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
      return;
    }
    // 2. Infer route from relatedEntityType/relatedEntityId
    switch (notification.relatedEntityType) {
      case "Project":
        navigate(`/projects/${notification.relatedEntityId}`);
        break;
      case "ProjectTask":
        navigate(`/tasks/${notification.relatedEntityId}`);
        break;
      case "Milestone":
        navigate(`/milestones/${notification.relatedEntityId}`);
        break;
      case "PersonalTodo":
        navigate(`/tasks/personal`);
        break;
      case "Message":
        navigate(`/dashboard/member/Chat`);
        break;
      // Add more cases as appropriate
      default:
        // fallback
        break;
    }
  };

  const isUnread = notification.status === 0;
  const icon = notificationService.getNotificationIcon(
    notification.relatedEntityType
  );
  const timeAgo = notificationService.formatNotificationTime(
    notification.createdAt
  );
  const statusColor = notificationService.getNotificationPriorityColor(
    notification.status
  );

  return (
    <div
      className={`px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer ${
        isUnread ? "bg-blue-50 border-l-4 border-l-blue-500" : ""
      }`}
      onClick={handleNotificationClick}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 text-lg">{icon}</div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h4
                className={`text-sm font-medium ${
                  isUnread ? "text-gray-900" : "text-gray-700"
                }`}
              >
                {notification.subject}
              </h4>
              <p
                className={`text-sm mt-1 ${
                  isUnread ? "text-gray-800" : "text-gray-600"
                }`}
              >
                {notification.message}
              </p>

              {/* Metadata */}
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-gray-500">
                  {notificationService.getNotificationTypeDisplayName(
                    notification.relatedEntityType
                  )}
                </span>
                <span className="text-xs text-gray-400">•</span>
                <span className="text-xs text-gray-500">{timeAgo}</span>
                {notification.status !== 1 && (
                  <>
                    <span className="text-xs text-gray-400">•</span>
                    <span className={`text-xs ${statusColor}`}>
                      {notification.status === 0 ? "Unread" : "Failed"}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {isUnread && (
                <button
                  onClick={handleMarkAsRead}
                  className="p-1 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                  title="Mark as read"
                >
                  <Check className="h-3 w-3" />
                </button>
              )}

              <button
                onClick={handleDelete}
                className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                title="Delete notification"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
