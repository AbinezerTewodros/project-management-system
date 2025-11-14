import { useState, useEffect, useMemo } from "react";
import { Calendar,Flag,UserCircle,Paperclip,CheckCircle,RefreshCw,Circle,MoreVertical, ChevronLeft,Edit,Trash2,Plus,
  X,Clock, AlertCircle, PlayCircle, Send,} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog } from "@headlessui/react";
import { useLocation } from "react-router-dom";
import DataTable from "react-data-table-component";
import { useTasks } from "@/context/TaskContext";
import { Task, TodoItemReadDto } from "@/types/taskTypes";
import { useAuth } from "@/context/AuthContext";
import { projectTaskService } from "@/services/projectTaskService";
import { todoItemService } from "@/services/todoItemService";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Subtask type for delegated tasks (local state only)
type Subtask = {
  id: string;
  title: string;
  type: "Subtask";
  weight: number;
  completed: boolean;
};

// Status configurations for ProjectTask
const TASK_STATUS_CONFIG = {
  Pending: {
    label: "Pending Acceptance",
    color: "bg-yellow-100 text-yellow-800 border-yellow-300",
    darkColor: "bg-yellow-900 text-yellow-200 border-yellow-700",
    icon: <Clock className="w-4 h-4 mr-2" />,
  },
  Accepted: {
    label: "Accepted",
    color: "bg-blue-100 text-blue-800 border-blue-300",
    darkColor: "bg-blue-900 text-blue-200 border-blue-700",
    icon: <CheckCircle className="w-4 h-4 mr-2" />,
  },
  Rejected: {
    label: "Rejected",
    color: "bg-red-100 text-red-800 border-red-300",
    darkColor: "bg-red-900 text-red-200 border-red-700",
    icon: <X className="w-4 h-4 mr-2" />,
  },
  InProgress: {
    label: "In Progress",
    color: "bg-purple-100 text-purple-800 border-purple-300",
    darkColor: "bg-purple-900 text-purple-200 border-purple-700",
    icon: <RefreshCw className="w-4 h-4 mr-2" />,
  },
  WaitingForReview: {
    label: "Waiting for Review",
    color: "bg-orange-100 text-orange-800 border-orange-300",
    darkColor: "bg-orange-900 text-orange-200 border-orange-700",
    icon: <Send className="w-4 h-4 mr-2" />,
  },
  Completed: {
    label: "Completed",
    color: "bg-green-100 text-green-800 border-green-300",
    darkColor: "bg-green-900 text-green-200 border-green-700",
    icon: <CheckCircle className="w-4 h-4 mr-2" />,
  },
};

// Status configurations for TodoItem
const TODO_STATUS_CONFIG = {
  Pending: {
    label: "Pending",
    color: "bg-yellow-100 text-yellow-800",
    darkColor: "bg-yellow-900 text-yellow-200",
    icon: <Clock className="w-3 h-3 mr-1" />,
  },
  Accepted: {
    label: "Accepted",
    color: "bg-blue-100 text-blue-800",
    darkColor: "bg-blue-900 text-blue-200",
    icon: <CheckCircle className="w-3 h-3 mr-1" />,
  },
  Rejected: {
    label: "Rejected",
    color: "bg-red-100 text-red-800",
    darkColor: "bg-red-900 text-red-200",
    icon: <X className="w-3 h-3 mr-1" />,
  },
  InProgress: {
    label: "In Progress",
    color: "bg-purple-100 text-purple-800",
    darkColor: "bg-purple-900 text-purple-200",
    icon: <PlayCircle className="w-3 h-3 mr-1" />,
  },
  WaitingForReview: {
    label: "Waiting Review",
    color: "bg-orange-100 text-orange-800",
    darkColor: "bg-orange-900 text-orange-200",
    icon: <Send className="w-3 h-3 mr-1" />,
  },
  Approved: {
    label: "Approved",
    color: "bg-green-100 text-green-800",
    darkColor: "bg-green-900 text-green-200",
    icon: <CheckCircle className="w-3 h-3 mr-1" />,
  },
  Reopened: {
    label: "Reopened",
    color: "bg-indigo-100 text-indigo-800",
    darkColor: "bg-indigo-900 text-indigo-200",
    icon: <RefreshCw className="w-3 h-3 mr-1" />,
  },
};

const PRIORITY_COLORS = {
  High: "bg-red-100 text-red-800",
  Medium: "bg-yellow-100 text-yellow-800",
  Low: "bg-green-100 text-green-800",
  Critical: "bg-red-100 text-red-800",
};

// Legacy status config for backward compatibility (table view)
const STATUS_LABELS = {
  ToDo: "To Do",
  InProgress: "In Progress",
  Done: "Completed",
  Pending: "Pending",
  Accepted: "Accepted",
  Rejected: "Rejected",
  WaitingForReview: "Waiting Review",
  Completed: "Completed",
};

const STATUS_COLORS = {
  Pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
  Accepted: "bg-blue-100 text-blue-800 border-blue-300",
  Rejected: "bg-red-100 text-red-800 border-red-300",
  InProgress: "bg-purple-100 text-purple-800 border-purple-300",
  WaitingForReview: "bg-orange-100 text-orange-800 border-orange-300",
  Completed: "bg-green-100 text-green-800 border-green-300",
  // Legacy fallbacks
  ToDo: "bg-yellow-100 text-yellow-800 border-yellow-300",
  Done: "bg-green-100 text-green-800 border-green-300",
};

const STATUS_ICONS = {
  ToDo: <Circle className="w-3 h-3 mr-1" />,
  InProgress: <RefreshCw className="w-3 h-3 mr-1" />,
  Done: <CheckCircle className="w-3 h-3 mr-1" />,
  Pending: <Clock className="w-3 h-3 mr-1" />,
  Accepted: <CheckCircle className="w-3 h-3 mr-1" />,
  Rejected: <X className="w-3 h-3 mr-1" />,
  WaitingForReview: <Send className="w-3 h-3 mr-1" />,
  Completed: <CheckCircle className="w-3 h-3 mr-1" />,
};

