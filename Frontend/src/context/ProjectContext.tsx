import React, { createContext, useContext, useState, useEffect } from 'react';
import { Project, TeamMember } from '@/types/project';
import { Role, roleHierarchy } from '@/types/roles';
import { useAuth } from './AuthContext';

interface ProjectContextType {
    projects: Project[];
    createProject: (project: Omit<Project, 'id' | 'createdAt'>) => Promise<void>;
    addTeamMember: (projectId: string, member: Omit<TeamMember, 'assignedAt'>) => Promise<void>;
    removeTeamMember: (projectId: string, memberId: string) => Promise<void>;
    getAvailableTeamMembers: (role: Role) => Promise<TeamMember[]>;
    getProjectsByRole: () => Project[];
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [projects, setProjects] = useState<Project[]>([]);
    const { user } = useAuth();

    // Fetch projects on component mount
    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            // Mock data for projects
            const mockProjects: Project[] = [
                {
                    id: '1',
                    title: 'Digital Banking Platform',
                    description: 'Modernize the core banking system with cloud architecture',
                    createdBy: 'manager1',
                    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
                    status: 'active',
                    teamMembers: [
                        { id: '1', name: 'Liyu Tadesse', email: 'liyu.tadesse@bank.com', role: 'teamLeader', assignedBy: 'manager1', assignedAt: new Date().toISOString() },
                        { id: '5', name: 'Abel Mekonnen', email: 'abel.mekonnen@bank.com', role: 'member', assignedBy: 'teamLeader', assignedAt: new Date().toISOString() },
                    ],
                    tasks: [],
                },
                {
                    id: '2',
                    title: 'Mobile App Development',
                    description: 'Create a new mobile banking application',
                    createdBy: 'manager2',
                    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago
                    status: 'active',
                    teamMembers: [
                        { id: '2', name: 'Mekdes Alemu', email: 'mekdes.alemu@bank.com', role: 'teamLeader', assignedBy: 'manager2', assignedAt: new Date().toISOString() },
                        { id: '3', name: 'Selam Tesfaye', email: 'selam.tesfaye@bank.com', role: 'supervisor', assignedBy: 'manager2', assignedAt: new Date().toISOString() },
                    ],
                    tasks: [],
                },
            ];

            setProjects(mockProjects);
        } catch (error) {
            console.error('Error fetching projects:', error);
        }
    };

    const createProject = async (project: Omit<Project, 'id' | 'createdAt'>) => {
        try {
            const newProject: Project = {
                ...project,
                id: crypto.randomUUID(),
                createdAt: new Date().toISOString(),
            };

            // In a real app, this would be an API call
            await fetch('/api/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newProject),
            });

            setProjects(prev => [...prev, newProject]);
        } catch (error) {
            console.error('Error creating project:', error);
            throw error;
        }
    };

    const addTeamMember = async (projectId: string, member: Omit<TeamMember, 'assignedAt'>) => {
        try {
            const newMember: TeamMember = {
                ...member,
                assignedAt: new Date().toISOString(),
            };

            // In a real app, this would be an API call
            await fetch(`/api/projects/${projectId}/members`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newMember),
            });

            setProjects(prev =>
                prev.map(project =>
                    project.id === projectId
                        ? { ...project, teamMembers: [...project.teamMembers, newMember] }
                        : project
                )
            );
        } catch (error) {
            console.error('Error adding team member:', error);
            throw error;
        }
    };

    const removeTeamMember = async (projectId: string, memberId: string) => {
        try {
            // In a real app, this would be an API call
            await fetch(`/api/projects/${projectId}/members/${memberId}`, {
                method: 'DELETE',
            });

            setProjects(prev =>
                prev.map(project =>
                    project.id === projectId
                        ? {
                            ...project,
                            teamMembers: project.teamMembers.filter(member => member.id !== memberId),
                        }
                        : project
                )
            );
        } catch (error) {
            console.error('Error removing team member:', error);
            throw error;
        }
    };

    const getAvailableTeamMembers = async (role: Role): Promise<TeamMember[]> => {
        try {
            // Mock data for team members
            const mockTeamMembers: Record<Role, TeamMember[]> = {
                teamLeader: [
                    { id: '1', name: 'Liyu Tadesse', email: 'liyu.tadesse@bank.com', role: 'teamLeader', assignedBy: 'manager', assignedAt: new Date().toISOString() },
                    { id: '2', name: 'Mekdes Alemu', email: 'mekdes.alemu@bank.com', role: 'teamLeader', assignedBy: 'manager', assignedAt: new Date().toISOString() },
                ],
                supervisor: [
                    { id: '3', name: 'Selam Tesfaye', email: 'selam.tesfaye@bank.com', role: 'supervisor', assignedBy: 'manager', assignedAt: new Date().toISOString() },
                    { id: '4', name: 'Saron Hailu', email: 'saron.hailu@bank.com', role: 'supervisor', assignedBy: 'manager', assignedAt: new Date().toISOString() },
                ],
                member: [
                    { id: '5', name: 'Abel Mekonnen', email: 'abel.mekonnen@bank.com', role: 'member', assignedBy: 'teamLeader', assignedAt: new Date().toISOString() },
                    { id: '6', name: 'Yonatan Bekele', email: 'yonatan.bekele@bank.com', role: 'member', assignedBy: 'teamLeader', assignedAt: new Date().toISOString() },
                ],
                manager: [],
                director: [],
                vicePresident: [],
                president: [],
            };

            return mockTeamMembers[role] || [];
        } catch (error) {
            console.error('Error fetching available team members:', error);
            return [];
        }
    };

    const getProjectsByRole = (): Project[] => {
        if (!user) return [];

        const userRole = user.role as Role;
        const canViewRoles = roleHierarchy[userRole].canView as Role[];

        return projects.filter(project => {
            // User can view their own projects
            if (project.createdBy === user.id) return true;

            // User can view projects where they are a team member
            if (project.teamMembers.some(member => member.id === user.id)) return true;

            // User can view projects created by roles they can view
            const creator = project.teamMembers.find(member => member.assignedBy === project.createdBy);
            return creator && canViewRoles.includes(creator.role);
        });
    };

    return (
        <ProjectContext.Provider
            value={{
                projects,
                createProject,
                addTeamMember,
                removeTeamMember,
                getAvailableTeamMembers,
                getProjectsByRole,
            }}
        >
            {children}
        </ProjectContext.Provider>
    );
};

export const useProject = () => {
    const context = useContext(ProjectContext);
    if (context === undefined) {
        throw new Error('useProject must be used within a ProjectProvider');
    }
    return context;
};
