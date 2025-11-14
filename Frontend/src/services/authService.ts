import { apiClient } from "@/lib/api";

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn?: number;
  isFirstLogin: boolean;
  message?: string; // For first login message
  jwtResponse?: {
    // ✅ FIX: Add jwtResponse property for nested structure
    accessToken: string;
    refreshToken: string;
    isFirstLogin: boolean;
  };
  user?: {
    id: string;
    username: string;
    email: string;
    roles: string[];
  };
}

export interface SignupRequest {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  confirmPassword: string;
  department: string;
  role: string;
  phoneNumber: string;
  employeeId?: string;
}

export interface ChangePasswordRequest {
  username?: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  department?: string;
  bio?: string;
  profilePicture?: string;
  // Backend-compatible alias
  fullName?: string;
}

/**
 * Admin create-user payload (matches /api/admin/create-user expectations)
 * - password fields optional to support both automated and manual initial setups.
 */
export interface AdminCreateUserRequest {
  employeeId: string;
  fullName?: string;
  username?: string;
  email?: string;
  department?: string;
  phoneNumber?: string;
  company?: string;
  title?: string;
  role: string;
  password?: string;
  confirmPassword?: string;
}

export interface AdminEditUserRequest {
  identifier: string; // employeeId, email, or username
  fullName?: string;
  email?: string;
  department?: string;
  title?: string;
  phoneNumber?: string;
  company?: string;
  role?: string;
  status?: string;
}

export class AuthService {
  async login(credentials: LoginRequest) {
    // Normalize request field names to what the backend expects (PascalCase)
    // Some servers may rely on exact property names or case-sensitive binding in edge cases,
    // so send both a tolerant payload and the expected PascalCase keys.
    const payload = {
      Username:
        (credentials as any).username ?? (credentials as any).Username ?? (credentials as any).email ?? (credentials as any).Email,
      Password: (credentials as any).password ?? (credentials as any).Password,
    };

    const response = await apiClient.post<LoginResponse>("/Auth/login", payload);

    if (response.success && response.data) {
      // ✅ FIX: Handle nested jwtResponse structure for first login
      let accessToken, refreshToken, isFirstLogin, message;

      if (response.data.jwtResponse) {
        // First login response structure: { message: "...", jwtResponse: { accessToken, refreshToken, isFirstLogin } }
        const jwtData = response.data.jwtResponse;
        accessToken = jwtData.accessToken;
        refreshToken = jwtData.refreshToken;
        isFirstLogin = jwtData.isFirstLogin;
        message = response.data.message;
      } else {
        // Normal response structure: { accessToken, refreshToken, isFirstLogin, message }
        accessToken = response.data.accessToken;
        refreshToken = response.data.refreshToken;
        isFirstLogin = response.data.isFirstLogin;
        message = response.data.message;
      }

      if (accessToken) {
        apiClient.setToken(accessToken);
        localStorage.setItem("authToken", accessToken);
      }
      if (refreshToken) {
        localStorage.setItem("refreshToken", refreshToken);
      }

      // Store first login status for frontend handling
      if (isFirstLogin !== undefined) {
        localStorage.setItem("isFirstLogin", isFirstLogin.toString());
      }
      if (message) {
        localStorage.setItem("loginMessage", message);
      }
    }

    return response;
  }

  async signup(userData: SignupRequest) {
    return apiClient.post("/Auth/register", userData);
  }

  async logout() {
    const response = await apiClient.post("/Auth/logout");
    apiClient.clearToken();
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    localStorage.removeItem("authToken");
    return response;
  }

  async refreshToken(refreshToken: string) {
    const response = await apiClient.post<LoginResponse>(
      "/Auth/refresh-token",
      { token: refreshToken }
    );
    if (response.success && response.data) {
      apiClient.setToken(response.data.accessToken);
      if (response.data.refreshToken) {
        localStorage.setItem("refreshToken", response.data.refreshToken);
      }
      if (response.data.user) {
        localStorage.setItem("user", JSON.stringify(response.data.user));
      }
    }
    return response;
  }

