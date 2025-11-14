import { Check, ChevronLeft, Edit, Paperclip, Plus, Trash2, X, AlertCircle } from "lucide-react";
import React, { useState } from "react";
import { Task, SubTask, IndependentTaskReadDto, IndependentTaskStatus } from "@/types/taskTypes";
import { useTasks } from "@/context/TaskContext";

interface TaskDetailViewProps {
  task: Task | IndependentTaskReadDto;
  darkMode: boolean;
  projectName?: string;
  onBack: () => void;
  onEdit: () => void;
  onReassign?: () => void;
  onFileChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDeleteAttachment?: (taskId: string, fileName: string) => void;
  onSubtaskClick?: (subtask: SubTask) => void;
  formatFileSize?: (bytes: number) => string;
  setSelectedAttachment?: (file: { id: string; name: string; size: number; type: string; url: string }) => void;
  newComment?: string;
  setNewComment?: (c: string) => void;
  // Subtask panel props:
  showRightPanel?: boolean;
  selectedSubtask?: SubTask | null;
  onCloseRightPanel?: () => void;
  parentTask?: Task;
  onUpdateSubtask?: (subtaskId: string, update: Partial<SubTask>) => void; 
  currentUserId?: string;
  leaderId?: string;
  isManager?: boolean;
  allUsers?: { id: string; name: string }[]; // âœ… NEW: For IDâ†’Name mapping
}

