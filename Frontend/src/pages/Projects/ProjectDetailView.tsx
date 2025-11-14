import { ChevronLeft, Flag, CalendarIcon, Paperclip, Plus, Milestone, UserIcon, RefreshCw, CheckCircle, XCircle, Circle, Crown, Shield, Edit2, Upload, Trash2, Send } from "lucide-react";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '@/lib/api';
import { projectService } from '@/services/projectService';
import CreateTaskModal from '@/pages/Tasks/CreateTaskModal';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface ProjectFile {
  name: string;
  size: number;
  type: string;
  url: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'High' | 'Medium' | 'Low' | 'Urgent';
  assignee: string;
  status: 'To Do' | 'In Progress' | 'Done' | 'Confirm';
  dueDate: string;
  weight?: number;
  files?: ProjectFile[];
}

interface Milestone {
  id: string;
  title: string;
  description: string;
  priority: 'High' | 'Medium' | 'Low' | 'Urgent';
  assignee: string;
  status: 'To Do' | 'In Progress' | 'Done';
  dueDate: string;
  weight?: number;
  tasks?: Task[];
}

interface Employee {
  id: string;
  name: string;
  role?: string;
}

interface CommonProject {
  id: number | string;
  title: string;
  description: string;
  dueDate: string;
  priority: 'High' | 'Medium' | 'Low' | 'Urgent';
  status: 'To Do' | 'In Progress' | 'Done' | 'Rejected';
  progress: number;
  files?: ProjectFile[];
  // From AssignedToMe
  role?: 'Team Leader' | 'Scrum Master';
  assignedBy?: string;
  assignedTo?: string;
  rejectionReason?: string;
  isTerminated?: boolean;
  // From MyProjects
  startDate?: string;
  teamLeader?: Employee;
  scrumMaster?: Employee;
  teamMembers?: Employee[];
  createdBy?: string;
}

interface ProjectDetailViewProps {
  project: CommonProject;
  darkMode: boolean;
  onBack: () => void;
  showEditFeatures: boolean;
  isEditing?: boolean;
  editedProject?: CommonProject;
  onEditProject?: () => void;
  onSaveProject?: () => void;
  onCancelEdit?: () => void;
  onChangeEditedProject?: (updated: CommonProject) => void;
  onAddTask: () => void;
  onAddMilestone: () => void;
  tasks: Task[];
  milestones: Milestone[];
  onTaskClick: (task: Task) => void;
  onMilestoneClick?: (milestone: Milestone) => void;
  formatFileSize: (bytes: number) => string;
  canCreateTasks?: boolean;
  showMilestones?: boolean;
  onAddAttachment?: (file: File) => void;
  onDeleteAttachment?: (fileName: string) => void;
  onAddTeamMember?: () => void;
  onRemoveTeamMember?: (memberId: string) => void;
  onDeleteMilestone?: (milestoneId: string) => void;
  onDeleteTask?: (taskId: string) => void;
  onFileUpload?: (file: File) => void;
}

