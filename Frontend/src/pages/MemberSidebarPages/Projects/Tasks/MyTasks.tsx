import { Card, CardContent } from "@/components/ui/card";
import { Dialog } from "@headlessui/react";
import { MessageSquare, Paperclip, Plus, Trash2,  X } from "lucide-react";
import { useMemo, useState } from "react";
import DataTable from "react-data-table-component";
import { ToastContainer, toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import CreateTaskModal from "@/components/CreateTaskModal";
import TaskDetailView from "@/components/TaskDetailView";

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
  title: string;
  priority: 'High' | 'Medium' | 'Low' | 'Urgent';
  description: string;
  assignee: string;
  status?: 'To Do' | 'In Progress' | 'Done';
  dueDate?: string;
  project: string;
  key: string;
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
  deleted?: boolean;
};

type FileAttachment = {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  lastModified?: number;
}

type ChatMessage = {
  id: string;
  sender: string;
  message: string;
  timestamp: Date;
  senderId: string;
  attachments?: FileAttachment[];
};

type Project = {
  id: string;
  name: string;
  members: string[];
  chat?: ChatMessage[];
};

type Member = {
  id: number;
  name: string;
  role: string;
  projectId: string[];
}

const initialTasks: Task[] = [
  {
    id: "1",
    key: "PM-1",
    title: "user management",
    priority: "High",
    assignee: "Kalkidan",
    status: "In Progress",
    description: "login, registration, and edit profile",
    project: "1",
    progress: 30,
    weight: 7,
    lastUpdated: "2025-04-14 10:30 AM",
    subtask: [
      {
        id: "1-1",
        key: "PMUM-1-1",
        title: "Login",
        description: "user login using react",
        priority: "High",
        assignee: "Kalkidan",
        status: "In Progress",
        progress: 50,
      },
    ],
  },
  {
    id: "2",
    key: "PM-2",
    title: "Registration",
    priority: "Low",
    assignee: "Mahlet",
    status: "Done",
    description: "login, registration, and edit profile",
    project: "2",
    weight: 4,
    progress: 100,
    subtask: [
      {
        id: "2-1",
        key: "PM-2-1",
        title: "user register",
        description: "user login using react",
        priority: "High",
        assignee: "Mahlet",
        status: "Done",
        progress: 100,
      },
    ],
  },
  {
    id: "3",
    key: "PM-3",
    title: "Mobile App Design",
    priority: "Medium",
    assignee: "Dehine",
    status: "In Progress",
    description: "Design mobile app UI",
    project: "2",
    weight: 6,
    subtask: [],
    progress: 50,
  },
  {
    id: "4",
    key: "PM-4",
    title: "Frontend Development",
    priority: "Medium",
    assignee: "Mahlet",
    status: "To Do",
    description: "Build the frontend of profile view",
    project: "1",
    subtask: [],
    weight: 3,
    progress: 0,
  }
];


const projects: Project[] = [
  {
    id: "1", name: "Project Management", members: ["Kalkidan", "Mahlet"],
    chat: [
      {
        id: "1",
        sender: "You",
        message: "Hi team, it is urgent project so lets make it quick!",
        timestamp: new Date(Date.now() - 86400000),
        senderId: "You"
      },
      {
        id: "2",
        sender: "Kalkidan",
        message: "Sure, we will do it! ",
        timestamp: new Date(Date.now() - 43200000),
        senderId: "kalkidan",
      },
      {
        id: "3",
        sender: "Mahlet",
        message: "Good luck everyone! ",
        timestamp: new Date(Date.now() - 43200000),
        senderId: "mahlet",
      },
    ]
  },
  { id: "2", name: "Mobile App Development", members: ["Dehine", "Mahlet"] },
];

const allMembers: Member[] = [
  { id: 1, name: "Kalkidan", role: "Frontend Developer", projectId: ["1"] },
  { id: 2, name: "Mahlet", role: "Frontend Developer", projectId: ["1", "2"] },
  { id: 3, name: "Dehine", role: "Backend Developer", projectId: ["2"] },
];

interface TasksProps {
  darkMode: boolean;
  initialProjectId?: string;
  onClose?: () => void;
  modalOnly?: boolean;
}