const TaskBoard = ({ darkMode,isSidebarOpen}: { darkMode: boolean; isSidebarOpen: boolean;}) => {
  const { state, fetchTasks } = useTasks();
  const { user: currentUser } = useAuth();
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const location = useLocation();

  // Subtask management state (local, not backend integrated)
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [newSubtaskWeight, setNewSubtaskWeight] = useState(0);
  const [editingSubtask, setEditingSubtask] = useState<{
    id: string | null;
    title: string;
    weight: number;
  } | null>(null);

  // TodoItems management state (backend integrated)
  const [todoItems, setTodoItems] = useState<TodoItemReadDto[]>([]);
  const [loadingTodoItems, setLoadingTodoItems] = useState(false);
  const [newTodoItemTitle, setNewTodoItemTitle] = useState("");
  const [newTodoItemDescription, setNewTodoItemDescription] = useState("");
  const [newTodoItemWeight, setNewTodoItemWeight] = useState(50);
  const [showCreateTodoItem, setShowCreateTodoItem] = useState(false);

  // Modals state
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showRejectTodoModal, setShowRejectTodoModal] = useState(false);
  const [showRejectCompletionModal, setShowRejectCompletionModal] = useState(false);
  const [showRejectTodoCompletionModal, setShowRejectTodoCompletionModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectingItemId, setRejectingItemId] = useState<number | null>(null);

  // Progress update state
  const [editingTodoProgress, setEditingTodoProgress] = useState<{
    id: number;
    progress: number;
  } | null>(null);

  // Fetch tasks on mount
  useEffect(() => {
    const initializeData = async () => {
      try {
        await fetchTasks();
      } catch (error) {
        console.error("Failed to fetch tasks:", error);
      }
    };
    initializeData();
  }, []);

  // Fetch TodoItems when a ProjectTask is selected
  useEffect(() => {
    const fetchTodoItems = async () => {
      console.log("🔍 TodoItems useEffect triggered:", {
        hasSelectedTask: !!selectedTask,
        taskType: selectedTask?.type,
        taskId: selectedTask?.taskId,
      });

      if (
        !selectedTask ||
        selectedTask.type !== "Project" ||
        !selectedTask.taskId
      ) {
        console.log("⏭️ Skipping TodoItems fetch:", {
          reason: !selectedTask
            ? "No task selected"
            : selectedTask.type !== "Project"
            ? `Wrong type: ${selectedTask.type}`
            : !selectedTask.taskId
            ? "No taskId"
            : "Unknown",
        });
        return;
      }

      try {
        setLoadingTodoItems(true);
        console.log("🔄 Fetching TodoItems for task:", selectedTask.taskId);
        const todoItems = await todoItemService.getTodoItemsByProjectTaskId(
          selectedTask.taskId
        );

        console.log("📦 TodoItems fetched:", {
          count: todoItems.length,
          items: todoItems,
        });

        setTodoItems(todoItems);
        console.log("✅ TodoItems set in state:", todoItems.length, todoItems);
      } catch (error) {
        console.error("❌ Error fetching TodoItems:", error);
        setTodoItems([]);
      } finally {
        setLoadingTodoItems(false);
      }
    };

    fetchTodoItems();
  }, [selectedTask]);

  // Filter tasks assigned to current user
  const assignedTasks = useMemo(() => {
    if (!currentUser) return [];

    const currentUserId = currentUser.id.toLowerCase();

    const filtered = state.tasks.filter((task) => {
      // Filter out personal todo tasks
      if (task.type === "Personal") return false;

      // ✅ DELEGATED TASKS: Show tasks assigned to current user
      const assigneeId = (task.assignee || "").toLowerCase();

      // Check if task is assigned to current user (by ID)
      const isAssignedToMe = assigneeId === currentUserId;

      return isAssignedToMe;
    });

    console.log("═══════════════════════════════════════════");
    console.log("🔍 TasksAssignedToMe - FILTERING SUMMARY");
    console.log("═══════════════════════════════════════════");
    console.log("🔍 Current user ID:", currentUserId);
    console.log("🔍 Total tasks:", state.tasks.length);
    console.log("🔍 Assigned to me:", filtered.length);
    console.log(
      "🔍 Sample assigned tasks:",
      filtered.slice(0, 3).map((t) => ({
        title: t.title,
        type: t.type,
        assignee: t.assignee,
        createdBy: t.createdByUserId,
      }))
    );
    console.log("═══════════════════════════════════════════");

    return filtered;
  }, [state.tasks, currentUser]);

  // Build project list from assigned tasks
  const projects = useMemo(() => {
    const projectIds = Array.from(
      new Set(
        assignedTasks
          .filter((task) => task.projectId)
          .map((task) => task.projectId)
          .filter(Boolean)
      )
    );

    return projectIds.map((id) => ({
      id: id!,
      name: `Project ${id}`,
      members: [],
    }));
  }, [assignedTasks]);

  // Calculate task progress from TodoItems (backend integrated)
  const calculatedProgress = useMemo(() => {
    if (
      !selectedTask ||
      selectedTask.type !== "Project" ||
      todoItems.length === 0
    ) {
      return null;
    }

    // Only count APPROVED TodoItems for progress
    const approvedTodos = todoItems.filter(
      (todo) => todo.status === "Approved"
    );

    if (approvedTodos.length === 0) {
      return { progress: 0, breakdown: [] };
    }

    const totalWeight = todoItems.reduce((sum, todo) => sum + todo.weight, 0);
    const weightedProgress = approvedTodos.reduce(
      (sum, todo) => sum + todo.progress * todo.weight,
      0
    );

    const progress =
      totalWeight > 0
        ? Math.round((weightedProgress / totalWeight) * 100) / 100
        : 0;

    // Create breakdown for display
    const breakdown = todoItems.map((todo) => ({
      title: todo.title,
      weight: todo.weight,
      progress: todo.progress,
      status: todo.status,
      contribution:
        todo.status === "Approved"
          ? (todo.progress * todo.weight) / totalWeight
          : 0,
    }));

    return { progress, breakdown, totalWeight, weightedProgress };
  }, [selectedTask, todoItems]);

  // Check if current user is Team Leader (for approval actions)
  const isTeamLeader = useMemo(() => {
    const role = currentUser?.role?.toLowerCase();
    return (
      role === "manager" ||
      role === "team_leader" ||
      role === "supervisor" ||
      role === "admin"
    );
  }, [currentUser]);


  // Filter assigned tasks based on project and status
  const filteredTasks = useMemo(() => {
    let result = assignedTasks;

    if (selectedProject) {
      result = result.filter((task) => task.projectId === selectedProject);
    }

    if (statusFilter !== "all") {
      result = result.filter((task) => task.status === statusFilter);
    }

    return result;
  }, [assignedTasks, selectedProject, statusFilter]);

  useEffect(() => {
    if (location.state) {
      const { filter } = location.state;

      if (filter && filter !== "all") {
        setStatusFilter(filter);
      }
    }
  }, [location.state]);

  const handleDeleteTask = (taskId: string) => {
    // This would call the delete function from TaskContext
    // For now, just close the dropdown
    setOpenDropdownId(null);

    if (selectedTask && selectedTask.id === taskId) {
      setSelectedTask(null);
    }
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "short",
      day: "numeric",
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Accept Task Assignment
  const handleAcceptTask = async () => {
    console.log("🔵 ========================================");
    console.log("🔵 ACCEPT TASK CLICKED");
    console.log("🔵 ========================================");
    console.log("📋 Selected Task:", selectedTask);
    console.log("📋 Task ID:", selectedTask?.taskId);
    console.log("📋 Task Type:", selectedTask?.type);

    if (!selectedTask) {
      console.error("❌ No selected task!");
      toast.error("No task selected", { theme: darkMode ? "dark" : "light" });
      return;
    }

    if (!selectedTask.taskId) {
      console.error("❌ Task has no taskId property!");
      console.log("📋 Available properties:", Object.keys(selectedTask));
      toast.error("Task ID is missing", { theme: darkMode ? "dark" : "light" });
      return;
    }

    try {
      console.log(
        "📤 Calling API: acceptTaskAssignment with taskId:",
        selectedTask.taskId
      );
      const response = await projectTaskService.acceptTaskAssignment(
        selectedTask.taskId
      );
      console.log("✅ API Response:", response);
      console.log("✅ API call successful - Task accepted in database!");
      toast.success("Task accepted successfully!", {
        theme: darkMode ? "dark" : "light",
      });

      // Wait a moment for DB to commit
      await new Promise((resolve) => setTimeout(resolve, 500));

      await fetchTasks(); // Refresh task list
      // Update selected task status
      setSelectedTask({ ...selectedTask, status: "Accepted" as any });
    } catch (error: any) {
      console.error("❌ Error accepting task:", error);
      console.error("❌ Error response:", error.response);
      console.error("❌ Error data:", error.response?.data);
      toast.error(
        error.response?.data || error.message || "Failed to accept task",
        { theme: darkMode ? "dark" : "light" }
      );
    }
  };

  // Reject Task Assignment
  const handleRejectTask = async () => {
    if (!selectedTask || !selectedTask.taskId || !rejectionReason.trim())
      return;

    try {
      await projectTaskService.rejectTaskAssignment(
        selectedTask.taskId,
        rejectionReason
      );
      toast.success("Task rejected", { theme: darkMode ? "dark" : "light" });
      setShowRejectModal(false);
      setRejectionReason("");
      await fetchTasks();
      setSelectedTask({ ...selectedTask, status: "Rejected" as any });
    } catch (error: any) {
      console.error("❌ Error rejecting task:", error);
      toast.error(error.message || "Failed to reject task", {
        theme: darkMode ? "dark" : "light",
      });
    }
  };

  // Approve Task Completion (Team Leader)
  const handleApproveTaskCompletion = async () => {
    if (!selectedTask || !selectedTask.taskId) return;

    try {
      await projectTaskService.acceptTaskCompletion(selectedTask.taskId);
      toast.success("Task completion approved!", {
        theme: darkMode ? "dark" : "light",
      });
      await fetchTasks();
      setSelectedTask({
        ...selectedTask,
        status: "Completed" as any,
        progress: 100,
      });
    } catch (error: any) {
      console.error("❌ Error approving task:", error);
      toast.error(error.message || "Failed to approve task", {
        theme: darkMode ? "dark" : "light",
      });
    }
  };

  // Reject Task Completion (Team Leader)
  const handleRejectTaskCompletion = async () => {
    if (!selectedTask || !selectedTask.taskId || !rejectionReason.trim())
      return;

    try {
      await projectTaskService.rejectTaskCompletion(
        selectedTask.taskId,
        rejectionReason
      );
      toast.success("Task sent back for revision", {
        theme: darkMode ? "dark" : "light",
      });
      setShowRejectCompletionModal(false);
      setRejectionReason("");
      await fetchTasks();
      setSelectedTask({ ...selectedTask, status: "InProgress" as any });
    } catch (error: any) {
      console.error("❌ Error rejecting task:", error);
      toast.error(error.message || "Failed to reject task", {
        theme: darkMode ? "dark" : "light",
      });
    }
  };

  // Fetch TodoItems for selected task
  const refreshTodoItems = async () => {
    if (!selectedTask || !selectedTask.taskId) return;

    try {
      const todoItems = await todoItemService.getTodoItemsByProjectTaskId(
        selectedTask.taskId
      );
      setTodoItems(todoItems);
    } catch (error) {
      console.error("Error refreshing TodoItems:", error);
      setTodoItems([]);
    }
  };

  // Create TodoItem
  const handleCreateTodoItem = async () => {
    if (!selectedTask || !selectedTask.taskId || !newTodoItemTitle.trim())
      return;

    try {
      const payload = {
        projectTaskId: selectedTask.taskId,
        title: newTodoItemTitle,
        description: newTodoItemDescription,
        assignedById: currentUser?.id || "",
        weight: newTodoItemWeight,
      };

      await todoItemService.createTodoItem(payload);
      toast.success("Action item created!", {
        theme: darkMode ? "dark" : "light",
      });
      setShowCreateTodoItem(false);
      setNewTodoItemTitle("");
      setNewTodoItemDescription("");
      setNewTodoItemWeight(50);
      await refreshTodoItems();
    } catch (error: any) {
      console.error("❌ Error creating TodoItem:", error);
      toast.error(error.message || "Failed to create action item", {
        theme: darkMode ? "dark" : "light",
      });
    }
  };

  // Accept TodoItem Assignment
  const handleAcceptTodoItem = async (todoId: number) => {
    console.log("🟢 ========================================");
    console.log("🟢 ACCEPT TODOITEM CLICKED");
    console.log("🟢 ========================================");
    console.log("📋 TodoItem ID:", todoId);

    try {
      console.log("📤 Calling API: acceptAssignment for TodoItem:", todoId);
      await todoItemService.acceptAssignment(todoId);
      console.log("✅ TodoItem accepted successfully");
      toast.success("Action item accepted!", {
        theme: darkMode ? "dark" : "light",
      });
      await refreshTodoItems();
    } catch (error: any) {
      console.error("❌ Error accepting TodoItem:", error);
      console.error("❌ Error details:", error.message, error.stack);
      toast.error(error.message || "Failed to accept item", {
        theme: darkMode ? "dark" : "light",
      });
    }
  };

  // Reject TodoItem Assignment
  const handleRejectTodoItem = async () => {
    if (!rejectingItemId || !rejectionReason.trim()) return;

    try {
      await todoItemService.rejectAssignment(rejectingItemId, rejectionReason);
      toast.success("Action item rejected", {
        theme: darkMode ? "dark" : "light",
      });
      setShowRejectTodoModal(false);
      setRejectionReason("");
      setRejectingItemId(null);
      await refreshTodoItems();
    } catch (error: any) {
      console.error("❌ Error rejecting TodoItem:", error);
      toast.error(error.message || "Failed to reject item", {
        theme: darkMode ? "dark" : "light",
      });
    }
  };

  // Start TodoItem Work
  const handleStartTodoItem = async (todoId: number) => {
    try {
      await todoItemService.start(todoId);
      toast.success("Work started on action item!", {
        theme: darkMode ? "dark" : "light",
      });
      await refreshTodoItems();
    } catch (error: any) {
      console.error("❌ Error starting TodoItem:", error);
      toast.error(error.message || "Failed to start item", {
        theme: darkMode ? "dark" : "light",
      });
    }
  };

  // Update TodoItem Progress
  const handleUpdateTodoItemProgress = async (
    todoId: number,
    progress: number
  ) => {
    try {
      await todoItemService.updateTodoItemProgress(todoId, progress);
      toast.success("Progress updated!", {
        theme: darkMode ? "dark" : "light",
      });
      setEditingTodoProgress(null);
      await refreshTodoItems();
    } catch (error: any) {
      console.error("❌ Error updating progress:", error);
      toast.error(error.message || "Failed to update progress", {
        theme: darkMode ? "dark" : "light",
      });
    }
  };

  // Complete TodoItem
  const handleCompleteTodoItem = async (todoId: number, progress: number) => {
    try {
      await todoItemService.complete(todoId, progress);
      toast.success("Action item submitted for review!", {
        theme: darkMode ? "dark" : "light",
      });
      await refreshTodoItems();
      await fetchTasks(); // Refresh to update parent task progress
    } catch (error: any) {
      console.error("❌ Error completing TodoItem:", error);
      toast.error(error.message || "Failed to complete item", {
        theme: darkMode ? "dark" : "light",
      });
    }
  };

  // Approve TodoItem Completion (Team Leader)
  const handleApproveTodoItem = async (todoId: number) => {
    try {
      await todoItemService.acceptApproval(todoId);
      toast.success("Action item approved!", {
        theme: darkMode ? "dark" : "light",
      });
      await refreshTodoItems();
      await fetchTasks(); // Refresh to update parent task progress
    } catch (error: any) {
      console.error("❌ Error approving TodoItem:", error);
      toast.error(error.message || "Failed to approve item", {
        theme: darkMode ? "dark" : "light",
      });
    }
  };

  // Reject TodoItem Completion (Team Leader)
  const handleRejectTodoCompletion = async () => {
    if (!rejectingItemId || !rejectionReason.trim()) return;

    try {
      await todoItemService.rejectCompletion(rejectingItemId, rejectionReason);
      toast.success("Action item sent back for revision", {
        theme: darkMode ? "dark" : "light",
      });
      setShowRejectTodoCompletionModal(false);
      setRejectionReason("");
      setRejectingItemId(null);
      await refreshTodoItems();
    } catch (error: any) {
      console.error("❌ Error rejecting TodoItem completion:", error);
      toast.error(error.message || "Failed to reject completion", {
        theme: darkMode ? "dark" : "light",
      });
    }
  };

  // Delete TodoItem
  const handleDeleteTodoItem = async (todoId: number) => {
    if (!window.confirm("Are you sure you want to delete this action item?"))
      return;

    try {
      await todoItemService.deleteTodoItem(todoId);
      toast.success("Action item deleted", {
        theme: darkMode ? "dark" : "light",
      });
      await refreshTodoItems();
      await fetchTasks(); // Refresh to update parent task progress
    } catch (error: any) {
      console.error("❌ Error deleting TodoItem:", error);
      toast.error(error.message || "Failed to delete item", {
        theme: darkMode ? "dark" : "light",
      });
    }
  };

  // Calculate progress based on subtasks (local subtasks, not TodoItems)
  const calculateProgress = (subtasks: Subtask[], currentStatus: string) => {
    if (subtasks.length === 0) return { progress: 0, status: currentStatus };

    const totalWeight = subtasks.reduce((sum, st) => sum + st.weight, 0);
    const completedWeight = subtasks
      .filter((st) => st.completed)
      .reduce((sum, st) => sum + st.weight, 0);

    const progress =
      totalWeight > 0 ? Math.round((completedWeight / totalWeight) * 100) : 0;

    let status = currentStatus;
    if (progress === 0) {
      status = "ToDo";
    } else if (progress === 100) {
      status = "Done";
    } else {
      status = "InProgress";
    }

    return { progress, status };
  };

  // Handle subtasks
  const handleAddSubtask = () => {
    if (!selectedTask || !newSubtaskTitle.trim()) return;

    const newSubtask: Subtask = {
      id: Date.now().toString(),
      title: newSubtaskTitle,
      type: "Subtask",
      weight: newSubtaskWeight || 0,
      completed: false,
    };

    const existingSubtasks = (selectedTask as any).subtasks || [];
    const updatedSubtasks = [...existingSubtasks, newSubtask];
    const { progress, status } = calculateProgress(
      updatedSubtasks,
      selectedTask.status
    );

    const updatedTask = {
      ...selectedTask,
      subtasks: updatedSubtasks,
      progress,
      status,
    } as any;

    setSelectedTask(updatedTask);
    setNewSubtaskTitle("");
    setNewSubtaskWeight(0);
  };

  const handleToggleSubtask = (id: string) => {
    if (!selectedTask) return;

    const existingSubtasks = (selectedTask as any).subtasks || [];
    const updatedSubtasks = existingSubtasks.map((st: Subtask) =>
      st.id === id ? { ...st, completed: !st.completed } : st
    );

    const { progress, status } = calculateProgress(
      updatedSubtasks,
      selectedTask.status
    );

    const updatedTask = {
      ...selectedTask,
      subtasks: updatedSubtasks,
      progress,
      status,
    } as any;

    setSelectedTask(updatedTask);
  };

  const handleStartEditSubtask = (subtask: Subtask) => {
    setEditingSubtask({
      id: subtask.id,
      title: subtask.title,
      weight: subtask.weight,
    });
  };

  const handleSaveSubtask = () => {
    if (!selectedTask || !editingSubtask) return;

    const existingSubtasks = (selectedTask as any).subtasks || [];
    const updatedSubtasks = existingSubtasks.map((st: Subtask) =>
      st.id === editingSubtask.id
        ? {
            ...st,
            title: editingSubtask.title,
            weight: editingSubtask.weight,
          }
        : st
    );

    const { progress, status } = calculateProgress(
      updatedSubtasks,
      selectedTask.status
    );

    const updatedTask = {
      ...selectedTask,
      subtasks: updatedSubtasks,
      progress,
      status,
    } as any;

    setSelectedTask(updatedTask);
    setEditingSubtask(null);
  };

  const handleDeleteSubtask = (id: string) => {
    if (!selectedTask) return;

    const existingSubtasks = (selectedTask as any).subtasks || [];
    const updatedSubtasks = existingSubtasks.filter(
      (st: Subtask) => st.id !== id
    );
    const { progress, status } = calculateProgress(
      updatedSubtasks,
      selectedTask.status
    );

    const updatedTask = {
      ...selectedTask,
      subtasks: updatedSubtasks,
      progress,
      status,
    } as any;

    setSelectedTask(updatedTask);
  };

  // Handle add attachment
  const handleAddAttachment = (file: File) => {
    if (!selectedTask) return;
    const updatedFiles = [
      ...(selectedTask.files || []),
      {
        id: `${Date.now()}-${file.name}`,
        name: file.name,
        size: file.size,
        type: file.type,
        url: URL.createObjectURL(file),
        lastModified: file.lastModified,
      },
    ];
    const updatedTask = { ...selectedTask, files: updatedFiles };
    setSelectedTask(updatedTask);
  };

  // Handle delete attachment
  const handleDeleteAttachment = (fileName: string) => {
    if (!selectedTask) return;
    const updatedFiles = (selectedTask.files || []).filter(
      (f) => f.name !== fileName
    );
    const updatedTask = { ...selectedTask, files: updatedFiles };
    setSelectedTask(updatedTask);
  };

  const searchedTasks = useMemo(() => {
    if (!searchText) return filteredTasks;

    const searchLower = searchText.toLowerCase();
    return filteredTasks.filter((task) => {
      const projectName =
        projects.find((p) => p.id === task.projectId)?.name || "";
      const dueDateFormatted = task.dueDate
        ? formatDate(task.dueDate).toLowerCase()
        : "";

      return (
        (task.title || "").toLowerCase().includes(searchLower) ||
        (projectName || "").toLowerCase().includes(searchLower) ||
        (task.status || "").toLowerCase().includes(searchLower) ||
        dueDateFormatted.includes(searchLower) ||
        (task.description &&
          task.description.toLowerCase().includes(searchLower))
      );
    });
  }, [filteredTasks, searchText, projects]);

  const columns = [
    {
      name: "Task",
      selector: (row: Task) => row.title,
      sortable: true,
      cell: (row: Task) => (
        <div className="font-medium pl-2">
          <div>{row.title}</div>
          <div className="text-xs text-gray-500">{row.type}</div>
        </div>
      ),
      minWidth: "200px",
    },
    {
      name: "Project",
      sortable: true,
      cell: (row: Task) => (
        <div>
          {row.projectId
            ? projects.find((p) => p.id === row.projectId)?.name ||
              `Project ${row.projectId}`
            : "Independent"}
        </div>
      ),
    },
    {
      name: "Priority",
      sortable: true,
      cell: (row: Task) => (
        <span
          className={`text-xs px-2 py-1 rounded-full ${
            PRIORITY_COLORS[row.priority as keyof typeof PRIORITY_COLORS] ||
            "bg-gray-100 text-gray-800"
          }`}
        >
          {row.priority}
        </span>
      ),
    },
    {
      name: "Status",
      sortable: true,
      cell: (row: Task) => (
        <span
          className={`text-xs px-2 py-1 rounded-md flex items-center w-fit ${
            STATUS_COLORS[row.status as keyof typeof STATUS_COLORS] ||
            "bg-gray-100 text-gray-800"
          }`}
        >
          {STATUS_ICONS[row.status as keyof typeof STATUS_ICONS]}
          {STATUS_LABELS[row.status as keyof typeof STATUS_LABELS] ||
            row.status}
        </span>
      ),
    },
    {
      name: "Due Date",
      sortable: true,
      cell: (row: Task) => (
        <div className="flex items-center">
          <Calendar className="w-4 h-4 mr-1" />
          {row.dueDate ? formatDate(row.dueDate) : "No due date"}
        </div>
      ),
    },
    {
      name: "Progress",
      sortable: true,
      cell: (row: Task) => (
        <div className="flex items-center">
          <div className="w-16 h-2 bg-gray-200 rounded-full mr-2">
            <div
              className="h-2 bg-blue-500 rounded-full"
              style={{ width: `${row.progress}%` }}
            ></div>
          </div>
          <span className="text-sm">{row.progress}%</span>
        </div>
      ),
    },
    {
      name: "",
      cell: (row: Task) => (
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setOpenDropdownId(openDropdownId === row.id ? null : row.id);
            }}
            aria-label="Task actions menu"
            title="Task actions menu"
            className="text-gray-500 hover:text-gray-500 "
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          {openDropdownId === row.id && (
            <div
              className={`absolute right-0 mt-2 w-48 rounded-md shadow-lg z-10 ${
                darkMode ? "bg-zinc-700" : "bg-white"
              } ring-1 ring-black ring-opacity-5`}
            >
              <div className="py-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteTask(row.id);
                  }}
                  className={`block w-full text-left px-4 py-2 text-sm ${
                    darkMode
                      ? "text-gray-200 hover:bg-zinc-600"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>
      ),
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
      width: "56px",
    },
  ];

  const customStyles = {
    rows: {
      style: {
        minHeight: "72px",
        backgroundColor: darkMode ? "#1e1e1e" : "#ffffff",
        "&:hover": {
          backgroundColor: darkMode ? "#2d2d2d" : "#f5f5f5",
        },
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
        paddingLeft: "8px",
        paddingRight: "8px",
        color: darkMode ? "#e5e7eb" : "#111827",
      },
    },
  };

  const renderTaskDetails = () => {
    if (!selectedTask) return null;

    const taskStatus = selectedTask.status || "Pending";
    const statusConfig =
      TASK_STATUS_CONFIG[taskStatus as keyof typeof TASK_STATUS_CONFIG];

    // ✅ COMPREHENSIVE DEBUG: Log FULL task object
    console.log("═══════════════════════════════════════════════════════");
    console.log("📋 FULL TASK OBJECT FROM FRONTEND STATE:");
    console.log("═══════════════════════════════════════════════════════");
    console.log(JSON.stringify(selectedTask, null, 2));
    console.log("═══════════════════════════════════════════════════════");

    console.log("🔍 Selected Task Summary:", {
      id: selectedTask.id,
      taskId: selectedTask.taskId,
      title: selectedTask.title,
      status: selectedTask.status,
      type: selectedTask.type,
      assignee: selectedTask.assignee,
      currentUserId: currentUser?.id,
    });

    console.log("🔍 Task Status Check:", {
      taskStatus,
      isPending: taskStatus === "Pending",
      isAccepted: taskStatus === "Accepted",
      statusConfig: statusConfig?.label,
    });

    return (
      <div
        className={`p-4 overflow-y-auto ${ darkMode ? "bg-zinc-800 text-gray-100" : "bg-white text-gray-800" }`} >
        {/* Header with Back Button */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <button
              onClick={() => setSelectedTask(null)}
              className={`mr-4 p-2 rounded-lg ${ darkMode ? "hover:bg-zinc-700" : "hover:bg-gray-100" }`} >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-bold">{selectedTask.title}</h2>
          </div>

          {/* Status Badge */}
          {statusConfig && (
            <div
              className={`px-4 py-2 rounded-lg border-2 flex items-center ${
                darkMode ? statusConfig.darkColor : statusConfig.color
              }`}
            >
              {statusConfig.icon}
              <span className="font-semibold">{statusConfig.label}</span>
            </div>
          )}
        </div>

        {/* Action Buttons Based on Status */}
        <div className="mb-6">
          {/* DEBUG: Show what status we're checking */}
          <div className="hidden">
            Status: {taskStatus} | Is Pending:{" "}
            {taskStatus === "Pending" ? "YES" : "NO"}
          </div>

          {/* Pending: Show Accept/Reject */}
          {taskStatus === "Pending" && (
            <div
              className={`p-4 rounded-lg border-2 ${
                darkMode
                  ? "bg-zinc-700 border-yellow-700"
                  : "bg-yellow-50 border-yellow-300"
              }`}
            >
              <div className="flex items-center mb-3">
                <AlertCircle className="w-5 h-5 mr-2 text-yellow-600" />
                <h3 className="font-semibold">
                  This task requires your acceptance
                </h3>
              </div>
              <p
                className={`text-sm mb-4 ${
                  darkMode ? "text-gray-300" : "text-gray-600"
                }`}
              >
                Please review the task details and accept or reject the
                assignment.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    console.log("🟢 Accept button clicked!");
                    handleAcceptTask();
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors cursor-pointer"
                >
                  <CheckCircle className="w-4 h-4" />
                  Accept Task
                </button>
                <button
                  onClick={() => {
                    console.log("🔴 Reject button clicked!");
                    setShowRejectModal(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                  Reject Task
                </button>
              </div>
            </div>
          )}

          {/* DEBUG: Show if buttons should appear but don't */}
          {/* {taskStatus !== "Pending" && (
            <div className={`p-3 rounded-lg ${ darkMode ? "bg-blue-900" : "bg-blue-100" }`}  >
              <p className="text-xs">
                ℹ️ Current Status: <strong>{taskStatus}</strong> - Accept/Reject
                buttons only show for "Pending" status
              </p>
            </div>
          )} */}

          {/* Rejected: Show Rejection Reason */}
          {taskStatus === "Rejected" &&
            (selectedTask as any).rejectionReason && (
              <div
                className={`p-4 rounded-lg border-2 ${
                  darkMode
                    ? "bg-red-900 border-red-700"
                    : "bg-red-50 border-red-300"
                }`}
              >
                <div className="flex items-center mb-2">
                  <X className="w-5 h-5 mr-2 text-red-600" />
                  <h3 className="font-semibold text-red-700 dark:text-red-300">
                    Task Rejected
                  </h3>
                </div>
                <p
                  className={`text-sm ${
                    darkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  <strong>Reason:</strong>{" "}
                  {(selectedTask as any).rejectionReason}
                </p>
              </div>
            )}

          {/* WaitingForReview: Show Team Leader Actions */}
          {taskStatus === "WaitingForReview" && isTeamLeader && (
            <div
              className={`p-4 rounded-lg border-2 ${
                darkMode
                  ? "bg-orange-900 border-orange-700"
                  : "bg-orange-50 border-orange-300"
              }`}
            >
              <div className="flex items-center mb-3">
                <Send className="w-5 h-5 mr-2 text-orange-600" />
                <h3 className="font-semibold">Task Ready for Review</h3>
              </div>
              <p
                className={`text-sm mb-4 ${
                  darkMode ? "text-gray-300" : "text-gray-600"
                }`}
              >
                The assignee has completed this task and submitted it for your
                review.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleApproveTaskCompletion}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  Approve Completion
                </button>
                <button
                  onClick={() => setShowRejectCompletionModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                >
                  <X className="w-4 h-4" />
                  Request Revision
                </button>
              </div>
            </div>
          )}

          {/* Completed: Show Success Message */}
          {taskStatus === "Completed" && (
            <div
              className={`p-4 rounded-lg border-2 ${ darkMode ? "bg-green-900 border-green-700" : "bg-green-50 border-green-300" }`}>
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                <h3 className="font-semibold text-green-700 dark:text-green-300">
                  Task Completed!
                </h3>
              </div>
            </div>
          )}
        </div>

        {/* Priority and Project Name */}
        <div className="flex flex-col gap-2 mb-6">
          <div
            className={`px-3 py-1 ml-3 rounded-md flex items-center w-fit ${
              PRIORITY_COLORS[
                selectedTask.priority as keyof typeof PRIORITY_COLORS
              ] || "bg-gray-100 text-gray-800"
            }`}
          >
            <Flag className="w-4 h-4 mr-4" />
            {selectedTask.priority} Priority
          </div>
          <div className="py-2 rounded-md ml-5">
            <span className="font-bold">Project:</span>
            {selectedTask.projectId
              ? projects.find((p) => p.id === selectedTask.projectId)?.name ||
                `Project ${selectedTask.projectId}`
              : "Independent Task"}
          </div>
        </div>

        {/* Split Layout */}
        <div className="flex flex-col lg:flex-row w-full">
          {/* Left side - Task details */}
          <div className="lg:w-1/2 lg:pr-6 ml-3">
            {/* Progress */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <span className="text-sm font-medium">Task Progress</span>
                  {calculatedProgress && selectedTask.type === "Project" && (
                    <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                      🔄 Auto-calculated from Action Items
                    </p>
                  )}
                </div>
                <span className="text-2xl font-bold text-purple-600">
                  {calculatedProgress?.progress !== undefined
                    ? `${calculatedProgress.progress.toFixed(1)}%`
                    : `${selectedTask.progress}%`}
                </span>
              </div>
              <div
                className={`lg:w-auto h-3 rounded-full ${
                  darkMode ? "bg-zinc-700" : "bg-gray-200"
                }`}
              >
                <div
                  className={`h-3 rounded-full transition-all duration-500 ${
                    (calculatedProgress?.progress || selectedTask.progress) ===
                    100
                      ? "bg-green-500"
                      : (calculatedProgress?.progress ||
                          selectedTask.progress) > 50
                      ? "bg-blue-500"
                      : "bg-yellow-500"
                  }`}
                  style={{
                    width: `${
                      calculatedProgress?.progress !== undefined
                        ? calculatedProgress.progress
                        : selectedTask.progress
                    }%`,
                  }}
                ></div>
              </div>

              {/* Progress Calculation Display */}
              {calculatedProgress &&
                calculatedProgress.breakdown.length > 0 && (
                  <div
                    className={`mt-3 p-3 rounded-lg ${
                      darkMode ? "bg-zinc-700" : "bg-blue-50"
                    }`}
                  >
                    <h4 className="text-xs font-semibold mb-2 text-purple-600 dark:text-purple-400">
                      Progress Breakdown:
                    </h4>
                    {calculatedProgress.breakdown.map((item, idx) => (
                      <div
                        key={idx}
                        className="text-xs flex justify-between items-center mb-1"
                      >
                        <span
                          className={
                            item.status === "Approved"
                              ? "text-green-600 dark:text-green-400"
                              : darkMode
                              ? "text-gray-400"
                              : "text-gray-600"
                          }
                        >
                          {item.title} ({item.weight}pts × {item.progress}%)
                        </span>
                        <span className="font-mono">
                          {item.status === "Approved"
                            ? `+${(item.contribution * 100).toFixed(1)}%`
                            : "—"}
                        </span>
                      </div>
                    ))}
                    <div
                      className={`text-xs font-semibold mt-2 pt-2 border-t ${
                        darkMode ? "border-zinc-600" : "border-blue-200"
                      }`}
                    >
                      Total: {calculatedProgress.weightedProgress?.toFixed(1)} /{" "}
                      {calculatedProgress.totalWeight} ={" "}
                      {calculatedProgress.progress.toFixed(1)}%
                    </div>
                  </div>
                )}
            </div>

            {/* Description */}
            <div className="mb-6">
              <h3 className="font-bold mb-2">Description</h3>
              <p
                className={`p-3 rounded-lg ${
                  darkMode
                    ? "bg-zinc-700 text-gray-200"
                    : "bg-white text-gray-700"
                }`}
              >
                {selectedTask.description || "No description provided"}
              </p>
            </div>

            {/* Details */}
            <div className="mb-6">
              <h3 className="font-bold mb-2">Details</h3>
              <div
                className={`lg:w-auto p-3 rounded-lg ${
                  darkMode
                    ? "bg-zinc-700 text-gray-200"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4
                      className={`text-sm ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      } mb-1`}
                    >
                      Task Type
                    </h4>
                    <p className="flex items-center">
                      <UserCircle className="w-4 h-4 mr-2" />
                      {selectedTask.type}
                    </p>
                  </div>

                  <div>
                    <h4
                      className={`text-sm ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      } mb-1`}
                    >
                      Due Date
                    </h4>
                    <p className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      {selectedTask.dueDate
                        ? formatDate(selectedTask.dueDate)
                        : "No due date"}
                    </p>
                  </div>

                  <div>
                    <h4
                      className={`text-sm ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      } mb-1`}
                    >
                      Created
                    </h4>
                    <p
                      className={`text-sm ${
                        darkMode ? "text-gray-300" : "text-gray-600"
                      }`}
                    >
                      {selectedTask.createdAt
                        ? formatDate(selectedTask.createdAt)
                        : "Unknown"}
                    </p>
                  </div>

                  <div>
                    <h4
                      className={`text-sm ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      } mb-1`}
                    >
                      Last Updated
                    </h4>
                    <p
                      className={`text-sm ${
                        darkMode ? "text-gray-300" : "text-gray-600"
                      }`}
                    >
                      {selectedTask.updatedAt
                        ? formatDate(selectedTask.updatedAt)
                        : "Unknown"}
                    </p>
                  </div>

                  {selectedTask.weight !== undefined &&
                    selectedTask.weight !== null && (
                      <div>
                        <h4
                          className={`text-sm ${
                            darkMode ? "text-gray-400" : "text-gray-500"
                          } mb-1`}
                        >
                          Weight
                        </h4>
                        <p
                          className={`text-sm ${
                            darkMode ? "text-gray-300" : "text-gray-600"
                          }`}
                        >
                          {selectedTask.weight} points
                        </p>
                      </div>
                    )}

                  <div className="col-span-2 w-fit">
                    <h4
                      className={`text-sm ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      } mb-1`}
                    >
                      Status
                    </h4>
                    <span
                      className={`px-3 py-1 rounded-md flex items-center ${
                        STATUS_COLORS[
                          selectedTask.status as keyof typeof STATUS_COLORS
                        ] || "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {
                        STATUS_ICONS[
                          selectedTask.status as keyof typeof STATUS_ICONS
                        ]
                      }
                      {STATUS_LABELS[
                        selectedTask.status as keyof typeof STATUS_LABELS
                      ] || selectedTask.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Attachments */}
            <div className="mb-6">
              <h3 className="font-bold mb-2">Attachments</h3>
              <div
                className={`p-3 w-fit rounded-lg ${
                  darkMode
                    ? "bg-zinc-700 text-gray-200"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                <div className="space-y-2">
                  {selectedTask.files && selectedTask.files.length > 0 ? (
                    selectedTask.files.map((file, index) => (
                      <div key={index} className="flex items-center">
                        <Paperclip className="w-4 h-4 mr-2" />
                        <a
                          href={file.url}
                          className="text-blue-600 hover:underline dark:text-blue-400"
                          download
                        >
                          {file.name}
                        </a>
                        <span className="ml-2 text-xs text-gray-400">
                          ({(file.size / 1024).toFixed(1)} KB)
                        </span>
                        <button
                          onClick={() => handleDeleteAttachment(file.name)}
                          className={`ml-2 px-2 py-1 text-xs rounded ${
                            darkMode
                              ? "hover:bg-gray-600 text-red-400"
                              : "hover:bg-gray-200 text-red-600"
                          }`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No attachments</p>
                  )}
                </div>
                {/* File input for uploading new attachment */}
                <div className="mt-4 flex items-center gap-2">
                  <label
                    htmlFor="task-file-upload"
                    className={`cursor-pointer p-2 rounded-full ${
                      darkMode
                        ? "bg-purple-900 hover:bg-purple-800"
                        : "bg-purple-900 hover:bg-purple-800"
                    } flex items-center`}
                    title="Add Attachment"
                  >
                    <Plus className="w-4 h-4 text-white" />
                    <input
                      id="task-file-upload"
                      type="file"
                      style={{ display: "none" }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file && selectedTask) {
                          handleAddAttachment(file);
                        }
                      }}
                    />
                  </label>
                  <span className="text-sm text-gray-500">Add attachment</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right side - TodoItems (Backend Integrated) */}
          <div className="lg:w-1/2 lg:pl-2">
            <div
              className={`rounded-xl p-4 ${
                darkMode ? "bg-zinc-700" : "bg-white"
              }`}
            >
              {(() => {
                console.log("🎨 Rendering TodoItems section:", {
                  isProjectType: selectedTask.type === "Project",
                  taskType: selectedTask.type,
                  todoItemsCount: todoItems.length,
                  loadingTodoItems,
                });
                return null;
              })()}
              {selectedTask.type === "Project" ? (
                <div className="space-y-4">
                  {/* TodoItems Section */}
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-xl">
                      Action Items (TodoItems)
                    </h3>
                    <button
                      onClick={() => setShowCreateTodoItem(true)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                        darkMode
                          ? "bg-purple-600 hover:bg-purple-700"
                          : "bg-purple-500 hover:bg-purple-600"
                      } text-white text-sm`}
                      disabled={
                        taskStatus === "Pending" || taskStatus === "Rejected"
                      }
                    >
                      <Plus className="h-4 w-4" />
                      Add Action Item
                    </button>
                  </div>

                  {/* Loading State */}
                  {loadingTodoItems && (
                    <div className="text-center py-4">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-purple-600" />
                      <p className="text-sm text-gray-500">
                        Loading action items...
                      </p>
                    </div>
                  )}

                  {/* TodoItems List */}
                  {!loadingTodoItems && todoItems.length === 0 && (
                    <div
                      className={`p-6 text-center rounded-lg border-2 border-dashed ${
                        darkMode
                          ? "bg-zinc-800 border-zinc-600"
                          : "bg-gray-50 border-gray-300"
                      }`}
                    >
                      <p
                        className={`text-sm ${
                          darkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        No action items yet.{" "}
                        {taskStatus === "Accepted" ||
                        taskStatus === "InProgress"
                          ? "Create one to get started!"
                          : ""}
                      </p>
                    </div>
                  )}

                  {/* Create TodoItem Form */}
                  {showCreateTodoItem && (
                    <div
                      className={`mt-4 p-4 rounded-lg border ${
                        darkMode
                          ? "bg-zinc-600 border-zinc-500"
                          : "bg-blue-50 border-blue-200"
                      }`}
                    >
                      <h4 className="font-medium mb-3">
                        Create New Action Item
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-medium mb-1">
                            Title *
                          </label>
                          <input
                            type="text"
                            value={newTodoItemTitle}
                            onChange={(e) =>
                              setNewTodoItemTitle(e.target.value)
                            }
                            placeholder="Action item title"
                            className={`w-full p-2 rounded-lg border text-sm ${
                              darkMode
                                ? "bg-zinc-700 border-zinc-500"
                                : "bg-white border-gray-300"
                            }`}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1">
                            Description
                          </label>
                          <textarea
                            value={newTodoItemDescription}
                            onChange={(e) =>
                              setNewTodoItemDescription(e.target.value)
                            }
                            placeholder="Optional description"
                            rows={2}
                            className={`w-full p-2 rounded-lg border text-sm ${
                              darkMode
                                ? "bg-zinc-700 border-zinc-500"
                                : "bg-white border-gray-300"
                            }`}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1">
                            Weight (0-100)
                          </label>
                          <input
                            type="number"
                            value={newTodoItemWeight}
                            onChange={(e) =>
                              setNewTodoItemWeight(Number(e.target.value))
                            }
                            min={0}
                            max={100}
                            className={`w-full p-2 rounded-lg border text-sm ${
                              darkMode
                                ? "bg-zinc-700 border-zinc-500"
                                : "bg-white border-gray-300"
                            }`}
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={handleCreateTodoItem}
                            disabled={!newTodoItemTitle.trim()}
                            className={`px-4 py-2 rounded-lg text-white ${
                              !newTodoItemTitle.trim()
                                ? "bg-gray-400 cursor-not-allowed"
                                : darkMode
                                ? "bg-purple-600 hover:bg-purple-700"
                                : "bg-purple-500 hover:bg-purple-600"
                            }`}
                          >
                            Create
                          </button>
                          <button
                            onClick={() => {
                              setShowCreateTodoItem(false);
                              setNewTodoItemTitle("");
                              setNewTodoItemDescription("");
                              setNewTodoItemWeight(50);
                            }}
                            className={`px-4 py-2 rounded-lg ${
                              darkMode
                                ? "bg-zinc-600 hover:bg-zinc-500"
                                : "bg-gray-200 hover:bg-gray-300"
                            }`}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TodoItems Display */}
                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    {todoItems.map((todo) => {
                      // DEBUG: Log each TodoItem before rendering
                      if (todoItems.length > 0) {
                        console.log("📋 Rendering TodoItem:", {
                          id: todo.id,
                          title: todo.title,
                          status: todo.status,
                          assigneeId: todo.assigneeId,
                          currentUserId: currentUser?.id,
                          isAssignedToMe: todo.assigneeId === currentUser?.id,
                        });
                      }
                      const todoStatusConfig =
                        TODO_STATUS_CONFIG[
                          todo.status as keyof typeof TODO_STATUS_CONFIG
                        ];
                      const isAssignedToMe =
                        todo.assigneeId === currentUser?.id;

                      console.log(`📋 TodoItem "${todo.title}":`, {
                        id: todo.id,
                        status: todo.status,
                        assigneeId: todo.assigneeId,
                        currentUserId: currentUser?.id,
                        isAssignedToMe,
                        willShowAcceptButton:
                          todo.status === "Pending" && isAssignedToMe,
                      });

                      return (
                        <div
                          key={todo.id}
                          className={`p-4 rounded-lg border-2 ${
                            darkMode
                              ? "bg-zinc-600 border-zinc-500"
                              : "bg-white border-gray-200"
                          }`}
                        >
                          {/* TodoItem Header */}
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <h4 className="font-semibold text-base mb-1">
                                {todo.title}
                              </h4>
                              {todo.description && (
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {todo.description}
                                </p>
                              )}
                            </div>
                            {todoStatusConfig && (
                              <span
                                className={`px-2 py-1 rounded-md text-xs flex items-center whitespace-nowrap ml-2 ${
                                  darkMode
                                    ? todoStatusConfig.darkColor
                                    : todoStatusConfig.color
                                }`}
                              >
                                {todoStatusConfig.icon}
                                {todoStatusConfig.label}
                              </span>
                            )}
                          </div>

                          {/* TodoItem Weight and Progress */}
                          <div className="flex gap-4 mb-3">
                            <div>
                              <span className="text-xs text-gray-500">
                                Weight:
                              </span>
                              <span className="ml-1 font-semibold text-sm text-purple-600">
                                {todo.weight} pts
                              </span>
                            </div>
                            <div>
                              <span className="text-xs text-gray-500">
                                Progress:
                              </span>
                              <span className="ml-1 font-semibold text-sm">
                                {todo.progress}%
                              </span>
                            </div>
                          </div>

                          {/* TodoItem Actions Based on Status */}
                          <div className="space-y-2">
                            {/* PENDING: Accept/Reject Buttons */}
                            {todo.status === "Pending" && isAssignedToMe && (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    console.log(
                                      "🟢 TodoItem Accept clicked! ID:",
                                      todo.id
                                    );
                                    handleAcceptTodoItem(todo.id);
                                  }}
                                  className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-md text-xs font-medium cursor-pointer"
                                >
                                  <CheckCircle className="w-3 h-3" />
                                  Accept
                                </button>
                                <button
                                  onClick={() => {
                                    console.log(
                                      "🔴 TodoItem Reject clicked! ID:",
                                      todo.id
                                    );
                                    setRejectingItemId(todo.id);
                                    setShowRejectTodoModal(true);
                                  }}
                                  className="flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-md text-xs font-medium cursor-pointer"
                                >
                                  <X className="w-3 h-3" />
                                  Reject
                                </button>
                              </div>
                            )}

                            {/* DEBUG: Show why buttons aren't showing */}
                            {todo.status === "Pending" && !isAssignedToMe && (
                              <div className="text-xs text-gray-500">
                                ⚠️ TodoItem is Pending but not assigned to you
                                (Assignee: {todo.assigneeId} vs You:{" "}
                                {currentUser?.id})
                              </div>
                            )}

                            {/* ACCEPTED: Start Work Button */}
                            {todo.status === "Accepted" && isAssignedToMe && (
                              <button
                                onClick={() => handleStartTodoItem(todo.id)}
                                className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-medium"
                              >
                                <PlayCircle className="w-3 h-3" />
                                Start Work
                              </button>
                            )}

                            {/* IN PROGRESS: Progress Slider + Complete Button */}
                            {todo.status === "InProgress" && isAssignedToMe && (
                              <div
                                className={`p-3 rounded-lg ${
                                  darkMode ? "bg-zinc-700" : "bg-gray-50"
                                }`}
                              >
                                {editingTodoProgress?.id === todo.id ? (
                                  <div className="space-y-2">
                                    <label className="text-xs font-medium">
                                      Update Progress:
                                    </label>
                                    <input
                                      type="range"
                                      min="0"
                                      max="100"
                                      value={editingTodoProgress.progress}
                                      onChange={(e) =>
                                        setEditingTodoProgress({
                                          id: todo.id,
                                          progress: Number(e.target.value),
                                        })
                                      }
                                      className="w-full"
                                    />
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm font-semibold">
                                        {editingTodoProgress.progress}%
                                      </span>
                                      <div className="flex gap-2">
                                        <button
                                          onClick={() =>
                                            handleUpdateTodoItemProgress(
                                              todo.id,
                                              editingTodoProgress.progress
                                            )
                                          }
                                          className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-xs"
                                        >
                                          Save
                                        </button>
                                        <button
                                          onClick={() =>
                                            setEditingTodoProgress(null)
                                          }
                                          className="px-3 py-1 bg-gray-500 hover:bg-gray-600 text-white rounded-md text-xs"
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() =>
                                        setEditingTodoProgress({
                                          id: todo.id,
                                          progress: todo.progress,
                                        })
                                      }
                                      className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-xs font-medium"
                                    >
                                      <Edit className="w-3 h-3" />
                                      Update Progress
                                    </button>
                                    {todo.progress >= 100 && (
                                      <button
                                        onClick={() =>
                                          handleCompleteTodoItem(
                                            todo.id,
                                            todo.progress
                                          )
                                        }
                                        className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-md text-xs font-medium"
                                      >
                                        <Send className="w-3 h-3" />
                                        Submit for Review
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* WAITING FOR REVIEW: Team Leader Actions */}
                            {todo.status === "WaitingForReview" &&
                              isTeamLeader && (
                                <div
                                  className={`p-3 rounded-lg ${
                                    darkMode ? "bg-orange-900" : "bg-orange-50"
                                  }`}
                                >
                                  <p className="text-xs mb-2 text-orange-700 dark:text-orange-300 font-medium">
                                    Pending Your Approval
                                  </p>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() =>
                                        handleApproveTodoItem(todo.id)
                                      }
                                      className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-md text-xs font-medium"
                                    >
                                      <CheckCircle className="w-3 h-3" />
                                      Approve
                                    </button>
                                    <button
                                      onClick={() => {
                                        setRejectingItemId(todo.id);
                                        setShowRejectTodoCompletionModal(true);
                                      }}
                                      className="flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-md text-xs font-medium"
                                    >
                                      <X className="w-3 h-3" />
                                      Request Revision
                                    </button>
                                  </div>
                                </div>
                              )}

                            {/* APPROVED: Show Success */}
                            {todo.status === "Approved" && (
                              <div
                                className={`px-3 py-2 rounded-lg ${
                                  darkMode ? "bg-green-900" : "bg-green-50"
                                }`}
                              >
                                <p className="text-xs text-green-700 dark:text-green-300 flex items-center">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Approved - Contributing{" "}
                                  {(
                                    (todo.weight * todo.progress) /
                                    100
                                  ).toFixed(1)}{" "}
                                  pts to task progress
                                </p>
                              </div>
                            )}

                            {/* REJECTED: Show Reason */}
                            {todo.status === "Rejected" &&
                              (todo as any).rejectionReason && (
                                <div
                                  className={`px-3 py-2 rounded-lg ${
                                    darkMode ? "bg-red-900" : "bg-red-50"
                                  }`}
                                >
                                  <p className="text-xs text-red-700 dark:text-red-300">
                                    <strong>Rejected:</strong>{" "}
                                    {(todo as any).rejectionReason}
                                  </p>
                                </div>
                              )}

                            {/* REOPENED: Show Reason */}
                            {todo.status === "Reopened" &&
                              (todo as any).rejectionReason && (
                                <div
                                  className={`px-3 py-2 rounded-lg ${
                                    darkMode ? "bg-indigo-900" : "bg-indigo-50"
                                  }`}
                                >
                                  <p className="text-xs text-indigo-700 dark:text-indigo-300">
                                    <strong>Needs Revision:</strong>{" "}
                                    {(todo as any).rejectionReason}
                                  </p>
                                  {isAssignedToMe && (
                                    <button
                                      onClick={() =>
                                        handleStartTodoItem(todo.id)
                                      }
                                      className="mt-2 flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-medium"
                                    >
                                      <PlayCircle className="w-3 h-3" />
                                      Resume Work
                                    </button>
                                  )}
                                </div>
                              )}

                            {/* Delete Button (for non-approved items) */}
                            {todo.status !== "Approved" &&
                              todo.status !== "WaitingForReview" && (
                                <button
                                  onClick={() => handleDeleteTodoItem(todo.id)}
                                  className={`mt-2 flex items-center gap-1 px-3 py-1.5 text-xs ${
                                    darkMode
                                      ? "text-red-400 hover:bg-zinc-700"
                                      : "text-red-600 hover:bg-gray-100"
                                  } rounded-md`}
                                >
                                  <Trash2 className="w-3 h-3" />
                                  Delete
                                </button>
                              )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                // For Independent Tasks: Show Local Subtasks
                <div className="space-y-4">
                  <h3 className="font-bold text-xl mb-4">Subtasks</h3>

                  <div className="space-y-6">
                    {/* Add new subtask section */}
                    <div>
                      <h4 className="text-sm text-gray-500 font-medium mb-3">
                        Add New Subtask
                      </h4>
                      <div className="flex flex-col gap-3">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newSubtaskTitle}
                            onChange={(e) => setNewSubtaskTitle(e.target.value)}
                            placeholder="Enter subtask title"
                            className={`flex-1 p-2 rounded-lg text-sm ${
                              darkMode
                                ? "bg-zinc-600 border-zinc-500 text-gray-200"
                                : "bg-white border-gray-200 text-gray-700"
                            } border`}
                          />
                          <input
                            type="number"
                            value={newSubtaskWeight}
                            onChange={(e) =>
                              setNewSubtaskWeight(Number(e.target.value))
                            }
                            min="1"
                            max="100"
                            placeholder="Weight"
                            className={`w-20 p-2 rounded-lg text-sm ${
                              darkMode
                                ? "bg-zinc-600 border-zinc-500 text-gray-200"
                                : "bg-white border-gray-200 text-gray-700"
                            } border`}
                          />
                          <button
                            onClick={handleAddSubtask}
                            className="px-3 py-1 bg-purple-900 text-white rounded-lg hover:bg-purple-800 transition-colors"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Subtasks list */}
                    <div>
                      <h4 className="text-sm font-medium mb-3 pr-6">
                        Subtasks List
                      </h4>
                      {(selectedTask as any).subtasks &&
                      (selectedTask as any).subtasks.length > 0 ? (
                        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-6">
                          {(selectedTask as any).subtasks.map(
                            (subtask: Subtask) => (
                              <div
                                key={subtask.id}
                                className={`flex items-center justify-between p-3 rounded-lg ${
                                  darkMode
                                    ? "bg-zinc-600 text-gray-200"
                                    : "bg-white text-gray-700"
                                } border ${
                                  darkMode
                                    ? "border-zinc-500"
                                    : "border-gray-200"
                                }`}
                              >
                                {editingSubtask?.id === subtask.id ? (
                                  <div className="w-full space-y-2">
                                    <input
                                      type="text"
                                      value={editingSubtask.title}
                                      onChange={(e) =>
                                        setEditingSubtask({
                                          ...editingSubtask,
                                          title: e.target.value,
                                        })
                                      }
                                      className={`w-full p-2 rounded-lg text-sm ${
                                        darkMode
                                          ? "bg-zinc-700 border-zinc-500 text-gray-200"
                                          : "bg-white border-gray-200 text-gray-700"
                                      } border`}
                                    />
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="number"
                                        value={editingSubtask.weight}
                                        onChange={(e) =>
                                          setEditingSubtask({
                                            ...editingSubtask,
                                            weight: Number(e.target.value),
                                          })
                                        }
                                        min="1"
                                        max="100"
                                        className={`w-20 p-2 rounded-lg text-sm ${
                                          darkMode
                                            ? "bg-zinc-700 border-zinc-500 text-gray-200"
                                            : "bg-white border-gray-200 text-gray-700"
                                        } border`}
                                      />
                                      <span className="text-sm">% weight</span>
                                      <button
                                        onClick={handleSaveSubtask}
                                        className="ml-auto px-3 py-1 bg-purple-900 text-white rounded-lg hover:bg-purple-800 transition-colors text-sm"
                                      >
                                        Save
                                      </button>
                                      <button
                                        onClick={() => setEditingSubtask(null)}
                                        className="px-3 py-1 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <div className="flex items-center flex-1">
                                      <input
                                        type="checkbox"
                                        checked={subtask.completed}
                                        onChange={() =>
                                          handleToggleSubtask(subtask.id)
                                        }
                                        className="mr-3 w-4 h-4 text-purple-900 rounded"
                                      />
                                      <div className="flex flex-col flex-1">
                                        <div className="flex items-center">
                                          <span
                                            className={`${
                                              subtask.completed
                                                ? "line-through text-gray-500"
                                                : ""
                                            }`}
                                          >
                                            {subtask.title}
                                          </span>
                                        </div>
                                        <div className="flex gap-2 mt-1">
                                          <span className="text-xs text-gray-500">
                                            {subtask.weight}% weight
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex gap-2 ml-4">
                                      <button
                                        onClick={() =>
                                          handleStartEditSubtask(subtask)
                                        }
                                        className="text-gray-500 hover:text-purple-500"
                                      >
                                        <Edit className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() =>
                                          handleDeleteSubtask(subtask.id)
                                        }
                                        className="text-gray-500 hover:text-red-500"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </>
                                )}
                              </div>
                            )
                          )}
                        </div>
                      ) : (
                        <div
                          className={`p-4 text-center rounded-lg ${
                            darkMode
                              ? "bg-zinc-600 text-gray-400"
                              : "bg-gray-200 text-gray-500"
                          }`}
                        >
                          No subtasks created yet
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const RejectTaskModal = () => (
    <Dialog
      open={showRejectModal}
      onClose={() => setShowRejectModal(false)}
      className="fixed inset-0 z-50 overflow-y-auto"
    >
      <div className="flex items-center justify-center min-h-screen bg-black bg-opacity-50 px-4">
        <Dialog.Panel
          className={`p-6 rounded-xl w-full max-w-md ${
            darkMode ? "bg-zinc-800 text-gray-100" : "bg-white text-gray-800"
          }`}
        >
          <Dialog.Title className="text-lg font-bold mb-4 flex items-center">
            <X className="w-5 h-5 mr-2 text-red-600" />
            Reject Task Assignment
          </Dialog.Title>
          <p className="text-sm mb-4 text-gray-500">
            Please provide a reason for rejecting this task:
          </p>
          <textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Reason for rejection..."
            rows={4}
            className={`w-full p-3 rounded-lg border mb-4 ${
              darkMode
                ? "bg-zinc-700 border-zinc-600 text-white"
                : "bg-white border-gray-300 text-gray-800"
            }`}
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setShowRejectModal(false);
                setRejectionReason("");
              }}
              className={`px-4 py-2 rounded-lg ${
                darkMode
                  ? "bg-zinc-700 hover:bg-zinc-600"
                  : "bg-gray-200 hover:bg-gray-300"
              }`}
            >
              Cancel
            </button>
            <button
              onClick={handleRejectTask}
              disabled={!rejectionReason.trim()}
              className={`px-4 py-2 rounded-lg text-white ${
                !rejectionReason.trim()
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-red-600 hover:bg-red-700"
              }`}
            >
              Reject Task
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );

  const RejectCompletionModal = () => (
    <Dialog
      open={showRejectCompletionModal}
      onClose={() => setShowRejectCompletionModal(false)}
      className="fixed inset-0 z-50 overflow-y-auto"
    >
      <div className="flex items-center justify-center min-h-screen bg-black bg-opacity-50 px-4">
        <Dialog.Panel
          className={`p-6 rounded-xl w-full max-w-md ${
            darkMode ? "bg-zinc-800 text-gray-100" : "bg-white text-gray-800"
          }`}
        >
          <Dialog.Title className="text-lg font-bold mb-4 flex items-center">
            <AlertCircle className="w-5 h-5 mr-2 text-orange-600" />
            Request Task Revision
          </Dialog.Title>
          <p className="text-sm mb-4 text-gray-500">
            The task will be sent back to the assignee. Please explain what
            needs to be improved:
          </p>
          <textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="What needs to be improved?"
            rows={4}
            className={`w-full p-3 rounded-lg border mb-4 ${
              darkMode
                ? "bg-zinc-700 border-zinc-600 text-white"
                : "bg-white border-gray-300 text-gray-800"
            }`}
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setShowRejectCompletionModal(false);
                setRejectionReason("");
              }}
              className={`px-4 py-2 rounded-lg ${
                darkMode
                  ? "bg-zinc-700 hover:bg-zinc-600"
                  : "bg-gray-200 hover:bg-gray-300"
              }`}
            >
              Cancel
            </button>
            <button
              onClick={handleRejectTaskCompletion}
              disabled={!rejectionReason.trim()}
              className={`px-4 py-2 rounded-lg text-white ${
                !rejectionReason.trim()
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-orange-600 hover:bg-orange-700"
              }`}
            >
              Request Revision
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );

  const RejectTodoModal = () => (
    <Dialog
      open={showRejectTodoModal}
      onClose={() => setShowRejectTodoModal(false)}
      className="fixed inset-0 z-50 overflow-y-auto"
    >
      <div className="flex items-center justify-center min-h-screen bg-black bg-opacity-50 px-4">
        <Dialog.Panel
          className={`p-6 rounded-xl w-full max-w-md ${
            darkMode ? "bg-zinc-800 text-gray-100" : "bg-white text-gray-800"
          }`}
        >
          <Dialog.Title className="text-lg font-bold mb-4 flex items-center">
            <X className="w-5 h-5 mr-2 text-red-600" />
            Reject Action Item
          </Dialog.Title>
          <p className="text-sm mb-4 text-gray-500">
            Please provide a reason for rejecting this action item:
          </p>
          <textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Reason for rejection..."
            rows={3}
            className={`w-full p-3 rounded-lg border mb-4 ${
              darkMode
                ? "bg-zinc-700 border-zinc-600 text-white"
                : "bg-white border-gray-300 text-gray-800"
            }`}
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setShowRejectTodoModal(false);
                setRejectionReason("");
                setRejectingItemId(null);
              }}
              className={`px-4 py-2 rounded-lg ${
                darkMode
                  ? "bg-zinc-700 hover:bg-zinc-600"
                  : "bg-gray-200 hover:bg-gray-300"
              }`}
            >
              Cancel
            </button>
            <button
              onClick={handleRejectTodoItem}
              disabled={!rejectionReason.trim()}
              className={`px-4 py-2 rounded-lg text-white ${
                !rejectionReason.trim()
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-red-600 hover:bg-red-700"
              }`}
            >
              Reject Item
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );

  const RejectTodoCompletionModal = () => (
    <Dialog
      open={showRejectTodoCompletionModal}
      onClose={() => setShowRejectTodoCompletionModal(false)}
      className="fixed inset-0 z-50 overflow-y-auto"
    >
      <div className="flex items-center justify-center min-h-screen bg-black bg-opacity-50 px-4">
        <Dialog.Panel
          className={`p-6 rounded-xl w-full max-w-md ${
            darkMode ? "bg-zinc-800 text-gray-100" : "bg-white text-gray-800"
          }`}
        >
          <Dialog.Title className="text-lg font-bold mb-4 flex items-center">
            <AlertCircle className="w-5 h-5 mr-2 text-orange-600" />
            Request Action Item Revision
          </Dialog.Title>
          <p className="text-sm mb-4 text-gray-500">
            The action item will be reopened. Please explain what needs to be
            improved:
          </p>
          <textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="What needs to be improved?"
            rows={3}
            className={`w-full p-3 rounded-lg border mb-4 ${
              darkMode
                ? "bg-zinc-700 border-zinc-600 text-white"
                : "bg-white border-gray-300 text-gray-800"
            }`}
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setShowRejectTodoCompletionModal(false);
                setRejectionReason("");
                setRejectingItemId(null);
              }}
              className={`px-4 py-2 rounded-lg ${
                darkMode
                  ? "bg-zinc-700 hover:bg-zinc-600"
                  : "bg-gray-200 hover:bg-gray-300"
              }`}
            >
              Cancel
            </button>
            <button
              onClick={handleRejectTodoCompletion}
              disabled={!rejectionReason.trim()}
              className={`px-4 py-2 rounded-lg text-white ${
                !rejectionReason.trim()
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-orange-600 hover:bg-orange-700"
              }`}
            >
              Request Revision
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );

  return (
    <div
      className={`flex-1 ${darkMode ? "bg-zinc-800 text-gray-200" : "bg-white text-gray-800"}`}>
      {/* Toast Notifications */}
      <ToastContainer />

      {/* Render Modals */}
      <RejectTaskModal />
      <RejectCompletionModal />
      <RejectTodoModal />
      <RejectTodoCompletionModal />

      <div className={`transition-all duration-200 ${isSidebarOpen ? "ml-[20px]" : "ml-[20px]"}`}>
        <div className="p-3">
          {selectedTask ? (
            renderTaskDetails()
          ) : (
            <>
              <div className="flex justify-between items-center mt-4 mb-8">
                <div className="ml-2">
                  <h1 className="text-2xl font-bold">All Tasks</h1>
                  <p className={`text-sm mt-1  ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                    Track and Update Tasks | <span>{assignedTasks.length}</span>{" "}
                    Total tasks
                  </p>
                </div>

                <div className="flex items-center space-x-4">
                  <div className={`flex items-center px-3 py-1 rounded-lg ${darkMode ? "bg-zinc-700 text-gray-100" : "bg-gray-200 text-gray-500"}`}>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      aria-label="Filter by status"
                      title="Filter by status"
                      className={`bg-transparent ${ darkMode ? "text-gray-200" : "text-gray-800" }`}>
                      <option value="all">All Tasks</option>
                      <option value="Pending">Pending</option>
                      <option value="Accepted">Accepted</option>
                      <option value="InProgress">In Progress</option>
                      <option value="WaitingForReview">Waiting Review</option>
                      <option value="Completed">Completed</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>

                  <div
                    className={`flex items-center px-3 py-1 rounded-lg ${ darkMode ? "bg-zinc-700" : "bg-gray-200" }`}>
                    <select
                      value={selectedProject || ""}
                      onChange={(e) =>
                        setSelectedProject(e.target.value || null)
                      }
                      aria-label="Filter by project"
                      title="Filter by project"
                      className={`bg-transparent focus:outline-none ${ darkMode ? "text-gray-200" : "text-gray-800" }`} >
                      <option value="">All Projects</option>
                      {projects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <Card className={`mb-8 ${darkMode ? "bg-zinc-800" : "bg-white"}`}>
                <CardContent className="p-0">
                  <div
                    className={`p-4 border-b ${
                      darkMode ? "border-zinc-700" : "border-gray-200"
                    }`}
                  >
                    <div className="flex flex-col ml-3  md:flex-row md:items-center md:justify-between gap-4">
                      <h2 className="text-lg font-semibold">Tasks</h2>
                      <div className="relative w-full md:w-64">
                        <input
                          type="text"
                          placeholder="Search tasks..."
                          value={searchText}
                          onChange={(e) => setSearchText(e.target.value)}
                          className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                            darkMode
                              ? "bg-zinc-700 border-zinc-600 text-white placeholder-gray-400 focus:border-purple-900"
                              : "bg-white border-gray-300 text-gray-800 placeholder-gray-500 focus:border-purple-400"
                          } focus:outline-none focus:ring-2 ${
                            darkMode
                              ? "focus:ring-purple-900"
                              : "focus:ring-blue-300"
                          }`}
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
                    </div>
                  </div>
                  <DataTable
                    columns={columns}
                    data={searchedTasks}
                    customStyles={customStyles}
                    onRowClicked={(row) => {
                      setSelectedTask(row);
                    }}
                    highlightOnHover
                    pointerOnHover
                    pagination
                    paginationPerPage={10}
                    paginationRowsPerPageOptions={[5, 10, 15, 20]}
                    theme={darkMode ? "dark" : "light"}
                    noDataComponent={
                      <div
                        className={`flex flex-col items-center justify-center py-12 px-4 rounded-lg ${
                          darkMode ? "bg-zinc-700" : "bg-white"
                        } `}
                      >
                        <div className="bg-gray-200 dark:bg-zinc-600 border-dashed rounded-full w-16 h-16 flex items-center justify-center mb-4">
                          <div className="bg-gray-300 dark:bg-zinc-500 border-2 border-dashed rounded-xl w-8 h-8"></div>
                        </div>
                        <h3 className="text-xl font-bold mb-2">
                          No tasks found
                        </h3>
                        <p
                          className={`text-center ${
                            darkMode ? "text-gray-400" : "text-gray-500"
                          } max-w-md`}
                        >
                          Try adjusting your filters or create new tasks.
                        </p>
                      </div>
                    }
                  />
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>

      
    </div>
  );
};

export default TaskBoard;
