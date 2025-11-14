// src/pages/ProjectDetailPage.tsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import ProjectDetailView from './ProjectDetailView';
import { projectService } from '@/services/projectService';
import { projectTaskService } from '@/services/projectTaskService';
import { apiClient, ApiResponse } from '@/lib/api';

// Helper function to extract team members
function extractTeamMembersRaw(raw: any): any[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'object') {
    if (Array.isArray(raw.data)) return raw.data;
    if (Array.isArray(raw.members)) return raw.members;
  }
  return [];
}

const ProjectDetailPage = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [project, setProject] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (projectId) {
      fetchProjectData();
    }
  }, [projectId]);

  const loadTeamMembers = async (projectId: number) => {
    try {
      console.log('👥 Loading team members for project:', projectId);
      const { projectAssignmentService } = await import('@/services/projectAssignmentService');
      
      // Load users for member lookup
      const usersResponse = await apiClient.get('/User');
      const allUsers = Array.isArray(usersResponse.data) ? usersResponse.data : [];
      console.log('👤 Users loaded:', allUsers.length);
      
      const teamResponse = await projectAssignmentService.getProjectMembers(projectId);
      console.log('👥 Team response:', teamResponse);
      
      let teamMembers: any[] = [];
      
      if (teamResponse.success && teamResponse.data) {
        let teamMembersData: any = teamResponse.data;
        teamMembersData = extractTeamMembersRaw(teamMembersData);
        console.log('👥 Extracted team members data:', teamMembersData);
        
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
            } else if (member.memberFullName) {
              displayName = member.memberFullName;
            } else if (member.employeeName) {
              displayName = member.employeeName;
            } else if (member.memberName) {
              displayName = member.memberName;
            } else if (member.name) {
              displayName = member.name;
            }
            
            return {
              id: memberEmployeeId,
              name: displayName,
              role: member.memberRole || member.role || 'Member',
              department: member.department || 'Unknown',
              email: member.email || '',
              position: member.position || member.role || 'team_member'
            };
          });
          console.log('👥 Final team members:', teamMembers);
        }
      }
      
      return teamMembers;
    } catch (error) {
      console.error('❌ Error loading team members:', error);
      return [];
    }
  };

  const fetchProjectData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Starting data fetch for project ID:', projectId);
      
      // 1. Fetch basic project details using direct API call first
      console.log('📡 Making direct API call to project endpoint...');
      
      const response = await fetch(`http://localhost:8080/api/Project/${projectId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📡 Direct fetch response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const rawResponse = await response.json();
      console.log('📡 Raw API response:', rawResponse);
      
      // Extract project data based on common response structures
      let projectData = rawResponse;
      
      // Handle different response structures
      if (rawResponse.data) {
        projectData = rawResponse.data; // If response has data property
      }
      if (rawResponse.project) {
        projectData = rawResponse.project; // If response has project property  
      }
      
      console.log('✅ Extracted project data:', projectData);
      console.log('🔍 Project data keys:', Object.keys(projectData));
      
      // 2. Load team members
      const teamMembers = await loadTeamMembers(Number(projectId));
      
      // Transform to CommonProject format
      const commonProject = {
        id: projectData.id || projectData._id || projectId,
        title: projectData.title || projectData.projectName || projectData.name || 'Untitled Project',
        description: projectData.description || '',
        dueDate: projectData.dueDate || projectData.endDate || '',
        priority: (projectData.priority === 'Critical' ? 'Urgent' : 
                  projectData.priority === 'High' ? 'High' :
                  projectData.priority === 'Medium' ? 'Medium' :
                  projectData.priority === 'Low' ? 'Low' : 'Medium'),
        status: (projectData.status === 'Pending Approval' ? 'To Do' :
                projectData.status === 'Active' || projectData.status === 'In Progress' ? 'In Progress' :
                projectData.status === 'Completed' ? 'Done' :
                projectData.status === 'Rejected' ? 'Rejected' : 'To Do'),
        progress: projectData.progress || 0,
        files: projectData.files || [],
        teamLeader: projectData.teamLeader,
        scrumMaster: projectData.scrumMaster,
        teamMembers: teamMembers, // Use the loaded team members
        createdBy: projectData.createdBy || projectData.projectOwner || 'Unknown',
        startDate: projectData.startDate,
        assignedBy: projectData.assignedBy,
        assignedTo: projectData.assignedTo
      };
      
      console.log('🎯 Final transformed project:', commonProject);
      setProject(commonProject);

      // 3. Load tasks
      try {
        console.log('📋 Loading tasks...');
        const tasksResponse = await projectTaskService.getTasksByProject(Number(projectId));
        console.log('📋 Tasks response:', tasksResponse);
        
        if (tasksResponse && Array.isArray(tasksResponse)) {
          const transformedTasks = tasksResponse.map((task: any) => ({
            id: task.id?.toString() || task.projectTaskId?.toString() || Math.random().toString(),
            title: task.title || task.label || 'Untitled Task',
            description: task.description || '',
            priority: (task.priority === 'Critical' ? 'Urgent' : 
                      task.priority === 'High' ? 'High' :
                      task.priority === 'Medium' ? 'Medium' :
                      task.priority === 'Low' ? 'Low' : 'Medium'),
            assignee: task.assignee || task.assignedMemberName || '',
            status: (task.status === 'Pending' ? 'To Do' :
                    task.status === 'InProgress' ? 'In Progress' :
                    task.status === 'Completed' ? 'Done' :
                    task.status === 'Accepted' ? 'Confirm' : 'To Do'),
            dueDate: task.dueDate || '',
            weight: task.weight || 0
          }));
          setTasks(transformedTasks);
          console.log('✅ Tasks loaded:', transformedTasks.length);
        }
      } catch (taskError) {
        console.error('❌ Error loading tasks:', taskError);
        setTasks([]);
      }

      // 4. Load milestones
      try {
        console.log('🎯 Loading milestones...');
        const { milestoneService } = await import('@/services/milestoneService');
        const milestonesResponse = await milestoneService.getMilestonesByProjectId(Number(projectId));
        console.log('🎯 Milestones response:', milestonesResponse);
        
        if (milestonesResponse.success && milestonesResponse.data) {
          const milestonesData = Array.isArray(milestonesResponse.data) ? milestonesResponse.data : [];
          const transformedMilestones = milestonesData.map((milestone: any) => ({
            id: milestone.milestoneId?.toString() || milestone.id?.toString(),
            title: milestone.milestoneName || milestone.title || 'Untitled Milestone',
            description: milestone.description || '',
            priority: milestone.priority || 'Medium',
            assignee: milestone.assignedMemberName || milestone.assignee || '',
            status: milestone.status || 'Pending',
            dueDate: milestone.dueDate || '',
            weight: milestone.weight || 0
          }));
          setMilestones(transformedMilestones);
          console.log('✅ Milestones loaded:', transformedMilestones.length);
        }
      } catch (milestoneError) {
        console.error('❌ Error loading milestones:', milestoneError);
        setMilestones([]);
      }

      console.log('✅ Data fetch completed successfully');

    } catch (error) {
      console.error('💥 Error fetching project data:', error);
      setError('Failed to load project details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleTaskClick = (task: any) => {
    console.log('Task clicked:', task);
  };

  const handleMilestoneClick = (milestone: any) => {
    console.log('Milestone clicked:', milestone);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Empty handlers for view-only mode
  const emptyHandler = () => {
    console.log('This action is not available in view mode');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading project details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Project</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={handleBack}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Project Not Found</h2>
          <button 
            onClick={handleBack}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <ProjectDetailView
      project={project}
      darkMode={false}
      onBack={handleBack}
      showEditFeatures={false}
      isEditing={false}
      editedProject={project}
      onEditProject={emptyHandler}
      onSaveProject={emptyHandler}
      onCancelEdit={emptyHandler}
      onChangeEditedProject={emptyHandler}
      onAddTask={emptyHandler}
      onAddMilestone={emptyHandler}
      tasks={tasks}
      milestones={milestones}
      onTaskClick={handleTaskClick}
      onMilestoneClick={handleMilestoneClick}
      formatFileSize={formatFileSize}
      canCreateTasks={false}
      showMilestones={true}
      onAddAttachment={emptyHandler}
      onDeleteAttachment={emptyHandler}
      onAddTeamMember={emptyHandler}
      onRemoveTeamMember={emptyHandler}
      onDeleteMilestone={emptyHandler}
      onDeleteTask={emptyHandler}
      onFileUpload={emptyHandler}
    />
  );
};

export default ProjectDetailPage;