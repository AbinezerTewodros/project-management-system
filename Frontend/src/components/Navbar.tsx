import { useState, useRef, useEffect } from "react";
import {
  LogOut, Settings, ChevronRight, User, Lock,
  LogIn, UserPlus, LayoutDashboard,
  Building2, UserCog, Bell, Menu, Search, Sun, Moon,
  UserRound, CheckCircle2, MessageSquare
} from "lucide-react"; // Users, Briefcase, AlertCircle
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/components/NotificationContext";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";


type NavbarProps = {
  onToggleSidebar: () => void;
  darkMode: boolean;
  setDarkMode: (mode: boolean) => void;
};

const Navbar = ({ onToggleSidebar, darkMode, setDarkMode }: NavbarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAsRead } = useNotifications();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showManageOptions, setShowManageOptions] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);



  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
  };

  const handleLogout = () => {
    logout();
    setIsProfileOpen(false);
    navigate("/");
  };


  const isHomePage = location.pathname === "/";

  const getDashboardButton = () => {
    if (!user) return null;

    const roleConfig = {
      vicePresident: {
        icon: <UserCog size={18} className="mr-2" />,
        text: "VP Dashboard",
        path: "/dashboard/vp"
      },
      teamLeader: {
        icon: <LayoutDashboard size={18} className="mr-2" />,
        text: "Team Leader Dashboard",
        path: "/dashboard/team-leader"
      }
    };

    const config = roleConfig[user.role as keyof typeof roleConfig];
    if (!config) return null;

    return (





      <Button
        onClick={() => navigate(config.path)}
        className="bg-fuchsia-800 hover:bg-stone-800 text-white text-base py-1 px-3 hover:border-yellow-400 rounded"
      >
        {config.icon} {config.text}
      </Button>
    );
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
        setShowManageOptions(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getNotificationColor = (type: 'project' | 'task' | 'message') => {
    switch (type) {
      case 'project':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'task':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'message':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getNotificationIcon = (type: 'project' | 'task' | 'message') => {
    switch (type) {
      case 'project':
        return <Building2 className="h-4 w-4" />;
      case 'task':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'message':
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  return (
    <nav className={`absolute top-0 left-0 w-full h-16 flex items-center px-6 bg-opacity-50 backdrop-blur-md
             shadow-md z-50 border-b ${darkMode ? "bg-zinc-800 border-gray-700" : "bg-white border-gray-100"}`}>
      <div className="max-w-7xl mx-auto w-full flex justify-between items-center">
        {/* Menu button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onToggleSidebar}
          className={`fixed left-3 p-2 rounded-full transition-colors ${darkMode ? "hover:bg-zinc-700" : "hover:bg-purple-200"}`}>
          <Menu size={24} className={darkMode ? "text-gray-200" : "text-purple-900"} />
        </motion.button>

        {/* Brand */}
        <div className="fixed left-16 flex items-center space-x-4">
          <img src="/CBE.jpg" alt="CBE Logo" className="h-10 w-auto object-contain" />
          <span className="text-xl font-semibold text-gray-800 dark:text-white hidden sm:inline ">CBE Project Management System</span>
        </div>

        {/* Right-side tools */}
        <div className="fixed right-4 flex items-center space-x-4">
          {!user ? (
            isHomePage && (
              <>
                <Button onClick={() => navigate("/login")} className="bg-fuchsia-800 text-white text-sm px-4 py-1 rounded">
                  <LogIn size={16} className="mr-1" /> Sign In
                </Button>
                <Button onClick={() => navigate("/signup")} className="bg-fuchsia-800 text-white text-sm px-4 py-1 rounded">
                  <UserPlus size={16} className="mr-1" /> Sign Up
                </Button>
              </>
            )
          ) : (
            <>
              {getDashboardButton()}
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                  placeholder="Search..."
                  className={`w-40 pl-4 pr-10 py-1 rounded-full border border-transparent focus:shadow-sm focus:outline-none transition-all duration-200
                    ${darkMode ? "bg-zinc-700 text-white focus:border-gray-500 focus:bg-zinc-700" : "bg-gray-100 focus:border-purple-900 focus:bg-white"}
                    ${isSearchFocused ? "md:w-56 scale-105" : ""}`}
                />
                <Search size={18} className={`absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none
                  ${darkMode ? "text-gray-300" : "text-purple-900"} ${isSearchFocused ? "right-3" : ""}`} />
              </form>
              <button onClick={() => setDarkMode(!darkMode)}
                className={`p-2 rounded-full cursor-pointer ${darkMode ? "hover:bg-zinc-700" : "hover:bg-purple-200"}`}>
                {darkMode ? (
                  <Sun size={20} />
                ) : (
                  <Moon className="text-purple-900" size={20} />
                )}
              </button>
              <div className="relative" ref={notificationRef}>
                <button
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                  className={`p-2 rounded-full cursor-pointer relative ${darkMode ? "hover:bg-zinc-700" : "hover:bg-purple-200"}`}>
                  <Bell className={darkMode ? "text-gray-300" : "text-purple-900"} size={20} />
                  {unreadCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white text-xs">
                      {unreadCount}
                    </Badge>
                  )}
                </button>

                {isNotificationsOpen && (
                  <div className={`fixed right-8 top-20 mt-2 w-80 shadow-lg rounded-lg overflow-hidden border max-h-96 overflow-y-auto
                    ${darkMode ? "bg-zinc-800 border-gray-700" : "bg-white border-gray-200"}`}>
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                      <h3 className="font-semibold text-lg">Notifications</h3>
                    </div>
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                          No notifications
                        </div>
                      ) : (
                        notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className={`p-4 hover:bg-gray-50 dark:hover:bg-zinc-700 cursor-pointer transition-colors
                              ${!notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                            onClick={() => markAsRead(notification.id)}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`p-2 rounded-full ${getNotificationColor(notification.type)}`}>
                                {getNotificationIcon(notification.type)}
                              </div>
                              <div className="flex-1">
                                <p className="font-medium text-sm">{notification.title}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                                  {notification.message}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                  {new Date(notification.timestamp).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="relative" ref={dropdownRef}>
                <button
                  className={`p-2 rounded-full cursor-pointer ${darkMode ? "bg-zinc-700 hover:bg-zinc-600" : "bg-purple-900 hover:bg-purple-800"}`}
                  onClick={() => setIsProfileOpen(!isProfileOpen)}>
                  {user?.image ? (
                    <img
                      src={user.image}
                      alt="Profile"
                      className="rounded-full w-7 h-7 object-cover border-2 border-white shadow"
                    />
                  ) : (
                    <UserRound className="text-white" size={18} />
                  )}
                </button>

                {isProfileOpen && (
                  <div className={`fixed right-8 top-20 mt-2 w-72 shadow-lg rounded-lg overflow-hidden border ${darkMode ? "bg-zinc-800 border-gray-700" : "bg-white border-gray-200"
                    }`}>
                    <div className="flex items-center p-4">
                      <img
                        src={user?.image || "https://t4.ftcdn.net/jpg/05/89/93/27/360_F_589932782_vQAEAZhHnq1QCGu5ikwrYaQD0Mmurm0N.jpg"}
                        alt="Profile"
                        className="rounded-full w-12 h-12 object-cover mr-4"
                      />
                      <div>
                        <h3 className="font-semibold text-gray-800">{user.name}</h3>
                        <p className="text-sm text-gray-600">{user.email}</p>
                        <p className="text-xs text-fuchsia-800 font-medium capitalize mt-1">{user.role}</p>
                      </div>
                    </div>
                    <div className="p-2 border-t border-gray-100">
                      <button
                        className="flex w-full items-center justify-between px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                        onClick={() => setShowManageOptions(!showManageOptions)}
                      >
                        <div className="flex items-center">
                          <Settings size={18} className="mr-2" /> Manage Account
                        </div>
                        <ChevronRight
                          size={18}
                          className={`transition-transform ${showManageOptions ? "rotate-90" : "rotate-0"}`}
                        />
                      </button>
                      {showManageOptions && (
                        <div className="ml-8 mt-1 mb-2 space-y-1">
                          <button
                            onClick={() => {
                              setIsProfileOpen(false);
                              navigate("/profile");
                            }}
                            className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                          >
                            <User size={16} className="mr-2" /> Profile
                          </button>
                          <button
                            onClick={() => {
                              setIsProfileOpen(false);
                              navigate("/profile/edit-profile");
                            }}
                            className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                          >
                            <User size={16} className="mr-2" /> Edit Profile
                          </button>
                          <button
                            onClick={() => {
                              setIsProfileOpen(false);
                              navigate("/profile/change-password");
                            }}
                            className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                          >
                            <Lock size={16} className="mr-2" /> Change Password
                          </button>
                        </div>
                      )}
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                      >
                        <LogOut size={18} className="mr-2" /> Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
