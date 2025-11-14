"use client";

import type React from "react";

import { Card, CardContent } from "@/components/ui/card";
import { Dialog } from "@headlessui/react";
import { MessageSquare, Paperclip, Trash2, Users, X } from "lucide-react";
import DataTable from "react-data-table-component";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useEffect, useMemo, useState } from "react";
import CreateTaskModal from "@/pages/Tasks/CreateTaskModal";
import TaskDetailView from "@/pages/Tasks/TaskDetailView";
import type {
  Task,
  SubTask,
  Project,
  FileAttachment,
  TasksProps,
  IndependentTaskReadDto,
  IndependentTaskStatus,
  IndependentTaskPriority,
  ProjectTaskUpdateDto,
  IndependentTaskUpdateDto,
  TodoItemUpdateDto,
  PersonalTodoUpdateDto,
  TaskPriority,
  TaskStatus,
} from "@/types/taskTypes";
import { useTasks } from "@/context/TaskContext";
import { userService, UserSummary } from "@/services/userService";
import { useAuth } from "@/context/AuthContext";
import { projectAssignmentService } from "@/services/projectAssignmentService";

// Temporary: Add this to see exactly what your backend returns
const debugBackendResponses = async () => {
  console.log("🔍 Debugging backend responses...");

  try {
    // Test independent tasks endpoint directly
    const independentResponse = await fetch(
      "http://localhost:8080/api/independent-tasks"
    );
    console.log("📦 Independent tasks raw fetch:", {
      status: independentResponse.status,
      statusText: independentResponse.statusText,
      ok: independentResponse.ok,
      headers: Object.fromEntries(independentResponse.headers.entries()),
    });

    if (independentResponse.ok) {
      const independentData = await independentResponse.json();
      console.log("📦 Independent tasks data:", independentData);
    }

    // Test project tasks endpoint directly
    const projectResponse = await fetch(
      "http://localhost:8080/api/ProjectTask/Get-all-tasks"
    );
    console.log("📦 Project tasks raw fetch:", {
      status: projectResponse.status,
      statusText: projectResponse.statusText,
      ok: projectResponse.ok,
    });

    if (projectResponse.ok) {
      const projectData = await projectResponse.json();
      console.log("📦 Project tasks data:", projectData);
    }
  } catch (error) {
    console.error("💥 Debug fetch failed:", error);
  }
};

