import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { User, AuthState } from "@/types/auth";
import { authService } from "@/services";

/* ----------------------------- Claim Constants ---------------------------- */
const CLAIM_TYPES = {
  NAME_IDENTIFIER:
    "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier",
  NAME: "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name",
  EMAIL: "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress",
  ROLE: "http://schemas.microsoft.com/ws/2008/06/identity/claims/role",
  DEPARTMENT: "Department",
  FULL_NAME: "FullName",
  EMPLOYEE_ID: "EmployeeId",
} as const;

/* ----------------------------- Role Normalizer ---------------------------- */
const normalizeRole = (roleInput: unknown): string => {
  if (!roleInput) return "";
  const r = String(roleInput).toLowerCase();

  console.log("🔍 Normalizing role:", roleInput, "->", r);

  if (r.includes("vice") && r.includes("president")) return "vice_president";
  if (
    r.includes("administrator") ||
    r.includes("sysadmin") ||
    r.includes("admin")
  )
    return "admin";
  if (r.includes("president")) return "president";
  if (r.includes("director")) return "director";
  if (r.includes("manager")) return "manager";
  if (r.includes("supervisor")) return "supervisor";

  // Consolidate all standard user roles into "member"
  if (
    r.includes("member") ||
    r.includes("employee") ||
    r.includes("staff") ||
    r.includes("user")
  ) {
    return "member";
  }

  console.log("🔍 Final normalized role:", r);
  return r;
};

/* ----------------------------- JWT Utilities ----------------------------- */
const base64UrlDecode = (input: string): string => {
  try {
    const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "="
    );
    const json = atob(padded);
    return decodeURIComponent(
      json
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
  } catch {
    return "";
  }
};

const decodeJWT = (token: string): Record<string, unknown> => {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Invalid token format");
  const payload = base64UrlDecode(parts[1]);
  if (!payload) throw new Error("Invalid token payload");
  return JSON.parse(payload);
};

const extractUserFromJWT = (decoded: Record<string, any>): User => {
  // ✅ FIXED: Handle roles array from backend properly
  const roles = decoded[CLAIM_TYPES.ROLE] || decoded.role || [];
  const primaryRole = Array.isArray(roles) ? roles[0] : roles;

  console.log("JWT roles:", roles, "Primary role:", primaryRole);
  console.log("Normalized role:", normalizeRole(primaryRole));

  const normalizedRole = normalizeRole(primaryRole);
  console.log("🔍 Final user role after normalization:", normalizedRole);

  const user = {
    id: decoded[CLAIM_TYPES.NAME_IDENTIFIER] || decoded.sub || "",
    username:
      decoded[CLAIM_TYPES.NAME] || decoded.username || decoded.name || "",
    email: decoded[CLAIM_TYPES.EMAIL] || decoded.email || "",
    role: normalizedRole,
    employeeId:
      decoded[CLAIM_TYPES.EMPLOYEE_ID] ||
      decoded.employeeId ||
      decoded.employee_id ||
      "",
    name:
      decoded[CLAIM_TYPES.FULL_NAME] || decoded.fullName || decoded.name || "",
    department: decoded[CLAIM_TYPES.DEPARTMENT] || decoded.department || "",
    password: "",
    isApproved: true, // Backend doesn't have approval system - users are active immediately
    createdAt: decoded.iat
      ? new Date(decoded.iat * 1000).toISOString()
      : new Date().toISOString(),
  };

  console.log("🔍 Final user object:", user);
  return user;
};

/* --------------------------- Local Storage Utils -------------------------- */
const storage = {
  getUser: (): User | null => {
    try {
      const stored = localStorage.getItem("user");
      return stored ? (JSON.parse(stored) as User) : null;
    } catch {
      localStorage.removeItem("user");
      return null;
    }
  },
  setUser: (user: User | null) => {
    console.log("🔍 storage.setUser called with:", user);
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
      console.log("✅ User data stored in localStorage");
    } else {
      localStorage.removeItem("user");
      console.log("🗑️ User data removed from localStorage");
    }
  },
  setTokens: (accessToken: string, refreshToken?: string) => {
    localStorage.setItem("authToken", accessToken);
    if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
  },
  clear: () => {
    localStorage.removeItem("user");
    localStorage.removeItem("authToken");
    localStorage.removeItem("refreshToken");
  },
};

/* ---------------------------- Error Handling ----------------------------- */
const handleServiceError = (error: unknown, context: string): never => {
  console.error(`${context} error:`, error);
  throw error instanceof Error ? error : new Error(String(error));
};

