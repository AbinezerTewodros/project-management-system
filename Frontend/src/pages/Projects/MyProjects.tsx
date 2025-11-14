import { useEffect, useMemo, useState } from "react";
import { Search, Paperclip, Calendar as CalendarIcon } from "lucide-react";
import DataTable from "react-data-table-component";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Project, Task } from "@/types/types";
import { Outlet } from "react-router-dom";
import { apiClient } from '@/lib/api';
import { projectService } from '@/services/projectService';
import { useAuth } from "@/context/AuthContext";
import CreateTaskModal from "@/pages/Tasks/CreateTaskModal";
import { Milestone } from "@/types/milestoneTypes";
import { MilestoneStatus } from '@/types/milestoneTypes';
import ProjectDetailView from "@/pages/Projects/ProjectDetailView";

// At the very top, before any component code
function extractTeamMembersRaw(raw: any): any[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'object') {
    if (Array.isArray(raw.data)) return raw.data;
    if (Array.isArray(raw.members)) return raw.members;
  }
  return [];
}

interface MyProjectsProps {
  darkMode: boolean;
  onProjectCreated: (project: Project) => void;
  projects?: Project[];
}

// Adapter: convert app-level Project to ProjectDetailView's CommonProject
function toCommonProject(project: Project): any {
  return {
    id: project.id,
    title: project.title,
    description: project.description,
    dueDate: project.dueDate,
    // startDate: project.startDate,
    priority: project.priority === 'Critical' ? 'Urgent' : (project.priority as 'High' | 'Medium' | 'Low' | 'Urgent'),
    status: project.status === 'Pending Approval' ? 'To Do' : (
      project.status === 'Active' || project.status === 'In Progress' ? 'In Progress' : (
        project.status === 'Completed' ? 'Done' : project.status)
    ),
    progress: project.progress || 0,
    files: project.files,
    teamLeader: project.teamLeader,
    scrumMaster: project.scrumMaster,
    teamMembers: project.teamMembers,
    assignedBy: project.createdBy,
  };
}

function toCommonTask(task: Task): any {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    priority: task.priority === 'Critical' ? 'Urgent' : (task.priority as 'High' | 'Medium' | 'Low' | 'Urgent'),
    assignee: task.assignee || '',
    status: (task.status === 'Pending' ? 'To Do' :
            task.status === 'InProgress' ? 'In Progress' :
            task.status === 'Completed' ? 'Done' :
            task.status === 'Accepted' ? 'Confirm' : task.status),
    dueDate: task.dueDate || '',
    weight: task.weight || 0,
    files: task.files,
    milestoneId: task.milestoneId,
    subtask: task.subtask
  };
}

function toCommonMilestone(milestone: Milestone): any {
  return {
    id: milestone.id,
    title: milestone.title,
    description: milestone.description,
    priority: milestone.priority === 'Critical' ? 'Urgent' : (milestone.priority as 'High' | 'Medium' | 'Low' | 'Urgent'),
    assignee: milestone.assignee,
    status: milestone.status === 'Pending' ? 'To Do' : 
            milestone.status === 'InProgress' ? 'In Progress' : 
            milestone.status === 'Completed' ? 'Done' : milestone.status,
    dueDate: milestone.dueDate,
    // startDate: milestone.startDate,
    weight: milestone.weight || 0,
    tasks: milestone.tasks ? milestone.tasks.map(toCommonTask) : [],
    files: milestone.files
  };
}

