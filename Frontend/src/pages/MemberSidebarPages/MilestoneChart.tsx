import { useState } from "react";
import { Clock, Bookmark, ChevronRight, Calendar, Users, User, Flag, CheckCircle, RefreshCw, AlertCircle,  } from "lucide-react";

type Project = {
  id: string;
  title: string;
  progress: number;
  description: string;
  teamMembers: string[];
  startDate: Date;
  dueDate: Date;
  tasks: {
    id: string;
    title: string;
    status: "completed" | "in-progress" | "overdue";
    startDate: Date;
    endDate: Date;
    assignee: string;
  }[];
};

const STATUS_COLORS = {
  completed: "bg-green-100 text-green-800",
  "in-progress": "bg-yellow-100 text-yellow-800",
  overdue: "bg-red-100 text-red-800"
};

const STATUS_ICONS = {
  completed: <CheckCircle className="w-4 h-4 mr-1" />,
  "in-progress": <RefreshCw className="w-4 h-4 mr-1" />,
  overdue: <AlertCircle className="w-4 h-4 mr-1" />
};

const formatDate = (date: Date) => {
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
};

const MilestoneChart = ({ darkMode, isSidebarOpen }: { darkMode: boolean; isSidebarOpen: boolean }) => {
  const [projects] = useState<Project[]>([
    {
      id: "PROJ-1",
      title: "Government Portal Development",
      progress: 65,
      description: "Citizen service platform modernization",
      teamMembers: ["Mahlet", "Kalkidan", "Dehine", "Letu"],
      startDate: new Date(2023, 2, 15),
      dueDate: new Date(2023, 5, 30),
      tasks: [
        {
          id: "TASK-1",
          title: "API Documentation Review",
          status: "completed",
          startDate: new Date(2023, 3, 1),
          endDate: new Date(2023, 3, 5),
          assignee: "Mahlet"
        },
        {
          id: "TASK-2",
          title: "Dashboard UI Update",
          status: "in-progress",
          startDate: new Date(2023, 3, 6),
          endDate: new Date(2023, 3, 15),
          assignee: "Kalkidan"
        },
        {
          id: "TASK-3",
          title: "Authentication System",
          status: "overdue",
          startDate: new Date(2023, 3, 10),
          endDate: new Date(2023, 3, 20),
          assignee: "Letu"
        }
      ]
    },
    {
      id: "PROJ-2",
      title: "Tax System Upgrade",
      progress: 30,
      description: "Legacy system modernization project",
      teamMembers: ["Abenezer", "Aleligne", "Raey"],
      startDate: new Date(2023, 3, 1),
      dueDate: new Date(2023, 7, 15),
      tasks: [
        {
          id: "TASK-4",
          title: "Database Migration",
          status: "in-progress",
          startDate: new Date(2023, 3, 10),
          endDate: new Date(2023, 3, 25),
          assignee: "Raey"
        },
        {
          id: "TASK-5",
          title: "Security Audit",
          status: "in-progress",
          startDate: new Date(2023, 3, 15),
          endDate: new Date(2023, 4, 5),
          assignee: "Abenezer"
        }
      ]
    },
    {
      id: "PROJ-3",
      title: "Healthcare App Integration",
      progress: 85,
      description: "Mobile app for patient health records",
      teamMembers: ["Kalkidan", "Mahlet", "Dehine"],
      startDate: new Date(2023, 1, 10),
      dueDate: new Date(2023, 4, 20),
      tasks: [
        {
          id: "TASK-6",
          title: "Backend API Development",
          status: "completed",
          startDate: new Date(2023, 2, 1),
          endDate: new Date(2023, 2, 25),
          assignee: "Dehine"
        },
        {
          id: "TASK-7",
          title: "Mobile UI Implementation",
          status: "completed",
          startDate: new Date(2023, 3, 1),
          endDate: new Date(2023, 3, 20),
          assignee: "Kalkidan"
        },
        {
          id: "TASK-8",
          title: "Testing & QA",
          status: "in-progress",
          startDate: new Date(2023, 3, 15),
          endDate: new Date(2023, 4, 10),
          assignee: ""
        }
      ]
    }
  ]);


  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  
  const handleProjectSelect = (project: Project) => {
    setSelectedProject(project);
    setRecentProjects(prev => {
      const newRecent = prev.filter(p => p.id !== project.id);
      return [project, ...newRecent].slice(0, 3);
    });
  };

  // Get progress color based on percentage
  const getProgressColor = (progress: number) => {
    if (progress >= 75) return "bg-green-500";
    if (progress >= 50) return "bg-green-400";
    if (progress >= 25) return "bg-yellow-400";
    return "bg-red-400";
  };

  // Calculate task status distribution for chart
  // const getTaskDistribution = (project: Project) => {
  //   const distribution = {
  //     completed: 0,
  //     "in-progress": 0,
  //     overdue: 0
  //   };
    
  //   project.tasks.forEach(task => {
  //     distribution[task.status] += 1;
  //   });
    
  //   return Object.entries(distribution).map(([status, count]) => ({
  //     name: status.charAt(0).toUpperCase() + status.slice(1),
  //     value: count,
  //     color: STATUS_COLORS[status as keyof typeof STATUS_COLORS].split(" ")[0]
  //   }));
  // };

  return (
    <div className={`flex-1 min-h-screen ${darkMode ? 'bg-zinc-800 text-white' : 'bg-white text-gray-800'}`}>
      <div className={`transition-all duration-200 pt-7 ${isSidebarOpen ? 'ml-[30px]' : 'ml-[30px]'}`}>
        <div>
          <h1 className="text-3xl font-bold ml-7 mt-3">Milestone Chart</h1>
          <p className="ml-7 text-gray-500 dark:text-gray-400">Track project progress and milestones</p>
        </div>
        
        <div className="flex h-full ml-4 mt-5">
          {/* Left Sidebar - Project Selection (scrollable) */}
          <div className={`w-96 flex-shrink-0 rounded-lg mt-2 mr-4 
            ${darkMode ? 'bg-zinc-700' : 'bg-gray-50'}
            h-[calc(100vh-8rem)] overflow-y-auto shadow-lg`}>
             
            <h3 className="text-lg font-bold mb-3 mt-4 flex items-center p-4 sticky top-0 z-10 bg-inherit  ">
              <Bookmark className="mr-2 w-5 h-5 text-gray-500" />
              Assigned Projects
            </h3>
            
            <div className="space-y-2 mb-8 px-4">
              {projects.map(project => (
                <div
                  key={project.id}
                  onClick={() => handleProjectSelect(project)}
                  className={`p-4 rounded-lg cursor-pointer transition-all shadow-md transform hover:scale-[1.02] ${
                    selectedProject?.id === project.id 
                      ? (darkMode 
                          ? 'bg-gradient-to-r from-purple-900/50 to-purple-700/30 border border-purple-500' 
                          : 'bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-300') 
                      : (darkMode 
                          ? 'bg-zinc-600 hover:bg-zinc-500 border border-transparent' 
                          : 'bg-white hover:bg-gray-100 border border-transparent')
                  }`}
                >
                  <div className="font-medium text-lg">{project.title}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-300 truncate mb-2">
                    {project.description}
                  </div>
                  
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center">
                      <span className="text-xs font-medium">Progress:</span>
                      <span className={`ml-2 text-xs font-bold ${project.progress >= 70 ? 'text-green-300' : project.progress >= 40 ? 'text-yellow-300' : 'text-red-300'}`}>
                        {project.progress}%
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-1 text-gray-500 dark:text-gray-400" />
                      <span className="text-xs">{project.teamMembers.length}</span>
                    </div>
                  </div>

                  
                  <div className={`h-1 rounded-full mt-2 ${darkMode ? 'bg-zinc-500' : 'bg-gray-200'}`}>
                    <div 
                      className={`h-full rounded-full ${getProgressColor(project.progress)}`} 
                      style={{ width: `${project.progress}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>

            <h3 className="text-lg font-semibold mb-4 mt-8 flex items-center px-4 sticky top-0 z-10 bg-inherit ">
              <Clock className="mr-2 w-5 h-5 text-gray-500" />
              Recently Viewed
            </h3>
            <div className="space-y-2 px-4 pb-4">
              {recentProjects.map(project => (
                <div
                  key={project.id}
                  onClick={() => handleProjectSelect(project)}
                  className={`p-3 rounded-lg cursor-pointer flex items-center shadow ${
                    darkMode 
                      ? 'bg-zinc-600 hover:bg-zinc-500' 
                      : 'bg-white hover:bg-gray-100'
                  }`}
                >
                  <ChevronRight className="w-4 h-4 mr-2 text-gray-500" />
                  <div>
                    <div className="font-medium">{project.title}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {project.progress}% complete
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Content Area - Project Details */}
          <div className="flex-1 p-5 overflow-y-auto mt-0 mr-8">
            {selectedProject ? (
              <div 
                className={`rounded-xl p-6 shadow-xl ${
                  darkMode 
                    ? 'bg-gradient-to-br from-zinc-700 to-zinc-800 border border-zinc-600' 
                    : 'bg-gradient-to-br from-white to-gray-50 border border-gray-200'
                }`}
               >
                {/* Project Header */}
                <div className="mb-8">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-xl font-bold mb-1">{selectedProject.title}</h2>
                      <p className="text-gray-500 dark:text-gray-300 max-w-xl">
                        {selectedProject.description}
                      </p>
                    </div>
                    
                  </div>
                  
                  {/* Progress Indicator */}
                  <div className="mb-8 mt-6">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium text-lg">Project Progress</span>
                      <span className={`text-base font-bold ${
                        selectedProject.progress >= 70 ? 'text-green-300' : 
                        selectedProject.progress >= 40 ? 'text-yellow-300' : 'text-red-300'
                      }`}>
                        {selectedProject.progress}%
                      </span>
                    </div>
                    <div className={`h-2 rounded-full ${darkMode ? 'bg-zinc-600' : 'bg-gray-200'}`}>
                      <div 
                        className={`h-full rounded-full ${getProgressColor(selectedProject.progress)}`} 
                        style={{ width: `${selectedProject.progress}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  {/* Timeline */}
                  <div className="flex justify-between items-center mb-8 p-4 rounded-lg bg-gray-50 dark:bg-zinc-600">
                    <div className="flex items-center">
                      <Calendar className="w-5 h-5 mr-2 text-purple-500" />
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-300">Start Date</div>
                        <div className="font-medium">{formatDate(selectedProject.startDate)}</div>

                      </div>
                    </div>
                    
                    <div className="h-0.5 flex-1 bg-gray-300 dark:bg-zinc-500 mx-4"></div>
                    
                    <div className="flex items-center">
                      <Flag className="w-5 h-5 mr-2 text-purple-500" />
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-300">Due Date</div>
                        <div className="font-medium">{formatDate(selectedProject.dueDate)}</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Team Members */}
                <div className="mb-8">
                  <h3 className="font-semibold text-base mb-4 flex items-center">
                    <Users className="w-5 h-5 mr-2 text-purple-500" />
                    Team Members
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {selectedProject.teamMembers.map((member, index) => (
                      <div 
                        key={index} 
                        className={`px-1 py-0.5 rounded-full flex items-center ${
                          darkMode ? 'bg-zinc-600' : 'bg-gray-100'
                        }`}
                      >
                        <div className="bg-gray-300 dark:bg-zinc-500 rounded-full w-5 h-5 flex items-center justify-center mr-2">
                          <span className="font-medium text-sm">
                            {member.charAt(0)}
                          </span>
                        </div>
                        <span>{member}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Tasks */}
                <div className="mb-8">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-xl flex items-center">
                      Project Tasks
                      <span className="ml-2 text-sm px-2 py-1 bg-gray-200 dark:bg-zinc-600 rounded">
                        {selectedProject.tasks.length} tasks
                      </span>
                    </h3>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {selectedProject.tasks.filter(t => t.status === 'completed').length} completed
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedProject.tasks.map(task => (
                      <div 
                        key={task.id}
                        className={`p-4 rounded-xl shadow ${
                          darkMode ? 'bg-zinc-600' : 'bg-gray-50'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="font-medium text-lg">{task.title}</h4>
                          <span className={`px-3 py-1 rounded-full text-sm flex items-center ${STATUS_COLORS[task.status]}`}>
                            {STATUS_ICONS[task.status]}
                            {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                          </span>
                        </div>
                        
                        <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mb-3">
                          <span>{formatDate(task.startDate)}</span>
                          <span>{formatDate(task.endDate)}</span>
                        </div>
                        
                        <div className="flex items-center text-sm">
                          <User className="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400" />
                          <span>Assigned to: {task.assignee || "Unassigned"}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center mt-36 p-8">
                <div className={`p-8 rounded-xl text-center max-w-2xl ${
                  darkMode ? 'bg-gradient-to-br from-zinc-700 to-zinc-800' : 'bg-gradient-to-br from-gray-50 to-white'
                } shadow-xl`}>
                  <div className="bg-gray-200 dark:bg-zinc-700 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                    <Bookmark className="w-12 h-12 text-gray-500" />
                  </div>
                  <h2 className="text-2xl font-bold mb-4">Select a Project</h2>
                  <p className="text-base text-gray-500 dark:text-gray-400 mb-6">
                    Choose a project from the sidebar to view detailed progress, tasks, and milestones
                  </p>
                  <div className="bg-gray-200 dark:bg-zinc-700 h-2 w-64 mx-auto rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gray-500" 
                      style={{ width: '45%' }}
                    ></div>
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

export default MilestoneChart;
