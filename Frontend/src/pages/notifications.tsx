import React, { useState, useEffect } from "react";
import { Bell, Check, Trash2, RefreshCw, BellOff, Filter } from "lucide-react";
import { useNotifications } from "../context/NotificationContext";
import { NotificationItem } from "../components/notifications/NotificationItem";
import {
  NotificationDto,
  notificationService,
} from "../services/notificationService";

export default function NotificationsPage() {
  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    fetchNotifications,
    markAllAsRead,
    refreshNotifications,
    clearError,
  } = useNotifications();

  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
  const [filteredNotifications, setFilteredNotifications] = useState<
    NotificationDto[]
  >([]);

  const pageSize = 20;

  // Filter notifications based on selected filter
  useEffect(() => {
    let filtered = notifications;

    switch (filter) {
      case "unread":
        filtered = notifications.filter((n) => n.status === 0);
        break;
      case "read":
        filtered = notifications.filter((n) => n.status === 1);
        break;
      default:
        filtered = notifications;
    }

    setFilteredNotifications(filtered);
  }, [notifications, filter]);

  // Load more notifications when page changes
  useEffect(() => {
    fetchNotifications(currentPage, pageSize);
  }, [currentPage, fetchNotifications]);

  const handleMarkAllRead = async () => {
    await markAllAsRead();
  };

  const handleRefresh = async () => {
    await refreshNotifications();
  };

  const handleLoadMore = () => {
    setCurrentPage((prev) => prev + 1);
  };

  const handleFilterChange = (newFilter: "all" | "unread" | "read") => {
    setFilter(newFilter);
    setCurrentPage(1);
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
          <div className="text-red-500 mb-4">
            <Bell className="h-12 w-12 mx-auto" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Error Loading Notifications
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="space-y-2">
            <button
              onClick={clearError}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Bell className="h-7 w-7" />
                Notifications
              </h1>
              <p className="text-gray-600 mt-1">
                Stay updated with your project activities
              </p>
            </div>

            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  <Check className="h-4 w-4" />
                  Mark All Read
                </button>
              )}

              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <RefreshCw
                  className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
                />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { key: "all", label: "All", count: notifications.length },
                {
                  key: "unread",
                  label: "Unread",
                  count: notifications.filter((n) => n.status === 0).length,
                },
                {
                  key: "read",
                  label: "Read",
                  count: notifications.filter((n) => n.status === 1).length,
                },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() =>
                    handleFilterChange(tab.key as "all" | "unread" | "read")
                  }
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    filter === tab.key
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span
                      className={`ml-2 px-2 py-1 text-xs rounded-full ${
                        filter === tab.key
                          ? "bg-blue-100 text-blue-600"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Notifications List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {isLoading && notifications.length === 0 ? (
            <div className="p-8 text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
              <p className="text-gray-600">Loading notifications...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="p-8 text-center">
              <BellOff className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {filter === "unread"
                  ? "No unread notifications"
                  : filter === "read"
                  ? "No read notifications"
                  : "No notifications"}
              </h3>
              <p className="text-gray-600">
                {filter === "unread"
                  ? "You're all caught up!"
                  : filter === "read"
                  ? "No notifications have been marked as read yet."
                  : "You'll see notifications here when they arrive."}
              </p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-gray-100">
                {filteredNotifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                  />
                ))}
              </div>

              {/* Load More Button */}
              {notifications.length >= pageSize * currentPage && (
                <div className="p-4 border-t border-gray-200 text-center">
                  <button
                    onClick={handleLoadMore}
                    disabled={isLoading}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 transition-colors"
                  >
                    {isLoading ? "Loading..." : "Load More"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
