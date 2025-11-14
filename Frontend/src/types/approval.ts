// Project Approval Types - matches Backend DTOs

export enum ProjectApprovalStatus {
  Pending = 'Pending',
  Approved = 'Approved',
  Rejected = 'Rejected',
  AutoApproved = 'AutoApproved'
}

export interface PendingProjectApproval {
  projectId: number;
  projectName: string;
  description: string;
  department: string;
  projectOwner: string;
  createdBy: string;
  createdDate: string;
  priority: string;
  dueDate?: string;
}

export interface ProjectApprovalResponse {
  projectId: number;
  projectName: string;
  status: ProjectApprovalStatus;
  createdBy: string;
  approvedBy?: string;
  approvalDate?: string;
  notes?: string;
  rejectionReason?: string;
  createdDate: string;
}

export interface ApprovalRequest {
  projectId: number;
  notes?: string;
  rejectionReason?: string;
}