  async changePassword(passwordData: ChangePasswordRequest) {
    // ✅ FIX: Remove confirmPassword field - backend doesn't expect it
    console.log("authService.changePassword called with:", {
      username: passwordData.username,
      currentPasswordLength: passwordData.currentPassword?.length,
      newPasswordLength: passwordData.newPassword?.length,
    });

    console.log("Making API call to /User/change-password");

    const requestPayload = {
      username: passwordData.username,
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword,
    };

    console.log("📦 Request payload:", JSON.stringify(requestPayload, null, 2));

    try {
      const response = await apiClient.post(
        "/User/change-password",
        requestPayload
      );
      console.log("✅ Password change response:", response);
      return response;
    } catch (error) {
      console.error("❌ Password change error:", error);
      throw error;
    }
  }

  // ✅ NEW: Get current user info from backend
  async getCurrentUser() {
    return apiClient.get("/User/me");
  }

  async updateProfile(profileData: UpdateProfileRequest) {
    // Accepts either UpdateProfileRequest or the backend-friendly { fullName, email, phoneNumber }
    const payload: Record<string, unknown> = {
      ...profileData,
    };

    // If caller sent firstName/lastName, prefer constructing fullName for backend compatibility
    if (
      (profileData.firstName || profileData.lastName) &&
      !profileData.fullName
    ) {
      payload.fullName = `${profileData.firstName ?? ""} ${
        profileData.lastName ?? ""
      }`.trim();
    }

    // Map phoneNumber key if the backend expects phoneNumber specifically
    if (profileData.phoneNumber) {
      payload.phoneNumber = profileData.phoneNumber;
    }

    return apiClient.put("/UserProfile/update", payload);
  }

  async getProfile() {
    return apiClient.get("/UserProfile/me");
  }

  // Admin functions
  async approveUser(userId: string) {
    return apiClient.post(`/admin/approve-user/${userId}`);
  }

  async rejectUser(userId: string, reason: string) {
    return apiClient.post(`/admin/reject-user/${userId}`, { reason });
  }

  async getAllUsers() {
    return apiClient.get("/admin/all-users");
  }

  async updateUserRoleByRoleId(identifier: string, roleId: string) {
    // Backend expects: { identifier, roleId }
    return apiClient.put("/admin/update-role", { identifier, roleId });
  }

  async deleteUser(identifier: string, reason: string) {
    return apiClient.delete(
      `/admin/delete-user/${encodeURIComponent(
        identifier
      )}?reason=${encodeURIComponent(reason)}`
    );
  }

  async createUser(userData: AdminCreateUserRequest) {
    console.log("🔍 AuthService createUser called with:", userData);
    console.log("📦 Request payload:", JSON.stringify(userData, null, 2));

    // ✅ FIX: Remove confirmPassword field - backend doesn't expect it (like password change)
    const { confirmPassword, password, ...backendPayload } = userData;

    // ✅ CRITICAL: Backend requires specific field names and structure
    // Backend expects: employeeId, role, fullName, username, email, etc.
    // The backend tries AD lookup first, if fails, uses manual entry
    console.log(
      "🔄 Backend payload (without password fields):",
      JSON.stringify(backendPayload, null, 2)
    );

    try {
      const response = await apiClient.post(
        "/admin/create-user",
        backendPayload
      );
      console.log("✅ Create user response:", response);

      if (
        !response.success &&
        response.errors &&
        Array.isArray(response.errors)
      ) {
        console.error("❌ Validation errors:", response.errors);
        // Log each error for clarity
        response.errors.forEach((error: string, index: number) => {
          console.error(`   ${index + 1}. ${error}`);
        });
      }

      return response;
    } catch (error: any) {
      console.error("❌ Create user error:", error);
      console.error("❌ Error details:", {
        message: error?.message,
        response: error?.response,
        errors: error?.errors,
        raw: error?.raw,
      });
      throw error;
    }
  }

  async editUser(userData: AdminEditUserRequest) {
    return apiClient.put("/admin/edit-user", userData);
  }

  async getAllRoles() {
    return apiClient.get("/admin/roles");
  }

  async activateUser(identifier: string) {
    return apiClient.post(
      `/admin/activate-user/${encodeURIComponent(identifier)}`
    );
  }

  async resetPassword(identifier: string) {
    return apiClient.post(
      `/admin/reset-password/${encodeURIComponent(identifier)}`
    );
  }
}

export const authService = new AuthService();
