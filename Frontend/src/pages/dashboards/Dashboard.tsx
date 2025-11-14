import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import {Card,CardContent,CardDescription,CardHeader,CardTitle} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, AlertCircle, Clock, ArrowUpRight, CheckCircle2, Folder, List, Plus, Eye, EyeOff, BarChart3, Table, Settings, X, TrendingUp, Calendar, Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid 
} from 'recharts';
import DataTables, {columnConfigs} from "@/components/DataTables";
import { useNavigate } from "react-router-dom";
import ProjectDetailView from "../Projects/ProjectDetailView";
interface DashboardProps {
  darkMode: boolean;
  setDarkMode: (darkMode: boolean) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const Dashboard = ({
  darkMode,
  setDarkMode,
  sidebarOpen,
  setSidebarOpen,
}: DashboardProps) => {
  const { user } = useAuth();
  const [filterContext, setFilterContext] = useState<'assigned' | 'created'>('assigned');
  const [dataType, setDataType] = useState<'tasks' | 'projects'>('projects');
  const [tasks, setTasks] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // New state variables for enhanced features
  const [viewMode, setViewMode] = useState<'table' | 'chart'>('table');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [filteredDatas, setFilteredDatas] = useState<any[]>([]);
  const [detailData, setDetailData] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [chartType, setChartType] = useState<'both' | 'pie' | 'bar'>('both');
  const [teamAssignments, setTeamAssignments] = useState<any[]>([]);
  const [teamDeadlines, setTeamDeadlines] = useState<any[]>([]);
  const navigate = useNavigate();
// Add this function to create custom columns based on visibility


const calculateTeamData = (projectsData: any[]) => {
  // Calculate team assignments (projects assigned to user's team)
  const userTeamAssignments = projectsData.filter(project => 
    project.assignedTo === user?.email || 
    project.assignedTo === user?.id ||
    project.teamMembers?.some((member: any) => 
      member.email === user?.email || member.id === user?.id
    )
  );
  setTeamAssignments(userTeamAssignments);

  // Calculate upcoming deadlines (within next 7 days)
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  
  const upcomingDeadlines = projectsData.filter(project => {
    if (!project.dueDate) return false;
    const dueDate = new Date(project.dueDate);
    return dueDate <= nextWeek && dueDate >= new Date();
  }).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  
  setTeamDeadlines(upcomingDeadlines);
};

  // Fetch data from APIs
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch projects
      try {
        const response = await fetch('http://localhost:8080/api/Project/All-projects', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
            "Content-Type": "application/json",
          },
        });
        if (response.ok) {
          const projectsData = await response.json();
          setProjects(projectsData);
          setFilteredDatas(projectsData);
          calculateTeamData(projectsData);
        } else {
          setProjects([]);
          setFilteredDatas([]);
          setTeamAssignments([]);
          setTeamDeadlines([]);
        }
      } catch (projectError) {
        console.warn('Failed to fetch projects:', projectError);
        setProjects([]);
        setFilteredDatas([]);
        setTeamAssignments([]);
        setTeamDeadlines([]);
      }

      // Fetch tasks (placeholder - replace with your actual tasks API)
      try {
        setTasks([]); // Replace with actual tasks API call
      } catch (taskError) {
        console.warn('Failed to fetch tasks:', taskError);
        setTasks([]);
      }

      // Fetch alerts (critical notifications)
    try {
      // Replace with your actual alerts API call
      const criticalAlerts = [
        { id: 1, title: 'Server maintenance scheduled', type: 'system', priority: 'high' },
        { id: 2, title: 'Database backup failed', type: 'system', priority: 'critical' },
      ];
      setAlerts(criticalAlerts);
    } catch (alertError) {
      console.warn('Failed to fetch alerts:', alertError);
      setAlerts([]);
    }

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Get greeting and formatted date
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getFormattedDate = () => {
    return new Date().toLocaleDateString(undefined, { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });                   
  };

  // Calculate statistics based on filter context
  const getFilteredData = () => {
    if (dataType === 'tasks') {
      return filterContext === 'assigned' 
        ? tasks.filter(task => task.assignedMemberId === user?.employeeId)
        : tasks.filter(task => task.createdBy === user?.employeeId);
    } else {
      return filterContext === 'assigned'
        ? projects.filter(project => 
            project.status === 'Active' || 
            project.status === 'active' ||
            (project as any).approvalStatus === 'Approved'
          )
        : projects.filter(project => 
            project.createdBy === user?.employeeId || 
            project.createdBy === user?.id ||
            (project as any).createdByUserId === user?.id
          );
    }
  };

  const filteredData = getFilteredData();

  // Fetch data on component mount
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Apply status filter when clicked on cards
  useEffect(() => {
    if (statusFilter) {
      const filtered = projects.filter(item => {
        const status = item.status?.toLowerCase();
        const filter = statusFilter.toLowerCase();
        
        if (filter === 'active') return status === 'active';
        if (filter === 'completed') return status === 'completed';
        if (filter === 'on hold') return status === 'onhold' || status === 'on hold';
        if (filter === 'blocked') return status === 'blocked';
        return true;
      });
      setFilteredDatas(filtered);
    } else {
      setFilteredDatas(projects);
    }
  }, [statusFilter, projects]);

  // Recalculate team data when projects change
