"use client";

import type React from "react";

import { formatDistanceToNow } from "date-fns";
import {
  ExternalLink,
  Trash2,
  AlertTriangle,
  Info,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/context/NotificationContext";
import { type Notification, NotificationType } from "@/types/notification";
import { cn } from "@/lib/utils";

interface NotificationItemProps {
  notification: Notification;
  onClose?: () => void;
}

export function NotificationItem({
  notification,
  onClose,
}: NotificationItemProps) {
  const { markAsRead, deleteNotification } = useNotifications();

  const handleClick = () => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    if (notification.actionUrl && onClose) {
      onClose();
      // In a real app, you would navigate to the URL
      console.log("[v0] Navigate to:", notification.actionUrl);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteNotification(notification.id);
  };

  const getIcon = () => {
    switch (notification.type) {
      case NotificationType.URGENT:
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case NotificationType.WARNING:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case NotificationType.SUCCESS:
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getBorderColor = () => {
    switch (notification.type) {
      case NotificationType.URGENT:
        return "border-l-red-500";
      case NotificationType.WARNING:
        return "border-l-yellow-500";
      case NotificationType.SUCCESS:
        return "border-l-green-500";
      default:
        return "border-l-blue-500";
    }
  };

  return (
    <div
      className={cn(
        "p-4 hover:bg-muted/50 cursor-pointer border-l-4 transition-colors",
        getBorderColor(),
        !notification.isRead && "bg-blue-50/50"
      )}
      onClick={handleClick}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 mt-0.5">{getIcon()}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p
                className={cn(
                  "text-sm font-medium text-foreground",
                  !notification.isRead && "font-semibold"
                )}
              >
                {notification.title}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {notification.message}
              </p>
              <div className="flex items-center space-x-2 mt-2">
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(notification.createdAt), {
                    addSuffix: true,
                  })}
                </p>
                {notification.actionUrl && (
                  <ExternalLink className="h-3 w-3 text-muted-foreground" />
                )}
              </div>
            </div>
            <div className="flex items-center space-x-1 ml-2">
              {!notification.isRead && (
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
