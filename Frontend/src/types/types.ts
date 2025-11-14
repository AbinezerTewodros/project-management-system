export type Employee = {
  id: string;
  employeeId?: string; // Backend Employee ID (e.g., "EMP12345")
  name: string;
  department: string;
  position: string;
  role?: 'team_member' | 'scrum_master' | 'team_leader' | string; // Project role OR organizational role
  email: string;
  phone?: string;
  avatar?: string;
};

export type Subtask = {
  id: string;
  title: string;
  description?: string;
  priority?: 'High' | 'Medium' | 'Low' | 'Urgent';
  assignee?: string;
  status?: 'Pending' | 'Planning' | 'InProgress' | 'OnHold' | 'Completed' | 'Cancelled';
  key?: string;
  progress?: number;
  weight?: number;
  completed?: boolean;
};

export type Milestone = {
  files?: {
    id: number;
    name: string;
    size: number;
    type: string;
    url: string;
  }[];
  id: string;
  title: string;
  description: string;
  assignee: string;
  assigneeId: string;
  status: 'Pending' | 'Planning' | 'InProgress' | 'OnHold' | 'Completed' | 'Cancelled';
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  dueDate: string;
  startDate?: string; // Add startDate field
  weight?: number;
  tasks?: Task[];
};

export type Task = {
  files?: {
    id: number;
    name: string;
    size: number;
    type: string;
    url: string;
  }[];
  id: string;
  title: string;
  description: string;
  assignee: string;
  assigneeId: string;
  status: 'Pending' | 'Accepted' | 'Rejected' | 'InProgress' | 'WaitingForReview' | 'Completed'; // ✅ TaskStatus enum from backend
  priority: 'Low' | 'Medium' | 'High';
  dueDate: string;
  weight?: number;
  milestoneId?: string; // ✅ NEW: For assigning task to milestone
  subtask?: Subtask[];
};

export type Project = {
  id: number;
  title: string;
  description: string;
  dueDate: string;
  createdBy: string;
  // Project owner details (required by backend for updates)
  projectOwner?: string;
  projectOwnerEmail?: string;
  projectOwnerPhone?: string;
  department?: string;
  teamMembers: Employee[];
  scrumMaster: Employee | null;
  teamLeader: Employee | null;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  status: 'Not Started' | 'Pending Approval' | 'Active' | 'In Progress' | 'On Hold' | 'Completed' | 'Archived'; // ✅ All possible backend status values
  progress: number;
  files: {
    id: number;
    name: string;
    size: number;
    type: string;
    url: string;
  }[];
  milestones?: Milestone[];
  tasks: Task[];
  // ✅ Assignment fields (for delegated projects)
  assignmentId?: number;
  role?: 'Scrum Master' | 'Team Leader' | 'Member' | string; // Your role in the project
  assignedBy?: string; // Who assigned it to you
  assignedTo?: string; // Who it's assigned to (you)
  rejectionReason?: string;
  isTerminated?: boolean | null;
};