useEffect(() => {
  if (projects.length > 0) {
    calculateTeamData(projects);
  }
}, [projects]);

  // Calculate stats for cards
  const getStats = () => {
    const statusCounts = {
      active: 0,
      completed: 0,
      onHold: 0,
      blocked: 0,
      total: projects.length
    };

    projects.forEach(project => {
      const status = project.status?.toLowerCase();
      if (status === 'active') statusCounts.active++;
      else if (status === 'completed') statusCounts.completed++;
      else if (status === 'onhold' || status === 'on hold') statusCounts.onHold++;
      else if (status === 'blocked') statusCounts.blocked++;
    });

    return statusCounts;
  };

  const stats = getStats();

  // Prepare chart data
  const getPieChartData = () => {
    return [
      { name: 'Active', value: stats.active, color: '#10B981' },
      { name: 'Completed', value: stats.completed, color: '#3B82F6' },
      { name: 'On Hold', value: stats.onHold, color: '#F59E0B' },
      { name: 'Blocked', value: stats.blocked, color: '#EF4444' },
    ].filter(item => item.value > 0);
  };

  // Prepare bar chart data - Projects by Priority
  const getBarChartData = () => {
    const priorityCounts = {
      High: 0,
      Medium: 0,
      Low: 0
    };

    filteredDatas.forEach(project => {
      const priority = project.priority;
      if (priorityCounts.hasOwnProperty(priority)) {
        priorityCounts[priority]++;
      }
    });

    return [
      { name: 'High', count: priorityCounts.High, color: '#EF4444' },
      { name: 'Medium', count: priorityCounts.Medium, color: '#F59E0B' },
      { name: 'Low', count: priorityCounts.Low, color: '#10B981' },
    ];
  };

  // Prepare bar chart data - Projects by Department
  const getDepartmentChartData = () => {
    const departmentCounts: { [key: string]: number } = {};

    filteredDatas.forEach(project => {
      const department = project.department || 'Unknown';
      departmentCounts[department] = (departmentCounts[department] || 0) + 1;
    });

    return Object.entries(departmentCounts).map(([name, count]) => ({
      name: name.length > 10 ? name.substring(0, 10) + '...' : name,
      fullName: name,
      count,
      color: `hsl(${Math.random() * 360}, 70%, 50%)` // Generate random colors
    }));
  };

  const pieChartData = getPieChartData();
  const priorityChartData = getBarChartData();
  const departmentChartData = getDepartmentChartData();

  // Toggle column visibility
 

  // Handle card click for filtering
  const handleCardClick = (filter: string | null) => {
    setStatusFilter(filter === statusFilter ? null : filter);
  };

 const handleProjectClick = (projectId: string) => {
    navigate(`/dashboard/${user?.role?.toLowerCase()}/projects/${projectId}`);
  };

  const closeModal = () => {
    setShowDetails(false);
    setDetailData(null);
  };

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className={`
          p-3 rounded-lg border shadow-lg
          ${darkMode ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-gray-200 text-gray-900'}
        `}>
          <p className="font-semibold">{payload[0].payload.fullName || label}</p>
          <p className="text-sm">
            {payload[0].name}: {payload[0].value}
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className={darkMode ? "text-gray-300" : "text-gray-600"}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️</div>
          <p className={`mb-4 ${darkMode ? "text-red-400" : "text-red-600"}`}>{error}</p>
          <button 
            onClick={fetchDashboardData}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 w-full p-4 sm:p-6 transition-all duration-200 min-h-screen ${
      darkMode ? ' text-gray-100' : ' text-gray-900'
    }`}>
      
      {/* Header Section with Greeting and Filter Buttons */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        {/* Left side - Greeting and Date */}
        <div>
          <h2 className={`text-3xl sm:text-3xl font-bold tracking-tight ${
            darkMode 
              ? "text-gray-300" 
              : "bg-gradient-to-r from-fuchsia-800 to-stone-800 bg-clip-text text-transparent"
          }`}>
            {getGreeting()}, {user?.email?.split("@")[0]}!
          </h2>
          <p className={`mt-1 ml-1 text-sm sm:text-base ${
            darkMode ? "text-gray-400" : "text-gray-600"
          }`}>
            {getFormattedDate()}
          </p>
        </div>

        {/* Right side - Filter Buttons */}
        {/* <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={() => setFilterContext('assigned')}
            variant="ghost"
            className={`${
              filterContext === 'assigned'
                ? darkMode
                  ? "bg-zinc-700 hover:bg-zinc-600 text-white shadow-lg"
                  : "bg-purple-900 hover:bg-purple-800 text-white shadow-lg"
                : darkMode
                ? "bg-zinc-800 hover:bg-zinc-700 text-gray-300"
                : "bg-white hover:bg-gray-100 text-gray-700 border"
            } transition-all duration-200 text-sm sm:text-base font-medium`}
          >
            <Users className="mr-2 h-4 w-4" />
            Assigned to Me
          </Button>
          <Button
            onClick={() => setFilterContext('created')}
            variant="ghost"
            className={`${
              filterContext === 'created'
                ? darkMode
                  ? "bg-zinc-700 hover:bg-zinc-600 text-white shadow-lg"
                  : "bg-purple-900 hover:bg-purple-800 text-white shadow-lg"
                : darkMode
                ? "bg-zinc-800 hover:bg-zinc-700 text-gray-300"
                : "bg-white hover:bg-gray-100 text-gray-700 border"
            } transition-all duration-200 text-sm sm:text-base font-medium`}
          >
            <Plus className="mr-2 h-4 w-4" />
            Created by Me
          </Button>
        </div> */}
      </div>
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
  {/* Left Column - Critical Alerts */}
  <div className="space-y-6">
    {/* Critical Alerts */}
    <Card className={`
      transition-all duration-200 border
      ${darkMode 
        ? 'bg-zinc-800 border-zinc-700' 
        : 'bg-white border-gray-200'
      }
    `}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <AlertCircle className={`h-5 w-5 ${alerts.length > 0 ? 'text-red-500' : 'text-gray-400'}`} />
          <CardTitle className={`text-lg ${darkMode ? "text-white" : "text-gray-900"}`}>
            Critical Alerts
          </CardTitle>
          {alerts.length > 0 && (
            <Badge variant="destructive" className="ml-2">
              {alerts.length}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {alerts.length > 0 ? (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-3 rounded-lg border-l-4 ${
                  alert.priority === 'critical' 
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20' 
                    : 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                }`}
              >
                <div className="flex items-start gap-3">
                  <Bell className={`h-4 w-4 mt-0.5 ${
                    alert.priority === 'critical' ? 'text-red-500' : 'text-orange-500'
                  }`} />
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${
                      darkMode ? "text-white" : "text-gray-900"
                    }`}>
                      {alert.title}
                    </p>
                    <p className={`text-xs ${
                      darkMode ? "text-gray-400" : "text-gray-600"
                    }`}>
                      {alert.type === 'system' ? 'System Alert' : 'Notification'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4">
            <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className={darkMode ? "text-gray-400" : "text-gray-600"}>
              No critical alerts
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  </div>

  {/* Right Column - Team Deadlines & Additional Info */}
  <div className="space-y-6">
    {/* Team Deadlines */}
    <Card className={`
      transition-all duration-200 border
      ${darkMode 
        ? 'bg-zinc-800 border-zinc-700' 
        : 'bg-white border-gray-200'
      }
    `}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-purple-500" />
          <CardTitle className={`text-lg ${darkMode ? "text-white" : "text-gray-900"}`}>
            Upcoming Deadlines
          </CardTitle>
          {teamDeadlines.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {teamDeadlines.length}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {teamDeadlines.length > 0 ? (
          <div className="space-y-3">
            {teamDeadlines.slice(0, 5).map((deadline) => {
              const dueDate = new Date(deadline.dueDate);
              const today = new Date();
              const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
              
              return (
                <div
                  key={deadline.id}
                  className={`p-3 rounded-lg border-l-4 ${
                    daysUntilDue <= 1 
                      ? 'border-red-500 bg-red-50 dark:bg-red-900/20' 
                      : daysUntilDue <= 3 
                      ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                      : 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm font-medium ${darkMode ? "text-white" : "text-gray-900"}`}>
                        {deadline.title || deadline.projectName}
                      </p>
                      <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                        Due: {dueDate.toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant={
                      daysUntilDue <= 1 ? 'destructive' : 
                      daysUntilDue <= 3 ? 'default' : 'secondary'
                    }>
                      {daysUntilDue === 0 ? 'Today' : 
                       daysUntilDue === 1 ? 'Tomorrow' : 
                       `${daysUntilDue} days`}
                    </Badge>
                  </div>
                </div>
              );
            })}
            {teamDeadlines.length > 5 && (
              <p className={`text-xs text-center ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                +{teamDeadlines.length - 5} more deadlines
              </p>
            )}
          </div>
        ) : (
          <div className="text-center py-4">
            <p className={darkMode ? "text-gray-400" : "text-gray-600"}>
              No upcoming deadlines
            </p>
          </div>
        )}
      </CardContent>
    </Card>

   
  </div>
