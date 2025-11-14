// ======================================================================================
// Enums
// ======================================================================================

// Project Task Status - must match Backend/Model/Entities/ProjectTask.cs
export enum TaskStatus {
  Pending = 'Pending',
  Accepted = 'Accepted',
  Rejected = 'Rejected',
  Completed = 'Completed',
  InProgress = 'InProgress',
  WaitingForReview = 'WaitingForReview',
}

// Project Task Priority - must match Backend/Model/Entities/ProjectTask.cs
export enum TaskPriority {
  Low = 'Low',
  Medium = 'Medium',
  High = 'High',
  Critical = 'Critical', // ✅ Added missing Critical priority
}

// Independent Task specific enums to match backend
export enum IndependentTaskStatus {
  Pending = "Pending",
  Accepted = "Accepted",
  Rejected = "Rejected",
  InProgress = "InProgress",
  WaitingReview = "WaitingReview",
  Approved = "Approved",
  Reopened = "Reopened",
  Cancelled = "Cancelled",
}

export enum IndependentTaskPriority {
  Low = "Low",
  Medium = "Medium",
  High = "High",
  Critical = "Critical",
}

// ======================================================================================
// Member Types
// ======================================================================================

export interface Member {
  id: string;
  name: string;
  role: string;
  projectId?: string[];
  department?: string; // ✅ NEW: For department-based filtering
}

export interface Project {
  id: string;
  name: string;
  members: Member[];
}

export interface CreateTaskModalProps {
  open: boolean;
  onClose: () => void;
  defaultProjectId?: number;
  initialProjectId?: string;
  projects: Project[];
  allMembers: Member[];
  darkMode: boolean;
  onCreate?: () => void;
}

// ======================================================================================
// Common Interfaces
// ======================================================================================

export interface PaginatedResult<T> {
  items: T[];
  pageNumber: number;
  totalPages: number;
  totalCount: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface DeleteResponseDto {
  success: boolean;
  message: string;
}

// ======================================================================================
// Task Comment Types
// ======================================================================================

export interface TaskCommentCreateDto {
  content: string;
}

export interface TaskCommentReadDto {
  id: number;
  content: string;
  authorId: string;
  createdAt: string;
}

// ======================================================================================
// Task History Types
// ======================================================================================

export interface TaskHistoryReadDto {
  id: number;
  taskId: number;
  fieldName: string;
  oldValue: string;
  newValue: string;
  changedById: string;
  changedAt: string;
}

// ======================================================================================
// Summary & Analytics Types
// ======================================================================================

export interface TaskStatusSummaryDto {
  todo: number;
  inProgress: number;
  done: number;
  total: number;
}

export interface TaskPrioritySummaryDto {
  low: number;
  medium: number;
  high: number;
  total: number;
}

export interface UserTaskLoadDto {
  userId: string;
  userName: string;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
}

export interface GanttChartDataDto {
  id: number;
  title: string;
  start: string;
  end: string;
  progress: number;
  dependencies: number[];
}

// ======================================================================================
// Project Task Types
// ======================================================================================

export interface ProjectTaskCreateDto {
  projectAssignmentId: number;
  title: string;
  description: string;
  dueDate?: string;
  priority: TaskPriority;
  status: TaskStatus;
  assignedMemberId?: string;
  weight: number; // Required: 1-100
  milestoneId?: number; // Optional: Assign to milestone
  parentTaskId?: number; // Optional: For subtasks
  startDate?: string; // Optional: Task start date
  estimatedHours?: number; // Optional: Time estimation
  isAutoCreateTodo?: boolean; // Optional: Auto-create TodoItem (default: true)
}

export interface ProjectTaskReadDto {
  id: number;
  title: string;
  description: string;
  dueDate: string;
  priority: TaskPriority;
  status: TaskStatus;
  progress: number;
  projectAssignmentId: number;
  assignedMemberId: string;
  
