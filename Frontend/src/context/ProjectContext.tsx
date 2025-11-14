import React, { createContext, useContext, useState, useEffect } from "react";
import { Project, TeamMember } from "@/types/project";
import { Role, roleHierarchy } from "@/types/roles";
import { useAuth } from "./AuthContext";
import { projectService } from "@/services";
// TODO: Integrate projectAssignmentService & enhancedAssignmentService for real member management

interface ProjectContextType {
  projects: Project[];
  createProject: (project: Omit<Project, "id" | "createdAt">) => Promise<void>;
  // Team member operations currently mocked; will be replaced by projectAssignmentService calls
  addTeamMember: (
    projectId: string,
    member: Omit<TeamMember, "assignedAt">
  ) => Promise<void>;
  removeTeamMember: (projectId: string, memberId: string) => Promise<void>;
  getAvailableTeamMembers: (role: Role) => Promise<TeamMember[]>;
  getProjectsByRole: () => Project[];
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const { user } = useAuth();

  // Fetch projects on component mount
  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await projectService.getAllProjects();

      if (response.success && response.data) {
        // Convert API response to match local Project type
        const convertedProjects = response.data.map((apiProject) => ({
          ...apiProject,
          id: apiProject.id.toString(), // Convert number to string
          createdBy: apiProject.createdBy || "unknown",
          createdAt: apiProject.createdAt || new Date().toISOString(),
          teamMembers: (apiProject.teamMembers || []).map((member) => ({
            ...member,
            role: member.role as Role,
          })),
          tasks: (apiProject.tasks || []).map((task) => ({
            ...task,
            id: task.id.toString(), // Convert number to string
          })),
        }));
        setProjects(convertedProjects);
      } else {
        console.error("Failed to fetch projects:", response.message);
        setProjects([]);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
      setProjects([]);
    }
  };

  const createProject = async (project: Omit<Project, "id" | "createdAt">) => {
    try {
      const response = await projectService.createProject({
        title: project.title,
        description: project.description,
        priority: "medium", // default priority until UI form supports selection
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        // backend DTO mapping handled in service (projectOwner, etc.)
      });

      if (response.success && response.data) {
        // Convert API response to match local Project type
        const convertedProject = {
          ...response.data,
          id: response.data.id.toString(), // Convert number to string
          createdBy: response.data.createdBy || "unknown",
          createdAt: response.data.createdAt || new Date().toISOString(),
          teamMembers: (response.data.teamMembers || []).map((member) => ({
            ...member,
            role: member.role as Role,
          })),
          tasks: (response.data.tasks || []).map((task) => ({
            ...task,
            id: task.id.toString(), // Convert number to string
          })),
        };
        setProjects((prev) => [...prev, convertedProject]);
      } else {
        throw new Error(response.message || "Failed to create project");
      }
    } catch (error) {
      console.error("Error creating project:", error);
      throw error;
    }
  };

  const addTeamMember = async (
    projectId: string,
    member: Omit<TeamMember, "assignedAt">
  ) => {
    try {
      const newMember: TeamMember = {
        ...member,
        assignedAt: new Date().toISOString(),
      };

      // In a real app, this would be an API call
      await fetch(`/api/projects/${projectId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMember),
      });

      setProjects((prev) =>
        prev.map((project) =>
          project.id === projectId
            ? { ...project, teamMembers: [...project.teamMembers, newMember] }
            : project
        )
      );
    } catch (error) {
      console.error("Error adding team member:", error);
      throw error;
    }
  };

  const removeTeamMember = async (projectId: string, memberId: string) => {
    try {
      // In a real app, this would be an API call
      await fetch(`/api/projects/${projectId}/members/${memberId}`, {
        method: "DELETE",
      });

      setProjects((prev) =>
        prev.map((project) =>
          project.id === projectId
            ? {
                ...project,
                teamMembers: project.teamMembers.filter(
                  (member) => member.id !== memberId
                ),
              }
            : project
        )
      );
    } catch (error) {
      console.error("Error removing team member:", error);
      throw error;
    }
  };

  const getAvailableTeamMembers = async (role: Role): Promise<TeamMember[]> => {
    try {
      // Mock data for team members
      const mockTeamMembers: Record<Role, TeamMember[]> = {
        teamLeader: [
          {
            id: "1",
            name: "Liyu Tadesse",
            email: "liyu.tadesse@bank.com",
            role: "teamLeader",
            assignedBy: "manager",
            assignedAt: new Date().toISOString(),
          },
          {
            id: "2",
            name: "Mekdes Alemu",
            email: "mekdes.alemu@bank.com",
            role: "teamLeader",
            assignedBy: "manager",
            assignedAt: new Date().toISOString(),
          },
        ],
        supervisor: [
          {
            id: "3",
            name: "Selam Tesfaye",
            email: "selam.tesfaye@bank.com",
            role: "supervisor",
            assignedBy: "manager",
            assignedAt: new Date().toISOString(),
          },
          {
            id: "4",
            name: "Saron Hailu",
            email: "saron.hailu@bank.com",
            role: "supervisor",
            assignedBy: "manager",
            assignedAt: new Date().toISOString(),
          },
        ],
        member: [
          {
            id: "5",
            name: "Abel Mekonnen",
            email: "abel.mekonnen@bank.com",
            role: "member",
            assignedBy: "teamLeader",
            assignedAt: new Date().toISOString(),
          },
          {
            id: "6",
            name: "Yonatan Bekele",
            email: "yonatan.bekele@bank.com",
            role: "member",
            assignedBy: "teamLeader",
            assignedAt: new Date().toISOString(),
          },
        ],
        manager: [],
        director: [],
        vicePresident: [],
        president: [],
      };

      return mockTeamMembers[role] || [];
    } catch (error) {
      console.error("Error fetching available team members:", error);
      return [];
    }
  };

  const getProjectsByRole = (): Project[] => {
    if (!user) return [];

    const userRole = user.role as Role;
    const canViewRoles = roleHierarchy[userRole].canView as Role[];

    return projects.filter((project) => {
      // User can view their own projects
      if (project.createdBy === user.id) return true;

      // User can view projects where they are a team member
      if (project.teamMembers.some((member) => member.id === user.id))
        return true;

      // User can view projects created by roles they can view
      const creator = project.teamMembers.find(
        (member) => member.assignedBy === project.createdBy
      );
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
    throw new Error("useProject must be used within a ProjectProvider");
  }
  return context;
};
