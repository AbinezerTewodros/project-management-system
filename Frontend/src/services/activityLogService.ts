import { apiClient } from '@/lib/api';

export interface ActivityLog {
    id: number;
    entityType: string;
    entityId: number;
    action: string;
    userId: string;
    userName?: string;
    timestamp: string;
    details?: any;
}

export class ActivityLogService {
    async getAll(params?: { page?: number; pageSize?: number; entityType?: string; entityId?: number; userId?: number; }) {
        const qp = new URLSearchParams();
        if (params) Object.entries(params).forEach(([k, v]) => v !== undefined && qp.append(k, String(v)));
        const suffix = qp.toString() ? `/ActivityLog?${qp.toString()}` : '/ActivityLog';
        return apiClient.get<ActivityLog[]>(suffix);
    }

    async getByEntity(entityType: string, entityId: number) {
        return apiClient.get<ActivityLog[]>(`/ActivityLog/${encodeURIComponent(entityType)}/${entityId}`);
    }
}

export const activityLogService = new ActivityLogService();
