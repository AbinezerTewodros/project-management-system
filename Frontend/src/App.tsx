import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useEffect, useState } from "react";

import { AuthProvider, useAuth } from "@/context/AuthContext"; // keep AuthContext
import ProtectedRoute from "@/components/auth/ProtectedRoute"; // role-based route protection
import { ProjectProvider } from "@/context/ProjectContext"; // Add ProjectProvider import
import Projects from "@/pages/Projects"; // Add Projects import

import Home from "@/components/Home"; // keep Home component
import Navbar from "@/components/Navbar";
import MemberSidebar from "@/components/MemberSidebar";
import ManagerSidebar from "@/components/ManagerSidebar";
import VicePresidentSidebar from "@/components/VicePresidentSidebar";
import DirectorSidebar from "@/components/DirectorSidebar";
import DocumentTitle from "@/components/DocumentTitle";
import { NotificationProvider } from "@/components/NotificationContext";

import Index from "@/pages/Index"; // keep login/signup etc
import Login from "@/pages/Login";
import SignUp from "@/pages/Signup";
import ForgotPassword from "@/pages/profilePages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import Unauthorized from "@/pages/Unauthorized";
import NotFound from "@/pages/NotFound";

import MemberDashboard from "@/pages/dashboards/MemberDashboard";
import ManagerDashboard from "@/pages/dashboards/ManagerDashboard";
import DirectorDashboard from "@/pages/dashboards/DirectorDashboard";

import AdminDashboard from "@/pages/dashboards/AdminDashboard";
import PresidentDashboard from "@/pages/dashboards/PresidentDashboard";
import VicePresidentDashboard from "@/pages/dashboards/VicePresidentDashboard";

// Supervisor Sidebar Pages

import SupervisorProjects from "@/pages/SupervisorSidebarPages/Projects";
import Tasks from "@/pages/SupervisorSidebarPages/Tasks";
import Team from "@/pages/SupervisorSidebarPages/Team";
import Report from "@/components/Report";

import EditProfile from "@/pages/profilePages/EditProfilePage";
import ChangePasswordPage from "@/pages/profilePages/ChangePasswordPage";
import UserProfile from "@/pages/profilePages/userProfile";

// Member Sidebar Pages

import MemberMilestoneChart from "@/pages/MemberSidebarPages/MilestoneChart";
import MemberTeamChat from "@/pages/MemberSidebarPages/TeamChat";
import MemberTasksList from "@/pages/MemberSidebarPages/TasksList";
import MemberArchivedTasks from "@/pages/MemberSidebarPages/ArchivedTasks";

import SupervisorSidebar from "@/components/SupervisorSidebar";

// Import the manager components
import ManagerCreateProject from "@/pages/ManagerSidebarPages/CreateProject";
import ManagerProjects from "@/pages/ManagerSidebarPages/Projects";
import ManagerReports from "@/pages/ManagerSidebarPages/Reports";
import ManagerTasks from "@/pages/ManagerSidebarPages/Tasks";
import ManagerChat from "@/pages/ManagerSidebarPages/Chat";
import ManagerAnnouncements from "@/pages/ManagerSidebarPages/Announcements";
import ManagerArchivedTasks from "@/pages/ManagerSidebarPages/ArchivedTasks";

import DashboardLayout from "@/components/layout/DashboardLayout";

// President Sidebar Pages
import PresidentCreateProject from "@/pages/PresidentSidebarPages/CreateProject";
import PresidentProjects from "@/pages/PresidentSidebarPages/Projects";
import PresidentReports from "@/pages/PresidentSidebarPages/Reports";
import PresidentAnnouncements from "@/pages/PresidentSidebarPages/Announcements";
import PresidentSettings from "@/pages/PresidentSidebarPages/Settings";

// Vice President Sidebar Pages
import VicePresidentCreateProject from "@/pages/VicePresidentSidebarPages/CreateProject";
import VicePresidentProjects from "@/pages/VicePresidentSidebarPages/Projects";
import VicePresidentReports from "@/pages/VicePresidentSidebarPages/Reports";
import VicePresidentTeams from "@/pages/VicePresidentSidebarPages/Teams";
import VicePresidentSettings from "@/pages/VicePresidentSidebarPages/Settings";
import VicePresidentAnnouncements from "@/pages/VicePresidentSidebarPages/Announcements";