const MyTasks = ({ darkMode, initialProjectId }: TasksProps) => {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");
  const [selectedSubTask, setSelectedSubTask] = useState<SubTask | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [assignees, setAssignees] = useState<{ id: string, name: string }[]>(
    allMembers.map(member => ({
      id: member.id.toString(),
      name: member.name
    }))
  );
  const [selectedProjectId, setSelectedProjectId] = useState<string>(initialProjectId || "");
  const [newComment, setNewComment] = useState("");
  const [showRightPanel, setShowRightPanel] = useState(false);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [showTableView, setShowTableView] = useState(true);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [newAssignee, setNewAssignee] = useState("");
  const [editModal, setEditModal] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [newChatMessage, setNewChatMessage] = useState("");
  const [activeProjectChat, setActiveProjectChat] = useState<Project | null>(null);
  const [currentUser] = useState("You");
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [filename, setFileName] = useState("");
  const [selectedAttachment, setSelectedAttachment] = useState<FileAttachment | null>(null);
  const [searchText, setSearchText] = useState("");
  const [showDeleted, setShowDeleted] = useState(false);
  const [searchFilters, setSearchFilters] = useState({
    status: "",
    priority: "",
    assignee: ""
  });

  const selectedTask = tasks.find((task) => task.id === selectedTaskId);
  
  
  const filterTasks = tasks.filter((task) => {
    const matchesProject = !selectedProjectId || task.project === selectedProjectId;
    const matchesMember = !selectedMember || task.assignee === selectedMember;
    return matchesProject && matchesMember;
  });

  const projectMembers = selectedProjectId ?
    allMembers.filter(member => member.projectId.includes(selectedProjectId)) : allMembers;

  const filteredTasks = useMemo(() => {
    let result = filterTasks.filter(task => 
      showDeleted ? task.deleted :!task.deleted);


    if (searchText) {
      const searchLower = searchText.toLowerCase();
      result = result.filter(task => 
        task.title.toLowerCase().includes(searchLower) ||
        task.description.toLowerCase().includes(searchLower) ||
        task.key.toLowerCase().includes(searchLower) ||
        task.assignee.toLowerCase().includes(searchLower) ||
        (projects.find(p => p.id === task.project)?.name.toLowerCase().includes(searchLower)
      ));
    }

    if (searchFilters.status) {
      result = result.filter(task => task.status === searchFilters.status);
    }
    if (searchFilters.priority) {
      result = result.filter(task => task.priority === searchFilters.priority);
    }
    if (searchFilters.assignee) {
      result = result.filter(task => task.assignee === searchFilters.assignee);
    }

    return result;
  }, [filterTasks, searchText, searchFilters, showDeleted]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleCreate = (newTask: Task) => {
    setTasks((prev) => [...prev, newTask]);
    setShowModal(false);
    toast.success("Task created successfully!", {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      theme: darkMode ? "dark" : "light",
    });
    setFile(null);
    setFileName("");
  };

  const addAssignee = (name: string) => {
    if (name && !assignees.some(a => a.name === name)) {
      setAssignees([...assignees, { id: Date.now().toString(), name }]);
    }
  };

  const handleReassign = () => {
    if (!selectedTask) return;

    setTasks(tasks.map(task => {
      if (task.id === selectedTaskId) {
        const updatedTask = { ...task, assignee: newAssignee };

        if (selectedTask) {
          updatedTask.subtask = task.subtask.map(subtask => {
            if (subtask.assignee === selectedTask.assignee) {
              return { ...subtask, assignee: newAssignee };
            }
            return subtask;
          });
        }
        return updatedTask;
      }
      return task;
    }));

    setShowReassignModal(false);
    toast.success("Task reassigned successfully!", {
      position: "top-right",
      autoClose: 2000,
      theme: darkMode ? "dark" : "light",
    });
  };

  const handleSubtaskClick = (subtask: SubTask) => {
    setSelectedSubTask(subtask);
    setShowRightPanel(true);
  };

  const handleProjectChange = (projectId: string) => {
    setSelectedProjectId(projectId);
    setSelectedMember(null);

    if (projectId && selectedTask && selectedTask.project !== projectId) {
      setSelectedTaskId("");
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFileToUpload(e.target.files[0]);
    }
  };

  const handleSendTeamMessage = async () => {
    if (!(newChatMessage.trim() || fileToUpload) || !activeProjectChat) return;

    let attachments: FileAttachment[] = [];
    if (fileToUpload) {
      setIsUploading(true);
      try {
        for (let progress = 0; progress <= 100; progress += 10) {
          await new Promise(resolve => setTimeout(resolve, 100));
          setUploadProgress(progress);
        }

        attachments = [{
          id: Date.now().toString(),
          name: fileToUpload.name,
          size: fileToUpload.size,
          type: fileToUpload.type,
          url: URL.createObjectURL(fileToUpload)
        }];
      } catch (error) {
        toast.error("Failed to upload file");
        console.error("Upload error:", error);
        return;
      } finally {
        setIsUploading(false);
      }
    }

    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: currentUser,
      senderId: currentUser,
      message: newChatMessage,
      timestamp: new Date(),
      attachments
    };


    // const updatedProjects = projects.map(project => project.id === activeProjectChat.id ? {
    //   ...project,
    //   chat: [...(project.chat || []), newMsg]
    // } : project
    // );

    setActiveProjectChat({
      ...activeProjectChat,
      chat: [...(activeProjectChat.chat || []), newMsg]
    });

    setNewChatMessage('');
    setFileToUpload(null);
    setUploadProgress(0);
  };


  const handleDeleteAttachment = (taskId: string) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, attachment: undefined } : task
    ));
    toast.success("Attachment deleted", {
      position: "top-right",
      autoClose: 3000,
      theme: darkMode ? "dark": "light",
    });
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setTasks(tasks.map(task => task.id === selectedTaskId ? {...task, attachment: {
        name: selectedFile.name,
        size: selectedFile.size,
        type: selectedFile.type,
        url: URL.createObjectURL(selectedFile),
        lastModified: selectedFile.lastModified,
      }
      }: task));
      toast.success("Attachment added successfuly!", {
        position: "top-right",
        autoClose: 3000,
        theme: darkMode ? "dark" : "light",
      });
    }
  }; 

  // const handleCreateFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   if (e.target.files && e.target.files[0]) {
  //     const selectedFile = e.target.files[0];
  //     setFile(selectedFile);
  //     setFileName(selectedFile.name);
  //     toast.success("File selected successfully!", {
  //       position: "top-right",
  //       autoClose: 3000,
  //       theme: darkMode ? "dark" : "light",
  //     });
  //   }
  // };

  // const handleRemoveFile = () => {
  //   setFile(null);
  //   setFileName("");
  // };

  const handleSoftDelete = (taskId: string) => {
    if (window.confirm("MOve this task to trash? You can restore it later.")) {
       setTasks(tasks.map(task => 
        task.id === taskId ? { ...task, deleted: true } : task
       ));

       toast.success("Task moved to trash", {
        position: "top-right",
        autoClose: 3000,
        theme: darkMode ? "dark" : "light",
      });
    }  
  };

  const handleRestoreTask = (taskId: string) => {
    if (window.confirm("Restore this task?")) {
      setTasks(tasks.map(task => 
        task.id === taskId ? { ...task, deleted: false } : task
      ));

      toast.success("Task restored", {
        position: "top-right",
        autoClose: 3000,
        theme: darkMode ? "dark" : "light",
      });
    }    
  };


  const columns = [
    {
      name: 'Key',
      selector: (row: Task) => row.key,
      sortable: true,
      width: '100px'
    },
    {
      name: 'Title',
      selector: (row: Task) => row.title,
      sortable: true,
      cell: (row: Task) => (
        <div className="min-w-[200px]">
          <div className="font-medium">{row.title}</div>
          <div className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"} truncate`}>
            {row.description}
          </div>
        </div>
      ),
      grow: 2
    },
    {
      name: 'Priority',
      selector: (row: Task) => row.priority,
      sortable: true,
      cell: (row: Task) => (
        <span className={`text-xs px-2 py-1 rounded-full ${
          row.priority === 'High' || row.priority === 'Urgent' 
            ? (darkMode ? "bg-red-900 text-red-300" : "bg-red-100 text-red-800") 
            : row.priority === 'Medium' 
              ? (darkMode ? "bg-yellow-900 text-yellow-300" : "bg-yellow-100 text-yellow-800") 
              : (darkMode ? "bg-green-900 text-green-300" : "bg-green-100 text-green-800")
        }`}>
          {row.priority}
        </span>
      ),
      width: '120px'
    },
    {
      name: 'Assignee',
      selector: (row: Task) => row.assignee,
      sortable: true,
      width: '150px'
    },
    // {
    //   name: 'Status',
    //   selector: (row: Task) => row.status,
    //   sortable: true,
    //   cell: (row: Task) => (
    //     <span className={`px-2 py-1 text-xs rounded-full ${
    //       row.status === 'Done' 
    //         ? (darkMode ? "bg-green-900 text-green-300" : "bg-green-100 text-green-800")
    //         : row.status === 'In Progress' 
    //           ? (darkMode ? "bg-yellow-900 text-yellow-300" : "bg-yellow-100 text-yellow-800")
    //           : (darkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-800")
    //     }`}>
    //       {row.status}
    //     </span>
    //   ),
    //   width: '120px'
    // },
    {
      name: 'Project',
      selector: (row: Task) => projects.find(p => p.id === row.project)?.name || row.project,
      sortable: true,
      width: '150px'
    },
    {
      name: 'Progress',
      selector: (row: Task) => row.progress,
      sortable: true,
      cell: (row: Task) => (
        <div className="flex items-center">
          <div className={`w-20 h-2 rounded-full ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}>
            <div 
              className={`h-full rounded-full ${
                row.progress < 30 ? "bg-red-500" :
                row.progress < 70 ? "bg-yellow-500" : "bg-green-500"
              }`}
              style={{ width: `${row.progress}%` }}
            ></div>
          </div>
          <span className="ml-2 text-sm">{row.progress}%</span>
        </div>
      ),
      width: '150px'
    },
    {
      name: 'Actions',
      cell: (row: Task) => (
        <div className="flex space-x-2">
          {!row.deleted ? (
            <button onClick={(e) => {
                             e.stopPropagation();
                             handleSoftDelete(row.id);
                    }}
                    className={`text-xs px-2 py-1 rounded ${darkMode ? "bg-red-900 hover:bg-red-800 text-red-300" 
                                 : "bg-red-100 hover:bg-red-200 text-red-800"}`}>
                <Trash2 size={16}/>
            </button>
          ): (
            <>
             <button onClick={(e) => {
                        e.stopPropagation();
                        handleRestoreTask(row.id);
                    }}
                    className={`text-xs px-2 py-1 rounded ${darkMode ? "bg-green-900 hover:bg-green-800 text-green-300" 
                                 : "bg-green-100 hover:bg-green-200 text-green-800"}`}>
                Restore
             </button>
             
            </>
          )}
          
        </div>
      ),
      width: '120px',
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
    },
  ];


  const customStyles = {
    headRow: {
      style: {
        backgroundColor: darkMode ? '#27272a' : '#e5e7eb',
        color: darkMode ? '#f3f4f6' : '#111827',
        fontWeight: 'bold',
        fontSize: '0.75rem',
        textTransform: 'uppercase',
        minHeight: '48px',
      },
    },
    headCells: {
      style: {
        paddingLeft: '8px',
        paddingRight: '8px',
      },
    },
    cells: {
      style: {
        paddingLeft: '8px',
        paddingRight: '8px',
        color: darkMode ? '#e5e7eb' : '#111827',
      },
    },
    rows: {
      style: {
        minHeight: '72px', 
        backgroundColor: (row: any) => 
        row.deleted 
          ? (darkMode ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)')
          : (darkMode ? '#1e1e1e' : '#ffffff'),
      '&:hover': {
        backgroundColor: (row: any) => 
          row.deleted 
            ? (darkMode ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)')
            : (darkMode ? '#2d2d2d' : '#f5f5f5'),
      },
        '&:not(:last-of-type)': {
          borderBottomColor: darkMode ? '#3f3f46' : '#e5e7eb',
        },
      },
    },
    pagination: {
      style: {
        backgroundColor: darkMode ? '#1e1e1e' : '#ffffff',
        borderTopColor: darkMode ? '#3f3f46' : '#e5e7eb',
        color: darkMode ? '#e5e7eb' : '#111827',
      },
    },
  };

 
  return (
    <div className={` ${darkMode ? "bg-zinc-800 text-gray-100" : "bg-white text-gray-800"}`}>
      <ToastContainer />
      <CreateTaskModal
          open={showModal}
          onClose={() => setShowModal(false)}
          initialProjectId={selectedProjectId}
          projects={projects}
          allMembers={allMembers}
          darkMode={darkMode}
          onCreate={handleCreate}
        />
      
      {!selectedTaskId && (
        <div className="">
           <button 
              className={`flex items-center p-2 px-4 ml-auto rounded-lg ${darkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-200 hover:bg-gray-300"}`}
              onClick={() => setShowModal(true)}
             >
              <Plus size={16} className="mr-2" /> Create
            </button>
          </div>
      )}
      <div className="flex ">
        {/* Left sidebar - Members */}
        {!selectedTaskId && (
        <>
         
         <div className={`w-1/3 border border-double rounded-lg  p-4 ${darkMode ? "bg-zinc-800 border-gray-600" : "bg-gray-50 border-gray-300"}`}>
          <h2 className="text-2xl font-bold mb-6">Members</h2>

          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">Project</h2>
            <div className="flex items-center mb-4">
              <select
                value={selectedProjectId}
                onChange={(e) => handleProjectChange(e.target.value)}
                className={`w-full p-2 rounded-md ${darkMode ? "bg-gray-600 text-white" : "bg-gray-100"} border ${darkMode ? "border-gray-700" : "border-gray-300"}`}
              >
                <option value="">All Projects</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedProjectId && (
              <button 
                onClick={() => {
                  const project = projects.find(p => p.id === selectedProjectId);
                  if (project) setActiveProjectChat(project);
                }}
                className={`ml-2 px-4 py-2 rounded-md flex items-center ${darkMode ? "bg-purple-600 hover:bg-purple-500 text-white" : "bg-purple-100 hover:bg-purple-200 text-purple-800"}`}
              >
                <MessageSquare size={16} className="mr-2" /> Team Chat
              </button>
            )}
          </div>

          <div className="space-y-2">
            <h3 className={`font-semibold ${darkMode ? "text-gray-300" : "text-gray-500"}`}>
              {selectedProjectId ? "Project Members" : "All Members"}
            </h3>


            {projectMembers.length > 0 ? (
              projectMembers.map(member => (
                <div
                  key={`${member.projectId}-${member.id}`}
                  onClick={() => setSelectedMember(member.name)}
                  className={`p-3 rounded-md border cursor-pointer ${
                    selectedMember === member.name
                      ? (darkMode ? "bg-purple-400" : "bg-purple-300")
                      : (darkMode ? "bg-zinc-700 hover:bg-zinc-600" : "bg-white hover:bg-gray-100")
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{member.name}</h4>
                      <span className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-500"}`}>
                        {member.role}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className={`p-3 text-center ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                No members found{selectedProjectId ? " for this project" : ""}
              </div>
            )}
          </div>
         </div>
         </>
        )}
        {/* Main content area */}
        <div className={`flex-1 p-4 ${darkMode ? "" : ""}`}>
        
          {showTableView ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
               <h2 className="text-2xl font-bold mb-4">
                {selectedProjectId
                  ? `Tasks in ${projects.find(p => p.id === selectedProjectId)?.name || 'Project'}`
                  : 'All Tasks'}
                {selectedMember && ` (Assigned to ${selectedMember})`}
               </h2>
               <button onClick={()=> setShowDeleted(!showDeleted)}
                className={`ml- px-3 py-1 rounded ${darkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-200 hover:bg-gray-300"}`}>
                   {showDeleted ? "Hide Deleted" : "Show Deleted"}
               </button>
              </div>


              {/* Enhanced DataTable with search and filters */}
              {filterTasks.length > 0 ? (
                <Card className={`mb-8 ${darkMode ? "bg-zinc-800" : "bg-white"}`}>
                  <CardContent className="p-0">
                    <div className={`p-4 border-b ${darkMode ? "border-zinc-700" : "border-gray-200"}`}>
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <h2 className="text-lg font-semibold">Tasks</h2>
                        
                        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                          <div className="relative flex-1">
                            <input
                              type="text"
                              placeholder="Search tasks..."
                              value={searchText}
                              onChange={(e) => setSearchText(e.target.value)}
                              className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                                darkMode 
                                  ? "bg-zinc-700 border-zinc-600 text-white placeholder-gray-400 focus:border-blue-500" 
                                  : "bg-white border-gray-300 text-gray-800 placeholder-gray-500 focus:border-blue-400"
                              } focus:outline-none focus:ring-2 ${
                                darkMode ? "focus:ring-blue-600" : "focus:ring-blue-300"
                              }`}
                            />
                            <div className={`absolute left-3 top-2.5 ${
                              darkMode ? "text-gray-400" : "text-gray-500"
                            }`}>
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
                              onChange={(e) => setSearchFilters({...searchFilters, status: e.target.value})}
                              className={`p-2 rounded-md border ${
                                darkMode ? "bg-zinc-700 border-zinc-600" : "bg-white border-gray-300"
                              }`}
                            >
                              <option value="">All Statuses</option>
                              <option value="To Do">To Do</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Done">Done</option>
                            </select>
                            
                            <select
                              value={searchFilters.priority}
                              onChange={(e) => setSearchFilters({...searchFilters, priority: e.target.value})}
                              className={`p-2 rounded-md border ${
                                darkMode ? "bg-zinc-700 border-zinc-600" : "bg-white border-gray-300"
                              }`}
                            >
                              <option value="">All Priorities</option>
                              <option value="Low">Low</option>
                              <option value="Medium">Medium</option>
                              <option value="High">High</option>

                              <option value="Urgent">Urgent</option>
                            </select>
                            
                            <select
                              value={searchFilters.assignee}
                              onChange={(e) => setSearchFilters({...searchFilters, assignee: e.target.value})}
                              className={`p-2 rounded-md border ${
                                darkMode ? "bg-zinc-700 border-zinc-600" : "bg-white border-gray-300"
                              }`}
                            >
                              <option value="">All Assignees</option>
                              {Array.from(new Set(tasks.map(t => t.assignee))).map(assignee => (
                                <option key={assignee} value={assignee}>{assignee}</option>
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
                      onRowClicked={(row) => {
                        setSelectedTaskId(row.id);
                        setShowTableView(false);
                      }}
                      highlightOnHover
                      pointerOnHover
                      pagination
                      paginationPerPage={10}
                      paginationRowsPerPageOptions={[5, 10, 15, 20]}
                      theme={darkMode ? "dark" : "light"}
                      noDataComponent={
                        <div className={`p-8 text-center ${
                          darkMode ? "text-gray-400" : "text-gray-600"
                        }`}>
                          {searchText || Object.values(searchFilters).some(Boolean) 
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
              ) : (
                 <div className="flex items-center justify-center h-64">
                  <p>No tasks found</p>
                 </div>
                )}
              </div>
          ) : (
               selectedTask && (
                <TaskDetailView
                  task={selectedTask}
                  darkMode={darkMode}
                  projectName={projects.find(p => p.id === selectedTask.project)?.name}
                  onBack={() => {
                    setShowTableView(true);
                    setSelectedTaskId("");
                  }}
                  onEdit={() => {
                    setEditModal(true);
                    setTaskToEdit(selectedTask);
                  }}
                  onReassign={() => {
                    setNewAssignee(selectedTask.assignee || "");
                    setShowReassignModal(true);
                  }}
                  onFileChange={handleFileChange}
                  onDeleteAttachment={handleDeleteAttachment}
                  onSubtaskClick={handleSubtaskClick}
                  formatFileSize={formatFileSize}
                  setSelectedAttachment={setSelectedAttachment}
                  newComment={newComment}
                  setNewComment={setNewComment}
                  showRightPanel={showRightPanel}
                  selectedSubTask={selectedSubTask}
                  onCloseRightPanel={() => setShowRightPanel(false)}
                  parentTask={selectedTask}
                />
              )
             )
            }  
         {/* Reassign Modal */}
        <Dialog open={showReassignModal} onClose={() => setShowReassignModal(false)}
          className={`fixed inset-0 z-50 overflow-y-auto`}>
          <div className={`flex items-center justify-center min-h-screen bg-black bg-opacity-50`}>
            <Dialog.Panel className={`p-6 rounded-lg w-96 ${
              darkMode 
                ? "bg-zinc-800 text-gray-300" 
                : "bg-white text-gray-700"
            }`}>
              <Dialog.Title className={`text-lg font-bold mb-4`}>Reassign Task</Dialog.Title>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Current Assignee</label>
                <input 
                  type="text"
                  value={selectedTask?.assignee || "Unassigned"}
                  readOnly
                  className={`w-full p-2 rounded-md border-spacing-5 ${
                    darkMode 
                      ? "bg-zinc-700 text-gray-300 border-gray-600"
                      : "bg-gray-100 text-gray-700 border-gray-300"
                  }`} 
                />
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium mb-1">New Assignee</label>
                <select 
                  value={newAssignee}
                  onChange={(e) => setNewAssignee(e.target.value)}
                  className={`w-full p-2 rounded-md border-spacing-5 ${
                    darkMode 
                      ? "bg-zinc-700 text-gray-300 border-gray-600"
                      : "bg-gray-100 text-gray-700 border-gray-300"
                  }`}
                >
                  <option value="">Unassigned</option>
                  {assignees.map((member) => (
                    <option key={member.id} value={member.name}>
                      {member.name}
                    </option>
                  ))}
                </select>
                
                <input
                  type="text"
                  placeholder="Search by Employee ID"
                  id="newAssignee"
                  list="employeeList"
                  className={`flex-1 mt-6 ml-12 p-2 border rounded ${
                    darkMode 
                      ? "bg-zinc-700 border-zinc-600" 
                      : ""
                  }`}
                  onChange={(e) => {
                    const input = e.target as HTMLInputElement;
                    const member = allMembers.find(m => m.id.toString() === input.value);
                    if (member) {
                      const select = document.querySelector('select[name="assignee"]') as HTMLSelectElement;
                      if (select) select.value = member.name;
                    }
                  }}
                />
      
                <datalist id="employeeList">
                  {allMembers.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name} ({member.role})
                    </option>
                  ))}
                </datalist>
                
                <button
                  type="button"
                  onClick={() => {
                    const input = document.getElementById('newAssignee') as HTMLInputElement;
                    if (input.value) {              
                      const member = allMembers.find(m => m.id.toString() === input.value);
                      if (member) {

                        addAssignee(member.id.toString());                        
                        const select = document.querySelector('select[name="assignee"]') as HTMLSelectElement;
                        if (select) select.value = member.name;
                        input.value = '';
                      } else {
                        toast.error("Invalid Employee ID");
                      }
                    }
                  }}
                  className={`ml-2 px-3 py-2 rounded ${
                    darkMode 
                      ? "bg-fuchsia-600 hover:bg-fuchsia-700" 
                      : "bg-fuchsia-700 hover:bg-fuchsia-600"
                  } text-white`}
                >
                  Add
                </button>
              </div>
              
              <div className="flex justify-end gap-2">
                <button 
                  type="button" 
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
                  type="button" 
                  onClick={handleReassign} 
                  disabled={!newAssignee}
                  className={`px-4 py-2 rounded text-white ${
                    darkMode 
                      ? "bg-fuchsia-600 hover:bg-fuchsia-700 disabled:bg-gray-500"
                      : "bg-fuchsia-700 hover:bg-fuchsia-600 disabled:bg-gray-200 disabled:text-gray-700"
                  }`}
                >
                  Confirm
                </button>
              </div>
            </Dialog.Panel>
          </div>
        </Dialog>

        {/* Edit Task Modal */}
        <Dialog open={editModal} onClose={() => setEditModal(false)}
          className={`fixed inset-0 z-50 overflow-y-auto`}>
          <div className={`flex items-center justify-center min-h-screen bg-black bg-opacity-50`}>
            <Dialog.Panel className={`p-6 rounded-lg w-96 ${
              darkMode 
                ? "bg-zinc-800 text-gray-300" 
                : "bg-white text-gray-700"
            }`}>
              <Dialog.Title className={`text-lg font-bold mb-4`}>Edit Task</Dialog.Title>

              {taskToEdit && (
                <form onSubmit={(e) => {
                  e.preventDefault();
                  setTasks(tasks.map(t => taskToEdit ? taskToEdit : t));
                  setEditModal(false);
                  toast.success(`Task updated successfully! `, {
                    theme: darkMode ? "dark" : "light"
                  });
                }}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Title</label>
                      <input 
                        type="text"
                        value={taskToEdit.title}
                        onChange={(e) => setTaskToEdit({ ...taskToEdit, title: e.target.value })}
                        className={`w-full p-2 rounded-md border ${
                          darkMode 
                            ? "bg-zinc-700 border-gray-600" 
                            : "bg-white border-gray-300"
                        }`} 
                      />
                    </div>


                    <div>
                      <label className="block text-sm font-medium mb-1">Description</label>
                      <textarea
                        value={taskToEdit.description}
                        onChange={(e) => setTaskToEdit({ ...taskToEdit, description: e.target.value })}
                        rows={3}
                        className={`w-full p-2 rounded-md border ${
                          darkMode 
                            ? "bg-zinc-700 border-gray-600" 
                            : "bg-white border-gray-300"
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Due Date</label>
                      <input 
                        type="date"
                        value={taskToEdit.dueDate}
                        onChange={(e) => setTaskToEdit({ ...taskToEdit, dueDate: e.target.value })}
                        className={`w-full p-2 rounded-md border ${
                          darkMode 
                            ? "bg-zinc-700 border-gray-600" 
                            : "bg-white border-gray-300"
                        }`} 
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Priority</label>
                      <select
                        value={taskToEdit.priority}
                        onChange={(e) => setTaskToEdit({ ...taskToEdit, priority: e.target.value as any })}
                        className={`p-2 rounded-md border ${
                          darkMode 
                            ? "bg-zinc-700 border-gray-600" 
                            : "bg-white border-gray-300"
                        }`}
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                        <option value="Urgent">Urgent</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Weight</label>
                      <input 
                        type="number"
                        value={taskToEdit.weight}
                        onChange={(e) => setTaskToEdit({ ...taskToEdit, weight: e.target.value as any })}
                        className={`w-20 p-2 rounded-md border ${
                          darkMode 
                            ? "bg-zinc-700 border-zinc-600" 
                            : "bg-white border-gray-300"
                        }`} 
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
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
                  </div>
                </form>
              )}
            </Dialog.Panel>
          </div>
        </Dialog>


        {/* Chat Dialog */}
        <Dialog open={!!activeProjectChat} onClose={() => setActiveProjectChat(null)}
          className={`fixed inset-0 z-50 overflow-y-auto`}>
          <div className={`flex items-center justify-center min-h-screen bg-black bg-opacity-50`}>
            <Dialog.Panel className={`p-6 rounded-lg w-full max-w-md ${
              darkMode 
                ? "bg-zinc-800 text-gray-300" 
                : "bg-white text-gray-700"
            }`}>
              <Dialog.Title className={`text-lg font-bold mb-4 flex items-center`}>
                <span className="mr-2">Team Chat:</span>
                <span className="text-blue-500">{activeProjectChat?.name} Chat</span>
              </Dialog.Title>

              <div className={`h-96 overflow-y-auto mb-4 space-y-4 p-4 ${
                darkMode 
                  ? "bg-zinc-700 rounded" 
                  : "bg-gray-100 rounded"
              }`}>
                {activeProjectChat?.chat?.length ? (
                  activeProjectChat.chat.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${
                        msg.senderId === currentUser 
                          ? 'justify-end' 
                          : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-xs md:max-w-md rounded-lg px-4 py-2 ${
                          msg.senderId === currentUser
                            ? darkMode
                              ? "bg-blue-600 text-white"
                              : "bg-blue-500 text-white"
                            : darkMode
                              ? "bg-gray-700 text-gray-100"
                              : "bg-gray-200 text-gray-800"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium">
                            {msg.senderId === currentUser ? 'You' : msg.sender}
                          </span>
                          <span className="text-xs opacity-70 ml-2">
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p>{msg.message}</p>

                        {msg.attachments?.map((file) => (
                          <div 
                            key={file.id}
                            className={`mt-2 p-2 rounded ${
                              darkMode 
                                ? "bg-blue-800" 
                                : "bg-blue-100"
                            }`}
                          >
                            <div className="flex items-center">
                              <Paperclip size={16} className="mr-2" />
                              <a
                                href={file.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm hover:underline"
                              >
                                {file.name}
                              </a>
                            </div>
                            <div className="text-xs mt-1">
                              {formatFileSize(file.size)} • {file.type}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    No messages yet. Start the conversation!
                  </div>
                )}
              </div>


              {fileToUpload && (
                <div className={`mb-2 p-3 rounded ${
                  darkMode 
                    ? "bg-zinc-700" 
                    : "bg-gray-200"
                }`}>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <Paperclip size={16} className="mr-2" />
                      <span className="truncate max-w-xs">{fileToUpload.name}</span>
                    </div>
                    <button
                      onClick={() => setFileToUpload(null)}
                      className="text-red-500 hover:text-red-700 ml-2"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {isUploading && (
                    <div className={`w-full h-1 mt-2 rounded-full ${
                      darkMode 
                        ? "bg-zinc-600" 
                        : "bg-gray-300"
                    }`}>
                      <div
                        className={`h-full rounded-full ${
                          darkMode 
                            ? "bg-blue-400" 
                            : "bg-blue-500"
                        }`}
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <label className={`p-2 rounded-md cursor-pointer ${darkMode ? "hover:bg-zinc-600" : "hover:bg-gray-300"}`}>
                  <input
                    type="file"
                    onChange={handleFileSelect}
                    className="hidden" 
                  />
                  <Paperclip size={20} />
                </label>
                
                <input
                  type="text"
                  value={newChatMessage}
                  onChange={(e) => setNewChatMessage(e.target.value)}
                  placeholder="Type your message..."
                  className={`flex-1 p-2 rounded-md border ${darkMode ? "bg-zinc-700 border-zinc-600 text-white" : "bg-white border-gray-300"}`}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && newChatMessage.trim() && activeProjectChat) {
                      handleSendTeamMessage();
                    }
                  }}
                />
                
                <button
                  onClick={handleSendTeamMessage}
                  className={`px-4 py-2 rounded-md text-white ${darkMode ? "bg-blue-600 hover:bg-blue-500" : "bg-blue-500 hover:bg-blue-400"}`}
                  disabled={!newChatMessage.trim()}
                >
                  Send
                </button>
              </div>
            </Dialog.Panel>
          </div>
        </Dialog>


        {/* Attachment Details Modal */}
        <Dialog open={!!selectedAttachment} onClose={() => setSelectedAttachment(null)}>
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Dialog.Panel className={`w-full max-w-md rounded-lg p-6 ${darkMode ? "bg-zinc-800" : "bg-white"}`}>
              {selectedAttachment && (
                <>
                  <div className="flex justify-between items-start mb-4">
                    <Dialog.Title className="text-xl font-bold">
                      Attachment Details
                    </Dialog.Title>
                    <button 
                      onClick={() => setSelectedAttachment(null)}
                      className={`p-1 rounded-full ${
                        darkMode 
                          ? "hover:bg-zinc-700" 
                          : "hover:bg-gray-100"
                      }`}
                    >
                      <X size={20} />
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <Paperclip className="h-6 w-6 mr-3" />
                      <div>
                        <p className="font-medium">{selectedAttachment.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {formatFileSize(selectedAttachment.size)} • {selectedAttachment.type}
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Type</p>
                        <p>{selectedAttachment.type}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Size</p>
                        <p>{formatFileSize(selectedAttachment.size)}</p>
                      </div>
                    </div>
                    
                    <div className="flex justify-end space-x-3 pt-4">
                      <a
                        href={selectedAttachment.url}
                        download={selectedAttachment.name}
                        className={`px-4 py-2 rounded-md ${darkMode ? "bg-blue-600 hover:bg-blue-500" : "bg-blue-500 hover:bg-blue-400"} text-white`}>
                        Download
                      </a>
                      <a
                        href={selectedAttachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`px-4 py-2 rounded-md ${darkMode ? "bg-gray-600 hover:bg-gray-500" : "bg-gray-200 hover:bg-gray-300" }`} >
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
      </div>
    </div>
  );
 
};

export default MyTasks;
