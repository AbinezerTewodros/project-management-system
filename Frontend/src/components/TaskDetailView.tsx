import { ChevronLeft, Paperclip, Plus, Trash2, X } from "lucide-react";
import React from "react";

type SubTask = {
  id: string;
  title: string;
  description: string;
  priority: 'High' | 'Medium' | 'Low' | 'Urgent';
  assignee: string;
  status: 'To Do' | 'In Progress' | 'Done';
  key: string;
  progress: number;
};

type Task = {
  id: string;
  key: string;
  title: string;
  priority: 'High' | 'Medium' | 'Low' | 'Urgent';
  description: string;
  assignee: string;
  status?: 'To Do' | 'In Progress' | 'Done';
  dueDate?: string;
  project: string;
  weight?: number;
  progress: number;
  lastUpdated?: string;
  subtask: SubTask[];
  attachment?: {
    name: string;
    size: number;
    type: string;
    url: string;
    lastModified: number;
  };
};

interface TaskDetailViewProps {
  task: Task;
  darkMode: boolean;
  projectName?: string;
  onBack: () => void;
  onEdit: () => void;
  onReassign: () => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDeleteAttachment: (taskId: string) => void;
  onSubtaskClick: (subtask: SubTask) => void;
  formatFileSize: (bytes: number) => string;
  setSelectedAttachment: (file: { id: string; name: string; size: number; type: string; url: string }) => void;
  newComment: string;
  setNewComment: (c: string) => void;
  // Subtask panel props:
  showRightPanel?: boolean;
  selectedSubTask?: SubTask | null;
  onCloseRightPanel?: () => void;
  parentTask?: Task;
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
  selectedSubTask,
  onCloseRightPanel,
  parentTask,
}) => {
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
          <h2 className="text-2xl font-bold">{task.title}</h2>
          <button
            onClick={onEdit}
            className={`ml-auto text-sm px-2 py-1 rounded-xl ${darkMode ? "bg-green-900 hover:bg-green-800 text-green-300" : "bg-green-100 hover:bg-green-200 text-green-800"}`}
          >
            Edit
          </button>
        </div>

        <div className="flex items-center space-x-4 mt-2 mb-6">
          <span className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{task.key}</span>
          <span className={`text-sm ${darkMode ? "text-blue-400" : "text-blue-600"}`}>{projectName || "Unknown Project"}</span>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Description</h3>
          <div className={`p-4 rounded-md ${darkMode ? "bg-gray-600" : "bg-gray-100"}`}>
            {task.description || (
              <span className={`${darkMode ? "text-gray-400" : "text-gray-100"}`}>No description</span>
            )}
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Assigned To:</h3>
          <div className={`w-fit py-2 flex items-center p-4 rounded-md ${darkMode ? "bg-gray-600" : "bg-gray-100"}`}>
            {task.assignee || (
              <span className={`${darkMode ? "text-gray-400" : "text-gray-100"}`}>Unassigned</span>
            )}
            <button
              onClick={onReassign}
              className={`relative left-3/4 text-sm border rounded-xl px-2 py-2 ${darkMode
                  ? "bg-green-900 hover:bg-green-800 text-green-300"
                  : "bg-green-100 hover:bg-green-200 text-green-800"
                }`}
            >
              Reassign
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div>
            <h3 className="font-medium">Priority</h3>
            <span className={`mt-1 text-xs px-2 py-1 rounded-full ${task.priority === 'High' || task.priority === 'Urgent'
                ? (darkMode ? "bg-red-900 text-red-300" : "bg-red-100 text-red-800")
                : task.priority === 'Medium'
                  ? (darkMode ? "bg-yellow-900 text-yellow-300" : "bg-yellow-100 text-yellow-800")
                  : (darkMode ? "bg-green-900 text-green-300" : "bg-green-100 text-green-800")
              }`}>
              {task.priority}
            </span>
          </div>
          <div className="ml-12">
            <h3 className="font-medium">Weight (1-10)</h3>
            <p className="mt-1 text-sm ml-2">{task.weight || "Not specified"}</p>
          </div>
          <div>
            <h3 className="font-medium">Progress</h3>
            <div className={`mt-1 w-32 h-2 rounded-full ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}>
              <div
                className={`h-2 rounded-full ${task.progress < 30
                    ? "bg-red-500"
                    : task.progress < 70
                      ? "bg-yellow-500"
                      : "bg-green-500"
                  }`}
                style={{ width: `${task.progress}%` }}
              ></div>
              <span className="text-sm"> {task.progress}% Completed </span>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold mb-2">Attachment</h3>
            <div className="flex space-x-2">
              <label className={`cursor-pointer p-1 rounded-md ${darkMode ? "bg-blue-600 hover:bg-blue-500" : "bg-blue-500 hover:bg-blue-400"}`}>
                <Plus size={16} className="text-white" />
                <input type="file"
                  onChange={onFileChange}
                  className="hidden"
                  accept=".pdf, .doc, .docx, .xls, .xlsx, .jpg, .jpeg, .png" />
              </label>
            </div>
          </div>
          {task.attachment ? (
            <div className={`flex items-center justify-start p-3 rounded-md ${darkMode ? "bg-gray-700" : "bg-gray-100"}`}>
              <div
                onClick={() => setSelectedAttachment({
                  id: task.id,
                  name: task.attachment?.name || "",
                  size: task.attachment?.size ?? 0,
                  type: task.attachment?.type || "",
                  url: task.attachment?.url || "",
                })}
                className="flex items-center flex-1 cursor-pointer"
              >
                <Paperclip className="h-5 w-5 mr-3 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="text-blue-600 hover:underline dark:text-blue-400 truncate block">
                    {task.attachment.name}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {formatFileSize(task.attachment.size)} . {task.attachment.type}
                  </div>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm("Delete this attachment?")) {
                    onDeleteAttachment(task.id);
                  }
                }}
                className={`p-1 rounded-md ${darkMode ? "hover:bg-gray-600 text-red-400" : "hover:bg-gray-200 text-red-600"}`}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ) : (
            <div className={`p-3 rounded-md italic ${darkMode ? "text-gray-400 bg-gray-700" : "text-gray-500 bg-gray-100"}`}>
              No attachments
            </div>
          )}
        </div>

        {task.subtask && task.subtask.length > 0 && (
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
                  {task.subtask.map((subtask) => (
                    <tr
                      key={subtask.id}
                      onClick={() => onSubtaskClick(subtask)}
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
                        <span className={`text-xs px-2 py-1 rounded-full ${subtask.status === "Done"
                            ? "bg-green-100 text-green-800"
                            : subtask.status === "In Progress"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-gray-100 text-gray-800"}`}>
                          {subtask.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

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


        {/* Subtask Right Panel */}
        {showRightPanel && selectedSubTask && (
          <div className={`w-1/4 p-6 rounded-lg ${darkMode ? "bg-gray-800" : "bg-gray-50"}`}>
            <div className={`flex justify-between items-center mb-6`}>
              <h2 className="text-xl font-bold">{selectedSubTask.title}</h2>
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
                {selectedSubTask.description || (
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
              <span className={`text-xs px-2 py-1 rounded-full ${selectedSubTask.status === "Done"
                  ? "bg-green-100 text-green-800"
                  : selectedSubTask.status === "In Progress"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-gray-100 text-gray-800"
                }`}>
                {selectedSubTask.status}
              </span>
            </div>
            <div className="mb-6">
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
            </div>
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
                    {selectedSubTask.assignee || (
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
      </div>
    </div>
  );
};

export default TaskDetailView;
