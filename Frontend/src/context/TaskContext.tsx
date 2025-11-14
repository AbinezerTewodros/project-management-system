import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  ReactNode,
} from "react";
import { toast } from "react-toastify";

// Import services
import { projectTaskService } from "@/services/projectTaskService";
import { independentTaskService } from "@/services/independentTaskService";
import { todoItemService } from "@/services/todoItemService";
import { personalTodoService } from "@/services/personalTodoService";

// Import all relevant types
import {
  Task,
  TaskAction,
  TaskState,
  ProjectTaskReadDto,
  IndependentTaskReadDto,
  TodoItemReadDto,
  PersonalTodoReadDto,
  ProjectTaskCreateDto,
  IndependentTaskCreateDto,
  TodoItemCreateDto,
  PersonalTodoCreateDto,
  ProjectTaskUpdateDto,
  IndependentTaskUpdateDto,
  TodoItemUpdateDto,
  PersonalTodoUpdateDto,
  TaskCommentCreateDto,
  TaskStatus,
  TaskPriority,
  PersonalTodoStatus,
  PersonalTodoPriority,
} from "@/types/taskTypes";

// ======================================================================================
// Initial State & Reducer
// ======================================================================================

const initialState: TaskState = {
  tasks: [],
  loading: false,
  error: null,
  filters: {
    status: "",
    priority: "",
    assignee: "",
    searchText: "",
    showDeleted: false,
  },
};

const taskReducer = (state: TaskState, action: TaskAction): TaskState => {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload, loading: false };
    case "SET_TASKS":
      return { ...state, tasks: action.payload, loading: false };
    case "ADD_TASK":
      return { ...state, tasks: [action.payload, ...state.tasks] };
    case "UPDATE_TASK":
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.payload.id ? action.payload : t
        ),
      };
    case "DELETE_TASK":
      return {
        ...state,
        tasks: state.tasks.filter((t) => t.id !== action.payload),
      };
    default:
      return state;
  }
};

// ======================================================================================
// Type Transformation Utilities
// ======================================================================================

// Mapping functions for PersonalTodo enums
const mapPersonalTodoPriority = (backendPriority: PersonalTodoPriority): TaskPriority => {
  switch (backendPriority) {
    case PersonalTodoPriority.High:
    case PersonalTodoPriority.Critical:
      return TaskPriority.High;
    case PersonalTodoPriority.Medium:
      return TaskPriority.Medium;
    case PersonalTodoPriority.Low:
      return TaskPriority.Low;
    default:
      return TaskPriority.Medium;
  }
};

const mapPersonalTodoStatus = (backendStatus: PersonalTodoStatus, isCompleted: boolean): TaskStatus => {
  if (isCompleted || backendStatus === PersonalTodoStatus.Completed) {
    return TaskStatus.Completed;
  }
  if (backendStatus === PersonalTodoStatus.InProgress) {
    return TaskStatus.InProgress;
  }
  return TaskStatus.Pending;
};

