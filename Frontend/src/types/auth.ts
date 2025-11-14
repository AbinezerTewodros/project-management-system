export type UserRole = string; // Dynamic role from database

export interface User {
  id: string;
  email: string;
  employeeId: string;
  role: UserRole;
  name?: string;
  fullName: string;
  username: string;
  password: string;
  phone?: string;
  department?: string;
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
export const projects = [
  {
    id: "1",
    name: "Digital Banking Platform Modernization",
    description: "Main company website redesign",
    status: "active", // 'active', 'completed', or 'onHold'
    priority: "High", // 'High', 'Medium', or 'Low'
    creator: "Surafel Kassahun",
    members: ["Mahlet", "Bereket", "Nahom"],
  },
  {
    id: "2",
    name: "Cybersecurity Enhancement Program",
    description: "Main company website redesign",
    status: "active", // 'active', 'completed', or 'onHold'
    priority: "low", // 'High', 'Medium', or 'Low'
    creator: "Surafel Kassahun",
    members: ["Mahlet", "Dehine", "Nahom"],
  },
  {
    id: "3",
    name: "Financial Literacy Portal",
    description: "Main company website redesign",
    status: "active", // 'active', 'completed', or 'onHold'
    priority: "medium", // 'High', 'Medium', or 'Low'
    creator: "Surafel Kassahun",
    members: ["Mahlet", "kalkidan", "selamawit"],
  },
];
