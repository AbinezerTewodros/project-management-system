import { apiClient } from '@/lib/api';

export class AdvancedFilterService {
    // Generic apply
    async apply(body: any) { return apiClient.post('/AdvancedFilter/apply', body); }

    // Projects
    async filterProjects(body: any) { return apiClient.post('/AdvancedFilter/projects', body); }
    async projectOptions() { return apiClient.get('/AdvancedFilter/projects/options'); }
    async projectValues() { return apiClient.get('/AdvancedFilter/projects/values'); }

    // Tasks
    async filterTasks(body: any) { return apiClient.post('/AdvancedFilter/tasks', body); }
    async taskOptions() { return apiClient.get('/AdvancedFilter/tasks/options'); }
    async taskValues() { return apiClient.get('/AdvancedFilter/tasks/values'); }

    // Assignments
    async filterAssignments(body: any) { return apiClient.post('/AdvancedFilter/assignments', body); }
    async assignmentOptions() { return apiClient.get('/AdvancedFilter/assignments/options'); }
    async assignmentValues() { return apiClient.get('/AdvancedFilter/assignments/values'); }

    // Issues
    async filterIssues(body: any) { return apiClient.post('/AdvancedFilter/issues', body); }
    async issueOptions() { return apiClient.get('/AdvancedFilter/issues/options'); }
    async issueValues() { return apiClient.get('/AdvancedFilter/issues/values'); }

    // Cascaded and search
    async cascaded(body: any) { return apiClient.post('/AdvancedFilter/cascaded', body); }
    async search(params?: Record<string, string | number | boolean>) {
        const qp = new URLSearchParams();
        if (params) Object.entries(params).forEach(([k, v]) => v !== undefined && qp.append(k, String(v)));
        const suffix = qp.toString() ? `/AdvancedFilter/search?${qp.toString()}` : '/AdvancedFilter/search';
        return apiClient.get(suffix);
    }

    async validate(body: any) { return apiClient.post('/AdvancedFilter/validate', body); }
}

export const advancedFilterService = new AdvancedFilterService();
