import { useState, useMemo, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Flag,
  UserCircle,
  CheckCircle,
  RefreshCw,
  Circle,
  ChevronLeft,
  Paperclip,
  Edit,
  Trash2,
  Send,
  X,
} from "lucide-react";
import DataTable from "react-data-table-component";
import { useAuth } from "@/context/AuthContext";
import { milestoneService } from "@/services/milestoneService";
import { projectTaskService } from "@/services/projectTaskService";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

type IssueType = "Subtask" | "Bug" | "Story" | "Epic";

type Subtask = {
  id: string;
  title: string;
  completed: boolean;
  weight: number;
  issueType: IssueType;
  assignee?: string;
  creator?: string;
};

type Task = {
  id: string;
  milestoneId: string;
  title: string;
  description: string;
  dueDate: string;
  priority: "Low" | "Medium" | "High";
  status: "to-do" | "in-progress" | "completed";
  team: string;
  files: string[];
  assignedBy: string;
  subtasks: Subtask[];
  assumedKickoff: string;
  archived: boolean;
  firstView?: boolean;
};

type Milestone = {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  priority: "Low" | "Medium" | "High";
  status: "to-do" | "in-progress" | "completed";
  progress: number;
  assignedTo: string;
  assignedBy: string;
  tasks: Task[];
  assignmentStatus?: any; // Backend assignment status (Pending/Accepted/Rejected)
};

const ISSUE_TYPE_COLORS = {
  Subtask: "bg-blue-100 text-blue-800",
  Bug: "bg-red-100 text-red-800",
  Story: "bg-purple-100 text-purple-800",
  Epic: "bg-orange-100 text-orange-800",
};

const ISSUE_TYPE_ICONS = {
  Subtask: <div className="w-2 h-2 rounded-full bg-gray-500 mr-2"></div>,
  Bug: <div className="w-2 h-2 rounded-full bg-gray-500 mr-2"></div>,
  Story: <div className="w-2 h-2 rounded-full bg-gray-500 mr-2"></div>,
  Epic: <div className="w-2 h-2 rounded-full bg-gray-500 mr-2"></div>,
};

const STATUS_LABELS = {
  "to-do": "To Do",
  "in-progress": "In Progress",
  completed: "Completed",
};

const PRIORITY_COLORS = {
  High: "bg-red-100 text-red-800",
  Medium: "bg-yellow-100 text-yellow-800",
  Low: "bg-green-100 text-green-800",
};

const STATUS_COLORS = {
  "to-do": "bg-red-100 text-red-800 border-red-300",
  "in-progress": "bg-yellow-100 text-yellow-800 border-yellow-300",
  completed: "bg-green-100 text-green-800 border-green-300",
};

const STATUS_ICONS = {
  "to-do": <Circle className="w-3 h-3 mr-1" />,
  "in-progress": <RefreshCw className="w-3 h-3 mr-1" />,
  completed: <CheckCircle className="w-3 h-3 mr-1" />,
};

const initialMilestones: Milestone[] = [
  {
    id: "1",
    title: "User Authentication System",
    description: "Implement complete user authentication flow",
    dueDate: "2025-06-30",
    priority: "High",
    status: "in-progress",
    progress: 65,
    assignedTo: "Kalkidan",
    assignedBy: "Project Manager",
    tasks: [
      {
        id: "1-1",
        milestoneId: "1",
        title: "Login functionality",
        description: "Implement user login with email/password",
        dueDate: "2025-05-15",
        priority: "High",
        status: "completed",
        team: "Frontend",
        files: [],
        assignedBy: "Tech Lead",
        subtasks: [],
        assumedKickoff: "2025-05-01",
        archived: false,
      },
      {
        id: "1-2",
        milestoneId: "1",
        title: "Password reset flow",
        description: "Create password reset functionality",
        dueDate: "2025-06-15",
        priority: "Medium",
        status: "in-progress",
        team: "Backend",
        files: ["reset-flow.pdf"],
        assignedBy: "Tech Lead",
        subtasks: [],
        assumedKickoff: "2025-05-20",
        archived: false,
      },
    ],
  },
  {
    id: "2",
    title: "Payment Integration",
    description: "Integrate payment gateway for transactions",
    dueDate: "2025-08-31",
    priority: "High",
    status: "to-do",
    progress: 0,
    assignedTo: "Mahlet",
    assignedBy: "Project Manager",
    tasks: [],
  },
  {
    id: "3",
    title: "Mobile App Launch",
    description: "Prepare for app store submission",
    dueDate: "2025-10-15",
    priority: "Medium",
    status: "to-do",
    progress: 10,
    assignedTo: "Dehine",
    assignedBy: "Project Manager",
    tasks: [],
  },
  {
    id: "4",
    title: "Mobile App Launch",
    description: "Prepare for app store submission",
    dueDate: "2025-10-15",
    priority: "Medium",
    status: "to-do",
    progress: 15,
    assignedTo: "Dehine",
    assignedBy: "Project Manager",
    tasks: [],
  },
];

interface DelegatedMileProps {
  darkMode: boolean;
}