</div>

      {/* Overview Cards - Now Clickable */}
      <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 w-full">
        {[
          {
            title: "Total Projects",
            value: stats.total,
            icon: Folder,
            description: "All projects",
            filter: null,
            color: darkMode ? "text-fuchsia-400" : "text-fuchsia-600",
            active: statusFilter === null
          },
          {
            title: "Active",
            value: stats.active,
            icon: Clock,
            description: "Currently active",
            filter: "active",
            color: darkMode ? "text-green-400" : "text-green-600",
            active: statusFilter === "active"
          },
          {
            title: 'Completed',
            value: stats.completed,
            icon: CheckCircle2,
            description: "Successfully finished",
            filter: "completed",
            color: darkMode ? "text-blue-400" : "text-blue-600",
            active: statusFilter === "completed"
          },
          {
            title: 'On Hold',
            value: stats.onHold,
            icon: AlertCircle,
            description: "Needs attention",
            filter: "on hold",
            color: darkMode ? "text-yellow-400" : "text-yellow-600",
            active: statusFilter === "on hold"
          }
        ].map((card, index) => (
          <Card 
            key={index} 
            className={`
              hover:shadow-lg transition-all duration-200 border cursor-pointer
              ${darkMode 
                ? 'bg-zinc-800 border-zinc-700 hover:border-zinc-600' 
                : 'bg-white border-gray-200 hover:border-gray-300'
              }
              ${card.active ? (darkMode ? 'ring-2 ring-purple-500' : 'ring-2 ring-purple-600') : ''}
            `}
            onClick={() => handleCardClick(card.filter)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className={`text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                {card.title}
              </CardTitle>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
                {card.value}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <ArrowUpRight className="h-3 w-3 text-green-500" />
                <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                  {card.description}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Critical Alerts & Team Sections */}


      {/* Data Table/Chart Section */}
      <Card className={`
        w-full transition-all duration-200 border
        ${darkMode 
          ? 'bg-zinc-800 border-zinc-700' 
          : 'bg-white border-gray-200'
        }
      `}>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className={darkMode ? "text-white" : "text-gray-900"}>
                {dataType === 'tasks' ? 'Tasks' : 'Projects'}
                {statusFilter && (
                  <Badge variant="secondary" className="ml-2">
                    Filtered: {statusFilter}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className={darkMode ? "text-gray-400" : "text-gray-600"}>
                {viewMode === 'table' 
                  ? `Manage and monitor all your ${filterContext === 'assigned' ? 'assigned' : 'created'} ${dataType}`
                  : `Visual representation of ${dataType} data`
                }
              </CardDescription>
            </div>
            
            {/* Control Buttons */}
            <div className="flex flex-wrap gap-2">
              {/* Data Type Toggle */}
              <div className="flex gap-1 bg-gray-100 dark:bg-zinc-700 rounded-lg p-1">
                <Button
                  onClick={() => setDataType('projects')}
                  variant="ghost"
                  size="sm"
                  className={`${
                    dataType === 'projects'
                      ? darkMode
                        ? "bg-zinc-600 hover:bg-zinc-500 text-white"
                        : "bg-white shadow text-gray-900"
                      : "bg-transparent hover:bg-gray-200 dark:hover:bg-zinc-600 text-gray-600 dark:text-gray-300"
                  } transition-all duration-200`}
                >
                  <Folder className="mr-2 h-4 w-4" />
                  Projects
                </Button>
                {/* <Button
                  onClick={() => setDataType('tasks')}
                  variant="ghost"
                  size="sm"
                  className={`${
                    dataType === 'tasks'
                      ? darkMode
                        ? "bg-zinc-600 hover:bg-zinc-500 text-white"
                        : "bg-white shadow text-gray-900"
                      : "bg-transparent hover:bg-gray-200 dark:hover:bg-zinc-600 text-gray-600 dark:text-gray-300"
                  } transition-all duration-200`}
                >
                  <List className="mr-2 h-4 w-4" />
                  Tasks
                </Button> */}
              </div>

              {/* View Mode Toggle */}
              <div className="flex gap-1 bg-gray-100 dark:bg-zinc-700 rounded-lg p-1">
                <Button
                  onClick={() => setViewMode('table')}
                  variant="ghost"
                  size="sm"
                  className={`${
                    viewMode === 'table'
                      ? darkMode
                        ? "bg-zinc-600 hover:bg-zinc-500 text-white"
                        : "bg-white shadow text-gray-900"
                      : "bg-transparent hover:bg-gray-200 dark:hover:bg-zinc-600 text-gray-600 dark:text-gray-300"
                  } transition-all duration-200`}
                >
                  <Table className="mr-2 h-4 w-4" />
                  Table
                </Button>
                <Button
                  onClick={() => setViewMode('chart')}
                  variant="ghost"
                  size="sm"
                  className={`${
                    viewMode === 'chart'
                      ? darkMode
                        ? "bg-zinc-600 hover:bg-zinc-500 text-white"
                        : "bg-white shadow text-gray-900"
                      : "bg-transparent hover:bg-gray-200 dark:hover:bg-zinc-600 text-gray-600 dark:text-gray-300"
                  } transition-all duration-200`}
                >
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Charts
                </Button>
              </div>

              {/* Chart Type Toggle (only show in chart mode) */}
              {viewMode === 'chart' && (
                <div className="flex gap-1 bg-gray-100 dark:bg-zinc-700 rounded-lg p-1">
                  <Button
                    onClick={() => setChartType('both')}
                    variant="ghost"
                    size="sm"
                    className={`${
                      chartType === 'both'
                        ? darkMode
                          ? "bg-zinc-600 hover:bg-zinc-500 text-white"
                          : "bg-white shadow text-gray-900"
                        : "bg-transparent hover:bg-gray-200 dark:hover:bg-zinc-600 text-gray-600 dark:text-gray-300"
                    } transition-all duration-200`}
                  >
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Both
                  </Button>
                  <Button
                    onClick={() => setChartType('pie')}
                    variant="ghost"
                    size="sm"
                    className={`${
                      chartType === 'pie'
                        ? darkMode
                          ? "bg-zinc-600 hover:bg-zinc-500 text-white"
                          : "bg-white shadow text-gray-900"
                        : "bg-transparent hover:bg-gray-200 dark:hover:bg-zinc-600 text-gray-600 dark:text-gray-300"
                    } transition-all duration-200`}
                  >
                    <PieChart className="mr-2 h-4 w-4" />
                    Pie
                  </Button>
                  <Button
                    onClick={() => setChartType('bar')}
                    variant="ghost"
                    size="sm"
                    className={`${
                      chartType === 'bar'
                        ? darkMode
                          ? "bg-zinc-600 hover:bg-zinc-500 text-white"
                          : "bg-white shadow text-gray-900"
                        : "bg-transparent hover:bg-gray-200 dark:hover:bg-zinc-600 text-gray-600 dark:text-gray-300"
                    } transition-all duration-200`}
                  >
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Bar
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {viewMode === 'table' ? (
            /* Table View */
            <div className={`
              rounded-lg border overflow-x-auto w-full
              ${darkMode ? "border-zinc-700" : "border-gray-200"}
            `}>
              <DataTables
               data={filteredDatas}
               columns={columnConfigs.dashboard(darkMode)} // Use the dynamic columns
               onRowClicked={(row) => handleProjectClick(row.id)}
               darkMode={darkMode}
               pagination
               paginationPerPage={10}
               paginationRowsPerPageOptions={[5, 10, 15, 20]}
               searchable={true}
               searchPlaceholder="Search projects..."
               customizableColumns={true}
              />
            </div>
          ) : (
            /* Chart View */
            <div className="space-y-6">
              {/* Chart Type Selection and Stats */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className={`text-lg font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>
                    Project Analytics
                  </h3>
                  <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                    Visual insights into your project data
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
                      {filteredDatas.length}
                    </div>
                    <div className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                      Total Projects
                    </div>
                  </div>
                </div>
              </div>

              {/* Charts Grid */}
              <div className={`grid gap-6 ${
                chartType === 'both' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'
              }`}>
                
                {/* Pie Chart - Status Distribution */}
                {(chartType === 'both' || chartType === 'pie') && (
                  <Card className={darkMode ? "bg-zinc-800 border-zinc-700" : "bg-white border-gray-200"}>
                    <CardHeader>
                      <CardTitle className={darkMode ? "text-white" : "text-gray-900"}>
                        Status Distribution
                      </CardTitle>
                      <CardDescription className={darkMode ? "text-gray-400" : "text-gray-600"}>
                        Breakdown of projects by status
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={pieChartData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {pieChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip 
                              contentStyle={darkMode ? 
                                { backgroundColor: '#27272a', borderColor: '#52525b', color: 'white' } : 
                                { backgroundColor: 'white', borderColor: '#e5e5e5' }
                              }
                            />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Bar Chart - Priority Distribution */}
                {(chartType === 'both' || chartType === 'bar') && (
                  <Card className={darkMode ? "bg-zinc-800 border-zinc-700" : "bg-white border-gray-200"}>
                    <CardHeader>
                      <CardTitle className={darkMode ? "text-white" : "text-gray-900"}>
                        Priority Distribution
                      </CardTitle>
                      <CardDescription className={darkMode ? "text-gray-400" : "text-gray-600"}>
                        Number of projects by priority level
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={priorityChartData}>
                            <CartesianGrid 
                              strokeDasharray="3 3" 
                              stroke={darkMode ? "#374151" : "#e5e7eb"} 
                            />
                            <XAxis 
                              dataKey="name" 
                              stroke={darkMode ? "#9ca3af" : "#6b7280"}
                            />
                            <YAxis 
                              stroke={darkMode ? "#9ca3af" : "#6b7280"}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar 
                              dataKey="count" 
                              name="Projects"
                              radius={[4, 4, 0, 0]}
                            >
                              {priorityChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Additional Bar Chart - Department Distribution */}
                {(chartType === 'both' || chartType === 'bar') && filteredDatas.length > 0 && (
                  <Card className={`${darkMode ? "bg-zinc-800 border-zinc-700" : "bg-white border-gray-200"} ${
                    chartType === 'both' ? 'lg:col-span-2' : ''
                  }`}>
                    <CardHeader>
                      <CardTitle className={darkMode ? "text-white" : "text-gray-900"}>
                        Department Distribution
                      </CardTitle>
                      <CardDescription className={darkMode ? "text-gray-400" : "text-gray-600"}>
                        Projects across different departments
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={departmentChartData}>
                            <CartesianGrid 
                              strokeDasharray="3 3" 
                              stroke={darkMode ? "#374151" : "#e5e7eb"} 
                            />
                            <XAxis 
                              dataKey="name" 
                              stroke={darkMode ? "#9ca3af" : "#6b7280"}
                            />
                            <YAxis 
                              stroke={darkMode ? "#9ca3af" : "#6b7280"}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar 
                              dataKey="count" 
                              name="Projects"
                              radius={[4, 4, 0, 0]}
                              fill="#8b5cf6"
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Project Details Modal */}
      {/* {showDetails && detailData && (
        <ProjectDetailView
          project={detailData}
        />
      )} */}
    </div>
  );
};

export default Dashboard;