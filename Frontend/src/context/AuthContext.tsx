import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { User, AuthState } from "@/types/auth";

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, employeeId: string, role: string, username: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (profileData: Partial<User>) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  approveUser: (userId: string) => Promise<void>;
  rejectUser: (userId: string) => Promise<void>;
  getPendingUsers: () => User[];
  getApprovedUsers: () => User[];
  getRejectedUsers: () => User[];
  updateUserRole: (userId: string, newRole: string) => Promise<void>;
  deleteUser: (userId: string, reason: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        return {
          user,
          isAuthenticated: true,
        };
      } catch (error) {
        console.error("Error parsing stored user:", error);
        localStorage.removeItem("user");
        return {
          user: null,
          isAuthenticated: false,
        };
      }
    }
    return {
      user: null,
      isAuthenticated: false,
    };
  });

  // Initialize admin user if not exists
  useEffect(() => {
    const users = JSON.parse(localStorage.getItem("users") || "[]");
    const adminExists = users.some((user: User) => user.role === "admin");

    if (!adminExists) {
      const mockUsers: User[] = [
        {
          id: "admin-001",
          email: "admin@cbe.com",
          employeeId: "ADM001",
          role: "admin",
          username: "admin",
          password: "admin123",
          isApproved: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: "pres-001",
          email: "president@cbe.com",
          employeeId: "PRES001",
          role: "president",
          username: "president",
          password: "pres123",
          isApproved: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: "vp-001",
          email: "vp@cbe.com",
          employeeId: "VP001",
          role: "vice_president",
          username: "vp",
          password: "vp123",
          isApproved: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: "dir-001",
          email: "director@cbe.com",
          employeeId: "DIR001",
          role: "director",
          username: "director",
          password: "dir123",
          isApproved: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: "mgr-001",
          email: "manager@cbe.com",
          employeeId: "MGR001",
          role: "manager",
          username: "manager",
          password: "mgr123",
          isApproved: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: "sup-001",
          email: "supervisor@cbe.com",
          employeeId: "SUP001",
          role: "supervisor",
          username: "supervisor",
          password: "sup123",
          isApproved: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: "mem-001",
          email: "member@cbe.com",
          employeeId: "MEM001",
          role: "member",
          username: "member",
          password: "mem123",
          isApproved: true,
          createdAt: new Date().toISOString(),
        }
      ];
      localStorage.setItem("users", JSON.stringify(mockUsers));
    }
  }, []);

  // Update localStorage when auth state changes
  useEffect(() => {
    if (authState.isAuthenticated && authState.user) {
      localStorage.setItem("user", JSON.stringify(authState.user));
    } else {
      localStorage.removeItem("user");
    }
  }, [authState]);

  const signup = async (email: string, employeeId: string, role: string, username: string, password: string) => {
    try {
      const users = JSON.parse(localStorage.getItem("users") || "[]");

      // Check if user already exists
      if (users.some((user: User) => user.email === email)) {
        throw new Error("User with this email already exists");
      }

      const newUser: User = {
        id: "user-" + Math.floor(Math.random() * 10000),
        email,
        employeeId,
        role: role as User["role"],
        username,
        password,
        isApproved: false,
        createdAt: new Date().toISOString(),
      };

      users.push(newUser);
      localStorage.setItem("users", JSON.stringify(users));

      // Don't automatically log in the user
      setAuthState({
        user: null,
        isAuthenticated: false,
      });
    } catch (error) {
      console.error("Signup error:", error);
      throw error;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const users = JSON.parse(localStorage.getItem("users") || "[]");
      const user = users.find((u: User) => u.email === email && u.password === password);

      if (!user) {
        throw new Error("Invalid credentials");
      }

      if (!user.isApproved && user.role !== "admin") {
        throw new Error("Your account is pending approval. Please wait for admin approval.");
      }

      setAuthState({
        user,
        isAuthenticated: true,
      });
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const approveUser = async (userId: string) => {
    try {
      const users = JSON.parse(localStorage.getItem("users") || "[]");
      const userIndex = users.findIndex((u: User) => u.id === userId);

      if (userIndex === -1) {
        throw new Error("User not found");
      }

      users[userIndex] = {
        ...users[userIndex],
        isApproved: true,
        approvedBy: authState.user?.id,
        approvedAt: new Date().toISOString(),
      };

      localStorage.setItem("users", JSON.stringify(users));
    } catch (error) {
      console.error("Approve user error:", error);
      throw error;
    }
  };

  const rejectUser = async (userId: string) => {
    try {
      const users = JSON.parse(localStorage.getItem("users") || "[]");
      const userIndex = users.findIndex((u: User) => u.id === userId);

      if (userIndex === -1) {
        throw new Error("User not found");
      }

      users[userIndex] = {
        ...users[userIndex],
        isApproved: false,
        isRejected: true,
        rejectedAt: new Date().toISOString(),
        rejectedBy: authState.user?.id,
      };

      localStorage.setItem("users", JSON.stringify(users));
    } catch (error) {
      console.error("Reject user error:", error);
      throw error;
    }
  };

  const getPendingUsers = () => {
    const users = JSON.parse(localStorage.getItem("users") || "[]");
    return users.filter((user: User) => !user.isApproved && !user.isRejected);
  };

  const getApprovedUsers = () => {
    const users = JSON.parse(localStorage.getItem("users") || "[]");
    return users.filter((user: User) => user.isApproved);
  };

  const getRejectedUsers = () => {
    const users = JSON.parse(localStorage.getItem("users") || "[]");
    return users.filter((user: User) => user.isRejected);
  };

  const updateProfile = async (profileData: Partial<User>) => {
    try {
      if (!authState.user) {
        throw new Error("User not found");
      }

      const users = JSON.parse(localStorage.getItem("users") || "[]");
      const userIndex = users.findIndex((u: User) => u.id === authState.user?.id);

      if (userIndex === -1) {
        throw new Error("User not found");
      }

      users[userIndex] = { ...users[userIndex], ...profileData };
      localStorage.setItem("users", JSON.stringify(users));

      setAuthState({
        user: users[userIndex],
        isAuthenticated: true,
      });
    } catch (error) {
      console.error("Profile update error:", error);
      throw error;
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      if (!authState.user) {
        throw new Error("User not found");
      }

      if (authState.user.password !== currentPassword) {
        throw new Error("Current password is incorrect");
      }

      const users = JSON.parse(localStorage.getItem("users") || "[]");
      const userIndex = users.findIndex((u: User) => u.id === authState.user?.id);

      if (userIndex === -1) {
        throw new Error("User not found");
      }

      users[userIndex] = { ...users[userIndex], password: newPassword };
      localStorage.setItem("users", JSON.stringify(users));

      setAuthState({
        user: users[userIndex],
        isAuthenticated: true,
      });
    } catch (error) {
      console.error("Password change error:", error);
      throw error;
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const users = JSON.parse(localStorage.getItem("users") || "[]");
      const userIndex = users.findIndex((u: User) => u.id === userId);

      if (userIndex === -1) {
        throw new Error("User not found");
      }

      users[userIndex] = {
        ...users[userIndex],
        role: newRole,
        roleUpdatedAt: new Date().toISOString(),
        roleUpdatedBy: authState.user?.id,
      };

      localStorage.setItem("users", JSON.stringify(users));
    } catch (error) {
      console.error("Update user role error:", error);
      throw error;
    }
  };

  const deleteUser = async (userId: string, reason: string) => {
    try {
      const users = JSON.parse(localStorage.getItem("users") || "[]");
      const userIndex = users.findIndex((u: User) => u.id === userId);

      if (userIndex === -1) {
        throw new Error("User not found");
      }

      users[userIndex] = {
        ...users[userIndex],
        isApproved: false,
        isRejected: true,
        deleteReason: reason,
        deletedAt: new Date().toISOString(),
        deletedBy: authState.user?.id,
      };

      localStorage.setItem("users", JSON.stringify(users));
    } catch (error) {
      console.error("Delete user error:", error);
      throw error;
    }
  };

  const logout = () => {
    setAuthState({
      user: null,
      isAuthenticated: false,
    });
    localStorage.removeItem("user");
  };

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
        updateUserRole,
        deleteUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
