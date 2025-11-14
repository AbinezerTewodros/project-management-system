
import React, { useState, useEffect, useMemo } from "react";
import ReactDOM from 'react-dom';
import { Paperclip, Upload, X } from 'lucide-react';
import { toast } from "react-toastify";
import {
  CreateTaskModalProps,
  ProjectTaskCreateDto,
  IndependentTaskCreateDto,
  TaskPriority,
  TaskStatus,
  IndependentTaskStatus,
  IndependentTaskPriority,
  Member,
} from "@/types/taskTypes";
import { useTasks } from "@/context/TaskContext";
import { useAuth } from "@/context/AuthContext";
import { projectAssignmentService } from "@/services/projectAssignmentService";
import { milestoneService, Milestone } from "@/services/milestoneService";

const getTodayDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  open,
  onClose,
  defaultProjectId,
  initialProjectId,
  projects,
  allMembers,
  darkMode,
  onCreate,
}) => {
  const { createTask } = useTasks();
  const { user: currentUser } = useAuth();

  const [selectedProjectId, setSelectedProjectId] = useState(
    initialProjectId || ""
  );
  const [file, setFile] = useState<File | null>(null);
  const [filename, setFileName] = useState("");
  const [priority, setPriority] = useState<TaskPriority>(TaskPriority.Medium);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedAssignee, setSelectedAssignee] = useState("");
  const [employeeIdSearch, setEmployeeIdSearch] = useState("");
  const [projectMembers, setProjectMembers] = useState<Member[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Milestone selection
  const [availableMilestones, setAvailableMilestones] = useState<any[]>([]);
  const [selectedMilestoneId, setSelectedMilestoneId] = useState("");
  const [loadingMilestones, setLoadingMilestones] = useState(false);

  // Derived: selected milestone object and its date range
  const selectedMilestone = useMemo(() => {
    if (!selectedMilestoneId) return null;
    const idNum = parseInt(selectedMilestoneId, 10);
    return (availableMilestones || []).find((m: any) => Number(m.milestoneId) === idNum) || null;
  }, [selectedMilestoneId, availableMilestones]);

  const milestoneStartISO = useMemo(() => {
    if (!selectedMilestone?.startDate) return undefined;
    const d = new Date(selectedMilestone.startDate);
    if (isNaN(d.getTime())) return undefined;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }, [selectedMilestone]);

  const milestoneDueISO = useMemo(() => {
    const raw = selectedMilestone?.dueDate || selectedMilestone?.DueDate;
    if (!raw) return undefined;
    const d = new Date(raw);
    if (isNaN(d.getTime())) return undefined;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }, [selectedMilestone]);

  // Weight field (default 50)
  const [weight, setWeight] = useState(50);

  // Auto-create TodoItem checkbox (default true)
  const [isAutoCreateTodo, setIsAutoCreateTodo] = useState(true);
  
  // Project assignments (used only to resolve assignment row id when creating tasks attached to a milestone)
  const [projectAssignments, setProjectAssignments] = useState<any[]>([]);

  const minDate = getTodayDate();

  // Filter assignees based on task type
  const filteredAssignees = useMemo(() => {
    if (selectedProjectId) {
      // PROJECT TASK: Show only project members
      if (loadingMembers) {
        return allMembers;
      }
      if (projectMembers.length > 0) {
        console.log('👥 Filtered to project members:', projectMembers.length);
        return projectMembers;
      } else {
        return [];
      }
    } else {
      // INDEPENDENT TASK: Show only users from same department
      if (currentUser?.department) {
        const filtered = allMembers.filter((m: Member) => {
          const memberDept = (m as any).department;
          return memberDept === currentUser.department;
        });
        console.log('👥 Filtered to department members:', filtered.length, 'from department:', currentUser.department);
        return filtered;
      } else {
        console.warn('⚠️ Current user has no department, showing all members');
        return allMembers;
      }
    }
  }, [selectedProjectId, projectMembers, loadingMembers, allMembers, currentUser]);

  // Fetch project members when a project is selected
  useEffect(() => {
    const fetchProjectMembers = async () => {
      if (selectedProjectId && selectedProjectId !== "") {
        setLoadingMembers(true);
        try {
          console.log("🔍 Fetching members for project:", selectedProjectId);
          const projectIdParam: any = (/^\d+$/.test(String(selectedProjectId)) ? Number(selectedProjectId) : selectedProjectId);
          const response = await projectAssignmentService.getProjectMembers(
            projectIdParam
          );
          console.log("📦 Project members response:", response);

          const membersData = response.success && response.data
            ? response.data
            : response;

          if (Array.isArray(membersData)) {
            const mappedMembers: Member[] = membersData.map((item: any) => {
              const memberId = item.MemberId || item.memberId;
              const employeeId = item.EmployeeId || item.employeeId;
              const memberFullName = item.MemberFullName || item.memberFullName;
              const memberRole = item.MemberRole || item.memberRole || item.Role || item.role || "Member";

              return {
                id: memberId,
                name: memberFullName || employeeId || memberId,
                role: memberRole,
                projectId: [selectedProjectId],
              };
            });

            console.log("✅ Mapped project members:", mappedMembers);
            setProjectMembers(mappedMembers);
          } else {
            console.warn("⚠️ Project members response is not an array");
            setProjectMembers([]);
          }
        } catch (error) {
          console.error("❌ Failed to fetch project members:", error);
          toast.error("Failed to load project members", {
            position: "top-right",
            autoClose: 3000,
            theme: darkMode ? "dark" : "light",
          });
          setProjectMembers([]);
        } finally {
          setLoadingMembers(false);
        }
      } else {
        setProjectMembers([]);
      }
    };

    fetchProjectMembers();
  }, [selectedProjectId, darkMode]);

  // Sync employee ID search with assignee selection
  useEffect(() => {
    if (employeeIdSearch) {
      const memberList = selectedProjectId && selectedProjectId !== ""
        ? projectMembers
        : allMembers;

      const member = memberList.find((m: Member) => String(m.id) === String(employeeIdSearch));
      if (member) {
        // Use the stable id value so the select control (which now uses id values)
        // matches the option value and the lookup in submit uses the id.
        setSelectedAssignee(member.id?.toString() ?? "");
      }
    }
  }, [employeeIdSearch, allMembers, projectMembers, selectedProjectId]);

  const handleCreateFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setFileName(selectedFile.name);
      toast.success("File selected successfully!", {
        position: "top-right",
        autoClose: 3000,
        theme: darkMode ? "dark" : "light",
      });
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setFileName("");
  };

  useEffect(() => {
    if (open && defaultProjectId) {
      setSelectedProjectId(defaultProjectId.toString());
    }
  }, [open, defaultProjectId]);

  // Fetch milestones when project is selected
  useEffect(() => {
    const fetchMilestones = async () => {
      if (selectedProjectId) {
        setLoadingMilestones(true);
        try {
          const { milestoneService } = await import('@/services/milestoneService');
          const response = await milestoneService.getMilestonesByProjectId(Number(selectedProjectId));

          if (response.success && response.data) {
            console.log('✅ Milestones loaded for project:', selectedProjectId, response.data);
            setAvailableMilestones(Array.isArray(response.data) ? response.data : []);
          } else {
            console.warn('⚠️ No milestones found for project:', selectedProjectId);
            setAvailableMilestones([]);
          }
        } catch (error) {
          console.error('❌ Error fetching milestones:', error);
          setAvailableMilestones([]);
        } finally {
          setLoadingMilestones(false);
        }
      } else {
        setAvailableMilestones([]);
        setSelectedMilestoneId("");
      }
    };

    fetchMilestones();
  }, [selectedProjectId]);

  // Fetch project team members when project is selected
  useEffect(() => {
    const fetchProjectTeam = async () => {
      if (selectedProjectId) {
        try {
          console.log('👥 Fetching team members for project:', selectedProjectId);
          const { projectAssignmentService } = await import('@/services/projectAssignmentService');
          const projectIdParam: any = (/^\d+$/.test(String(selectedProjectId)) ? Number(selectedProjectId) : selectedProjectId);
          const response = await projectAssignmentService.getProjectMembers(projectIdParam);
          
          if (response.success && response.data) {
            console.log('✅ Project team members loaded:', response.data);
            
            const assignments = Array.isArray(response.data) ? response.data : [response.data];
            // Store assignments so we can resolve ProjectAssignment.Id when creating a task tied to a milestone
            setProjectAssignments(assignments);
            console.log('✅ Stored', assignments.length, 'project assignments for ID lookup');
            } else {
            console.warn('⚠️ No team members found for project:', selectedProjectId);
          }
        } catch (error) {
          console.error('❌ Error fetching project team:', error);
        }
      } else {
        // No project selected - nothing to fetch
      }
    };
    
    fetchProjectTeam();
  }, [selectedProjectId]);

