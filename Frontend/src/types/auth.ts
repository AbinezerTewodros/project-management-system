export type UserRole = "admin" | "manager" | "supervisor" | "member" | "director" | "president" | "vice_president";

export interface User {
  id: string;
  email: string;
  employeeId: string;
  role: UserRole;
  name?: string;
  username: string;
  password: string;
  phone?: string;
  isApproved: boolean;
  isRejected?: boolean;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  roleUpdatedBy?: string;
  roleUpdatedAt?: string;
  deleteReason?: string;
  deletedBy?: string;
  deletedAt?: string;
  createdAt: string;
  skills?: string[];
  image?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}
