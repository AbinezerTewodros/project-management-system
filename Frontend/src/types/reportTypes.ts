import { PaginatedResponse } from '@/lib/api';

export enum ReportType {
  ProjectSummary = 'ProjectSummary',
  TaskProgress = 'TaskProgress',
  TeamPerformance = 'TeamPerformance',
  IssueSummary = 'IssueSummary',
}

export enum ReportFormat {
  Json = 'Json',
  Csv = 'Csv',
  Excel = 'Excel',
  Pdf = 'Pdf',
}

export enum ScheduleType {
  OneTime = 'OneTime',
  Recurring = 'Recurring',
}

export interface ReportRequestDto {
  reportType: ReportType;
  startDate?: string;
  endDate?: string;
  department?: string;
  projectIds?: number[];
  userIds?: string[];
  exportFormat?: ReportFormat;
}

export interface ReportSummaryDto {
  totalRecords: number;
  keyMetrics: Record<string, unknown>;
}

export interface ReportResponseDto<TData> {
  reportTitle: string;
  generatedAt: string;
  generatedBy: string;
  reportType: ReportType;
  periodStart?: string;
  periodEnd?: string;
  data: TData;
  summary: ReportSummaryDto;
}

export interface ProjectSummaryItemDto {
  id: number;
  projectName: string;
  department: string;
  status: string;
  progress: number;
  totalTasks: number;
  completedTasks: number;
  dueDate?: string;
  isOverdue: boolean;
}

export interface ProjectOverviewDto {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  overdueProjects: number;
  averageProgress: number;
}

export interface ProjectsByStatusDto {
  status: string;
  count: number;
  percentage: number;
}

export interface ProjectsByDepartmentDto {
  department: string;
  count: number;
  percentage: number;
}

export interface ProjectSummaryReportDto {
  projects: ProjectSummaryItemDto[];
  overview: ProjectOverviewDto;
  projectsByStatus: ProjectsByStatusDto[];
  projectsByDepartment: ProjectsByDepartmentDto[];
}

export interface TaskProgressItemDto {
  id: number;
  title: string;
  status: string;
  priority: string;
  progress: number;
  dueDate?: string;
  createdAt: string;
  updatedAt?: string;
  isOverdue: boolean;
  daysUntilDue: number;
  commentsCount: number;
}

export interface TaskOverviewDto {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  averageProgress: number;
  completionRate: number;
}

export interface TasksByStatusDto {
  status: string;
  count: number;
  percentage: number;
}

export interface TasksByPriorityDto {
  priority: string;
  count: number;
  percentage: number;
}

export interface TaskProgressReportDto {
  tasks: TaskProgressItemDto[];
  overview: TaskOverviewDto;
  tasksByStatus: TasksByStatusDto[];
  tasksByPriority: TasksByPriorityDto[];
}

export interface TeamMemberPerformanceDto {
  userId: string;
  userName: string;
  department: string;
  assignedTasks: number;
  completedTasks: number;
  completionRate: number;
  averageTaskDuration: number;
  overdueTasks: number;
}

export interface TeamOverviewDto {
  totalTeamMembers: number;
  averageCompletionRate: number;
  averageTaskDuration: number;
  totalOverdueTasks: number;
}

export interface PerformanceByDepartmentDto {
  department: string;
  memberCount: number;
  averageCompletionRate: number;
  averageTaskDuration: number;
}

export interface TeamPerformanceReportDto {
  teamMembers: TeamMemberPerformanceDto[];
  overview: TeamOverviewDto;
  performanceByDepartment: PerformanceByDepartmentDto[];
}

export interface IssueSummaryItemDto {
  id: number;
  title: string;
  status: string;
  priority: string;
  reporterName: string;
  assigneeName?: string;
  createdAt: string;
  resolvedAt?: string;
  daysToResolve: number;
  isOverdue: boolean;
}

export interface IssueOverviewDto {
  totalIssues: number;
  openIssues: number;
  resolvedIssues: number;
  closedIssues: number;
  resolutionRate: number;
  averageResolutionTime: number;
}

export interface IssuesByTypeDto {
  type: string;
  count: number;
  percentage: number;
}

export interface IssuesByStatusDto {
  status: string;
  count: number;
  percentage: number;
}

export interface IssueSummaryReportDto {
  issues: IssueSummaryItemDto[];
  overview: IssueOverviewDto;
  issuesByType: IssuesByTypeDto[];
  issuesByStatus: IssuesByStatusDto[];
}

export interface ReportTemplateDto {
  type: ReportType;
  name: string;
  description: string;
  requiredParameters: string[];
  optionalParameters: string[];
  supportedFormats: ReportFormat[];
  requiresManagerRole: boolean;
  requiresAdminRole: boolean;
}

export interface ReportFilterDto {
  field: string;
  label: string;
  type: string;
  options: string[];
  isRequired: boolean;
}

export interface ReportColumnDto {
  field: string;
  label: string;
  dataType: string;
  isSortable: boolean;
  isFilterable: boolean;
}

export interface ReportPermissionDto {
  canView: boolean;
  canExport: boolean;
  canSchedule: boolean;
  restrictedDepartments: string[];
  restrictedProjects: string[];
}

export interface ReportMetadataDto {
  type: ReportType;
  name: string;
  description: string;
  availableFilters: ReportFilterDto[];
  availableColumns: ReportColumnDto[];
  permissions: ReportPermissionDto;
}

export interface ScheduledReportDto {
  jobId: string;
  name: string;
  description: string;
  reportType: ReportType;
  scheduleType: ScheduleType;
  cronExpression: string;
  scheduledDate?: string;
  exportFormat: ReportFormat;
  recipients: string[];
  createdAt: string;
  isActive: boolean;
}

export interface ScheduledReportExecutionDto {
  executionId: string;
  reportName: string;
  reportType: ReportType;
  exportFormat: ReportFormat;
  executedAt: string;
  status: string;
  fileSize: number;
  errorMessage: string;
}

export type AnyReportResponse =
  | ReportResponseDto<ProjectSummaryReportDto>
  | ReportResponseDto<TaskProgressReportDto>
  | ReportResponseDto<TeamPerformanceReportDto>
  | ReportResponseDto<IssueSummaryReportDto>;

export type ReportCollectionResponse = PaginatedResponse<AnyReportResponse>;
