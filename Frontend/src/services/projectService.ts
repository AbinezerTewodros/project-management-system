import { apiClient } from '@/lib/api';
import { Role } from '@/types/roles';

export interface Project {
    id: string;
    title: string;
    description: string;
    createdBy: string;
    createdAt: string;
    status: 'active' | 'completed' | 'archived';
    priority?: 'high' | 'medium' | 'low';
    dueDate?: string;
    startDate?: string;
    teamMembers: TeamMember[];
    tasks: Task[];
    milestones?: Milestone[];
    files?: ProjectFile[];
}

export interface TeamMember {
    id: string;
    name: string;
    email: string;
    role: Role;
    assignedBy: string;
    assignedAt: string;
    workloadPercentage?: number;
    isPrimaryScrumMaster?: boolean;
}

export interface Task {
    id: number;
    title: string;
    description: string;
    assignedTo: string;
    assignedBy: string;
    status: 'todo' | 'in-progress' | 'completed';
    priority: 'low' | 'medium' | 'high';
    dueDate: string;
    progress: number;
    subtasks: Subtask[];
    assignedMembers: string[];
    memberStatus: { [memberEmail: string]: 'pending' | 'accepted' };
}

export interface Subtask {
    id: string;
    title: string;
    description: string;
    assignedTo: string;
    assignedBy: string;
    status: 'todo' | 'in-progress' | 'completed';
    priority: 'low' | 'medium' | 'high';
    dueDate: string;
}

export interface Milestone {
    id: number;
    milestoneName: string;
    description: string;
    assignedMemberId: string;
    dueDate: string;
    weight: number;
    status: 'To Do' | 'In Progress' | 'Done';
    projectId: number;
    progress: number;
}

export interface ProjectFile {
    name: string;
    size: number;
    type: string;
    url: string;
}

// UI-layer input types (existing components use these). These will be transformed
// to backend DTOs defined in the OpenAPI spec (CreateProjectDto / UpdateProjectDto)
export interface CreateProjectRequest {
    title: string;               // maps to projectName
    description?: string;        // maps to description
    projectOwner?: string;       // maps to projectOwner
    projectOwnerEmail?: string;  // maps to projectOwnerEmail
    projectOwnerPhone?: string;  // maps to projectOwnerPhone
    department?: string;         // maps to department
    priority?: 'Low' | 'Medium' | 'High' | 'Critical';
    dueDate: string;             // maps directly
    status?: string;             // maps directly
    // future: assignedEmployeeId / assignedRole may be exposed in UI
}

export interface UpdateProjectRequest {
    title?: string;              // projectName
    description?: string;        // description
    projectOwner?: string;       // projectOwner
    projectOwnerEmail?: string;  // projectOwnerEmail
    projectOwnerPhone?: string;  // projectOwnerPhone
    department?: string;         // department
    priority?: 'Low' | 'Medium' | 'High' | 'Critical' | 'high' | 'medium' | 'low'; // Backend expects capitalized
    dueDate?: string;            // dueDate
    status?: string;             // status (Active, On Hold, Completed, Archived)
    // Optional: allow UI to supply an initial assigned employee (employeeId) and role
    assignedEmployeeId?: string; // maps to AssignedEmployeeId on backend
    assignedRole?: string;       // maps to AssignedRole on backend
}

export interface ProjectFilter {
    status?: string[];
    priority?: string[];
    createdBy?: string[];
    assignedTo?: string[];
    dateFrom?: string;
    dateTo?: string;
    searchTerm?: string;
    pageNumber?: number;
    pageSize?: number;
}

