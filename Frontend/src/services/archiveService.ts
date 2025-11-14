import { apiClient } from '@/lib/api';

export class ArchiveService {
    async archive(body: { entityType: string; id: number }) { return apiClient.post('/Archive/archive', body); }
    async unarchive(body: { entityType: string; id: number }) { return apiClient.post('/Archive/unarchive', body); }
    async myArchives() { return apiClient.get('/Archive/my-archives'); }
}

export const archiveService = new ArchiveService();