const ProjectDetailView = ({
  project,
  darkMode,
  onBack,
  showEditFeatures,
  isEditing = false,
  editedProject = project,
  onEditProject,
  onSaveProject,
  onCancelEdit,
  onChangeEditedProject,
  onAddTask,
  onAddMilestone,
  tasks,
  milestones,
  onTaskClick,
  onMilestoneClick,
  formatFileSize,
  canCreateTasks = true,
  showMilestones = true,
  onAddAttachment,
  onDeleteAttachment,
  onAddTeamMember,
  onRemoveTeamMember,
  onDeleteMilestone,
  onDeleteTask,
  onFileUpload,
}: ProjectDetailViewProps) => {
  const [activeTab, setActiveTab] = useState<'tasks' | 'milestones'>('tasks');
  const [searchTerm, setSearchTerm] = useState('');
  const [newFile, setNewFile] = useState<File | null>(null);

  const PRIORITY_COLORS = {
    'High': 'bg-red-100 text-red-800',
    'Medium': 'bg-yellow-100 text-yellow-800',
    'Low': 'bg-green-100 text-green-800',
    'Urgent': 'bg-purple-100 text-purple-800'
  };

  const STATUS_COLORS = {
    'Pending': 'bg-yellow-100 text-yellow-800 border-yellow-300',
    'Accepted': 'bg-blue-100 text-blue-800 border-blue-300',
    'Rejected': 'bg-red-100 text-red-800 border-red-300',
    'InProgress': 'bg-purple-100 text-purple-800 border-purple-300',
    'WaitingForReview': 'bg-orange-100 text-orange-800 border-orange-300',
    'Completed': 'bg-green-100 text-green-800 border-green-300',
    'To Do': 'bg-yellow-100 text-yellow-800 border-yellow-300',
    'In Progress': 'bg-purple-100 text-purple-800 border-purple-300',
    'Done': 'bg-green-100 text-green-800 border-green-300'
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setNewFile(file);
    }
  };

  const handleFileUpload = () => {
    if (newFile && onFileUpload) {
      onFileUpload(newFile);
      setNewFile(null);
    }
  };

  const filteredTasks = tasks.filter(
    (task) =>
      (task.title || "").toLowerCase().includes((searchTerm || "").toLowerCase()) ||
      (task.description || "").toLowerCase().includes((searchTerm || "").toLowerCase()) ||
      (task.assignee || "").toLowerCase().includes((searchTerm || "").toLowerCase())
  );

  const filteredMilestones = milestones.filter(
    (milestone) =>
      (milestone.title || "").toLowerCase().includes((searchTerm || "").toLowerCase()) ||
      (milestone.description || "").toLowerCase().includes((searchTerm || "").toLowerCase()) ||
      (milestone.assignee || "").toLowerCase().includes((searchTerm || "").toLowerCase())
  );

  const handleStatusChange = (newStatus: CommonProject['status']) => {
    if (onChangeEditedProject) {
      onChangeEditedProject({ ...editedProject, status: newStatus });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className={`max-w-7xl mx-auto p-6 ${darkMode ? "bg-gray-900 text-white" : "bg-white text-gray-900"}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 border-b pb-4">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div>
            {isEditing ? (
              <div className="space-y-2">
                <Input
                  value={editedProject.title}
                  onChange={(e) => onChangeEditedProject?.({ ...editedProject, title: e.target.value })}
                  placeholder="Project title"
                  className="text-2xl font-bold border-0 bg-transparent p-0 focus:ring-0 focus:border-b-2 focus:border-blue-500"
                />
                <div className="text-gray-600 dark:text-gray-400 text-sm">
                  Project ID: {project.id} • Created by {project.createdBy || 'Unknown'}
                </div>
              </div>
            ) : (
              <>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {project.title}
                </h2>
                <div className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                  Project ID: {project.id} • Created by {project.createdBy || 'Unknown'}
                </div>
              </>
            )}
          </div>
        </div>
        <div className="flex gap-3">
          {showEditFeatures && !isEditing && (
            <Button
              onClick={onEditProject}
              variant="outline"
              className="flex items-center gap-2 hover:bg-blue-50 hover:border-blue-200"
            >
              <Edit2 className="w-4 h-4" />
              Edit Project
            </Button>
          )}
          {isEditing && (
            <div className="flex gap-2">
              <Button
                onClick={onSaveProject}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
              >
                Save Changes
              </Button>
              <Button
                onClick={onCancelEdit}
                variant="outline"
                className="flex items-center gap-2"
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="flex h-[calc(100vh-200px)] overflow-hidden gap-6">
        {/* Left Sidebar - Project Overview */}
        <div className="w-1/3 space-y-6 overflow-y-auto">
          {/* Project Status Card */}
          <div className={`p-4 rounded-xl border ${
            darkMode ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-200"
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg text-gray-900 dark:text-white">Project Status</h3>
              <div className="flex gap-2">
                {isEditing && (
                  <span className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900 px-2 py-1 rounded">
                    Editable
                  </span>
                )}
                <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                  {isEditing ? 'Some Read Only' : 'Read Only'}
                </span>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Status</span>
                {isEditing ? (
                  <Select 
                    value={editedProject.status} 
                    onValueChange={(value: CommonProject['status']) => handleStatusChange(value)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="To Do">To Do</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Done">Done</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[project.status]}`}>
                    {project.status}
                  </span>
                )}
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Priority</span>
                {isEditing ? (
                  <Select 
                    value={editedProject.priority} 
                    onValueChange={(value: CommonProject['priority']) => 
                      onChangeEditedProject?.({ ...editedProject, priority: value })
                    }
                  >
                    <SelectTrigger className="w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Urgent">Urgent</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${PRIORITY_COLORS[project.priority]}`}>
                    {project.priority}
                  </span>
                )}
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Progress</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {project.progress}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      project.progress < 30 
                        ? 'bg-red-500' 
                        : project.progress < 70 
                        ? 'bg-yellow-500' 
                        : 'bg-green-500'
                    }`}
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Due Date</span>
                {isEditing ? (
                  <Input
                    type="date"
                    value={editedProject.dueDate}
                    onChange={(e) => onChangeEditedProject?.({ ...editedProject, dueDate: e.target.value })}
                    className="w-32"
                  />
                ) : (
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatDate(project.dueDate)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Team Members Card */}

<div className={`p-4 rounded-xl border ${
  darkMode ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-200"
}`}>
  <div className="flex items-center justify-between mb-4">
    <h3 className="font-semibold text-lg text-gray-900 dark:text-white">Team Members</h3>
    {/* Only show Add button if edit features are enabled */}
    {showEditFeatures && (
      <div className="flex gap-2">
        <Button
          onClick={onAddTeamMember}
          size="sm"
          className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="w-3 h-3" />
          Add
        </Button>
      </div>
    )}
  </div>
  <div className="space-y-3">
    {project.teamMembers && project.teamMembers.length > 0 ? (
      project.teamMembers.map((member) => (
        <div key={member.id} className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
              {(member.name || 'U').charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{member.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{member.role}</p>
            </div>
          </div>
          {/* Only show Remove button if edit features are enabled */}
          {showEditFeatures && onRemoveTeamMember && (
            <Button
              onClick={() => onRemoveTeamMember(member.id)}
              variant="outline"
              size="sm"
              className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          )}
        </div>
      ))
    ) : (
      <div className="text-center py-4 text-gray-500 dark:text-gray-400">
        <p className="text-sm">No team members assigned</p>
        {showEditFeatures && (
          <p className="text-xs">Click "Add" to assign team members</p>
        )}
      </div>
    )}
  </div>
</div>
        </div>

        {/* Right Content - Details */}
        <div className="flex-1 space-y-6 overflow-y-auto">
          {/* Description */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-xl text-gray-900 dark:text-white">Description</h3>
              {isEditing && (
                <span className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900 px-2 py-1 rounded">
                  Editable
                </span>
              )}
            </div>
            <div className={`p-4 rounded-lg border ${
              darkMode ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-200"
            }`}>
              {isEditing ? (
                <Textarea
                  value={editedProject.description}
                  onChange={(e) => onChangeEditedProject?.({ ...editedProject, description: e.target.value })}
                  placeholder="Enter project description"
                  className="min-h-[120px] resize-none border-0 bg-transparent p-0 focus:ring-0"
                />
              ) : (
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {project.description || "No description provided."}
                </p>
              )}
            </div>
          </div>

          {/* Milestones Section */}
          {showMilestones && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-xl text-gray-900 dark:text-white">Milestones</h3>
                {canCreateTasks && (
                  <Button
                    onClick={onAddMilestone}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Plus className="w-4 h-4" />
                    Add Milestone
                  </Button>
                )}
              </div>
              <div className="space-y-3">
                {milestones.length > 0 ? (
                  milestones.map((milestone) => (
                    <div key={milestone.id} className={`p-4 rounded-lg border ${
                      darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 dark:text-white">{milestone.title}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{milestone.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                            <span>Due: {formatDate(milestone.dueDate)}</span>
                            <span>Priority: {milestone.priority}</span>
                            {milestone.assignee && <span>Assigned to: {milestone.assignee}</span>}
                            {milestone.weight && <span>Weight: {milestone.weight}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[milestone.status]}`}>
                            {milestone.status}
                          </span>
                          {onDeleteMilestone && (
                            <Button
                              onClick={() => onDeleteMilestone(milestone.id)}
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 dark:border-red-800 dark:hover:bg-red-900"
                              title="Delete milestone"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className={`p-8 text-center rounded-lg border-2 border-dashed ${
                    darkMode ? "border-gray-700 bg-gray-800" : "border-gray-300 bg-gray-50"
                  }`}>
                    <p className="text-gray-500 dark:text-gray-400">No milestones created yet</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Click "Add Milestone" to get started</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tasks Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-xl text-gray-900 dark:text-white">Tasks</h3>
              {canCreateTasks && (
                <Button
                  onClick={onAddTask}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="w-4 h-4" />
                  Add Task
                </Button>
              )}
            </div>
            <div className="space-y-3">
              {tasks.length > 0 ? (
                tasks.map((task) => (
                  <div key={task.id} className={`p-4 rounded-lg border ${
                    darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 dark:text-white">{task.title}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{task.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                          <span>Due: {formatDate(task.dueDate)}</span>
                          <span>Priority: {task.priority}</span>
                          {task.assignee && <span>Assigned to: {task.assignee}</span>}
                          {task.weight && <span>Weight: {task.weight}%</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[task.status]}`}>
                          {task.status}
                        </span>
                        {onDeleteTask && (
                          <Button
                            onClick={() => onDeleteTask(task.id)}
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 dark:border-red-800 dark:hover:bg-red-900"
                            title="Delete task"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className={`p-8 text-center rounded-lg border-2 border-dashed ${
                  darkMode ? "border-gray-700 bg-gray-800" : "border-gray-300 bg-gray-50"
                }`}>
                  <p className="text-gray-500 dark:text-gray-400">No tasks created yet</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Click "Add Task" to get started</p>
                </div>
              )}
            </div>
          </div>

          {/* Attachments Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-xl text-gray-900 dark:text-white">Attachments</h3>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  Upload File
                </label>
                {newFile && onFileUpload && (
                  <Button
                    onClick={handleFileUpload}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Paperclip className="w-4 h-4" />
                    Attach
                  </Button>
                )}
              </div>
            </div>
            <div className="space-y-3">
              {project.files && project.files.length > 0 ? (
                project.files.map((file, index) => (
                  <div key={index} className={`p-4 rounded-lg border ${
                    darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded-lg transition-colors">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                          <Paperclip className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400">
                            {file.name}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{formatFileSize(file.size)}</p>
                        </div>
                      </div>
                      {onDeleteAttachment && (
                        <Button
                          onClick={() => onDeleteAttachment(file.name)}
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className={`p-8 text-center rounded-lg border-2 border-dashed ${
                  darkMode ? "border-gray-700 bg-gray-800" : "border-gray-300 bg-gray-50"
                }`}>
                  <Paperclip className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">No attachments yet</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Upload files to share with your team</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetailView;