// milestoneTypes.ts

// Enum mappings from C#
export enum MilestoneStatus {
  Pending = 'Pending',
  Planning = 'Planning',
  InProgress = 'InProgress',
  OnHold = 'OnHold',
  Completed = 'Completed',
  Cancelled = 'Cancelled'
}

export enum MilestoneAssignmentStatus {
  Pending = 'Pending',
  Accepted = 'Accepted',
  Rejected = 'Rejected'
}

// DTO Types
export interface CreateMilestoneDto {
  milestoneName: string;
  description?: string;
  assignedMemberId?: string;
  projectId: number;
  startDate: string; // ISO string format
  dueDate: string; // ISO string format
  weight?: number;
  status?: MilestoneStatus;
}

export interface MilestoneProgressDto {
  milestoneId: number;
  progress: number;
}

export interface MilestoneReadDto {
  milestoneId: number;
  milestoneName: string;
  description?: string;
  assignedMemberId?: string;
  dueDate?: string;
  weight: number;
  status: MilestoneStatus;
  projectId: number;
  createdAt: string;
  updatedAt?: string;
  progress: number;
  
  // Assignment Approval Fields
  assignmentStatus: MilestoneAssignmentStatus;
  assignmentAcceptedDate?: string;
  assignmentRejectionReason?: string;
}

export interface UpdateMilestoneDto {
  milestoneId: number;
  milestoneName: string;
  description?: string;
  dueDate?: string;
  weight: number;
  status: MilestoneStatus;
  assignedMemberId?: string;
  progress: number;
}

export interface ValidateMilestoneDatesDto {
  milestoneId?: number;
  taskStartDate?: string;
  taskDueDate?: string;
}

// Additional types for frontend usage
export interface Milestone {
  id: string; // For frontend usage (string conversion of milestoneId)
  milestoneId: number; // Backend ID
  title: string; // Alias for milestoneName
  milestoneName: string;
  description?: string;
  assignee?: string; // Frontend display name
  assigneeId?: string; // Backend ID
  dueDate: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent'| 'Critical'; // Frontend specific
  status: MilestoneStatus;
  progress: number;
  createdBy: string;
  project: string; // Project ID as string for frontend
  projectId: number; // Backend project ID
  weight: number;
  tasks: any[]; // Frontend tasks array
  createdAt: string;
  comments?: Comment[];
  files?: FileAttachment[];
  
  // Assignment status for delegated view
  assignmentStatus?: MilestoneAssignmentStatus;
  assignmentAcceptedDate?: string;
  assignmentRejectionReason?: string;
}

export interface Comment {
  id: string;
  author: string;
  content: string;
  timestamp: Date;
}

export interface FileAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  lastModified?: number;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

export interface MilestoneCreateResponse {
  milestoneId: number;
  milestoneName: string;
  status: MilestoneStatus;
  createdAt: string;
}

export interface MilestoneUpdateResponse {
  milestoneId: number;
  milestoneName: string;
  status: MilestoneStatus;
  updatedAt: string;
}

// Filter and Search Types
export interface MilestoneFilter {
  status?: MilestoneStatus;
  priority?: 'Low' | 'Medium' | 'High' | 'Urgent';
  projectId?: number;
  assignedTo?: string;
  searchText?: string;
}

// Form Types for UI
export interface MilestoneFormData {
  milestoneName: string;
  description: string;
  assignedMemberId: string;
  projectId: number;
  startDate: string;
  dueDate: string;
  weight: number;
  status: MilestoneStatus;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent'| 'Critical';
}

// Assignment Action Types
export interface MilestoneAssignmentAction {
  milestoneId: number;
  action: 'accept' | 'reject';
  rejectionReason?: string;
}

// Progress Update Types
export interface ProgressUpdateRequest {
  milestoneId: number;
  progress: number;
}

// Statistics Types
export interface MilestoneStatistics {
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
  overdue: number;
  completionRate: number;
}

// Export all types as a namespace for easier imports
// export type {
//   CreateMilestoneDto as CreateMilestoneRequest,
//   MilestoneReadDto as MilestoneResponse,
//   UpdateMilestoneDto as UpdateMilestoneRequest,
//   ValidateMilestoneDatesDto as ValidateDatesRequest
// };

// Utility types for component props
export interface MilestoneCardProps {
  milestone: MilestoneReadDto | Milestone;
  darkMode?: boolean;
  onViewDetails?: (milestoneId: number) => void;
  onEdit?: (milestone: Milestone) => void;
  onDelete?: (milestoneId: number) => void;
  onAcceptAssignment?: (milestoneId: number) => void;
  onRejectAssignment?: (milestoneId: number, reason: string) => void;
}

