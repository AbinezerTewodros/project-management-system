import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && user?.role) {
    const userRole = user.role.toLowerCase();
    const normalizedAllowed = allowedRoles.map(r => r.toLowerCase());
    console.log('🔍 ProtectedRoute Debug:');
    console.log('🔍 User role:', userRole);
    console.log('🔍 Allowed roles:', normalizedAllowed);
    console.log('🔍 User object:', user);
    
    const isAllowed = normalizedAllowed.some(ar => {
      const exactMatch = ar === userRole;
      const userIncludesRole = userRole.includes(ar);
      const roleIncludesUser = ar.includes(userRole);
      const match = exactMatch || userIncludesRole || roleIncludesUser;
      
      console.log(`🔍 Role matching: "${ar}" vs "${userRole}"`);
      console.log(`🔍 Exact match: ${exactMatch}`);
      console.log(`🔍 User includes role: ${userIncludesRole}`);
      console.log(`🔍 Role includes user: ${roleIncludesUser}`);
      console.log(`🔍 Final match: ${match}`);
      
      return match;
    });
    console.log('🔍 Is allowed:', isAllowed);
    
    if (!isAllowed) {
      console.log('❌ Access denied - redirecting to unauthorized');
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
