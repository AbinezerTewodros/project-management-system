import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
//import { useAuth } from "@/context/AuthContext"

const pageTitles: Record<string, string> = {
  '/': 'Home',
  '/login': 'Login',
  '/signup': 'Sign Up',
  '/forgot-password': 'Forgot Password',
  '/reset-password': 'Reset Password',
  '/profile': 'Profile',
  '/profile/edit-profile': 'Edit Profile',
  '/profile/change-password': 'Change Password',
  '/unauthorized': 'Access Denied',
  '/404': 'Page Not Found',
  '/table-view': 'Table View',
  '/projects': 'Projects',
  '/recent': 'Recent opened files',
  '/members': 'Members',
};

const getDashboardTitle = (path: string): string | null => {
  if (path.startsWith("/dashboard")) {
    if (path === "/dashboard/manager") return "Manager Dashboard";
    if (path === "/dashboard/member") return "Member Dashboard";
    if (path === "/dashboard/supervisor") return "Supervisor Dashboard";
    if (path === "/dashboard/director") return "Director Dashboard";
    if (path === "/dashboard/team-leader") return "Team Leader Dashboard";
    return "Dashboard";
  }
  return null;
};

const DocumentTitle = () => {
  const location = useLocation();
 // const { user } = useAuth(); // in case you need it for auth-specific logic later

  useEffect(() => {
    const path = location.pathname;
    const dashboardTitle = getDashboardTitle(path);
    const pageTitle = pageTitles[path];

    const title = dashboardTitle || pageTitle || "CBE SDC";
    document.title = `${title} | CBE SDC`;
  }, [location.pathname]);

  return null;
};

export default DocumentTitle;