// Director Sidebar Pages
import DirectorCreateProject from "@/pages/DirectorSidebarPages/CreateProject";
import DirectorProjects from "@/pages/DirectorSidebarPages/Projects";
import DirectorReports from "@/pages/DirectorSidebarPages/Reports";
import DirectorTeams from "@/pages/DirectorSidebarPages/Teams";
import DirectorSettings from "@/pages/DirectorSidebarPages/Settings";
import MyProjects from "./pages/MemberSidebarPages/Projects/Project/MyProjects";
import MyTasks from "./pages/MemberSidebarPages/Projects/Tasks/MyTasks";
import Teams from "@/pages/ManagerSidebarPages/Teams";
import AssignedToMe from "./pages/MemberSidebarPages/Projects/Project/AssignedToMe";
import TasksAssignedToMe from "./pages/MemberSidebarPages/Projects/Tasks/TasksAssignedToMe";
import Chat from "@/pages/ManagerSidebarPages/Chat";
import Announcements from "@/pages/ManagerSidebarPages/Announcements";
import ArchivedTasks from "@/pages/ManagerSidebarPages/ArchivedTasks";
import DirectorChat from "@/pages/DirectorSidebarPages/Chat";
import DirectorAnnouncements from "@/pages/DirectorSidebarPages/Announcements";
import DirectorTasks from "@/pages/DirectorSidebarPages/Tasks";
import DirectorArchivedTasks from "@/pages/DirectorSidebarPages/ArchivedTasks";

// DashboardRedirect based on role (from Version A)
const DashboardRedirect = () => {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  switch (user.role) {
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
      return <Navigate to="/unauthorized" replace />;
  }
};

