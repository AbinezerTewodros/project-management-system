import { useEffect, useMemo, useState } from "react";
import {
  Paperclip,
  ChevronLeft,
  RefreshCw,
  Calendar,
  Edit,
  Trash2,
  Save,
  X,
  Clock,
  Bell,
  Tag,
  FileText,
} from "lucide-react";
import DataTable from "react-data-table-component";
import { personalTodoService } from "@/services/personalTodoService";
import {
  PersonalTodoCreateDto,
  PersonalTodoReadDto,
  PersonalTodoUpdateDto,
  PersonalTodoPriority,
  PersonalTodoStatus,
} from "@/types/taskTypes";
import { toast } from "react-toastify";
import { Card, CardContent } from "@/components/ui/card";

type Subtask = {
  id: string;
  title: string;
  type: "Subtask";
  weight: number;
  completed: boolean;
};

type Todo = {
  id: number;
  title: string;
  description: string;
  dueDate: string;
  createdBy: string;
  assignedTo: string;
  priority: "High" | "Medium" | "Low";
  status: "To Do" | "In Progress" | "Done";
  progress: number;
  files: {
    name: string;
    size: number;
    type: string;
    url: string;
  }[];
  subtasks: Subtask[];
};

type Priority = "Low" | "Medium" | "High";

const getTodayDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Helper function to format date without timezone issues
const formatDateWithoutTimezone = (dateString: string | undefined): string => {
  if (!dateString) {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  try {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error("Error formatting date:", error);
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
};

// Helper function to format date for input field without timezone issues
const formatDateForInput = (
  dateString: string | undefined
): string | undefined => {
  if (!dateString) return undefined;

  try {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error("Error formatting date:", error);
    return undefined;
  }
};

const convertToFrontendTodo = (todo: PersonalTodoReadDto): Todo => {
  // Map backend PersonalTodoStatus to frontend status strings
  const mapStatus = (
    backendStatus: PersonalTodoStatus,
    isCompleted: boolean
  ): "To Do" | "In Progress" | "Done" => {
    if (isCompleted || backendStatus === PersonalTodoStatus.Completed) {
      return "Done";
    }
    if (backendStatus === PersonalTodoStatus.InProgress) {
      return "In Progress";
    }
    return "To Do";
  };

  // Map backend PersonalTodoPriority to frontend priority strings
  const mapPriority = (
    backendPriority: PersonalTodoPriority
  ): "High" | "Medium" | "Low" => {
    switch (backendPriority) {
      case PersonalTodoPriority.High:
      case PersonalTodoPriority.Critical:
        return "High";
      case PersonalTodoPriority.Medium:
        return "Medium";
      case PersonalTodoPriority.Low:
      default:
        return "Low";
    }
  };

  return {
    id: todo.todoId,
    title: todo.task,
    description: todo.description || "",
    dueDate: formatDateWithoutTimezone(todo.dueDate),
    createdBy: "Me",
    assignedTo: "Me",
    priority: mapPriority(todo.priority),
    status: mapStatus(todo.status, todo.isCompleted),
    progress: todo.progress || 0,
    files: [],
    subtasks: [],
  };
};

// ================================================================================
// PersonalTodoDetailView Component (merged inline)
// ================================================================================

interface PersonalTodoDetailViewProps {
  todo: PersonalTodoReadDto;
  onBack: () => void;
  onTodoUpdated: (updatedTodo: PersonalTodoReadDto) => void;
  onTodoDeleted: () => void;
  darkMode: boolean;
}

const PersonalTodoDetailView: React.FC<PersonalTodoDetailViewProps> = ({
  todo,
  onBack,
  onTodoUpdated,
  onTodoDeleted,
  darkMode,
}) => {
  console.log("PersonalTodoDetailView received todo:", todo);

  if (!todo) {
    return (
      <div
        className={`min-h-screen p-6 ${
          darkMode ? "bg-zinc-900 text-gray-100" : "bg-gray-50 text-gray-900"
        }`}
      >
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold mb-4">Todo Not Found</h1>
            <p className="mb-6">The requested todo could not be loaded.</p>
            <button
              onClick={onBack}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const [isEditing, setIsEditing] = useState(false);
  const [editedTodo, setEditedTodo] = useState<PersonalTodoUpdateDto>({
    task: todo.task || "",
    description: todo.description || "",
    dueDate: formatDateForInput(todo.dueDate),
    priority: todo.priority || PersonalTodoPriority.Medium,
    status: todo.status || PersonalTodoStatus.Pending,
    progress: todo.progress || 0,
    isCompleted: todo.isCompleted || false,
    enableReminders: todo.enableReminders || true,
    reminderHoursBeforeDue: todo.reminderHoursBeforeDue || 24,
    enableEmailReminders: todo.enableEmailReminders || true,
    enablePushNotifications: todo.enablePushNotifications || true,
    enableSmsReminders: todo.enableSmsReminders || false,
    tags: todo.tags || "",
    notes: todo.notes || "",
    isRecurring: todo.isRecurring || false,
    recurrencePattern: todo.recurrencePattern || "",
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    console.log("Todo prop changed, syncing editedTodo state");
    setEditedTodo({
      task: todo.task || "",
      description: todo.description || "",
      dueDate: formatDateForInput(todo.dueDate),
      priority: todo.priority || PersonalTodoPriority.Medium,
      status: todo.status || PersonalTodoStatus.Pending,
      progress: todo.progress || 0,
      isCompleted: todo.isCompleted || false,
      enableReminders: todo.enableReminders || true,
      reminderHoursBeforeDue: todo.reminderHoursBeforeDue || 24,
      enableEmailReminders: todo.enableEmailReminders || true,
      enablePushNotifications: todo.enablePushNotifications || true,
      enableSmsReminders: todo.enableSmsReminders || false,
      tags: todo.tags || "",
      notes: todo.notes || "",
      isRecurring: todo.isRecurring || false,
      recurrencePattern: todo.recurrencePattern || "",
    });
  }, [todo]);

  const handleSave = async () => {
    if (!editedTodo.task?.trim()) {
      toast.error("Task title is required");
      return;
    }

    console.log("Saving todo with ID:", todo.todoId);
    console.log("Edited todo data:", editedTodo);

    setIsLoading(true);
    try {
      const updatedTodo = await personalTodoService.update(
        todo.todoId,
        editedTodo
      );
      console.log("Received updated todo from backend:", updatedTodo);

      if (!updatedTodo || typeof updatedTodo.todoId === "undefined") {
        console.error("Invalid response from backend:", updatedTodo);
        toast.error("Failed to update todo - invalid response from server");
        return;
      }

      onTodoUpdated(updatedTodo);
      setIsEditing(false);
      toast.success("Todo updated successfully!");
    } catch (error) {
      console.error("Error updating todo:", error);
      toast.error("Failed to update todo");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setEditedTodo({
      task: todo.task || "",
      description: todo.description || "",
      dueDate: formatDateForInput(todo.dueDate),
      priority: todo.priority || PersonalTodoPriority.Medium,
      status: todo.status || PersonalTodoStatus.Pending,
      progress: todo.progress || 0,
      isCompleted: todo.isCompleted || false,
      enableReminders: todo.enableReminders || true,
      reminderHoursBeforeDue: todo.reminderHoursBeforeDue || 24,
      enableEmailReminders: todo.enableEmailReminders || true,
      enablePushNotifications: todo.enablePushNotifications || true,
      enableSmsReminders: todo.enableSmsReminders || false,
      tags: todo.tags || "",
      notes: todo.notes || "",
      isRecurring: todo.isRecurring || false,
      recurrencePattern: todo.recurrencePattern || "",
    });
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this todo?")) {
      setIsLoading(true);
      try {
        await personalTodoService.delete(todo.todoId);
        onTodoDeleted();
        toast.success("Todo deleted successfully!");
      } catch (error) {
        console.error("Error deleting todo:", error);
        toast.error("Failed to delete todo");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const formatDetailDate = (dateString: string | undefined) => {
    if (!dateString) return "Not set";
    try {
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = date.toLocaleString("en-US", { month: "short" });
      const day = date.getDate();
      return `${month} ${day}, ${year}`;
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid date";
    }
  };

  const getPriorityColor = (priority: PersonalTodoPriority) => {
    switch (priority) {
      case PersonalTodoPriority.High:
      case PersonalTodoPriority.Critical:
        return "bg-red-100 text-red-800 border-red-300";
      case PersonalTodoPriority.Medium:
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case PersonalTodoPriority.Low:
        return "bg-green-100 text-green-800 border-green-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getStatusColor = (status: PersonalTodoStatus) => {
    switch (status) {
      case PersonalTodoStatus.Completed:
        return "bg-green-100 text-green-800 border-green-300";
      case PersonalTodoStatus.InProgress:
        return "bg-blue-100 text-blue-800 border-blue-300";
      case PersonalTodoStatus.Overdue:
        return "bg-red-100 text-red-800 border-red-300";
      case PersonalTodoStatus.Cancelled:
        return "bg-gray-100 text-gray-800 border-gray-300";
      case PersonalTodoStatus.Pending:
      default:
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
    }
  };

  const inputClassName = (darkMode: boolean) =>
    `w-full p-3 rounded-lg border transition-colors ${
      darkMode
        ? "bg-zinc-700 border-zinc-600 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500"
        : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-purple-500 focus:ring-purple-500"
    } focus:outline-none focus:ring-2`;

  const labelClassName = (darkMode: boolean) =>
    `block text-sm font-medium mb-2 ${
      darkMode ? "text-gray-300" : "text-gray-700"
    }`;

  return (
    <div
      className={`min-h-screen p-6 ${
        darkMode ? "bg-zinc-900 text-gray-100" : "bg-gray-50 text-gray-900"
      }`}
    >
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className={`p-2 rounded-lg hover:bg-opacity-80 ${
                darkMode
                  ? "bg-zinc-700 hover:bg-zinc-600"
                  : "bg-gray-200 hover:bg-gray-300"
              }`}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold">
                {isEditing ? (
                  <input
                    type="text"
                    value={editedTodo.task || ""}
                    onChange={(e) =>
                      setEditedTodo({ ...editedTodo, task: e.target.value })
                    }
                    className={inputClassName(darkMode)}
                    placeholder="Task title"
                  />
                ) : (
                  todo.task || "Untitled Task"
                )}
              </h1>
              <p
                className={`text-sm ${
                  darkMode ? "text-gray-400" : "text-gray-500"
                }`}
              >
                Created {formatDetailDate(todo.createdAt)}
                {todo.updatedAt && todo.updatedAt !== todo.createdAt && (
                  <> • Updated {formatDetailDate(todo.updatedAt)}</>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  disabled={isLoading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{isLoading ? "Saving..." : "Save"}</span>
                </button>
                <button
                  onClick={handleCancel}
                  disabled={isLoading}
                  className={`px-4 py-2 rounded-lg border ${
                    darkMode
                      ? "border-zinc-600 hover:bg-zinc-700"
                      : "border-gray-300 hover:bg-gray-100"
                  } flex items-center space-x-2`}
                >
                  <X className="w-4 h-4" />
                  <span>Cancel</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className={`px-4 py-2 rounded-lg border ${
                    darkMode
                      ? "border-zinc-600 hover:bg-zinc-700"
                      : "border-gray-300 hover:bg-gray-100"
                  } flex items-center space-x-2`}
                >
                  <Edit className="w-4 h-4" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isLoading}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center space-x-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div
              className={`rounded-lg border p-6 ${
                darkMode
                  ? "border-zinc-700 bg-zinc-800"
                  : "border-gray-200 bg-white"
              }`}
            >
              <div className="flex items-center space-x-2 mb-4">
                <FileText className="w-5 h-5" />
                <h2 className="text-lg font-semibold">Description</h2>
              </div>
              {isEditing ? (
                <textarea
                  value={editedTodo.description || ""}
                  onChange={(e) =>
                    setEditedTodo({
                      ...editedTodo,
                      description: e.target.value,
                    })
                  }
                  className={inputClassName(darkMode)}
                  rows={4}
                  placeholder="Enter task description..."
                />
              ) : (
                <p
                  className={`${darkMode ? "text-gray-300" : "text-gray-700"}`}
                >
                  {todo.description || "No description provided"}
                </p>
              )}
            </div>

            <div
              className={`rounded-lg border p-6 ${
                darkMode
                  ? "border-zinc-700 bg-zinc-800"
                  : "border-gray-200 bg-white"
              }`}
            >
              <div className="flex items-center space-x-2 mb-4">
                <FileText className="w-5 h-5" />
                <h2 className="text-lg font-semibold">Notes</h2>
              </div>
              {isEditing ? (
                <textarea
                  value={editedTodo.notes || ""}
                  onChange={(e) =>
                    setEditedTodo({ ...editedTodo, notes: e.target.value })
                  }
                  className={inputClassName(darkMode)}
                  rows={3}
                  placeholder="Additional notes..."
                />
              ) : (
                <p
                  className={`${darkMode ? "text-gray-300" : "text-gray-700"}`}
                >
                  {todo.notes || "No notes"}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                className={`rounded-lg border p-4 ${
                  darkMode
                    ? "border-zinc-700 bg-zinc-800"
                    : "border-gray-200 bg-white"
                }`}
              >
                <div className="flex items-center space-x-2 mb-3">
                  <Tag className="w-4 h-4" />
                  <h3 className="text-md font-semibold">Tags</h3>
                </div>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedTodo.tags || ""}
                    onChange={(e) =>
                      setEditedTodo({ ...editedTodo, tags: e.target.value })
                    }
                    className={inputClassName(darkMode)}
                    placeholder="Comma-separated tags"
                  />
                ) : (
                  <p
                    className={`text-sm ${
                      darkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    {todo.tags || "No tags"}
                  </p>
                )}
              </div>

              <div
                className={`rounded-lg border p-4 ${
                  darkMode
                    ? "border-zinc-700 bg-zinc-800"
                    : "border-gray-200 bg-white"
                }`}
              >
                <div className="flex items-center space-x-2 mb-3">
                  <RefreshCw className="w-4 h-4" />
                  <h3 className="text-md font-semibold">Recurrence</h3>
                </div>
                {isEditing ? (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="isRecurring"
                        checked={editedTodo.isRecurring || false}
                        onChange={(e) =>
                          setEditedTodo({
                            ...editedTodo,
                            isRecurring: e.target.checked,
                          })
                        }
                        className="rounded"
                      />
                      <label htmlFor="isRecurring" className="text-sm">
                        Recurring task
                      </label>
                    </div>
                    {editedTodo.isRecurring && (
                      <input
                        type="text"
                        value={editedTodo.recurrencePattern || ""}
                        onChange={(e) =>
                          setEditedTodo({
                            ...editedTodo,
                            recurrencePattern: e.target.value,
                          })
                        }
                        className={inputClassName(darkMode)}
                        placeholder="e.g., daily, weekly, monthly"
                      />
                    )}
                  </div>
                ) : (
                  <p
                    className={`text-sm ${
                      darkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    {todo.isRecurring
                      ? todo.recurrencePattern || "No pattern specified"
                      : "Not recurring"}
                  </p>
                )}
              </div>
            </div>

            <div
              className={`rounded-lg border p-4 ${
                darkMode
                  ? "border-zinc-700 bg-zinc-800"
                  : "border-gray-200 bg-white"
              }`}
            >
              <div className="flex items-center space-x-2 mb-3">
                <Clock className="w-4 h-4" />
                <h3 className="text-md font-semibold">
                  Additional Information
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {todo.isOverdue ? (
                  <div className="flex items-center space-x-2 text-red-600">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm font-medium">Overdue</span>
                  </div>
                ) : (
                  <div
                    className={`text-sm ${
                      darkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    <span className="font-medium">Status:</span> On track
                  </div>
                )}
                {todo.timeUntilDueFormatted ? (
                  <div
                    className={`text-sm ${
                      darkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    <span className="font-medium">Time until due:</span>{" "}
                    {todo.timeUntilDueFormatted}
                  </div>
                ) : (
                  <div
                    className={`text-sm ${
                      darkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    <span className="font-medium">Time until due:</span> N/A
                  </div>
                )}
                {todo.daysUntilDue !== undefined ? (
                  <div
                    className={`text-sm ${
                      darkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    <span className="font-medium">Days until due:</span>{" "}
                    {todo.daysUntilDue}
                  </div>
                ) : (
                  <div
                    className={`text-sm ${
                      darkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    <span className="font-medium">Days until due:</span> N/A
                  </div>
                )}
              </div>
              {todo.needsReminder && (
                <div className="flex items-center space-x-2 text-yellow-600 mt-3">
                  <Bell className="w-4 h-4" />
                  <span className="text-sm">Reminder needed</span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div
              className={`rounded-lg border p-6 ${
                darkMode
                  ? "border-zinc-700 bg-zinc-800"
                  : "border-gray-200 bg-white"
              }`}
            >
              <h2 className="text-lg font-semibold mb-4">Status & Progress</h2>
              <div className="mb-4">
                <label className={labelClassName(darkMode)}>Status</label>
                {isEditing ? (
                  <select
                    value={editedTodo.status || PersonalTodoStatus.Pending}
                    onChange={(e) => {
                      const newStatus = e.target.value as PersonalTodoStatus;
                      setEditedTodo({
                        ...editedTodo,
                        status: newStatus,
                        isCompleted: newStatus === PersonalTodoStatus.Completed,
                        progress:
                          newStatus === PersonalTodoStatus.Completed
                            ? 100
                            : editedTodo.progress,
                      });
                    }}
                    className={inputClassName(darkMode)}
                  >
                    <option value={PersonalTodoStatus.Pending}>Pending</option>
                    <option value={PersonalTodoStatus.InProgress}>
                      In Progress
                    </option>
                    <option value={PersonalTodoStatus.Completed}>
                      Completed
                    </option>
                    <option value={PersonalTodoStatus.Overdue}>Overdue</option>
                    <option value={PersonalTodoStatus.Cancelled}>
                      Cancelled
                    </option>
                  </select>
                ) : (
                  <span
                    className={`px-3 py-1 rounded-full text-sm border ${getStatusColor(
                      todo.status
                    )}`}
                  >
                    {todo.status}
                  </span>
                )}
              </div>
              <div className="mb-4">
                <label className={labelClassName(darkMode)}>Progress</label>
                {isEditing ? (
                  <div className="space-y-2">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={editedTodo.progress || 0}
                      onChange={(e) => {
                        const newProgress = parseInt(e.target.value);
                        setEditedTodo({
                          ...editedTodo,
                          progress: newProgress,
                          isCompleted: newProgress === 100,
                          status:
                            newProgress === 100
                              ? PersonalTodoStatus.Completed
                              : newProgress > 0
                              ? PersonalTodoStatus.InProgress
                              : PersonalTodoStatus.Pending,
                        });
                      }}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm">
                      <span>{editedTodo.progress || 0}%</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div
                      className={`w-full h-2 rounded-full ${
                        darkMode ? "bg-zinc-700" : "bg-gray-200"
                      }`}
                    >
                      <div
                        className={`h-2 rounded-full ${
                          todo.progress < 30
                            ? "bg-red-500"
                            : todo.progress < 70
                            ? "bg-yellow-500"
                            : "bg-green-500"
                        }`}
                        style={{ width: `${todo.progress}%` }}
                      />
                    </div>
                    <span className="text-sm">{todo.progress}%</span>
                  </div>
                )}
              </div>
              {isEditing && (
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isCompleted"
                    checked={editedTodo.isCompleted || false}
                    onChange={(e) => {
                      const isCompleted = e.target.checked;
                      setEditedTodo({
                        ...editedTodo,
                        isCompleted,
                        progress: isCompleted ? 100 : editedTodo.progress,
                        status: isCompleted
                          ? PersonalTodoStatus.Completed
                          : editedTodo.status,
                      });
                    }}
                    className="rounded"
                  />
                  <label
                    htmlFor="isCompleted"
                    className={labelClassName(darkMode)}
                  >
                    Mark as completed
                  </label>
                </div>
              )}
            </div>

            <div
              className={`rounded-lg border p-6 ${
                darkMode
                  ? "border-zinc-700 bg-zinc-800"
                  : "border-gray-200 bg-white"
              }`}
            >
              <h2 className="text-lg font-semibold mb-4">Priority & Dates</h2>
              <div className="mb-4">
                <label className={labelClassName(darkMode)}>Priority</label>
                {isEditing ? (
                  <select
                    value={editedTodo.priority || PersonalTodoPriority.Medium}
                    onChange={(e) =>
                      setEditedTodo({
                        ...editedTodo,
                        priority: e.target.value as PersonalTodoPriority,
                      })
                    }
                    className={inputClassName(darkMode)}
                  >
                    <option value={PersonalTodoPriority.Low}>Low</option>
                    <option value={PersonalTodoPriority.Medium}>Medium</option>
                    <option value={PersonalTodoPriority.High}>High</option>
                    <option value={PersonalTodoPriority.Critical}>
                      Critical
                    </option>
                  </select>
                ) : (
                  <span
                    className={`px-3 py-1 rounded-full text-sm border ${getPriorityColor(
                      todo.priority
                    )}`}
                  >
                    {todo.priority}
                  </span>
                )}
              </div>
              <div className="mb-4">
                <label className={labelClassName(darkMode)}>Due Date</label>
                {isEditing ? (
                  <input
                    type="date"
                    value={editedTodo.dueDate || ""}
                    onChange={(e) =>
                      setEditedTodo({ ...editedTodo, dueDate: e.target.value })
                    }
                    className={inputClassName(darkMode)}
                  />
                ) : (
                  <p
                    className={`${
                      darkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    {todo.dueDate
                      ? formatDetailDate(todo.dueDate)
                      : "No due date set"}
                  </p>
                )}
              </div>
              {todo.startDate && (
                <div className="mb-4">
                  <label className={labelClassName(darkMode)}>Start Date</label>
                  <p
                    className={`${
                      darkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    {formatDetailDate(todo.startDate)}
                  </p>
                </div>
              )}
              {todo.completedDate && (
                <div className="mb-4">
                  <label className={labelClassName(darkMode)}>
                    Completed Date
                  </label>
                  <p
                    className={`${
                      darkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    {formatDetailDate(todo.completedDate)}
                  </p>
                </div>
              )}
            </div>

            <div
              className={`rounded-lg border p-6 ${
                darkMode
                  ? "border-zinc-700 bg-zinc-800"
                  : "border-gray-200 bg-white"
              }`}
            >
              <div className="flex items-center space-x-2 mb-4">
                <Bell className="w-5 h-5" />
                <h2 className="text-lg font-semibold">Reminder Settings</h2>
              </div>
              {isEditing ? (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="enableReminders"
                      checked={editedTodo.enableReminders || false}
                      onChange={(e) =>
                        setEditedTodo({
                          ...editedTodo,
                          enableReminders: e.target.checked,
                        })
                      }
                      className="rounded"
                    />
                    <label
                      htmlFor="enableReminders"
                      className={labelClassName(darkMode)}
                    >
                      Enable reminders
                    </label>
                  </div>
                  {editedTodo.enableReminders && (
                    <>
                      <div>
                        <label className={labelClassName(darkMode)}>
                          Hours before due
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="168"
                          value={editedTodo.reminderHoursBeforeDue || 24}
                          onChange={(e) =>
                            setEditedTodo({
                              ...editedTodo,
                              reminderHoursBeforeDue: parseInt(e.target.value),
                            })
                          }
                          className={inputClassName(darkMode)}
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="enableEmailReminders"
                            checked={editedTodo.enableEmailReminders || false}
                            onChange={(e) =>
                              setEditedTodo({
                                ...editedTodo,
                                enableEmailReminders: e.target.checked,
                              })
                            }
                            className="rounded"
                          />
                          <label
                            htmlFor="enableEmailReminders"
                            className={labelClassName(darkMode)}
                          >
                            Email reminders
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="enablePushNotifications"
                            checked={
                              editedTodo.enablePushNotifications || false
                            }
                            onChange={(e) =>
                              setEditedTodo({
                                ...editedTodo,
                                enablePushNotifications: e.target.checked,
                              })
                            }
                            className="rounded"
                          />
                          <label
                            htmlFor="enablePushNotifications"
                            className={labelClassName(darkMode)}
                          >
                            Push notifications
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="enableSmsReminders"
                            checked={editedTodo.enableSmsReminders || false}
                            onChange={(e) =>
                              setEditedTodo({
                                ...editedTodo,
                                enableSmsReminders: e.target.checked,
                              })
                            }
                            className="rounded"
                          />
                          <label
                            htmlFor="enableSmsReminders"
                            className={labelClassName(darkMode)}
                          >
                            SMS reminders
                          </label>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <p
                    className={`${
                      darkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Reminders: {todo.enableReminders ? "Enabled" : "Disabled"}
                  </p>
                  {todo.enableReminders && (
                    <>
                      <p
                        className={`text-sm ${
                          darkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        {todo.reminderHoursBeforeDue} hours before due
                      </p>
                      <div className="text-sm space-y-1">
                        {todo.enableEmailReminders && <p>📧 Email</p>}
                        {todo.enablePushNotifications && <p>🔔 Push</p>}
                        {todo.enableSmsReminders && <p>📱 SMS</p>}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ================================================================================
// Main Personal Component
// ================================================================================

const Personal = ({ darkMode }: { darkMode: boolean }) => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [originalTodos, setOriginalTodos] = useState<PersonalTodoReadDto[]>([]); // Store original backend data
  const [searchText, setSearchText] = useState("");
  const [selectedTodo, setSelectedTodo] = useState<PersonalTodoReadDto | null>(
    null
  );
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState("Medium");
  const [loading, setLoading] = useState(false);
  const [searchFilters, setSearchFilters] = useState({
    status: "",
    priority: "",
  });
  const minDate = getTodayDate();

  useEffect(() => {
    const fetchPerosnalTodos = async () => {
      try {
        setLoading(true);
        console.log("Fetching personal todos...");
        const todos = await personalTodoService.getUserTodos();
        console.log("Fetched todos:", todos);
        console.log("Type of todos:", typeof todos);
        console.log("Is array:", Array.isArray(todos));

        // Ensure we have an array before mapping
        if (!Array.isArray(todos)) {
          console.error("Expected array but got:", todos);
          setTodos([]);
          return;
        }

        const frontendTodos = todos.map(convertToFrontendTodo);
        setOriginalTodos(todos); // Store original backend data
        setTodos(frontendTodos);
      } catch (error) {
        console.error("Error fetching personal todos:", error);
        toast.error("Failed to load personal tasks. Please try again later.");
        setTodos([]);
      } finally {
        setLoading(false);
      }
    };
    fetchPerosnalTodos();
  }, []);

  const handleCreateTask = async () => {
    if (!newTaskTitle.trim()) return;
    try {
      // Map frontend priority string to backend enum
      const mapCreatePriority = (priority: string): PersonalTodoPriority => {
        switch (priority) {
          case "High":
            return PersonalTodoPriority.High;
          case "Medium":
            return PersonalTodoPriority.Medium;
          case "Low":
            return PersonalTodoPriority.Low;
          default:
            return PersonalTodoPriority.Medium;
        }
      };
      const createTodo: PersonalTodoCreateDto = {
        task: newTaskTitle,
        description: newTaskDescription,
        dueDate: newTaskDueDate || undefined,
        priority: mapCreatePriority(newTaskPriority),
        enableReminders: true,
        reminderHoursBeforeDue: 24,
        enableEmailReminders: true,
        enablePushNotifications: true,
        enableSmsReminders: false,
      };

      const newTodo = await personalTodoService.create(createTodo);
      // Add to original todos list
      setOriginalTodos([newTodo, ...originalTodos]);
      // Add to display todos list
      const newPersonalTodo = convertToFrontendTodo(newTodo);
      setTodos([newPersonalTodo, ...todos]);
      setShowCreateModal(false);
      setNewTaskTitle("");
      setNewTaskDescription("");
      setNewTaskDueDate("");
      setNewTaskPriority("Medium");

      toast.success("Task created successfully!");
    } catch (error) {
      console.error("Error creating personal todo:", error);
      toast.error("Failed to create task.");
    }
  };

  const handleTodoUpdated = (updatedTodo: PersonalTodoReadDto) => {
    console.log("handleTodoUpdated called with:", updatedTodo);

    // Validate updatedTodo
    if (!updatedTodo || !updatedTodo.todoId) {
      console.error("Invalid updatedTodo received:", updatedTodo);
      toast.error("Failed to update todo - invalid data received");
      return;
    }

    // Update the original todos list
    const updatedOriginalTodos = originalTodos.map((t) => {
      if (t.todoId === updatedTodo.todoId) {
        return updatedTodo;
      }
      return t;
    });
    setOriginalTodos(updatedOriginalTodos);

    // Update the display todos list with the converted todo
    const updatedTodos = todos.map((t) => {
      if (t.id === updatedTodo.todoId) {
        return convertToFrontendTodo(updatedTodo);
      }
      return t;
    });

    console.log("Updated todos list:", updatedTodos);
    setTodos(updatedTodos);
    setSelectedTodo(updatedTodo);
  };

  const handleTodoDeleted = () => {
    console.log("handleTodoDeleted called for todo:", selectedTodo);

    // Remove the deleted todo from both lists
    if (selectedTodo && selectedTodo.todoId) {
      setOriginalTodos(
        originalTodos.filter((t) => t.todoId !== selectedTodo.todoId)
      );
      setTodos(todos.filter((t) => t.id !== selectedTodo.todoId));
      setSelectedTodo(null);
    } else {
      console.error("Cannot delete - invalid selectedTodo:", selectedTodo);
    }
  };

  const handleDeleteTask = async (todoId: number) => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      try {
        await personalTodoService.delete(todoId);
        setOriginalTodos(originalTodos.filter((t) => t.todoId !== todoId));
        setTodos(todos.filter((t) => t.id !== todoId));
        if (selectedTodo?.todoId === todoId) {
          setSelectedTodo(null);
        }
        toast.success("Task deleted successfully!");
      } catch (error) {
        console.error("Error deleting task:", error);
        toast.error("Failed to delete task.");
      }
    }
  };

  const columns = [
    {
      name: "Task",
      selector: (row: Todo) => row.title,
      sortable: true,
      cell: (row: Todo) => (
        <div>
          <div className="font-medium">{row.title}</div>
          <div
            className={`text-sm ${
              darkMode ? "text-gray-400" : "text-gray-500"
            }`}
          >
            {row.description}
          </div>
        </div>
      ),
      minWidth: "200px",
    },

    {
      name: "Due Date",
      selector: (row: Todo) => row.dueDate,
      sortable: true,
    },
    {
      name: "Status",
      cell: (row: Todo) => (
        <span
          className={`px-2 py-1 text-xs rounded-full ${
            row.status === "Done"
              ? darkMode
                ? "bg-green-900 text-green-300"
                : "bg-green-100 text-green-800"
              : row.status === "In Progress"
              ? darkMode
                ? "bg-yellow-900 text-yellow-300"
                : "bg-yellow-100 text-yellow-800"
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
      cell: (row: Todo) => (
        <div className="flex items-center">
          <div
            className={`w-32 h-2 rounded-full ${
              darkMode ? "bg-gray-700" : "bg-gray-300"
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
            ></div>
          </div>
          <span className="ml-2 text-sm">{row.progress}%</span>
        </div>
      ),
      sortable: true,
    },
    {
      name: "Attachment",
      cell: (row: Todo) =>
        row.files && row.files.length > 0 ? (
          <div className="flex items-center">
            <Paperclip className="mr-1 h-4 w-4" />
            <span className="text-sm">
              {row.files.length} file{row.files.length !== 1 ? "s" : ""}
            </span>
          </div>
        ) : (
          <span className="text-sm text-gray-500">None</span>
        ),
    },
    {
      name: "Actions",
      cell: (row: Todo) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDeleteTask(row.id);
          }}
          aria-label="Delete task"
          title="Delete task"
          className={`px-2 py-1 text-xs rounded ${
            darkMode
              ? "bg-red-900 hover:bg-red-800 text-red-300"
              : "bg-red-100 hover:bg-red-200 text-red-800"
          }`}
        >
          <Trash2 size={14} />
        </button>
      ),
      width: "80px",
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
        paddingLeft: "10px",
        paddingRight: "9px",
        color: darkMode ? "#e5e7eb" : "#111827",
      },
    },
  };

  const filteredProjects = useMemo(() => {
    if (!searchText) return todos;
    const searchLower = searchText.toLowerCase();
    return todos.filter(
      (todo) =>
        todo.title.toLowerCase().includes(searchLower) ||
        todo.description.toLowerCase().includes(searchLower) ||
        todo.assignedTo.toLowerCase().includes(searchLower) ||
        todo.dueDate.toLowerCase().includes(searchLower) ||
        todo.status.toLowerCase().includes(searchLower) ||
        (todo.priority && todo.priority.toLowerCase().includes(searchLower))
    );
  }, [todos, searchText]);

  return (
    <div
      className={`p-4  overflow-y-auto ${
        darkMode ? "bg-zinc-800 text-gray-100" : "bg-white text-gray-800"
      }`}
    >
      {loading && (
        <div className="text-center p-4">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          <p className="mt-2">Loading personal tasks...</p>
        </div>
      )}
      {!loading && !selectedTodo ? (
        <>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">My Personal Todos</h1>
            <div className="flex gap-2">
              <button
                onClick={() => setShowCreateModal(true)}
                className={`px-4 py-2 rounded-lg ${
                  darkMode
                    ? "bg-purple-900 hover:bg-purple-800"
                    : "bg-purple-900 hover:bg-purple-800"
                } text-white`}
              >
                + Create Personal Todo
              </button>
            </div>
          </div>
          <Card>
            <CardContent>
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
                      Showing {todos.length} todos
                    </p>
                  </div>
                  <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        placeholder="Search tasks..."
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
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
                        <option key="todo" value="To Do">
                          To Do
                        </option>
                        <option key="in-progress" value="In Progress">
                          In Progress
                        </option>
                        <option key="done" value="Done">
                          Done
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
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              <DataTable
                columns={columns}
                data={filteredProjects}
                customStyles={customStyles}
                highlightOnHover
                pointerOnHover
                pagination
                paginationPerPage={10}
                paginationRowsPerPageOptions={[5, 10, 15, 20]}
                theme={darkMode ? "dark" : "light"}
                noDataComponent={
                  <div className="p-4 text-center">No todos found</div>
                }
                onRowClicked={(row) => {
                  console.log("Row clicked:", row);
                  // Find the original PersonalTodoReadDto from the stored original data
                  const originalTodo = originalTodos.find(
                    (t) => t.todoId === row.id
                  );
                  console.log("Found original backend todo:", originalTodo);
                  if (originalTodo) {
                    setSelectedTodo(originalTodo);
                  } else {
                    console.error(
                      "Could not find original backend todo for row:",
                      row
                    );
                  }
                }}
              />
            </CardContent>
          </Card>
        </>
      ) : selectedTodo ? (
        <PersonalTodoDetailView
          todo={selectedTodo}
          onBack={() => setSelectedTodo(null)}
          onTodoUpdated={handleTodoUpdated}
          onTodoDeleted={handleTodoDeleted}
          darkMode={darkMode}
        />
      ) : (
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">No Todo Selected</h1>
          <p className="mb-6">Please select a todo to view its details.</p>
          <button
            onClick={() => setSelectedTodo(null)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Go Back
          </button>
        </div>
      )}

      {showCreateModal && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${
            darkMode ? "bg-black bg-opacity-70" : "bg-gray-900 bg-opacity-50"
          }`}
        >
          <div
            className={`w-full max-w-md rounded-xl p-6 ${
              darkMode ? "bg-zinc-800" : "bg-white"
            }`}
          >
            <h2 className="pb-2 text-2xl font-bold bg-gradient-to-r from-fuchsia-800 to-stone-800 bg-clip-text text-transparent">
              Create Personal Todo
            </h2>
            <p className="text-sm mb-6">
              Fill in the details to create a new task for your team
            </p>

            {/* Task Title */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                Task Title
              </label>
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                aria-label="New task title"
                title="New task title"
                className={`w-full p-2 rounded-lg border ${
                  darkMode
                    ? "bg-zinc-700 border-zinc-600 text-white"
                    : "bg-white border-gray-300 text-gray-800"
                }`}
                placeholder="Enter task Title"
                required
              />
            </div>

            {/* Description */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                Description
              </label>
              <textarea
                value={newTaskDescription}
                onChange={(e) => setNewTaskDescription(e.target.value)}
                aria-label="New task description"
                title="New task description"
                className={`w-full p-2 rounded-lg border ${
                  darkMode
                    ? "bg-zinc-700 border-zinc-600 text-white"
                    : "bg-white border-gray-300 text-gray-800"
                }`}
                placeholder="Description"
                rows={3}
              />
            </div>

            {/* Due Date */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Due Date</label>
              <div
                className={`flex items-center p-2 rounded-lg border ${
                  darkMode
                    ? "bg-zinc-700 border-zinc-600"
                    : "bg-white border-gray-300"
                }`}
              >
                <Calendar className="w-4 h-4 mr-2" />
                <input
                  type="date"
                  value={newTaskDueDate}
                  onChange={(e) => setNewTaskDueDate(e.target.value)}
                  min={minDate}
                  aria-label="Task due date"
                  title="Task due date"
                  className={`w-full bg-transparent ${
                    darkMode ? "text-white" : "text-gray-800"
                  }`}
                />
              </div>
            </div>

            {/* Priority */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-1">Priority</label>
              <div className="grid grid-cols-4 gap-2">
                {(["Low", "Medium", "High"] as Priority[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => setNewTaskPriority(p)}
                    className={`py-2 rounded-lg text-sm ${
                      newTaskPriority === p
                        ? darkMode
                          ? "bg-purple-700 text-white"
                          : "bg-purple-600 text-white"
                        : darkMode
                        ? "bg-zinc-700 text-gray-300"
                        : "bg-gray-200 text-gray-800"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowCreateModal(false)}
                className={`px-4 py-2 rounded-lg ${
                  darkMode
                    ? "bg-zinc-700 hover:bg-zinc-600"
                    : "bg-gray-200 hover:bg-gray-300"
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTask}
                disabled={!newTaskTitle.trim()}
                className={`px-4 py-2 rounded-lg text-white ${
                  !newTaskTitle.trim()
                    ? "bg-gray-400"
                    : darkMode
                    ? "bg-purple-700 hover:bg-purple-600"
                    : "bg-purple-600 hover:bg-purple-500"
                }`}
              >
                Create Todo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Personal;
