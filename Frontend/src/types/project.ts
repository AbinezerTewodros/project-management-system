import { Role } from './roles';

export interface TeamMember {
    id: string;
    name: string;
    email: string;
    role: Role;
    assignedBy: string;
    assignedAt: string;
}

export interface Project {
    id: string;
    title: string;
    description: string;
    createdBy: string;
    createdAt: string;
    status: 'active' | 'completed' | 'archived';
    teamMembers: TeamMember[];
    tasks: Task[];
    parentProjectId?: string; // For sub-projects
}

export interface Task {
    id: string;
    title: string;
    description: string;
    assignedTo: string;
    assignedBy: string;
    status: 'todo' | 'in-progress' | 'completed';
    priority: 'low' | 'medium' | 'high';
    dueDate: string;
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