const App = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) return savedTheme === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  return (
    <AuthProvider>
      <NotificationProvider>
        <DocumentTitle />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="/404" element={<NotFound />} />

          {/* Protected Routes */}
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
          <Route
            path="/dashboard/admin/*"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <DashboardLayout
                  darkMode={darkMode}
                  setDarkMode={setDarkMode}
                  sidebarOpen={sidebarOpen}
                  setSidebarOpen={setSidebarOpen}
                >
                  <AdminDashboard
                    darkMode={darkMode}
                    setDarkMode={setDarkMode}
                    sidebarOpen={sidebarOpen}
                    setSidebarOpen={setSidebarOpen}
                  />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/supervisor/*"
            element={
              <ProtectedRoute allowedRoles={["supervisor"]}>
                <div className={`flex h-screen overflow-hidden ${darkMode ? "dark bg-zinc-800" : "bg-white"}`}>
                  <div className="flex-1 flex flex-col overflow-hidden pt-16">
                    <Navbar
                      onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
                      darkMode={darkMode}
                      setDarkMode={setDarkMode}
                    />
                    <Toaster position="top-right" />
                    <div className="flex-1 flex overflow-hidden">
                      <SupervisorSidebar
                        isOpen={sidebarOpen}
                        onClose={() => setSidebarOpen(false)}
                        darkMode={darkMode}
                      />
                      <main className="flex-1 overflow-y-auto">
                        <div className="container mx-auto px-4 py-6">
                          <Routes>
                            <Route index element={<Home darkMode={darkMode} isSidebarOpen={sidebarOpen} />} />
                            <Route path="projects" element={<SupervisorProjects darkMode={darkMode} />} />
                            <Route path="tasks" element={<Tasks darkMode={darkMode} />} />
                            <Route path="team" element={<Team darkMode={darkMode} />} />
                            <Route path="report" element={<Report darkMode={darkMode} />} />
                          </Routes>
                        </div>
                      </main>
                    </div>
                  </div>
                </div>
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard/vice-president/*"
            element={
              <ProtectedRoute allowedRoles={["vice_president"]}>
                <div className={`flex h-screen overflow-hidden ${darkMode ? "dark bg-zinc-800" : "bg-white"}`}>
                  <div className="flex-1 flex flex-col overflow-hidden pt-16">
                    <Navbar
                      onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
                      darkMode={darkMode}
                      setDarkMode={setDarkMode}
                    />
                    <Toaster position="top-right" />
                    <div className="flex-1 flex overflow-hidden">
                      <VicePresidentSidebar
                        isOpen={sidebarOpen}
                        onClose={() => setSidebarOpen(false)}
                        darkMode={darkMode}
                      />
                      <main className="flex-1 overflow-y-auto">
                        <div className="container mx-auto px-4 py-6">
                          <Routes>
                            <Route index element={<VicePresidentDashboard darkMode={darkMode} setDarkMode={setDarkMode} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />} />
                            <Route path="create-project" element={<VicePresidentCreateProject darkMode={darkMode} setDarkMode={setDarkMode} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />} />
                            <Route path="projects" element={<VicePresidentProjects />} />
                            <Route path="reports" element={<VicePresidentReports darkMode={darkMode} setDarkMode={setDarkMode} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />} />
                            <Route path="teams" element={<VicePresidentTeams darkMode={darkMode} setDarkMode={setDarkMode} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />} />
                            <Route path="announcements" element={<VicePresidentAnnouncements darkMode={darkMode} setDarkMode={setDarkMode} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />} />
                            <Route path="settings" element={<VicePresidentSettings darkMode={darkMode} setDarkMode={setDarkMode} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />} />
                          </Routes>
                        </div>
                      </main>
                    </div>
                  </div>
                </div>
              </ProtectedRoute>
            }
          />

          {/* Director Dashboard Route */}
          <Route
            path="/dashboard/director/*"
            element={
              <ProtectedRoute allowedRoles={["director"]}>
                <div className={`flex h-screen overflow-hidden ${darkMode ? "dark bg-zinc-800" : "bg-white"}`}>
                  <div className="flex-1 flex flex-col overflow-hidden pt-16">
                    <Navbar
                      onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
                      darkMode={darkMode}
                      setDarkMode={setDarkMode}
                    />
                    <Toaster position="top-right" />
                    <div className="flex-1 flex overflow-hidden">
                      <DirectorSidebar
                        isOpen={sidebarOpen}
                        onClose={() => setSidebarOpen(false)}
                        darkMode={darkMode}
                      />
                      <main className="flex-1 overflow-y-auto">
                        <div className="">
                          <Routes>
                            <Route index element={<DirectorDashboard darkMode={darkMode} setDarkMode={setDarkMode} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />} />
                            <Route path="create-project" element={<DirectorCreateProject darkMode={darkMode} setDarkMode={setDarkMode} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />} />
                            <Route path="projects" element={<DirectorProjects />} />
                            <Route path="projects/assigned" element={<DirectorProjects />} />
                            <Route path="reports" element={<DirectorReports darkMode={darkMode} setDarkMode={setDarkMode} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />} />
                            <Route path="teams" element={<DirectorTeams darkMode={darkMode} setDarkMode={setDarkMode} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />} />
                            <Route path="settings" element={<DirectorSettings darkMode={darkMode} setDarkMode={setDarkMode} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />} />
                            <Route path="chat" element={<DirectorChat darkMode={darkMode} setDarkMode={setDarkMode} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />} />
                            <Route path="announcements" element={<DirectorAnnouncements darkMode={darkMode} setDarkMode={setDarkMode} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />} />
                            <Route path="tasks" element={<DirectorTasks darkMode={darkMode} setDarkMode={setDarkMode} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />} />
                            <Route path="archived-tasks" element={<DirectorArchivedTasks />} />
                          </Routes>
                        </div>
                      </main>
                    </div>
                  </div>
                </div>
              </ProtectedRoute>
            }
          />

          {/* President Dashboard Route */}
          <Route
            path="/dashboard/president/*"
            element={
              <ProtectedRoute allowedRoles={["president"]}>
                <DashboardLayout
                  darkMode={darkMode}
                  setDarkMode={setDarkMode}
                  sidebarOpen={sidebarOpen}
                  setSidebarOpen={setSidebarOpen}
                >
                  <Routes>
                    <Route index element={<PresidentDashboard darkMode={darkMode} setDarkMode={setDarkMode} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />} />
                    <Route path="create-project" element={<PresidentCreateProject darkMode={darkMode} setDarkMode={setDarkMode} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />} />
                    <Route path="projects" element={<PresidentProjects darkMode={darkMode} />} />
                    <Route path="reports" element={<PresidentReports darkMode={darkMode} setDarkMode={setDarkMode} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />} />
                    <Route path="announcements" element={<PresidentAnnouncements darkMode={darkMode} setDarkMode={setDarkMode} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />} />
                    <Route path="settings" element={<PresidentSettings darkMode={darkMode} setDarkMode={setDarkMode} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />} />
                  </Routes>
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Other Dashboard Routes */}
          <Route
            path="/dashboard/*"
            element={
              <ProtectedRoute
                allowedRoles={[
                  "admin",
                  "manager",
                  "member",
                ]}
              >
                <div className={`flex h-screen overflow-hidden ${darkMode ? "dark bg-zinc-800" : "bg-white"}`}>
                  <div className="flex-1 flex flex-col overflow-hidden pt-16">
                    <Navbar
                      onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
                      darkMode={darkMode}
                      setDarkMode={setDarkMode}
                    />
                    <Toaster position="top-right" />
                    <div className="flex-1 overflow-auto p-5">
                      <Routes>
                        <Route path="member" element={<MemberDashboard darkMode={darkMode} setDarkMode={setDarkMode} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />} />
                        <Route path="manager" element={<ManagerDashboard darkMode={darkMode} setDarkMode={setDarkMode} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />} />
                      </Routes>
                    </div>
                  </div>
                </div>
              </ProtectedRoute>
            }
          />

          {/* Profile routes */}
          <Route
            path="/profile"
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
                <div className={`flex h-screen overflow-hidden ${darkMode ? "dark bg-zinc-800" : "bg-white"}`}>
                  <div className="flex-1 flex flex-col overflow-hidden pt-16">
                    <Navbar
                      onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
                      darkMode={darkMode}
                      setDarkMode={setDarkMode}
                    />
                    <Toaster position="top-right" />
                    <div className="flex-1 overflow-auto p-4">
                      <UserProfile />
                    </div>
                  </div>
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/edit-profile"
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
                <div className={`flex h-screen overflow-hidden ${darkMode ? "dark bg-zinc-800" : "bg-white"}`}>
                  <div className="flex-1 flex flex-col overflow-hidden pt-16">
                    <Navbar
                      onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
                      darkMode={darkMode}
                      setDarkMode={setDarkMode}
                    />
                    <Toaster position="top-right" />
                    <div className="flex-1 overflow-auto p-4">
                      <EditProfile />
                    </div>
                  </div>
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/change-password"
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
                <div className={`flex h-screen overflow-hidden ${darkMode ? "dark bg-zinc-800" : "bg-white"}`}>
                  <div className="flex-1 flex flex-col overflow-hidden pt-16">
                    <Navbar
                      onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
                      darkMode={darkMode}
                      setDarkMode={setDarkMode}
                    />
                    <Toaster position="top-right" />
                    <div className="flex-1 overflow-auto p-4">
                      <ChangePasswordPage />
                    </div>
                  </div>
                </div>
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard/member/*"
            element={
              <ProtectedRoute allowedRoles={["member"]}>
                <div className={`flex h-screen overflow-hidden ${darkMode ? "dark bg-zinc-800" : "bg-white"}`}>
                  <div className=" flex flex-col w-full overflow-hidden pt-16 ">
                    <Navbar
                      onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
                      darkMode={darkMode}
                      setDarkMode={setDarkMode}
                    />
                    <Toaster position="top-right" />
                    <div className="flex-1 flex overflow-hidden">
                      <MemberSidebar
                        isOpen={sidebarOpen}
                        onClose={() => setSidebarOpen(false)}
                        darkMode={darkMode}
                      />
                      <main className={`flex-1 overflow-y-auto   ${darkMode ? 'bg-zinc-800' : 'bg-white'} `}>
                        <div className="container mx-auto px-4 py-6">

                          <Routes>

                            <Route index element={<Home darkMode={darkMode} isSidebarOpen={sidebarOpen} />} />
                            <Route path="MilestoneChart" element={<MemberMilestoneChart darkMode={darkMode} isSidebarOpen={sidebarOpen} />} />
                            <Route path="projects/assigned-to-me" element={<AssignedToMe darkMode={darkMode} />} />
                            <Route path="projects/mine" element={<MyProjects darkMode={darkMode} />} />
                            <Route path="tasks/assigned-to-me" element={<TasksAssignedToMe darkMode={darkMode} isSidebarOpen={sidebarOpen} />} />
                            <Route path="tasks/mine" element={<MyTasks darkMode={darkMode} />} />
                            <Route path="TasksList" element={<MemberTasksList darkMode={darkMode} isSidebarOpen={sidebarOpen} />} />
                            <Route path="Chat" element={<MemberTeamChat darkMode={darkMode} />} />
                            <Route path="Reports" element={<Report darkMode={darkMode} />} />
                            <Route path="ArchivedTasks" element={<MemberArchivedTasks darkMode={darkMode} isSidebarOpen={sidebarOpen} />} />


                          </Routes>
                        </div>

                      </main>
                    </div>
                  </div>
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/manager/*"
            element={
              <ProtectedRoute allowedRoles={["manager"]}>
                <div className={`flex h-screen overflow-hidden ${darkMode ? "dark bg-zinc-800" : "bg-white"}`}>
                  <div className="flex-1 flex flex-col overflow-hidden pt-16">
                    <Navbar
                      onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
                      darkMode={darkMode}
                      setDarkMode={setDarkMode}
                    />
                    <Toaster position="top-right" />
                    <div className="flex-1 flex overflow-hidden">
                      <ManagerSidebar
                        isOpen={sidebarOpen}
                        onClose={() => setSidebarOpen(false)}
                        darkMode={darkMode}
                      />
                      <main className="flex-1 overflow-y-auto">
                        <div className="container mx-auto px-4 py-6">
                          <Routes>
                            <Route index element={<ManagerDashboard darkMode={darkMode} setDarkMode={setDarkMode} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />} />
                            <Route path="create-project" element={<ManagerCreateProject darkMode={darkMode} setDarkMode={setDarkMode} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />} />
                            <Route path="projects" element={<ManagerProjects darkMode={darkMode} setDarkMode={setDarkMode} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />} />
                            <Route path="tasks" element={<ManagerTasks />} />
                            <Route path="chat" element={<Chat />} />
                            <Route path="announcements" element={<Announcements />} />
                            <Route path="archived-tasks" element={<ArchivedTasks />} />
                            <Route path="teams" element={<Teams darkMode={darkMode} setDarkMode={setDarkMode} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />} />
                            <Route path="reports" element={<ManagerReports darkMode={darkMode} setDarkMode={setDarkMode} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />} />
                            <Route path="tasks" element={<ManagerTasks />} />
                            <Route path="chat" element={<ManagerChat />} />
                            <Route path="announcements" element={<ManagerAnnouncements />} />
                            <Route path="archived-tasks" element={<ManagerArchivedTasks />} />
                          </Routes>
                        </div>
                      </main>
                    </div>
                  </div>
                </div>
              </ProtectedRoute>
            }
          />

          <Route
            path="/projects"
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
                <ProjectProvider>
                  <div className={`flex h-screen overflow-hidden ${darkMode ? "dark bg-zinc-800" : "bg-white"}`}>
                    <div className="flex-1 flex flex-col overflow-hidden pt-16">
                      <Navbar
                        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
                        darkMode={darkMode}
                        setDarkMode={setDarkMode}
                      />
                      <Toaster position="top-right" />
                      <main className="flex-1 overflow-y-auto">
                        <div className="container mx-auto px-4 py-6">
                          <Projects />
                        </div>
                      </main>
                    </div>
                  </div>
                </ProjectProvider>
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
      </NotificationProvider>
    </AuthProvider>
  );
};

export default App;