const transformToTask = (
  item:
    | ProjectTaskReadDto
    | IndependentTaskReadDto
    | TodoItemReadDto
    | PersonalTodoReadDto,
  type: "Project" | "Independent" | "Todo" | "Personal"
): Task => {
  // Add null checks for all required properties
  if (!item) {
    console.error("❌ transformToTask: item is undefined or null");
    return createFallbackTask(type);
  }

  // Handle different ID field names
  let itemId: string;
  let taskId: number | undefined;

    if (type === 'Independent') {
      const independentItem = item as IndependentTaskReadDto;
      itemId = independentItem.taskId.toString();
      taskId = independentItem.taskId;
    } else if (type === 'Project') {
      const projectItem = item as ProjectTaskReadDto;
      itemId = projectItem.id.toString();
      taskId = projectItem.id;
    } else if (type === 'Personal') {
      const personalItem = item as PersonalTodoReadDto;
      itemId = personalItem.todoId.toString();
      taskId = personalItem.todoId;
    } else if (type === 'Todo') {
      const todoItem = item as TodoItemReadDto;
      itemId = todoItem.id.toString();
      taskId = todoItem.id;
    } else {
      // Fallback for other types
      itemId = ('id' in item ? item.id : 'taskId' in item ? item.taskId : Date.now()).toString();
    }

  // Handle assignee based on type
  let assignee = "";
  if (type === "Project") {
    const projectItem = item as ProjectTaskReadDto;
    assignee = projectItem.assignedMemberId || "";
  } else if (type === "Independent") {
    const independentItem = item as IndependentTaskReadDto;
    assignee = independentItem.assignedToUserId || "";
  }

  // Handle project ID based on type
  let projectId = "";
  if (type === "Project") {
    const projectItem = item as ProjectTaskReadDto;
    projectId = projectItem.projectAssignmentId.toString();
  }

  // Handle createdByUserId based on type
  let createdByUserId = "";
  if (type === "Independent") {
    const independentItem = item as IndependentTaskReadDto;
    createdByUserId = independentItem.createdByUserId || "";
  } else if (type === "Project") {
    const projectItem = item as ProjectTaskReadDto;
    createdByUserId = projectItem.createdByUserId || "";
  }

  // Preserve backend filtering markers if they exist
  const itemWithMarkers = item as unknown as Record<string, unknown>;
  const isAssignedToMe = (itemWithMarkers._isAssignedToMe as boolean) || false;
  const isCreatedByMe = (itemWithMarkers._isCreatedByMe as boolean) || false;

  const task: Task = {
    id: itemId,
    taskId: taskId,
    title: type === 'Personal'
      ? (item as PersonalTodoReadDto).task
      : (item as ProjectTaskReadDto | IndependentTaskReadDto | TodoItemReadDto).title || 'Untitled Task',
    description: item.description || '',
    isCompleted: 'isCompleted' in item ? item.isCompleted : false,
    type,
    priority:
      type === "Personal" && "priority" in item
        ? mapPersonalTodoPriority(item.priority as PersonalTodoPriority)
        : ("priority" in item ? item.priority : TaskPriority.Medium) ||
          TaskPriority.Medium,
    status:
      type === "Personal" && "status" in item && "isCompleted" in item
        ? mapPersonalTodoStatus(item.status as PersonalTodoStatus, (item as PersonalTodoReadDto).isCompleted)
        : "status" in item && item.status
        ? (item.status as TaskStatus)
        : TaskStatus.Pending,
    progress: "progress" in item ? item.progress : 0,
    assignee,
    projectId,
    dueDate: "dueDate" in item ? item.dueDate : undefined,
    createdAt: "createdAt" in item ? item.createdAt : new Date().toISOString(),
    updatedAt: "updatedAt" in item ? item.updatedAt : new Date().toISOString(),
    weight: "weight" in item ? item.weight : 0,
    deleted: false,
    createdByUserId,
    _isAssignedToMe: isAssignedToMe,
    _isCreatedByMe: isCreatedByMe,
  } as Task & { _isAssignedToMe?: boolean; _isCreatedByMe?: boolean };

  console.log("✅ Transformed task:", task);
  console.log("🔍 Task transformation details:", {
    originalItem: item,
    type,
    itemId,
    taskId,
    assignee,
    projectId,
    createdByUserId,
  });
  return task;
};

const createFallbackTask = (
  type: "Project" | "Independent" | "Todo" | "Personal"
): Task => {
  return {
    id: `fallback-${Date.now()}`,
    title: "Invalid Task",
    description: "This task could not be loaded properly",
    isCompleted: false,
    type,
    priority: TaskPriority.Medium,
    status: TaskStatus.Pending,
    progress: 0,
  };
};

// ======================================================================================
// Context Definition
// ======================================================================================