const MyProjects = ({ darkMode, projects: parentProjects }: MyProjectsProps) => {
  const { user } = useAuth();
  const [localProjects, setLocalProjects] = useState<Project[]>([]);
  const [searchText, setSearchText] = useState("");
  const navigate = useNavigate();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProject, setEditedProject] = useState<Project | null>(null);
  const [showCreateMilestone, setShowCreateMilestone] = useState(false);
  const [newMilestoneTitle, setNewMilestoneTitle] = useState("");
  const [newMilestoneDescription, setNewMilestoneDescription] = useState("");
  const [newMilestoneDueDate, setNewMilestoneDueDate] = useState("");
  const [newMilestonePriority, setNewMilestonePriority] = useState<'Critical' | 'High' | 'Medium' | 'Low'>("Medium");
  const [newMilestoneWeight, setNewMilestoneWeight] = useState<number>(50);
  const [newMilestoneAssignee, setNewMilestoneAssignee] = useState("");
  const [newFile, setNewFile] = useState<File | null>(null);
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRole, setNewMemberRole] = useState<'Member' | 'Team Leader' | 'Scrum Master'>('Member');
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);

  // Fetch projects function
  const fetchProjects = async (): Promise<Project[]> => {
    try {
      const response = await projectService.getAllProjects();
      if (response.success && response.data) {
        console.log('📊 Raw project data from backend:', response.data);
        
        const userProjects = (response.data || []).filter((project: any) => {
          const matches = (
            project.createdBy === user?.email ||
            project.createdBy === user?.id ||
            project.createdBy === user?.employeeId ||
            project.createdBy === user?.name ||
            project.createdBy === user?.fullName ||
            project.createdBy === user?.username ||
            project.createUser === user?.email ||
            project.createUser === user?.id ||
            project.createUser === user?.employeeId ||
            project.createUser === user?.name ||
            project.createUser === user?.fullName ||
            project.createUser === user?.username ||
            project.projectOwner === user?.email ||
            project.projectOwner === user?.id ||
            project.projectOwner === user?.employeeId ||
            project.projectOwner === user?.name ||
            project.projectOwner === user?.fullName ||
            project.projectOwner === user?.username ||
            project.projectOwnerEmail === user?.email
          );
          
          return matches;
        });
        
        console.log('✅ Filtered projects (created by me):', userProjects.length, 'out of', response.data.length);

        const basicProjects = userProjects.map((project: any) => ({
        id: project.id,
        title: project.title || project.projectName || 'Untitled Project',
        description: project.description || '',
        dueDate: project.dueDate || project.endDate || '',
        createdBy: project.createdBy || project.projectOwner || 'Unknown',
        teamMembers: [], // Will be loaded when viewing details
        scrumMaster: project.scrumMaster || null,
        teamLeader: project.teamLeader || null,
        priority: project.priority === 'high' ? 'High' : project.priority === 'medium' ? 'Medium' : 'Low',
        status: project.status === 'active' ? 'Pending' : project.status === 'completed' ? 'Completed' : 'Pending',
        progress: project.progress || 0,
        files: project.files || [],
        milestones: project.milestones || [],
        tasks: project.tasks || []
      }));

        setLocalProjects(basicProjects as any);
        
        return basicProjects as any;
      }
      return [];
    } catch (error) {
      console.error('❌ Error fetching projects:', error);
      return [];
    } 
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (parentProjects && parentProjects.length > 0) {
      console.log('🔄 Refreshing projects from parent:', parentProjects.length, 'projects');
      setLocalProjects(parentProjects);
    }
  }, [parentProjects]);

  const loadProjectAttachments = async (projects: Project[]) => {
    try {
      const { attachmentsService } = await import('@/services/attachmentsService');
      
      for (const project of projects) {
        try {
          console.log('📎 Loading attachments for project:', project.id);
          const attachments = await attachmentsService.list('Project', project.id.toString());
          
          setLocalProjects(prev => prev.map(p => 
            p.id === project.id 
              ? { ...p, files: attachments.map((att: any) => ({
                  id: att.id,
                  name: att.fileName,
                  size: att.fileSize,
                  type: att.fileType,
                  url: att.fileUrl
                })) }
              : p
          ));
        } catch (error) {
          console.error('❌ Error loading attachments for project', project.id, ':', error);
        }
      }
    } catch (error) {
      console.error('❌ Error loading project attachments:', error);
    }
  };

  const loadProjectTeamMembers = async (projects: Project[]) => {
    try {
      const { projectAssignmentService } = await import('@/services/projectAssignmentService');
      
      for (const project of projects) {
        try {
          console.log('👥 Loading team members for project:', project.id);
          
          const usersResponse = await apiClient.get('/User');
          const allUsers = Array.isArray(usersResponse.data) ? usersResponse.data : [];
          
          const teamResponse = await projectAssignmentService.getProjectMembers(project.id);
          
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
              const teamMembers = teamMembersData.map((member: any) => {
                let displayName = 'Unknown User';
                let nameSource = 'none';
                
                if (member.memberFullName) {
                  displayName = member.memberFullName;
                  nameSource = 'memberFullName';
                } else if (member.employeeName) {
                  displayName = member.employeeName;
                  nameSource = 'employeeName';
                } else if (member.memberName) {
                  displayName = member.memberName;
                  nameSource = 'memberName';
                } else if (member.name) {
                  displayName = member.name;
                  nameSource = 'name';
                } else {
                  const memberEmployeeId = member.employeeId || member.memberId || member.id;
                  let fullUser = allUsers.find((user: any) => {
                    const userEmployeeId = user.employeeId || user.id;
                    return userEmployeeId === memberEmployeeId;
                  });
                  
                  if (!fullUser) {
                    fullUser = allUsers.find((user: any) => {
                      const userEmployeeId = String(user.employeeId || user.id || '').toLowerCase();
                      const memberId = String(memberEmployeeId || '').toLowerCase();
                      return userEmployeeId === memberId && userEmployeeId !== '';
                    });
                  }
                  
                  if (fullUser) {
                    displayName = fullUser.name || fullUser.userName || fullUser.fullName || 
                                  (fullUser.firstName && fullUser.lastName ? fullUser.firstName + ' ' + fullUser.lastName : '') || 
                                  'Unknown User';
                    nameSource = 'userLookup';
                  }
                }
                
                return {
                  id: member.employeeId || member.memberId || member.id,
                  name: displayName,
                  role: member.memberRole || member.role || 'Member',
                  department: member.memberDepartment || member.department || 'Unknown',
                  email: member.memberEmail || member.email || '',
                  phone: member.memberPhone || member.phone || '',
                  position: member.position || member.role || 'team_member',
                  avatar: member.avatar || '',
                  assignmentId: member.id,
                  organizationalRole: member.role,
                  createdDate: member.createdDate,
                  updatedDate: member.updatedDate
                };
              });
              
              setLocalProjects(prev => prev.map(p => 
                p.id === project.id 
                  ? { ...p, teamMembers }
                  : p
              ));
            } else {
              setLocalProjects(prev => prev.map(p => 
                p.id === project.id 
                  ? { ...p, teamMembers: [] }
                  : p
              ));
            }
          } else {
            setLocalProjects(prev => prev.map(p => 
              p.id === project.id 
                ? { ...p, teamMembers: [] }
                : p
            ));
          }
        } catch (error) {
          console.error('❌ Error loading team members for project', project.id, ':', error);
          setLocalProjects(prev => prev.map(p => 
            p.id === project.id 
              ? { ...p, teamMembers: [] }
              : p
          ));
        }
      }
    } catch (error) {
      console.error('❌ Error loading team members:', error);
    }
  };

  const handleProjectClick = async (project: Project) => {
    console.log('🔵 Project clicked:', project.title);
    setSelectedProject(project);
    
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
      console.log('✅ Project clicked with team members, milestones, and tasks loaded');
    } catch (error) {
      console.error('❌ Error loading project data:', error);
      const projectWithEmptyData = {
        ...project,
        teamMembers: [],
        milestones: [],
        tasks: []
      };
      setSelectedProject(projectWithEmptyData);
    }
  };

  const handleEditProject = (project: Project) => {
    setEditedProject({ ...project });
    setIsEditing(true);
  };

  const handleSaveProject = async () => {
    if (!editedProject) return;
    
    try {
      console.log('💾 Saving project changes...');
      
      const priorityValue = (editedProject.priority || 'Medium');
      const capitalizedPriority = priorityValue.charAt(0).toUpperCase() + priorityValue.slice(1).toLowerCase();
      
      const statusMap: Record<string, string> = {
        'pending': 'Active',
        'pending approval': 'On Hold',
        'in progress': 'Active',
        'not started': 'Active',
        'active': 'Active',
        'on hold': 'On Hold',
        'completed': 'Completed',
        'archived': 'Archived'
      };
      const rawStatus = (editedProject.status || selectedProject?.status || 'Active').toString();
      const mappedStatus = statusMap[rawStatus.toLowerCase()] || 'Active';
      
      const updateData = {
        title: editedProject.title,
        description: editedProject.description,
        dueDate: editedProject.dueDate,
        priority: capitalizedPriority as 'High' | 'Medium' | 'Low' | 'Critical',
        projectOwner: selectedProject?.projectOwner || editedProject.createdBy || 'Unknown',
        projectOwnerEmail: selectedProject?.projectOwnerEmail || user?.email || '',
        projectOwnerPhone: (() => {
          const phoneCandidate = selectedProject?.projectOwnerPhone || user?.phone || '';
          if (!phoneCandidate) return undefined;
          const digits = phoneCandidate.toString().replace(/[^0-9+]/g, '');
          const digitOnly = digits.replace(/[^0-9]/g, '');
          if (digitOnly.length >= 7 && digitOnly.length <= 15) return digits;
          return undefined;
        })(),
        status: mappedStatus,
      };
      
      console.log('📤 Sending update request with data:', updateData);
      const updateResponse = await projectService.updateProject(Number(editedProject.id), updateData);
      console.log('📥 Update response:', updateResponse);
      
      if (!updateResponse.success) {
        console.error('❌ Project update failed:', updateResponse);
        const detailedErrors = updateResponse.errors || (updateResponse.raw && updateResponse.raw.errors) || updateResponse.raw || updateResponse;
        const friendlyMessage = updateResponse.message || 'Failed to update project (validation error)';
        alert(`${friendlyMessage}\n\nSee console for full details.`);
        return;
      }
      
      console.log('✅ Project basic info updated');
      
      if (editedProject.milestones && editedProject.milestones.length > 0) {
        console.log('💾 Saving milestones to database...');
        const { milestoneService } = await import('@/services/milestoneService');
        
        for (const milestone of editedProject.milestones) {
          try {
            console.log('💾 Processing milestone:', milestone);
            const milestoneId = Number(milestone.id);
            const isDatabaseId = milestone.id && !isNaN(milestoneId) && milestoneId < 1000000;
            
            if (isDatabaseId) {
              console.log('💾 Updating existing milestone with ID:', milestone.id);
              const updateMilestoneData = {
                milestoneId: Number(milestone.id),
                milestoneName: milestone.title,
                description: milestone.description,
                assignedMemberId: milestone.assigneeId,
                dueDate: milestone.dueDate,
                weight: milestone.weight || 1,
                status: milestone.status
              };
              
              console.log('💾 Update milestone data:', updateMilestoneData);
              const updateResponse = await milestoneService.updateMilestone(Number(milestone.id), updateMilestoneData);
              console.log('✅ Milestone updated:', milestone.title, updateResponse);
            } else {
              console.log('💾 Creating new milestone');
              
              const currentDate = new Date().toISOString().split('T')[0];
              const dueDate = milestone.dueDate || currentDate;
              const startDate = milestone.startDate || currentDate;
              
              let assignedMemberId = milestone.assigneeId;
              if (!assignedMemberId || assignedMemberId === '') {
                console.log('⚠️ Milestone has no assignee, skipping creation:', milestone.title);
                continue;
              }
              
              console.log('🔍 Debugging assignee ID:', assignedMemberId);
              const selectedMember = selectedProject?.teamMembers?.find(m => m.id === assignedMemberId);
              console.log('🔍 Selected member details:', selectedMember);
              
              if (selectedMember) {
                try {
                  const userResponse = await apiClient.get('/User');
                  if (userResponse.success && userResponse.data) {
                    const users = Array.isArray(userResponse.data) ? userResponse.data : [];
                    const fullUser = users.find((u: any) => {
                      const userEmployeeId = u.employeeId || u.id;
                      return userEmployeeId === assignedMemberId ||
                             String(userEmployeeId).toLowerCase() === String(assignedMemberId).toLowerCase();
                    });
                    
                    if (fullUser) {
                      console.log('🔄 Switching from employee ID to user UUID');
                      assignedMemberId = fullUser.id;
                    }
                  }
                } catch (userError) {
                  console.error('❌ Error fetching users for ID lookup:', userError);
                }
              }
              
              const createMilestoneData = {
                milestoneName: milestone.title || 'Untitled Milestone',
                description: milestone.description || '',
                assignedMemberId: assignedMemberId,
                dueDate: dueDate,
                startDate: startDate,
                weight: milestone.weight || 1,
                projectId: Number(editedProject.id),
                status: 'Pending' as 'Pending' | 'Planning' | 'InProgress' | 'OnHold' | 'Completed' | 'Cancelled'
              };
              
              console.log('💾 Create milestone data:', createMilestoneData);
              const createResponse = await milestoneService.createMilestone(createMilestoneData);
              console.log('✅ Milestone created:', milestone.title, createResponse);
            }
          } catch (error: unknown) {
            console.error('❌ Error saving milestone:', milestone.title, error);
          }
        }
      } else {
        console.log('💾 No milestones to save');
      }
      
      setLocalProjects(prev => prev.map(p => 
        p.id === editedProject.id ? { ...p, ...editedProject } : p
      ));
      
      setSelectedProject(editedProject);
      setIsEditing(false);
      setEditedProject(null);
      
      console.log('✅ Project updated successfully with all changes');
    } catch (error) {
      console.error('❌ Error updating project:', error);
      alert('Failed to save project changes. Please try again.');
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedProject(null);
  };

  const handleCreateMilestone = async () => {
    if (!selectedProject || !newMilestoneTitle || !newMilestoneAssignee) {
      alert('Please fill in all required fields: Title and Assignee');
      return;
    }

    if (!selectedProject.teamMembers || selectedProject.teamMembers.length === 0) {
      alert('No team members available. Please add team members to the project first.');
      return;
    }

    try {
      const formattedDate = selectedDate ? selectedDate.toISOString().split('T')[0] : newMilestoneDueDate;
      const startDate = new Date().toISOString().split('T')[0];

      if (!formattedDate) {
        alert('Please select a due date for the milestone.');
        return;
      }

      const dueDateObj = new Date(formattedDate);
      const startDateObj = new Date(startDate);
      
      if (dueDateObj < startDateObj) {
        alert('Due date cannot be earlier than start date.');
        return;
      }

      const assignedMember = selectedProject.teamMembers?.find(member => member.id === newMilestoneAssignee);
      
      if (!assignedMember) {
        alert('Selected team member not found. Please try again.');
        return;
      }

      let actualUserId = assignedMember.id;
      
      if (/^\d+$/.test(assignedMember.id)) {
        console.log('🔍 Employee ID detected, looking up actual user ID...');
        try {
          const usersResponse = await apiClient.get('/User');
          if (usersResponse.success && usersResponse.data) {
            const users = Array.isArray(usersResponse.data) ? usersResponse.data : [];
            const user = users.find((u: any) => u.employeeId === assignedMember.id);
            if (user && user.id) {
              actualUserId = user.id;
              console.log('✅ Found user ID:', actualUserId, 'for employee ID:', assignedMember.id);
            } else {
              console.error('❌ Could not find user with employee ID:', assignedMember.id);
              alert('Could not find user details. Please try again.');
              return;
            }
          }
        } catch (error) {
          console.error('❌ Error looking up user ID:', error);
          alert('Error looking up user details. Please try again.');
          return;
        }
      }

      const milestoneData = {
        milestoneName: newMilestoneTitle.trim(),
        description: newMilestoneDescription.trim() || undefined,
        assignedMemberId: actualUserId,
        projectId: selectedProject.id,
        startDate: startDate,
        dueDate: formattedDate,
        weight: Math.min(Math.max(newMilestoneWeight, 1), 100),
        status: 'Pending' as const
      };

      console.log('🎯 Sending milestone creation data to backend:', milestoneData);

      const { milestoneService } = await import('@/services/milestoneService');
      const response = await milestoneService.createMilestone(milestoneData);

      console.log('🎯 Milestone creation response:', response);

      if (response.success && response.data) {
        console.log('✅ Milestone created successfully in backend');
        
        const newMilestone: Milestone = {
          id: response.data.milestoneId?.toString() || Date.now().toString(),
          milestoneId: response.data.milestoneId || 0,
          title: response.data.milestoneName || newMilestoneTitle,
          milestoneName: response.data.milestoneName || newMilestoneTitle,
          description: response.data.description || newMilestoneDescription,
          assignee: assignedMember.name,
          assigneeId: actualUserId,
          dueDate: response.data.dueDate || formattedDate,
          priority: newMilestonePriority,
          status: (response.data.status as MilestoneStatus) || MilestoneStatus.Pending,
          progress: response.data.progress || 0,
          createdBy: 'You',
          project: selectedProject.id.toString(),
          projectId: selectedProject.id,
          weight: response.data.weight || newMilestoneWeight,
          tasks: [],
          createdAt: new Date().toISOString()
        };

        setSelectedProject(prev => {
          if (!prev) return null;
          return {
            ...prev,
            milestones: [...(prev.milestones || []), newMilestone]
          } as Project;
        });

        setLocalProjects(prev => prev.map(p =>
          p.id === selectedProject.id
            ? { 
                ...p, 
                milestones: [...(p.milestones || []), newMilestone] 
              } as Project
            : p
        ));

        setShowCreateMilestone(false);
        setNewMilestoneTitle("");
        setNewMilestoneDescription("");
        setNewMilestoneDueDate("");
        setNewMilestonePriority("Medium");
        setNewMilestoneWeight(50);
        setNewMilestoneAssignee("");
        setSelectedDate(undefined);
        setCalendarOpen(false);

        alert('Milestone created successfully!');
      } else {
        const errorMessage = response.message || 'Failed to create milestone';
        const errorDetails = response.errors && response.errors.length > 0 
          ? `\n\nValidation errors:\n${response.errors.join('\n')}`
          : '';
        
        throw new Error(`${errorMessage}${errorDetails}`);
      }

    } catch (error: any) {
      console.error('❌ Error creating milestone:', error);
      
      let userMessage = 'Failed to create milestone';
      if (error.message) {
        userMessage = error.message;
      } else if (error.response?.data?.message) {
        userMessage = error.response.data.message;
      } else if (error.response?.status) {
        userMessage = `Server error (${error.response.status}): ${error.response.statusText}`;
      }
      
      alert(`❌ ${userMessage}\n\nPlease check the console for more details.`);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedProject || !newFile) return;
    
    try {
      console.log('📎 Uploading file:', newFile.name);
      
      const formData = new FormData();
      formData.append("file", newFile);
      formData.append("entityType", "Project");
      formData.append("entityId", selectedProject.id.toString());
      formData.append("description", `Attachment for project: ${selectedProject.title}`);
      formData.append("tags", "[]");
      
      const { attachmentsService } = await import('@/services/attachmentsService');
      const uploadResult = await attachmentsService.upload(formData);
      console.log('📎 Upload result:', uploadResult);
      
      const { attachmentsService: attachmentsService2 } = await import('@/services/attachmentsService');
      const attachments = await attachmentsService2.list('Project', selectedProject.id.toString());
      console.log('📎 Fresh attachments:', attachments);
      
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
      console.log('📎 Updated selected project with new attachments');
      
      setNewFile(null);
      console.log('✅ File uploaded successfully');
    } catch (error) {
      console.error('❌ Error uploading file:', error);
      alert(`Failed to upload file: ${newFile.name}. Please try again.`);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setNewFile(file);
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!selectedProject) return;
    
    try {
      console.log('📎 Deleting attachment with ID:', attachmentId);
      
      const { attachmentsService } = await import('@/services/attachmentsService');
      await attachmentsService.delete(Number(attachmentId));
      
      const attachments = await attachmentsService.list('Project', selectedProject.id.toString());
      console.log('📎 Fresh attachments after delete:', attachments);
      
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
      console.log('📎 Updated selected project after delete');
      
      console.log('✅ Attachment deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting attachment:', error);
      alert('Failed to delete attachment. Please try again.');
    }
  };

  const handleAddTeamMember = async () => {
    if (!selectedProject || !newMemberEmail) return;
    
    try {
      const userResponse = await apiClient.get('/User');
      if (!userResponse.success || !userResponse.data) {
        throw new Error('Failed to fetch users');
      }
      const users = Array.isArray(userResponse.data) ? userResponse.data : [];
      const user = users.find((u: any) => u.email === newMemberEmail) as any;
      if (!user) {
        throw new Error('User not found with this email');
      }
      const employeeId = user.employeeId || user.id;
      const isAlreadyAssigned = selectedProject.teamMembers?.some(member => {
        const memberId = member.id;
        const memberEmail = member.email;
        return (
          memberId === employeeId ||
                     String(memberId).toLowerCase() === String(employeeId).toLowerCase() ||
          memberEmail === newMemberEmail
        );
      });
      if (isAlreadyAssigned) {
        alert('This user is already assigned to this project.');
        return;
      }
      const { projectAssignmentService } = await import('@/services/projectAssignmentService');
      const response = await projectAssignmentService.addMembers({
        projectId: selectedProject.id,
        employeeId: employeeId,
        memberRole: newMemberRole
      });
      
      const refreshTeamMembers = async (callback?: (members: any[]) => void) => {
        try {
        const teamResponse = await projectAssignmentService.getProjectMembers(selectedProject.id);
          let teamMembersData: any[] = [];
        if (teamResponse.success && teamResponse.data) {
            teamMembersData = extractTeamMembersRaw(teamResponse.data);
          }
          const mapped = teamMembersData.map((member: any) => ({
            id: member.employeeId || member.memberId || member.id,
            name: member.memberFullName || member.employeeName || member.memberName || member.name || 'Unknown User',
                role: member.memberRole || member.role || 'Member',
            department: member.memberDepartment || member.department || 'Unknown',
            email: member.memberEmail || member.email || '',
                position: member.position || member.role || 'team_member',
                avatar: member.avatar || ''
          }));
          setSelectedProject(prev => prev ? { ...prev, teamMembers: mapped } : prev);
          setLocalProjects(prev => prev.map(p => p.id === selectedProject.id ? { ...p, teamMembers: mapped } : p));
          if (callback) callback(mapped);
        } catch (err) {
          console.error('❌ Error refreshing members after add:', err);
          if (callback) callback([]);
        }
      };

      if (response.success) {
        setShowAddMember(false);
        setNewMemberEmail("");
        setNewMemberRole('Member');
        await refreshTeamMembers();
        return;
          } else {
        if (response.message && response.message.toLowerCase().includes('already assigned')) {
          alert('This user is already a team member. Team list will be refreshed.');
          setShowAddMember(false);
        setNewMemberEmail("");
        setNewMemberRole('Member');
          await refreshTeamMembers();
          return;
        }
        await refreshTeamMembers(async (finalList) => {
          const exists = finalList.some((m: any) => (m.email || '').toLowerCase() === newMemberEmail.toLowerCase());
          if (exists) {
        setShowAddMember(false);
            setNewMemberEmail("");
            setNewMemberRole('Member');
            return;
      } else {
            alert('Failed to add team member: ' + (response.message || 'Unknown error'));
          }
        });
        return;
      }
    } catch (error: any) {
      console.error('❌ Error adding team member:', error);
      alert('Failed to add team member: ' + (error.message || 'Unknown error'));
      if (selectedProject) {
        const { projectAssignmentService } = await import('@/services/projectAssignmentService');
          const teamResponse = await projectAssignmentService.getProjectMembers(selectedProject.id);
        let teamMembersData: any[] = [];
          if (teamResponse.success && teamResponse.data) {
          teamMembersData = extractTeamMembersRaw(teamResponse.data);
        }
        const mapped = teamMembersData.map((member: any) => ({
          id: member.employeeId || member.memberId || member.id,
          name: member.memberFullName || member.employeeName || member.memberName || member.name || 'Unknown User',
                  role: member.memberRole || member.role || 'Member',
          department: member.memberDepartment || member.department || 'Unknown',
          email: member.memberEmail || member.email || '',
                  position: member.position || member.role || 'team_member',
                  avatar: member.avatar || ''
        }));
        setSelectedProject(prev => prev ? { ...prev, teamMembers: mapped } : prev);
        setLocalProjects(prev => prev.map(p => p.id === selectedProject.id ? { ...p, teamMembers: mapped } : p));
      }
    }
  };

  const handleRemoveTeamMember = async (memberId: string) => {
    if (!selectedProject) return;
    
    if (!confirm('Are you sure you want to remove this team member from the project?')) {
      return;
    }
    
    try {
      const { projectAssignmentService } = await import('@/services/projectAssignmentService');
      const response = await projectAssignmentService.deleteMember({
        projectId: selectedProject.id,
        employeeId: memberId,
        memberRole: undefined,
        role: undefined
      } as any);
      
      if (response.success) {
        setSelectedProject(prev => prev ? {
          ...prev,
          teamMembers: (prev.teamMembers || []).filter(m => String(m.id) !== String(memberId))
        } : prev);
        setLocalProjects(prev => prev.map(p => 
          p.id === selectedProject.id 
            ? { ...p, teamMembers: (p.teamMembers || []).filter(m => String(m.id) !== String(memberId)) }
            : p
        ));
        const fresh = await projectAssignmentService.getProjectMembers(selectedProject.id);
        if (fresh && fresh.success) {
          const teamMembersData = extractTeamMembersRaw(fresh.data);
          const mapped = teamMembersData.map((member: any) => ({
            id: member.employeeId || member.memberId || member.id,
            name: member.memberFullName || member.employeeName || member.memberName || member.name || 'Unknown User',
            role: member.memberRole || member.role || 'Member',
            department: member.memberDepartment || member.department || 'Unknown',
            email: member.memberEmail || member.email || '',
            position: member.position || member.role || 'team_member',
            avatar: member.avatar || ''
          }));
          setSelectedProject(prev => prev ? { ...prev, teamMembers: mapped } : prev);
          setLocalProjects(prev => prev.map(p => p.id === selectedProject.id ? { ...p, teamMembers: mapped } : p));
        }
        console.log('✅ Team member removed successfully');
      }
    } catch (error) {
      console.error('❌ Error removing team member:', error);
      alert('Failed to remove team member. Please try again.');
    }
  };

  const handleDeleteMilestone = async (milestoneId: string | number) => {
    if (!selectedProject) return;
    
    if (!confirm('Are you sure you want to delete this milestone? This action cannot be undone.')) {
      return;
    }
    
    try {
      console.log('🗑️ Deleting milestone:', milestoneId);
      const { milestoneService } = await import('@/services/milestoneService');
      
      const numericId = typeof milestoneId === 'string' ? parseInt(milestoneId) : milestoneId;
      
      await milestoneService.deleteMilestone(numericId);
      
      console.log('✅ Milestone deleted from backend');
      
      setSelectedProject(prev => prev ? {
        ...prev,
        milestones: (prev.milestones || []).filter(m => 
           m.id!== milestoneId.toString()
        )
      } : null);
      
      setLocalProjects(prev => prev.map(p => 
        p.id === selectedProject.id 
          ? { 
              ...p, 
              milestones: (p.milestones || []).filter(m => 
                m.id !== milestoneId.toString()
              ) 
            }
          : p
      ));
      
      alert('Milestone deleted successfully!');
    } catch (error) {
      console.error('❌ Error deleting milestone:', error);
      alert('Failed to delete milestone. Please try again.');
    }
  };

  const handleDeleteTask = async (taskId: string | number) => {
    if (!selectedProject) return;
    
    if (!confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
      return;
    }
    
    try {
      console.log('🗑️ Deleting task:', taskId);
      const { projectTaskService } = await import('@/services/projectTaskService');
      await projectTaskService.deleteTask(Number(taskId));
      
      console.log('✅ Task deleted from backend');
      
      const tasksResponse = await projectTaskService.getTasksByProject(selectedProject.id);
      console.log('📋 Refreshed tasks after deletion:', tasksResponse);
      
      if (tasksResponse && Array.isArray(tasksResponse)) {
        const updatedTasks = tasksResponse.map((task: any) => {
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
        
        setSelectedProject(prev => prev ? { ...prev, tasks: updatedTasks } : null);
        console.log('✅ Selected project tasks updated:', updatedTasks.length);
      }
      
      await fetchProjects();
      
      alert('Task deleted successfully!');
    } catch (error) {
      console.error('❌ Error deleting task:', error);
      alert('Failed to delete task. Please try again.');
    }
  };

  const fetchAvailableUsers = async () => {
    try {
      const response = await apiClient.get('/User');
      if (response.success && response.data && Array.isArray(response.data)) {
        setAvailableUsers(response.data);
      } else {
        setAvailableUsers([]);
      }
    } catch (error) {
      console.error('❌ Error fetching users:', error);
      setAvailableUsers([]);
    }
  };

  const handleTaskCreated = async () => {
  console.log("✅ Task created, waiting for backend to commit...");
  setShowCreateTaskModal(false);
  await new Promise((resolve) => setTimeout(resolve, 500));
  console.log("🔄 Refreshing task list...");
  
  if (selectedProject) {
    try {
      const { projectTaskService } = await import('@/services/projectTaskService');
      const tasksResponse = await projectTaskService.getTasksByProject(selectedProject.id);
      
      if (tasksResponse && Array.isArray(tasksResponse)) {
        const updatedTasks = tasksResponse.map((task: any) => {
          const metadata = task.metadata || task.Metadata || {};
          return {
            id: task.value || task.Value || task.id,
            title: task.label || task.Label || task.title || 'Untitled',
            description: task.description || task.Description || '',
            assignee: metadata.assignedMemberName || '',
            assigneeId: metadata.assignedMemberId || '',
            status: metadata.status || 'Pending',
            priority: metadata.priority || 'Medium',
            dueDate: metadata.dueDate || '',
            weight: metadata.weight || 0,
            milestoneId: metadata.milestoneId?.toString() || undefined
          };
        });
        
        setSelectedProject(prev => prev ? { ...prev, tasks: updatedTasks } : null);
        console.log('✅ Tasks refreshed! New count:', updatedTasks.length);
      }
    } catch (error) {
      console.error('❌ Error refreshing tasks:', error);
    }
  }

  console.log("✅ Task creation flow completed");
};

  const handleFileDownload = async (file: any) => {
    try {
      console.log('📎 Attempting to download file:', file.name);
      console.log('📎 File data:', file);
      
      const { attachmentsService } = await import('@/services/attachmentsService');
      
      const tokenResponse = await attachmentsService.getDownloadToken(file.id);
      console.log('📎 Download token received:', tokenResponse);
      
      const fileBlob = await attachmentsService.securedDownload(file.id, tokenResponse.token);
      console.log('📎 File blob received:', fileBlob);
      
      const url = window.URL.createObjectURL(fileBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log('✅ File download completed:', file.name);
    } catch (error) {
      console.error('❌ Error downloading file:', error);
      alert(`Failed to download file: ${file.name}. Please try again.`);
    }
  };

  const columns = [
    {
      name: "Project Name",
      selector: (row: Project) => row.title,
      sortable: true,
      width: "220px",
      cell: (row: Project) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
            <span className="text-blue-600 dark:text-blue-400 font-semibold text-sm">
              {(row.title || 'P').charAt(0).toUpperCase()}
            </span>
          </div>
        <div>
            <p className="font-semibold text-gray-900 dark:text-white text-sm">{row.title}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">ID: {row.id}</p>
          </div>
        </div>
      ),
    },
    {
      name: "Description",
      selector: (row: Project) => row.description,
      sortable: true,
      width: "280px",
      cell: (row: Project) => (
        <div className="max-w-xs">
          <p className="text-sm text-gray-700 dark:text-gray-300 truncate">
            {row.description || "No description"}
          </p>
        </div>
      ),
    },
    {
      name: "Due Date",
      selector: (row: Project) => row.dueDate,
      sortable: true,
      width: "120px",
      cell: (row: Project) => (
        <div className="text-sm">
          <p className="font-medium text-gray-900 dark:text-white">{row.dueDate}</p>
        </div>
      ),
    },
    {
      name: "Priority",
      selector: (row: Project) => row.priority,
      sortable: true,
      width: "100px",
      cell: (row: Project) => (
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${
            row.priority === 'Critical'
              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              : row.priority === 'High'
              ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
              : row.priority === 'Medium'
              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
              : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
          }`}
        >
          {row.priority}
        </span>
      ),
    },
    {
      name: "Status",
      selector: (row: Project) => row.status,
      sortable: true,
      width: "180px",
      cell: (row: Project) => {
        const approvalStatus = (row as any).approvalStatus;
        const isPendingApproval = approvalStatus === 'Pending';
        const isRejected = approvalStatus === 'Rejected';
        
        return (
          <div className="flex flex-col gap-1">
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                row.status === 'Completed'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : row.status === 'In Progress'
                  ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                  : row.status === 'Active'
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                  : row.status === 'On Hold'
              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
              : row.status === 'Pending Approval'
              ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
              : row.status === 'Not Started'
              ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
              : row.status === 'Archived'
              ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
          }`}
            >
              {row.status}
            </span>
            {isPendingApproval && (
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300">
                ⏳ Awaiting Approval
              </span>
            )}
            {isRejected && (
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300">
                ❌ Rejected
              </span>
            )}
          </div>
        );
      },
    },
    {
      name: "Progress",
      selector: (row: Project) => row.progress || 0,
      sortable: true,
      width: "140px",
      cell: (row: Project) => (
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                (row.progress || 0) < 30 
                  ? 'bg-red-500' 
                  : (row.progress || 0) < 70 
                  ? 'bg-yellow-500' 
                  : 'bg-green-500'
              }`}
              style={{ width: `${row.progress || 0}%` }}
            />
          </div>
          <span className="text-sm font-semibold text-gray-900 dark:text-white min-w-[35px]">
            {row.progress || 0}%
          </span>
        </div>
      ),
    },
    {
      name: "Attachments",
      selector: (row: Project) => row.files?.length || 0,
      sortable: true,
      width: "120px",
      cell: (row: Project) => (
        <div className="flex items-center gap-2">
          <div className="flex -space-x-1">
            {row.files?.slice(0, 3).map((file, index) => (
              <div
                key={index}
                className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-800"
                title={file.name}
              >
                <Paperclip className="w-3 h-3 text-blue-600 dark:text-blue-400" />
              </div>
            ))}
            {(row.files?.length || 0) > 3 && (
              <div className="w-6 h-6 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-800">
                <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                  +{(row.files?.length || 0) - 3}
            </span>
          </div>
            )}
          </div>
          {(row.files?.length || 0) > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                console.log('Download attachments for project:', row.id);
              }}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 text-xs font-medium"
            >
              Download
            </button>
          )}
        </div>
      ),
    },
  ];

  const customStyles = {
    headRow: {
      style: {
        backgroundColor: darkMode ? "#1f2937" : "#ffffff",
        color: darkMode ? "#f9fafb" : "#374151",
        borderBottom: `2px solid ${darkMode ? "#374151" : "#e5e7eb"}`,
        minHeight: "60px",
      },
    },
    headCells: {
      style: {
        fontSize: "12px",
        fontWeight: "700",
        textTransform: "uppercase" as const,
        letterSpacing: "0.05em",
        paddingLeft: "16px",
        paddingRight: "16px",
        color: darkMode ? "#9ca3af" : "#6b7280",
      },
    },
    cells: {
      style: {
        fontSize: "14px",
        paddingLeft: "16px",
        paddingRight: "16px",
        paddingTop: "12px",
        paddingBottom: "12px",
        borderBottom: `1px solid ${darkMode ? "#374151" : "#f3f4f6"}`,
      },
    },
    rows: {
      style: {
        backgroundColor: darkMode ? "#111827" : "#ffffff",
        "&:hover": {
          backgroundColor: darkMode ? "#1f2937" : "#f9fafb",
        },
        minHeight: "70px",
      },
    },
    table: {
      style: {
        backgroundColor: darkMode ? "#111827" : "#ffffff",
        borderRadius: "8px",
        overflow: "hidden",
        boxShadow: darkMode 
          ? "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
          : "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
      },
    },
  };

  const filteredProjects = useMemo(() => {
    if (!searchText) return localProjects;
    
    return localProjects.filter(project =>
      (project.title || "").toLowerCase().includes((searchText || "").toLowerCase()) ||
      (project.description || "").toLowerCase().includes((searchText || "").toLowerCase()) ||
      project.teamMembers?.some(member => 
        (member.name || "").toLowerCase().includes((searchText || "").toLowerCase())
      )
    );
  }, [localProjects, searchText]);

  return (
    <div className={`max-w-8xl mx-auto ${darkMode ? "bg-gray-900 text-white" : "bg-white text-gray-900"}`}>
      <div>
        {selectedProject ? (
        // Show Project Detail View when a project is selected
        <ProjectDetailView
          project={toCommonProject(selectedProject)}
          darkMode={darkMode}
          isEditing={isEditing}
          editedProject={editedProject ? toCommonProject(editedProject) : undefined}
          onEditProject={() => setIsEditing(true)}
          onSaveProject={handleSaveProject}
          onCancelEdit={handleCancelEdit}
          onChangeEditedProject={(p) => setEditedProject(p as any)}
          showEditFeatures={true}
          onAddTask={() => setShowCreateTaskModal(true)}
          onAddMilestone={() => setShowCreateMilestone(true)}
          tasks={(selectedProject.tasks || []).map(toCommonTask)}
          milestones={(selectedProject.milestones || []).map(toCommonMilestone)}
          onTaskClick={(task) => {
            console.log('Task clicked:', task);
          }}
          onMilestoneClick={(milestone) => {
            console.log('Milestone clicked:', milestone);
          }}
          formatFileSize={formatFileSize}
          canCreateTasks={true}
          showMilestones={true}
          onBack={() => setSelectedProject(null)}
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
          <div className="flex justify-between items-center mb-4">
            
             {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className={`w-auto pl-10 pr-4 py-2 border rounded-lg ${
                  darkMode
                    ? "bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                    : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                }`}
              />
            </div>
          </div>
          <div className="flex gap-3">
              <button
                onClick={() => {
                  const userRole = user?.role?.toLowerCase() || 'member';
                  const roleRoute = userRole === 'vice_president' ? 'vice-president' : userRole;
                  navigate(`/dashboard/${roleRoute}/projects/new/1`);
                }}
                className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                  darkMode
                    ? "bg-gray-900 hover:bg-gray-700 text-white"
                    : "bg-purple-900 hover:bg-purple-800 text-white"
                }`}
              >
                Create New Project
              </button>
            </div>

          </div>

        {/* Projects Table */}
          <div className={`rounded-lg ${darkMode ? "bg-gray-800" : "bg-white"} shadow-sm`}> 
            <DataTable
              columns={columns}
              data={filteredProjects}
              pagination
              paginationPerPage={10}
              paginationRowsPerPageOptions={[5, 10, 15, 20]}
              customStyles={customStyles}
              onRowClicked={handleProjectClick}
              highlightOnHover
              pointerOnHover
            />
          </div>
        </div>
      )}

      {/* Add Team Member Modal */}
      {showAddMember && (
        <Dialog open={showAddMember} onOpenChange={setShowAddMember}>
          <DialogContent className={`max-w-auto ${darkMode ? "bg-gray-900 text-white" : "bg-white text-gray-900"}`}>
            <DialogHeader className="border-b pb-4">
              <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">
                Add Team Member
              </DialogTitle>
              <DialogDescription className="text-gray-600 dark:text-gray-400">
                Add a new team member to this project
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="member-email" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Team Member
                </Label>
                <Select value={newMemberEmail} onValueChange={setNewMemberEmail}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select a team member" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableUsers.map((user) => (
                      <SelectItem key={user.id} value={user.email}>
                        {user.name} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="member-role" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Role
                </Label>
                <Select value={newMemberRole} onValueChange={(value: 'Member' | 'Team Leader' | 'Scrum Master') => setNewMemberRole(value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Member">Member</SelectItem>
                    <SelectItem value="Team Leader">Team Leader</SelectItem>
                    <SelectItem value="Scrum Master">Scrum Master</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setShowAddMember(false)}
                className="px-6"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddTeamMember}
                disabled={!newMemberEmail}
                className="px-6 bg-blue-600 hover:bg-blue-700 text-white"
              >
                Add Member
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Create Milestone Modal */}
      {showCreateMilestone && (
        <Dialog open={showCreateMilestone} onOpenChange={setShowCreateMilestone}>
          <DialogContent className={`max-w-2xl ${darkMode ? "bg-gray-900 text-white" : "bg-white text-gray-900"}`}>
            <DialogHeader className="border-b pb-4">
              <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                Create New Milestone
              </DialogTitle>
              <DialogDescription className="text-gray-600 dark:text-gray-400">
                Add a new milestone to track and organize your project progress
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="milestone-title" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Milestone Title *
                  </Label>
                  <Input
                    id="milestone-title"
                    value={newMilestoneTitle}
                    onChange={(e) => setNewMilestoneTitle(e.target.value)}
                    placeholder="Enter milestone title"
                    className="mt-1"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="milestone-description" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Description
                  </Label>
                  <Textarea
                    id="milestone-description"
                    value={newMilestoneDescription}
                    onChange={(e) => setNewMilestoneDescription(e.target.value)}
                    placeholder="Describe what needs to be accomplished in this milestone"
                    className="mt-1 min-h-[100px]"
                  />
                </div>

                <div>
                  <Label htmlFor="milestone-due-date" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Due Date
                  </Label>
                  <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="mt-1 w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? selectedDate.toLocaleDateString() : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => {
                          setSelectedDate(date);
                          if (date) {
                            setNewMilestoneDueDate(date.toISOString().split('T')[0]);
                          }
                          setCalendarOpen(false);
                        }}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="milestone-weight" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Weight (1-100) - Importance/Progress Impact
                  </Label>
                  <div className="space-y-2 mt-1">
                    <input
                      type="range"
                      id="milestone-weight"
                      min="1"
                      max="100"
                      value={newMilestoneWeight}
                      onChange={(e) => setNewMilestoneWeight(Number(e.target.value))}
                      className="w-full accent-blue-600"
                    />
                    <div className="flex justify-between items-center">
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={newMilestoneWeight}
                        onChange={(e) => {
                          const value = Math.min(100, Math.max(1, Number(e.target.value) || 1));
                          setNewMilestoneWeight(value);
                        }}
                        className={`w-20 p-2 rounded-lg border text-center ${darkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'}`}
                      />
                      <span className="text-sm font-medium">
                        {newMilestoneWeight < 33 ? '🟢 Low Impact' : newMilestoneWeight < 67 ? '🟡 Medium Impact' : '🔴 High Impact'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="milestone-assignee" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Assignee
                  </Label>
                  <Select value={newMilestoneAssignee} onValueChange={setNewMilestoneAssignee}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select a team member" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedProject?.teamMembers && selectedProject.teamMembers.length > 0 ? (
                        selectedProject.teamMembers.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                                {(member.name || 'U').charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-medium">{member.name}</div>
                                <div className="text-xs text-gray-500">{member.role}</div>
                              </div>
                            </div>
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="" disabled>
                          No team members available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setShowCreateMilestone(false)}
                className="px-6"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateMilestone}
                disabled={!newMilestoneTitle || !newMilestoneAssignee}
                className="px-6 bg-blue-600 hover:bg-blue-700 text-white"
              >
                Create Milestone
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Create Task Modal */}
      {selectedProject && showCreateTaskModal && (
        <CreateTaskModal
          open={showCreateTaskModal}
          onClose={() => setShowCreateTaskModal(false)}
          onCreate={handleTaskCreated}
          initialProjectId={selectedProject.id.toString()}
          projects={localProjects.map(p => ({
            id: p.id.toString(),
            name: p.title,
            members: (p.teamMembers || []).map(m => ({
              id: m.id.toString(),
              name: m.name || 'Unknown',
              role: m.role || 'Member',
              projectId: [p.id.toString()]
            }))
          }))}
          allMembers={(selectedProject.teamMembers || []).map(m => ({
            id: m.id.toString(),
            name: m.name || 'Unknown',
            role: m.role || 'Member',
            projectId: [selectedProject.id.toString()]
          }))}
          darkMode={darkMode}
        />
      )}
      <Outlet />
        
      </div>
    </div>
  );
};

export default MyProjects;