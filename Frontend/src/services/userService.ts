import { apiClient } from '@/lib/api';

// User domain specific lightweight DTOs (expand if needed)
export interface UserSummary {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  department?: string;
  role?: string;
  phoneNumber?: string;
}

export class UserService {
  // GET /api/User/users-by-department/{departmentName}
  getUsersByDepartment(departmentName: string) {
    return apiClient.get<UserSummary[]>(`/User/users-by-department/${encodeURIComponent(departmentName)}`);
  }

  // GET /api/User/users-by-manager/{manager}
  getUsersByManager(manager: string) {
    return apiClient.get<UserSummary[]>(`/User/users-by-manager/${encodeURIComponent(manager)}`);
  }

  // GET /api/User - Get all users (if this endpoint exists)
  getAllUsers() {
    return apiClient.get<UserSummary[]>('/User');
  }

  // GET /api/User/me - Get current user
  getCurrentUser() {
    return apiClient.get<UserSummary>('/User/me');
  }
}

export const userService = new UserService();