interface TaskContextType {
  state: TaskState;
  dispatch: React.Dispatch<TaskAction>;
  fetchTasks: () => Promise<void>;
  createTask: (
    taskData:
      | ProjectTaskCreateDto
      | IndependentTaskCreateDto
      | TodoItemCreateDto
      | PersonalTodoCreateDto,
    type: "Project" | "Independent" | "Todo" | "Personal"
  ) => Promise<void>;
  updateTask: (
    id: string,
    taskData:
      | ProjectTaskUpdateDto
      | IndependentTaskUpdateDto
      | TodoItemUpdateDto
      | PersonalTodoUpdateDto,
    type: "Project" | "Independent" | "Todo" | "Personal"
  ) => Promise<void>;
  deleteTask: (
    id: string,
    type: "Project" | "Independent" | "Todo" | "Personal"
  ) => Promise<void>;
  restoreTask: (
    id: string,
    type: "Project" | "Independent" | "Todo" | "Personal"
  ) => Promise<void>;
  addComment: (taskId: string, payload: TaskCommentCreateDto) => Promise<void>;
  // Independent task specific methods
  acceptTask: (taskId: number) => Promise<void>;
  rejectTask: (taskId: number, reason: string) => Promise<void>;
  completeTask: (taskId: number, completionDetails: string) => Promise<void>;
  updateTaskProgress: (
    taskId: number,
    progress: number,
    comments?: string
  ) => Promise<void>;
  approveTaskCompletion: (taskId: number, comments?: string) => Promise<void>;
  rejectTaskCompletion: (taskId: number, reason: string) => Promise<void>;
  // New methods for enhanced functionality
  reassignTask: (
    taskId: number,
    newAssigneeId: string,
    type: "Project" | "Independent" | "Todo" | "Personal"
  ) => Promise<void>;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

// ======================================================================================
// Provider Component
// ======================================================================================

export const TaskProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(taskReducer, initialState);

