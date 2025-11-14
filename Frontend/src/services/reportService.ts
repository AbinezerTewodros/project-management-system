import { apiClient, ApiResponse } from '@/lib/api';
import {
    IssueSummaryReportDto,
    ProjectSummaryReportDto,
    ReportMetadataDto,
    ReportRequestDto,
    ReportResponseDto,
    ReportTemplateDto,
    ReportType,
    ScheduledReportDto,
    TeamPerformanceReportDto,
    TaskProgressReportDto,
} from '@/types/reportTypes';

async function handleResponse<T>(promise: Promise<ApiResponse<T>>): Promise<T> {
    try {
        const response = await promise;
        
        console.log('📊 Report API Response:', {
            success: response.success,
            status: response.status,
            hasData: response.data !== null && response.data !== undefined,
        });
        
        if (response.success && response.data !== null && response.data !== undefined) {
            return response.data;
        }
        
        // Preserve all error details for debugging
        console.error('❌ Report Service Error:', {
            success: response.success,
            message: response.message,
            status: response.status,
            errors: response.errors,
            raw: response.raw
        });
        
        // Create a more informative error message
        let errorMessage = response.message || 'API request failed';
        if (response.status === 500) {
            errorMessage = 'Server error occurred. Please check backend logs.';
        } else if (response.status === 400) {
            errorMessage = `Bad request: ${response.message || 'Invalid data sent'}`;
            if (response.errors && response.errors.length > 0) {
                errorMessage += '\nValidation errors:\n' + response.errors.join('\n');
            }
        } else if (response.status === 401) {
            errorMessage = 'Unauthorized. Please login again.';
        } else if (response.status === 403) {
            errorMessage = 'Forbidden. You do not have permission for this report.';
        }
        
        const error = new Error(errorMessage);
        // Attach the full response for debugging
        (error as any).response = response;
        throw error;
    } catch (err) {
        // Catch network errors or other exceptions
        console.error('❌ Report Service Exception:', err);
        throw err;
    }
}

const BASE_PATH = '/Report';

export const reportService = {
    /** Generate a project summary report */
    generateProjectSummary: (payload: Omit<ReportRequestDto, 'reportType'>): Promise<ReportResponseDto<ProjectSummaryReportDto>> => {
        console.log('📊 Generating Project Summary Report with payload:', payload);
        return handleResponse(apiClient.post<ReportResponseDto<ProjectSummaryReportDto>>(`${BASE_PATH}/project-summary`, {
            ...payload,
            reportType: ReportType.ProjectSummary,
        }));
    },

    /** Generate a task progress report */
    generateTaskProgress: (payload: Omit<ReportRequestDto, 'reportType'>): Promise<ReportResponseDto<TaskProgressReportDto>> => {
        console.log('📊 Generating Task Progress Report with payload:', payload);
        return handleResponse(apiClient.post<ReportResponseDto<TaskProgressReportDto>>(`${BASE_PATH}/task-progress`, {
            ...payload,
            reportType: ReportType.TaskProgress,
        }));
    },

    /** Generate a team performance report */
    generateTeamPerformance: (payload: Omit<ReportRequestDto, 'reportType'>): Promise<ReportResponseDto<TeamPerformanceReportDto>> => {
        console.log('📊 Generating Team Performance Report with payload:', payload);
        return handleResponse(apiClient.post<ReportResponseDto<TeamPerformanceReportDto>>(`${BASE_PATH}/team-performance`, {
            ...payload,
            reportType: ReportType.TeamPerformance,
        }));
    },

    /** Generate an issue summary report */
    generateIssueSummary: (payload: Omit<ReportRequestDto, 'reportType'>): Promise<ReportResponseDto<IssueSummaryReportDto>> => {
        console.log('📊 Generating Issue Summary Report with payload:', payload);
        return handleResponse(apiClient.post<ReportResponseDto<IssueSummaryReportDto>>(`${BASE_PATH}/issue-summary`, {
            ...payload,
            reportType: ReportType.IssueSummary,
        }));
    },

    /** Generic report generator */
    generateReport: (payload: ReportRequestDto): Promise<ReportResponseDto<unknown>> => {
        return handleResponse(apiClient.post<ReportResponseDto<unknown>>(`${BASE_PATH}/generate`, payload));
    },

    /** Export a report in the requested format */
    exportReport: (payload: ReportRequestDto): Promise<Blob> => {
        return handleResponse(
            apiClient.post<Blob>(
                `${BASE_PATH}/export`,
                payload,
                {
                    responseType: 'blob',
                    headers: {
                        Accept: 'application/octet-stream',
                    },
                }
            )
        );
    },

    /** Retrieve available report templates */
    getTemplates: (): Promise<ReportTemplateDto[]> => {
        return handleResponse(apiClient.get<ReportTemplateDto[]>(`${BASE_PATH}/templates`));
    },

    /** Fetch metadata for a specific report type */
    getMetadata: (reportType: ReportType): Promise<ReportMetadataDto> => {
        return handleResponse(apiClient.get<ReportMetadataDto>(`${BASE_PATH}/metadata/${encodeURIComponent(reportType)}`));
    },

    /** Schedule a report run */
    scheduleReport: (payload: ScheduledReportDto): Promise<boolean> => {
        return handleResponse(apiClient.post<boolean>(`${BASE_PATH}/schedule`, payload));
    },

    /** List all scheduled reports for the current user */
    getScheduledReports: (): Promise<ScheduledReportDto[]> => {
        return handleResponse(apiClient.get<ScheduledReportDto[]>(`${BASE_PATH}/scheduled`));
    },

    /** Quick dashboard snapshot (schema defined server-side) */
    getDashboardSnapshot: <T = unknown>(): Promise<T> => {
        return handleResponse(apiClient.get<T>(`${BASE_PATH}/dashboard`));
    },
};
