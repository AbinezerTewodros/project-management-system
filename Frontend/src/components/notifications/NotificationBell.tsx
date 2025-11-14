import React, { useState, useRef, useEffect } from "react";
import { Bell, X, Check, Trash2, RefreshCw } from "lucide-react";
import { useNotifications } from "../../context/NotificationContext";
import { NotificationDropdown } from "./NotificationDropdown";
import { NotificationItem } from "./NotificationItem";

export const NotificationBell: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { unreadCount, isLoading, refreshNotifications } = useNotifications();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleRefresh = async () => {
    await refreshNotifications();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon */}
      <button
        onClick={toggleDropdown}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors duration-200"
        aria-label="Notifications"
      >
        <Bell className="h-6 w-6" />

        {/* Unread Count Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
          </div>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && <NotificationDropdown onClose={() => setIsOpen(false)} />}
    </div>
  );
};
