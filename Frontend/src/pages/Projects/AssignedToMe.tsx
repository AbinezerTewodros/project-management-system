import { CalendarIcon, RefreshCw, UserIcon } from "lucide-react";
import { NotificationType } from "@/types/notification";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ToastContainer } from "react-toastify";
import { useNotifications } from "@/context/NotificationContext";
import { useAuth } from "@/context/AuthContext";
import DataTable from "react-data-table-component";
import CreateTaskModal from "@/pages/Tasks/CreateTaskModal";
import CreateMilestoneModal from "@/pages/Milestones/CreateMilestoneModal";
import TaskDetailView from "@/pages/Tasks/TaskDetailView";
import ProjectDetailView from "./ProjectDetailView";
import { apiClient } from "@/lib/api";
import { useNavigate } from 'react-router-dom';

interface ProjectFile {
  name: string;
  size: number;
  type: string;
  url: string;
}

interface Project {
  assignmentId?: string | number;
  id: number;
  title: string;
  description: string;
  dueDate: string;
  role:
    | "Team Leader"
    | "Scrum Master"
    | "ScrumMaster"
    | "TeamLeader"
    | "Member"
    | string;
  assignedBy: string;
  assignedTo: string;
  priority: "High" | "Medium" | "Low" | "Urgent";
  status:
    | "To Do"
    | "In Progress"
    | "Done"
    | "Rejected"
    | "Pending"
    | "Approved"
    | "Active"
    | string;
  progress: number;
  rejectionReason?: string;
  isTerminated?: boolean;
  files?: ProjectFile[];
  createdBy?: string;
  teamMembers?: any[];
  milestones?: any[];
  tasks?: any[];
}