  createdAt: string;
  updatedAt: string;
  projectTaskId?: number;
  createdByUserId?: string; // Who created this task
}

export interface ProjectTaskUpdateDto {
  title?: string;
  description?: string;
  dueDate?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  assignedMemberId?: string;
  progress?: number;
}

// ======================================================================================
// Independent Task Types
// ======================================================================================

export interface IndependentTaskCreateDto {
  title: string;
  description: string;
  dueDate: string;
  status: IndependentTaskStatus;
  weight: number;
  priority: IndependentTaskPriority;
  progress: number;
  assignedToUserId: string;
}

export interface IndependentTaskReadDto {
  taskId: number;
  title: string;
  description?: string;
  createdAt: string;
  updatedAt?: string;
  startDate?: string;
  completedDate?: string;
  dueDate: string;
  status: IndependentTaskStatus;
  progress: number;
  weight: number;
  priority: IndependentTaskPriority;
  createdByUserId: string;
  assignedToUserId: string;
  rejectionReason?: string;
  completionDetails?: string;
  lateCompletionReason?: string;
  approvalComments?: string;
  reopenReason?: string;
  createdByUserName?: string;
  assignedToUserName?: string;
  isCompleted: boolean;
  isOverdue: boolean;
  daysUntilDue: number;
}

export interface IndependentTaskUpdateDto {
  taskId: number;
  title?: string;
  description?: string;
  dueDate?: string;
  status?: IndependentTaskStatus;
  progress?: number;
  weight?: number;
  priority?: IndependentTaskPriority;
  assignedToUserId?: string;
}

// ======================================================================================
// Personal Todo Enums (matching backend)
// ======================================================================================

export enum PersonalTodoPriority {
  Low = "Low",
  Medium = "Medium",
  High = "High",
  Critical = "Critical"
}

export enum PersonalTodoStatus {
  Pending = "Pending",
  InProgress = "InProgress",
  Completed = "Completed",
  Overdue = "Overdue",
  Cancelled = "Cancelled"
}

// ======================================================================================
// Personal Todo Types
// ======================================================================================

export interface PersonalTodoCreateDto {
  task: string;
  description?: string;
  dueDate?: string; // Frontend sends as string, backend converts to DateTime
  priority?: PersonalTodoPriority;
  enableReminders?: boolean;
  reminderHoursBeforeDue?: number;
  enableEmailReminders?: boolean;
  enablePushNotifications?: boolean;
  enableSmsReminders?: boolean;
  tags?: string;
  notes?: string;
  isRecurring?: boolean;
  recurrencePattern?: string;
}

export interface PersonalTodoReadDto {
  todoId: number;
  task: string;
  description?: string;
  isCompleted: boolean;
  progress: number;
  createdAt: string; // Backend returns as string in JSON
  updatedAt?: string;
  dueDate?: string;
  startDate?: string;
  completedDate?: string;
  priority: PersonalTodoPriority;
  status: PersonalTodoStatus;
  enableReminders: boolean;
  reminderHoursBeforeDue?: number;
  lastReminderSent?: string;
  enableEmailReminders: boolean;
  enablePushNotifications: boolean;
  enableSmsReminders: boolean;
  tags?: string;
  notes?: string;
  isRecurring: boolean;
  recurrencePattern?: string;
  isOverdue: boolean;
  timeUntilDueFormatted?: string;
  needsReminder: boolean;
  daysUntilDue?: number;
  hoursUntilDue?: number;
}

export interface PersonalTodoUpdateDto {
  task?: string;
  description?: string;
  isCompleted?: boolean;
  progress?: number;
  dueDate?: string; // Frontend sends as string, backend converts to DateTime
  startDate?: string;
  priority?: PersonalTodoPriority;
  status?: PersonalTodoStatus;
  enableReminders?: boolean;
  reminderHoursBeforeDue?: number;
  enableEmailReminders?: boolean;
  enablePushNotifications?: boolean;
  enableSmsReminders?: boolean;
  tags?: string;
  notes?: string;
  isRecurring?: boolean;
  recurrencePattern?: string;
}

// ======================================================================================
// Todo Item Types (if needed)
// ======================================================================================

export interface TodoItemCreateDto {
  projectTaskId: number;
  title: string;
  assignedById: string;
  description?: string;
  weight: number;
}

export interface TodoItemReadDto {
  id: number;
  projectTaskId: number;
  title: string;
  description?: string;
  dueDate?: string;
  priority: TaskPriority;
  weight: number; // 0-100
  progress: number; // 0-100
  status: 'Pending' | 'Accepted' | 'Rejected' | 'InProgress' | 'WaitingForReview' | 'Approved' | 'Reopened';
  assigneeId: string;
  assignedBy: string;
  acceptedDate?: string;
  startDate?: string;
  rejectionReason?: string;
  completionDetails?: string;
  detailsForLateCompletion?: string;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TodoItemUpdateDto {
  title?: string;
  description?: string;
  dueDate?: string;
  priority?: TaskPriority;
  isCompleted?: boolean;
}

// ======================================================================================
// Unified Task Type for Frontend
// ======================================================================================

export interface Task {
  id: string;
  taskId?: number; // For Independent Tasks
  // For Project Tasks
  title: string;
  description: string;
  dueDate?: string;
  priority: TaskPriority;
  status: TaskStatus;
  progress: number;
  isCompleted: boolean;
  type: "Project" | "Independent" | "Todo" | "Personal";
  assignee?: string;
  projectId?: string;
  createdAt?: string;
  updatedAt?: string;
  weight?: number;
  deleted?: boolean;
  files?: FileAttachment[];
  subtask?: SubTask[];
  key?: string;
  lastUpdated?: string;
  createdByUserId?: string; // Who created this task
}

export interface SubTask {
  id: string;
  key: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  assignee?: string;
  status: string;
  completed?: boolean;
  confirmed?: boolean;
}

export interface FileAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  lastModified?: number;
}

export interface TasksProps {
  darkMode: boolean;
  initialProjectId?: string;
}

// ======================================================================================
// Context & State Types
// ======================================================================================

export interface TaskState {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  filters: {
    status: string;
    priority: string;
    assignee: string;
    searchText: string;
    showDeleted: boolean;
  };
}

export type TaskAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_TASKS"; payload: Task[] }
  | { type: "ADD_TASK"; payload: Task }
  | { type: "UPDATE_TASK"; payload: Task }
  | { type: "DELETE_TASK"; payload: string };

// ======================================================================================
// API Response Types (if not already defined elsewhere)
// ======================================================================================

export interface ApiResponse<T> {
  data: T | null;
  success: boolean;
  message?: string;
  errors?: string[];
  status?: number;
  raw?: any;
}

export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}