export interface MilestoneListProps {
  milestones: (MilestoneReadDto | Milestone)[];
  loading?: boolean;
  darkMode?: boolean;
  onMilestoneClick?: (milestone: MilestoneReadDto | Milestone) => void;
  filters?: MilestoneFilter;
}

// Default values for forms
export const defaultCreateMilestoneData: CreateMilestoneDto = {
  milestoneName: '',
  description: '',
  assignedMemberId: '',
  projectId: 0,
  startDate: new Date().toISOString().split('T')[0],
  dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
  weight: 5,
  status: MilestoneStatus.Pending
};

export const defaultMilestoneFormData: MilestoneFormData = {
  milestoneName: '',
  description: '',
  assignedMemberId: '',
  projectId: 0,
  startDate: new Date().toISOString().split('T')[0],
  dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  weight: 5,
  status: MilestoneStatus.Pending,
  priority: 'Medium'
};

// Status options for dropdowns
export const milestoneStatusOptions = [
  { value: MilestoneStatus.Pending, label: 'Pending', color: 'gray' },
  { value: MilestoneStatus.Planning, label: 'Planning', color: 'blue' },
  { value: MilestoneStatus.InProgress, label: 'In Progress', color: 'yellow' },
  { value: MilestoneStatus.OnHold, label: 'On Hold', color: 'orange' },
  { value: MilestoneStatus.Completed, label: 'Completed', color: 'green' },
  { value: MilestoneStatus.Cancelled, label: 'Cancelled', color: 'red' }
];

export const assignmentStatusOptions = [
  { value: MilestoneAssignmentStatus.Pending, label: 'Pending', color: 'yellow' },
  { value: MilestoneAssignmentStatus.Accepted, label: 'Accepted', color: 'green' },
  { value: MilestoneAssignmentStatus.Rejected, label: 'Rejected', color: 'red' }
];

export const priorityOptions = [
  { value: 'Critical', label: 'Critical', color: 'red' },
  { value: 'Low', label: 'Low', color: 'green' },
  { value: 'Medium', label: 'Medium', color: 'yellow' },
  { value: 'High', label: 'High', color: 'orange' },
  { value: 'Urgent', label: 'Urgent', color: 'red' }
];

// Helper functions
export const formatMilestoneForDisplay = (milestone: MilestoneReadDto): Milestone => ({
  id: milestone.milestoneId.toString(),
  milestoneId: milestone.milestoneId,
  title: milestone.milestoneName,
  milestoneName: milestone.milestoneName,
  description: milestone.description,
  assigneeId: milestone.assignedMemberId,
  dueDate: milestone.dueDate || '',
  priority: 'Medium', // Default, can be mapped from backend if available
  status: milestone.status,
  progress: milestone.progress,
  createdBy: 'System', // Would come from backend
  project: milestone.projectId.toString(),
  projectId: milestone.projectId,
  weight: milestone.weight,
  tasks: [],
  createdAt: milestone.createdAt,
  assignmentStatus: milestone.assignmentStatus,
  assignmentAcceptedDate: milestone.assignmentAcceptedDate,
  assignmentRejectionReason: milestone.assignmentRejectionReason
});

export const isMilestoneOverdue = (milestone: MilestoneReadDto | Milestone): boolean => {
  if (!milestone.dueDate) return false;
  const dueDate = new Date(milestone.dueDate);
  const today = new Date();
  return dueDate < today && milestone.status !== MilestoneStatus.Completed;
};

export const getMilestoneProgressColor = (progress: number): string => {
  if (progress < 30) return 'red';
  if (progress < 70) return 'yellow';
  return 'green';
};

export const getStatusColor = (status: MilestoneStatus): string => {
  const colors = {
    [MilestoneStatus.Pending]: 'gray',
    [MilestoneStatus.Planning]: 'blue',
    [MilestoneStatus.InProgress]: 'yellow',
    [MilestoneStatus.OnHold]: 'orange',
    [MilestoneStatus.Completed]: 'green',
    [MilestoneStatus.Cancelled]: 'red'
  };
  return colors[status] || 'gray';
};

export const getAssignmentStatusColor = (status: MilestoneAssignmentStatus): string => {
  const colors = {
    [MilestoneAssignmentStatus.Pending]: 'yellow',
    [MilestoneAssignmentStatus.Accepted]: 'green',
    [MilestoneAssignmentStatus.Rejected]: 'red'
  };
  return colors[status] || 'gray';
};