const TaskDetailView: React.FC<TaskDetailViewProps> = ({
  task,
  darkMode,
  projectName,
  onBack,
  onEdit,
  onReassign,
  onFileChange,
  onDeleteAttachment,
  onSubtaskClick,
  formatFileSize,
  setSelectedAttachment,
  newComment,
  setNewComment,
  showRightPanel,
  selectedSubtask,
  onCloseRightPanel,
  parentTask,
  onUpdateSubtask,
  currentUserId,
  leaderId,
  isManager = false,
  allUsers = [], // âœ… NEW: Default to empty array
}) => {
  const { acceptTask, rejectTask, completeTask, updateTaskProgress, approveTaskCompletion, rejectTaskCompletion } = useTasks();
  
  // Check if this is an independent task
  // Prefer explicit `type === 'Independent'` flag from the backend.
  // Fallback to legacy shape detection: presence of numeric `taskId` and no `id`.
  const isIndependentTask =
    // primary, preferred signal
    // @ts-ignore - task may be a union
    (task as any).type === 'Independent' ||
    // fallback to older DTO shape where independent tasks had `taskId` numeric
    (('taskId' in task && typeof (task as any).taskId === 'number') && !('id' in task));
  
  // State for independent task actions
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showRejectCompletionModal, setShowRejectCompletionModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [completionDetails, setCompletionDetails] = useState("");
  const [rejectionCompletionReason, setRejectionCompletionReason] = useState("");
  const [progressUpdate, setProgressUpdate] = useState<number>(
    // initialize from the correct shape depending on task type
    isIndependentTask ? (task as IndependentTaskReadDto).progress ?? 0 : (task as Task).progress ?? 0
  );
  const [progressComments, setProgressComments] = useState("");
  
  // âœ… NEW: TodoItems state and management
  const [todoItems, setTodoItems] = useState<any[]>([]);
  const [showCreateTodoItem, setShowCreateTodoItem] = useState(false);
  const [newTodoItemTitle, setNewTodoItemTitle] = useState("");
  const [newTodoItemDescription, setNewTodoItemDescription] = useState("");
  const [newTodoItemWeight, setNewTodoItemWeight] = useState(50);
  const [loadingTodoItems, setLoadingTodoItems] = useState(false);

const [newAccomplishment, setNewAccomplishment] = useState("");
const [accomplishments, setAccomplishments] = useState<{ [taskId: string]: string[] }>({});

const handleAddAccomplishment = (taskId: string, text: string) => {
  if (!text.trim()) return;
  setAccomplishments(prev => ({
    ...prev,
    [taskId]: [...(prev[taskId] || []), text]
  }));
};

// âœ… NEW: Fetch TodoItems for ProjectTasks
React.useEffect(() => {
  const fetchTodoItems = async () => {
    // Only fetch TodoItems for ProjectTasks (not IndependentTasks)
    if (!isIndependentTask && (task as any).id) {
      setLoadingTodoItems(true);
      try {
        const { todoItemService } = await import('@/services/todoItemService');
        const todoItems = await todoItemService.getTodoItemsByProjectTaskId((task as any).id);
        
        console.log('✅ TodoItems loaded for task:', (task as any).id, todoItems);
        setTodoItems(todoItems);
      } catch (error) {
        console.error('âŒ Error fetching TodoItems:', error);
        setTodoItems([]);
      } finally {
        setLoadingTodoItems(false);
      }
    }
  };
  
  fetchTodoItems();
}, [task, isIndependentTask]);

// âœ… NEW: Calculate auto-progress from TodoItems
const calculatedProgress = React.useMemo(() => {
  if (isIndependentTask || todoItems.length === 0) {
    return null; // No auto-calculation
  }
  
  const totalWeight = todoItems.reduce((sum: number, item: any) => sum + (item.weight || 0), 0);
  if (totalWeight === 0) return 0;
  
  const weightedProgress = todoItems.reduce((sum: number, item: any) => 
    sum + ((item.progress || 0) * (item.weight || 0)), 0
  );
  
  return Math.round(weightedProgress / totalWeight);
}, [todoItems, isIndependentTask]);

// âœ… NEW: TodoItem CRUD handlers
const handleCreateTodoItem = async () => {
  if (!newTodoItemTitle.trim()) return;
  
  try {
    const { todoItemService } = await import('@/services/todoItemService');
    const response = await todoItemService.createTodoItem({
      projectTaskId: parseInt((task as any).id),
      title: newTodoItemTitle,
      assignedById: currentUserId || '',
      description: newTodoItemDescription,
      weight: newTodoItemWeight
    });
    
    if (response.success) {
      // Add to list
      setTodoItems(prev => [...prev, response.data]);
      // Reset form
      setNewTodoItemTitle("");
      setNewTodoItemDescription("");
      setNewTodoItemWeight(50);
      setShowCreateTodoItem(false);
    }
  } catch (error) {
    console.error('âŒ Error creating TodoItem:', error);
    alert('Failed to create action item. Please try again.');
  }
};

const handleUpdateTodoItemProgress = async (todoItemId: number, newProgress: number) => {
  try {
    const { todoItemService } = await import('@/services/todoItemService');
    await todoItemService.updateTodoItemProgress(todoItemId, newProgress);
    
    // Update local state
    setTodoItems(prev => prev.map(item => 
      item.id === todoItemId ? { ...item, progress: newProgress } : item
    ));
  } catch (error) {
    console.error('âŒ Error updating TodoItem progress:', error);
  }
};

const handleCompleteTodoItem = async (todoItemId: number) => {
  try {
    const { todoItemService } = await import('@/services/todoItemService');
    await todoItemService.completeTodoItem(todoItemId, 100, null, 'Completed');
    
    // Update local state
    setTodoItems(prev => prev.map(item => 
      item.id === todoItemId ? { ...item, progress: 100, status: 'Approved' } : item
    ));
  } catch (error) {
    console.error('âŒ Error completing TodoItem:', error);
  }
};

const handleDeleteTodoItem = async (todoItemId: number) => {
  if (!confirm('Are you sure you want to delete this action item?')) return;
  
  try {
    const { todoItemService } = await import('@/services/todoItemService');
    await todoItemService.deleteTodoItem(todoItemId);
    
    // Remove from list
    setTodoItems(prev => prev.filter(item => item.id !== todoItemId));
  } catch (error) {
    console.error('âŒ Error deleting TodoItem:', error);
  }
};

// Independent task action handlers
const handleAccept = async () => {
  if (isIndependentTask) {
    await acceptTask((task as IndependentTaskReadDto).taskId);
  }
};

const handleReject = async () => {
  if (!rejectionReason.trim()) {
    alert("Please provide a reason for rejection");
    return;
  }
  if (isIndependentTask) {
    await rejectTask((task as IndependentTaskReadDto).taskId, rejectionReason);
    setShowRejectModal(false);
    setRejectionReason("");
  }
};

const handleComplete = async () => {
  if (!completionDetails.trim()) {
    alert("Please provide completion details");
    return;
  }
  if (isIndependentTask) {
    await completeTask((task as IndependentTaskReadDto).taskId, completionDetails);
    setShowCompleteModal(false);
    setCompletionDetails("");
  }
};

const handleApproveCompletion = async () => {
  if (isIndependentTask) {
    await approveTaskCompletion((task as IndependentTaskReadDto).taskId);
  }
};

const handleRejectCompletion = async () => {
  if (!rejectionCompletionReason.trim()) {
    alert("Please provide a reason for rejection");
    return;
  }
  if (isIndependentTask) {
    await rejectTaskCompletion((task as IndependentTaskReadDto).taskId, rejectionCompletionReason);
    setShowRejectCompletionModal(false);
    setRejectionCompletionReason("");
  }
};

const handleProgressUpdate = async () => {
  if (progressUpdate < 0 || progressUpdate > 100) {
    alert("Progress must be between 0 and 100");
    return;
  }
  if (isIndependentTask) {
    await updateTaskProgress((task as IndependentTaskReadDto).taskId, progressUpdate, progressComments);
    setProgressComments("");
  }
};




  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleAssigneeComplete = (subtask: SubTask) => {
    if (subtask.assignee === currentUserId && onUpdateSubtask) {
      onUpdateSubtask(subtask.id, { completed: true, status: "Confirm" as any });
    }
  };

  const handleLeaderConfirm = (subtask: SubTask) => {
    if (currentUserId === leaderId && onUpdateSubtask) {
      onUpdateSubtask(subtask.id, { confirmed: true, status: "Done" });
    }
  };
 
  // Get task properties based on type
  const taskId = isIndependentTask ? (task as IndependentTaskReadDto).taskId.toString() : (task as Task).id;
  const taskTitle = task.title;
  const taskDescription = task.description || '';
  const taskStatus = task.status;
  const taskPriority = task.priority;
  const taskProgress = task.progress;
  const taskDueDate = task.dueDate;
  const taskUpdatedAt = isIndependentTask ? (task as IndependentTaskReadDto).updatedAt : (task as Task).updatedAt;
  const taskAssigneeId = isIndependentTask ? (task as IndependentTaskReadDto).assignedToUserName || (task as IndependentTaskReadDto).assignedToUserId : (task as Task).assignee;
  const taskWeight = isIndependentTask ? (task as IndependentTaskReadDto).weight : (task as Task).weight || 0;
  const taskIsOverdue = isIndependentTask ? (task as IndependentTaskReadDto).isOverdue : false;
  
  // âœ… NEW: Map assignee ID to name
  const taskAssignee = React.useMemo(() => {
    if (!taskAssigneeId) return "";
    
    // Try to find user by ID
    const user = allUsers.find(u => u.id === taskAssigneeId);
    if (user) {
      console.log('âœ… Mapped assignee ID to name:', taskAssigneeId, 'â†’', user.name);
      return user.name;
    }
    
    // If not found, check if taskAssigneeId is already a name (for backward compatibility)
    const isGuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(taskAssigneeId);
    if (isGuid) {
      console.warn('âš ï¸ Could not find user name for ID:', taskAssigneeId);
      return `User (${taskAssigneeId.substring(0, 8)}...)`; // Show partial GUID
    }
    
    // It's already a name
    return taskAssigneeId;
  }, [taskAssigneeId, allUsers]);

  // Independent task specific properties
  const independentTask = isIndependentTask ? task as IndependentTaskReadDto : null;
  const canAccept = isIndependentTask && taskStatus === IndependentTaskStatus.Pending && currentUserId === independentTask?.assignedToUserId;
  const canReject = isIndependentTask && taskStatus === IndependentTaskStatus.Pending && currentUserId === independentTask?.assignedToUserId;
  const canComplete = isIndependentTask && taskStatus === IndependentTaskStatus.InProgress && currentUserId === independentTask?.assignedToUserId;
  const canApprove = isIndependentTask && taskStatus === IndependentTaskStatus.WaitingReview && isManager;
  const canRejectCompletion = isIndependentTask && taskStatus === IndependentTaskStatus.WaitingReview && isManager;

  return (
    <div className="flex w-full">
      <div className="flex-1 pr-6">
        {/* Main Task Detail */}
       
        <div className="flex items-center mt-0 mb-4">
          <button
            onClick={onBack}
            className={`mr-2 p-1 rounded-md ${darkMode ? "hover:bg-zinc-700" : "hover:bg-gray-200"}`}
            aria-label="Back"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <h2 className="text-2xl font-bold">{taskTitle}</h2>
          <button
            onClick={onEdit}
            className=" ml-auto px-4 py-2 text-base bg-purple-900 text-white rounded-lg hover:bg-purple-800 transition-colors flex items-center"
           >
              <Edit className="w-4 h-4 mr-1" />
                Edit
          </button>
        </div>

        <div className="flex items-center space-x-4 mt-2 mb-4">
          {/* <span className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            {isIndependentTask ? `Task ID: ${(task as IndependentTaskReadDto).taskId}` : `Key: ${(task as Task).key || 'N/A'}`}
          </span> */}
          <span className={`text-sm ${darkMode ? "text-blue-400" : "text-blue-600"}`}>
            Project Name: {isIndependentTask ? "Independent Task" : ( projectName || "Unknown Project")}
          </span>
          {taskIsOverdue && (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Overdue
            </span>
          )}
        </div>

        <div className="flex items-center space-x-4 mt-2 mb-6">
          <span className={`text-sm font-bold ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            Due: {taskDueDate ? formatDate(taskDueDate) : "N/A"}
          </span>
          <span className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            Last Updated: {taskUpdatedAt ? formatDate(taskUpdatedAt) : "N/A"}
          </span>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Description</h3>
          <div className={`p-4 rounded-md ${darkMode ? "bg-gray-600" : "bg-gray-100"}`}>
            {taskDescription || (
              <span className={`${darkMode ? "text-gray-400" : "text-gray-100"}`}>No description</span>
            )}
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Assigned To:</h3>
          <div className={`flex items-center justify-between gap-4 p-4 rounded-md ${darkMode ? "bg-gray-600" : "bg-gray-100"}`}>
            <div className="flex-1">
            {taskAssignee || (
                <span className={`${darkMode ? "text-gray-400" : "text-gray-500"}`}>Unassigned</span>
            )}
            </div>
            {onReassign && (
              <button
                onClick={onReassign}
                className={`flex-shrink-0 text-sm rounded-lg px-3 py-2 bg-purple-600 text-white hover:bg-purple-700 transition-colors`}
              >
                Reassign
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div>
            <h3 className="font-medium">Priority</h3>
            <span className={`mt-1 text-xs px-2 py-1 rounded-full ${taskPriority === 'High' 
                ? (darkMode ? "bg-red-300 text-red-900" : "bg-red-100 text-red-800")
                : taskPriority === 'Medium'
                  ? (darkMode ? "bg-yellow-100 text-yellow-900" : "bg-yellow-100 text-yellow-800")
                  : (darkMode ? "bg-green-300 text-green-900" : "bg-green-100 text-green-800")
              }`}>
              {taskPriority}
            </span>
          </div>
          <div className="ml-12">
            <h3 className="font-medium">Weight (1-100)</h3>
            <p className="mt-1 text-sm ml-2">{taskWeight !== undefined && taskWeight !== null ? taskWeight : "Not specified"}</p>
          </div>
          <div>
            <h3 className="font-medium">Progress</h3>
            <div className={`mt-1 w-32 h-2 rounded-full ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}>
              <div
                className={`h-2 rounded-full ${taskProgress < 30
                    ? "bg-red-500"
                    : taskProgress < 70
                      ? "bg-yellow-500"
                      : "bg-green-500"
                  }`}
                style={{ width: `${taskProgress}%` }}
              ></div>
              <span className="text-sm"> {taskProgress}% Completed </span>
            </div>
          </div>
        </div>

        {/* Independent Task Actions */}
        {isIndependentTask && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">Actions</h3>
            <div className="flex flex-wrap gap-3">
              {canAccept && (
                <button
                  onClick={handleAccept}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                    darkMode ? "bg-green-600 hover:bg-green-700" : "bg-green-500 hover:bg-green-600"
                  } text-white`}
                >
                  <Check className="h-4 w-4" />
                  Accept Task
                </button>
              )}
              
              {canReject && (
                <button
                  onClick={() => setShowRejectModal(true)}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                    darkMode ? "bg-red-600 hover:bg-red-700" : "bg-red-500 hover:bg-red-600"
                  } text-white`}
                >
                  <X className="h-4 w-4" />
                  Reject Task
                </button>
              )}
              
              {canComplete && (
                <button
                  onClick={() => setShowCompleteModal(true)}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                    darkMode ? "bg-purple-600 hover:bg-purple-700" : "bg-purple-500 hover:bg-purple-600"
                  } text-white`}
                >
                  <Check className="h-4 w-4" />
                  Complete Task
                </button>
              )}
              
              {canApprove && (
                <button
                  onClick={handleApproveCompletion}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                    darkMode ? "bg-green-600 hover:bg-green-700" : "bg-green-500 hover:bg-green-600"
                  } text-white`}
                >
                  <Check className="h-4 w-4" />
                  Approve Completion
                </button>
              )}
              
              {canRejectCompletion && (
                <button
                  onClick={() => setShowRejectCompletionModal(true)}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                    darkMode ? "bg-red-600 hover:bg-red-700" : "bg-red-500 hover:bg-red-600"
                  } text-white`}
                >
                  <X className="h-4 w-4" />
                  Reject Completion
                </button>
              )}
            </div>
          </div>
        )}

        {/* Progress Update Section for Independent Tasks */}
        {isIndependentTask && canComplete && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">Update Progress</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Progress</label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={progressUpdate}
                    onChange={(e) => setProgressUpdate(Number(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-sm w-12">{progressUpdate}%</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Comments (Optional)</label>
                <textarea
                  value={progressComments}
                  onChange={(e) => setProgressComments(e.target.value)}
                  placeholder="Add comments about progress..."
                  className={`w-full p-3 rounded-lg border ${
                    darkMode ? "bg-zinc-700 border-zinc-600" : "bg-white border-gray-300"
                  }`}
                  rows={3}
                />
              </div>
              <button
                onClick={handleProgressUpdate}
                className={`px-4 py-2 rounded-lg ${
                  darkMode ? "bg-blue-600 hover:bg-blue-700" : "bg-blue-500 hover:bg-blue-600"
                } text-white`}
              >
                Update Progress
              </button>
            </div>
          </div>
        )}

        {/* âœ… NEW: TodoItems (Action Items) Section - Only for Project Tasks */}
        {!isIndependentTask && (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-semibold">Action Items (TodoItems)</h3>
                {calculatedProgress !== null && (
                  <p className="text-sm text-gray-500 mt-1">
                    Auto-calculated Progress: <span className="font-bold text-purple-600">{calculatedProgress}%</span> (from {todoItems.length} item{todoItems.length !== 1 ? 's' : ''})
                  </p>
                )}
              </div>
              <button
                onClick={() => setShowCreateTodoItem(true)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                  darkMode ? "bg-purple-600 hover:bg-purple-700" : "bg-purple-500 hover:bg-purple-600"
                } text-white text-sm`}
              >
                <Plus className="h-4 w-4" />
                Add Action Item
              </button>
            </div>

            {loadingTodoItems ? (
              <div className="text-center py-4 text-gray-500">Loading action items...</div>
            ) : todoItems.length === 0 && !showCreateTodoItem ? (
              <div className={`p-4 rounded-lg border-2 border-dashed text-center ${
                darkMode ? "border-zinc-600 bg-zinc-700" : "border-gray-300 bg-gray-50"
              }`}>
                <p className="text-gray-500 mb-2">No action items for this task yet</p>
                <p className="text-xs text-gray-400 mb-3">
                  Create action items to break down this task into smaller, trackable pieces
                </p>
                <button
                  onClick={() => setShowCreateTodoItem(true)}
                  className={`px-4 py-2 rounded-lg ${
                    darkMode ? "bg-purple-600 hover:bg-purple-700" : "bg-purple-500 hover:bg-purple-600"
                  } text-white text-sm`}
                >
                  Create First Action Item
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {todoItems.map((todoItem) => (
                  <div
                    key={todoItem.id}
                    className={`p-3 rounded-lg border ${
                      darkMode ? "bg-zinc-700 border-zinc-600" : "bg-white border-gray-200"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={(todoItem.progress || 0) === 100}
                        onChange={() => {
                          if ((todoItem.progress || 0) === 100) {
                            handleUpdateTodoItemProgress(todoItem.id, 0);
                          } else {
                            handleCompleteTodoItem(todoItem.id);
                          }
                        }}
                        className="mt-1 h-5 w-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                      />
                      <div className="flex-1">
                        <h4 className="font-medium">{todoItem.title}</h4>
                        {todoItem.description && (
                          <p className="text-sm text-gray-500 mt-1">{todoItem.description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2">
                          <div className="flex items-center gap-2 flex-1">
                            <span className="text-xs text-gray-500">Progress:</span>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={todoItem.progress || 0}
                              onChange={(e) => handleUpdateTodoItemProgress(todoItem.id, Number(e.target.value))}
                              className="flex-1"
                            />
                            <span className="text-sm font-medium w-12">{todoItem.progress || 0}%</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">Weight: {todoItem.weight || 0}</span>
                            <button
                              onClick={() => handleDeleteTodoItem(todoItem.id)}
                              className={`p-1 rounded ${
                                darkMode ? "hover:bg-zinc-600 text-red-400" : "hover:bg-gray-100 text-red-500"
                              }`}
                              title="Delete action item"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* âœ… Create New TodoItem Form */}
            {showCreateTodoItem && (
              <div className={`mt-4 p-4 rounded-lg border ${
                darkMode ? "bg-zinc-700 border-zinc-600" : "bg-blue-50 border-blue-200"
              }`}>
                <h4 className="font-medium mb-3">Create New Action Item</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Title *</label>
                    <input
                      type="text"
                      value={newTodoItemTitle}
                      onChange={(e) => setNewTodoItemTitle(e.target.value)}
                      placeholder="Enter action item title"
                      className={`w-full p-2 rounded-lg border ${
                        darkMode ? "bg-zinc-600 border-zinc-500" : "bg-white border-gray-300"
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Description (optional)</label>
                    <textarea
                      value={newTodoItemDescription}
                      onChange={(e) => setNewTodoItemDescription(e.target.value)}
                      placeholder="Enter description"
                      rows={2}
                      className={`w-full p-2 rounded-lg border ${
                        darkMode ? "bg-zinc-600 border-zinc-500" : "bg-white border-gray-300"
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Weight (1-100)</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={newTodoItemWeight}
                      onChange={(e) => setNewTodoItemWeight(parseInt(e.target.value) || 50)}
                      className={`w-full p-2 rounded-lg border ${
                        darkMode ? "bg-zinc-600 border-zinc-500" : "bg-white border-gray-300"
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
                        darkMode ? "bg-zinc-600 hover:bg-zinc-500" : "bg-gray-200 hover:bg-gray-300"
                      }`}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold mb-2">Attachment</h3>
            {onFileChange && (
              <div className="flex space-x-2">
                <label className={`cursor-pointer p-1 rounded-md ${darkMode ? "bg-blue-600 hover:bg-blue-500" : "bg-blue-500 hover:bg-blue-400"}`}>
                  <Plus size={16} className="text-white" />
                  <input type="file"
                    onChange={onFileChange}
                    className="hidden"
                    accept=".pdf, .doc, .docx, .xls, .xlsx, .jpg, .jpeg, .png" />
                </label>
              </div>
            )}
          </div>
          {(task as Task).files && (task as Task).files!.length > 0  ? (
            <div className="space-y-2">
              {(task as Task).files!.map((file, index) => (
                 <div key={index} className={`flex items-center justify-start p-3 rounded-md ${darkMode ? "bg-gray-700" : "bg-gray-100"}`}>
              <div
                onClick={() => setSelectedAttachment && setSelectedAttachment({
                  id: taskId,
                  name: file.name,
                  size: file.size,
                  type: file.type,
                  url: file.url,
                })}
                className="flex items-center flex-1 cursor-pointer"
              >
                <Paperclip className="h-5 w-5 mr-3 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="text-blue-600 hover:underline dark:text-blue-400 truncate block">
                    {file.name}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {formatFileSize && formatFileSize(file.size)} . {file.type}
                  </div>
                </div>
              </div>
              {onDeleteAttachment && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm("Delete this attachment?")) {
                      onDeleteAttachment(taskId, file.name);
                    }
                  }}
                  className={`p-1 rounded-md ${darkMode ? "hover:bg-gray-600 text-red-400" : "hover:bg-gray-200 text-red-600"}`}
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>

              ))}

            </div>
          
          ) : (
            <div className={`p-3 rounded-md italic ${darkMode ? "text-gray-400 bg-gray-700" : "text-gray-500 bg-gray-100"}`}>
              No attachments
            </div>
          )}
        </div>

        {(task as Task).subtask && (task as Task).subtask!.length > 0 && (
          <div className="mb-6 overflow-x-auto">
            <h3 className="text-lg font-semibold mb-2">Sub Tasks</h3>
            <div className={`rounded-md overflow-hidden border ${darkMode
                ? "border-gray-700"
                : "border-gray-200"
              }`}>
              <table className="w-full">
                <thead className={`${darkMode ? "bg-gray-600" : "bg-gray-100"}`}>
                  <tr>
                    <th className="p-3 text-left">Key</th>
                    <th className="p-3 text-left">Title</th>
                    <th className="p-3 text-left">Priority</th>
                    <th className="p-3 text-left">Assignee</th>
                    <th className="p-3 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(task as Task).subtask!.map((subtask) => (
                    <tr
                      key={subtask.id}
                      onClick={() => onSubtaskClick && onSubtaskClick(subtask)}
                      className={`cursor-pointer border-t ${darkMode
                          ? "border-gray-700 hover:bg-zinc-700"
                          : "border-gray-200 hover:bg-gray-50"
                        }`}
                    >
                      <td className="p-3">{subtask.key}</td>
                      <td className="p-3">{subtask.title}</td>
                      <td className="p-3">{subtask.priority}</td>
                      <td className="p-3">{subtask.assignee || "Unassigned"}</td>
                       <td className="p-3">
                        {subtask.status === "Confirm" && subtask.assignee === currentUserId ? (
                          <button
                            onClick={() => handleAssigneeComplete(subtask)}
                            className="px-2 py-1 text-xs bg-yellow-200 rounded"
                          >
                            Confirm Completion
                          </button>
                        ) : subtask.status === "Confirm" && currentUserId === leaderId ? (
                          <button
                            onClick={() => handleLeaderConfirm(subtask)}
                            className="px-2 py-1 text-xs bg-green-200 rounded flex items-center gap-1"
                          >
                            <Check size={14} /> Approve
                          </button>
                        ) : (
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              subtask.status === "Done"
                                ? "bg-green-100 text-green-800"
                                : subtask.status === "In Progress"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {subtask.status}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Accomplishments section - only for project tasks */}
        {!isIndependentTask && (
          <>
            <div className="mt-4">
              <h3 className="text-sm font-semibold mb-2">Previous Accomplishments</h3>
              <ul className="space-y-2">
                {(accomplishments[taskId] || []).map((acc, i) => (
                  <li
                    key={i}
                    className={`p-2 rounded ${
                      darkMode ? "bg-zinc-800 text-gray-300" : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    {acc}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium mb-1">Today's Accomplishment</label>
              <textarea
                value={newAccomplishment}
                onChange={e => setNewAccomplishment(e.target.value)}
                placeholder="Write what you accomplished today..."
                className={`w-full p-2 rounded-md border ${
                  darkMode ? "bg-zinc-700 text-gray-300 border-gray-600" : "bg-gray-100 text-gray-700 border-gray-300"
                }`}
              />
              <div className="flex justify-end mt-2">
                <button
                  onClick={() => {
                    handleAddAccomplishment(taskId, newAccomplishment);
                    setNewAccomplishment("");
                  }}
                  className="px-4 py-2 rounded bg-purple-700 text-white"
                >
                  Add
                </button>
              </div>
            </div>
          </>
        )}

        {/* Comments section */}
        {newComment !== undefined && setNewComment && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Comment</h3>
            <div className="space-y-2">
              <div className={`p-3 rounded-md ${darkMode ? "bg-gray-600" : "bg-gray-100"}`}>
                <input
                  type="text"
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className={`w-full bg-transparent focus:outline-none ${darkMode
                      ? "placeholder-gray-400"
                      : "placeholder-gray-400"
                    }`}
                />
              </div>
            </div>
          </div>
        )}
        </div>
      
        {/* Subtask Right Panel */}
        {showRightPanel && selectedSubtask && (
          <div className={`w-1/4 p-6 rounded-lg ${darkMode ? "bg-gray-800" : "bg-gray-50"}`}>
            <div className={`flex justify-between items-center mb-6`}>
              <h2 className="text-xl font-bold">{selectedSubtask.title}</h2>
              <button
                onClick={onCloseRightPanel}
                className={`p-1 rounded-md ${darkMode
                    ? "hover:bg-gray-700"
                    : "hover:bg-gray-200"
                  }`}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Description</h3>
              <div className={`p-4 rounded-md ${darkMode
                  ? "bg-gray-700"
                  : "bg-gray-100"
                }`}>
                {selectedSubtask.description || (
                  <span className={`${darkMode
                      ? "text-gray-400"
                      : "text-gray-500"
                    }`}>
                    No description
                  </span>
                )}
              </div>
            </div>
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Status</h3>
              <span className={`text-xs px-2 py-1 rounded-full ${selectedSubtask.status === "Done"
                  ? "bg-green-100 text-green-800"
                  : selectedSubtask.status === "In Progress"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-gray-100 text-gray-800"
                }`}>
                {selectedSubtask.status}
              </span>
            </div>
            {/* <div className="mb-6">
              <h3 className="font-medium">Progress</h3>
              <div className={`mt-1 w-32 h-2 rounded-full ${darkMode
                  ? "bg-gray-700"
                  : "bg-gray-200"
                }`}>
                <div
                  className={`h-2 rounded-full ${selectedSubTask.progress < 30
                      ? "bg-red-500"
                      : selectedSubTask.progress < 70
                        ? "bg-yellow-500"
                        : "bg-green-500"
                    }`}
                  style={{ width: `${selectedSubTask.progress}%` }}
                ></div>
                <span className="text-sm"> {selectedSubTask.progress}% Completed</span>
              </div>
            </div> */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Activity</h3>
              <div className="flex items-center mb-2">
                <span className="mr-2">Show:</span>
                <select className={`p-1 rounded ${darkMode
                    ? "bg-gray-700"
                    : "bg-gray-100"
                  }`}>
                  <option>All</option>
                  <option>Comments</option>
                  <option>History</option>
                  <option>Work log</option>
                </select>
              </div>
              <div className={`p-3 rounded-md ${darkMode
                  ? "bg-gray-700"
                  : "bg-gray-100"
                }`}>
                <input
                  type="text"
                  placeholder="Add a comment..."
                  className={`w-full bg-transparent focus:outline-none ${darkMode
                      ? "placeholder-gray-500"
                      : "placeholder-gray-400"
                    }`}
                />
              </div>
              <div className="mt-2 space-y-1">
                <div className={`p-2 rounded-md ${darkMode
                    ? "hover:bg-gray-700"
                    : "hover:bg-gray-200"
                  } cursor-pointer`}>
                  Status update...
                </div>
              </div>
            </div>
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-2">Details</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span>Assignee</span>
                  <div>
                    {selectedSubtask.assignee || (
                      <span className={`mr-2 ${darkMode
                          ? "text-gray-400"
                          : "text-gray-500"
                        }`}>
                        Unassigned
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span>Parent</span>
                  <span className={`${darkMode
                      ? "text-blue-400"
                      : "text-blue-600"
                    }`}>
                    {parentTask?.key} {parentTask?.title}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      

      {/* Independent Task Modals */}
      {isIndependentTask && (
        <>
          {/* Reject Task Modal */}
          {showRejectModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className={`p-6 rounded-lg w-96 ${darkMode ? "bg-zinc-800" : "bg-white"}`}>
                <h3 className="text-lg font-semibold mb-4">Reject Task</h3>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Reason for Rejection</label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Please provide a reason for rejecting this task..."
                    className={`w-full p-3 rounded-lg border ${
                      darkMode ? "bg-zinc-700 border-zinc-600" : "bg-white border-gray-300"
                    }`}
                    rows={4}
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowRejectModal(false)}
                    className={`px-4 py-2 rounded-lg ${
                      darkMode ? "bg-gray-600 hover:bg-gray-700" : "bg-gray-200 hover:bg-gray-300"
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReject}
                    className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white"
                  >
                    Reject Task
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Complete Task Modal */}
          {showCompleteModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className={`p-6 rounded-lg w-96 ${darkMode ? "bg-zinc-800" : "bg-white"}`}>
                <h3 className="text-lg font-semibold mb-4">Complete Task</h3>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Completion Details</label>
                  <textarea
                    value={completionDetails}
                    onChange={(e) => setCompletionDetails(e.target.value)}
                    placeholder="Please provide details about the completion..."
                    className={`w-full p-3 rounded-lg border ${
                      darkMode ? "bg-zinc-700 border-zinc-600" : "bg-white border-gray-300"
                    }`}
                    rows={4}
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowCompleteModal(false)}
                    className={`px-4 py-2 rounded-lg ${
                      darkMode ? "bg-gray-600 hover:bg-gray-700" : "bg-gray-200 hover:bg-gray-300"
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleComplete}
                    className="px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white"
                  >
                    Complete Task
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Reject Completion Modal */}
          {showRejectCompletionModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className={`p-6 rounded-lg w-96 ${darkMode ? "bg-zinc-800" : "bg-white"}`}>
                <h3 className="text-lg font-semibold mb-4">Reject Completion</h3>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Reason for Rejection</label>
                  <textarea
                    value={rejectionCompletionReason}
                    onChange={(e) => setRejectionCompletionReason(e.target.value)}
                    placeholder="Please provide a reason for rejecting the completion..."
                    className={`w-full p-3 rounded-lg border ${
                      darkMode ? "bg-zinc-700 border-zinc-600" : "bg-white border-gray-300"
                    }`}
                    rows={4}
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowRejectCompletionModal(false)}
                    className={`px-4 py-2 rounded-lg ${
                      darkMode ? "bg-gray-600 hover:bg-gray-700" : "bg-gray-200 hover:bg-gray-300"
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRejectCompletion}
                    className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white"
                  >
                    Reject Completion
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TaskDetailView;