/* ----------------------------- Context Types ----------------------------- */
interface AuthContextType extends AuthState {
  login: (emailOrUsername: string, password: string) => Promise<void>;
  signup: (
    email: string,
    employeeId: string,
    role: string,
    username: string,
    password: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (profileData: Partial<User>) => Promise<void>;
  changePassword: (
    currentPassword: string,
    newPassword: string
  ) => Promise<void>;
  approveUser: (userId: string) => Promise<void>;
  rejectUser: (userId: string, reason: string) => Promise<void>;
  getPendingUsers: () => Promise<User[]>;
  getApprovedUsers: () => Promise<User[]>;
  getRejectedUsers: () => Promise<User[]>;
  updateUserRoleByRoleId: (identifier: string, roleId: string) => Promise<void>;
  deleteUser: (identifier: string, reason: string) => Promise<void>;
  activateUser: (identifier: string) => Promise<void>;
  resetPassword: (identifier: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/* ---------------------------- Provider Component --------------------------- */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>(() => {
    const user = storage.getUser();
    return { user, isAuthenticated: !!user };
  });

  // Sync localStorage with state
  useEffect(() => {
    storage.setUser(authState.user);
  }, [authState.user, authState.isAuthenticated]);

  /* ---------------------------- Auth Methods ---------------------------- */
  const signup = async (
    email: string,
    employeeId: string,
    role: string,
    username: string,
    password: string
  ): Promise<void> => {
    try {
      const response = await authService.signup({
        email,
        employeeId,
        role,
        username,
        password,
      });
      if (!response.success)
        throw new Error(response.message || "Signup failed");

      setAuthState({ user: null, isAuthenticated: false });
    } catch (error) {
      handleServiceError(error, "Signup");
    }
  };

  const login = async (
    emailOrUsername: string,
    password: string
  ): Promise<void> => {
    try {
      console.log("Attempting login for:", emailOrUsername);
      const response = await authService.login({
        username: emailOrUsername,
        password,
      });
      console.log("Login response:", response);
      console.log("Response success:", response.success);
      console.log("Response data:", response.data);

      if (!response.success) {
        throw new Error(response.message || "Login failed");
      }

      // Handle different response structures
      let responseData = response.data;
      if (!responseData) {
        // If data is null/undefined, the response might be the data itself
        responseData = response;
      }

      console.log("Response data structure:", responseData);

      // ✅ FIX: Handle nested jwtResponse structure for first login
      let accessToken, refreshToken, isFirstLogin, message;

      if (responseData.jwtResponse) {
        // First login response structure: { message: "...", jwtResponse: { accessToken, refreshToken, isFirstLogin } }
        const jwtData = responseData.jwtResponse;
        accessToken = jwtData.accessToken;
        refreshToken = jwtData.refreshToken;
        isFirstLogin = jwtData.isFirstLogin;
        message = responseData.message;
      } else {
        // Normal response structure: { accessToken, refreshToken, isFirstLogin, message }
        accessToken = responseData.accessToken;
        refreshToken = responseData.refreshToken;
        isFirstLogin = responseData.isFirstLogin;
        message = responseData.message;
      }

      // Check if tokens are available
      if (!accessToken) {
        console.error("No access token found in response:", responseData);

        // Fallback: Check if tokens were stored by authService
        const storedToken = localStorage.getItem("authToken");
        if (storedToken) {
          console.log("Using stored token from localStorage");
          const decoded = decodeJWT(storedToken);
          const user = extractUserFromJWT(decoded);

          setAuthState({ user, isAuthenticated: true });
          storage.setUser(user);
          return;
        }

        throw new Error("No access token returned");
      }

      console.log("Login response data:", {
        isFirstLogin,
        message,
        hasAccessToken: !!accessToken,
      });

      // Extract user from JWT first to check role
      const decoded = decodeJWT(accessToken);
      const user = extractUserFromJWT(decoded);

      // ✅ BACKEND FIXED: Now properly handles admin users
      console.log(
        "User role:",
        user.role,
        "Backend isFirstLogin:",
        isFirstLogin
      );

      // ✅ NEW: Handle first login flow from fixed backend
      if (isFirstLogin) {
        console.log("First login detected - redirecting to password change");
        localStorage.setItem("isFirstLogin", "true");
        if (message) {
          localStorage.setItem("firstLoginMessage", message);
        }

        // ✅ FIX: Store user data for password change page
        storage.setUser(user);
        storage.setTokens(accessToken, refreshToken);

        // Throw a special error to trigger first login flow
        throw new Error("FIRST_LOGIN_REQUIRED");
      }

      console.log("Access token received, user extracted:", user);

      setAuthState({ user, isAuthenticated: true });
      storage.setUser(user);
      storage.setTokens(accessToken, refreshToken);

      console.log("🔍 Login successful - User data stored:", user);
      console.log(
        "🔍 User data in localStorage:",
        localStorage.getItem("user")
      );
    } catch (error) {
      console.error("Login error details:", error);
      handleServiceError(error, "Login");
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await authService.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setAuthState({ user: null, isAuthenticated: false });
      storage.clear();
    }
  };

  const updateProfile = async (profileData: Partial<User>): Promise<void> => {
    try {
      const currentUser = authState.user;
      if (!currentUser) throw new Error("No authenticated user");

      const fallbackName = currentUser.name || currentUser.username;
      const payload = {
        fullName:
          (profileData.name ?? currentUser.name ?? "").trim() || fallbackName,
        email: (profileData.email ?? currentUser.email ?? "").trim(),
        phoneNumber: (profileData.phone ?? currentUser.phone ?? "").trim(),
        profilePicture: profileData.image, // ✅ FIX: Include profile picture
      };

      console.log("AuthContext updateProfile - sending payload:", payload);

      const response = await authService.updateProfile(payload as any);
      console.log("AuthContext updateProfile - response:", response);

      if (!response.success)
        throw new Error(response.message || "Profile update failed");

      setAuthState((prev) => ({
        ...prev,
        user: prev.user
          ? {
              ...prev.user,
              ...payload,
              image: profileData.image || prev.user.image, // ✅ FIX: Update image in state
            }
          : null,
      }));
    } catch (error) {
      handleServiceError(error, "Profile update");
    }
  };

  const changePassword = async (
    currentPassword: string,
    newPassword: string
  ): Promise<void> => {
    try {
      // Get current user for username
      const currentUser = authState.user;
      if (!currentUser) {
        throw new Error("User not authenticated");
      }

      console.log(
        "AuthContext changePassword - calling with username:",
        currentUser.username
      );

      const response = await authService.changePassword({
        username: currentUser.username,
        currentPassword,
        newPassword,
        confirmPassword: newPassword,
      });

      console.log("AuthContext changePassword - response:", response);

      if (!response.success)
        throw new Error(response.message || "Password change failed");
    } catch (error) {
      console.error("AuthContext changePassword - error:", error);
      handleServiceError(error, "Password change");
    }
  };

  const approveUser = async (userId: string): Promise<void> => {
    try {
      const response = await authService.approveUser(userId);
      if (!response.success)
        throw new Error(response.message || "Approval failed");
    } catch (error) {
      handleServiceError(error, "Approve user");
    }
  };

  const rejectUser = async (userId: string, reason: string): Promise<void> => {
    try {
      const response = await authService.rejectUser(userId, reason);
      if (!response.success)
        throw new Error(response.message || "Rejection failed");
    } catch (error) {
      handleServiceError(error, "Reject user");
    }
  };

  const getPendingUsers = async (): Promise<User[]> => {
    try {
      const response = await authService.getAllUsers();
      return response.success && response.data
        ? response.data.filter(
            (u: User) => !u.isApproved && !(u as any).isRejected
          )
        : [];
    } catch (error) {
      console.error("Get pending users error:", error);
      return [];
    }
  };

  const getApprovedUsers = async (): Promise<User[]> => {
    try {
      const response = await authService.getAllUsers();
      return response.success && response.data
        ? response.data.filter((u: User) => u.isApproved)
        : [];
    } catch (error) {
      console.error("Get approved users error:", error);
      return [];
    }
  };

  const getRejectedUsers = async (): Promise<User[]> => {
    try {
      const response = await authService.getAllUsers();
      return response.success && response.data
        ? response.data.filter((u: User) => (u as any).isRejected)
        : [];
    } catch (error) {
      console.error("Get rejected users error:", error);
      return [];
    }
  };

  const updateUserRoleByRoleId = async (
    identifier: string,
    roleId: string
  ): Promise<void> => {
    try {
      const response = await authService.updateUserRoleByRoleId(
        identifier,
        roleId
      );
      if (!response.success)
        throw new Error(response.message || "Update user role failed");
    } catch (error) {
      handleServiceError(error, "Update user role");
    }
  };

  const deleteUser = async (
    identifier: string,
    reason: string
  ): Promise<void> => {
    try {
      const response = await authService.deleteUser(identifier, reason);
      if (!response.success)
        throw new Error(response.message || "Delete user failed");
    } catch (error) {
      handleServiceError(error, "Delete user");
    }
  };

  const activateUser = async (identifier: string): Promise<void> => {
    try {
      const response = await authService.activateUser(identifier);
      if (!response.success)
        throw new Error(response.message || "Activate user failed");
    } catch (error) {
      handleServiceError(error, "Activate user");
    }
  };

  const resetPassword = async (identifier: string): Promise<void> => {
    try {
      const response = await authService.resetPassword(identifier);
      if (!response.success)
        throw new Error(response.message || "Reset password failed");
    } catch (error) {
      handleServiceError(error, "Reset password");
    }
  };

  /* ----------------------------- Provider ----------------------------- */
  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        signup,
        logout,
        updateProfile,
        changePassword,
        approveUser,
        rejectUser,
        getPendingUsers,
        getApprovedUsers,
        getRejectedUsers,
        updateUserRoleByRoleId,
        deleteUser,
        activateUser,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/* ----------------------------- Hook Export ----------------------------- */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
