import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Bell, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/utils/dateUtils";
import { notificationService, Notification } from "@/services/notificationService";
import { projectTaskService, ProjectTaskReadDto } from "@/services/projectTaskService";
import { useEffect, useState } from "react";

export const DashboardRoleHandler = ({ 
  darkMode, 
  alerts 
}: { 
  darkMode: boolean; 
  alerts: any[]; 
}) => {
  const { user } = useAuth();
  const userRole = user?.role || 'member';
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<ProjectTaskReadDto[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch real data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch notifications
        try {
          const notificationsResponse = await notificationService.getUserNotifications();
          if (notificationsResponse.success && notificationsResponse.data && Array.isArray(notificationsResponse.data)) {
            setNotifications(notificationsResponse.data);
          } else {
            setNotifications([]);
          }
        } catch (notificationError) {
          console.warn('Failed to fetch notifications:', notificationError);
          setNotifications([]);
        }

        // Fetch tasks with upcoming deadlines
        try {
          const tasksResponse = await projectTaskService.getAllTasks();
          if (tasksResponse.success && tasksResponse.data) {
            const tasks = tasksResponse.data.items || [];
            // Filter tasks with upcoming deadlines (due within next 7 days)
            const upcoming = tasks.filter(task => {
              if (!task.dueDate) return false;
              const dueDate = new Date(task.dueDate);
              const today = new Date();
              const diffTime = dueDate.getTime() - today.getTime();
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              return diffDays >= 0 && diffDays <= 7;
            });
            setUpcomingDeadlines(upcoming);
          } else {
            setUpcomingDeadlines([]);
          }
        } catch (taskError) {
          console.warn('Failed to fetch tasks:', taskError);
          setUpcomingDeadlines([]);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []); // Default to member if role not specified

  const getScrollableContainerClass = (count: number) =>
    count > 2 ? "max-h-36 overflow-y-auto pr-2" : "max-h-28 overflow-hidden";

  // For members: Show notifications and deadlines instead of critical alerts
  if (userRole === 'member') {
    if (loading) {
      return (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 w-full">
          <Card className="w-full transition-all duration-200">
            <CardHeader>
              <CardTitle className={`flex items-center gap-2 text-lg sm:text-xl ${darkMode ? "text-gray-300" : ""}`}>
                <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                Loading...
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className={`grid gap-4 grid-cols-1 md:grid-cols-2 w-full ${darkMode 
        ? 'bg-zinc-800 border-zinc-700 hover:border-zinc-600' 
        : 'bg-white border-gray-200 hover:border-gray-300'
      }`}>
        {/* New Assignments */}
        <Card className={`w-full transition-all duration-200  ${darkMode ? "bg-zinc-800 text-gray-300 border-zinc-700" : "bg-white text-gray-700 border-gray-200"}`}>
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 text-lg sm:text-xl `}>
              <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
              New Assignments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`${getScrollableContainerClass(notifications.length)} space-y-2 sm:space-y-3`}>
              {notifications.length > 0 ? (
                notifications.map((notification) => (
                  <div key={notification.id} className={`p-2 sm:p-3 rounded-lg border ${darkMode ? "bg-zinc-800/50 border-zinc-700" : "bg-gray-50 border-gray-200"}`}>
                    <h4 className={`font-base text-sm sm:text-base ${darkMode ? "text-gray-200" : "text-gray-800"} mb-2`}>
                      {notification.title}
                    </h4>
                    <div className="flex flex-row justify-between items-center gap-2 ">
                      <p className={`text-xs sm:text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                        {notification.message}
                      </p>
                      <span className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                        {formatDate(notification.timestamp)}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  No new assignments
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Deadlines */}
        <Card className={`w-full transition-all duration-200  ${darkMode ? "bg-zinc-800 text-gray-300 border-zinc-700" : "bg-white text-gray-700 border-gray-200"}`}>
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 text-lg sm:text-xl ${darkMode ? "text-gray-300" : ""}`}>
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
              Upcoming Deadlines
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`${getScrollableContainerClass(upcomingDeadlines.length)} space-y-2 sm:space-y-3`}>
              {upcomingDeadlines.length > 0 ? (
                upcomingDeadlines.map((deadline) => (
                  <div key={deadline.id} className={`p-2 sm:p-3 rounded-lg border ${darkMode ? "bg-zinc-800/50 border-zinc-700" : "bg-gray-50 border-gray-200"}`}>
                    <h4 className={`text-base ${darkMode ? "text-gray-200" : "text-gray-800"} mb-1`}>
                      {deadline.title}
                    </h4>
                    <div className="flex flex-row justify-between items-center gap-2">
                      <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                        Project: {deadline.projectName || 'N/A'}
                      </p>
                      <span className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                        Due: {formatDate(deadline.dueDate)}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  No upcoming deadlines
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // For managers, directors, VPs, and presidents: Show critical alerts + notifications and deadlines
  if (loading) {
    return (
      <div className="w-full">
        <Card className={`w-full transition-all duration-200  ${darkMode ? "bg-zinc-800 text-gray-300 border-zinc-700" : "bg-white text-gray-700 border-gray-200"}`}>
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 text-lg sm:text-xl ${darkMode ? "text-gray-300" : ""}`}>
              <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
              Loading...
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      {/* Critical Alerts */}
      <Card className={`w-full hover:shadow-lg transition-all duration-200 ${darkMode 
              ? 'bg-zinc-800 border-zinc-700 hover:border-zinc-600' 
              : 'bg-white border-gray-200 hover:border-gray-300'
            }`}>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 text-lg sm:text-xl 
            `}>
            <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
            Critical Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-48 overflow-y-auto space-y-3 sm:space-y-4 pr-2">
            {alerts.length > 0 ? (
              alerts.map((alert) => (
                <div key={alert.id} className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 rounded-lg border ${darkMode ? "bg-zinc-800/50 border-zinc-700" : "bg-gray-50 border-gray-200"}`}>
                  <div className="flex-1 mb-3 sm:mb-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className={`font-base text-sm sm:text-base ${darkMode ? "text-gray-200" : "text-gray-800"}`}>
                        {alert.title}
                      </h4>
                      <Badge variant="outline" className={
                        alert.severity === 'high' 
                          ? 'bg-red-100 text-red-800 border-red-300' 
                          : alert.severity === 'medium'
                          ? 'bg-yellow-100 text-yellow-800 border-yellow-300'
                          : 'bg-blue-100 text-blue-800 border-blue-300'
                      }>
                        {(alert.severity || 'Info').charAt(0).toUpperCase() + (alert.severity || 'Info').slice(1)}
                      </Badge>
                    </div>
                    <p className={`text-xs sm:text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                      {alert.description}
                    </p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                        Assigned to: {alert.assignedTo}
                      </span>
                      <span className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                        {formatDate(alert.date)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-gray-500">
                No critical alerts
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Additional sections for managers and above */}
      <div className={`grid gap-4 grid-cols-1 md:grid-cols-2 w-full `}>
        {/* New Assignments */}
        <Card className={`w-full max-h-42 hover:shadow-lg transition-all duration-200 ${darkMode 
              ? 'bg-zinc-800 border-zinc-700 hover:border-zinc-600' 
              : 'bg-white border-gray-200 hover:border-gray-300'
            }`}>
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 text-lg sm:text-xl ${darkMode ? "text-gray-300" : ""}`}>
              <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
              Team Assignments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`${getScrollableContainerClass(notifications.length)} space-y-2 sm:space-y-3`}>
              {notifications.length > 0 ? (
                notifications.map((notification) => (
                  <div key={notification.id} className={`p-2 sm:p-3 rounded-lg border ${darkMode ? "bg-zinc-800/50 border-zinc-700" : "bg-gray-50 border-gray-200"}`}>
                    <h4 className={`font-base text-sm sm:text-base ${darkMode ? "text-gray-200" : "text-gray-800"} mb-2`}>
                      {notification.title}
                    </h4>
                    <div className="flex flex-row justify-between items-center gap-2">
                      <p className={`text-xs sm:text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                        {notification.message}
                      </p>
                      <span className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                        {formatDate(notification.timestamp)}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  No team assignments
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Deadlines */}
        <Card className={`w-full hover:shadow-lg transition-all duration-200 ${darkMode 
              ? 'bg-zinc-800 border-zinc-700 hover:border-zinc-600' 
              : 'bg-white border-gray-200 hover:border-gray-300'
            }`}>
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 text-lg sm:text-xl ${darkMode ? "text-gray-300" : ""}`}>
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
              Team Deadlines
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`${getScrollableContainerClass(upcomingDeadlines.length)} space-y-2 sm:space-y-3`}>
              {upcomingDeadlines.length > 0 ? (
                upcomingDeadlines.map((deadline) => (
                  <div key={deadline.id} className={`p-2 sm:p-3 rounded-lg border ${darkMode ? "bg-zinc-800/50 border-zinc-700" : "bg-gray-50 border-gray-200"}`}>
                    <h4 className={`font-base text-sm sm:text-base ${darkMode ? "text-gray-200" : "text-gray-800"} mb-1`}>
                      {deadline.title}
                    </h4>
                    <div className="flex flex-row justify-between items-center gap-2">
                      <p className={`text-xs sm:text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                        Project: {deadline.projectName || 'N/A'}
                      </p>
                      <span className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                        Due: {formatDate(deadline.dueDate)}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  No upcoming deadlines
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};