const MyTasks = ({ darkMode, initialProjectId, showHeader = true }: TasksProps & { showHeader?: boolean }) => {
  const {
    state,
    fetchTasks,
    updateTask,
    deleteTask,
    restoreTask,
    reassignTask,
  } = useTasks();
  const { user: currentUser } = useAuth(); // Get authenticated user from AuthContext

  const [selectedTaskId, setSelectedTaskId] = useState<string>("");
  const [selectedSubTask, setSelectedSubTask] = useState<SubTask | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    initialProjectId || ""
  );
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [showTableView, setShowTableView] = useState(true);
  const [showMembersSidebar, setShowMembersSidebar] = useState(false);
  const [showDeleted, setShowDeleted] = useState(false);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [newAssignee, setNewAssignee] = useState("");
  const [editModal, setEditModal] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [searchText, setSearchText] = useState("");
  const [newComment, setNewComment] = useState("");
  const [searchFilters, setSearchFilters] = useState({
    status: "",
    priority: "",
    assignee: "",
  });
  const [showRightPanel, setShowRightPanel] = useState(false);
  const [selectedAttachment, setSelectedAttachment] =
    useState<FileAttachment | null>(null);
  const [selectedIndependentTask, setSelectedIndependentTask] =
    useState<IndependentTaskReadDto | null>(null);
  const [allUsers, setAllUsers] = useState<UserSummary[]>([]);
  const [availableProjects, setAvailableProjects] = useState<Project[]>([]);

  // Filter tasks to show only those created by the current user
  // NOTE: Backend now provides /api/independent-tasks/created which should filter by creator
  // But we still need frontend filtering for backward compatibility and Project tasks
  const tasks = useMemo(() => {
    if (!currentUser) {
      console.log("🔍 MyTasks - No current user, returning empty array");
      return [];
    }

    console.log("🔍 MyTasks - Current user object:", {
      id: currentUser.id,
      username: currentUser.username,
      name: currentUser.name,
      email: currentUser.email,
    });

    // Pre-calculate user identifiers for comparison
    const usernameLower = (currentUser.username || "").toLowerCase();
    const nameLower = (currentUser.name || "").toLowerCase();
    const emailLower = (currentUser.email || "").toLowerCase();
    const emailUsernamePart = emailLower.split("@")[0];
    const userIdLower = currentUser.id.toLowerCase();

    let debugCount = 0;
    const filtered = state.tasks.filter((task) => {
      // Filter out personal todo tasks
      if (task.type === "Personal") return false;

      // PRIORITY 1: Check if backend already marked this task as created by me
      const taskWithMarker = task as Task & { _isCreatedByMe?: boolean };
      if (taskWithMarker._isCreatedByMe === true) {
        if (debugCount < 5) {
          console.log(
            `✅ Task "${task.title}" - Marked by backend as created by me`,
            {
              assignee: task.assignee,
              createdBy: task.createdByUserId,
              _isCreatedByMe: taskWithMarker._isCreatedByMe,
            }
          );
          debugCount++;
        }
        return true; // Trust the backend filtering
      }

      // PRIORITY 2: Check if task was created by current user (using createdByUserId field)
      const createdByLower = (task.createdByUserId || "").toLowerCase();
      const hasCreatedBy = createdByLower && createdByLower.trim() !== "";

      const isCreatedByUser =
        hasCreatedBy &&
        (createdByLower === userIdLower ||
          createdByLower === usernameLower ||
          createdByLower === nameLower ||
          createdByLower === emailUsernamePart);

      // ✅ DEBUG: Log comparison details for Project tasks
      if (task.type === "Project" && debugCount < 3) {
        console.log("🔍 DETAILED COMPARISON for:", task.title);
        console.log("   createdByUserId:", task.createdByUserId);
        console.log("   createdByLower:", createdByLower);
        console.log("   userIdLower:", userIdLower);
        console.log("   Match?", createdByLower === userIdLower);
        console.log("   hasCreatedBy?", hasCreatedBy);
        console.log("   isCreatedByUser?", isCreatedByUser);
      }

      // Check if task is assigned to current user
      const assigneeLower = (task.assignee || "").toLowerCase();
      const isAssignedToCurrentUser =
        assigneeLower === usernameLower ||
        assigneeLower === nameLower ||
        assigneeLower === emailUsernamePart ||
        assigneeLower === userIdLower;

      // ✅ AUTHORED TASKS: Show ONLY tasks created by current user
      let shouldShow;
      if (hasCreatedBy) {
        // Has creator info - show if created by current user
        shouldShow = isCreatedByUser;
      } else {
        // No creator info - for backward compatibility, show if:
        // 1. Task is NOT assigned to current user (likely they created it)
        // 2. OR task is unassigned (likely they created it)
        shouldShow = !isAssignedToCurrentUser || !task.assignee;
      }

      // Debug logging for first few tasks
      if (debugCount < 5) {
        console.log(`🔍 Task "${task.title}" check:`, {
          assignee: task.assignee,
          createdBy: task.createdByUserId,
          _isCreatedByMe: taskWithMarker._isCreatedByMe,
          hasCreatedBy,
          isCreatedByUser,
          isAssignedToCurrentUser,
          shouldShow,
        });
        debugCount++;
      }

      return shouldShow;
    });

    console.log("═══════════════════════════════════════════");
    console.log("📝 MyTasks - AUTHORED TASKS FILTERING");
    console.log("═══════════════════════════════════════════");
    console.log("🔍 Current User ID:", userIdLower);
    console.log("🔍 Total tasks:", state.tasks.length);
    console.log(
      "🔍 Non-personal tasks:",
      state.tasks.filter((t) => t.type !== "Personal").length
    );
    console.log("✅ AUTHORED tasks (created by me):", filtered.length);
    console.log(
      "📊 Tasks with createdBy info:",
      state.tasks.filter((t) => t.type !== "Personal" && t.createdByUserId)
        .length
    );
    console.log(
      "📊 Tasks WITHOUT createdBy info:",
      state.tasks.filter((t) => t.type !== "Personal" && !t.createdByUserId)
        .length
    );
    console.log(
      "📊 Tasks assigned to me:",
      state.tasks.filter(
        (t) =>
          t.type !== "Personal" &&
          (t.assignee || "").toLowerCase() === userIdLower
      ).length
    );
    console.log(
      "🔍 MyTasks - All non-personal tasks:",
      state.tasks
        .filter((t) => t.type !== "Personal")
        .slice(0, 5)
        .map((t) => ({
          title: t.title,
          assignee: t.assignee,
          createdBy: t.createdByUserId,
          hasCreatedBy: !!(t.createdByUserId && t.createdByUserId.trim()),
          _isCreatedByMe: (t as any)._isCreatedByMe,
        }))
    );
    console.log(
      "🔍 MyTasks - Filtered tasks:",
      filtered.slice(0, 5).map((t) => ({
        title: t.title,
        type: t.type,
        assignee: t.assignee,
        createdBy: t.createdByUserId,
        _isCreatedByMe: (t as any)._isCreatedByMe,
      }))
    );

    // ✅ NEW: Show all Project tasks with their creator info
    const projectTasks = state.tasks.filter((t) => t.type === "Project");
    console.log("📋 ALL PROJECT TASKS (" + projectTasks.length + "):");
    projectTasks.forEach((t, idx) => {
      if (idx < 10) {
        // Show first 10
        console.log(
          `   ${idx + 1}. "${t.title}" - Creator: ${
            t.createdByUserId || "NULL"
          }, Type: ${t.type}, ID: ${t.id}`
        );
      }
    });
    console.log("═══════════════════════════════════════════");

    return filtered;
  }, [state.tasks, currentUser]);

  // Function to refresh selected task data after updates
  const refreshSelectedTask = useMemo(() => {
    return () => {
      if (selectedIndependentTask) {
        // Find the updated task from the state
        const updatedTask = state.tasks.find(
          (t) =>
            t.taskId === selectedIndependentTask.taskId &&
            t.type === "Independent"
        );
        if (updatedTask) {
          // Convert back to IndependentTaskReadDto format
          const updatedIndependentTask: IndependentTaskReadDto = {
            taskId: updatedTask.taskId!,
            title: updatedTask.title,
            description: updatedTask.description,
            createdAt: updatedTask.createdAt || new Date().toISOString(),
            updatedAt: updatedTask.updatedAt,
            dueDate: updatedTask.dueDate || new Date().toISOString(),
            status: updatedTask.status as unknown as IndependentTaskStatus,
            progress: updatedTask.progress,
            weight: updatedTask.weight || 0,
            priority:
              updatedTask.priority as unknown as IndependentTaskPriority,
            createdByUserId: "",
            assignedToUserId: updatedTask.assignee || "",
            isCompleted: updatedTask.isCompleted,
            isOverdue: false,
            daysUntilDue: 0,
          };
          setSelectedIndependentTask(updatedIndependentTask);
        }
      }
    };
  }, [selectedIndependentTask, state.tasks]);

  // ✅ NEW: Fetch actual projects from database (role-based filtered)
  const [projects, setProjects] = useState<Project[]>([]);

  // Fetch projects from database on component mount
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const { projectService } = await import("@/services");
        const response = await projectService.getAllProjects();

        if (response.success && response.data) {
          console.log(
            "✅ Projects fetched from database:",
            response.data.length
          );
          console.log(
            "📊 Backend filtered projects by user role:",
            response.data
          );

          // Map backend ProjectDto to frontend Project interface
          const mappedProjects: Project[] = response.data.map((p: any) => ({
            id: p.id?.toString() || p.Id?.toString() || "", // Handle both id and Id
            name: p.projectName || p.title || "Unnamed Project",
            members: [], // Members not needed for dropdown
          }));

          setProjects(mappedProjects);
          console.log(
            "✅ Projects available for task creation:",
            mappedProjects.length
          );
        } else {
          console.warn("⚠️ No projects returned from backend");
          setProjects([]);
        }
      } catch (error) {
        console.error("❌ Error fetching projects:", error);
        setProjects([]);
      }
    };

    fetchProjects();
  }, []); // Run once on mount

  useEffect(() => {
    debugBackendResponses();
    (async () => {
      try {
        await fetchTasks();
      } catch (error) {
        console.error("Failed to fetch tasks:", error);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch users from backend for member list
  useEffect(() => {
    (async () => {
      try {
        const response = await userService.getAllUsers();
        if (response.success && response.data) {
          console.log("👥 Raw users from backend:", response.data);
          console.log("👥 First user sample:", response.data[0]);
          setAllUsers(response.data);
        } else {
          console.log("❌ No user data in response");
          setAllUsers([]);
        }
      } catch (error) {
        console.error("❌ Failed to fetch users:", error);
        // Fallback to empty array if API fails
        setAllUsers([]);
      }
    })();
  }, []);

  // Fetch available projects for the current user
  useEffect(() => {
    (async () => {
      console.log(
        "🔍 Project fetch useEffect triggered. CurrentUser:",
        currentUser
      );

      if (!currentUser?.id) {
        console.log(
          "⚠️ No current user ID available yet, skipping project fetch"
        );
        return;
      }

      try {
        console.log("📦 Fetching user projects for:", currentUser.id);
        const response = await projectAssignmentService.getUserProjects(
          currentUser.id
        );
        console.log("📦 User projects response:", response);
        console.log("📦 Response type:", typeof response);
        console.log("📦 Response.data:", response.data);
        console.log("📦 Response.success:", response.success);

        // API returns { data: [...], success: true }
        const projectsData =
          response.success && response.data ? response.data : response;
        console.log("📦 Projects data to map:", projectsData);
        console.log("📦 Is array?:", Array.isArray(projectsData));

        if (Array.isArray(projectsData)) {
          // Map the response to the Project format expected by CreateTaskModal
          // Backend returns UserProjectDto with ProjectId (number) and ProjectName (string)
          const mappedProjects: Project[] = projectsData.map(
            (assignment: unknown) => {
              // Backend returns PascalCase: ProjectId, ProjectName
              const a = assignment as Record<string, unknown>;
              const projectId = a.ProjectId || a.projectId;
              const projectName = a.ProjectName || a.projectName;

              console.log("📦 Mapping assignment:", {
                raw: a,
                projectId,
                projectName,
              });

              return {
                id: projectId?.toString() || "",
                name: (projectName as string) || `Project ${projectId}`,
                members: [],
              };
            }
          );
          console.log("📦 Mapped projects:", mappedProjects);
          console.log("📦 Projects count:", mappedProjects.length);
          setAvailableProjects(mappedProjects);
        } else {
          console.log("❌ Projects response is not an array:", response);
          setAvailableProjects([]);
        }
      } catch (error) {
        console.error("❌ Failed to fetch user projects:", error);
        setAvailableProjects([]);
      }
    })();
  }, [currentUser]);

  // Refresh selected task when tasks state changes
  useEffect(() => {
    refreshSelectedTask();
  }, [refreshSelectedTask]);

  const selectedTask = tasks.find((t) => t.id === selectedTaskId);

  const baseFiltered = useMemo(() => {
    return tasks.filter((task) => {
      const matchesProject =
        !selectedProjectId ||
        task.projectId === selectedProjectId ||
        task.projectId === "";
      const matchesMember = !selectedMember || task.assignee === selectedMember;
      return matchesProject && matchesMember;
    });
  }, [tasks, selectedProjectId, selectedMember]);

  const filteredTasks = useMemo(() => {
    let result = baseFiltered.filter((t) =>
      showDeleted ? t.deleted : !t.deleted
    );
    if (searchText) {
      const s = searchText.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(s) ||
          t.description.toLowerCase().includes(s) ||
          // t.key?.toLowerCase().includes(s) ||
          (t.assignee && t.assignee.toLowerCase().includes(s))
      );
    }
    if (searchFilters.status)
      result = result.filter((t) => t.status === searchFilters.status);
    if (searchFilters.priority)
      result = result.filter((t) => t.priority === searchFilters.priority);
    if (searchFilters.assignee)
      result = result.filter((t) => t.assignee === searchFilters.assignee);
    return result;
  }, [baseFiltered, showDeleted, searchText, searchFilters]);

  const projectMembers = allUsers.map((user) => {
    // Create full name with fallback to email
    const firstName = user.firstName || "";
    const lastName = user.lastName || "";
    const fullName = `${firstName} ${lastName}`.trim();
    const displayName = fullName || user.email?.split("@")[0] || user.id;

    return {
      id: user.id,
      name: displayName,
      role: user.role || "User",
      projectId: user.department ? [user.department] : [],
    };
  });

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleReassign = async () => {
    if (!selectedTask || !newAssignee) return;

    if (selectedTask.type === "Independent" && selectedTask.taskId) {
      await reassignTask(selectedTask.taskId, newAssignee, "Independent");
    } else {
      updateTask(
        selectedTask.id,
        {
          assignedMemberId: newAssignee,
        },
        selectedTask.type
      );
    }

    setShowReassignModal(false);
    // Refresh the selected task data
    refreshSelectedTask();
    toast.success("Task reassigned successfully!", {
      position: "top-right",
      autoClose: 2000,
      theme: darkMode ? "dark" : "light",
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const f = e.target.files[0];

    // Handle both selectedTask and selectedIndependentTask
    const currentTask =
      selectedTask ||
      (selectedIndependentTask
        ? {
            id: selectedIndependentTask.taskId.toString(),
            type: "Independent" as const,
            files: [],
          }
        : null);

    if (!currentTask) return;

    if (currentTask.type === "Independent") {
      // For independent tasks, we'll need to implement file upload to backend
      // For now, just show a message
      toast.info("File upload for independent tasks coming soon!", {
        position: "top-right",
        autoClose: 3000,
        theme: darkMode ? "dark" : "light",
      });
    } else {
      // For project tasks, use the existing logic
      const files = [
        ...(currentTask.files || []),
        {
          id: `${Date.now()}-${f.name}`,
          name: f.name,
          size: f.size,
          type: f.type,
          url: URL.createObjectURL(f),
          lastModified: f.lastModified,
        },
      ];
      updateTask(
        currentTask.id,
        { files } as
          | ProjectTaskUpdateDto
          | IndependentTaskUpdateDto
          | TodoItemUpdateDto
          | PersonalTodoUpdateDto,
        currentTask.type
      );
    }
  };

  const handleDeleteAttachment = (taskId: string, fileName: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    updateTask(
      task.id,
      { files: (task.files || []).filter((f) => f.name !== fileName) } as
        | ProjectTaskUpdateDto
        | IndependentTaskUpdateDto
        | TodoItemUpdateDto
        | PersonalTodoUpdateDto,
      task.type
    );
  };

  const handleSoftDelete = (
    taskId: string,
    type: "Project" | "Independent" | "Todo" | "Personal"
  ) => {
    if (window.confirm("Move this task to trash? You can restore it later.")) {
      deleteTask(taskId, type);
      toast.success("Task moved to trash", {
        position: "top-right",
        autoClose: 3000,
        theme: darkMode ? "dark" : "light",
      });
    }
  };

  const handleRestoreTask = (taskId: string) => {
    if (window.confirm("Restore this task?")) {
      const task = tasks.find((t) => t.id === taskId);
      if (task) {
        restoreTask(taskId, task.type);
        toast.success("Task restored", {
          position: "top-right",
          autoClose: 3000,
          theme: darkMode ? "dark" : "light",
        });
      }
    }
  };

  const handleProjectChange = (projectId: string) => {
    setSelectedProjectId(projectId);
    setSelectedMember(null);
    if (projectId && selectedTask && selectedTask.projectId !== projectId) {
      setSelectedTaskId("");
    }
  };

  const columns = [
    {
      name: "Key",
      selector: (row: Task) => row.taskId || 0,
      sortable: true,
      width: "90px",
    },
    {
      name: "Title",
      selector: (row: Task) => row.title,
      sortable: true,
      grow: 2,
      cell: (row: Task) => (
        <div className="min-w-[180px]">
          <div className="font-medium">{row.title}</div>
          <div
            className={`text-sm ${
              darkMode ? "text-gray-400" : "text-gray-500"
            } truncate`}
          >
            {row.description}
          </div>
          <div
            className={`text-xs ${
              darkMode ? "text-gray-500" : "text-gray-400"
            }`}
          >
            Type: {row.type}
          </div>
        </div>
      ),
    },
    {
      name: "Priority",
      selector: (row: Task) => row.priority,
      sortable: true,
      width: "110px",
      cell: (row: Task) => (
        <span
          className={`text-xs px-2 py-1 rounded-full ${
            row.priority === "High"
              ? darkMode
                ? "bg-red-300 text-red-900"
                : "bg-red-100 text-red-800"
              : row.priority === "Medium"
              ? darkMode
                ? "bg-yellow-100 text-yellow-900"
                : "bg-yellow-100 text-yellow-800"
              : darkMode
              ? "bg-green-300 text-green-900"
              : "bg-green-100 text-green-800"
          }`}
        >
          {row.priority}
        </span>
      ),
    },
    {
      name: "Assignee",
      selector: (row: Task) => row.assignee || "Unassigned",
      sortable: true,
      width: "140px",
    },
    {
      name: "Project",
      selector: (row: Task) =>
        projects.find((p) => p.id === row.projectId)?.name ||
        (row.projectId ? row.projectId : "Independent"),
      sortable: true,
      width: "150px",
    },
    {
      name: "Type",
      selector: (row: Task) => row.type,
      sortable: true,
      width: "120px",
      cell: (row: Task) => (
        <span
          className={`text-xs px-2 py-1 rounded-full ${
            row.type === "Project"
              ? darkMode
                ? "bg-blue-300 text-blue-900"
                : "bg-blue-100 text-blue-800"
              : darkMode
              ? "bg-purple-300 text-purple-900"
              : "bg-purple-100 text-purple-800"
          }`}
        >
          {row.type}
        </span>
      ),
    },
    {
      name: "Progress",
      selector: (row: Task) => row.progress,
      sortable: true,
      width: "150px",
      cell: (row: Task) => (
        <div className="flex items-center">
          <div
            className={`w-20 h-2 rounded-full ${
              darkMode ? "bg-gray-700" : "bg-gray-200"
            }`}
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
            />
          </div>
          <span className="ml-2 text-sm">{row.progress}%</span>
        </div>
      ),
    },
    {
      name: "Actions",
      width: "120px",
      button: true,
      cell: (row: Task) => (
        <div className="flex space-x-2">
          {!row.deleted ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleSoftDelete(row.id, row.type);
              }}
              aria-label="Delete task"
              title="Delete task"
              className={`text-xs px-2 py-1 rounded ${
                darkMode
                  ? "bg-red-900 hover:bg-red-800 text-red-300"
                  : "bg-red-100 hover:bg-red-200 text-red-800"
              }`}
            >
              <Trash2 size={16} />
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRestoreTask(row.id);
              }}
              className={`text-xs px-2 py-1 rounded ${
                darkMode
                  ? "bg-green-900 hover:bg-green-800 text-green-300"
                  : "bg-green-100 hover:bg-green-200 text-green-800"
              }`}
            >
              Restore
            </button>
          )}
        </div>
      ),
    },
  ];

  const customStyles = {
    headRow: {
      style: {
        backgroundColor: darkMode ? "#27272a" : "#e5e7eb",
        color: darkMode ? "#f3f4f6" : "#111827",
        fontWeight: "bold",
        fontSize: "0.75rem",
        textTransform: "uppercase" as const,
        minHeight: "44px",
      },
    },
    headCells: { style: { paddingLeft: "12px", paddingRight: "12px" } },
    cells: {
      style: {
        paddingLeft: "12px",
        paddingRight: "12px",
        color: darkMode ? "#e5e7eb" : "#111827",
      },
    },
    rows: {
      style: {
        minHeight: "60px",
        backgroundColor: darkMode ? "#1e1e1e" : "#ffffff",
        "&:hover": { backgroundColor: darkMode ? "#2a2a2e" : "#f7f7f9" },
        "&:not(:last-of-type)": {
          borderBottomColor: darkMode ? "#3f3f46" : "#e5e7eb",
        },
      },
    },
    pagination: {
      style: {
        backgroundColor: darkMode ? "#1e1e1e" : "#ffffff",
        borderTopColor: darkMode ? "#3f3f46" : "#e5e7eb",
        color: darkMode ? "#e5e7eb" : "#111827",
      },
    },
  };

  return (
    <div
      className={`${
        darkMode ? "bg-zinc-800 text-gray-100" : "bg-white text-gray-800"
      }`}
    >
      <ToastContainer />
      <CreateTaskModal
        open={showModal}
        onClose={() => setShowModal(false)}
        initialProjectId={selectedProjectId}
        projects={availableProjects.length > 0 ? availableProjects : projects}
        darkMode={darkMode}
        allMembers={allUsers.map((user) => {
          // Create full name with fallback to email
          const firstName = user.firstName || "";
          const lastName = user.lastName || "";
          const fullName = `${firstName} ${lastName}`.trim();
          const displayName = fullName || user.email?.split("@")[0] || user.id;

          return {
            id: user.id, // Use actual user ID (GUID)
            name: displayName,
            role: user.role || "User",
            projectId: [], // Will be populated based on project assignments
            department: user.department || "Unknown", // ✅ NEW: Include department for filtering
          };
        })}
        onCreate={async () => {
          await new Promise((resolve) => setTimeout(resolve, 500));
          console.log("🔄 Refreshing task list...");
          await fetchTasks();
          console.log("✅ Task list refreshed");
        }}
      />
      <div className="flex">
        <div
          className={`${
            showMembersSidebar && !selectedTaskId ? "w-4/5" : "w-full"
          } p-4`}
        >
          {showTableView ? (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold mb-4">
                {selectedProjectId
                  ? `Tasks in ${
                      projects.find((p) => p.id === selectedProjectId)?.name ||
                      "Project"
                    }`
                  : "All Tasks"}
                {selectedMember && ` (Assigned to ${selectedMember})`}
              </h2>
              <div className="flex items-center justify-between gap-3">
                <div className="flex gap-4">
                  <button
                    className={`flex items-center p-2 px-4 rounded-lg ${
                      darkMode
                        ? "bg-zinc-700 hover:bg-zinc-600"
                        : "bg-gray-200 hover:bg-gray-300"
                    }`}
                    onClick={() => setShowMembersSidebar(!showMembersSidebar)}
                  >
                    <Users size={16} className="mr-2" />{" "}
                    {showMembersSidebar ? "Hide Members" : "Show Members"}
                  </button>
                  <button
                    onClick={() => setShowDeleted(!showDeleted)}
                    className={`px-3 py-2 rounded-lg ${
                      darkMode
                        ? "bg-gray-700 hover:bg-gray-600"
                        : "bg-gray-200 hover:bg-gray-300"
                    }`}
                  >
                    {showDeleted ? "Hide Deleted" : "Show Deleted"}
                  </button>
                </div>
                <button
                  onClick={() => setShowModal(true)}
                  className={`px-3 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 ${
                    darkMode
                      ? "bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-500/20"
                      : "bg-purple-900 hover:bg-purple-700 shadow-md shadow-purple-400/20"
                  } text-white`}
                >
                  Create New Task
                </button>
              </div>
              <Card className={`mb-8 ${darkMode ? "bg-zinc-800" : "bg-white"}`}>
                <CardContent className="p-0">
                  <div
                    className={`p-4 border-b ${
                      darkMode ? "border-zinc-700" : "border-gray-200"
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <h2 className="text-lg font-semibold">Tasks</h2>
                        <p
                          className={`text-sm ${
                            darkMode ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          Showing {filteredTasks.length} tasks (Project &
                          Independent only)
                        </p>
                      </div>
                      <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                        <div className="relative flex-1">
                          <input
                            type="text"
                            placeholder="Search tasks..."
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            aria-label="Search tasks"
                            title="Search tasks"
                            className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                              darkMode
                                ? "bg-zinc-700 border-zinc-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-600"
                                : "bg-white border-gray-300 text-gray-800 placeholder-gray-500 focus:border-blue-400 focus:ring-blue-300"
                            } focus:outline-none focus:ring-2`}
                          />
                          <div
                            className={`absolute left-3 top-2.5 ${
                              darkMode ? "text-gray-400" : "text-gray-500"
                            }`}
                          >
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
                        <div className="flex gap-2">
                          <select
                            value={searchFilters.status}
                            onChange={(e) =>
                              setSearchFilters({
                                ...searchFilters,
                                status: e.target.value,
                              })
                            }
                            aria-label="Filter by status"
                            title="Filter by status"
                            className={`p-2 rounded-md border ${
                              darkMode
                                ? "bg-zinc-700 border-zinc-600"
                                : "bg-white border-gray-300"
                            }`}
                          >
                            <option key="all-status" value="">
                              All Statuses
                            </option>
                            <option key="pending" value="Pending">
                              Pending
                            </option>
                            <option key="accepted" value="Accepted">
                              Accepted
                            </option>
                            <option key="in-progress" value="InProgress">
                              In Progress
                            </option>
                            <option key="waiting" value="WaitingForReview">
                              Waiting Review
                            </option>
                            <option key="completed" value="Completed">
                              Completed
                            </option>
                            <option key="rejected" value="Rejected">
                              Rejected
                            </option>
                          </select>
                          <select
                            value={searchFilters.priority}
                            onChange={(e) =>
                              setSearchFilters({
                                ...searchFilters,
                                priority: e.target.value,
                              })
                            }
                            aria-label="Filter by priority"
                            title="Filter by priority"
                            className={`p-2 rounded-md border ${
                              darkMode
                                ? "bg-zinc-700 border-zinc-600"
                                : "bg-white border-gray-300"
                            }`}
                          >
                            <option key="all-priority" value="">
                              All Priorities
                            </option>
                            <option key="low" value="Low">
                              Low
                            </option>
                            <option key="medium" value="Medium">
                              Medium
                            </option>
                            <option key="high" value="High">
                              High
                            </option>
                            <option key="critical" value="Critical">
                              Critical
                            </option>
                          </select>
                          <select
                            value={searchFilters.assignee}
                            onChange={(e) =>
                              setSearchFilters({
                                ...searchFilters,
                                assignee: e.target.value,
                              })
                            }
                            aria-label="Filter by assignee"
                            title="Filter by assignee"
                            className={`p-2 rounded-md border ${
                              darkMode
                                ? "bg-zinc-700 border-zinc-600"
                                : "bg-white border-gray-300"
                            }`}
                          >
                            <option key="all-assignee" value="">
                              All Assignees
                            </option>
                            {Array.from(
                              new Set(tasks.map((t) => t.assignee))
                            ).map((a) => (
                              <option key={a || "unassigned"} value={a}>
                                {a || "Unassigned"}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                  <DataTable
                    columns={columns}
                    data={filteredTasks}
                    customStyles={customStyles}
                    dense
                    onRowClicked={(row) => {
                      if (row.type === "Independent") {
                        // For independent tasks, we need to fetch the full task data
                        const independentTask = state.tasks.find(
                          (t) => t.id === row.id && t.type === "Independent"
                        );
                        if (independentTask) {
                          // Convert Task to IndependentTaskReadDto format
                          const independentTaskDto: IndependentTaskReadDto = {
                            taskId:
                              independentTask.taskId ||
                              parseInt(independentTask.id),
                            title: independentTask.title,
                            description: independentTask.description,
                            createdAt:
                              independentTask.createdAt ||
                              new Date().toISOString(),
                            updatedAt: independentTask.updatedAt,
                            dueDate:
                              independentTask.dueDate ||
                              new Date().toISOString(),
                            status:
                              independentTask.status as unknown as IndependentTaskStatus, // Type conversion needed
                            progress: independentTask.progress,
                            weight: independentTask.weight || 0,
                            priority:
                              independentTask.priority as unknown as IndependentTaskPriority, // Type conversion needed
                            createdByUserId: "", // Will be populated from backend
                            assignedToUserId: independentTask.assignee || "",
                            isCompleted: independentTask.isCompleted,
                            isOverdue: false, // Will be calculated
                            daysUntilDue: 0, // Will be calculated
                          };
                          setSelectedIndependentTask(independentTaskDto);
                          setShowTableView(false);
                        }
                      } else {
                        setSelectedTaskId(row.id);
                        setShowTableView(false);
                      }
                    }}
                    highlightOnHover
                    pointerOnHover
                    pagination
                    paginationPerPage={10}
                    paginationRowsPerPageOptions={[5, 10, 15, 20]}
                    theme={darkMode ? "dark" : "light"}
                    noDataComponent={
                      <div
                        className={`p-8 text-center ${
                          darkMode ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        {searchText ||
                        Object.values(searchFilters).some(Boolean)
                          ? "No matching tasks found"
                          : "No tasks available"}
                      </div>
                    }
                    persistTableHead
                    responsive
                    striped={!darkMode}
                  />
                </CardContent>
              </Card>
            </div>
          ) : selectedIndependentTask || selectedTask ? (
            <TaskDetailView
              task={selectedIndependentTask || selectedTask!}
              darkMode={darkMode}
              projectName={
                selectedTask
                  ? projects.find((p) => p.id === String(selectedTask.projectId))?.name
                  : undefined
              }
              allUsers={allUsers.map((u) => ({
                id: u.id,
                name:
                  `${u.firstName || ""} ${u.lastName || ""}`.trim() ||
                  u.email?.split("@")[0] ||
                  u.id,
              }))}
              onBack={() => {
                setShowTableView(true);
                setSelectedTaskId("");
                setSelectedIndependentTask(null);
              }}
              onEdit={async () => {
                if (selectedIndependentTask) {
                  // Convert IndependentTaskReadDto back to Task for editing
                  const taskToEdit: Task = {
                    id: selectedIndependentTask.taskId.toString(),
                    taskId: selectedIndependentTask.taskId,
                    title: selectedIndependentTask.title,
                    description: selectedIndependentTask.description || "",
                    dueDate: selectedIndependentTask.dueDate,
                    priority:
                      selectedIndependentTask.priority as unknown as TaskPriority, // Type conversion needed
                    status:
                      selectedIndependentTask.status as unknown as TaskStatus, // Type conversion needed
                    progress: selectedIndependentTask.progress,
                    isCompleted: selectedIndependentTask.isCompleted,
                    type: "Independent",
                    assignee: selectedIndependentTask.assignedToUserId,
                    createdAt: selectedIndependentTask.createdAt,
                    updatedAt: selectedIndependentTask.updatedAt,
                    weight: selectedIndependentTask.weight,
                  };
                  setTaskToEdit(taskToEdit);
                } else if (selectedTask) {
                  setTaskToEdit(selectedTask);
                }
                setEditModal(true);
              }}
              onReassign={
                selectedTask || selectedIndependentTask
                  ? () => {
                      const currentTask =
                        selectedTask || selectedIndependentTask;
                      if (currentTask) {
                        const assignee =
                          selectedTask?.assignee ||
                          (selectedIndependentTask as IndependentTaskReadDto)
                            ?.assignedToUserId ||
                          "";
                        setNewAssignee(assignee);
                        setShowReassignModal(true);
                      }
                    }
                  : undefined
              }
              onFileChange={
                selectedTask || selectedIndependentTask
                  ? handleFileChange
                  : undefined
              }
              onDeleteAttachment={
                selectedTask || selectedIndependentTask
                  ? handleDeleteAttachment
                  : undefined
              }
              onSubtaskClick={
                selectedTask
                  ? (sub) => {
                      setSelectedSubTask(sub);
                      setShowRightPanel(true);
                    }
                  : undefined
              }
              formatFileSize={selectedTask ? formatFileSize : undefined}
              setSelectedAttachment={
                selectedTask ? setSelectedAttachment : undefined
              }
              newComment={selectedTask ? newComment : undefined}
              setNewComment={selectedTask ? setNewComment : undefined}
              showRightPanel={selectedTask ? showRightPanel : undefined}
              selectedSubtask={selectedTask ? selectedSubTask : undefined}
              onCloseRightPanel={
                selectedTask ? () => setShowRightPanel(false) : undefined
              }
              parentTask={selectedTask ? selectedTask : undefined}
              currentUserId={currentUser?.id || ""}
              isManager={
                currentUser?.role === "manager" ||
                currentUser?.role === "admin" ||
                false
              }
            />
          ) : null}

          <Dialog
            open={showReassignModal}
            onClose={() => setShowReassignModal(false)}
            className="fixed inset-0 z-50 overflow-y-auto"
          >
            <div className="flex items-center justify-center min-h-screen bg-black bg-opacity-50">
              <Dialog.Panel
                className={`p-6 rounded-lg w-96 ${
                  darkMode
                    ? "bg-zinc-800 text-gray-300"
                    : "bg-white text-gray-700"
                }`}
              >
                <Dialog.Title className="text-lg font-bold mb-4">
                  Reassign Task
                </Dialog.Title>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">
                    Current Assignee
                  </label>
                  <input
                    type="text"
                    value={(() => {
                      const assigneeId =
                        selectedTask?.assignee ||
                        (selectedIndependentTask as any)?.assignedToUserId;
                      if (!assigneeId) return "Unassigned";
                      // Map ID to name
                      const user = allUsers.find((u) => u.id === assigneeId);
                      return user
                        ? `${user.firstName || ""} ${
                            user.lastName || ""
                          }`.trim() ||
                            user.email?.split("@")[0] ||
                            assigneeId
                        : assigneeId;
                    })()}
                    readOnly
                    className={`w-full p-2 rounded-md ${
                      darkMode
                        ? "bg-zinc-700 text-gray-300 border border-gray-600"
                        : "bg-gray-100 text-gray-700 border border-gray-300"
                    }`}
                  />
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-1">
                    New Assignee
                  </label>
                  <select
                    value={newAssignee}
                    onChange={(e) => setNewAssignee(e.target.value)}
                    aria-label="Select new assignee"
                    title="Select new assignee"
                    className={`w-full p-2 rounded-md ${
                      darkMode
                        ? "bg-zinc-700 text-gray-300 border border-gray-600"
                        : "bg-gray-100 text-gray-700 border border-gray-300"
                    }`}
                  >
                    <option value="">Unassigned</option>
                    {allUsers.map((user) => {
                      const displayName =
                        `${user.firstName || ""} ${
                          user.lastName || ""
                        }`.trim() ||
                        user.email?.split("@")[0] ||
                        user.id;
                      return (
                        <option key={user.id} value={user.id}>
                          {displayName}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowReassignModal(false)}
                    className={`px-4 py-2 rounded ${
                      darkMode
                        ? "bg-gray-500 hover:bg-gray-600"
                        : "bg-gray-200 hover:bg-gray-300"
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReassign}
                    disabled={!newAssignee}
                    className={`px-4 py-2 rounded text-white ${
                      darkMode
                        ? "bg-fuchsia-600 hover:bg-fuchsia-700 disabled:bg-gray-500"
                        : "bg-fuchsia-700 hover:bg-fuchsia-600 disabled:bg-gray-300"
                    }`}
                  >
                    Confirm
                  </button>
                </div>
              </Dialog.Panel>
            </div>
          </Dialog>

          <Dialog
            open={editModal}
            onClose={() => setEditModal(false)}
            className="fixed inset-0 z-50 overflow-y-auto"
          >
            <div className="flex items-center justify-center min-h-screen bg-black bg-opacity-50">
              <Dialog.Panel
                className={`p-6 rounded-lg w-96 ${
                  darkMode
                    ? "bg-zinc-800 text-gray-300"
                    : "bg-white text-gray-700"
                }`}
              >
                <Dialog.Title className="text-lg font-bold mb-4">
                  Edit Task
                </Dialog.Title>
                {taskToEdit && (
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      try {
                        if (taskToEdit.type === "Independent") {
                          await updateTask(
                            taskToEdit.id,
                            {
                              taskId: taskToEdit.taskId!,
                              title: taskToEdit.title,
                              description: taskToEdit.description,
                              dueDate: taskToEdit.dueDate,
                              priority:
                                taskToEdit.priority as unknown as IndependentTaskPriority,
                              weight: taskToEdit.weight || 0,
                            } as IndependentTaskUpdateDto,
                            "Independent"
                          );
                        } else {
                          await updateTask(
                            taskToEdit.id,
                            {
                              title: taskToEdit.title,
                              description: taskToEdit.description,
                              dueDate: taskToEdit.dueDate,
                              priority: taskToEdit.priority,
                              weight: taskToEdit.weight,
                            } as ProjectTaskUpdateDto,
                            "Project"
                          );
                        }
                        setEditModal(false);
                        // Refresh the selected task data
                        refreshSelectedTask();
                        toast.success("Task updated successfully!", {
                          theme: darkMode ? "dark" : "light",
                        });
                      } catch (error) {
                        console.error("Update failed:", error);
                        toast.error(
                          "Failed to update task. Please try again.",
                          { theme: darkMode ? "dark" : "light" }
                        );
                      }
                    }}
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Title
                      </label>
                      <input
                        value={taskToEdit.title}
                        onChange={(e) =>
                          setTaskToEdit({
                            ...taskToEdit,
                            title: e.target.value,
                          })
                        }
                        aria-label="Task title"
                        title="Task title"
                        className={`w-full p-2 rounded-md border ${
                          darkMode
                            ? "bg-zinc-700 border-gray-600"
                            : "bg-white border-gray-300"
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Description
                      </label>
                      <textarea
                        value={taskToEdit.description}
                        onChange={(e) =>
                          setTaskToEdit({
                            ...taskToEdit,
                            description: e.target.value,
                          })
                        }
                        rows={3}
                        aria-label="Task description"
                        title="Task description"
                        className={`w-full p-2 rounded-md border ${
                          darkMode
                            ? "bg-zinc-700 border-gray-600"
                            : "bg-white border-gray-300"
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Due Date
                      </label>
                      <input
                        type="date"
                        value={taskToEdit.dueDate || ""}
                        onChange={(e) =>
                          setTaskToEdit({
                            ...taskToEdit,
                            dueDate: e.target.value,
                          })
                        }
                        aria-label="Task due date"
                        title="Task due date"
                        className={`w-full p-2 rounded-md border ${
                          darkMode
                            ? "bg-zinc-700 border-gray-600"
                            : "bg-white border-gray-300"
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Priority
                      </label>
                      <select
                        value={taskToEdit.priority}
                        onChange={(e) =>
                          setTaskToEdit({
                            ...taskToEdit,
                            priority: e.target.value as TaskPriority,
                          })
                        }
                        aria-label="Task priority"
                        title="Task priority"
                        className={`p-2 rounded-md border ${
                          darkMode
                            ? "bg-zinc-700 border-gray-600"
                            : "bg-white border-gray-300"
                        }`}
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                        <option value="Critical">Critical</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Weight
                      </label>
                      <input
                        type="number"
                        value={taskToEdit.weight || 0}
                        onChange={(e) =>
                          setTaskToEdit({
                            ...taskToEdit,
                            weight: Number(e.target.value),
                          })
                        }
                        aria-label="Task weight"
                        title="Task weight"
                        className={`w-24 p-2 rounded-md border ${
                          darkMode
                            ? "bg-zinc-700 border-gray-600"
                            : "bg-white border-gray-300"
                        }`}
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setEditModal(false)}
                        className={`px-4 py-2 rounded-md ${
                          darkMode
                            ? "bg-zinc-700 hover:bg-gray-600"
                            : "bg-gray-200 hover:bg-gray-300"
                        }`}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className={`px-4 py-2 rounded-md text-white ${
                          darkMode
                            ? "bg-purple-600 hover:bg-purple-500"
                            : "bg-purple-500 hover:bg-purple-400"
                        }`}
                      >
                        Save Changes
                      </button>
                    </div>
                  </form>
                )}
              </Dialog.Panel>
            </div>
          </Dialog>

          <Dialog
            open={!!selectedAttachment}
            onClose={() => setSelectedAttachment(null)}
          >
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <Dialog.Panel
                className={`w-full max-w-md rounded-lg p-6 ${
                  darkMode ? "bg-zinc-800" : "bg-white"
                }`}
              >
                {selectedAttachment && (
                  <>
                    <div className="flex justify-between items-start mb-4">
                      <Dialog.Title className="text-xl font-bold">
                        Attachment Details
                      </Dialog.Title>
                      <button
                        onClick={() => setSelectedAttachment(null)}
                        aria-label="Close attachment details"
                        title="Close attachment details"
                        className={`p-1 rounded-full ${
                          darkMode ? "hover:bg-zinc-700" : "hover:bg-gray-100"
                        }`}
                      >
                        <X size={20} />
                      </button>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center">
                        <Paperclip className="h-6 w-6 mr-3" />
                        <div>
                          <p className="font-medium">
                            {selectedAttachment.name}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {formatFileSize(selectedAttachment.size)} •{" "}
                            {selectedAttachment.type}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Type
                          </p>
                          <p>{selectedAttachment.type}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Size
                          </p>
                          <p>{formatFileSize(selectedAttachment.size)}</p>
                        </div>
                      </div>
                      <div className="flex justify-end space-x-3 pt-4">
                        <a
                          href={selectedAttachment.url}
                          download={selectedAttachment.name}
                          className={`px-4 py-2 rounded-md ${
                            darkMode
                              ? "bg-blue-600 hover:bg-blue-500"
                              : "bg-blue-500 hover:bg-blue-400"
                          } text-white`}
                        >
                          Download
                        </a>
                        <a
                          href={selectedAttachment.url}
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
                  </>
                )}
              </Dialog.Panel>
            </div>
          </Dialog>
        </div>
        {showMembersSidebar && !selectedTaskId && (
          <div
            className={`w-1/5 h-screen border border-double rounded-lg p-4 ${
              darkMode
                ? "bg-zinc-800 border-gray-600"
                : "bg-gray-50 border-gray-300"
            }`}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Members</h2>
              <button
                onClick={() => setShowMembersSidebar(false)}
                aria-label="Close members sidebar"
                title="Close members sidebar"
                className={`p-1 rounded ${
                  darkMode ? "hover:bg-zinc-700" : "hover:bg-gray-200"
                }`}
              >
                <X size={18} />
              </button>
            </div>
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-2">Project</h2>
              <div className="flex items-center mb-4">
                <select
                  value={selectedProjectId}
                  onChange={(e) => handleProjectChange(e.target.value)}
                  aria-label="Select project"
                  title="Select project"
                  className={`w-full p-2 rounded-md ${
                    darkMode
                      ? "bg-gray-600 text-white border border-gray-700"
                      : "bg-gray-100 border border-gray-300"
                  }`}
                >
                  <option value="">All Projects</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              {selectedProjectId && (
                <button
                  onClick={() => {}}
                  className={`w-full px-4 py-2 rounded-md flex items-center justify-center ${
                    darkMode
                      ? "bg-purple-600 hover:bg-purple-500 text-white"
                      : "bg-purple-100 hover:bg-purple-200 text-purple-800"
                  }`}
                >
                  <MessageSquare size={16} className="mr-2" /> Team Chat
                </button>
              )}
            </div>
            <div className="space-y-2">
              <h3
                className={`font-semibold ${
                  darkMode ? "text-gray-300" : "text-gray-500"
                }`}
              >
                {selectedProjectId ? "Project Members" : "All Members"}
              </h3>
              {projectMembers.length > 0 ? (
                projectMembers.map((member) => (
                  <div
                    key={`${member.projectId}-${member.id}`}
                    onClick={() => setSelectedMember(member.name)}
                    className={`p-3 rounded-md border cursor-pointer ${
                      selectedMember === member.name
                        ? darkMode
                          ? "bg-purple-400"
                          : "bg-purple-300"
                        : darkMode
                        ? "bg-zinc-700 hover:bg-zinc-600"
                        : "bg-white hover:bg-gray-100"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{member.name}</h4>
                        <span
                          className={`text-sm ${
                            darkMode ? "text-gray-300" : "text-gray-500"
                          }`}
                        >
                          {member.role}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div
                  className={`p-3 text-center ${
                    darkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  No members found{selectedProjectId ? " for this project" : ""}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyTasks;
