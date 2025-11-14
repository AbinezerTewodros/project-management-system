import { ReactNode } from "react";
//import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
// import { Button } from "@/components/ui/button";
// import { LogOut, Users, FolderPlus, LayoutDashboard, Settings } from "lucide-react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
// import VicePresidentSidebar from "@/components/VicePresidentSidebar";
// import DirectorSidebar from "@/components/DirectorSidebar";

interface DashboardLayoutProps {
  children: ReactNode;
  darkMode: boolean;
  setDarkMode: (darkMode: boolean) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const DashboardLayout = ({
  children,
  darkMode,
  setDarkMode,
  sidebarOpen,
  setSidebarOpen
}: DashboardLayoutProps) => {
  const { user } = useAuth(); // logout
  // const navigate = useNavigate();

  // const handleLogout = () => {
  //   logout();
  //   navigate("/login");
  // };

  const renderSidebar = () => {
    if (!user) return null;

    switch (user.role) {
      case 'president':
        return (
          <Sidebar
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            darkMode={darkMode}
          />
        );
      case 'vice_president':
        return (
          <Sidebar
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            darkMode={darkMode}
          />
        );
      case 'director':
        return (
          <Sidebar
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            darkMode={darkMode}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className={`flex h-screen mt-4 ${darkMode ? "dark bg-zinc-800" : "bg-white"}`}>
      {renderSidebar()}
      <div className="flex-1 flex flex-col ">
        <Navbar
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
        />
        <div className="flex-1 flex ">
          <main className="flex-1 ">
            <div className="container mx-auto px-4 py-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};
export default DashboardLayout;