const DelegatedMile = ({ darkMode }: DelegatedMileProps) => {
  const { user } = useAuth();
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(
    null
  );
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<
    "Low" | "Medium" | "High"
  >("Medium");

  const [subtaskInput, setSubtaskInput] = useState("");
  const [newSubtaskWeight, setNewSubtaskWeight] = useState(10);
  const [newIssueType, setNewIssueType] = useState<IssueType>("Subtask");
  const [editingSubtask, setEditingSubtask] = useState<Subtask | null>(null);
  const [isEditingTask, setIsEditingTask] = useState(false);
  const [editedTask, setEditedTask] = useState<Task | null>(null);
  const [progress, setProgress] = useState(0);
  const [showEmptySubtaskModal, setShowEmptySubtaskModal] = useState(false);
  const [showAccomplishmentModal, setShowAccomplishmentModal] = useState(false);
  const [progressMessage, setProgressMessage] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successData, setSuccessData] = useState({
    title: "",
    progress: 0,
    message: "",
  });

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "short",
      day: "numeric",
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const calculateProgress = (subtasks: Subtask[]) => {
    if (subtasks.length === 0) return 0;

    const totalWeight = subtasks.reduce((sum, st) => sum + (st.weight || 0), 0);
    const completedWeight = subtasks
      .filter((st) => st.completed)
      .reduce((sum, st) => sum + (st.weight || 0), 0);

    return totalWeight > 0
      ? Math.round((completedWeight / totalWeight) * 100)
      : 0;
  };

  // ✅ Fetch real milestone data from backend
  useEffect(() => {
    const fetchMilestones = async () => {
      if (!user?.id) {
        console.log("⚠️ No user ID found");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        console.log("📊 Fetching delegated milestones for user:", user.id);

        // Get all milestones
        const milestonesResponse = await milestoneService.getAllMilestones();
        console.log("📊 All milestones response:", milestonesResponse);

        if (
          milestonesResponse.success &&
          Array.isArray(milestonesResponse.data)
        ) {
          console.log(
            "📊 Sample milestone from backend:",
            milestonesResponse.data[0]
          );
          console.log(
            "📊 Fields available:",
            milestonesResponse.data[0]
              ? Object.keys(milestonesResponse.data[0])
              : []
          );

          // Filter milestones assigned to current user
          const myMilestones = milestonesResponse.data.filter(
            (m: any) =>
              m.assignedMemberId === user.id ||
              m.assignedMemberId === user.employeeId
          );

          console.log("📊 Milestones assigned to me:", myMilestones.length);
          if (myMilestones.length > 0) {
            console.log("📊 Sample my milestone:", myMilestones[0]);
            console.log(
              "📊 AssignmentStatus in data:",
              myMilestones[0].assignmentStatus
            );
          }

          // Transform to component format
          const transformedMilestones: Milestone[] = myMilestones.map(
            (m: any) => {
              // ✅ Use AssignmentStatus if available, otherwise fall back to Status
              let displayStatus = "to-do";
              if (
                m.assignmentStatus === "Accepted" ||
                m.assignmentStatus === 1
              ) {
                displayStatus = "in-progress";
              } else if (m.status === "Completed" || m.status === "completed") {
                displayStatus = "completed";
              } else if (
                m.status === "InProgress" ||
                m.status === "in-progress"
              ) {
                displayStatus = "in-progress";
              } else if (
                m.assignmentStatus === "Pending" ||
                m.assignmentStatus === 0
              ) {
                displayStatus = "to-do";
              } else if (
                m.assignmentStatus === "Rejected" ||
                m.assignmentStatus === 2
              ) {
                displayStatus = "to-do";
              }

              return {
                id: m.milestoneId?.toString() || "",
                title: m.milestoneName || "Untitled Milestone",
                description: m.description || "",
                dueDate: m.dueDate || "",
                priority: (m.priority || "Medium") as "Low" | "Medium" | "High",
                status: displayStatus as "to-do" | "in-progress" | "completed",
                progress: m.progress || 0,
                assignedTo:
                  m.assignedMemberName || user.name || user.username || "You",
                assignedBy: m.createdBy || "Manager",
                tasks: [], // Tasks will be loaded separately if needed
                assignmentStatus: m.assignmentStatus, // ✅ Store raw assignment status
              };
            }
          );

          console.log("✅ Transformed milestones:", transformedMilestones);
          setMilestones(transformedMilestones);
        } else {
          console.warn("⚠️ No milestones found");
          setMilestones([]);
        }

        setIsLoading(false);
      } catch (error) {
        console.error("❌ Error fetching milestones:", error);
        setIsLoading(false);
      }
    };

    fetchMilestones();
  }, [user]);

  useEffect(() => {
    if (selectedTask) {
      setEditedTask({ ...selectedTask });
      const newProgress = calculateProgress(selectedTask.subtasks);
      setProgress(newProgress);
    }
  }, [selectedTask]);

  const filteredMilestones = useMemo(() => {
    let result = milestones;

    if (searchText) {
      const searchLower = searchText.toLowerCase();
      result = result.filter(
        (milestone) =>
          (milestone.title || "").toLowerCase().includes(searchLower) ||
          (milestone.description || "").toLowerCase().includes(searchLower) ||
          (milestone.assignedTo || "").toLowerCase().includes(searchLower)
      );
    }

    if (statusFilter !== "all") {
      result = result.filter((milestone) => milestone.status === statusFilter);
    }

    if (priorityFilter !== "all") {
      result = result.filter(
        (milestone) => milestone.priority === priorityFilter
      );
    }

    return result;
  }, [milestones, searchText, statusFilter, priorityFilter]);

  const handleCreateTask = () => {
    if (!selectedMilestone || !newTaskTitle.trim()) return;

    const newTask: Task = {
      id: `${selectedMilestone.id}-${Date.now()}`,
      milestoneId: selectedMilestone.id,
      title: newTaskTitle,
      description: newTaskDescription,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0], // 30 days from now
      priority: newTaskPriority,
      status: "to-do",
      team: "Development",
      files: [],
      assignedBy: "You",
      subtasks: [],
      assumedKickoff: new Date().toISOString().split("T")[0],
      archived: false,
      firstView: true,
    };

    const updatedMilestones = milestones.map((milestone) =>
      milestone.id === selectedMilestone.id
        ? { ...milestone, tasks: [...milestone.tasks, newTask] }
        : milestone
    );

    setMilestones(updatedMilestones);
    setSelectedMilestone(
      updatedMilestones.find((m) => m.id === selectedMilestone.id) || null
    );

    // Reset form
    setNewTaskTitle("");
    setNewTaskDescription("");
    setNewTaskPriority("Medium");
  };

  const handleSubtaskKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddSubtask();
    }
  };

  const handleAddSubtask = () => {
    if (!subtaskInput.trim()) {
      setShowEmptySubtaskModal(true);
      return;
    }

    if (newSubtaskWeight <= 0) {
      alert("Weight must be greater than 0");
      return;
    }

    if (selectedTask && editedTask) {
      const newSubtask: Subtask = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: subtaskInput,
        completed: false,
        weight: newSubtaskWeight,
        issueType: newIssueType,
      };
      const updatedSubtasks = [...editedTask.subtasks, newSubtask];
      const updatedTask: Task = {
        ...editedTask,
        subtasks: updatedSubtasks,
        firstView: false,
      };

      setEditedTask(updatedTask);
      const newProgress = calculateProgress(updatedSubtasks);
      setProgress(newProgress);

      // Reset inputs
      setSubtaskInput("");
      setNewSubtaskWeight(10);
      setNewIssueType("Subtask");
    }
  };

  const handleEditSubtask = (subtask: Subtask) => {
    setEditingSubtask({ ...subtask });
  };

  const saveEditedSubtask = () => {
    if (editingSubtask && editedTask) {
      const updatedSubtasks = editedTask.subtasks.map((st) =>
        st.id === editingSubtask.id
          ? {
              ...st,
              title: editingSubtask.title,
              weight: editingSubtask.weight,
            }
          : st
      );
      const updatedTask = {
        ...editedTask,
        subtasks: updatedSubtasks,
        firstView: false,
      };
      setEditedTask(updatedTask);

      const newProgress = calculateProgress(updatedSubtasks);
      setProgress(newProgress);

      setEditingSubtask(null);
    }
  };

  const handleDeleteSubtask = (subtaskId: string) => {
    if (editedTask) {
      const updatedSubtasks = editedTask.subtasks.filter(
        (st) => st.id !== subtaskId
      );
      const updatedTask = { ...editedTask, subtasks: updatedSubtasks };
      setEditedTask(updatedTask);

      const newProgress = calculateProgress(updatedSubtasks);
      setProgress(newProgress);
    }
  };

  const saveTaskChanges = () => {
    if (editedTask && selectedMilestone) {
      const allSubtasksCompleted =
        editedTask.subtasks.length > 0 &&
        editedTask.subtasks.every((st) => st.completed);

      let newStatus = editedTask.status;
      if (allSubtasksCompleted) {
        newStatus = "completed";
      } else if (editedTask.subtasks.length > 0) {
        newStatus = "in-progress";
      } else {
        newStatus = "to-do";
      }

      const updatedTask: Task = {
        ...editedTask,
        status: newStatus,
        firstView: false,
      };

      // Update the task in the milestone
      const updatedMilestones = milestones.map((milestone) =>
        milestone.id === selectedMilestone.id
          ? {
              ...milestone,
              tasks: milestone.tasks.map((task) =>
                task.id === updatedTask.id ? updatedTask : task
              ),
            }
          : milestone
      );

      setMilestones(updatedMilestones);
      setSelectedMilestone(
        updatedMilestones.find((m) => m.id === selectedMilestone.id) || null
      );
      setSelectedTask(updatedTask);
      setIsEditingTask(false);

      const newProgress = calculateProgress(updatedTask.subtasks);
      setProgress(newProgress);
    }
  };

  const handleSubtaskToggle = (subtaskId: string) => {
    if (!editedTask) return;

    const updatedSubtasks = editedTask.subtasks.map((st) =>
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    );

    const newProgress = calculateProgress(updatedSubtasks);
    const updatedTask: Task = {
      ...editedTask,
      subtasks: updatedSubtasks,
      status:
        newProgress === 100
          ? "completed"
          : updatedSubtasks.length > 0
          ? "in-progress"
          : "to-do",
    };

    setEditedTask(updatedTask);
    setProgress(newProgress);
  };

  const handleSendProgress = () => {
    setSuccessData({
      title: selectedTask?.title || "",
      progress: progress,
      message: progressMessage,
    });
    setShowSuccessModal(true);
    setShowAccomplishmentModal(false);
    setProgressMessage("");
  };

  const renderSuccessModal = () => {
    if (!showSuccessModal) return null;
    return (
      <div className="fixed inset-0 bg-zinc-900 bg-opacity-50 flex items-center justify-center z-50">
        <div
          className={`p-6 rounded-lg w-full max-w-md ${
            darkMode ? "bg-zinc-900 text-gray-100" : "bg-white text-gray-700"
          }`}
        >
          <div className="flex flex-col items-center mb-6">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-center mb-2">
              Report Sent Successfully!
            </h3>
            <p className="text-center text-gray-500">
              Your progress report has been sent to your team leader.
            </p>
          </div>
          <div className="mb-6">
            <div className="mb-4">
              <h4 className="font-medium mb-1">Task</h4>
              <p
                className={`p-3 rounded-lg ${
                  darkMode
                    ? "bg-zinc-800 text-gray-200"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {successData.title}
              </p>
            </div>
            <div className="mb-4">
              <h4 className="font-medium mb-1">Progress</h4>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">Completed</span>
                <span className="text-sm font-medium">
                  {successData.progress}%
                </span>
              </div>
              <div
                className={`w-full h-2 rounded-full ${
                  darkMode ? "bg-zinc-700" : "bg-gray-200"
                }`}
              >
                <div
                  className={`h-2 rounded-full ${
                    successData.progress === 100
                      ? "bg-green-500"
                      : "bg-blue-500"
                  }`}
                  style={{ width: `${successData.progress}%` }}
                ></div>
              </div>
            </div>
            {successData.message && (
              <div>
                <h4 className="font-medium mb-1">Message</h4>
                <p
                  className={`p-3 rounded-lg ${
                    darkMode
                      ? "bg-zinc-800 text-gray-200"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {successData.message}
                </p>
              </div>
            )}
          </div>
          <div className="flex justify-center">
            <button
              onClick={() => setShowSuccessModal(false)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              OK
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderAccomplishmentModal = () => {
    if (!selectedTask || !showAccomplishmentModal) return null;

    const isCompleted = selectedTask.status === "completed";

    return (
      <div className="fixed inset-0 bg-zinc-900 bg-opacity-50 flex items-center justify-center z-50">
        <div
          className={`p-6 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto ${
            darkMode ? "bg-zinc-900 text-gray-100" : "bg-white text-gray-700"
          }`}
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">Today's Accomplishment</h3>
            <button
              onClick={() => setShowAccomplishmentModal(false)}
              aria-label="Close accomplishment modal"
              title="Close accomplishment modal"
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mb-6">
            <h4 className="font-medium mb-4">Task: {selectedTask.title}</h4>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium">Overall Progress</span>
              <span className="text-sm font-medium">{progress}%</span>
            </div>
            <div
              className={`w-full h-2 rounded-full ${
                darkMode ? "bg-zinc-700" : "bg-gray-200"
              }`}
            >
              <div
                className={`h-2 rounded-full ${
                  progress === 100 ? "bg-green-400" : "bg-green-300"
                }`}
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          {isCompleted ? (
            <div
              className={`p-6 mb-6 rounded-lg ${
                darkMode
                  ? "bg-green-600 text-gray-200"
                  : "bg-green-50 text-green-800"
              }`}
            >
              <h4 className="font-bold mb-2">Task Already Completed!</h4>
              <p className="text-sm">
                This task has been marked as completed. All subtasks have been
                finished successfully.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h4 className="font-medium mb-3">Subtasks</h4>
                <div className="space-y-3">
                  {selectedTask.subtasks.map((subtask) => (
                    <div
                      key={subtask.id}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        darkMode
                          ? "bg-zinc-700 text-gray-200"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={subtask.completed}
                          onChange={() => handleSubtaskToggle(subtask.id)}
                          aria-label={`Toggle subtask ${subtask.title}`}
                          title={`Toggle subtask ${subtask.title}`}
                          className="mr-3 w-4 h-4 text-purple-900 rounded"
                        />
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
                      <span className="text-sm text-gray-500">
                        {subtask.weight}% weight
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <h4 className="font-medium mb-2">Progress Report</h4>
                <textarea
                  value={progressMessage}
                  onChange={(e) => setProgressMessage(e.target.value)}
                  placeholder="Describe what you accomplished today and any challenges you faced..."
                  rows={4}
                  className={`w-full p-3 rounded-lg border ${
                    darkMode
                      ? "bg-zinc-700 border-zinc-600 text-gray-200"
                      : "bg-white border-gray-300 text-gray-700"
                  }`}
                />
              </div>
            </>
          )}

          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowAccomplishmentModal(false)}
              className={`px-4 py-2 rounded-lg ${
                darkMode
                  ? "bg-zinc-700 text-gray-200"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              {isCompleted ? "Close" : "Cancel"}
            </button>
            {!isCompleted && (
              <button
                onClick={handleSendProgress}
                className="px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors flex items-center"
              >
                <Send className="w-4 h-4 mr-2" />
                Send to Team Leader
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderTaskDetails = () => {
    if (!selectedTask) return null;

    const task = isEditingTask && editedTask ? editedTask : selectedTask;
    const hasSubtasks = task.subtasks.length > 0;
    const isToDoStatus = task.status === "to-do";
    const isInProgressStatus = task.status === "in-progress";
    const isCompletedStatus = task.status === "completed";

    return (
      <div className="lg:w-1/2 lg:mt-28 mr-5">
        <div className="flex items-center mb-6">
          <button
            onClick={() => setSelectedTask(null)}
            aria-label="Back to tasks"
            title="Back to tasks"
            className="mr-4"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h2 className="text-2xl font-bold">Task Details</h2>
        </div>

        <div className="flex flex-col gap-2 mb-6">
          <h2 className="py-2 rounded-md ml-3 text-lg font-bold">
            {task.title}
          </h2>
        </div>

        <div className="flex flex-col lg:flex-row w-full">
          {/* Left Side - Task Information */}
          <div className="lg:w-1/2 lg:pr-6 ml-3">
            {/* Task Progress */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium">Task Progress</span>
                <span className="lg:mr-px text-sm font-medium">
                  {progress}%
                </span>
              </div>
              <div
                className={`lg:w-auto h-2 rounded-full ${
                  darkMode ? "bg-zinc-700" : "bg-gray-200"
                }`}
              >
                <div
                  className={`h-2 rounded-full ${
                    progress === 100 ? "bg-green-400" : "bg-green-300"
                  }`}
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="font-bold mb-2">Description</h3>
              <p
                className={`p-3 rounded-lg ${
                  darkMode
                    ? "bg-zinc-700 text-gray-200"
                    : "bg-white text-gray-700"
                }`}
              >
                {task.description}
              </p>
            </div>

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
                      Assigned By
                    </h4>
                    <p className="flex items-center">
                      <UserCircle className="w-4 h-4 mr-2" />
                      {task.assignedBy}
                    </p>
                  </div>

                  <div>
                    <h4
                      className={`text-sm ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      } mb-1`}
                    >
                      Priority
                    </h4>
                    <div
                      className={`px-3 py-1 rounded-md flex items-center w-fit ${
                        PRIORITY_COLORS[task.priority]
                      }`}
                    >
                      <Flag className="w-4 h-4 mr-2" />
                      {task.priority}
                    </div>
                  </div>

                  <div>
                    <h4
                      className={`text-sm ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      } mb-1`}
                    >
                      Status
                    </h4>
                    <span
                      className={`px-3 py-1 w-fit rounded-md flex items-center ${
                        STATUS_COLORS[task.status]
                      }`}
                    >
                      {STATUS_ICONS[task.status]}
                      {STATUS_LABELS[task.status]}
                    </span>
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
                      {formatDate(task.dueDate)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {task.files.length > 0 && (
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
                    {task.files.map((file, index) => (
                      <div key={index} className="flex items-center">
                        <Paperclip className="w-4 h-4 mr-2" />
                        <span className="text-sm">{file}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Side - Task Planning and Progress */}
          <div className="lg:w-1/2 lg:pl-2">
            <div
              className={`rounded-xl p-4 ${
                darkMode ? "bg-zinc-700" : "bg-white"
              }`}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-xl">
                  {isEditingTask
                    ? "Edit Your Plan"
                    : isToDoStatus && !hasSubtasks
                    ? "Plan Your Task"
                    : isToDoStatus && hasSubtasks
                    ? "Your Plan"
                    : isInProgressStatus
                    ? "Work in Progress"
                    : "Task Completed"}
                </h3>
              </div>

              <div className="space-y-6">
                {/* EDITING MODE - Show for all statuses when isEditingTask is true */}
                {isEditingTask && (
                  <>
                    <div>
                      <h4 className="text-sm text-gray-500 font-medium mb-3">
                        Add Subtasks
                      </h4>
                      <div className="flex flex-col gap-3">
                        <div className="flex gap-2 flex-wrap mb-2">
                          {(
                            ["Subtask", "Bug", "Story", "Epic"] as IssueType[]
                          ).map((type) => (
                            <button
                              key={type}
                              onClick={() => setNewIssueType(type)}
                              className={`px-4 py-1 rounded-lg text-sm flex items-center ${
                                newIssueType === type
                                  ? "bg-zinc-800 text-white"
                                  : darkMode
                                  ? "bg-zinc-600 text-gray-200"
                                  : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {ISSUE_TYPE_ICONS[type]}
                              {type}
                            </button>
                          ))}
                        </div>

                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={subtaskInput}
                            onChange={(e) => setSubtaskInput(e.target.value)}
                            onKeyDown={handleSubtaskKeyDown}
                            placeholder={`Enter ${newIssueType.toLowerCase()} title`}
                            className={`flex-1 p-2 rounded-lg text-sm ${
                              darkMode
                                ? "bg-zinc-600 border-zinc-500 text-gray-200"
                                : "bg-white border-gray-200 text-gray-700"
                            } border`}
                          />
                          <input
                            type="number"
                            min="1"
                            max="100"
                            value={newSubtaskWeight}
                            onChange={(e) =>
                              setNewSubtaskWeight(Number(e.target.value))
                            }
                            className={`w-20 p-2 rounded-lg text-sm ${
                              darkMode
                                ? "bg-zinc-600 border-zinc-500 text-gray-200"
                                : "bg-white border-gray-200 text-gray-700"
                            } border`}
                            placeholder="Weight %"
                          />
                          <button
                            onClick={handleAddSubtask}
                            className="px-3 py-1 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium mb-3 pr-6">
                        {hasSubtasks
                          ? "Your Subtasks"
                          : "No subtasks created yet"}
                      </h4>

                      {hasSubtasks ? (
                        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-6">
                          {task.subtasks.map((subtask) => (
                            <div
                              key={subtask.id}
                              className={`flex items-center justify-between p-3 rounded-lg ${
                                darkMode
                                  ? "bg-zinc-600 text-gray-200"
                                  : "bg-white text-gray-700"
                              } border ${
                                darkMode ? "border-zinc-500" : "border-gray-200"
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
                                    aria-label="Subtask title"
                                    title="Subtask title"
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
                                      min="0"
                                      max="100"
                                      aria-label="Subtask weight"
                                      title="Subtask weight"
                                      className={`w-20 p-2 rounded-lg text-sm ${
                                        darkMode
                                          ? "bg-zinc-700 border-zinc-500 text-gray-200"
                                          : "bg-white border-gray-200 text-gray-700"
                                      } border`}
                                    />
                                    <span className="text-sm">% weight</span>
                                    <button
                                      onClick={saveEditedSubtask}
                                      className="ml-auto px-3 py-1 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors text-sm"
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
                                        handleSubtaskToggle(subtask.id)
                                      }
                                      aria-label={`Toggle subtask ${subtask.title}`}
                                      title={`Toggle subtask ${subtask.title}`}
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
                                        <span
                                          className={`text-xs px-2 py-0.5 rounded ${
                                            ISSUE_TYPE_COLORS[subtask.issueType]
                                          }`}
                                        >
                                          {ISSUE_TYPE_ICONS[subtask.issueType]}
                                          {subtask.issueType}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                          {subtask.weight}% weight
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex gap-2 ml-4">
                                    <button
                                      onClick={() => handleEditSubtask(subtask)}
                                      aria-label="Edit subtask"
                                      title="Edit subtask"
                                      className="text-gray-500 hover:text-purple-500"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleDeleteSubtask(subtask.id)
                                      }
                                      aria-label="Delete subtask"
                                      title="Delete subtask"
                                      className="text-gray-500 hover:text-red-500"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div
                          className={`p-4 text-center rounded-lg ${
                            darkMode
                              ? "bg-zinc-600 text-gray-400"
                              : "bg-gray-200 text-gray-500"
                          }`}
                        >
                          Add your first subtask to start planning
                        </div>
                      )}
                    </div>

                    <div className="flex gap-3 justify-end">
                      <button
                        onClick={() => {
                          setIsEditingTask(false);
                          setEditedTask(selectedTask);
                        }}
                        className={`px-4 py-2 text-base rounded-lg border ${
                          darkMode ? "border-zinc-600" : "border-gray-300"
                        }`}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={saveTaskChanges}
                        className="px-4 py-2 text-base bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors"
                      >
                        Save Plan
                      </button>
                    </div>
                  </>
                )}

                {/* VIEWING MODE - Show when not editing */}
                {!isEditingTask && (
                  <div>
                    {/* TO-DO Status */}
                    {isToDoStatus && (
                      <>
                        {!hasSubtasks ? (
                          <div>
                            <div
                              className={`p-6 mb-6 rounded-lg ${
                                darkMode
                                  ? "bg-zinc-600 text-gray-200"
                                  : "bg-blue-50 text-blue-800"
                              }`}
                            >
                              <h4 className="font-bold mb-2">
                                Welcome to your task!
                              </h4>
                              <p className="text-sm">
                                To get started, break down this task into
                                smaller subtasks and assign weights to each.
                                This will help you track your progress and
                                estimate completion time.
                              </p>
                            </div>
                            <div className="flex justify-end">
                              <button
                                onClick={() => {
                                  setIsEditingTask(true);
                                  setEditedTask({ ...selectedTask });
                                }}
                                className="px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors"
                              >
                                Create Plan & Start Working
                              </button>
                            </div>
                          </div>
                        ) : (
                          // Show the plan
                          <>
                            <div>
                              <h4 className="text-sm font-medium mb-3">
                                Your Plan
                              </h4>
                              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-6">
                                {task.subtasks.map((subtask) => (
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
                                    <div className="flex items-center flex-1">
                                      <input
                                        type="checkbox"
                                        checked={subtask.completed}
                                        onChange={() =>
                                          handleSubtaskToggle(subtask.id)
                                        }
                                        aria-label={`Toggle subtask ${subtask.title}`}
                                        title={`Toggle subtask ${subtask.title}`}
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
                                          <span
                                            className={`text-xs px-2 py-0.5 rounded ${
                                              ISSUE_TYPE_COLORS[
                                                subtask.issueType
                                              ]
                                            }`}
                                          >
                                            {
                                              ISSUE_TYPE_ICONS[
                                                subtask.issueType
                                              ]
                                            }
                                            {subtask.issueType}
                                          </span>
                                          <span className="text-xs text-gray-500">
                                            {subtask.weight}% weight
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="flex gap-3 justify-end">
                              <button
                                onClick={() => setIsEditingTask(true)}
                                className="px-4 py-2 text-base bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors flex items-center"
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                Edit Plan
                              </button>
                              <button
                                onClick={() => setShowAccomplishmentModal(true)}
                                className="px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors flex items-center"
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Today's Accomplishment
                              </button>
                            </div>
                          </>
                        )}
                      </>
                    )}

                    {/* IN-PROGRESS Status - Show progress and allow updates */}
                    {isInProgressStatus && (
                      <>
                        <div
                          className={`p-6 mb-6 rounded-lg ${
                            darkMode
                              ? "bg-zinc-600 text-gray-200"
                              : "bg-blue-50 text-blue-800"
                          }`}
                        >
                          <h4 className="font-bold mb-2">Work in Progress</h4>
                          <p className="text-sm">
                            You're actively working on this task. Keep updating
                            your progress and mark subtasks as completed.
                          </p>
                        </div>

                        {hasSubtasks && (
                          <div>
                            <h4 className="text-sm font-medium mb-3">
                              Your Progress
                            </h4>
                            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-6">
                              {task.subtasks.map((subtask) => (
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
                                  <input
                                    type="checkbox"
                                    checked={subtask.completed}
                                    onChange={() =>
                                      handleSubtaskToggle(subtask.id)
                                    }
                                    aria-label={`Toggle subtask ${subtask.title}`}
                                    title={`Toggle subtask ${subtask.title}`}
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
                                      <span
                                        className={`text-xs px-2 py-0.5 rounded ${
                                          ISSUE_TYPE_COLORS[subtask.issueType]
                                        }`}
                                      >
                                        {ISSUE_TYPE_ICONS[subtask.issueType]}
                                        {subtask.issueType}
                                      </span>
                                      <span className="text-xs text-gray-500">
                                        {subtask.weight}% weight
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex gap-3 justify-end">
                          <button
                            onClick={() => setIsEditingTask(true)}
                            className="px-4 py-2 text-base bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors flex items-center"
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Plan
                          </button>
                          <button
                            onClick={() => setShowAccomplishmentModal(true)}
                            className="px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors flex items-center"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Today's Accomplishment
                          </button>
                        </div>
                      </>
                    )}

                    {/* COMPLETED Status - Show completion message */}
                    {isCompletedStatus && (
                      <>
                        <div
                          className={`p-6 mb-6 rounded-lg ${
                            darkMode
                              ? "bg-green-600 text-gray-200"
                              : "bg-green-50 text-green-800"
                          }`}
                        >
                          <h4 className="font-bold mb-2">Task Completed!</h4>
                          <p className="text-sm">
                            Congratulations! You have successfully completed
                            this task. All subtasks have been finished.
                          </p>
                        </div>

                        {hasSubtasks && (
                          <div>
                            <h4 className="text-sm font-medium mb-3">
                              Completed Subtasks
                            </h4>
                            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-6">
                              {task.subtasks.map((subtask) => (
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
                                  <div className="flex items-center flex-1">
                                    <CheckCircle className="w-5 h-5 mr-3 text-green-500" />
                                    <div className="flex flex-col flex-1">
                                      <div className="flex items-center">
                                        <span className="line-through text-gray-500">
                                          {subtask.title}
                                        </span>
                                      </div>
                                      <div className="flex gap-2 mt-1">
                                        <span
                                          className={`text-xs px-2 py-0.5 rounded ${
                                            ISSUE_TYPE_COLORS[subtask.issueType]
                                          }`}
                                        >
                                          {ISSUE_TYPE_ICONS[subtask.issueType]}
                                          {subtask.issueType}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                          {subtask.weight}% weight
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex gap-3 justify-end">
                          <button
                            onClick={() => setIsEditingTask(true)}
                            className="px-4 py-2 text-base bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors flex items-center"
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Plan
                          </button>
                          <button
                            onClick={() => setShowAccomplishmentModal(true)}
                            className="px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors flex items-center"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Today's Accomplishment
                          </button>
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

  // ✅ Handle Accept Milestone
  const handleAcceptMilestone = async (milestone: Milestone) => {
    const confirmed = window.confirm(
      `Are you sure you want to accept milestone "${milestone.title}"?`
    );
    if (!confirmed) return;

    try {
      const milestoneId = parseInt(milestone.id);
      console.log("✅ Accepting milestone ID:", milestoneId);
      console.log("✅ Current status:", milestone.status);
      console.log("✅ Current assignmentStatus:", milestone.assignmentStatus);
      console.log(
        "✅ Calling API: PUT /api/Milestone/" +
          milestoneId +
          "/accept-assignment"
      );

      const response = await milestoneService.acceptMilestoneAssignment(
        milestoneId
      );
      console.log("✅ Backend response:", response);

      if (response.success || response.status === 204) {
        console.log(
          "✅ Milestone assignment accepted successfully in backend!"
        );

        toast.success("Milestone assignment accepted successfully!", {
          theme: darkMode ? "dark" : "light",
        });

        // ✅ IMMEDIATELY update local state (for instant UI feedback)
        setMilestones((prev) =>
          prev.map((m) =>
            m.id === milestone.id
              ? {
                  ...m,
                  status: "in-progress" as const, // ✅ Change display status
                  assignmentStatus: "Accepted", // ✅ Change assignment status
                }
              : m
          )
        );

        console.log("✅ Local state updated, now refreshing from backend...");

        // ✅ REFRESH from backend to get the updated data
        const milestonesResponse = await milestoneService.getAllMilestones();
        console.log("✅ Refresh response:", milestonesResponse);

        if (
          milestonesResponse.success &&
          Array.isArray(milestonesResponse.data)
        ) {
          const myMilestones = milestonesResponse.data.filter(
            (m: any) =>
              m.assignedMemberId === user?.id ||
              m.assignedMemberId === user?.employeeId
          );

          console.log("✅ My milestones after refresh:", myMilestones.length);
          if (myMilestones.length > 0) {
            console.log(
              "✅ Sample milestone after accept:",
              myMilestones.find((m: any) => m.milestoneId === milestoneId)
            );
          }

          const transformedMilestones: Milestone[] = myMilestones.map(
            (m: any) => {
              // ✅ Use AssignmentStatus to determine display status
              let displayStatus = "to-do";
              if (
                m.assignmentStatus === "Accepted" ||
                m.assignmentStatus === 1
              ) {
                displayStatus = "in-progress";
              } else if (m.status === "Completed" || m.status === "completed") {
                displayStatus = "completed";
              } else if (
                m.status === "InProgress" ||
                m.status === "in-progress"
              ) {
                displayStatus = "in-progress";
              } else if (
                m.assignmentStatus === "Pending" ||
                m.assignmentStatus === 0
              ) {
                displayStatus = "to-do";
              } else if (
                m.assignmentStatus === "Rejected" ||
                m.assignmentStatus === 2
              ) {
                displayStatus = "to-do";
              }

              return {
                id: m.milestoneId?.toString() || "",
                title: m.milestoneName || "Untitled Milestone",
                description: m.description || "",
                dueDate: m.dueDate || "",
                priority: (m.priority || "Medium") as "Low" | "Medium" | "High",
                status: displayStatus as "to-do" | "in-progress" | "completed",
                progress: m.progress || 0,
                assignedTo:
                  m.assignedMemberName || user?.name || user?.username || "You",
                assignedBy: m.createdBy || "Manager",
                tasks: [],
                assignmentStatus: m.assignmentStatus,
              };
            }
          );

          console.log(
            "✅ Transformed milestones after refresh:",
            transformedMilestones
          );
          setMilestones(transformedMilestones);
        }
      } else {
        console.error("❌ Backend response not successful:", response);
        toast.error(response.message || "Failed to accept milestone", {
          theme: darkMode ? "dark" : "light",
        });
      }
    } catch (error) {
      console.error("❌ Error accepting milestone:", error);
      console.error("❌ Error details:", JSON.stringify(error, null, 2));
      toast.error("Failed to accept milestone. Please try again.", {
        theme: darkMode ? "dark" : "light",
      });
    }
  };

  // ✅ Handle Reject Milestone
  const handleRejectMilestone = async (milestone: Milestone) => {
    const reason = window.prompt(
      `Please provide a reason for rejecting milestone "${milestone.title}":`
    );
    if (!reason || !reason.trim()) {
      toast.warning("Rejection cancelled - reason is required", {
        theme: darkMode ? "dark" : "light",
      });
      return;
    }

    try {
      const milestoneId = parseInt(milestone.id);
      console.log("❌ Rejecting milestone ID:", milestoneId);
      console.log("❌ Rejection reason:", reason);
      console.log(
        "❌ Calling API: PUT /api/Milestone/" +
          milestoneId +
          "/reject-assignment"
      );

      const response = await milestoneService.rejectMilestoneAssignment(
        milestoneId,
        reason
      );
      console.log("❌ Backend response:", response);

      if (response.success || response.status === 204) {
        console.log(
          "✅ Milestone assignment rejected successfully in backend!"
        );

        toast.success("Milestone assignment rejected successfully!", {
          theme: darkMode ? "dark" : "light",
        });

        // ✅ Remove from list (rejected assignments shouldn't show)
        setMilestones((prev) => prev.filter((m) => m.id !== milestone.id));
        console.log("✅ Milestone removed from list");
      } else {
        console.error("❌ Backend response not successful:", response);
        toast.error(response.message || "Failed to reject milestone", {
          theme: darkMode ? "dark" : "light",
        });
      }
    } catch (error) {
      console.error("❌ Error rejecting milestone:", error);
      console.error("❌ Error details:", JSON.stringify(error, null, 2));
      toast.error("Failed to reject milestone. Please try again.", {
        theme: darkMode ? "dark" : "light",
      });
    }
  };

  const columns = [
    {
      name: "Milestone",
      sortable: true,
      cell: (row: Milestone) => (
        <div className="pl-2">
          <div className="font-medium">{row.title}</div>
          <div
            className={`text-xs ${
              darkMode ? "text-gray-400" : "text-gray-500"
            } mt-1`}
          >
            {row.description}
          </div>
        </div>
      ),
      minWidth: "250px",
    },
    {
      name: "Priority",
      sortable: true,
      cell: (row: Milestone) => (
        <div className={`px-3 py-1 rounded-md flex items-center w-fit `}>
          <Flag className="w-4 h-4 mr-2" />
          {row.priority} Priority
        </div>
      ),
    },
    {
      name: "Status",
      sortable: true,
      cell: (row: Milestone) => (
        <div className="flex flex-col gap-1">
          <span
            className={`text-xs px-2 py-1 rounded-md flex items-center w-fit `}
          >
            {STATUS_ICONS[row.status]}
            {STATUS_LABELS[row.status]}
          </span>
          {/* ✅ Show assignment status badge */}
          {row.assignmentStatus !== undefined && (
            <span
              className={`text-xs px-2 py-1 rounded-md w-fit ${
                row.assignmentStatus === "Accepted" ||
                row.assignmentStatus === 1
                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                  : row.assignmentStatus === "Rejected" ||
                    row.assignmentStatus === 2
                  ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                  : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
              }`}
            >
              {row.assignmentStatus === "Accepted" || row.assignmentStatus === 1
                ? "✓ Accepted"
                : row.assignmentStatus === "Rejected" ||
                  row.assignmentStatus === 2
                ? "✗ Rejected"
                : "⏳ Pending"}
            </span>
          )}
        </div>
      ),
    },
    {
      name: "Progress",
      sortable: true,
      cell: (row: Milestone) => (
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
            ></div>
          </div>
          <span className="ml-2 text-sm">{row.progress}%</span>
        </div>
      ),
    },
    {
      name: "Due Date",
      sortable: true,
      cell: (row: Milestone) => (
        <div className="flex items-center">
          <Calendar className="w-4 h-4 mr-1" />
          {formatDate(row.dueDate)}
        </div>
      ),
    },
    {
      name: "Assigned To",
      sortable: true,
      cell: (row: Milestone) => (
        <div className="flex items-center">
          <UserCircle className="w-4 h-4 mr-1" />
          {row.assignedTo}
        </div>
      ),
    },
    {
      name: "Actions",
      cell: (row: Milestone) => (
        <div className="flex gap-1">
          {/* Only show Accept/Reject if assignment is Pending */}
          {row.assignmentStatus === "Pending" ||
          row.assignmentStatus === 0 ||
          !row.assignmentStatus ? (
            <>
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAcceptMilestone(row);
                }}
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white text-xs px-2 py-1"
              >
                ✓ Accept
              </Button>
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRejectMilestone(row);
                }}
                size="sm"
                className="bg-red-600 hover:bg-red-700 text-white text-xs px-2 py-1"
              >
                ✗ Reject
              </Button>
            </>
          ) : (
            <span
              className={`text-xs px-2 py-1 rounded ${
                row.assignmentStatus === "Accepted" ||
                row.assignmentStatus === 1
                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                  : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
              }`}
            >
              {row.assignmentStatus === "Accepted" || row.assignmentStatus === 1
                ? "✓ Accepted"
                : "✗ Rejected"}
            </span>
          )}
        </div>
      ),
      minWidth: "150px",
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
        paddingLeft: "15px",
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
        paddingLeft: "6px",
        paddingRight: "8px",
        color: darkMode ? "#e5e7eb" : "#111827",
      },
    },
  };

  return (
    <div
      className={`flex-1 min-h-screen p-4 ${
        darkMode ? "bg-zinc-800 text-gray-200" : "bg-white text-gray-800"
      }`}
    >
      <ToastContainer />

      {/* ✅ Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <RefreshCw
              className={`w-12 h-12 animate-spin mx-auto mb-4 ${
                darkMode ? "text-gray-400" : "text-gray-600"
              }`}
            />
            <p
              className={`text-lg ${
                darkMode ? "text-gray-400" : "text-gray-600"
              }`}
            >
              Loading your milestones...
            </p>
          </div>
        </div>
      ) : (
        <>
          {showEmptySubtaskModal && (
            <div className="fixed inset-0 bg-zinc-900 bg-opacity-50 flex items-center justify-center z-50">
              <div
                className={`p-6 rounded-lg w-96 ${
                  darkMode
                    ? "bg-zinc-900 text-gray-100"
                    : "bg-white text-gray-700"
                }`}
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold">Attention Required</h3>
                  <button
                    onClick={() => setShowEmptySubtaskModal(false)}
                    aria-label="Close modal"
                    title="Close modal"
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <p className="mb-6">
                  Please enter a subtask title before adding.
                </p>
                <button
                  onClick={() => setShowEmptySubtaskModal(false)}
                  className="mr-0 px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Confirm
                </button>
              </div>
            </div>
          )}

          {!selectedMilestone ? (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div className="ml-2">
                  <h1 className="text-2xl font-bold mt-3">Your Milestones</h1>
                  <p
                    className={`text-sm mt-1  ${
                      darkMode ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    Delegation overview | <span>{milestones.length} </span>{" "}
                    Total Milestones
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <div
                    className={`flex items-center px-3 py-1 rounded-lg ${
                      darkMode
                        ? "bg-zinc-700 text-gray-100"
                        : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      aria-label="Filter by status"
                      title="Filter by status"
                      className={`bg-transparent ${
                        darkMode
                          ? "text-gray-200"
                          : "bg-purple-900 text-gray-800"
                      }`}
                    >
                      <option value="all">All Statuses</option>
                      <option value="to-do">To Do</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>

                  <div
                    className={`flex items-center px-3 py-1 rounded-lg ${
                      darkMode
                        ? "bg-zinc-700 text-gray-100"
                        : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    <select
                      value={priorityFilter}
                      onChange={(e) => setPriorityFilter(e.target.value)}
                      aria-label="Filter by priority"
                      title="Filter by priority"
                      className={`bg-transparent ${
                        darkMode ? "text-gray-200" : "text-gray-800"
                      }`}
                    >
                      <option value="all">All Priorities</option>
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                </div>
              </div>

              <Card
                className={`mb-8 ${
                  darkMode
                    ? "bg-zinc-800 border-zinc-700"
                    : "bg-white border-gray-200"
                } border`}
              >
                <CardContent className="p-0">
                  <div
                    className={`p-4 border-b ${
                      darkMode ? "border-zinc-700" : "border-gray-200"
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <h2 className="text-lg font-semibold">Milestones</h2>
                      <div className="relative w-full md:w-64">
                        <input
                          type="text"
                          placeholder="Search milestones..."
                          value={searchText}
                          onChange={(e) => setSearchText(e.target.value)}
                          className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                            darkMode
                              ? "bg-zinc-700 border-zinc-600 text-white placeholder-gray-400 focus:border-purple-500"
                              : "bg-white border-gray-300 text-gray-800 placeholder-gray-500 focus:border-purple-400"
                          } focus:outline-none focus:ring-2 ${
                            darkMode
                              ? "focus:ring-purple-500"
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
                    data={filteredMilestones}
                    customStyles={customStyles}
                    onRowClicked={setSelectedMilestone}
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
                          No milestones found
                        </h3>
                        <p
                          className={`text-center ${
                            darkMode ? "text-gray-400" : "text-gray-500"
                          } max-w-md`}
                        >
                          Try adjusting your filters or create new milestones.
                        </p>
                      </div>
                    }
                  />
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Left side - Milestone details */}
              <div className="lg:w-1/2 mt-5">
                <div className="flex items-center mb-6">
                  <button
                    onClick={() => setSelectedMilestone(null)}
                    aria-label="Back to milestones"
                    title="Back to milestones"
                    className="mr-4"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <h2 className="text-2xl font-bold ">Milestone Details</h2>
                </div>

                <div className="space-y-6 ml-5">
                  <div>
                    <h3 className="text-xl font-bold mb-2">
                      {selectedMilestone.title}
                    </h3>
                    <p
                      className={`p-3 rounded-lg ${
                        darkMode
                          ? "bg-zinc-700 text-gray-200"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {selectedMilestone.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div
                      className={`p-4 rounded-lg ${
                        darkMode ? "bg-zinc-700" : "bg-gray-100"
                      }`}
                    >
                      <h4 className="font-medium mb-2">Status</h4>
                      <span
                        className={`px-3 py-1 rounded-md flex items-center w-fit ${
                          STATUS_COLORS[selectedMilestone.status]
                        }`}
                      >
                        {STATUS_ICONS[selectedMilestone.status]}
                        {STATUS_LABELS[selectedMilestone.status]}
                      </span>
                    </div>

                    <div
                      className={`p-4 rounded-lg ${
                        darkMode ? "bg-zinc-700" : "bg-gray-100"
                      }`}
                    >
                      <h4 className="font-medium mb-2">Priority</h4>
                      <div
                        className={`px-3 py-1 rounded-md flex items-center w-fit ${
                          PRIORITY_COLORS[selectedMilestone.priority]
                        }`}
                      >
                        <Flag className="w-4 h-4 mr-2" />
                        {selectedMilestone.priority}
                      </div>
                    </div>

                    <div
                      className={`p-4 rounded-lg ${
                        darkMode ? "bg-zinc-700" : "bg-gray-100"
                      }`}
                    >
                      <h4 className="font-medium mb-2">Due Date</h4>
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        {formatDate(selectedMilestone.dueDate)}
                      </div>
                    </div>

                    <div
                      className={`p-4 rounded-lg ${
                        darkMode ? "bg-zinc-700" : "bg-gray-100"
                      }`}
                    >
                      <h4 className="font-medium mb-2">Progress</h4>
                      <div className="flex items-center">
                        <div
                          className={`w-20 h-2 rounded-full ${
                            darkMode ? "bg-gray-600" : "bg-gray-300"
                          }`}
                        >
                          <div
                            className={`h-full rounded-full ${
                              selectedMilestone.progress < 30
                                ? "bg-red-500"
                                : selectedMilestone.progress < 70
                                ? "bg-yellow-500"
                                : "bg-green-500"
                            }`}
                            style={{ width: `${selectedMilestone.progress}%` }}
                          ></div>
                        </div>
                        <span className="ml-2 text-sm">
                          {selectedMilestone.progress}%
                        </span>
                      </div>
                    </div>

                    <div
                      className={`p-4 rounded-lg ${
                        darkMode ? "bg-zinc-700" : "bg-gray-100"
                      }`}
                    >
                      <h4 className="font-medium mb-2">Assigned To</h4>
                      <div className="flex items-center">
                        <UserCircle className="w-4 h-4 mr-2" />
                        {selectedMilestone.assignedTo}
                      </div>
                    </div>

                    <div
                      className={`p-4 rounded-lg ${
                        darkMode ? "bg-zinc-700" : "bg-gray-100"
                      }`}
                    >
                      <h4 className="font-medium mb-2">Assigned By</h4>
                      <div className="flex items-center">
                        <UserCircle className="w-4 h-4 mr-2" />
                        {selectedMilestone.assignedBy}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold mb-4">Tasks in this Milestone</h4>
                    {selectedMilestone.tasks.length > 0 ? (
                      <div className="space-y-3">
                        {selectedMilestone.tasks.map((task) => (
                          <div
                            key={task.id}
                            className={`p-4 rounded-lg ${
                              darkMode ? "bg-zinc-700" : "bg-gray-100"
                            } border ${
                              darkMode ? "border-zinc-600" : "border-gray-200"
                            } cursor-pointer`}
                            onClick={() => setSelectedTask(task)}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <h5 className="font-medium">{task.title}</h5>
                                <p className="text-sm text-gray-500 mt-1">
                                  {task.description}
                                </p>
                              </div>
                              <span
                                className={`text-xs px-2 py-1 rounded-md ${
                                  STATUS_COLORS[task.status]
                                }`}
                              >
                                {STATUS_LABELS[task.status]}
                              </span>
                            </div>
                            <div className="flex items-center mt-3 text-sm text-gray-500">
                              <Flag className="w-3 h-3 mr-1" />
                              <span className="mr-4">
                                {task.priority} Priority
                              </span>
                              <Calendar className="w-3 h-3 mr-1" />
                              <span>Due: {formatDate(task.dueDate)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div
                        className={`p-4 text-center rounded-lg ${
                          darkMode
                            ? "bg-zinc-700 text-gray-400"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        No tasks created for this milestone yet.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right side - Create new task or show task details */}
              {selectedTask ? (
                renderTaskDetails()
              ) : (
                <div className="lg:w-1/2 lg:mt-28 mr-5">
                  <div className="ml-5">
                    <h2 className="text-2xl font-bold">Create New Task</h2>
                    <p
                      className={`text-sm ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      } mt-1`}
                    >
                      Add a new task to this milestone
                    </p>
                  </div>

                  <div
                    className={`p-6  ${darkMode ? "bg-zinc-700" : "bg-white"} `}
                  >
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Task Title
                        </label>
                        <input
                          type="text"
                          value={newTaskTitle}
                          onChange={(e) => setNewTaskTitle(e.target.value)}
                          className={`w-full p-3 rounded-lg border ${
                            darkMode
                              ? "bg-zinc-600 border-zinc-500 text-white"
                              : "bg-white border-gray-300 text-gray-700"
                          }`}
                          placeholder="Enter task title"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Description
                        </label>
                        <textarea
                          value={newTaskDescription}
                          onChange={(e) =>
                            setNewTaskDescription(e.target.value)
                          }
                          rows={3}
                          className={`w-full p-3 rounded-lg border ${
                            darkMode
                              ? "bg-zinc-600 border-zinc-500 text-white"
                              : "bg-white border-gray-300 text-gray-700"
                          }`}
                          placeholder="Describe the task"
                        />
                      </div>
                      <button
                        onClick={handleCreateTask}
                        disabled={!newTaskTitle.trim()}
                        className={`w-fit py-2 px-4 rounded-lg flex items-center justify-end ${
                          darkMode
                            ? "bg-zinc-700 hover:bg-zinc-500 text-white "
                            : "bg-blue-900 hover:bg-blue-800 text-white "
                        }`}
                      >
                        Create Task
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          {renderSuccessModal()}
          {renderAccomplishmentModal()}
        </>
      )}
    </div>
  );
};

export default DelegatedMile;