const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  setIsSubmitting(true);

  try {
    const formData = new FormData(e.currentTarget);

    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const dueDate = formData.get("dueDate") as string;
    const projectId = formData.get("project") as string;
    const startDate = formData.get("startDate") as string;
    const estimatedHoursValue = formData.get("estimatedHours") as string;
    const estimatedHours = estimatedHoursValue ? parseFloat(estimatedHoursValue) : 0;

    const assignee = selectedAssignee;

    // Check for assignee
    if (!assignee) {
      toast.error("Please select an assignee", {
        position: "top-right",
        autoClose: 3000,
        theme: darkMode ? "dark" : "light",
      });
      return;
    }

    // Resolve assignee user ID. Prefer projectMembers (these are returned by ProjectAssignment endpoints).
    const projectMemberUser = projectMembers.find(member => String(member.id) === String(assignee));
    const fallbackUser = allMembers.find(member => String(member.id) === String(assignee));
    const selectedUser = projectMemberUser || fallbackUser;
    if (!selectedUser) {
      toast.error("Selected user not found", {
        position: "top-right",
        autoClose: 3000,
        theme: darkMode ? "dark" : "light",
      });
      return;
    }

    const assigneeUserId = selectedUser.id?.toString() || "";
    const isAssigneeFromProject = !!projectMemberUser; // true if assignee came from ProjectAssignment endpoint

    // Normalize dates
  const safeDueDate = dueDate ? new Date(dueDate) : undefined;
        const safeStartDate = startDate ? new Date(startDate).toISOString() : undefined;
        // Adjust due date logic as necessary...

    if (projectId) {
      const projectIdNum = Number(projectId);
      const isValidProject = projects.some(project => project.id === String(projectIdNum));
      if (!isValidProject) {
        toast.error("Selected project does not exist.", {
          position: "top-right",
          autoClose: 3000,
          theme: darkMode ? "dark" : "light",
        });
        setIsSubmitting(false);
        return;
      }

      const response = await milestoneService.getMilestonesByProjectId(projectIdNum);
      if (response.success && response.data) {
        const projectMilestones: Milestone[] = response.data;

        // Validate milestone
  let selectedMilestoneObj = undefined;
  if (selectedMilestoneId) {
          selectedMilestoneObj = projectMilestones.find(milestone => milestone.milestoneId === Number(selectedMilestoneId));
          if (!selectedMilestoneObj) {
            toast.error("Selected milestone does not belong to the selected project.", {
              position: "top-right",
              autoClose: 3000,
              theme: darkMode ? "dark" : "light",
            });
            console.error('[TASK BLOCKED] Milestone ID', selectedMilestoneId, 'not found in project', projectIdNum, 'projectMilestones:', projectMilestones);
            setIsSubmitting(false);
            return;
          }
          // 🚨 ADD STRONG VALIDATION: milestone.projectId === projectAssignmentId
          if (selectedMilestoneObj.projectId != projectIdNum) {
            alert(
              `❌ MILESTONE/PROJECT MISMATCH\n\nYou selected milestone ID ${selectedMilestoneId}, but its projectId is ${selectedMilestoneObj.projectId}, selected project ID is ${projectIdNum}. This will be rejected by the backend.\n\nPlease double-check your project and milestone selections.\n\nSee the console for more debugging info.`
            );
            console.error('[TASK BLOCKED] Selected Milestone', selectedMilestoneObj, 'for Project ID', projectIdNum, 'Full milestone:', selectedMilestoneObj, 'All milestones:', projectMilestones);
            setIsSubmitting(false);
            return;
          }
        }

        // Create Project Task
        // If a milestone is selected, the backend validator requires a ProjectAssignment row id (pa.Id).
        // For non-milestone tasks we use the numeric project id. Resolve accordingly.
        // Only attempt to resolve ProjectAssignment row id when the assignee actually came from project members
        // (i.e. was fetched via the ProjectAssignment endpoint). Otherwise use the numeric project id.
        let projectAssignmentPayloadId: number = projectIdNum;

        if (selectedMilestoneId && isAssigneeFromProject) {
          // try to find assignment in cached projectAssignments
          const found = (projectAssignments || []).find((pa: any) => {
            const memberCandidates = [pa.memberId, pa.MemberId, pa.employeeId, pa.EmployeeId, pa.member, pa.memberUuid, pa.memberGuid, pa.userId, pa.userIdValue];
            const projectCandidates = [pa.projectId, pa.ProjectId, pa.project, pa.projectID];
            const matchesMember = memberCandidates.some((m: any) => m !== undefined && String(m) === String(assigneeUserId));
            const matchesProject = projectCandidates.some((p: any) => p !== undefined && Number(p) === Number(projectIdNum));
            return matchesMember && matchesProject;
          });

          if (found && (found.id || found.Id || found.assignmentId)) {
            projectAssignmentPayloadId = Number(found.id || found.Id || found.assignmentId);
            console.log('✅ Resolved ProjectAssignment.Id from cache:', projectAssignmentPayloadId, 'assignment:', found);
          } else {
            // fetch fresh assignments and try again
            try {
              console.log('🔁 Fetching fresh project assignments for project', projectIdNum);
              const fresh = await projectAssignmentService.getProjectMembers(projectIdNum);
              const freshData = fresh && fresh.data ? fresh.data : fresh;
              const freshArray = Array.isArray(freshData) ? freshData : [];
              const foundFresh = freshArray.find((pa: any) => {
                const memberCandidates = [pa.memberId, pa.MemberId, pa.employeeId, pa.EmployeeId, pa.member, pa.memberUuid, pa.memberGuid, pa.userId, pa.userIdValue];
                const projectCandidates = [pa.projectId, pa.ProjectId, pa.project, pa.projectID];
                const matchesMember = memberCandidates.some((m: any) => m !== undefined && String(m) === String(assigneeUserId));
                const matchesProject = projectCandidates.some((p: any) => p !== undefined && Number(p) === Number(projectIdNum));
                return matchesMember && matchesProject;
              });

              if (foundFresh && (foundFresh.id || foundFresh.Id || foundFresh.assignmentId)) {
                projectAssignmentPayloadId = Number(foundFresh.id || foundFresh.Id || foundFresh.assignmentId);
                console.log('✅ Resolved ProjectAssignment.Id from fresh API:', projectAssignmentPayloadId, 'assignment:', foundFresh);
                // update cache
                setProjectAssignments(freshArray);
              } else {
                console.error('❌ Could not resolve a ProjectAssignment row id for assignee', assigneeUserId, 'project', projectIdNum);
                toast.error('Cannot create task with milestone: assignee is not a project member (no project-assignment found).', {
                  position: 'top-right',
                  autoClose: 5000,
                  theme: darkMode ? 'dark' : 'light',
                });
                setIsSubmitting(false);
                return;
              }
            } catch (fetchErr) {
              console.error('❌ Error fetching project assignments:', fetchErr);
              toast.error('Failed to resolve project assignment. Please try again.', {
                position: 'top-right',
                autoClose: 4000,
                theme: darkMode ? 'dark' : 'light',
              });
              setIsSubmitting(false);
              return;
            }
          }
        } else if (selectedMilestoneId && !isAssigneeFromProject) {
          // user selected a milestone but the selected assignee was not from project members
          // Backend expects a ProjectAssignment row id for milestone-linked tasks; we will send project id
          // but warn the user that the assignee may not be a project member and backend may reject it.
          console.warn('⚠️ Milestone selected but assignee was not loaded from project assignments. Sending project id instead of assignment id.');
          toast.info('Note: assignee was not selected from project team list — sending project id. If this fails, pick a project team member.', {
            position: 'top-right',
            autoClose: 6000,
            theme: darkMode ? 'dark' : 'light',
          });
        }

        const projectTaskData: ProjectTaskCreateDto = {
          title,
          description: description || "",
          projectAssignmentId: projectAssignmentPayloadId,
          assignedMemberId: assigneeUserId,
          priority,
          status: TaskStatus.Pending,
          dueDate: safeDueDate?.toISOString(),
          weight,
          milestoneId: selectedMilestoneId ? parseInt(selectedMilestoneId, 10) : undefined,
          startDate: safeStartDate,
          estimatedHours,
          isAutoCreateTodo,
        };

        console.log('🔵 CREATING PROJECT TASK (projectAssignmentId payload):', projectTaskData, '\nSelected milestone object:', selectedMilestoneObj);
        await createTask(projectTaskData, "Project");
      } else {
        toast.error("Failed to fetch milestones", {
          position: "top-right",
          autoClose: 3000,
          theme: darkMode ? "dark" : "light",
        });
        setIsSubmitting(false);
        return;
      }
    } else {
      // Create an Independent Task
      const independentTaskData: IndependentTaskCreateDto = {
        title,
        description,
        assignedToUserId: assigneeUserId,
        priority: priority === TaskPriority.Low ? IndependentTaskPriority.Low :
                 priority === TaskPriority.Medium ? IndependentTaskPriority.Medium :
                 priority === TaskPriority.High ? IndependentTaskPriority.High :
                 IndependentTaskPriority.Critical,
        weight,
        dueDate: (safeDueDate as unknown as string) || new Date().toISOString().split('T')[0],
        status: IndependentTaskStatus.Pending,
        progress: 0,
      };

      console.log('📤 Creating Independent Task with data:', independentTaskData);
      await createTask(independentTaskData, "Independent");
    }

    if (file) {
      console.log("File to upload:", file);
    }

    // Reset form state
    setFile(null);
    setFileName("");
    setPriority(TaskPriority.Medium);
    setSelectedAssignee("");
    setEmployeeIdSearch("");
    setSelectedMilestoneId("");
    setWeight(50);
    setIsAutoCreateTodo(true);

    toast.success("Task created successfully!", {
      position: "top-right",
      autoClose: 3000,
      theme: darkMode ? "dark" : "light",
    });
    onClose();

    if (onCreate) {
      onCreate();
    }
  } catch (error: unknown) {
    console.error("Error creating task:", error);
    const err = error as { message?: string };
    toast.error(err.message || "Failed to create task", {
      position: "top-right",
      autoClose: 3000,
      theme: darkMode ? "dark" : "light",
    });
  } finally {
    setIsSubmitting(false);
  }
};

  // Reset assignee when project changes
  useEffect(() => {
    setSelectedAssignee("");
    setEmployeeIdSearch("");
  }, [selectedProjectId]);

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setFile(null);
      setFileName("");
      setPriority(TaskPriority.Medium);
      setSelectedProjectId(initialProjectId || "");
      setSelectedAssignee("");
      setEmployeeIdSearch("");
      setSelectedMilestoneId("");
      setWeight(50);
      setIsAutoCreateTodo(true);
      setAvailableMilestones([]);
      setProjectMembers([]);
    }
  }, [open, initialProjectId]);

  // Lock body scroll when modal is open (robust: save/restore previous value)
  useEffect(() => {
    if (!open) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    console.log('🔒 Body scroll locked (prev =', prevOverflow || 'auto', ')');

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        console.log('⎋ Escape pressed - closing CreateTaskModal');
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
      console.log('🔓 Body scroll restored to', prevOverflow || 'auto');
    };
  }, [open, onClose]);

  if (!open) return null;

  const modalContent = (
    <>
      {open && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
        >
          <div 
            className="absolute inset-0" 
            onClick={() => {
              console.log('🔴 Backdrop clicked');
              onClose();
            }}
          />
          
          <div
            className={`relative bg-white rounded-lg w-full max-w-2xl shadow-2xl ${
              darkMode ? "bg-zinc-800 text-gray-300" : ""
            }`}
            style={{ 
              maxHeight: '85vh', 
              display: 'flex', 
              flexDirection: 'column',
              zIndex: 10000,
              overflow: 'hidden'
            }}
            onClick={(e) => e.stopPropagation()}
          >
          <div className={`p-6 pb-4 border-b ${darkMode ? "border-zinc-700" : "border-gray-200"}`}>
            <div className="flex justify-between items-start">
              <h2
                className={`text-2xl font-bold bg-gradient-to-r from-fuchsia-800 to-stone-800 bg-clip-text text-transparent`}
              >
                Create New Task
              </h2>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('❌ Close button (X) clicked');
                  onClose();
                }}
                type="button"
                aria-label="Close modal"
                title="Close modal"
                className={`p-1 rounded-full hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors ${
                  darkMode ? "text-gray-300" : "text-gray-600"
                }`}
              >
                <X size={24} />
              </button>
            </div>
            <p
              className={`text-sm mt-2 ${
                darkMode ? "text-gray-400" : "text-gray-600"
              }`}
            >
              Fill in the details to create a new task for your team
            </p>
          </div>

          <div className="p-6 overflow-y-auto" style={{ flex: 1 }}>
            <form id="create-task-form" onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Project (optional)
                  </label>
                  <select
                    name="project"
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    aria-label="Select project"
                    title="Select project (optional)"
                    className={`w-full p-3 border rounded-lg ${
                      darkMode
                        ? "bg-zinc-700 border-zinc-600 text-white"
                        : "bg-white border-gray-300 text-gray-800"
                    } focus:outline-none focus:ring-2 focus:ring-purple-500`}
                  >
                    <option value="">No Project (Independent Task)</option>
                    {projects && projects.length > 0 ? (
                      projects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>
                        No projects available
                      </option>
                    )}
                  </select>
                  {projects && projects.length === 0 && (
                    <p className="text-xs text-yellow-600 mt-1">
                      Loading projects or you're not assigned to any projects yet.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Milestone (optional)
                  </label>
                  <select
                    name="milestone"
                    value={selectedMilestoneId}
                    onChange={(e) => setSelectedMilestoneId(e.target.value)}
                    disabled={!selectedProjectId || loadingMilestones}
                    className={`w-full p-3 border rounded-lg ${
                      darkMode
                        ? "bg-zinc-700 border-zinc-600 text-white"
                        : "bg-white border-gray-300 text-gray-800"
                    } focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <option value="">No Milestone (Direct to Project)</option>
                    {loadingMilestones ? (
                      <option value="">Loading milestones...</option>
                    ) : (
                      availableMilestones.map((milestone) => (
                        <option key={milestone.milestoneId} value={milestone.milestoneId}>
                          {milestone.milestoneName} (Due: {new Date(milestone.dueDate).toLocaleDateString()})
                        </option>
                      ))
                    )}
                  </select>
                  {!selectedProjectId && (
                    <p className="text-xs text-gray-500 mt-1">
                      Select a project first to see milestones
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Task Title *
                  </label>
                  <input
                    name="title"
                    placeholder="Enter task title"
                    required
                    className={`w-full p-3 border rounded-lg ${
                      darkMode
                        ? "bg-zinc-700 border-zinc-600 text-white placeholder-gray-400"
                        : "bg-white border-gray-300 text-gray-800 placeholder-gray-500"
                    } focus:outline-none focus:ring-2 focus:ring-purple-500`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Task Weight * (1-100)
                  </label>
                  <input
                    type="number"
                    name="weight"
                    min={1}
                    max={100}
                    value={weight}
                    onChange={(e) => setWeight(parseInt(e.target.value) || 50)}
                    required
                    className={`w-full p-3 border rounded-lg ${
                      darkMode
                        ? "bg-zinc-700 border-zinc-600 text-white"
                        : "bg-white border-gray-300 text-gray-800"
                    } focus:outline-none focus:ring-2 focus:ring-purple-500`}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Represents task importance/effort (50 = medium)
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Description *
                </label>
                <textarea
                  name="description"
                  placeholder="Enter task description"
                  required
                  className={`w-full p-3 border rounded-lg ${
                    darkMode
                      ? "bg-zinc-700 border-zinc-600 text-white placeholder-gray-400"
                      : "bg-white border-gray-300 text-gray-800 placeholder-gray-500"
                  } focus:outline-none focus:ring-2 focus:ring-purple-500`}
                  rows={4}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Assign To *
                  {selectedProjectId && (
                    <span className="ml-2 text-xs text-gray-500">(Project team members only)</span>
                  )}
                  {!selectedProjectId && currentUser?.department && (
                    <span className="ml-2 text-xs text-gray-500">(Department: {currentUser.department})</span>
                  )}
                </label>
                <div className="flex flex-col md:flex-row gap-4">
                  <select
                    name="assignee"
                    value={selectedAssignee}
                    onChange={(e) => setSelectedAssignee(e.target.value)}
                    required
                    aria-label="Select assignee"
                    title="Select assignee"
                    disabled={loadingMembers}
                    className={`flex-1 p-3 border rounded-lg ${
                      darkMode
                        ? "bg-zinc-700 border-zinc-600 text-white"
                        : "bg-white border-gray-300 text-gray-800"
                    } focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                      loadingMembers ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    <option value="">
                      {loadingMembers
                        ? "Loading members..."
                        : selectedProjectId && selectedProjectId !== ""
                          ? "Select Project Member"
                          : "Select Assignee"
                      }
                    </option>
                    {filteredAssignees.map((member: Member) => (
                      <option key={member.id} value={member.id?.toString()}>
                        {member.name} ({member.role})
                      </option>
                    ))}
                  </select>

                  <div className="flex gap-2 flex-1">
                    <input
                      type="text"
                      placeholder="Search by Employee ID"
                      value={employeeIdSearch}
                      onChange={(e) => setEmployeeIdSearch(e.target.value)}
                      list="employeeList"
                      disabled={loadingMembers}
                      className={`flex-1 p-3 border rounded-lg ${
                        darkMode
                          ? "bg-zinc-700 border-zinc-600 text-white placeholder-gray-400"
                          : "bg-white border-gray-300 text-gray-800 placeholder-gray-500"
                      } focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                        loadingMembers ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    />
                    <datalist id="employeeList">
                      {filteredAssignees.map((member: Member) => (
                        <option key={member.id} value={member.id.toString()}>
                          {member.name} ({member.role})
                        </option>
                      ))}
                    </datalist>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {selectedProjectId
                    ? `Showing ${filteredAssignees.length} team member(s) from selected project`
                    : currentUser?.department
                      ? `Showing ${filteredAssignees.length} member(s) from ${currentUser.department} department`
                      : `Showing all ${filteredAssignees.length} user(s)`
                  }
                </p>
                {selectedProjectId && selectedProjectId !== "" && projectMembers.length === 0 && !loadingMembers && (
                  <p className="text-xs text-yellow-600 mt-1">
                    No members found for this project. Please add members to the project first.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Start Date (optional)
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    min={milestoneStartISO || minDate}
                    max={milestoneDueISO}
                    className={`w-full p-3 border rounded-lg ${
                      darkMode
                        ? "bg-zinc-700 border-zinc-600 text-white"
                        : "bg-white border-gray-300 text-gray-800"
                    } focus:outline-none focus:ring-2 focus:ring-purple-500`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Due Date
                  </label>
                  <input
                    type="date"
                    name="dueDate"
                    min={milestoneStartISO || minDate}
                    max={milestoneDueISO}
                    aria-label="Task due date"
                    title="Task due date"
                    className={`w-full p-3 border rounded-lg ${
                      darkMode
                        ? "bg-zinc-700 border-zinc-600 text-white"
                        : "bg-white border-gray-300 text-gray-800"
                    } focus:outline-none focus:ring-2 focus:ring-purple-500`}
                  />
                  {selectedMilestone && (
                    <p className="text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}">
                      Milestone window: {milestoneStartISO || 'N/A'} → {milestoneDueISO || 'N/A'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Estimated Hours (optional)
                  </label>
                  <input
                    type="number"
                    name="estimatedHours"
                    min={0}
                    max={1000}
                    step={0.5}
                    placeholder="e.g., 8"
                    className={`w-full p-3 border rounded-lg ${
                      darkMode
                        ? "bg-zinc-700 border-zinc-600 text-white placeholder-gray-400"
                        : "bg-white border-gray-300 text-gray-800 placeholder-gray-500"
                    } focus:outline-none focus:ring-2 focus:ring-purple-500`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Priority *
                </label>
                <div className="flex flex-wrap gap-4">
                  {Object.values(TaskPriority).map((level) => (
                    <label key={level} className="flex items-center">
                      <input
                        type="radio"
                        name="priority"
                        value={level}
                        checked={priority === level}
                        onChange={(e) => setPriority(e.target.value as TaskPriority)}
                        className={`mr-2 h-4 w-4 border-2 ${
                          darkMode ? "border-gray-500" : "border-gray-300"
                        } rounded-full appearance-none checked:border-purple-500 checked:bg-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500`}
                      />
                      <span className="capitalize">{level.toLowerCase()}</span>
                    </label>
                  ))}
                </div>
              </div>

              {selectedProjectId && (
                <div className={`p-4 rounded-lg border ${
                  darkMode ? "bg-zinc-700 border-zinc-600" : "bg-blue-50 border-blue-200"
                }`}>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isAutoCreateTodo}
                      onChange={(e) => setIsAutoCreateTodo(e.target.checked)}
                      className="mr-3 h-5 w-5 text-purple-600 border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                    />
                    <div>
                      <span className="font-medium">Auto-create Action Item (TodoItem)</span>
                      <p className="text-xs text-gray-500 mt-1">
                        Automatically creates a checklist item for the assignee.
                        Uncheck if this task doesn't need detailed tracking.
                      </p>
                    </div>
                  </label>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">
                  Attachments
                </label>
                <div
                  className={`p-6 border-2 border-dashed rounded-lg ${
                    darkMode
                      ? "border-zinc-600 bg-zinc-700"
                      : "border-gray-300 bg-gray-50"
                  }`}
                >
                  {file ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Paperclip className="h-5 w-5 mr-3" />
                        <span className="truncate max-w-xs">{filename}</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveFile}
                        aria-label="Remove file"
                        title="Remove file"
                        className={`p-1 rounded ${
                          darkMode ? "hover:bg-zinc-600" : "hover:bg-gray-200"
                        }`}
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <label className="cursor-pointer">
                        <div className="flex flex-col items-center justify-center">
                          <Upload
                            className={`h-8 w-8 mb-2 ${
                              darkMode ? "text-gray-400" : "text-gray-500"
                            }`}
                          />
                          <span
                            className={`text-sm font-medium ${
                              darkMode ? "text-gray-400" : "text-gray-500"
                            }`}
                          >
                            Drag and drop files here or click to browse
                          </span>
                          <span
                            className={`text-xs mt-1 ${
                              darkMode ? "text-gray-500" : "text-gray-400"
                            }`}
                          >
                            Supports: PDF, DOC, XLS, JPG, PNG
                          </span>
                        </div>
                        <input
                          type="file"
                          onChange={handleCreateFileChange}
                          className="hidden"
                          accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                        />
                      </label>
                    </div>
                  )}
                </div>
              </div>

            </form>
          </div>

          <div className={`p-6 pt-4 border-t ${darkMode ? "border-zinc-700 bg-zinc-800" : "border-gray-200 bg-white"}`}>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('❌ Cancel button clicked');
                  onClose();
                }}
                disabled={isSubmitting}
                className={`px-6 py-2 rounded-lg ${
                  darkMode
                    ? "bg-zinc-700 hover:bg-zinc-600 text-white"
                    : "bg-gray-200 hover:bg-gray-300 text-gray-800"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                Cancel
              </button>
              <button
                type="submit"
                form="create-task-form"
                disabled={isSubmitting}
                className={`px-6 py-2 rounded-lg text-white ${
                  darkMode
                    ? "bg-purple-600 hover:bg-purple-700"
                    : "bg-purple-600 hover:bg-purple-700"
                } disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Creating...
                  </>
                ) : (
                  "Create Task"
                )}
              </button>
            </div>
          </div>
          </div>
        </div>
      )}
    </>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};

export default CreateTaskModal;