export class ProjectService {
    // GET /api/Project/All-projects
    async getAllProjects(filter?: ProjectFilter) {
        const queryParams = new URLSearchParams();
        if (filter) {
            Object.entries(filter).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    if (Array.isArray(value)) value.forEach(v => queryParams.append(key, v));
                    else queryParams.append(key, value.toString());
                }
            });
        }
        const endpoint = queryParams.toString() ? `/Project/All-projects?${queryParams.toString()}` : '/Project/All-projects';
        return apiClient.get<Project[]>(endpoint);
    }

    // GET /api/Project/{id}
    async getProjectById(id: number) {
        return apiClient.get<Project>(`/Project/${id}`);
    }

    // GET /api/Project/by-priority/{priority}
    async getProjectsByPriority(priority: string) {
        return apiClient.get<Project[]>(`/Project/by-priority/${priority}`);
    }

    // POST /api/Project/create-project
    // Transforms UI CreateProjectRequest -> backend CreateProjectDto
    async createProject(input: CreateProjectRequest) {
        const payload = {
            projectName: input.title,
            description: input.description,
            projectOwner: input.projectOwner,
            projectOwnerEmail: input.projectOwnerEmail,
            projectOwnerPhone: input.projectOwnerPhone,
            department: input.department,
            priority: input.priority,
            dueDate: input.dueDate,
            status: input.status,
            // Forward optional assignedEmployeeId / assignedRole when provided by UI
            assignedEmployeeId: (input as any).assignedEmployeeId,
            assignedRole: (input as any).assignedRole,
        };   
        // The backend wraps responses in a standardized ApiResponse<T> object. Our
        // apiClient.post already returns an ApiResponse whose `data` field contains
        // the raw server body. Some server responses are themselves ApiResponse<T>
        // objects (i.e. double-wrapped). Consumers (like CreateProject.tsx)
        // expect a top-level ApiResponse where `data` is the created Project.
        //
        // Normalize here so callers can use `response.success && response.data` and
        // access the created project at `response.data`.
        const res = await apiClient.post<any>('/Project', payload);

        if (res.success && res.data) {
            // If the server returned an ApiResponse<T> body, extract its `data`.
            const serverBody = res.data as any;
            const maybeInner = serverBody && serverBody.data ? serverBody.data : serverBody;
            return { data: maybeInner as Project, success: true, status: res.status };
        }

        return res as any;
    }

    // PUT /api/Project/{id}
    async updateProject(id: number, input: UpdateProjectRequest) {
        const payload = {
            projectName: input.title,
            description: input.description,
            projectOwner: input.projectOwner,
            projectOwnerEmail: input.projectOwnerEmail,
            projectOwnerPhone: input.projectOwnerPhone,
            department: input.department,
            priority: input.priority,
            dueDate: input.dueDate,
            status: input.status,
        };
        return apiClient.put<Project>(`/Project/${id}`, payload);
    }

    // DELETE /api/Project/{id}
    async deleteProject(id: number) {
        return apiClient.delete(`/Project/${id}`);
    }

    // POST /api/Project/archive/{id}
    async archiveProject(id: number) {
        return apiClient.post(`/Project/archive/${id}`);
    }

    // POST /api/Project/restore/{id}
    async restoreProject(id: number) {
        return apiClient.post(`/Project/restore/${id}`);
    }

    // Project Approval endpoints
    // POST /api/ProjectApproval/approve
    async approveProject(projectId: number, comments?: string) {
        return apiClient.post('/ProjectApproval/approve', { projectId, notes: comments });
    }

    // POST /api/ProjectApproval/reject
    async rejectProject(projectId: number, reason: string) {
        return apiClient.post('/ProjectApproval/reject', { projectId, rejectionReason: reason });
    }

    // GET /api/ProjectApproval/pending
    async getPendingApprovals() {
        return apiClient.get('/ProjectApproval/pending');
    }

    // GET /api/ProjectApproval/status/{projectId}
    async getProjectApprovalStatus(projectId: number) {
        return apiClient.get(`/ProjectApproval/status/${projectId}`);
    }

    // GET /api/ProjectApproval/can-create
    async canUserCreateProject() {
        return apiClient.get('/ProjectApproval/can-create');
    }

    /**
     * Deprecated notice:
     * ProjectAssignment & EnhancedAssignment related methods formerly embedded here
     * have been extracted to dedicated services to enforce separation of concerns.
     *
     * Use instead:
     *  - projectAssignmentService  -> /ProjectAssignment/* endpoints
     *  - enhancedAssignmentService -> /EnhancedAssignment/* endpoints
     *
     * Rationale: reduces churn in core project CRUD during workforce feature evolution.
     * TODO: After all consumer imports are updated, remove this comment block.
     */
}

export const projectService = new ProjectService();
