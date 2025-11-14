import { apiClient, ApiResponse } from '@/lib/api';

// Escalation status enum matching backend
export enum EscalationStatus {
  Active = 0,
  Responded = 1,
  Escalated = 2,
  Resolved = 3,
  Closed = 4,
}

// DTOs matching backend structure
export interface SendEscalationDto {
  title: string;
  type: string;
  projectId?: number | null;
  projectTaskId?: number | null;
  independentTaskId?: number | null;
  milestoneId?: number | null;
  content: string;
  userIds: string[];
  attachmentId?: string;
  responseTimeLimit: string; // ISO date string
  status?: EscalationStatus;
  escalationLevel?: number;
  isRead?: boolean;
}

export interface EscalationReplyDto {
  escalationId: number;
  content: string;
  senderId?: string;
  receiverId?: string;
  timeSent?: string;
  userName?: string;
  escalationTitle?: string;
  senderName?: string;
  receiverName?: string;
}

export interface EscalationDto {
  id: number;
  title: string;
  type: string;
  projectId?: number | null;
  projectTaskId?: number | null;
  independentTaskId?: number | null;
  milestoneId?: number | null;
  content: string;
  userIds: string[];
  attachmentId?: string;
  timeSent: string;
  timeEdited?: string;
  senderId: string;
  status: EscalationStatus;
  parentEscalationId?: number | null;
  escalationLevel: number;
  isRead: boolean;
  replies?: EscalationReplyDto[];
}

export interface EditEscalationDto {
  id: number;
  title: string;
  content: string;
  type: string;
}

class EscalationService {
  private basePath = '/escalation';

  /**
   * Send a new escalation
   */
  async sendEscalation(dto: SendEscalationDto): Promise<ApiResponse<EscalationDto>> {
    console.log('📤 Sending escalation:', dto);
    return await apiClient.post<EscalationDto>('/escalation-send', dto);
  }

  /**
   * Reply to an escalation
   */
  async replyToEscalation(dto: EscalationReplyDto): Promise<ApiResponse<EscalationReplyDto>> {
    console.log('💬 Replying to escalation:', dto);
    return await apiClient.post<EscalationReplyDto>(`${this.basePath}/reply`, dto);
  }

  /**
   * Get replies for a specific escalation
   */
  async getEscalationReplies(escalationId: number): Promise<ApiResponse<EscalationReplyDto[]>> {
    console.log('📥 Getting replies for escalation:', escalationId);
    return await apiClient.get<EscalationReplyDto[]>(`${this.basePath}/replies/${escalationId}`);
  }

  /**
   * Get my replies (replies I've sent)
   */
  async getMyReplies(): Promise<ApiResponse<EscalationReplyDto[]>> {
    console.log('📥 Getting my replies');
    return await apiClient.get<EscalationReplyDto[]>(`${this.basePath}/my-replies`);
  }

  /**
   * Get escalations I've sent
   */
  async getSentEscalations(): Promise<ApiResponse<EscalationDto[]>> {
    console.log('📤 Getting sent escalations');
    return await apiClient.get<EscalationDto[]>(`${this.basePath}/sent`);
  }

  /**
   * Get escalations I've received
   */
  async getReceivedEscalations(): Promise<ApiResponse<EscalationDto[]>> {
    console.log('📥 Getting received escalations');
    return await apiClient.get<EscalationDto[]>(`${this.basePath}/received`);
  }

  /**
   * Edit an escalation
   */
  async editEscalation(dto: EditEscalationDto): Promise<ApiResponse<void>> {
    console.log('✏️ Editing escalation:', dto);
    return await apiClient.put<void>(this.basePath, dto);
  }

  /**
   * Mark escalation as resolved
   */
  async resolveEscalation(escalationId: number): Promise<ApiResponse<void>> {
    console.log('✅ Resolving escalation:', escalationId);
    return await apiClient.put<void>(`${this.basePath}/resolve/${escalationId}`);
  }

  /**
   * Close an escalation
   */
  async closeEscalation(escalationId: number): Promise<ApiResponse<void>> {
    console.log('🔒 Closing escalation:', escalationId);
    return await apiClient.put<void>(`${this.basePath}/close/${escalationId}`);
  }

  /**
   * Get resolved escalations
   */
  async getResolvedEscalations(): Promise<ApiResponse<EscalationDto[]>> {
    console.log('📥 Getting resolved escalations');
    return await apiClient.get<EscalationDto[]>(`${this.basePath}/resolved`);
  }

  /**
   * Get closed escalations
   */
  async getClosedEscalations(): Promise<ApiResponse<EscalationDto[]>> {
    console.log('📥 Getting closed escalations');
    return await apiClient.get<EscalationDto[]>(`${this.basePath}/closed`);
  }

  /**
   * Get my resolved escalations (escalations I received that are resolved)
   */
  async getMyResolvedEscalations(): Promise<ApiResponse<EscalationDto[]>> {
    console.log('📥 Getting my resolved escalations');
    return await apiClient.get<EscalationDto[]>(`${this.basePath}/my-resolved`);
  }

  /**
   * Get my closed escalations (escalations I received that are closed)
   */
  async getMyClosedEscalations(): Promise<ApiResponse<EscalationDto[]>> {
    console.log('📥 Getting my closed escalations');
    return await apiClient.get<EscalationDto[]>(`${this.basePath}/my-closed`);
  }

  /**
   * Get count of unread escalations
   */
  async getUnreadCount(): Promise<ApiResponse<number>> {
    console.log('📊 Getting unread escalation count');
    return await apiClient.get<number>(`${this.basePath}/unread-count`);
  }

  /**
   * Mark escalation as read
   */
  async markAsRead(escalationId: number): Promise<ApiResponse<void>> {
    console.log('👁️ Marking escalation as read:', escalationId);
    return await apiClient.put<void>(`${this.basePath}/mark-read/${escalationId}`);
  }

  /**
   * Get status label for display
   */
  getStatusLabel(status: EscalationStatus): string {
    switch (status) {
      case EscalationStatus.Active:
        return 'Active';
      case EscalationStatus.Responded:
        return 'Responded';
      case EscalationStatus.Escalated:
        return 'Escalated';
      case EscalationStatus.Resolved:
        return 'Resolved';
      case EscalationStatus.Closed:
        return 'Closed';
      default:
        return 'Unknown';
    }
  }
}

export const escalationService = new EscalationService();
