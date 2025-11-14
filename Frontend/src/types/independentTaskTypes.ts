// DTOs and types for Independent Tasks (frontend-aligned to backend)

export type IndependentTaskStatus =
  | 'Pending'
  | 'Accepted'
  | 'Rejected'
  | 'InProgress'
  | 'WaitingReview'
  | 'Approved'
  | 'Reopened'
  | 'Cancelled';

export type IndependentTaskPriority = 'Low' | 'Medium' | 'High' | 'Critical';

export interface IndependentTaskCreateDto {
  title: string;
  description?: string;
  dueDate: string; // ISO string
  status: IndependentTaskStatus; // default Pending
  weight: number; // 1-100
  priority: IndependentTaskPriority; // default Medium
  progress?: number; // 0-100
  assignedToUserId: string;
}

export interface IndependentTaskUpdateDto extends Partial<IndependentTaskCreateDto> {
  taskId: number;
}

export interface IndependentTaskReadDto {
  taskId: number;
  title: string;
  description?: string;
  createdAt: string;
  updatedAt?: string;
  dueDate: string;
  status: IndependentTaskStatus;
  progress: number;
  weight: number;
  createdByUserId: string;
  assignedToUserId: string;
}