const MyAssignedProjects = ({ darkMode, showHeader = true }: { darkMode: boolean; showHeader?: boolean }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [newProject, setNewProject] = useState<Project[]>([]);
  const { addNotification } = useNotifications();
  const [rejectionDialog, setRejectionDialog] = useState(false);
  const [projectToReject, setProjectToReject] = useState<Project | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showTerminated, setShowTerminated] = useState(false);
  const [approvalDialog, setApprovalDialog] = useState(false);
  const [projectToApprove, setProjectToApprove] = useState<Project | null>(null);
  const [previewFile, setPreviewFile] = useState<ProjectFile | null>(null);
  const [searchText, setSearchText] = useState("");
  const [tasks] = useState<{ [projectId: number]: any[] }>({});
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [showTaskDetailView, setShowTaskDetailView] = useState(false);
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [roleFilter, setRoleFilter] = useState<"All" | "Team Leader" | "Scrum Master">("All");
  
  // Remove mock members - we'll use actual project team members
  const [allMembers, setAllMembers] = useState<any[]>([]);

  const [statusFilter, setStatusFilter] = useState<"Pending" | "Accepted" | "Rejected" | "All">("Pending");
  const [userCache, setUserCache] = useState<{ [userId: string]: string }>({});

  // Adapter functions for ProjectDetailView
 function toCommonProject(project: Project): any {
    return {
      id: project.id,
      title: project.title,
      description: project.description,
      dueDate: project.dueDate,
      priority: project.priority === 'Critical' ? 'Urgent' : (project.priority as 'High' | 'Medium' | 'Low' | 'Urgent'),
      status: project.status === 'Pending Approval' ? 'To Do' : 
              project.status === 'Active' || project.status === 'In Progress' ? 'In Progress' : 
              project.status === 'Completed' ? 'Done' : 
              project.status === 'Rejected' ? 'Rejected' : project.status,
      progress: project.progress || 0,
      files: project.files || [],
      assignedBy: project.assignedBy,
      assignedTo: project.assignedTo,
      teamMembers: project.teamMembers || [],
      role: project.role,
      rejectionReason: project.rejectionReason,
      isTerminated: project.isTerminated,
      createdBy: project.createdBy
    };
  }

  function toCommonTask(task: any) {
    if (!task) return null;
    return {
      id: task.id?.toString() || '',
      title: task.title,
      description: task.description,
      priority: task.priority === 'Critical' ? 'Urgent' : (task.priority || 'Medium'),
      assignee: task.assignee || '',
      status: task.status === 'Pending' ? 'To Do' : (task.status === 'InProgress' ? 'In Progress' : (task.status === 'Completed' ? 'Done' : task.status)),
      dueDate: task.dueDate || '',
      weight: task.weight || 0,
      files: task.files,
    };
  }

  function toCommonMilestone(m: any) {
    return {
      id: m.id?.toString() || '',
      title: m.title,
      description: m.description,
      priority: m.priority === 'Critical' ? 'Urgent' : (m.priority || 'Medium'),
      assignee: m.assignee || '',
      status: m.status === 'Pending' ? 'To Do' : (m.status === 'InProgress' ? 'In Progress' : m.status),
      dueDate: m.dueDate || '',
      weight: m.weight || 0,
      tasks: Array.isArray(m.tasks) ? m.tasks.map(toCommonTask) : [],
    };
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getUserDisplayName = async (userId: string): Promise<string> => {
    if (userCache[userId]) {
      return userCache[userId];
    }

    if (userId === user?.id) {
      const displayName = user?.name || user?.username || user?.email || "Unknown";
      setUserCache((prev) => ({ ...prev, [userId]: displayName }));
      return displayName;
    }

    try {
      const response = await apiClient.get<any>(`/User/${userId}`);
      if (response.success && response.data) {
        const userData = response.data as any;
        const displayName = userData.firstName || userData.name || userData.email || "Unknown User";
        setUserCache((prev) => ({ ...prev, [userId]: displayName }));
        return displayName;
      }
    } catch (error) {
      console.warn("Could not fetch user details for:", userId);
    }

    const shortId = userId.substring(0, 8) + "...";
    return shortId;
  };

  // Fetch all users for member selection
  const fetchAllUsers = async () => {
    try {
      const response = await apiClient.get('/User');
      if (response.success && response.data) {
        setAllMembers(response.data.map((user: any) => ({
          id: user.id?.toString(),
          name: user.name || user.username || user.email,
          role: user.role || 'Member',
          department: user.department || 'Unknown',
          email: user.email
        })));
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleProjectClick = async (project: Project) => {
   console.log('🔵 Project clicked:', project.title);
    setSelectedProject(project);
    
    // Only load detailed data for accepted/approved projects
    const isAccepted = project.status === "Approved" || project.status === "In Progress" || project.status === "Active";
    
    if (!isAccepted) {
      console.log('ℹ️ Project not accepted yet, showing basic view');
      return;
    }

    try {
      const { projectAssignmentService } = await import('@/services/projectAssignmentService');
      const { milestoneService } = await import('@/services/milestoneService');
      const { projectTaskService } = await import('@/services/projectTaskService');
      
      const usersResponse = await apiClient.get('/User');
      const allUsers = Array.isArray(usersResponse.data) ? usersResponse.data : [];
      
      const teamResponse = await projectAssignmentService.getProjectMembers(project.id);
      
      let tasksResponse: any = null;
      try {
        tasksResponse = await projectTaskService.getTasksByProject(project.id);
      } catch (error) {
        console.error('❌ Error fetching tasks:', error);
        tasksResponse = null;
      }
      
      const milestonesResponse = await milestoneService.getMilestonesByProjectId(project.id);
      
      let teamMembers: any[] = [];
      let milestones: any[] = [];
      let tasks: any[] = project.tasks || [];
      
      try {
        if (tasksResponse && Array.isArray(tasksResponse)) {
          tasks = tasksResponse.map((task: any) => {
            const metadata = task.metadata || task.Metadata || {};
            return {
              id: task.value || task.Value || task.projectTaskId || task.id,
              title: task.label || task.Label || task.title || 'Untitled',
              description: task.description || task.Description || '',
              assignee: metadata.assignedMemberName || task.assignedMemberName || '',
              assigneeId: metadata.assignedMemberId || task.assignedMemberId || '',
              status: metadata.status || task.status || 'Pending',
              priority: metadata.priority || task.priority || 'Medium',
              dueDate: metadata.dueDate || task.dueDate || '',
              weight: metadata.weight || task.weight || 0,
              milestoneId: metadata.milestoneId?.toString() || task.milestoneId?.toString() || undefined
            };
          });
        }
      } catch (error) {
        console.error('❌ Error processing tasks, using existing:', error);
      }
      
      if (teamResponse.success && teamResponse.data) {
        let teamMembersData: any = teamResponse.data;
        
        if (!Array.isArray(teamMembersData)) {
          if (teamMembersData.data && Array.isArray(teamMembersData.data)) {
            teamMembersData = teamMembersData.data;
          } else if (teamMembersData.members && Array.isArray(teamMembersData.members)) {
            teamMembersData = teamMembersData.members;
          } else {
            teamMembersData = [];
          }
        }
        
        if (Array.isArray(teamMembersData) && teamMembersData.length > 0) {
          teamMembers = teamMembersData.map((member: any) => {
            const memberEmployeeId = member.employeeId || member.memberId || member.id;
            let displayName = 'Unknown User';
            
            const fullUser = allUsers.find((user: any) => {
              const userEmployeeId = user.employeeId || user.id;
              return userEmployeeId === memberEmployeeId || 
                     String(userEmployeeId).toLowerCase() === String(memberEmployeeId).toLowerCase();
            });
            
            if (fullUser) {
              displayName = fullUser.name || fullUser.userName || fullUser.fullName || 
                            (fullUser.firstName && fullUser.lastName ? fullUser.firstName + ' ' + fullUser.lastName : '') || 
                            'Unknown User';
            }
            
            return {
              id: memberEmployeeId,
              name: displayName,
              role: member.memberRole || member.role || 'Member',
              department: member.department || 'Unknown',
              email: member.email || '',
              position: member.position || member.role || 'team_member',
              avatar: member.avatar || ''
            };
          });
        }
      }
      
      if (milestonesResponse.success && milestonesResponse.data) {
        milestones = Array.isArray(milestonesResponse.data) ? milestonesResponse.data : [];
      }
      
      const projectWithData = {
        ...project,
        teamMembers: teamMembers,
        tasks: tasks,
        milestones: milestones.map((milestone: any) => ({
          id: milestone.milestoneId?.toString() || milestone.id?.toString() || Date.now().toString(),
          title: milestone.milestoneName || milestone.title,
          description: milestone.description || '',
          dueDate: milestone.dueDate || '',
          priority: milestone.priority || 'Medium',
          assignee: milestone.assignedMemberName || milestone.assignee || '',
          assigneeId: milestone.assignedMemberId || milestone.assigneeId || '',
          status: milestone.status || 'Pending',
          tasks: []
        }))
      };
      
      setSelectedProject(projectWithData);
      console.log('✅ Accepted project loaded with team members, milestones, and tasks');
    } catch (error) {
      console.error('❌ Error loading accepted project data:', error);
      // Keep the basic project data even if detailed loading fails
    }
  };

  const handleApproveProject = async () => {
    if (!projectToApprove) return;

    console.log("🔍 Approving project:", projectToApprove);
    console.log("🔍 Assignment ID:", projectToApprove.assignmentId);

    if (!projectToApprove.assignmentId) {
      console.error("❌ ERROR: assignmentId is missing!", projectToApprove);
      addNotification({
        type: NotificationType.ERROR as any,
        title: "Approval Failed",
        message: "Assignment ID is missing. Cannot approve this assignment.",
        category: "task_assignment" as any,
        userId: user?.id || "",
      } as any);
      return;
    }

    try {
      console.log("📡 Calling approve API:", `/ProjectAssignment/${projectToApprove.assignmentId}/approve`);
      const response = await apiClient.put(`/ProjectAssignment/${projectToApprove.assignmentId}/approve`);

      if (response.success) {
        console.log("✅ Approval successful! Response:", response);

        setProjects((prev) => prev.filter((project) => project.assignmentId !== projectToApprove.assignmentId));
        setNewProject((prev) => prev.filter((project) => project.assignmentId !== projectToApprove.assignmentId));

        addNotification({
          type: NotificationType.SUCCESS as any,
          title: "Project Assignment Approved",
          message: `You have accepted the assignment for "${projectToApprove.title}". The project is now active.`,
        } as any);

        // Load the approved project with full details immediately
        const approvedProject = { ...projectToApprove, status: "Active" } as any;
        await handleProjectClick(approvedProject);

        setTimeout(() => {
          fetchProjects();
        }, 1000);
      } else {
        throw new Error(response.message || "Failed to approve assignment");
      }

      setApprovalDialog(false);
      setProjectToApprove(null);
    } catch (error) {
      console.error("Error approving project:", error);
      addNotification({
        type: NotificationType.ERROR as any,
        title: "Approval Failed",
        message: "Failed to approve project assignment. Please try again.",
      } as any);
    }
  };

  const handleRejectProject = async () => {
    if (!projectToReject || !rejectionReason.trim()) return;

    console.log("🔍 Rejecting project:", projectToReject);
    console.log("🔍 Assignment ID:", projectToReject.assignmentId);
    console.log("🔍 Rejection reason:", rejectionReason);

    if (!projectToReject.assignmentId) {
      console.error("❌ ERROR: assignmentId is missing!", projectToReject);
      addNotification({
        type: NotificationType.ERROR as any,
        title: "Rejection Failed",
        message: "Assignment ID is missing. Cannot reject this assignment.",
      } as any);
      return;
    }

    try {
      console.log("📡 Calling reject API:", `/ProjectAssignment/${projectToReject.assignmentId}/reject`);
      console.log("📡 Rejection reason:", rejectionReason);

      const response = await apiClient.put(`/ProjectAssignment/${projectToReject.assignmentId}/reject`, rejectionReason);

      if (response.success) {
        console.log("✅ Rejection successful! Response:", response);
        console.log("✅ Rejected with reason:", rejectionReason);

        setProjects((prev) => prev.filter((project) => project.assignmentId !== projectToReject.assignmentId));
        setNewProject((prev) => prev.filter((project) => project.assignmentId !== projectToReject.assignmentId));

        addNotification({
          type: NotificationType.INFO as any,
          title: "Project Assignment Rejected",
          message: `You have rejected the assignment for "${projectToReject.title}". Reason: ${rejectionReason}`,
        } as any);

        setTimeout(() => {
          fetchProjects();
        }, 1000);
      } else {
        throw new Error(response.message || "Failed to reject assignment");
      }

      setRejectionDialog(false);
      setProjectToReject(null);
      setRejectionReason("");
    } catch (error) {
      console.error("Error rejecting project:", error);
      addNotification({
        type: NotificationType.ERROR as any,
        title: "Rejection Failed",
        message: "Failed to reject project assignment. Please try again.",
      } as any);
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes("pdf")) return "📄";
    if (fileType.includes("word")) return "📝";
    if (fileType.includes("excel")) return "📊";
    if (fileType.includes("image")) return "🖼";
    return "📁";
  };

  // Remove the assignNewProject function since it was using mock data

  const activeProjects = projects.filter((project) => !project.isTerminated && project.status !== "Rejected");
  const terminatedProjects = projects.filter((project) => project.isTerminated);

  
  const calculateProjectProgress = (tasks: any[], milestones: any[]): number => {
  if (tasks.length === 0 && milestones.length === 0) return 0;
  
  let totalProgress = 0;
  let totalWeight = 0;

  // Calculate progress from tasks
  if (tasks.length > 0) {
    const taskProgress = tasks.reduce((sum, task) => {
      const taskWeight = task.weight || 1;
      const taskStatus = task.status?.toLowerCase();
      
      let taskProgressValue = 0;
      if (taskStatus === 'done' || taskStatus === 'completed') {
        taskProgressValue = 100;
      } else if (taskStatus === 'in progress') {
        taskProgressValue = 50;
      } else if (taskStatus === 'to do') {
        taskProgressValue = 0;
      }
      
      return sum + (taskProgressValue * taskWeight);
    }, 0);
    
    const totalTaskWeight = tasks.reduce((sum, task) => sum + (task.weight || 1), 0);
    totalProgress += taskProgress;
    totalWeight += totalTaskWeight;
  }

  // Calculate progress from milestones
  if (milestones.length > 0) {
    const milestoneProgress = milestones.reduce((sum, milestone) => {
      const milestoneWeight = milestone.weight || 1;
      const milestoneStatus = milestone.status?.toLowerCase();
      
      let milestoneProgressValue = 0;
      if (milestoneStatus === 'done' || milestoneStatus === 'completed') {
        milestoneProgressValue = 100;
      } else if (milestoneStatus === 'in progress') {
        milestoneProgressValue = 50;
      } else if (milestoneStatus === 'to do') {
        milestoneProgressValue = 0;
      }
      
      return sum + (milestoneProgressValue * milestoneWeight);
    }, 0);
    
    const totalMilestoneWeight = milestones.reduce((sum, milestone) => sum + (milestone.weight || 1), 0);
    totalProgress += milestoneProgress;
    totalWeight += totalMilestoneWeight;
  }

  // Calculate weighted average
  const calculatedProgress = totalWeight > 0 ? Math.round(totalProgress / totalWeight) : 0;
  
  console.log("🧮 Progress calculation:", {
    tasks: tasks.length,
    milestones: milestones.length,
    totalProgress,
    totalWeight,
    calculatedProgress
  });

  return calculatedProgress;
};

 const loadDetailedProjectData = async (projects: Project[]) => {
  try {
    const { projectAssignmentService } = await import('@/services/projectAssignmentService');
    const { milestoneService } = await import('@/services/milestoneService');
    const { projectTaskService } = await import('@/services/projectTaskService');
    
    const usersResponse = await apiClient.get('/User');
    const allUsers = Array.isArray(usersResponse.data) ? usersResponse.data : [];

    for (const project of projects) {
      // Only load detailed data for accepted projects
      const isAccepted = project.status === "Approved" || project.status === "Active" || project.status === "In Progress";
      
      if (!isAccepted) {
        continue;
      }

      try {
        console.log('🔄 Loading detailed data for accepted project:', project.title);
        
        // Load team members - USING THE EXACT SAME APPROACH AS MyProjects
        let teamMembers: any[] = [];
        try {
          const teamResponse = await projectAssignmentService.getProjectMembers(project.id);
          console.log("👥 Team response for project", project.id, ":", teamResponse);
          
          if (teamResponse.success && teamResponse.data) {
            let teamMembersData: any = teamResponse.data;
            
            // EXACT SAME LOGIC AS MyProjects
            if (!Array.isArray(teamMembersData)) {
              if (teamMembersData.data && Array.isArray(teamMembersData.data)) {
                teamMembersData = teamMembersData.data;
              } else if (teamMembersData.members && Array.isArray(teamMembersData.members)) {
                teamMembersData = teamMembersData.members;
              } else {
                teamMembersData = [];
              }
            }
            
            console.log("🔍 Processed team members data structure:", {
              isArray: Array.isArray(teamMembersData),
              length: teamMembersData.length,
              sample: teamMembersData[0]
            });
            
            if (Array.isArray(teamMembersData) && teamMembersData.length > 0) {
              teamMembers = teamMembersData.map((member: any) => {
                const memberEmployeeId = member.employeeId || member.memberId || member.id;
                let displayName = 'Unknown User';
                
                const fullUser = allUsers.find((user: any) => {
                  const userEmployeeId = user.employeeId || user.id;
                  return userEmployeeId === memberEmployeeId || 
                         String(userEmployeeId).toLowerCase() === String(memberEmployeeId).toLowerCase();
                });
                
                if (fullUser) {
                  displayName = fullUser.name || fullUser.userName || fullUser.fullName || 
                                (fullUser.firstName && fullUser.lastName ? fullUser.firstName + ' ' + fullUser.lastName : '') || 
                                'Unknown User';
                } else {
                  // Fallback to member data if user not found
                  if (member.memberFullName) {
                    displayName = member.memberFullName;
                  } else if (member.employeeName) {
                    displayName = member.employeeName;
                  } else if (member.memberName) {
                    displayName = member.memberName;
                  } else if (member.name) {
                    displayName = member.name;
                  }
                }
                
                const processedMember = {
                  id: memberEmployeeId,
                  name: displayName,
                  role: member.memberRole || member.role || 'Member',
                  department: member.memberDepartment || member.department || 'Unknown',
                  email: member.memberEmail || member.email || '',
                  position: member.position || member.role || 'team_member',
                  avatar: member.avatar || ''
                };
                
                console.log("✅ Processed team member:", processedMember);
                return processedMember;
              });
            }
          } else {
            console.warn("⚠️ Team response not successful or no data:", teamResponse);
          }
        } catch (teamError) {
          console.error('❌ Error loading team members for project', project.id, ':', teamError);
        }

        // Rest of your code for tasks and milestones...
        let tasks: any[] = [];
        try {
          const tasksResponse = await projectTaskService.getTasksByProject(project.id);
          if (tasksResponse && Array.isArray(tasksResponse)) {
            tasks = tasksResponse.map((task: any) => {
              const metadata = task.metadata || task.Metadata || {};
              return {
                id: task.value || task.Value || task.projectTaskId || task.id,
                title: task.label || task.Label || task.title || 'Untitled',
                description: task.description || task.Description || '',
                assignee: metadata.assignedMemberName || task.assignedMemberName || '',
                assigneeId: metadata.assignedMemberId || task.assignedMemberId || '',
                status: metadata.status || task.status || 'Pending',
                priority: metadata.priority || task.priority || 'Medium',
                dueDate: metadata.dueDate || task.dueDate || '',
                weight: metadata.weight || task.weight || 0,
                milestoneId: metadata.milestoneId?.toString() || task.milestoneId?.toString() || undefined
              };
            });
          }
        } catch (error) {
          console.error('❌ Error loading tasks for project', project.id, ':', error);
        }

        let milestones: any[] = [];
        try {
          const milestonesResponse = await milestoneService.getMilestonesByProjectId(project.id);
          if (milestonesResponse.success && milestonesResponse.data) {
            milestones = Array.isArray(milestonesResponse.data) ? milestonesResponse.data : [];
          }
        } catch (error) {
          console.error('❌ Error loading milestones for project', project.id, ':', error);
        }

        const calculatedProgress = calculateProjectProgress(tasks, milestones);
        const finalProgress = (tasks.length > 0 || milestones.length > 0) ? calculatedProgress : project.progress;

        // Update the project with detailed data
        setProjects(prev => prev.map(p => 
          p.id === project.id 
            ? { 
                ...p, 
                teamMembers, // This should now work
                tasks, 
                milestones: milestones.map((milestone: any) => ({
                  id: milestone.milestoneId?.toString() || milestone.id?.toString() || Date.now().toString(),
                  title: milestone.milestoneName || milestone.title,
                  description: milestone.description || '',
                  dueDate: milestone.dueDate || '',
                  priority: milestone.priority || 'Medium',
                  assignee: milestone.assignedMemberName || milestone.assignee || '',
                  assigneeId: milestone.assignedMemberId || milestone.assigneeId || '',
                  status: milestone.status || 'Pending',
                  tasks: []
                })),
                progress: finalProgress
              }
            : p
        ));

        console.log('✅ FINAL - Loaded detailed data for project:', project.title, {
          teamMembers: teamMembers.length,
          tasks: tasks.length,
          milestones: milestones.length
        });

      } catch (error) {
        console.error('❌ Error loading detailed data for project', project.id, ':', error);
      }
    }
  } catch (error) {
    console.error('❌ Error in loadDetailedProjectData:', error);
  }
};

  const fetchProjects = async () => {
  setLoading(true);
  try {
    let userIdForApi = user?.employeeId?.trim();

    if (!userIdForApi) {
      console.error("❌ CRITICAL: No employeeId found for user!");
      console.error("❌ User object:", user);
      userIdForApi = user?.id;

      if (!userIdForApi) {
        console.error("❌ No UUID either! Cannot fetch projects.");
        setLoading(false);
        setProjects([]);
        return;
      }

      console.warn("⚠️ WARNING: Using UUID fallback instead of employeeId");
      console.warn(`⚠️ Trying with UUID: ${userIdForApi}`);
    }

    console.log("🔍 Fetching assigned projects for:", userIdForApi);
    const response = await apiClient.get<any[]>(`/ProjectAssignment/User-projects?employeeId=${encodeURIComponent(userIdForApi)}`);

    console.log("📡 AssignedToMe - Raw API response:", response);
    console.log("📡 AssignedToMe - Response data:", response.data);

    if (response.success && response.data) {
      const mapped = await Promise.all(
        response.data.map(async (a: any) => {
          const assignmentId = a.assignmentId || a.id;

          console.log("✅ Mapping assignment - Project:", a.projectName, "| AssignmentId:", assignmentId, "| Status:", a.status);

          let assignedByName = a.createUser || "Unknown";
          if (assignedByName && assignedByName.length > 30 && assignedByName.includes("-")) {
            assignedByName = await getUserDisplayName(assignedByName);
          }

          const assignmentStatus = a.assignmentStatus || "Pending";
          const projectStatus = a.projectStatus || a.status || "Active";

          let displayStatus = assignmentStatus;

          console.log("🔄 Status mapping - Project:", projectStatus, "| Assignment:", assignmentStatus, "→ Display:", displayStatus);

          const progress = a.progress !== undefined ? a.progress : 
                          a.memberProgress !== undefined ? a.memberProgress : 
                          a.projectProgress !== undefined ? a.projectProgress : 0;

          return {
            assignmentId: assignmentId,
            id: a.projectId,
            title: a.projectName || "Untitled Project",
            description: a.description || "",
            dueDate: a.dueDate || "",
            role: a.memberRole || "Member",
            assignedBy: assignedByName,
            assignedTo: a.memberFullName || a.memberEmail || user?.name || "You",
            priority: a.priority || "Medium",
            status: displayStatus,
            progress: progress,
            rejectionReason: a.rejectionReason,
            isTerminated: a.status === "Terminated" || a.status === "Rejected" || a.isActive === false,
            files: a.files || [],
            createdBy: a.createUser,
            // Initialize empty arrays for detailed data
            teamMembers: [],
            milestones: [],
            tasks: []
          } as Project;
        })
      );

      const assignedToMeOnly = mapped.filter((p: Project) => {
        const userIdentifiers = [
          user?.email?.toLowerCase(),
          user?.username?.toLowerCase(),
          user?.name?.toLowerCase(),
          user?.fullName?.toLowerCase(),
          user?.id,
          user?.employeeId,
        ].filter(Boolean);

        const creatorIdentifiers = [p.assignedBy?.toLowerCase()].filter(Boolean);

        const isCreatedByMe = userIdentifiers.some((uid) => creatorIdentifiers.some((cid) => cid === uid));

        console.log("🔍 Project:", p.title, "| Created by:", p.assignedBy, "| Is mine?", isCreatedByMe);

        return !isCreatedByMe;
      });

      // FIX: Remove the problematic filtering that was hiding projects
      console.log("📊 Assignment stats:");
      console.log("  - Total assigned:", assignedToMeOnly.length);
      console.log("  - Pending acceptance:", assignedToMeOnly.filter((p) => p.status === "Pending").length);
      console.log("  - Approved:", assignedToMeOnly.filter((p) => p.status === "Approved" || p.status === "Active" || p.status === "In Progress").length);
      console.log("  - Rejected:", assignedToMeOnly.filter((p) => p.status === "Rejected").length);
      
      // Set all projects without filtering
      setProjects(assignedToMeOnly);
      setNewProject(assignedToMeOnly.filter((p: Project) => p.status === "Pending"));

      // Load detailed data for accepted projects
      await loadDetailedProjectData(assignedToMeOnly);
    }
  } catch (err) {
    console.error(err);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchProjects();
    fetchAllUsers();
  }, []);

  const loadProjectAttachments = async (projects: Project[]) => {
    try {
      const { attachmentsService } = await import("@/services/attachmentsService");

      for (const project of projects) {
        try {
          console.log("📎 Loading attachments for assigned project:", project.id);
          const attachments = await attachmentsService.list("Project", project.id.toString());
          console.log("📎 Found attachments:", attachments);

          setProjects((prev) =>
            prev.map((p) =>
              p.id === project.id
                ? {
                    ...p,
                    files: attachments.map((att) => ({
                      id: att.id,
                      name: att.fileName,
                      size: att.fileSize,
                      type: att.contentType,
                      url: att.url,
                    })),
                  }
                : p
            )
          );
        } catch (error) {
          console.error("❌ Failed to load attachments for project:", project.id, error);
        }
      }
    } catch (error) {
      console.error("❌ Failed to load attachments service:", error);
    }
  };

  const refreshAttachments = async () => {
    console.log("🔄 Refreshing attachments for all assigned projects...");
    await loadProjectAttachments(projects);
  };

  const handleAttachmentDownload = async (file: any) => {
    try {
      console.log("📎 Attempting to download file:", file.name);

      if (file.url && file.url.startsWith("http")) {
        console.log("📎 Using direct URL:", file.url);
        window.open(file.url, "_blank");
        return;
      }

      const { attachmentsService } = await import("@/services/attachmentsService");

      if (file.id) {
        try {
          const tokenResponse = await attachmentsService.getDownloadToken(file.id);
          console.log("📎 Got download token:", tokenResponse);

          const blob = await attachmentsService.securedDownload(file.id, tokenResponse.token);
          console.log("📎 Downloaded blob:", blob);

          const url = window.URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = file.name;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        } catch (tokenError) {
          console.error("❌ Token-based download failed:", tokenError);
          if (file.url) {
            window.open(file.url, "_blank");
          }
        }
      } else {
        console.error("❌ No attachment ID available for secure download");
        if (file.url) {
          window.open(file.url, "_blank");
        }
      }
    } catch (error) {
      console.error("❌ Download failed:", error);
      alert(`Failed to download ${file.name}. Please try again or contact support.`);
    }
  };

  
  const columns = [
    {
      name: "Project",
      selector: (row: Project) => row.title,
      sortable: true,
      cell: (row: Project) => (
        <div>
          <div className="font-medium">{row.title}</div>
          <div className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            {row.description}
          </div>
        </div>
      ),
      minWidth: "200px",
    },
    {
      name: "Assigned To",
      selector: (row: Project) => row.assignedTo || "You",
      sortable: true,
      minWidth: "150px",
    },
    {
      name: "Assigned By",
      selector: (row: Project) => row.assignedBy || "Unknown",
      sortable: true,
      minWidth: "150px",
    },
    {
      name: "Role",
      selector: (row: Project) => row.role || "Member",
      sortable: true,
      cell: (row: Project) => (
        <span
          className={`px-2 py-1 text-xs rounded-full ${
            row.role === "Scrum Master" || row.role === "ScrumMaster"
              ? darkMode
                ? "bg-purple-900 text-purple-300"
                : "bg-purple-100 text-purple-800"
              : row.role === "Team Leader" || row.role === "TeamLeader"
              ? darkMode
                ? "bg-blue-900 text-blue-300"
                : "bg-blue-100 text-blue-800"
              : darkMode
              ? "bg-gray-700 text-gray-300"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {row.role}
        </span>
      ),
    },
    {
      name: "Due Date",
      selector: (row: Project) => row.dueDate,
      sortable: true,
    },
    {
      name: "Status",
      cell: (row: Project) => (
        <span
          className={`px-2 py-1 text-xs rounded-full ${
            row.status === "Completed"
              ? darkMode
                ? "bg-green-900 text-green-300"
                : "bg-green-100 text-green-800"
              : row.status === "In Progress"
              ? darkMode
                ? "bg-purple-900 text-purple-300"
                : "bg-purple-100 text-purple-800"
              : row.status === "Active"
              ? darkMode
                ? "bg-blue-900 text-blue-300"
                : "bg-blue-100 text-blue-800"
              : row.status === "Pending Approval"
              ? darkMode
                ? "bg-orange-900 text-orange-300"
                : "bg-orange-100 text-orange-800"
              : row.status === "On Hold"
              ? darkMode
                ? "bg-yellow-900 text-yellow-300"
                : "bg-yellow-100 text-yellow-800"
              : row.status === "Not Started"
              ? darkMode
                ? "bg-gray-700 text-gray-300"
                : "bg-gray-100 text-gray-800"
              : darkMode
              ? "bg-gray-700 text-gray-300"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {row.status}
        </span>
      ),
      sortable: true,
    },
    {
      name: "Progress",
      cell: (row: Project) => (
        <div className="flex items-center">
          <div
            className={`w-32 h-2 rounded-full ${darkMode ? "bg-gray-700" : "bg-gray-300"}`}
          >
            <div
              className={`h-full rounded-full ${
                row.progress < 30
                  ? "bg-red-500"
                  : row.progress < 70
                  ? "bg-yellow-500"
                  : "bg-green-500"
              }`}
              style={{ width: `${row.progress}%` }}
            ></div>
          </div>
          <span className="ml-2 text-sm">{row.progress}</span>
        </div>
      ),
      sortable: true,
    },
    {
      name: "Actions",
      cell: (row: Project) => {
        const isPending = row.status === "Pending" || row.status === "To Do" || (!row.status.includes("Approved") && !row.status.includes("Rejected"));
        const isApproved = row.status === "Approved" || row.status === "In Progress" || row.status === "Active";
        const isRejected = row.status === "Rejected";

        return (
          <div className="flex gap-1 flex-wrap">
            {/* Show View button for all project statuses */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedProject(row);
              }}
              className={`px-3 py-1 text-xs rounded ${
                darkMode
                  ? "bg-blue-700 hover:bg-blue-600 text-white"
                  : "bg-blue-500 hover:bg-blue-600 text-white"
              }`}
              title="View project details"
            >
              👁️ View
            </button>

            {isPending && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setProjectToApprove(row);
                  setApprovalDialog(true);
                }}
                className={`px-3 py-1 text-xs rounded ${
                  darkMode
                    ? "bg-green-700 hover:bg-green-600 text-white"
                    : "bg-green-500 hover:bg-green-600 text-white"
                }`}
                title="Accept this assignment"
              >
                ✓ Accept
              </button>
            )}

            {(isPending || isApproved) && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setProjectToReject(row);
                  setRejectionDialog(true);
                }}
                className={`px-3 py-1 text-xs rounded ${
                  darkMode
                    ? "bg-red-700 hover:bg-red-600 text-white"
                    : "bg-red-500 hover:bg-red-600 text-white"
                }`}
                title={isApproved ? "Reject this assignment (you can change your mind)" : "Reject this assignment"}
              >
                ✗ Reject
              </button>
            )}

            {isRejected && row.rejectionReason && (
              <span
                className="px-3 py-1 text-xs rounded bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200"
                title={`Rejected: ${row.rejectionReason}`}
              >
                Rejected
              </span>
            )}
          </div>
        );
      },
      minWidth: "200px",
    },
  ];

  const customStyles = {
    rows: {
      style: {
        minHeight: "72px",
        backgroundColor: darkMode ? "#1e1e1e" : "#ffffff",
      },
    },
    headCells: {
      style: {
        paddingLeft: "8px",
        paddingRight: "8px",
        backgroundColor: darkMode ? "#27272a" : "#e5e7eb",
        color: darkMode ? "#f3f4f6" : "#111827",
        fontWeight: "bold",
        fontSize: "0.75rem",
        textTransform: "uppercase" as const,
      },
    },
    cells: {
      style: {
        paddingLeft: "10px",
        paddingRight: "9px",
        color: darkMode ? "#e5e7eb" : "#111827",
      },
    },
  };

  const conditionalRowStyles = [
    {
      when: (row: Project) => true, // Make all rows clickable
      style: {
        cursor: "pointer",
        "&:hover": {
          backgroundColor: darkMode ? "#2d2d2d" : "#f5f5f5",
        },
      },
    },
  ];

  const filteredProjects = useMemo(() => {
    if (!searchText) return activeProjects;
    const searchLower = searchText.toLowerCase();
    return activeProjects.filter(
      (project) =>
        (project.title || "").toLowerCase().includes(searchLower) ||
        (project.description || "").toLowerCase().includes(searchLower) ||
        (project.dueDate || "").toLowerCase().includes(searchLower) ||
        (project.status || "").toLowerCase().includes(searchLower) ||
        (project.priority && project.priority.toLowerCase().includes(searchLower))
    );
  }, [activeProjects, searchText]);

  const filteredByStatus = useMemo(() => {
  if (statusFilter === "All") return filteredProjects;

  if (statusFilter === "Pending") {
    return filteredProjects.filter(
      (p) =>
        p.status === "Pending" ||
        p.status === "To Do" ||
        (!p.status.includes("Approved") && !p.status.includes("Rejected") && !p.status.includes("Active") && !p.status.includes("In Progress"))
    );
  } else if (statusFilter === "Accepted") {
    return filteredProjects.filter(
      (p) =>
        p.status === "Approved" ||
        p.status === "In Progress" ||
        p.status === "Active"
    );
  } else if (statusFilter === "Rejected") {
    return filteredProjects.filter((p) => p.status === "Rejected");
  }

  return filteredProjects;
}, [filteredProjects, statusFilter]);

  const filteredByRole = roleFilter === "All" ? filteredByStatus : filteredByStatus.filter((project) => project.role === roleFilter);

  return (
    <div className={` ${darkMode ? "bg-zinc-900 text-gray-100" : "bg-white text-gray-800"}`}>
          
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <RefreshCw className="animate-spin h-8 w-8 text-purple-500" />
        </div>
      ) : showTaskDetailView && selectedTask ? (
        <TaskDetailView
          task={selectedTask}
          darkMode={darkMode}
          onBack={() => {
            setShowTaskDetailView(false);
            setSelectedTask(null);
          }}
          onEdit={function (): void {
            throw new Error("Function not implemented.");
          }}
        />
      ) : selectedProject ? (
        // Show Project Detail View when a project is selected
        <ProjectDetailView
          project={{
             ...toCommonProject(selectedProject), 
             teamMembers: selectedProject.teamMembers || []}
          }
          darkMode={darkMode}
          onBack={() => setSelectedProject(null)}
          showEditFeatures={false}
          onAddTask={() => setShowTaskModal(true)}
          onAddMilestone={() => setShowMilestoneModal(true)}
          tasks={(selectedProject.tasks || []).map(toCommonTask)}
          milestones={(selectedProject.milestones || []).map(toCommonMilestone)}
          onTaskClick={(task) => {
            setSelectedTask(task);
            setShowTaskDetailView(true);
          }}
          onMilestoneClick={(milestone) => {
            console.log('Milestone clicked:', milestone);
          }}
          formatFileSize={formatFileSize}
          canCreateTasks={true}
          showMilestones={true}
          onAddTeamMember={() => {
            console.log('Add team member - not available for assigned projects');
          }}
          onRemoveTeamMember={() => {
            console.log('Remove team member - not available for assigned projects');
          }}
          onDeleteMilestone={() => {
            console.log('Delete milestone - not available for assigned projects');
          }}
          onDeleteTask={() => {
            console.log('Delete task - not available for assigned projects');
          }}
          onAddAttachment={async (file: File) => {
            try {
              const formData = new FormData();
              formData.append("file", file);
              formData.append("entityType", "Project");
              formData.append("entityId", selectedProject.id.toString());
              
              const { attachmentsService } = await import('@/services/attachmentsService');
              await attachmentsService.upload(formData);
              
              const attachments = await attachmentsService.list('Project', selectedProject.id.toString());
              const updatedProject = {
                ...selectedProject,
                files: attachments.map((att: any) => ({
                  id: att.id,
                  name: att.fileName,
                  size: att.fileSize,
                  type: att.fileType,
                  url: att.fileUrl
                }))
              };
              setSelectedProject(updatedProject);
            } catch (error) {
              console.error('Error uploading attachment:', error);
              alert('Failed to upload attachment. Please try again.');
            }
          }}
          onDeleteAttachment={async (fileName: string) => {
            const fileToDelete = selectedProject.files?.find(f => f.name === fileName);
            if (fileToDelete?.id) {
              try {
                const { attachmentsService } = await import('@/services/attachmentsService');
                await attachmentsService.delete(Number(fileToDelete.id));
                
                const attachments = await attachmentsService.list('Project', selectedProject.id.toString());
                const updatedProject = {
                  ...selectedProject,
                  files: attachments.map((att: any) => ({
                    id: att.id,
                    name: att.fileName,
                    size: att.fileSize,
                    type: att.fileType,
                    url: att.fileUrl
                  }))
                };
                setSelectedProject(updatedProject);
              } catch (error) {
                console.error('Error deleting attachment:', error);
                alert('Failed to delete attachment. Please try again.');
              }
            }
          }}
        />
      ) : (
        // Show project list when no project is selected
        <div>
          {/* New Assignments Section */}
          {newProject.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-4">New Assignments</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {newProject.map((project) => (
                  <Card
                    key={project.id}
                    className={`cursor-pointer transition-all hover:shadow-lg ${
                      darkMode
                        ? "bg-gray-800 hover:border-purple-500"
                        : "bg-white hover:border-purple-400"
                    }`}
                  >
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <h3 className="text-lg font-semibold">{project.title}</h3>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            darkMode
                              ? "bg-purple-900 text-purple-300"
                              : "bg-purple-100 text-purple-800"
                          }`}
                        >
                          {project.priority}
                        </span>
                      </div>
                      <p className={`mt-2 text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                        {project.description}
                      </p>
                      <div className="mt-4 space-y-2">
                        <div className="flex items-center text-sm">
                          <UserIcon size={16} className="mr-2" />
                          <span>Assigned by: {project.assignedBy}</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <CalendarIcon size={16} className="mr-2" />
                          <span>Due: {project.dueDate}</span>
                        </div>
                      </div>
                      <div className="mt-4 flex justify-end space-x-2">
                        <button
                          onClick={() => {
                            setProjectToApprove(project);
                            setApprovalDialog(true);
                          }}
                          className={`px-4 py-2 rounded-md text-white ${
                            darkMode
                              ? "bg-green-700 hover:bg-green-600"
                              : "bg-green-500 hover:bg-green-600"
                          }`}
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => {
                            setProjectToReject(project);
                            setRejectionDialog(true);
                          }}
                          className={`px-4 py-2 rounded-md text-white ${
                            darkMode
                              ? "bg-red-700 hover:bg-red-600"
                              : "bg-red-500 hover:bg-red-600"
                          }`}
                        >
                          Reject
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Active Projects */}
            <div className="mt-2">
            {showHeader !== false && (
            <div className="flex justify-between items-center mb-5">
              <div className="ml-2 mb-2">
                <h1 className="text-2xl font-bold">My Projects</h1>
                <p className={`text-sm mt-1  ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                  projects assigned to me | <span>{activeProjects.length}</span> Active projects
                </p>
              </div>
            </div>
            )}
            <div className="mb-5 space-y-3">
              {/* Status Filter Tabs */}
              <div className="flex items-center justify-between ">
               <div className="flex  gap-2">
                <button
                  onClick={() => setStatusFilter("Pending")}
                  className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${
                    statusFilter === "Pending"
                      ? darkMode
                        ? "bg-yellow-700 text-white"
                        : "bg-yellow-500 text-white"
                      : darkMode
                      ? "bg-zinc-700 text-gray-300 hover:bg-zinc-600"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  ⏳ Pending
                </button>
                <button
                  onClick={() => setStatusFilter("Accepted")}
                  className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${
                    statusFilter === "Accepted"
                      ? darkMode
                        ? "bg-green-700 text-white"
                        : "bg-green-500 text-white"
                      : darkMode
                      ? "bg-zinc-700 text-gray-300 hover:bg-zinc-600"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  ✓ Approved
                </button>
                <button
                  onClick={() => setStatusFilter("Rejected")}
                  className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${
                    statusFilter === "Rejected"
                      ? darkMode
                        ? "bg-red-700 text-white"
                        : "bg-red-500 text-white"
                      : darkMode
                      ? "bg-zinc-700 text-gray-300 hover:bg-zinc-600"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  ✗ Rejected
                </button>
                <button
                  onClick={() => setStatusFilter("All")}
                  className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${
                    statusFilter === "All"
                      ? darkMode
                        ? "bg-purple-700 text-white"
                        : "bg-purple-500 text-white"
                      : darkMode
                      ? "bg-zinc-700 text-gray-300 hover:bg-zinc-600"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  📋 All
                </button>
                </div>
                <div className="relative w-full md:w-64">
                  <input
                    type="text"
                    placeholder="Search projects..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                      darkMode
                        ? "bg-zinc-700 border-zinc-600 text-white placeholder-gray-400 focus:border-gray-700"
                        : "bg-white border-gray-300 text-gray-800 placeholder-gray-500 focus:border-gray-400"
                    } focus:outline-none`}
                  />
                  <div className={`absolute left-3 top-2.5 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center">
                {/* Role Filter Toggle */}
                <div className="flex rounded-lg overflow-hidden ">
                  <button
                    onClick={() => setRoleFilter("Team Leader")}
                    className={`px-4 py-2 text-sm rounded-l-lg ${
                      roleFilter === "Team Leader"
                        ? darkMode
                          ? "bg-gray-700 text-white"
                          : "bg-purple-900 text-white"
                        : darkMode
                        ? "bg-zinc-700 text-gray-300"
                        : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    Team Leader
                  </button>
                  <button
                    onClick={() => setRoleFilter("Scrum Master")}
                    className={`px-4 py-2 text-sm rounded-r-lg ${
                      roleFilter === "Scrum Master"
                        ? darkMode
                          ? "bg-gray-700 text-white"
                          : "bg-purple-900 text-white"
                        : darkMode
                        ? "bg-zinc-700 text-gray-300"
                        : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    Scrum Master
                  </button>
                </div>

                
              </div>

              <DataTable
                columns={columns}
                data={filteredByRole}
                customStyles={customStyles}
                conditionalRowStyles={conditionalRowStyles}
                onRowClicked={(row) => {
                  // Always show project detail view instead of navigating
                  setSelectedProject(row);
                }}
                highlightOnHover
                pointerOnHover={false}
                pagination
                paginationPerPage={10}
                paginationRowsPerPageOptions={[5, 10, 15, 20]}
                theme={darkMode ? "dark" : "light"}
                noDataComponent={<div className="p-4 text-center">No projects found</div>}
              />
            </div>
          </div>

          {/* Terminated project Card View */}
          {terminatedProjects.length > 0 && (
            <div className="mt-8">
              <button
                onClick={() => setShowTerminated(!showTerminated)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg mb-4 ${
                  darkMode
                    ? "bg-gray-700 hover:bg-gray-600"
                    : "bg-gray-200 hover:bg-gray-300"
                }`}
              >
                <span className="font-semibold">
                  {showTerminated ? "Hide" : "Show"} Terminated Projects ({terminatedProjects.length})
                </span>
                <svg
                  className={`w-4 h-4 transition-transform ${showTerminated ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              {showTerminated && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {terminatedProjects.map((project) => (
                    <Card
                      key={project.id}
                      onClick={() => setSelectedProject(project)}
                      className={`cursor-pointer transition-all hover:shadow-lg ${
                        darkMode
                          ? "bg-gray-800 hover:border-purple-500"
                          : "bg-white hover:border-purple-400"
                      }`}
                    >
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                          <h3 className="text-lg font-semibold">{project.title}</h3>
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              darkMode
                                ? "bg-red-900 text-red-300"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            Rejected
                          </span>
                        </div>
                        <p className={`mt-2 text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                          {project.description}
                        </p>

                        <div className="mt-4 space-y-2">
                          <div className="flex items-center text-sm">
                            <UserIcon size={16} className="mr-2" />
                            <span>Assigned by: {project.assignedBy}</span>
                          </div>
                          <div className="flex items-center text-sm">
                            <CalendarIcon size={16} className="mr-2" />
                            <span>Due: {project.dueDate}</span>
                          </div>

                          <div className="text-sm">
                            <p className="font-medium mt-2">Rejection Reason:</p>
                            <p className={`mt-1 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                              {project.rejectionReason || "No reason provided"}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Dialogs and Modals */}
      <CreateTaskModal
        open={showTaskModal}
        onClose={() => setShowTaskModal(false)}
        defaultProjectId={(selectedProject as any)?.id?.toString()}
        initialProjectId={(selectedProject as any)?.id?.toString()}
        projects={projects.length > 0 ? projects.map((p) => ({ id: p.id.toString(), name: p.title, members: [] })) : []}
        allMembers={allMembers}
        darkMode={darkMode}
        onCreate={() => {
          setShowTaskModal(false);
          fetchProjects();
        }}
      />
      <CreateMilestoneModal
        open={showMilestoneModal}
        onClose={() => setShowMilestoneModal(false)}
        defaultProjectId={(selectedProject as any)?.id?.toString()}
        initialProjectId={(selectedProject as any)?.id?.toString()}
        projects={projects.length > 0 ? projects.map((p) => ({ id: p.id.toString(), name: p.title, members: [] })) : []}
        allMembers={allMembers}
        darkMode={darkMode}
        onCreate={() => {
          setShowMilestoneModal(false);
          fetchProjects();
        }}
      />
      <Dialog open={rejectionDialog} onOpenChange={setRejectionDialog}>
        <DialogContent className={darkMode ? "bg-gray-800" : "bg-white"}>
          <DialogHeader>
            <DialogTitle>Rejection Reason</DialogTitle>
            <DialogDescription className={darkMode ? "text-gray-400" : "text-gray-600"}>
              Please provide a reason for rejecting {projectToReject?.title}
            </DialogDescription>
          </DialogHeader>
          <textarea
            className={`w-full p-2 mt-2 border rounded-md ${
              darkMode
                ? "bg-gray-700 border-gray-600 text-white"
                : "bg-white border-gray-300"
            }`}
            rows={4}
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Enter your reason for rejection..."
          />
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={() => {
                setRejectionDialog(false);
                setRejectionReason("");
              }}
              className={`px-4 py-2 rounded-md ${
                darkMode
                  ? "bg-gray-700 hover:bg-gray-600"
                  : "bg-gray-200 hover:bg-gray-300"
              }`}
            >
              Cancel
            </button>
            <button
              onClick={handleRejectProject}
              className={`px-4 py-2 rounded-md text-white ${
                darkMode
                  ? "bg-red-700 hover:bg-red-600"
                  : "bg-red-500 hover:bg-red-600"
              }`}
              disabled={!rejectionReason.trim()}
            >
              Send
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Approval Dialog */}
      <Dialog open={approvalDialog} onOpenChange={setApprovalDialog}>
        <DialogContent className={darkMode ? "bg-gray-800" : "bg-white"}>
          <DialogHeader>
            <DialogTitle>Approve Project Assignment</DialogTitle>
            <DialogDescription className={darkMode ? "text-gray-400" : "text-gray-600"}>
              Are you sure you want to approve the assignment for "{projectToApprove?.title}"?
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={() => {
                setApprovalDialog(false);
                setProjectToApprove(null);
              }}
              className={`px-4 py-2 rounded-md ${
                darkMode
                  ? "bg-gray-700 hover:bg-gray-600"
                  : "bg-gray-200 hover:bg-gray-300"
              }`}
            >
              Cancel
            </button>
            <button
              onClick={handleApproveProject}
              className={`px-4 py-2 rounded-md text-white ${
                darkMode
                  ? "bg-green-700 hover:bg-green-600"
                  : "bg-green-500 hover:bg-green-600"
              }`}
            >
              Approve
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!previewFile} onOpenChange={() => setPreviewFile(null)}>
        <DialogContent className={darkMode ? "bg-gray-800" : "bg-white"}>
          {previewFile && (
            <>
              <DialogHeader>
                <DialogTitle>{previewFile.name}</DialogTitle>
                <DialogDescription className={darkMode ? "text-gray-400" : "text-gray-600"}>
                  {formatFileSize(previewFile.size)}
                </DialogDescription>
              </DialogHeader>
              <div className="mt-4">
                {previewFile.type.includes("image") ? (
                  <img
                    src={previewFile.url}
                    alt={previewFile.name}
                    className="w-full h-auto rounded-md"
                  />
                ) : (
                  <div className={`p-8 rounded-md ${darkMode ? "bg-gray-700" : "bg-gray-100"} text-center`}>
                    <p className="text-lg font-medium mb-4">
                      {getFileIcon(previewFile.type)} {previewFile.name}
                    </p>
                    <div className="flex justify-end space-x-3 pt-4">
                      <a
                        href={previewFile.url}
                        download={previewFile.name}
                        className={`px-4 py-2 rounded-md ${
                          darkMode
                            ? "bg-blue-600 hover:bg-blue-500"
                            : "bg-blue-500 hover:bg-blue-400"
                        } text-white`}
                      >
                        Download
                      </a>
                      <a
                        href={previewFile.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`px-4 py-2 rounded-md ${
                          darkMode
                            ? "bg-gray-600 hover:bg-gray-500"
                            : "bg-gray-200 hover:bg-gray-300"
                        }`}
                      >
                        Open
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
        </div>
    
  
  );
};

export default MyAssignedProjects;