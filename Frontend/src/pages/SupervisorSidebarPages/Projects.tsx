import { CalendarIcon, Paperclip, UserIcon } from "lucide-react";
import { useEffect,  useMemo,  useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast, ToastContainer } from "react-toastify";
import { useNotifications } from "@/components/NotificationContext";
import DataTable from 'react-data-table-component';
import CreateTaskModal from "@/components/CreateTaskModal";


interface ProjectFile {
  name: string;
  size: number;
  type: string;
  url: string;
}



interface Project{
  id:number;
  title: string;
  description: string;
  dueDate: string;
  assignedBy: string;
  assignedTo: string;
  priority: 'High' | 'Medium' | 'Low' | 'Urgent';
  status: 'To Do' | 'In Progress' | 'Done' | 'Rejected';
  progress: number;
  rejectionReason?: string;
  isTerminated?: boolean;
  files?: ProjectFile[];
}


const Projects = ({darkMode}:{darkMode:boolean}) => {
 
  const [projects, setProjects]= useState<Project[]>([]);
  const [selectedProject, setSelectedProject]= useState<Project| null>(null);
  const [loading, setLoading]= useState(true);
  const [newProjectNotification, setNewProjectNotification] = useState(false);
  const [newProject, setNewProject]= useState<Project[]>([]);
  const { addNotification }= useNotifications();
  const [rejectionDialog, setRejectionDialog]=useState(false);
  const [projectToReject, setProjectToReject] = useState<Project | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showTerminated, setShowTerminated]= useState(false);
  const [previewFile, setPreviewFile] = useState<ProjectFile | null> (null);
  const [searchText, setSearchText] = useState("");
  const [tasks, setTasks]= useState<{[projectId: number]: any[]}>({});
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [showTaskModal, setShowTaskModal] = useState(false);
  const allMembers = [
    { id: 1, name: "Kalkidan", role: "Developer", projectId: [1, 2] },
    { id: 2, name: "Mahlet", role: "Designer", projectId: [1] },
    { id: 3, name: "Dehine", role: "QA", projectId: [1, 2] },
  ];

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024*1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word')) return '📝';
    if (fileType.includes('excel')) return '📊';
    if (fileType.includes('image')) return '🖼';
    return '📁';
  };
  

  const assignNewProject = () => {
    const newProject: Project = {
      id: Math.floor(Math.random() * 1000),
      title: `New Project ${Math.floor(Math.random() * 100)}`,
      description: "Newly assigned project",
      dueDate:"2025-07-15",
      priority:"Urgent",
      status: "To Do",
      progress: 0,
      assignedBy: "Genet",
      assignedTo: "",
      files: [
       { name: "Project_File.pdf",
        size: 1024 * 100,
        type: "application/pdf",
        url: "https://freetestdata.com/wp-content/uploads/2021/09/Free_Test_Data_100KB_PDF.pdf"
      },
      
      ]
    };

    setNewProject(prev => [...prev, newProject]);
    
    addNotification({
      type: 'project',
      title: 'New Project Assigned',
      message:`You've been assigned to "${newProject.title}"`,
      metadata: { projectId: newProject.id}
    });
  };

  const acceptNewProject = (project: Project)=> {
    setProjects(prev => [project, ...prev]);
    setNewProject(prev => prev.filter(p => p.id !==project.id));

    toast.success('Project accepted successfully', {
    position: 'top-right',
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    theme: darkMode ? "dark" : "light",
   });
    
  };
  

  const rejectProject = (project: Project, reason: string) => {
   const rejectedProject = {
    ...project,
    status: 'Rejected',
    isTerminated: true,
    rejectionReason: reason
   };
  
   setProjects(prev => [rejectedProject, ...prev]);
   setNewProject(prev => prev.filter(p => p.id !== project.id));
   setRejectionDialog(false);
   setRejectionReason('');
  
   toast.success('Project rejected successfully', {
    position: 'top-right',
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    theme: darkMode ? "dark" : "light",
   });
};
  
 const activeProjects = projects.filter(project => !project.isTerminated);
 const terminatedProjects =projects.filter(project => project.isTerminated);

  useEffect(()=> {
    const fetchProjects =async () => {
      setLoading(true);
      const data = await new Promise<Project[]>(resolve =>
        setTimeout(() =>
         resolve([
          {
            id: 1,
            title: "Project 1",
            description: "build project management tool",
            dueDate: "2025-06-12",
            assignedBy: "Genet",
            assignedTo: "Team 1",
            priority: "High",
            status: "In Progress",
            progress: 40,
            files: [
              { name: "Project_File.pdf",
                size: 1024 * 100,
                type: "application/pdf",
                url: "https://freetestdata.com/wp-content/uploads/2021/09/Free_Test_Data_100KB_PDF.pdf"
              },
            ],
            


        },
        {
          id: 2,
          title: "Project 2",
          description: "build project management tool",
          dueDate: "2025-06-12",
          assignedBy: "Genet",
          assignedTo: "Team 1",
          priority: "High",
          status: "To Do",
          progress: 0,
          

        },    
       ]),1000)
      );
       setProjects(data);
       setLoading(false);

    };
    fetchProjects();
  }, []);

  const columns = [
    {
      name: 'Project',
      selector: (row: Project) => row.title,
      sortable: true,
      cell: (row: Project) => (
        <div> 
          <div className="font-medium">{row.title}</div>
          <div className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            {row.description}
          </div>
        </div>
      ),
      minWidth: '200px'
    },
    {
      name: 'Assigned To',
      selector: (row: Project) => row.assignedTo,
      sortable: true,
    },
    {
      name: 'Due Date',
      selector: (row: Project) => row.dueDate,
      sortable: true,
    },
    {
      name: 'Status',
      cell: (row: Project) => (
        <span className={`px-2 py-1 text-xs rounded-full ${row.status === 'Done' ? (darkMode ? "bg-green-900 text-green-300" : "bg-green-100 text-green-800"):
                          row.status === 'In Progress' ? (darkMode ? "bg-yellow-900 text-yellow-300" : "bg-yellow-100 text-yellow-800"):
                          (darkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-800")}`}>
             {row.status}
        </span>
      ),
      sortable: true,
    },
    {
      name: 'Progress',
      cell: (row: Project) => (
        <div className="flex items-center">
          <div className={`w-32 h-2 rounded-full ${darkMode ? "bg-gray-700" : "bg-gray-300"}`}>
            <div 
              className={`h-full rounded-full ${
                row.progress < 30 ? "bg-red-500" :
                row.progress < 70 ? "bg-yellow-500" : "bg-green-500"
              }`}
              style={{ width: `${row.progress}%` }}
            ></div>
          </div>
          <span className="ml-2 text-sm">{row.progress}</span>
        </div>
      ),
      sortable: true,
    },
    {
      name: 'Attachment',
      cell: (row: Project) => (
        row.files && row.files.length > 0 ? (
          <div className="flex items-center">
            <Paperclip className="mr-1 h-4 w-4"/>
            <span className="text-sm">


              {row.files.length} file{row.files.length !== 1 ? 's' : ''}
            </span>
          </div>
        ): (
          <span className="text-sm text-gray-500">None</span>
        )
      ),
    },
  ];

  const customStyles = {
    rows: {
      style: {
        minHeight: '72px', // override the row height
        backgroundColor: darkMode ? '#1e1e1e' : '#ffffff',
        '&:hover': {
          backgroundColor: darkMode ? '#2d2d2d' : '#f5f5f5',
        },
      },
    },
    headCells: {
      style: {
        paddingLeft: '8px', // override the cell padding for head cells
        paddingRight: '8px',
        backgroundColor: darkMode ? '#27272a' : '#e5e7eb',
        color: darkMode ? '#f3f4f6' : '#111827',
        fontWeight: 'bold',
        fontSize: '0.75rem',
        textTransform: 'uppercase',
      },
    },
    cells: {
      style: {
        paddingLeft: '8px', // override the cell padding for data cells
        paddingRight: '8px',
        color: darkMode ? '#e5e7eb' : '#111827',
      },
    },
  };

  const filteredProjects = useMemo(()=> {
    if(!searchText) return activeProjects;
    return activeProjects.filter(project => {
      const searchLower = searchText.toLowerCase();
       return (
        project.title.toLowerCase().includes(searchLower) ||
        project.description.toLowerCase().includes(searchLower) ||
        project.assignedTo.toLowerCase().includes(searchLower) ||
        project.dueDate.toLowerCase().includes(searchLower) ||
        project.status.toLowerCase().includes(searchLower) ||
        project.priority.toLowerCase().includes(searchLower)
      );
    });
  }, [activeProjects, searchText])

  
  return (
    <div className={`p-4 overflow-y-auto ${darkMode ? "bg-zinc-800 text-gray-100" : "bg-white text-gray-800"}`}>
      <ToastContainer /> 

      {selectedProject ? (
        <div className="min-h-screen flex justify-center items-start py-12 px-4 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-900">
          <div className={`w-full max-w-3xl rounded-2xl shadow-xl p-8 ${darkMode ? "bg-zinc-800 text-white" : "bg-white text-gray-900"}`}>
            <div className="flex items-center justify-between mb-8">
              <button
                onClick={() => setSelectedProject(null)}
                className={`px-4 py-2 rounded-lg font-semibold transition ${darkMode ? "bg-gray-700 text-white hover:bg-blue-700"
                    : "bg-gray-200 text-gray-800 hover:bg-gray-300 "}`}>
                ← Back to Projects
              </button>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${selectedProject.status === "Done"
                   ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                   : selectedProject.status === "In Progress"
                   ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                   : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"}`}>
                {selectedProject.status}
              </span>
            </div>
            <h1 className="text-2xl font-extrabold mb-2">{selectedProject.title}</h1>
            <p className="mb-6  text-gray-600 dark:text-gray-300">{selectedProject.description}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <div className="mb-2">
                  <span className="font-semibold">Assigned By:</span> {selectedProject.assignedBy}
                </div>
                <div className="mb-2">
                  <span className="font-semibold">Assigned To:</span> {selectedProject.assignedTo}
                </div>
                <div className="mb-2">
                  <span className="font-semibold">Priority:</span>{" "}
                  <span className={`font-bold ${selectedProject.priority === "High" ? "text-red-600"
                          : selectedProject.priority === "Medium" ? "text-yellow-600"

                          : selectedProject.priority === "Low" ? "text-green-600"
                          : "text-gray-600"}`}>
                      {selectedProject.priority}
                  </span>
                </div>
                <div className="mb-2">
                  <span className="font-semibold">Due Date:</span> {selectedProject.dueDate}
                </div>
              </div>
              <div>
                <div className="mb-2">
                  <span className="font-semibold">Progress:</span>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 mt-1">
                    <div className={`h-4 rounded-full ${selectedProject.progress < 30 ? "bg-red-500" : selectedProject.progress < 70
                       ? "bg-yellow-500": "bg-green-500"}`}
                      style={{ width: `${selectedProject.progress}%` }}></div>
                  </div>
                  <span className="ml-2 font-semibold">{selectedProject.progress}%</span>
                </div>
              </div>
            </div>
            {selectedProject.files && selectedProject.files.length > 0 && (
              <div className="mb-8">
                <h3 className="font-semibold mb-2">Attachments</h3>
                <div className="space-y-2">
                  {selectedProject.files.map((file, idx) => (
                    <div key={idx} className="flex items-center p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
                      <span className="mr-2 text-xl">📎</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{file.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{formatFileSize(file.size)}</p>
                      </div>
                      <a
                        href={file.url}
                        download={file.name}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 px-3 py-1 rounded bg-blue-500 text-white text-xs font-semibold hover:bg-blue-600 transition">
                        Download
                      </a>
                    </div>
                  ))}
                </div>
              </div>
          )}
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-semibold">Tasks</h3>
            <button
              onClick={() => {
                setSelectedProjectId(selectedProject.id.toString());
                setShowTaskModal(true);
              }}
              className="px-4 py-2 rounded-lg bg-fuchsia-700 text-white font-semibold hover:bg-fuchsia-800 transition">
              + Add Task
            </button>
            <CreateTaskModal
              open={showTaskModal}
              onClose={() => setShowTaskModal(false)}
              initialProjectId={selectedProjectId}
              projects={projects}
              allMembers={allMembers}
              darkMode={darkMode}
              onCreate={task => {
                setTasks(prev => ({
                  ...prev,
                  [selectedProjectId]: [...(prev[selectedProjectId] || []), task]
                }));
              }}
            />
          </div>
          <ul className="space-y-3">
            {(tasks[selectedProject.id] && tasks[selectedProject.id].length > 0) ? (
              tasks[selectedProject.id].map((task) => (
                <li
                  key={task.id}
                  className={`p-4 rounded-lg border shadow-sm ${darkMode ? "border-gray-700 bg-zinc-900" : "border-gray-200 bg-gray-50"}`}>
                  <div className="font-semibold text-lg">{task.title}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">{task.description}</div>
                </li>
              ))
            ) : (
              <li className="italic text-gray-400">No tasks yet.</li>
            )}
          </ul>
        </div>
      </div>
      ): (
      <div>

         <div className="flex justify-between items-center mb-6">
           <h1 className="text-2xl font-bold">Projects</h1>
           <div className="flex items-center space-x-4">
              <button 
                onClick={()=>{
                  assignNewProject();
                  setNewProjectNotification(true);
                }}
                className={`px-4 py-2 rounded-lg ${darkMode ? "bg-blue-600 hover:bg-blue-700" : "bg-blue-500 hover:bg-blue-600"} text-white`}>
                Simulate New Assignment
              </button>
            </div>
         </div>

       
         {/* New Projects Notification Section */}
         {newProjectNotification && newProject.length > 0 && (
          <div className={`mb-8 p-4 border rounded-lg ${darkMode ? "bg-zinc-800 border-gray-600" : "bg-blue-50 border-gray-300"}`}>
           <h2 className="text-lg font-semibold mb-4">New Project Assignments</h2>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {newProject.map(project => (
              <Card key={project.id} className={`${darkMode ? "bg-gray-800" : "bg-white"} border rounded-lg overflow-hidden shadow-sm`}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg">{project.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{project.description}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${darkMode ? "bg-yellow-900 text-yellow-300" : "bg-yellow-100 text-yellow-800"}`}>
                      New
                    </span>
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center text-sm">
                      <UserIcon size={16} className="mr-2" />
                      <span>Assigned by: {project.assignedBy}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <CalendarIcon size={16} className="mr-2" />
                      <span>Due: {project.dueDate}</span>
                    </div>
                  </div>


                  {project.files && project.files.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium mb-2">Attachments:</h4>
                      <div className="space-y-2">
                        {project.files.map((file, index) => (
                          <div key={index}
                               onClick={()=> setPreviewFile(file)}
                               className={`flex items-center p-2 rounded-md cursor-pointer ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}>
                             <span className="mr-2 "> {getFileIcon(file.type)} </span>
                             <div className="flex-1 min-w-0">
                              <p className="text-sm truncate"> {file.name} </p>
                              <p className="text-xs text-muted-foreground"> {formatFileSize(file.size)}</p>
                             </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex justify-between items-center gap-3">
                   <button
                      onClick={() => acceptNewProject(project)}
                      className={`mt-4 w-full py-2 rounded-md ${darkMode ? "bg-green-900 hover:bg-green-800 text-green-300" : "bg-green-200 text-green-800 hover:bg-green-300"} `}
                    >
                    Accept Project
                   </button>
                   <button
                    onClick={() => {
                      setProjectToReject(project);
                      setRejectionDialog(true);
                      }}
                    className={`mt-4 w-full py-2 rounded-md ${darkMode ? "bg-red-900 text-red-300 hover:bg-red-800" : "bg-red-200 text-red-800 hover:bg-red-300"} `}
                    >
                    Reject Project
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
         </div>
         )}
          {/* Main Projects Grid */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
       ) : (
        <>
          {/* Projects Table View - Simplified */}
          <Card className={`mb-8 ${darkMode ? "bg-zinc-800" : "bg-white"}`}>
            <CardContent className="p-0">
              <div className={`p-4 border-b ${darkMode ? "border-zinc-700" : "border-gray-200"}`}>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <h2 className="text-lg font-semibold">Active Projects</h2>
                  <div className="relative w-full md:w-64">
                    <input
                      type="text"
                      placeholder="Search projects..."
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
                </div>
              </div>
              <DataTable
                columns={columns}
                data={filteredProjects}
                customStyles={customStyles}
                onRowClicked={(row) => setSelectedProject(row)}
                highlightOnHover
                pointerOnHover
                pagination
                paginationPerPage={10}
                paginationRowsPerPageOptions={[5, 10, 15, 20]}
                theme={darkMode ? "dark" : "light"}
                noDataComponent={
                  <div className="p-4 text-center">
                    No projects found
                  </div>
                }
              />
            </CardContent>
          </Card>

          {/* Terminated project Card View */}
          {terminatedProjects.length > 0 && (
            <div className="mt-8">
              <button  onClick={()=> setShowTerminated(!showTerminated)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg mb-4 ${darkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-200 hover:bg-gray-300"}`}>
                <span className="font-semibold">
                  {showTerminated ? 'Hide': 'Show'} Terminated Projects ({terminatedProjects.length})
                </span>
                <svg
                    className={`w-4 h-4 transition-transform ${showTerminated ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showTerminated && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {terminatedProjects.map(project => (
                  <Card 
                    key={project.id}
                    onClick={() => setSelectedProject(project)}
                    className={`cursor-pointer transition-all hover:shadow-lg ${darkMode ? "bg-gray-800 hover:border-purple-500" : "bg-white hover:border-purple-400"}`}
                  >
                     <CardContent className="p-6">
                       <div className="flex justify-between items-start">
                         <h3 className="text-lg font-semibold">{project.title}</h3>
                         <span className={`text-xs px-2 py-1 rounded-full ${darkMode ? "bg-red-900 text-red-300" : "bg-red-100 text-red-800"}`}>
                           Rejected
                         </span>   
                       </div>
                       <p className={`mt-2 text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                         {project.description}
                       </p>
                  
                       <div className="mt-4 space-y-2">
                        <div className="flex items-center text-sm">
                          <UserIcon size={16} className="mr-2" />
                          <span>Assigned by: {project.assignedBy}</span>
                         </div>
                        <div className="flex items-center text-sm">
                      <CalendarIcon size={16} className="mr-2" />
                      <span>Due: {project.dueDate}</span>
                    </div>


                    <div className="text-sm">
                      <p className="font-medium mt-2">Rejection Reason:</p> 
                      <p className={`mt-1 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                         {project.rejectionReason || "No reason provided"}
                      </p> 
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            </div>     
              )}
            </div>
          )}   
        </>
      )}
      <Dialog open={rejectionDialog} onOpenChange={setRejectionDialog}>
        <DialogContent className={darkMode ? "bg-gray-800" : "bg-white"}>
          <DialogHeader>
            <DialogTitle>Rejection Reason</DialogTitle>
            <DialogDescription className={darkMode ? "text-gray-400" : "text-gray-600"}>
              Pease provide a reason for rejecting {projectToReject?.title}
            </DialogDescription>
          </DialogHeader>
          <textarea  className={`w-full p-2 mt-2 border rounded-md ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"}`}
                   rows={4}
                   value={rejectionReason}
                   onChange={(e) => setRejectionReason(e.target.value)}
                   placeholder="Enter your reason for rejection..."/>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={()=> {
                       setRejectionDialog(false);
                       setRejectionReason('');
                      }}
                    className={`px-4 py-2 rounded-md ${darkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-200 hover:bg-gray-300" }`}  
             >
              Cancel
             </button>
             <button onClick={()=> {
                       if (projectToReject) {
                        rejectProject(projectToReject, rejectionReason);
                       }
                  }}
                 className={`px-4 py-2 rounded-md text-white ${ darkMode ? "bg-red-700 hover:bg-red-600" : "bg-red-500 hover:bg-red-600"}`}
                 disabled={!rejectionReason.trim()}>
                  Send
                 </button>
          </div>
        </DialogContent>
      </Dialog>


      <Dialog open={!!previewFile} onOpenChange={()=> setPreviewFile(null)}>
        <DialogContent className={darkMode ? "bg-gray-800" : "bg-white"}>
          {previewFile && (
            <>
               <DialogHeader>
                 <DialogTitle>{previewFile.name}</DialogTitle>
                 <DialogDescription className={darkMode ? "text-gray-400" : "text-gray-600"}>
                  {formatFileSize(previewFile.size)}
                 </DialogDescription>
               </DialogHeader>
               <div className="mt-4">
                {previewFile.type.includes('image') ? (
                  <img src={previewFile.url}
                       alt={previewFile.name}
                       className="w-full h-auto rounded-md" />
                ): (
                  <div className={`p-8 rounded-md ${darkMode ? "bg-gray-700" : "bg-gray-100"} text-center`}>
                    <p className="text-lg font-medium mb-4">
                      {getFileIcon(previewFile.type)} {previewFile.name}
                    </p>
                    <div className="flex justify-end space-x-3 pt-4">
                      <a
                        href={previewFile.url}
                        download={previewFile.name}
                        className={`px-4 py-2 rounded-md ${darkMode ? "bg-blue-600 hover:bg-blue-500" : "bg-blue-500 hover:bg-blue-400"} text-white`}>
                        Download
                      </a>
                      <a
                        href={previewFile.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`px-4 py-2 rounded-md ${darkMode ? "bg-gray-600 hover:bg-gray-500" : "bg-gray-200 hover:bg-gray-300" }`} >
                        Open
                      </a>
                    </div>
                  </div>
                )}
               </div>            
            </>
             )}
             </DialogContent>
        </Dialog>
       </div>

        )}
        
      </div>      
  );
};

export default Projects;