 const fetchTasks = async () => {
  dispatch({ type: 'SET_LOADING', payload: true });
  try {
    console.log('🔄 Fetching tasks...');

    // Test each service with detailed logging
    console.log('🔍 Testing project tasks service...');
    let projectTasks: ProjectTaskReadDto[] = [];
    try {
      projectTasks = await projectTaskService.getAllTasks();
      console.log('📦 Project tasks raw response:', projectTasks);
      console.log('🔢 Project tasks is array?', Array.isArray(projectTasks));
      if (Array.isArray(projectTasks)) {
        console.log(`📊 Project tasks count: ${projectTasks.length}`);
        if (projectTasks.length > 0) {
          console.log('🔍 First project task sample:', projectTasks[0]);

          // Log status of task ID 9 specifically
          const task9 = projectTasks.find((t: any) => t.id === 9);
          if (task9) {
            console.log('🎯 ═══════════════════════════════════════════');
            console.log('🎯 TASK ID 9 FROM BACKEND:');
            console.log('🎯 ═══════════════════════════════════════════');
            console.log(JSON.stringify(task9, null, 2));
            console.log('🎯 Status from backend:', task9.status);
            console.log('🎯 ═══════════════════════════════════════════');
          }
        }
      }
    } catch (error) {
      console.error('❌ Project tasks failed:', error);
    }

      console.log("🔍 Testing independent tasks service...");
      let independentTasks: IndependentTaskReadDto[] = [];
      let independentTasksAssigned: IndependentTaskReadDto[] = [];

      try {
        // Fetch all tasks (for backward compatibility)
        independentTasks = await independentTaskService.getAllTasks();
        console.log("📦 All Independent tasks:", independentTasks.length);

        // Fetch tasks assigned to current user
        try {
          independentTasksAssigned = await independentTaskService.getMyTasks();
          console.log(
            "📦 Independent tasks assigned to me:",
            independentTasksAssigned.length
          );
          // Mark these tasks as assigned to current user (for frontend filtering)
          independentTasksAssigned = independentTasksAssigned.map(
            (t) =>
              ({
                ...t,
                _isAssignedToMe: true,
              } as IndependentTaskReadDto & { _isAssignedToMe: boolean })
          );
        } catch (err) {
          console.log("⚠️  getMyTasks() not available, will use getAllTasks");
        }

        // Merge all unique tasks (use Map to avoid duplicates)
        const taskMap = new Map<
          number,
          IndependentTaskReadDto & {
            _isAssignedToMe?: boolean;
            _isCreatedByMe?: boolean;
          }
        >();

        // Add all tasks first
        independentTasks.forEach((t) => taskMap.set(t.taskId, t));

        // Override with assigned tasks (these have the marker)
        independentTasksAssigned.forEach((t) => {
          const existing = taskMap.get(t.taskId) || {};
          taskMap.set(t.taskId, { ...existing, ...t });
        });

        independentTasks = Array.from(taskMap.values());
        console.log(
          "📊 Total unique independent tasks:",
          independentTasks.length
        );
        console.log(
          "📊 Tasks with _isAssignedToMe marker:",
          independentTasks.filter(
            (t: IndependentTaskReadDto & { _isAssignedToMe?: boolean }) =>
              t._isAssignedToMe
          ).length
        );

        if (independentTasks.length > 0) {
          console.log("🔍 First independent task sample:", independentTasks[0]);
        }
      } catch (error: unknown) {
        console.error("❌ Independent tasks failed:", error);
      }

      console.log("🔍 Testing personal todos service...");
      let personalTodos: PersonalTodoReadDto[] = [];
      try {
        personalTodos = await personalTodoService.getUserTodos();
        console.log("📦 Personal todos raw response:", personalTodos);
        console.log(
          "🔢 Personal todos is array?",
          Array.isArray(personalTodos)
        );
        if (Array.isArray(personalTodos)) {
          console.log(`📊 Personal todos count: ${personalTodos.length}`);
          if (personalTodos.length > 0) {
            console.log("🔍 First personal todo sample:", personalTodos[0]);
          }
        }
      } catch (error: unknown) {
        console.error("❌ Personal todos failed:", error);
      }

      // Ensure we have arrays
      const projectTasksArray = Array.isArray(projectTasks) ? projectTasks : [];
      const independentTasksArray = Array.isArray(independentTasks)
        ? independentTasks
        : [];
      const personalTodosArray = Array.isArray(personalTodos)
        ? personalTodos
        : [];

      console.log(
        `📊 Final arrays - Project: ${projectTasksArray.length}, Independent: ${independentTasksArray.length}, Personal: ${personalTodosArray.length}`
      );

      // Transform tasks with error handling
      const allTasks = [
        ...projectTasksArray.map((t: ProjectTaskReadDto, index: number) => {
          try {
            return transformToTask(t, "Project");
          } catch (error) {
            console.error(
              `❌ Failed to transform project task at index ${index}:`,
              t,
              error
            );
            return createFallbackTask("Project");
          }
        }),
        ...independentTasksArray.map(
          (t: IndependentTaskReadDto, index: number) => {
            try {
              return transformToTask(t, "Independent");
            } catch (error) {
              console.error(
                `❌ Failed to transform independent task at index ${index}:`,
                t,
                error
              );
              return createFallbackTask("Independent");
            }
          }
        ),
        ...personalTodosArray.map((t: PersonalTodoReadDto, index: number) => {
          try {
            return transformToTask(t, "Personal");
          } catch (error) {
            console.error(
              `❌ Failed to transform personal todo at index ${index}:`,
              t,
              error
            );
            return createFallbackTask("Personal");
          }
        }),
      ].filter((task) => task !== null);

    console.log(`🎯 Successfully transformed ${allTasks.length} tasks`);
    console.log('🔍 Final task list sample:', allTasks.slice(0, 3).map(t => ({
      id: t.id,
      title: t.title,
      type: t.type,
      assignee: t.assignee,
      createdByUserId: t.createdByUserId
    })));

    dispatch({ type: 'SET_TASKS', payload: allTasks });

  } catch (err: any) {
    console.error('💥 Global fetch error:', err);
    dispatch({ type: 'SET_ERROR', payload: 'Failed to load tasks' });
    toast.error('Unable to load tasks. Please check console for details.');
  }
};

// ... existing code ...

  const createTask = async (
  taskData: ProjectTaskCreateDto | IndependentTaskCreateDto | TodoItemCreateDto | PersonalTodoCreateDto,
  type: 'Project' | 'Independent' | 'Todo' | 'Personal'
) => {
  try {
    let newTaskDto;

    switch (type) {
      case 'Project': {
        const projectData = taskData as ProjectTaskCreateDto;

        console.log('📤 Creating project task with JSON data:', projectData);
        newTaskDto = await projectTaskService.createTask(projectData);
        break;
      }
      case 'Independent': {
        const independentData = taskData as IndependentTaskCreateDto;
        console.log('📤 Creating independent task with data:', independentData);
        newTaskDto = await independentTaskService.createTask(independentData);
        break;
      }
      case 'Personal': {
        const personalData = taskData as PersonalTodoCreateDto;
        console.log('📤 Creating personal todo with data:', personalData);
        newTaskDto = await personalTodoService.create(personalData);
        break;
      }
      default:
        throw new Error(`Unsupported task type: ${type}`);
    }

    console.log('✅ Backend returned task:', newTaskDto);
    const newTask = transformToTask(newTaskDto, type);
    console.log('✅ Transformed new task:', newTask);
    console.log('✅ Task CreatedByUserId:', newTask.createdByUserId);
    dispatch({ type: 'ADD_TASK', payload: newTask });

    console.log('✅ Task added to state successfully');

    toast.success(`Task created successfully!`);

  } catch (err: any) {
    console.error('❌ Task creation failed:', err);
    toast.error(`Failed to create task: ${err.message}`);
    throw err;
  }
};

