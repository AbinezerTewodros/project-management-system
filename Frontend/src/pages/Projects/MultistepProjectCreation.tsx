import { useEffect, useState, useCallback } from "react";
import { ArrowLeft, Crown } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import { Project, Employee, Milestone, Task } from "@/types/types";
import CreateProject from "./CreateProject";
import { useAuth } from '@/context/AuthContext';
import { projectService } from '@/services';


const getTodayDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const MultistepProjectCreation = ({ darkMode, onProjectCreated }: { darkMode: boolean, onProjectCreated: (project: Project) => void}) => {

  const { step } = useParams<{ step: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth(); // Get the real authenticated user
  const [formStep, setFormStep] = useState(1);
  const [newProjectTitle, setNewProjectTitle] = useState("");
  const [newProjectDescription, setNewProjectDescription] = useState("");
  const [newProjectDueDate, setNewProjectDueDate] = useState("");
  const [newProjectPriority, setNewProjectPriority] = useState<'High' | 'Medium' | 'Low'>("Medium");
  const [newProjectFiles] = useState<File[]>([]);
  const [selectedTeamMembers, setSelectedTeamMembers] = useState<Employee[]>([]);
  const [selectedScrumMasters, setSelectedScrumMasters] = useState<Employee[]>([]); // ✅ Changed to array
  const [selectedTeamLeaders, setSelectedTeamLeaders] = useState<Employee[]>([]); // ✅ Changed to array
  const [newMilestoneTitle, setNewMilestoneTitle] = useState("");
  const [newMilestoneDescription, setNewMilestoneDescription] = useState("");
  const [newMilestoneDueDate, setNewMilestoneDueDate] = useState("");
  const [newMilestonePriority, setNewMilestonePriority] = useState<'High' | 'Medium' | 'Low'>("Medium");
  const [newMilestoneWeight, setNewMilestoneWeight] = useState<number>(50); // ✅ NEW: Weight field (0-100)
  const [newMilestoneAssignee, setNewMilestoneAssignee] = useState("");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<'Low' | 'Medium' | 'High'>("Medium");
  const [newTaskAssignee, setNewTaskAssignee] = useState("");
  const [newTaskMilestone, setNewTaskMilestone] = useState<string | "">("");
  const [newTaskWeight, setNewTaskWeight] = useState<number>(50); // ✅ NEW: Task weight (default 50)
  const [newTaskAutoCreateTodo, setNewTaskAutoCreateTodo] = useState<boolean>(true); // ✅ NEW: Auto-create TodoItem
  const [tempProject, setTempProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize tempProject when component mounts or when form data changes
  useEffect(() => {
    if (newProjectTitle && (selectedTeamMembers.length > 0 || selectedScrumMasters.length > 0 || selectedTeamLeaders.length > 0)) {
      setTempProject(prev => {
        if (!prev) {
          return {
            id: 0, // Will be set by backend
            title: newProjectTitle,
            description: newProjectDescription,
            dueDate: newProjectDueDate,
            createdBy: currentUser?.name || currentUser?.username || 'Unknown User',
            teamMembers: selectedTeamMembers,
            scrumMaster: selectedScrumMasters[0] || null, // ✅ Use first Scrum Master for backward compatibility
            teamLeader: selectedTeamLeaders[0] || null, // ✅ Use first Team Leader for backward compatibility
            priority: newProjectPriority,
            status: "Active" as const,
            progress: 0,
            files: newProjectFiles.map((file, index) => ({
              id: index, // Temporary ID until backend assigns one
              name: file.name,
              size: file.size,
              type: file.type,
              url: URL.createObjectURL(file)
            })),
            milestones: [],
            tasks: []
          };
        }
        return prev;
      });
    }
  }, [newProjectTitle, selectedTeamMembers, selectedScrumMasters, selectedTeamLeaders, newProjectDescription, newProjectDueDate, newProjectPriority, newProjectFiles, currentUser]);

  const minDate = getTodayDate();

  const handleProjectCreated = (project: Project) => {
    setTempProject(project);
    navigateToStep(2); // Move to tasks & milestones step
  };

  // Note: Employee selection is now handled by the CreateProject component
  // These legacy functions are kept here for reference but are no longer used

  // Handle milestone creation
  const handleCreateMilestone = () => {
    if (!newMilestoneTitle.trim() || !newMilestoneAssignee) return;

    // Search for assignee in all team members (scrum master, team leader, and team members)
    let assignee = selectedTeamMembers.find(member => member.id === newMilestoneAssignee);
    if (!assignee) {
      // Check all Scrum Masters
      assignee = selectedScrumMasters.find(sm => sm.id === newMilestoneAssignee);
    }
    if (!assignee) {
      // Check all Team Leaders
      assignee = selectedTeamLeaders.find(tl => tl.id === newMilestoneAssignee);
    }

    const newMilestone: Milestone = {
      id: `milestone${Date.now()}`,
      title: newMilestoneTitle,
      description: newMilestoneDescription,
      assignee: assignee?.name || "",
      assigneeId: newMilestoneAssignee,
      status: "Pending",
      priority: newMilestonePriority,
      dueDate: newMilestoneDueDate,
      weight: newMilestoneWeight, // ✅ Use user-selected weight
      tasks: []
    };

    setTempProject(prev => {
      if (!prev) {
        // Create a new project with this milestone
        const newProject: Project = {
          id: 0, // Will be set by backend
          title: newProjectTitle,
          description: newProjectDescription,
          dueDate: newProjectDueDate,
          createdBy: currentUser?.name || currentUser?.username || 'Unknown User',
          teamMembers: selectedTeamMembers,
          scrumMaster: selectedScrumMasters[0] || null,
          teamLeader: selectedTeamLeaders[0] || null,
          priority: newProjectPriority,
          status: "Active" as const,
          progress: 0,
          files: newProjectFiles.map((file, index) => ({
            id: index, // Temporary ID until backend assigns one
            name: file.name,
            size: file.size,
            type: file.type,
            url: URL.createObjectURL(file)
          })),
          milestones: [newMilestone],
          tasks: []
        };
        return newProject;
      } else {
        // Add milestone to existing temp project
        return {
          ...prev,
          milestones: [...(prev.milestones || []), newMilestone]
        };
      }
    });

    setNewMilestoneTitle("");
    setNewMilestoneDescription("");
    setNewMilestoneDueDate("");
    setNewMilestonePriority("Medium");
    setNewMilestoneWeight(50); // ✅ Reset weight to default
    setNewMilestoneAssignee("");
  };

  // Handle task creation
  const handleCreateTask = () => {
    console.log('🔄 handleCreateTask called');
    console.log('- newTaskTitle:', newTaskTitle);
    console.log('- newTaskAssignee:', newTaskAssignee);
    console.log('- selectedTeamMembers:', selectedTeamMembers.length);
    console.log('- selectedScrumMasters:', selectedScrumMasters.length);
    console.log('- selectedTeamLeaders:', selectedTeamLeaders.length);
    
    if (!newTaskTitle.trim() || !newTaskAssignee) {
      console.log('❌ Task creation cancelled - missing title or assignee');
      return;
    }

    // ✅ FIX: Search for assignee in ALL member arrays (team members, scrum masters, team leaders)
    const assignee = selectedTeamMembers.find(member => member.id === newTaskAssignee) ||
                    selectedScrumMasters.find(sm => sm.id === newTaskAssignee) ||
                    selectedTeamLeaders.find(tl => tl.id === newTaskAssignee);
    
    console.log('✅ Found assignee:', assignee?.name);

    const newTask: Task = {
      id: `task${Date.now()}`,
      title: newTaskTitle,
      description: newTaskDescription,
      assignee: assignee?.name || "",
      assigneeId: newTaskAssignee,
      status: "Pending",
      priority: newTaskPriority,
      dueDate: newTaskDueDate,
      weight: newTaskWeight, // ✅ NEW: Include weight
      ...(newTaskMilestone && { milestoneId: newTaskMilestone }), // ✅ NEW: Include milestone if selected
      // Note: isAutoCreateTodo will be used when creating task via API (not stored in temp state)
    };
    
    console.log('📋 Created task object:', newTask);

    setTempProject(prev => {
      if (!prev) {
        // Create a new project with this task
        const newProject: Project = {
          id: 0, // Will be set by backend
          title: newProjectTitle,
          description: newProjectDescription,
          dueDate: newProjectDueDate,
          createdBy: currentUser?.name || currentUser?.username || 'Unknown User',
          teamMembers: selectedTeamMembers,
          scrumMaster: selectedScrumMasters[0] || null,
          teamLeader: selectedTeamLeaders[0] || null,
          priority: newProjectPriority,
          status: "Active" as const,
          progress: 0,
          files: newProjectFiles.map((file, index) => ({
            id: index, // Temporary ID until backend assigns one
            name: file.name,
            size: file.size,
            type: file.type,
            url: URL.createObjectURL(file)
          })),
          milestones: [],
          tasks: [newTask]
        };
        return newProject;
      } else {
        if (newTaskMilestone) {
          const updatedMilestones = prev.milestones?.map(milestone =>
            milestone.id === newTaskMilestone
              ? { ...milestone, tasks: [...(milestone.tasks || []), newTask] }
              : milestone
          ) || [];

          return {
            ...prev,
            milestones: updatedMilestones
          };
        } else {
          // Add as standalone task
          return {
            ...prev,
            tasks: [...(prev.tasks || []), newTask]
          };
        }
      }
    });

    console.log('✅ Task added to tempProject');
    console.log('📊 TempProject now has tasks:', tempProject?.tasks?.length || 0, '→', (tempProject?.tasks?.length || 0) + 1);

    setNewTaskTitle("");
    setNewTaskDescription("");
    setNewTaskDueDate("");
    setNewTaskPriority("Medium");
    setNewTaskAssignee("");
    setNewTaskMilestone(""); // Reset milestone assignment
    setNewTaskWeight(50); // ✅ Reset weight to default
    setNewTaskAutoCreateTodo(true); // ✅ Reset auto-create to default
    
    console.log('🧹 Form fields reset');
  };

  // Handle project creation with API integration
  const handleCreateProject = async () => {
    if (!newProjectTitle.trim()) return;

    // Check if user is authenticated
    if (!currentUser) {
      console.error('❌ No authenticated user found');
      setError('You must be logged in to create a project');
      return;
    }

    // Validate that we have at least one Scrum Master selected
    
    // ✅ FIXED: No Scrum Master validation needed - backend auto-assigns creator if none selected
    if (selectedScrumMasters.length === 0) {
      console.log('ℹ️ No Scrum Master selected - Creator will be auto-assigned as Scrum Master');
    } else {
      console.log('✅ Scrum Master(s) selected:', selectedScrumMasters.map(sm => sm.name).join(', '));
    }

    // ✅ All authenticated users can create projects (role restrictions handled by backend)
    console.log('✅ User has permission to create project');

    setIsLoading(true);
    setError(null);

    // Create project object (no mock data - will be created by backend)
    const newProject: Project = {
      id: 0, // Will be set by backend
      title: newProjectTitle,
      description: newProjectDescription,
      dueDate: newProjectDueDate,
      createdBy: currentUser?.name || currentUser?.username || 'Unknown User',
      teamMembers: selectedTeamMembers,
      scrumMaster: selectedScrumMasters[0] || null, // ✅ Use first Scrum Master
      teamLeader: selectedTeamLeaders[0] || null, // ✅ Use first Team Leader
      priority: newProjectPriority,
      status: "Active" as const,
      progress: 0,
      files: newProjectFiles.map((file, index) => ({
        id: index, // Temporary ID until backend assigns one
        name: file.name,
        size: file.size,
        type: file.type,
        url: URL.createObjectURL(file)
      })),
      milestones: tempProject?.milestones || [],
      tasks: tempProject?.tasks || []
    };

    // 🔧 FIXED: Ensure all required fields are always present
    // ✅ Use Scrum Master as the project owner (as per user requirement)
    const createProjectRequest = {
      title: newProject.title,
      description: newProject.description,
      priority: newProject.priority as 'Low' | 'Medium' | 'High' | 'Critical',
      dueDate: new Date(newProject.dueDate).toISOString(), // Convert to ISO format
      // Required fields - always include with fallbacks
      // ✅ FIX: Project owner should be the first/primary Scrum Master's name
      projectOwner: selectedScrumMasters[0]?.name || currentUser?.fullName || currentUser?.name || currentUser?.username || 'Unknown',
      projectOwnerEmail: selectedScrumMasters[0]?.email || currentUser?.email || '',
      projectOwnerPhone: selectedScrumMasters[0]?.phone || currentUser?.phone || '+1234567890', // Required field with fallback
      department: selectedScrumMasters[0]?.department || currentUser?.department || 'General',
      status: 'Active' // Required field - Valid values: "Active" | "On Hold" | "Completed" | "Archived"
    };

    // Include assigned employee info so backend can set initial assignment
    if (selectedScrumMasters.length > 0) {
      (createProjectRequest as any).assignedEmployeeId = selectedScrumMasters[0].employeeId || selectedScrumMasters[0].id;
      (createProjectRequest as any).assignedRole = 'ScrumMaster';
    }

    
    
    // 🔍 DATE FORMAT CHECK
    if (newProject.dueDate) {
      const dateObj = new Date(newProject.dueDate);
      console.log('- Due Date as Date object:', dateObj);
      console.log('- Due Date ISO string:', dateObj.toISOString());
      console.log('- Due Date is valid:', !isNaN(dateObj.getTime()));
    }

    try {
      const response = await projectService.createProject(createProjectRequest);

      if (!response || !response.success || !response.data) {
        console.error('❌ Project creation API returned error:', response);
        const serverMessage = (response && (response.message || response.raw?.message)) || 'Project creation failed';
        setError(serverMessage);
        // show more detailed info in console
        console.error('📊 Response details:', response);
        throw response;
      }

      const backendApiResponse = response.data as any; // Backend's ApiResponse wrapper
      const createdProject = backendApiResponse?.data || response.data; // Try nested data first, fallback
      // Get project ID - backend uses "Id" (capital I) not "id"
      const projectId = createdProject?.Id || createdProject?.id || createdProject?.projectId;
      
      console.log('🔍 Extracted project ID:', projectId);
      console.log('🔍 Project ID type:', typeof projectId);
      
      // Validate that we have a valid project ID
      if (!projectId) {
        console.error('❌ CRITICAL ERROR: No project ID found in response');
        console.error('❌ Response data:', createdProject);
        console.error('❌ Response.data structure:', backendApiResponse);
        console.error('❌ Tried fields: Id, id, projectId');
        throw new Error('Project was created but no ID was returned from the server');
      }
      
      // Use the created project directly from backend (it already has the correct structure)
      // Merge backend data with local data, ensuring ID is a number
      const backendData = createdProject && typeof createdProject === 'object' ? createdProject : {};
      const integratedProject: Project = {
        ...newProject,
        ...backendData,
        id: Number(projectId) // Ensure it's a number (override any string IDs)
      };
      console.log('✅ Step 2 SUCCESS: Project created successfully with ID:', projectId);
      
      // Assign team members to the project
      console.log('🚀 Step 3: Starting team member assignments...');
      console.log('👥 Selected Scrum Masters:', selectedScrumMasters.length);
      console.log('👥 Selected Team Leaders:', selectedTeamLeaders.length);
      console.log('👥 Selected Team Members:', selectedTeamMembers.length);
      
      // Import the project assignment service
      const { projectAssignmentService } = await import('@/services/projectAssignmentService');
      
      // ✅ Assign ALL Scrum Masters (supports multiple!)
      if (selectedScrumMasters.length > 0) {
        console.log('🚀 Step 3a: Assigning Scrum Masters...');
      for (const scrumMaster of selectedScrumMasters) {
        try {
          console.log('👥 Assigning Scrum Master:', scrumMaster.name, scrumMaster.id);
          console.log('🔍 Scrum Master employeeId:', scrumMaster.employeeId);
          console.log('🔍 Scrum Master role:', scrumMaster.role);
          console.log('🔍 Scrum Master department:', scrumMaster.department);
          
          const scrumMasterData = {
            projectId: Number(projectId),
            employeeId: scrumMaster.employeeId || scrumMaster.id,
            memberRole: 'Scrum Master',
            role: scrumMaster.role || 'member'
          };
          console.log('👥 Scrum Master assignment data:', JSON.stringify(scrumMasterData, null, 2));
          const scrumMasterResponse = await projectAssignmentService.addMembers(scrumMasterData);
          console.log('✅ Scrum Master assigned:', scrumMasterResponse);
        } catch (error) {
            console.error('❌ ERROR in Step 3a: Failed to assign Scrum Master:', scrumMaster.name, error);
            throw error; // Re-throw to catch in outer try-catch
        }
        }
      } else {
        console.log('ℹ️ No Scrum Masters to assign');
      }
      
      // ✅ Assign ALL Team Leaders (supports multiple!)
      for (const teamLeader of selectedTeamLeaders) {
        try {
          console.log('👥 Assigning Team Leader:', teamLeader.name, teamLeader.id);
          console.log('🔍 Team Leader employeeId:', teamLeader.employeeId);
          console.log('🔍 Team Leader role:', teamLeader.role);
          console.log('🔍 Team Leader department:', teamLeader.department);
          
          const teamLeaderData = {
            projectId: Number(projectId),
            employeeId: teamLeader.employeeId || teamLeader.id,
            memberRole: 'Team Leader',
            role: teamLeader.role || 'member'
          };
          console.log('👥 Team Leader assignment data:', JSON.stringify(teamLeaderData, null, 2));
          const teamLeaderResponse = await projectAssignmentService.addMembers(teamLeaderData);
          console.log('✅ Team Leader assigned:', teamLeaderResponse);
        } catch (error) {
          console.error('❌ Error assigning Team Leader:', teamLeader.name, error);
        }
      }
      
      // Assign Team Members
      for (const member of selectedTeamMembers) {
        try {
          console.log('👥 Assigning Team Member:', member.name, member.id);
          console.log('🔍 Team Member employeeId:', member.employeeId);
          console.log('🔍 Team Member role:', member.role);
          
          // ✅ FIX: Use employeeId (like "EMP12345") instead of id (UUID)
          // ✅ FIX: Include both memberRole (project role) and role (organizational role)
          const memberData = {
            projectId: Number(projectId),
            employeeId: member.employeeId || member.id, // Prefer employeeId, fallback to id
            memberRole: 'Member', // Project-specific role
            role: member.role || 'member' // User's organizational role
          };
          console.log('👥 Team Member assignment data:', JSON.stringify(memberData, null, 2));
          const memberResponse = await projectAssignmentService.addMembers(memberData);
          console.log('✅ Team Member assigned:', memberResponse);
          console.log('✅ Team Member response success:', memberResponse.success);
          console.log('✅ Team Member response data:', memberResponse.data);
          console.log('✅ Team Member response message:', memberResponse.message);
        } catch (error) {
          console.error('❌ Error assigning Team Member:', member.name, error);
        }
      }
      
      // ✅ CRITICAL: Fetch all project assignments to get ProjectAssignmentIds for task creation
      console.log('═══════════════════════════════════════════════════════════');
      console.log('🔍 Fetching ProjectAssignments to get IDs for task creation');
      console.log('═══════════════════════════════════════════════════════════');
      const memberAssignmentMapping = new Map<string, number>(); // employeeId → projectAssignmentId
      
      try {
        const assignmentsResponse = await projectAssignmentService.getProjectMembers(Number(projectId));
        console.log('📦 Project assignments response:', assignmentsResponse);
        
        if (assignmentsResponse.success && assignmentsResponse.data) {
          const assignments = Array.isArray(assignmentsResponse.data) ? assignmentsResponse.data : [assignmentsResponse.data];
          console.log('👥 Total assignments fetched:', assignments.length);
          
          assignments.forEach((assignment: any) => {
            const employeeId = assignment.memberId || assignment.employeeId;
            const assignmentId = assignment.id;
            memberAssignmentMapping.set(employeeId, assignmentId);
            console.log(`🗺️ Mapped: ${employeeId.substring(0, 8)}... → ProjectAssignmentId: ${assignmentId} (${assignment.memberRole})`);
          });
          
          console.log('✅ Member assignment mapping complete');
          console.log('🗺️ Total mappings:', memberAssignmentMapping.size);
        } else {
          console.warn('⚠️ WARNING: No project assignments found - tasks will fail to create!');
          console.warn('⚠️ Response:', assignmentsResponse);
        }
      } catch (error) {
        console.error('❌ CRITICAL ERROR: Failed to fetch project assignments:', error);
        console.error('⚠️ Tasks cannot be created without ProjectAssignmentIds');
      }
      console.log('═══════════════════════════════════════════════════════════');
      
      // Upload files if any
      if (newProjectFiles.length > 0) {
        console.log('📎 Uploading', newProjectFiles.length, 'files for project:', projectId);
        
        for (const file of newProjectFiles) {
          console.log('📎 Uploading file:', file.name, 'Size:', file.size, 'Type:', file.type);
          
          const formData = new FormData();
          formData.append("file", file);
          formData.append("entityType", "Project");
          formData.append("entityId", projectId.toString());
          formData.append("description", `Attachment for project: ${newProject.title}`);
          formData.append("tags", "[]");
          
          try {
            const { attachmentsService } = await import('@/services/attachmentsService');
            await attachmentsService.upload(formData);
            console.log('✅ File uploaded successfully:', file.name);
          } catch (error) {
            console.error('❌ File upload error:', file.name, error);
            // Continue with other files even if one fails
          }
        }
      }
      
      // ✅ Create milestones if any were added
      // ✅ CRITICAL: Map temporary milestone IDs to real backend IDs for task creation
      const milestoneIdMapping = new Map<string, number>();
      
      if (tempProject?.milestones && tempProject.milestones.length > 0) {
        console.log('🎯 Creating', tempProject.milestones.length, 'milestones for project:', projectId);
        console.log('🗺️ Will map temporary milestone IDs to real backend IDs');
        
        const { milestoneService } = await import('@/services/milestoneService');
        
        for (const milestone of tempProject.milestones) {
          try {
            console.log('🎯 Creating milestone:', milestone.title);
            console.log('   - Temp ID:', milestone.id);
            
            const createMilestoneData = {
              milestoneName: milestone.title,
              description: milestone.description || '',
              assignedMemberId: milestone.assigneeId || '',
              startDate: milestone.startDate || new Date().toISOString(),
              dueDate: milestone.dueDate || new Date().toISOString(),
              weight: milestone.weight || 50, // ✅ Use milestone weight (defaults to 50 if not set)
              projectId: Number(projectId),
              status: 'Pending' as const
            };
            
            console.log('🎯 Milestone creation data:', JSON.stringify(createMilestoneData, null, 2));
            const milestoneResponse = await milestoneService.createMilestone(createMilestoneData);
            console.log('✅ Milestone created:', milestoneResponse);
            
            if (milestoneResponse.success && milestoneResponse.data) {
              const realMilestoneId = milestoneResponse.data.milestoneId;
              console.log('✅ Milestone created successfully:', milestone.title);
              console.log('   - Real backend ID:', realMilestoneId);
              
              // ✅ CRITICAL: Store mapping from temp ID to real ID
              milestoneIdMapping.set(milestone.id, realMilestoneId);
              console.log('🗺️ Stored mapping:', milestone.id, '→', realMilestoneId);
            } else {
              console.error('❌ Milestone creation failed:', milestoneResponse.message);
            }
          } catch (error) {
            console.error('❌ Error creating milestone:', milestone.title, error);
            // Continue with other milestones even if one fails
          }
        }
        
        console.log('🗺️ Final milestone ID mappings:');
        milestoneIdMapping.forEach((realId, tempId) => {
          console.log(`   ${tempId} → ${realId}`);
        });
      }
      
      // ✅ Create tasks if any were added
      console.log('═══════════════════════════════════════════════════════════');
      console.log('🎯 TASK CREATION PHASE');
      console.log('═══════════════════════════════════════════════════════════');
      console.log('🔍 tempProject exists?', !!tempProject);
      console.log('🔍 tempProject.tasks exists?', !!tempProject?.tasks);
      console.log('🔍 tempProject.tasks length:', tempProject?.tasks?.length || 0);
      console.log('🔍 tempProject.milestones length:', tempProject?.milestones?.length || 0);
      
      // ✅ CRITICAL FIX: Collect tasks from BOTH standalone tasks AND milestone tasks
      const allTasks: Task[] = [];
      
      // Standalone tasks (not assigned to any milestone)
      if (tempProject?.tasks && tempProject.tasks.length > 0) {
        console.log('📋 Found', tempProject.tasks.length, 'standalone tasks');
        allTasks.push(...tempProject.tasks);
      }
      
      // Tasks nested inside milestones
      if (tempProject?.milestones && tempProject.milestones.length > 0) {
        tempProject.milestones.forEach(milestone => {
          if (milestone.tasks && milestone.tasks.length > 0) {
            console.log(`📋 Found ${milestone.tasks.length} tasks in milestone "${milestone.title}"`);
            allTasks.push(...milestone.tasks);
          }
        });
      }
      
      console.log('📊 Total tasks to create:', allTasks.length);
      console.log('📋 All tasks:', allTasks.map(t => ({ title: t.title, assigneeId: t.assigneeId, milestoneId: t.milestoneId })));
      console.log('🗺️ Available memberAssignmentMapping:', memberAssignmentMapping.size, 'entries');
      console.log('🗺️ Mapping contents:');
      memberAssignmentMapping.forEach((assignmentId, employeeId) => {
        console.log(`   ${employeeId.substring(0, 12)}... → ${assignmentId}`);
      });
      console.log('🗺️ Available milestoneIdMapping:', milestoneIdMapping.size, 'entries');
      console.log('🗺️ Mapping contents:');
      milestoneIdMapping.forEach((realId, tempId) => {
        console.log(`   ${tempId} → ${realId}`);
      });
      
      if (allTasks.length > 0) {
        console.log('✅ YES - Creating', allTasks.length, 'tasks for project:', projectId);
        
        const { projectTaskService } = await import('@/services/projectTaskService');
        
        for (const task of allTasks) {
          try {
            console.log('🎯 Creating task:', task.title);
            
            // ✅ CRITICAL FIX 1: Replace temporary milestone ID with real backend ID
            let realMilestoneId: number | null = null;
            if (task.milestoneId) {
              const tempMilestoneId = task.milestoneId;
              realMilestoneId = milestoneIdMapping.get(tempMilestoneId) || null;
              
              console.log('🗺️ Milestone ID mapping for task:');
              console.log('   - Task has temp milestone ID:', tempMilestoneId);
              console.log('   - Mapped to real backend ID:', realMilestoneId);
              
              if (!realMilestoneId) {
                console.warn('⚠️ WARNING: Task references milestone but no mapping found!');
                console.warn('   - Temp milestone ID:', tempMilestoneId);
                console.warn('   - Available mappings:', Array.from(milestoneIdMapping.entries()));
              }
            } else {
              console.log('ℹ️ Task has no milestone assignment (standalone task)');
            }
            
            // ✅ CRITICAL FIX 2: Get ProjectAssignmentId for the task's assignee
            const taskAssigneeId = task.assigneeId || '';
            const projectAssignmentId = memberAssignmentMapping.get(taskAssigneeId);
            
            console.log('🗺️ ProjectAssignment ID mapping for task:');
            console.log('   - Task assignee ID:', taskAssigneeId.substring(0, 8) + '...');
            console.log('   - Mapped to ProjectAssignmentId:', projectAssignmentId);
            
            if (!projectAssignmentId) {
              console.error('❌ CRITICAL: No ProjectAssignmentId found for assignee:', taskAssigneeId);
              console.error('   - Available mappings:', Array.from(memberAssignmentMapping.entries()));
              console.error('   - Skipping task creation:', task.title);
              continue; // Skip this task if we can't find the assignment ID
            }
            
            // ✅ FIX: Backend requires startDate and dueDate to be in the FUTURE (not now)
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            
            const oneWeekFromNow = new Date();
            oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);
            
            // Use task's dueDate if provided, otherwise default to one week from now
            const taskDueDate = task.dueDate ? new Date(task.dueDate) : oneWeekFromNow;
            
            const createTaskData = {
              projectAssignmentId: projectAssignmentId, // ✅ FIXED: Use ProjectAssignmentId, not projectId!
              assignedMemberId: taskAssigneeId,
              title: task.title,
              description: task.description || '',
              startDate: tomorrow.toISOString(), // ✅ FIXED: Future date (tomorrow)!
              dueDate: taskDueDate.toISOString(), // ✅ FIXED: Future date!
              priority: task.priority || 'Medium',
              weight: task.weight || 50,
              status: 'Pending' as const,
              milestoneId: realMilestoneId, // ✅ FIXED: Use real backend milestone ID, not temp ID!
              isAutoCreateTodoItem: newTaskAutoCreateTodo // ✅ Auto-create TodoItem if enabled
            };
            
            console.log('═══════════════════════════════════════════════════════════');
            console.log('🎯 Task creation data:', JSON.stringify(createTaskData, null, 2));
            console.log('🔍 Validation check:');
            console.log('   ✓ projectAssignmentId:', createTaskData.projectAssignmentId, typeof createTaskData.projectAssignmentId);
            console.log('   ✓ assignedMemberId:', createTaskData.assignedMemberId?.substring(0, 12) + '...', typeof createTaskData.assignedMemberId);
            console.log('   ✓ title:', createTaskData.title, '(length:', createTaskData.title?.length + ')');
            console.log('   ✓ weight:', createTaskData.weight, typeof createTaskData.weight);
            console.log('   ✓ status:', createTaskData.status);
            console.log('   ✓ milestoneId:', createTaskData.milestoneId, typeof createTaskData.milestoneId);
            console.log('═══════════════════════════════════════════════════════════');
            
            const taskResponse = await projectTaskService.createTask(createTaskData);
            console.log('✅ Task API Response:', taskResponse);
            
            if (taskResponse) {
              console.log('✅✅✅ Task created successfully:', task.title);
              console.log('   - Task ID:', taskResponse.id || (taskResponse as any).taskId);
            } else {
              console.error('❌ Task creation might have failed - no response data');
            }
          } catch (error: any) {
            console.error('═══════════════════════════════════════════════════════════');
            console.error('❌❌❌ ERROR CREATING TASK:', task.title);
            console.error('═══════════════════════════════════════════════════════════');
            console.error('Error object:', error);
            console.error('Error message:', error?.message);
            console.error('Error response:', error?.response);
            console.error('Error response data:', error?.response?.data);
            console.error('Error status:', error?.response?.status);
            console.error('Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
            console.error('═══════════════════════════════════════════════════════════');
            
            // Show alert with error details
            alert(`Failed to create task "${task.title}":\n\n${error?.message || error?.response?.data?.message || 'Unknown error'}\n\nCheck console for details.`);
            
            // Continue with other tasks even if one fails
          }
        }
      } else {
        console.log('ℹ️ No tasks to create for this project');
      }
      
      onProjectCreated(integratedProject); // Call parent handler
      
      // Show success notification
      alert(`Project "${integratedProject.title}" created successfully!`);
      
      // Navigate to correct role-based route
      const userRole = currentUser?.role?.toLowerCase() || 'member';
      const roleRoute = userRole === 'vice_president' ? 'vice-president' : 
                       userRole === 'vice-president' ? 'vice-president' : userRole;
      navigate(`/dashboard/${roleRoute}/projects/mine`);
    } catch (err: any) {
      console.error('❌ Error creating project:', err);
      console.error('❌ Error type:', typeof err);
      console.error('❌ Error keys:', err ? Object.keys(err) : 'null');
      console.error('❌ Error message:', err?.message);
      console.error('❌ Error errors:', err?.errors);
      console.error('❌ Error status:', err?.status);
      console.error('❌ Error raw:', err?.raw);
      
      // Build a detailed error message
      let errorMessage = 'An error occurred while creating the project';
      
      if (err && typeof err === 'object') {
        if (err.message) {
          errorMessage = err.message;
        }
        
        // Add validation errors if present (from our API client)
        if (err.errors && Array.isArray(err.errors) && err.errors.length > 0) {
          errorMessage += '\n\nValidation Errors:\n' + err.errors.join('\n');
        }
        // Also check raw backend errors (ASP.NET Core format)
        else if (err.raw && err.raw.errors && typeof err.raw.errors === 'object') {
          errorMessage += '\n\nValidation Errors:';
          Object.entries(err.raw.errors).forEach(([field, messages]: [string, any]) => {
            if (Array.isArray(messages)) {
              messages.forEach(msg => {
                errorMessage += `\n• ${field}: ${msg}`;
              });
            }
          });
        }
        
        // Add status code if present
        if (err.status) {
          errorMessage += `\n\nStatus Code: ${err.status}`;
        }
      }
      
      setError(errorMessage);
      
      // Show error notification with detailed message
      alert(`Project creation failed:\n\n${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to navigate between steps
  const navigateToStep = (stepNumber: number) => {
    console.log('🔍 Navigating to step:', stepNumber);
    console.log('🔍 Current user role:', currentUser?.role);
    console.log('🔍 Current user ID:', currentUser?.id);
    console.log('🔍 Selected scrum masters:', selectedScrumMasters.map(sm => sm.id));
    console.log('🔍 Selected team leaders:', selectedTeamLeaders.map(tl => tl.id));
    
    // Navigate to correct role-based route
    const userRole = currentUser?.role?.toLowerCase() || 'member';
    const roleRoute = userRole === 'vice_president' ? 'vice-president' : userRole;
    navigate(`/dashboard/${roleRoute}/projects/new/${stepNumber}`);
  };

  // Define callbacks outside JSX to prevent hooks errors
  const handleTeamSelectionChange = useCallback((selections: any) => {
    console.log('🔍 Team selections received:', selections);
    console.log('🔍 Current user:', currentUser);
    
    // Check if user is authenticated
    if (!currentUser) {
      console.error('❌ No authenticated user found');
      return;
    }
    
    // ✅ NEW: Handle arrays of Scrum Masters
    if (selections.selectedManagerObjects && Array.isArray(selections.selectedManagerObjects)) {
      console.log('🔍 Processing multiple Scrum Masters:', selections.selectedManagerObjects);
      
      const scrumMasters = selections.selectedManagerObjects.map((manager: any) => ({
        id: manager.id,
        employeeId: manager.employeeId,
        name: manager.name,
        email: manager.email,
        department: manager.department,
        position: manager.role,
        role: manager.role,
        avatar: ''
      }));
      
      setSelectedScrumMasters(scrumMasters);
      console.log('✅ Set', scrumMasters.length, 'Scrum Masters');
    } else if (selections.selectedManagerObject) {
      // ✅ Backward compatibility: Single Scrum Master
      console.log('🔍 Processing single Scrum Master:', selections.selectedManagerObject);
      
      const manager = selections.selectedManagerObject;
      setSelectedScrumMasters([{
        id: manager.id,
        employeeId: manager.employeeId,
        name: manager.name,
        email: manager.email,
        department: manager.department,
        position: manager.role,
        role: manager.role,
        avatar: ''
      }]);
      console.log('✅ Scrum Master set with employeeId:', manager.employeeId, 'and role:', manager.role);
    }
    
    // ✅ NEW: Handle arrays of Team Leaders
    if (selections.selectedTeamLeaderObjects && Array.isArray(selections.selectedTeamLeaderObjects)) {
      console.log('🔍 Processing multiple Team Leaders:', selections.selectedTeamLeaderObjects);
      
      const teamLeaders = selections.selectedTeamLeaderObjects.map((leader: any) => ({
        id: leader.id,
        employeeId: leader.employeeId,
        name: leader.name,
        email: leader.email,
        department: leader.department,
        position: leader.role,
        role: leader.role,
        avatar: ''
      }));
      
      setSelectedTeamLeaders(teamLeaders);
      console.log('✅ Set', teamLeaders.length, 'Team Leaders');
    } else if (selections.selectedTeamLeaderObject) {
      // ✅ Backward compatibility: Single Team Leader
      console.log('🔍 Processing single Team Leader:', selections.selectedTeamLeaderObject);
      
      const leader = selections.selectedTeamLeaderObject;
      setSelectedTeamLeaders([{
        id: leader.id,
        employeeId: leader.employeeId,
        name: leader.name,
        email: leader.email,
        department: leader.department,
        position: leader.role,
        role: leader.role,
        avatar: ''
      }]);
      console.log('✅ Team Leader set with employeeId:', leader.employeeId, 'and role:', leader.role);
    }
    
    if (selections.teamMembers && selections.teamMembers.length > 0) {
      console.log('🔍 Processing team members selection:', selections.teamMembers);
      
      // Convert TeamMember[] to Employee[] and set as selected team members
      const employees = selections.teamMembers.map((tm: any) => ({
        id: tm.id,
        employeeId: tm.employeeId,  // ✅ CRITICAL: Include employeeId for backend assignment
        name: tm.name,
        email: tm.email || '',
        department: tm.department || 'Engineering',
        position: tm.role || 'team_member',
        role: tm.role,              // ✅ CRITICAL: Include role for backend assignment
        avatar: ''
      }));
      console.log('✅ Setting team members:', employees);
      setSelectedTeamMembers(employees);
    }
  }, [currentUser]);

  const handleProjectDataChange = useCallback((projectData: any) => {
    console.log('🔍 Project data received:', projectData);
    // Update the multistep component's state with the project data
    setNewProjectTitle(projectData.title);
    setNewProjectDescription(projectData.description);
    setNewProjectDueDate(projectData.dueDate);
    setNewProjectPriority(projectData.priority as 'High' | 'Medium' | 'Low');
  }, []);

  const handleButtonClick = useCallback(() => {
    console.log('🔍 CreateProject button clicked - navigating to next step');
    navigateToStep(formStep + 1);
  }, [formStep]);

  // Update form step when URL params change
  useEffect(() => {
  const stepNumber = step ? parseInt(step) : 1;

  // Redirect if step is invalid
  if (stepNumber < 1 || stepNumber > 3) {
    navigate('new/1', { replace: true });
  } else {
    setFormStep(stepNumber);
  }
}, [step, navigate]);


  return (
    <div className={`p-6 ${darkMode ? "bg-zinc-800 text-gray-100" : "bg-white text-gray-800"} `}>
      {isLoading && <p>Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}
      <div className="mx-auto">
        {/* Header */}
        <div className="flex items-center mb-6">
          <button
            onClick={() => {
              if (formStep > 1) {
                navigateToStep(formStep - 1);
              } else {
                navigate(-1);
              }
            }}
            className="flex items-center text-purple-600 hover:text-purple-700"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </button>
          <h1 className="text-2xl font-bold ml-4">Create New Project</h1>
          <div className="ml-auto flex items-center">
            <span className="text-sm text-gray-500 mr-4">Step {formStep} of 3</span>
            <div className="flex space-x-1">
              {[1, 2, 3].map((stepNum) => (
                <div
                  key={stepNum}
                  className={`w-2 h-2 rounded-full ${
                    formStep >= stepNum
                      ? 'bg-purple-600'
                      : darkMode
                      ? 'bg-zinc-600'
                      : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className={`w-full h-2 rounded-full ${darkMode ? 'bg-zinc-700' : 'bg-gray-200'}`}>
            <div
              className="h-2 rounded-full bg-purple-600 transition-all duration-300"
              style={{ width: `${(formStep / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        <div className={`rounded-lg p-6 ${darkMode ? 'bg-zinc-700' : 'bg-gray-50'} mb-6`}>
          {formStep === 1 && (
            <div>
              {/* Show permission info */}
              {/* Show Scrum Master info */}
              {selectedScrumMasters.length > 0 ? (
                <div className={`mb-4 p-3 rounded-lg ${
                  selectedScrumMasters.some(sm => sm.id === currentUser?.id)
                    ? 'bg-green-100 text-green-800 border border-green-200' 
                    : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                }`}>
                  <div className="flex items-center space-x-2">
                    <Crown className="w-4 h-4" />
                    <span className="font-medium">
                      {selectedScrumMasters.some(sm => sm.id === currentUser?.id)
                        ? `You are ${selectedScrumMasters.length > 1 ? 'one of the' : 'the'} Scrum Master${selectedScrumMasters.length > 1 ? 's' : ''} - Full control over project` 
                        : `${selectedScrumMasters.map(sm => sm.name).join(', ')} ${selectedScrumMasters.length > 1 ? 'are' : 'is'} the Scrum Master${selectedScrumMasters.length > 1 ? 's' : ''} - You can create but they will manage`}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="mb-4 p-3 rounded-lg bg-blue-100 text-blue-800 border border-blue-200">
                  <div className="flex items-center space-x-2">
                    <Crown className="w-4 h-4" />
                    <span className="font-medium">
                      ℹ️ No Scrum Master selected - You will be automatically assigned as the Scrum Master
                    </span>
                  </div>
                </div>
              )}
              
              <CreateProject
                darkMode={darkMode}
                onProjectCreated={handleProjectCreated}
                buttonLabel="Next"
                isMultistep={true}
                onTeamSelectionChange={handleTeamSelectionChange}
                onProjectDataChange={handleProjectDataChange}
                onButtonClick={handleButtonClick}
                // Pass current form data to maintain state when navigating back
                initialData={{
                  title: newProjectTitle,
                  description: newProjectDescription,
                  dueDate: newProjectDueDate,
                  priority: newProjectPriority,
                  department: currentUser?.department || '',
                  projectOwner: currentUser?.name || currentUser?.username || '',
                  projectOwnerEmail: currentUser?.email || '',
                  projectOwnerPhone: currentUser?.phone || '',
                  files: newProjectFiles
                }}
              />
            </div>
          )}

          {formStep === 2 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Add Initial Milestones</h2>
              <p className="text-sm text-gray-500 mb-4">Add the key milestones for your project (optional)</p>

              <div className="space-y-4">
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Milestone Title</label>
                  <input
                    type="text"
                    value={newMilestoneTitle}
                    onChange={(e) => setNewMilestoneTitle(e.target.value)}
                    className={`w-full p-2 rounded-lg border ${darkMode ? 'bg-zinc-600 border-zinc-500 text-white' : 'bg-white border-gray-300 text-gray-800'}`}
                    placeholder="Milestone title"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    value={newMilestoneDescription}
                    onChange={(e) => setNewMilestoneDescription(e.target.value)}
                    className={`w-full p-2 rounded-lg border ${darkMode ? 'bg-zinc-600 border-zinc-500 text-white' : 'bg-white border-gray-300 text-gray-800'}`}
                    placeholder="Milestone description"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Due Date</label>
                    <input
                      type="date"
                      value={newMilestoneDueDate}
                      onChange={(e) => setNewMilestoneDueDate(e.target.value)}
                      min={minDate}
                      className={`w-full p-2 rounded-lg border ${darkMode ? 'bg-zinc-600 border-zinc-500 text-white' : 'bg-white border-gray-300 text-gray-800'}`}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Priority</label>
                    <select
                      value={newMilestonePriority}
                      onChange={(e) => setNewMilestonePriority(e.target.value as 'High' | 'Medium' | 'Low')}
                      className={`w-full p-2 rounded-lg border ${darkMode ? 'bg-zinc-600 border-zinc-500 text-white' : 'bg-white border-gray-300 text-gray-800'}`}
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                </div>

                {/* ✅ NEW: Weight Input Field */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">
                    Weight (1-100) - Importance/Progress Impact
                  </label>
                  <div className="space-y-2">
                    <input
                      type="range"
                      min="1"
                      max="100"
                      value={newMilestoneWeight}
                      onChange={(e) => setNewMilestoneWeight(Number(e.target.value))}
                      className="w-full"
                    />
                    <div className="flex justify-between items-center">
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={newMilestoneWeight}
                        onChange={(e) => {
                          const value = Math.min(100, Math.max(1, Number(e.target.value)));
                          setNewMilestoneWeight(value);
                        }}
                        className={`w-20 p-2 rounded-lg border text-center ${darkMode ? 'bg-zinc-600 border-zinc-500 text-white' : 'bg-white border-gray-300 text-gray-800'}`}
                      />
                      <span className="text-sm text-gray-500">
                        {newMilestoneWeight < 33 ? '🟢 Low Impact' : newMilestoneWeight < 67 ? '🟡 Medium Impact' : '🔴 High Impact'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Assign To</label>
                  <select
                    value={newMilestoneAssignee}
                    onChange={(e) => setNewMilestoneAssignee(e.target.value)}
                    className={`w-full p-2 rounded-lg border ${darkMode ? 'bg-zinc-600 border-zinc-500 text-white' : 'bg-white border-gray-300 text-gray-800'}`}
                  >
                    <option value="">Select team member</option>
                    {selectedScrumMasters.map(sm => (
                      <option key={sm.id} value={sm.id}>
                        {sm.name} (Scrum Master)
                      </option>
                    ))}
                    {selectedTeamLeaders.map(tl => (
                      <option key={tl.id} value={tl.id}>
                        {tl.name} (Team Leader)
                      </option>
                    ))}
                    {selectedTeamMembers.map(member => (
                      <option key={member.id} value={member.id}>
                        {member.name} (Team Member)
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleCreateMilestone}
                  disabled={!newMilestoneTitle.trim() || !newMilestoneAssignee}
                  className={`px-4 py-2 rounded-lg text-white ${
                    !newMilestoneTitle.trim() || !newMilestoneAssignee
                      ? 'bg-gray-400'
                      : darkMode
                      ? 'bg-purple-600 hover:bg-purple-500'
                      : 'bg-purple-600 hover:bg-purple-500'
                  }`}
                >
                  Add Milestone
                </button>
              </div>

              {/* Debug info */}
              <div className="mt-4 p-2 bg-gray-100 rounded text-xs">
                <strong>Debug:</strong> TempProject has {tempProject?.milestones?.length || 0} milestones and {tempProject?.tasks?.length || 0} tasks
              </div>

              {/* Show added milestones */}
              {tempProject?.milestones && tempProject.milestones.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-semibold mb-3">Added Milestones</h3>
                  <div className="space-y-3">
                    {tempProject.milestones.map((milestone) => (
                      <div
                        key={milestone.id}
                        className={`p-3 rounded-lg ${darkMode ? 'bg-zinc-600' : 'bg-white'} border ${darkMode ? 'border-zinc-500' : 'border-gray-200'}`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{milestone.title}</h4>
                            <p className="text-sm opacity-75">{milestone.description}</p>
                          </div>
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              milestone.priority === "High"
                                ? "bg-red-100 text-red-800"
                                : milestone.priority === "Medium"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {milestone.priority}
                          </span>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-sm">Assigned to: {milestone.assignee}</span>
                          <span className="text-sm">Due: {new Date(milestone.dueDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {formStep === 3 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Add Initial Tasks</h2>
              <p className="text-sm text-gray-500 mb-4">Add the initial tasks for your project (optional)</p>

              <div className="space-y-4">
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Task Title</label>
                  <input
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    className={`w-full p-2 rounded-lg border ${darkMode ? 'bg-zinc-600 border-zinc-500 text-white' : 'bg-white border-gray-300 text-gray-800'}`}
                    placeholder="Task title"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    value={newTaskDescription}
                    onChange={(e) => setNewTaskDescription(e.target.value)}
                    className={`w-full p-2 rounded-lg border ${darkMode ? 'bg-zinc-600 border-zinc-500 text-white' : 'bg-white border-gray-300 text-gray-800'}`}
                    placeholder="Task description"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Due Date</label>
                    <input
                      type="date"
                      value={newTaskDueDate}
                      onChange={(e) => setNewTaskDueDate(e.target.value)}
                      min={minDate}
                      className={`w-full p-2 rounded-lg border ${darkMode ? 'bg-zinc-600 border-zinc-500 text-white' : 'bg-white border-gray-300 text-gray-800'}`}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Priority</label>
                    <select
                      value={newTaskPriority}
                      onChange={(e) => setNewTaskPriority(e.target.value as 'Low' | 'Medium' | 'High')}
                      className={`w-full p-2 rounded-lg border ${darkMode ? 'bg-zinc-600 border-zinc-500 text-white' : 'bg-white border-gray-300 text-gray-800'}`}
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                </div>

                {/* ✅ NEW: Milestone Assignment Dropdown */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">
                    Assign to Milestone (optional)
                  </label>
                  <select
                    value={newTaskMilestone}
                    onChange={(e) => setNewTaskMilestone(e.target.value)}
                    className={`w-full p-2 rounded-lg border ${darkMode ? 'bg-zinc-600 border-zinc-500 text-white' : 'bg-white border-gray-300 text-gray-800'}`}
                  >
                    <option value="">No Milestone (Direct to Project)</option>
                    {tempProject?.milestones && tempProject.milestones.length > 0 ? (
                      tempProject.milestones.map(milestone => (
                        <option key={milestone.id} value={milestone.id}>
                          {milestone.title} (Due: {new Date(milestone.dueDate).toLocaleDateString()})
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>No milestones created yet</option>
                    )}
                  </select>
                  {(!tempProject?.milestones || tempProject.milestones.length === 0) && (
                    <p className="text-xs text-gray-500 mt-1">
                      Create milestones first to assign tasks to them
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                  <label className="block text-sm font-medium mb-1">Assign To</label>
                  <select
                    value={newTaskAssignee}
                    onChange={(e) => setNewTaskAssignee(e.target.value)}
                    className={`w-full p-2 rounded-lg border ${darkMode ? 'bg-zinc-600 border-zinc-500 text-white' : 'bg-white border-gray-300 text-gray-800'}`}
                  >
                    <option value="">Select team member</option>
                    {/* Show Scrum Master */}
                    {selectedScrumMasters.map(sm => (
                      <option key={sm.id} value={sm.id}>
                        {sm.name} (Scrum Master)
                      </option>
                    ))}
                    {/* Show Team Leader */}
                    {selectedTeamLeaders.map(tl => 
                      !selectedScrumMasters.some(sm => sm.id === tl.id) && (
                      <option key={tl.id} value={tl.id}>
                        {tl.name} (Team Leader)
                      </option>
                    ))}
                    {/* Show Team Members */}
                    {selectedTeamMembers.map(member => (
                      <option key={member.id} value={member.id}>
                        {member.name} (Team Member)
                      </option>
                    ))}
                  </select>
                  </div>

                  {/* ✅ NEW: Task Weight Field */}
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Task Weight (1-100) *
                    </label>
                    <input
                      type="number"
                      value={newTaskWeight}
                      onChange={(e) => setNewTaskWeight(parseInt(e.target.value) || 50)}
                      min={1}
                      max={100}
                      className={`w-full p-2 rounded-lg border ${darkMode ? 'bg-zinc-600 border-zinc-500 text-white' : 'bg-white border-gray-300 text-gray-800'}`}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Importance/effort level (50 = medium)
                    </p>
                  </div>
                </div>

                {/* ✅ NEW: Auto-create TodoItem Checkbox */}
                <div className={`mb-4 p-3 rounded-lg border ${
                  darkMode ? 'bg-zinc-700 border-zinc-600' : 'bg-blue-50 border-blue-200'
                }`}>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newTaskAutoCreateTodo}
                      onChange={(e) => setNewTaskAutoCreateTodo(e.target.checked)}
                      className="mr-3 h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                    />
                    <div className="flex-1">
                      <span className="font-medium text-sm">Auto-create Action Item (TodoItem)</span>
                      <p className="text-xs text-gray-500 mt-1">
                        Automatically creates a checklist item for the assignee when this task is saved.
                      </p>
                    </div>
                  </label>
                </div>

                <button
                  onClick={handleCreateTask}
                  disabled={!newTaskTitle.trim() || !newTaskAssignee}
                  className={`px-4 py-2 rounded-lg text-white ${
                    !newTaskTitle.trim() || !newTaskAssignee
                      ? 'bg-gray-400'
                      : darkMode
                      ? 'bg-purple-600 hover:bg-purple-500'
                      : 'bg-purple-600 hover:bg-purple-500'
                  }`}
                >
                  Add Task
                </button>
              </div>

              {/* Debug info for tasks */}
              <div className="mt-4 p-2 bg-gray-100 rounded text-xs">
                 TempProject has {tempProject?.milestones?.length || 0} milestones and {tempProject?.tasks?.length || 0} tasks
              </div>

              {/* Show added tasks */}
              {tempProject?.tasks && tempProject.tasks.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-semibold mb-3">Added Tasks</h3>
                  <div className="space-y-3">
                    {tempProject.tasks.map((task) => (
                      <div
                        key={task.id}
                        className={`p-3 rounded-lg ${darkMode ? 'bg-zinc-600' : 'bg-white'} border ${darkMode ? 'border-zinc-500' : 'border-gray-200'}`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{task.title}</h4>
                            <p className="text-sm opacity-75">{task.description}</p>
                          </div>
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              task.priority === "High"
                                ? "bg-red-100 text-red-800"
                                : task.priority === "Medium"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {task.priority}
                          </span>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-sm">Assigned to: {task.assignee}</span>
                          <span className="text-sm">Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <button
            onClick={() => {
              if (formStep > 1) {
                navigateToStep(formStep - 1);
              } else {
                // Navigate back to projects list based on user role
                const userRole = currentUser?.role?.toLowerCase() || 'member';
                const roleRoute = userRole === 'vice_president' ? 'vice-president' : 
                                 userRole === 'vice-president' ? 'vice-president' : userRole;
                navigate(`/dashboard/${roleRoute}/projects/mine`);
              }
            }}
            className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
          >
            {formStep === 1 ? 'Cancel' : 'Back'}
          </button>

          <div className="flex space-x-2">
            {/* Next Button - Only show on step 2 (milestone step), not on step 1 (CreateProject handles its own Next button) */}
            {formStep === 2 && (
              <button
                onClick={() => navigateToStep(formStep + 1)}
                disabled={!newProjectTitle.trim()}
                className={`px-4 py-2 rounded-lg text-white ${
                  !newProjectTitle.trim() ? 'bg-gray-400' : 'bg-purple-600 hover:bg-purple-500'
                }`}
              >
                Next
              </button>
            )}

            {/* Skip Milestones Button - Only on step 2 (milestone step) */}
            {formStep === 2 && (
              <button
                onClick={handleCreateProject}
                disabled={!newProjectTitle.trim()}
                className={`px-4 py-2 rounded-lg text-white ${
                  !newProjectTitle.trim() ? 'bg-gray-400' : 'bg-orange-600 hover:bg-orange-500'
                }`}
              >
                Skip Milestones
              </button>
            )}

            {/* Create Project Button - Always available */}
            <button
              onClick={handleCreateProject}
              disabled={!newProjectTitle.trim()}
              className={`px-4 py-2 rounded-lg text-white ${
                !newProjectTitle.trim() ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-500'
              }`}
            >
              Create Project
            </button>

          </div>
        </div>
      </div>
    </div>
  );
};

export default MultistepProjectCreation;