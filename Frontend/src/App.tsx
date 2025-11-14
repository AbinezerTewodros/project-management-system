import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import { AuthProvider, useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { ProjectProvider } from "@/context/ProjectContext";
import { TaskProvider } from "@/context/TaskContext";

import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import DocumentTitle from "@/components/DocumentTitle";
import ErrorBoundary from "@/components/ErrorBoundary";
import { NotificationProvider } from "@/context/NotificationContext";

import Index from "@/pages/Index";
import Login from "@/pages/Account/Login";
import SignUp from "@/pages/Account/Signup";
import ChangePassword from "@/pages/Account/ChangePassword";
import ForgotPassword from "@/pages/profilePages/ForgotPassword";
import ResetPassword from "@/pages/Account/ResetPassword";
import Unauthorized from "@/pages/Unauthorized";
import NotFound from "@/pages/NotFound";
import TimelinePage from "@/pages/TimelinePage";
import TimelineList from "@/pages/TimelineList";
import EscalationsList from "@/pages/Escalations/EscalationsList";
import RequestForm from "@/pages/Requests/RequestForm";

import Dashboard from "@/pages/dashboards/Dashboard";
import AdminDashboard from "@/pages/dashboards/AdminDashboard";
import MyProjects from "@/pages/Projects/MyProjects";
import Projects from "@/pages/Projects";
import ProjectsUnified from "@/pages/Projects/ProjectsUnified";
import MyTasks from "@/pages/Tasks/MyTasks";
import TasksUnified from "@/pages/Tasks/TasksUnified";
import AssignedToMe from "@/pages/Projects/AssignedToMe";
// import TasksAssignedToMe from "@/pages/Tasks/TasksAssignedToMe";
import TeamLeaderApprovals from "@/pages/Tasks/TeamLeaderApprovals";
//import Chat from "@/pages/Chat/Chat";
import TeamChat from "@/pages/Chat/TeamChat";
import Announcements from "@/pages/Announcement/Announcements";
import ArchivedTasks from "@/pages/Tasks/ArchivedTasks";
import Personal from "@/pages/Tasks/Personal";
import MultistepProjectCreation from "@/pages/Projects/MultistepProjectCreation";
import NotificationsPage from "@/pages/notifications";
import { Project } from "@/types/types";

import EditProfile from "@/pages/profilePages/EditProfilePage";
import ChangePasswordPage from "@/pages/profilePages/ChangePasswordPage";
import UserProfile from "@/pages/profilePages/userProfile";

import VicePresidentCreateProject from "@/pages/Projects/CreateProject";
import VicePresidentReports from "@/pages/Report/ReportNew";
import VicePresidentTeams from "@/pages/Team/Teams";
import VicePresidentAnnouncements from "@/pages/Announcement/Announcements";

import DirectorCreateProject from "@/pages/Projects/CreateProject";
import DirectorReports from "@/pages/Report/ReportNew";
import DirectorTeams from "@/pages/Team/Teams";
import DirectorAnnouncements from "@/pages/Announcement/Announcements";
import DirectorArchivedTasks from "@/pages/Tasks/ArchivedTasks";

import ManagerCreateProject from "@/pages/Projects/MultistepProjectCreation";
import ManagerReports from "@/pages/Report/ReportNew";
import ManagerMilestones from "@/pages/Milestones/Milestones";

import MemberMilestoneChart from "@/pages/Milestones/MilestoneChart";
import MemberAddMilestone from "@/pages/Milestones/AddMilestone";
import MemberTasksList from "@/pages/Tasks/TasksList";
import MemberArchivedTasks from "@/pages/Tasks/ArchivedTasks";

import AuthoredMile from "@/pages/Milestones/AuthoredMile";
import DelegatedAssignments from "@/pages/Projects/DelegatedAssignments"; // ✅ NEW: Real delegated assignments page
import PendingApprovals from "@/pages/Projects/PendingApprovals"; // ✅ NEW: Approval workflow page
import MilestonesUnified from "./pages/Milestones/MilestonesUnified";
import ProjectDetailPage from "./pages/Projects/ProjectDetailPage";

// Dashboard Layout Wrapper that can access AuthProvider
const DashboardLayoutWrapper = ({
  children,
  darkMode,
  setDarkMode,
  sidebarOpen,
  setSidebarOpen,
  hideSidebar = false,
}: {
  children: React.ReactNode;
  darkMode: boolean;
  setDarkMode: (darkMode: boolean) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  hideSidebar?: boolean;
}) => {
  const { user } = useAuth();
  const userRole = user?.role || "member";

  return (
    <div
      className={`flex h-screen overflow-hidden ${
        darkMode ? "dark bg-zinc-800" : "bg-white"
      }`}
    >
      <div className="flex-1 flex flex-col overflow-hidden pt-16">
        <Navbar
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
        />
        <Toaster position="top-right" />
        <div className="flex-1 flex overflow-hidden">
          {!hideSidebar && (
            <Sidebar
              isOpen={sidebarOpen}
              onClose={() => setSidebarOpen(false)}
              darkMode={darkMode}
              userRole={userRole}
            />
          )}
          <main className="flex-1 overflow-y-auto">
            <div className="container mx-auto px-4 py-2">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
};

const DashboardRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;

  const role = (user.role || "").toLowerCase();
  console.log("User role for dashboard redirect:", role);
  console.log("Full user object:", user);

  switch (role) {
    case "admin":
      return <Navigate to="/dashboard/admin" replace />;
    case "manager":
      return <Navigate to="/dashboard/manager" replace />;
    case "member":
      return <Navigate to="/dashboard/member" replace />;
    case "supervisor":
      return <Navigate to="/dashboard/supervisor" replace />;
    case "director":
      return <Navigate to="/dashboard/director" replace />;
    case "president":
      return <Navigate to="/dashboard/president" replace />;
    case "vice_president":
      return <Navigate to="/dashboard/vice-president" replace />;
    default:
      console.warn("Unknown role, redirecting to unauthorized:", role);
      // Fallback: redirect to user dashboard for any authenticated user
      return <Navigate to="/dashboard/member" replace />;
  }
};

const App = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [darkMode, setDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) return savedTheme === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  const handleProjectCreated = (newProject: Project) => {
    setProjects((prev) => [newProject, ...prev]);
  };

  const renderDashboardLayout = (
    children: React.ReactNode,
    hideSidebar: boolean = false
  ) => (
    <DashboardLayoutWrapper
      darkMode={darkMode}
      setDarkMode={setDarkMode}
      sidebarOpen={sidebarOpen}
      setSidebarOpen={setSidebarOpen}
      hideSidebar={hideSidebar}
    >
      {children}
    </DashboardLayoutWrapper>
  );

  return (
    <ErrorBoundary>
      <AuthProvider>
        <NotificationProvider>
          <DocumentTitle />
          <Routes>
            {/* Public */}
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/change-password" element={<ChangePassword />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route path="/404" element={<NotFound />} />
            <Route
              path="/timeline/:projectId"
              element={
                <ProtectedRoute
                  allowedRoles={[
                    "admin",
                    "manager",
                    "supervisor",
                    "member",
                    "director",
                    "president",
                    "vice_president",
                  ]}
                >
                  {renderDashboardLayout(<TimelinePage darkMode={darkMode} />)}
                </ProtectedRoute>
              }
            />
            <Route
              path="/timeline"
              element={
                <ProtectedRoute
                  allowedRoles={[
                    "admin",
                    "manager",
                    "supervisor",
                    "member",
                    "director",
                    "president",
                    "vice_president",
                  ]}
                >
                  {renderDashboardLayout(<TimelineList darkMode={darkMode} />)}
                </ProtectedRoute>
              }
            />

            {/* Escalations - accessible under dashboard role path */}
            <Route
              path="/dashboard/:role/escalations"
              element={
                <ProtectedRoute
                  allowedRoles={[
                    "admin",
                    "manager",
                    "supervisor",
                    "member",
                    "director",
                    "president",
                    "vice_president",
                  ]}
                >
                  {renderDashboardLayout(<EscalationsList darkMode={darkMode} />)}
                </ProtectedRoute>
              }
            />
            {/* Requests - intake form */}
            <Route
              path="/dashboard/:role/requests"
              element={
                <ProtectedRoute
                  allowedRoles={[
                    "admin",
                    "manager",
                    "supervisor",
                    "member",
                    "director",
                    "president",
                    "vice_president",
                  ]}
                >
                  {renderDashboardLayout(<RequestForm darkMode={darkMode} />)}
                </ProtectedRoute>
              }
            />

            {/* Root dashboard redirect */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute
                  allowedRoles={[
                    "admin",
                    "manager",
                    "supervisor",
                    "member",
                    "director",
                    "president",
                    "vice_president",
                  ]}
                >
                  <DashboardRedirect />
                </ProtectedRoute>
              }
            />

            {/* Admin */}
            <Route
              path="/dashboard/admin/*"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <TaskProvider>
                    {renderDashboardLayout(
                      <Routes>
                        <Route
                          index
                          element={
                            <AdminDashboard
                              darkMode={darkMode}
                              setDarkMode={setDarkMode}
                              sidebarOpen={sidebarOpen}
                              setSidebarOpen={setSidebarOpen}
                            />
                          }
                        />
                        <Route
                          path="approvals"
                          element={<PendingApprovals darkMode={darkMode} />}
                        />
                        <Route
                          path="notifications"
                          element={<NotificationsPage />}
                        />
                      </Routes>
                    )}
                  </TaskProvider>
                </ProtectedRoute>
              }
            />

            {/* Vice President */}
            <Route
              path="/dashboard/vice-president/*"
              element={
                <ProtectedRoute allowedRoles={["vice_president"]}>
                  {renderDashboardLayout(
                    <Routes>
                      <Route
                        index
                        element={
                          <Dashboard
                            darkMode={darkMode}
                            setDarkMode={setDarkMode}
                            sidebarOpen={sidebarOpen}
                            setSidebarOpen={setSidebarOpen}
                          />
                        }
                      />
                      <Route path="projects/:projectId" element={<ProjectDetailPage />}/>
                      <Route
                        path="create-project"
                        element={
                          <VicePresidentCreateProject
                            darkMode={darkMode}
                            onProjectCreated={handleProjectCreated}
                          />
                        }
                      />
                      <Route
                        path="reports"
                        element={<VicePresidentReports darkMode={darkMode} />}
                      />
                      <Route
                        path="teams"
                        element={
                          <VicePresidentTeams
                            darkMode={darkMode}
                            setDarkMode={setDarkMode}
                            sidebarOpen={sidebarOpen}
                            setSidebarOpen={setSidebarOpen}
                          />
                        }
                      />
                      <Route
                        path="announcements"
                        element={
                          <VicePresidentAnnouncements darkMode={darkMode} />
                        }
                      />
                      <Route
                        path="projects"
                        element={<ProjectsUnified darkMode={darkMode} />}
                      />
                      <Route
                        path="projects/new/:step"
                        element={
                          <MultistepProjectCreation
                            darkMode={darkMode}
                            onProjectCreated={handleProjectCreated}
                          />
                        }
                      />
                      <Route
                        path="tasks"
                        element={
                          <TasksUnified
                            darkMode={darkMode}
                            isSidebarOpen={sidebarOpen}
                          />
                        }
                      />
                      <Route
                        path="tasks/approvals"
                        element={<TeamLeaderApprovals darkMode={darkMode} />}
                      />
                      <Route
                        path="tasks/authored"
                        element={<MyTasks darkMode={darkMode} />}
                      />
                      <Route
                        path="Chat"
                        element={<TeamChat darkMode={darkMode} />}
                      />
                      <Route
                        path="ArchivedTasks"
                        element={
                          <ArchivedTasks
                            darkMode={darkMode}
                            isSidebarOpen={sidebarOpen}
                          />
                        }
                      />
                      <Route
                        path="task/personal"
                        element={<Personal darkMode={darkMode} />}
                      />
                      <Route
                        path="approvals"
                        element={<PendingApprovals darkMode={darkMode} />}
                      />
                    </Routes>
                  )}
                </ProtectedRoute>
              }
            />

            {/* Director */}
            <Route
              path="/dashboard/director/*"
              element={
                <ProtectedRoute allowedRoles={["director"]}>
                  <TaskProvider>
                    {renderDashboardLayout(
                      <Routes>
                        <Route
                          index
                          element={
                            <Dashboard
                              darkMode={darkMode}
                              setDarkMode={setDarkMode}
                              sidebarOpen={sidebarOpen}
                              setSidebarOpen={setSidebarOpen}
                            />
                          }
                        />
                        <Route path="projects/:projectId" element={<ProjectDetailPage />}/>
                        <Route
                          path="create-project"
                          element={
                            <DirectorCreateProject
                              darkMode={darkMode}
                              onProjectCreated={handleProjectCreated}
                            />
                          }
                        />
                        <Route
                          path="reports"
                          element={<DirectorReports darkMode={darkMode} />}
                        />
                        <Route
                          path="teams"
                          element={
                            <DirectorTeams
                              darkMode={darkMode}
                              setDarkMode={setDarkMode}
                              sidebarOpen={sidebarOpen}
                              setSidebarOpen={setSidebarOpen}
                            />
                          }
                        />
                        <Route
                          path="chat"
                          element={<TeamChat darkMode={darkMode} />}
                        />
                        <Route
                          path="announcements"
                          element={
                            <DirectorAnnouncements darkMode={darkMode} />
                          }
                        />
                        <Route
                          path="archived-tasks"
                          element={
                            <DirectorArchivedTasks
                              darkMode={darkMode}
                              isSidebarOpen={sidebarOpen}
                            />
                          }
                        />
                        <Route
                          path="projects"
                          element={<ProjectsUnified darkMode={darkMode} />}
                        />
                        <Route
                          path="projects/new/:step"
                          element={
                            <MultistepProjectCreation
                              darkMode={darkMode}
                              onProjectCreated={handleProjectCreated}
                            />
                          }
                        />
                        <Route
                          path="tasks"
                          element={
                            <TasksUnified
                              darkMode={darkMode}
                              isSidebarOpen={sidebarOpen}
                            />
                          }
                        />
                        <Route
                          path="tasks/approvals"
                          element={<TeamLeaderApprovals darkMode={darkMode} />}
                        />
                        <Route
                          path="tasks/authored"
                          element={<MyTasks darkMode={darkMode} />}
                        />
                        <Route
                          path="task/personal"
                          element={<Personal darkMode={darkMode} />}
                        />
                        <Route
                          path="approvals"
                          element={<PendingApprovals darkMode={darkMode} />}
                        />
                      </Routes>
                    )}
                  </TaskProvider>
                </ProtectedRoute>
              }
            />

            {/* Manager */}
            <Route
              path="/dashboard/manager/*"
              element={
                <ProtectedRoute allowedRoles={["manager"]}>
                  <TaskProvider>
                    {renderDashboardLayout(
                      <Routes>
                        <Route
                          index
                          element={
                            <Dashboard
                              darkMode={darkMode}
                              setDarkMode={setDarkMode}
                              sidebarOpen={sidebarOpen}
                              setSidebarOpen={setSidebarOpen}
                            />
                          }
                        />
                        <Route path="projects/:projectId" element={<ProjectDetailPage />}/>
                        <Route
                          path="create-project"
                          element={
                            <ManagerCreateProject
                              darkMode={darkMode}
                              onProjectCreated={handleProjectCreated}
                            />
                          }
                        />
                        <Route
                          path="projects"
                          element={<ProjectsUnified darkMode={darkMode} />}
                        />
                        <Route
                          path="projects/new/:step"
                          element={
                            <ProtectedRoute
                              allowedRoles={[
                                "manager",
                                "director",
                                "vice_president",
                                "president",
                                "member",
                                "admin",
                              ]}
                            >
                              <MultistepProjectCreation
                                darkMode={darkMode}
                                onProjectCreated={handleProjectCreated}
                              />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="milestones"
                          element={<MilestonesUnified darkMode={darkMode} />}
                        />
                        <Route
                          path="tasks"
                          element={
                            <TasksUnified
                              darkMode={darkMode}
                              isSidebarOpen={sidebarOpen}
                            />
                          }
                        />
                        <Route
                          path="tasks/approvals"
                          element={<TeamLeaderApprovals darkMode={darkMode} />}
                        />
                        <Route
                          path="tasks/authored"
                          element={<MyTasks darkMode={darkMode} />}
                        />
                        <Route
                          path="chat"
                          element={<TeamChat darkMode={darkMode} />}
                        />
                        <Route
                          path="announcements"
                          element={<Announcements darkMode={darkMode} />}
                        />
                        <Route
                          path="archived-tasks"
                          element={
                            <ArchivedTasks
                              darkMode={darkMode}
                              isSidebarOpen={sidebarOpen}
                            />
                          }
                        />
                        <Route
                          path="teams"
                          element={
                            <VicePresidentTeams
                              darkMode={darkMode}
                              setDarkMode={setDarkMode}
                              sidebarOpen={sidebarOpen}
                              setSidebarOpen={setSidebarOpen}
                            />
                          }
                        />
                        <Route
                          path="reports"
                          element={<ManagerReports darkMode={darkMode} />}
                        />
                        <Route
                          path="milestones"
                          element={<ManagerMilestones />}
                        />
                        <Route
                          path="task/personal"
                          element={<Personal darkMode={darkMode} />}
                        />
                        <Route
                          path="approvals"
                          element={<PendingApprovals darkMode={darkMode} />}
                        />
                      </Routes>
                    )}
                  </TaskProvider>
                </ProtectedRoute>
              }
            />

            {/* President */}
            <Route
              path="/dashboard/president/*"
              element={
                <ProtectedRoute allowedRoles={["president"]}>
                  <TaskProvider>
                    {renderDashboardLayout(
                      <Routes>
                        <Route
                          index
                          element={
                            <Dashboard
                              darkMode={darkMode}
                              setDarkMode={setDarkMode}
                              sidebarOpen={sidebarOpen}
                              setSidebarOpen={setSidebarOpen}
                            />
                          }
                        />
                        <Route path="projects/:projectId" element={<ProjectDetailPage />}/>
                        <Route
                          path="create-project"
                          element={
                            <MultistepProjectCreation
                              darkMode={darkMode}
                              onProjectCreated={handleProjectCreated}
                            />
                          }
                        />
                        <Route
                          path="projects"
                          element={<ProjectsUnified darkMode={darkMode} />}
                        />
                        <Route
                          path="projects/new/:step"
                          element={
                            <MultistepProjectCreation
                              darkMode={darkMode}
                              onProjectCreated={handleProjectCreated}
                            />
                          }
                        />
                        <Route
                          path="announcements"
                          element={<Announcements darkMode={darkMode} />}
                        />
                        <Route
                          path="reports"
                          element={<VicePresidentReports darkMode={darkMode} />}
                        />
                        <Route
                          path="teams"
                          element={
                            <VicePresidentTeams
                              darkMode={darkMode}
                              setDarkMode={setDarkMode}
                              sidebarOpen={sidebarOpen}
                              setSidebarOpen={setSidebarOpen}
                            />
                          }
                        />
                        <Route
                          path="task/personal"
                          element={<Personal darkMode={darkMode} />}
                        />
                        <Route
                          path="approvals"
                          element={<PendingApprovals darkMode={darkMode} />}
                        />
                      </Routes>
                    )}
                  </TaskProvider>
                </ProtectedRoute>
              }
            />

            {/* Member */}
            <Route
              path="/dashboard/member/*"
              element={
                <ProtectedRoute
                  allowedRoles={[
                    "manager",
                    "director",
                    "vice_president",
                    "president",
                    "member",
                    "admin",
                  ]}
                >
                  <TaskProvider>
                    {renderDashboardLayout(
                      <Routes>
                        <Route
                          index
                          element={
                            <Dashboard
                              darkMode={darkMode}
                              setDarkMode={setDarkMode}
                              sidebarOpen={sidebarOpen}
                              setSidebarOpen={setSidebarOpen}
                            />
                          }
                        />
                        <Route path="projects/:projectId" element={<ProjectDetailPage />}/>
                        <Route
                          path="MilestoneChart"
                          element={
                            <MemberMilestoneChart
                              darkMode={darkMode}
                              isSidebarOpen={sidebarOpen}
                            />
                          }
                        />
                        <Route
                          path="add-milestone"
                          element={
                            <MemberAddMilestone
                              darkMode={darkMode}
                              isSidebarOpen={sidebarOpen}
                            />
                          }
                        />
                        <Route
                          path="projects"
                          element={<ProjectsUnified darkMode={darkMode} />}
                        />
                        <Route
                          path="projects/new/:step"
                          element={
                            <MultistepProjectCreation
                              darkMode={darkMode}
                              onProjectCreated={handleProjectCreated}
                            />
                          }
                        />
                        <Route
                          path="milestones"
                          element={<MilestonesUnified darkMode={darkMode} />}
                        />
                        <Route
                          path="tasks"
                          element={
                            <TasksUnified
                              darkMode={darkMode}
                              isSidebarOpen={sidebarOpen}
                            />
                          }
                        />
                        <Route
                          path="tasks/approvals"
                          element={<TeamLeaderApprovals darkMode={darkMode} />}
                        />
                        <Route
                          path="tasks/authored"
                          element={<MyTasks darkMode={darkMode} />}
                        />
                        <Route
                          path="TasksList"
                          element={<MemberTasksList darkMode={darkMode} />}
                        />
                        <Route
                          path="Chat"
                          element={<TeamChat darkMode={darkMode} />}
                        />
                        <Route
                          path="ArchivedTasks"
                          element={
                            <MemberArchivedTasks
                              darkMode={darkMode}
                              isSidebarOpen={sidebarOpen}
                            />
                          }
                        />
                        <Route
                          path="task/personal"
                          element={<Personal darkMode={darkMode} />}
                        />
                        <Route
                          path="approvals"
                          element={<PendingApprovals darkMode={darkMode} />}
                        />
                      </Routes>
                    )}
                  </TaskProvider>
                </ProtectedRoute>
              }
            />

            {/* Profile */}
            {["profile", "profile/edit-profile", "profile/change-password"].map(
              (path) => (
                <Route
                  key={path}
                  path={`/${path}`}
                  element={
                    <ProtectedRoute
                      allowedRoles={[
                        "admin",
                        "manager",
                        "supervisor",
                        "member",
                        "director",
                        "president",
                        "vice_president",
                      ]}
                    >
                      {renderDashboardLayout(
                        path === "profile" ? (
                          <UserProfile />
                        ) : path === "profile/edit-profile" ? (
                          <EditProfile darkMode={darkMode} />
                        ) : (
                          <ChangePasswordPage />
                        ),
                        true
                      )}
                    </ProtectedRoute>
                  }
                />
              )
            )}

            {/* Projects (shared) */}
            <Route
              path="/projects"
              element={
                <ProtectedRoute
                  allowedRoles={[
                    "admin",
                    "manager",
                    "member",
                    "director",
                    "president",
                    "vice_president",
                  ]}
                >
                  <ProjectProvider>
                    {renderDashboardLayout(<Projects />)}
                  </ProjectProvider>
                </ProtectedRoute>
              }
            />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>
        </NotificationProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;