  const updateTask = async (
    id: string,
    taskData:
      | ProjectTaskUpdateDto
      | IndependentTaskUpdateDto
      | TodoItemUpdateDto
      | PersonalTodoUpdateDto,
    type: "Project" | "Independent" | "Todo" | "Personal"
  ) => {
    try {
      let updatedTaskDto;
      const numId = parseInt(id, 10);
      switch (type) {
        case "Project": {
          const formData = new FormData();
          Object.entries(taskData as ProjectTaskUpdateDto).forEach(
            ([key, value]) => {
              if (value !== undefined && value !== null)
                formData.append(key, String(value));
            }
          );
          updatedTaskDto = await projectTaskService.updateTask(numId, formData);
          break;
        }
        case "Independent": {
          const independentData = taskData as IndependentTaskUpdateDto;
          const updateData = { ...independentData, taskId: numId };
          updatedTaskDto = await independentTaskService.updateTask(
            numId,
            updateData
          );
          break;
        }
        case "Todo":
          updatedTaskDto = await todoItemService.update(
            numId,
            taskData as TodoItemUpdateDto
          );
          break;
        case "Personal":
          updatedTaskDto = await personalTodoService.update(
            numId,
            taskData as PersonalTodoUpdateDto
          );
          break;
      }
      const updatedTask = transformToTask(updatedTaskDto, type);
      dispatch({ type: "UPDATE_TASK", payload: updatedTask });

      await fetchTasks();

      toast.success(`Task updated successfully!`);
    } catch (err: unknown) {
      const error = err as { message: string };
      toast.error(`Failed to update task: ${error.message}`);
    }
  };

  const deleteTask = async (
    id: string,
    type: "Project" | "Independent" | "Todo" | "Personal"
  ) => {
    try {
      const numId = parseInt(id, 10);
      switch (type) {
        case "Project":
          await projectTaskService.deleteTask(numId);
          break;
        case "Independent":
          await independentTaskService.deleteTask(numId);
          break;
        case "Todo":
          await todoItemService.delete(numId);
          break;
        case "Personal":
          await personalTodoService.delete(numId);
          break;
      }
      dispatch({ type: "DELETE_TASK", payload: id });
      toast.success("Task deleted successfully!");
    } catch (err: unknown) {
      const error = err as { message: string };
      toast.error(`Failed to delete task: ${error.message}`);
    }
  };

  const restoreTask = async (
    id: string,
    type: "Project" | "Independent" | "Todo" | "Personal"
  ) => {
    try {
      const numId = parseInt(id, 10);
      switch (type) {
        case "Independent":
          await independentTaskService.restoreTask(numId);
          break;
        case "Project": {
          const existingProjectTask = state.tasks.find((t) => t.id === id);
          if (existingProjectTask) {
            dispatch({
              type: "UPDATE_TASK",
              payload: { ...existingProjectTask, deleted: false },
            });
          }
          break;
        }
        case "Personal": {
          const existingPersonalTask = state.tasks.find((t) => t.id === id);
          if (existingPersonalTask) {
            dispatch({
              type: "UPDATE_TASK",
              payload: { ...existingPersonalTask, deleted: false },
            });
          }
          break;
        }
        default:
          throw new Error(`Unsupported task type: ${type}`);
      }

      await fetchTasks();
      toast.success("Task restored successfully!");
    } catch (err: unknown) {
      const error = err as { message: string };
      toast.error(`Failed to restore task: ${error.message}`);
    }
  };

  const addComment = async (taskId: string, payload: TaskCommentCreateDto) => {
    try {
      await projectTaskService.addComment(parseInt(taskId, 10), payload);
      toast.success("Comment added!");
    } catch (err: unknown) {
      const error = err as { message: string };
      toast.error(`Failed to add comment: ${error.message}`);
    }
  };

  const acceptTask = async (taskId: number) => {
    try {
      await independentTaskService.acceptTask(taskId);
      toast.success("Task accepted successfully!");
      await fetchTasks();
    } catch (err: unknown) {
      const error = err as { message: string };
      toast.error(`Failed to accept task: ${error.message}`);
    }
  };

  const rejectTask = async (taskId: number, reason: string) => {
    try {
      await independentTaskService.rejectTask(taskId, reason);
      toast.success("Task rejected successfully!");
      await fetchTasks();
    } catch (err: unknown) {
      const error = err as { message: string };
      toast.error(`Failed to reject task: ${error.message}`);
    }
  };

  const completeTask = async (taskId: number, completionDetails: string) => {
    try {
      await independentTaskService.completeTask(taskId, completionDetails);
      toast.success("Task completed successfully!");
      await fetchTasks();
    } catch (err: unknown) {
      const error = err as { message: string };
      toast.error(`Failed to complete task: ${error.message}`);
    }
  };

  const updateTaskProgress = async (
    taskId: number,
    progress: number,
    comments?: string
  ) => {
    try {
      await independentTaskService.updateProgress(taskId, progress, comments);
      toast.success("Task progress updated successfully!");
      await fetchTasks();
    } catch (err: unknown) {
      const error = err as { message: string };
      toast.error(`Failed to update task progress: ${error.message}`);
    }
  };

  const approveTaskCompletion = async (taskId: number, comments?: string) => {
    try {
      await independentTaskService.approveCompletion(taskId, comments);
      toast.success("Task completion approved successfully!");
      await fetchTasks();
    } catch (err: unknown) {
      const error = err as { message: string };
      toast.error(`Failed to approve task completion: ${error.message}`);
    }
  };

  const rejectTaskCompletion = async (taskId: number, reason: string) => {
    try {
      await independentTaskService.rejectCompletion(taskId, reason);
      toast.success("Task completion rejected successfully!");
      await fetchTasks();
    } catch (err: unknown) {
      const error = err as { message: string };
      toast.error(`Failed to reject task completion: ${error.message}`);
    }
  };

  const reassignTask = async (
    taskId: number,
    newAssigneeId: string,
    type: "Project" | "Independent" | "Todo" | "Personal"
  ) => {
    try {
      switch (type) {
        case "Independent":
          await independentTaskService.reassignTask(taskId, newAssigneeId);
          break;
        case "Project": {
          const projectTask = state.tasks.find(
            (t) => t.taskId === taskId && t.type === "Project"
          );
          if (projectTask) {
            dispatch({
              type: "UPDATE_TASK",
              payload: { ...projectTask, assignee: newAssigneeId },
            });
          }
          break;
        }
        default:
          throw new Error(`Reassign not supported for task type: ${type}`);
      }

      await fetchTasks();
      toast.success("Task reassigned successfully!");
    } catch (err: unknown) {
      const error = err as { message: string };
      toast.error(`Failed to reassign task: ${error.message}`);
    }
  };

  useEffect(() => {
    fetchTasks();

    const refreshInterval = setInterval(() => {
      console.log("🔄 Auto-refreshing tasks...");
      fetchTasks();
    }, 5 * 60 * 1000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        console.log("👀 Tab became visible, refreshing tasks...");
        fetchTasks();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    let lastFocusTime = Date.now();
    const handleFocus = () => {
      const now = Date.now();
      const timeSinceLastFocus = now - lastFocusTime;

      if (timeSinceLastFocus > 5 * 60 * 1000) {
        console.log(
          "🔄 Window regained focus after long time, refreshing tasks..."
        );
        fetchTasks();
      }

      lastFocusTime = now;
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      clearInterval(refreshInterval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <TaskContext.Provider
      value={{
        state,
        dispatch,
        fetchTasks,
        createTask,
        updateTask,
        deleteTask,
        restoreTask,
        addComment,
        acceptTask,
        rejectTask,
        completeTask,
        updateTaskProgress,
        approveTaskCompletion,
        rejectTaskCompletion,
        reassignTask,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
};

// ======================================================================================
// Custom Hook
// ======================================================================================

export const useTasks = () => {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error("useTasks must be used within a TaskProvider");
  }
  return context;
};
