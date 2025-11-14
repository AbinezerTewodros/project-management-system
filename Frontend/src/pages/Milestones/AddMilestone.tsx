import { useState } from "react";
import { Users, User, Calendar, Flag, CheckCircle, RefreshCw, AlertCircle, Plus, Edit, Trash, ChevronDown, ChevronUp, Bookmark } from "lucide-react";

type TeamMember = {
  id: string;
  name: string;
  role: string;
  projects: {
    id: string;
    title: string;
    progress: number;
    milestones: {
      id: string;
      title: string;
      status: "completed" | "in-progress" | "overdue";
      dueDate: Date;
      assignedBy: string;
    }[];
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

const TeamMilestonesDashboard = ({ darkMode, isSidebarOpen }: { darkMode: boolean; isSidebarOpen: boolean }) => {
  const [teamMembers] = useState<TeamMember[]>([
    {
      id: "TM-1",
      name: "Mahlet",
      role: "Frontend Developer",
      projects: [
        {
          id: "PROJ-1",
          title: "Government Portal",
          progress: 65,
          milestones: [
            {
              id: "M-1",
              title: "Dashboard UI Implementation",
              status: "completed",
              dueDate: new Date(2023, 4, 15),
              assignedBy: "Scrum Master"
            },
            {
              id: "M-2",
              title: "User Authentication Flow",
              status: "in-progress",
              dueDate: new Date(2023, 5, 1),
              assignedBy: "Scrum Master"
            },
            {
              id: "M-3",
              title: "Performance Optimization",
              status: "overdue",
              dueDate: new Date(2023, 4, 10),
              assignedBy: "Project Manager"
            }
          ]
        },
        {
          id: "PROJ-2",
          title: "Healthcare App",
          progress: 85,
          milestones: [
            {
              id: "M-4",
              title: "Patient Records Module",
              status: "completed",
              dueDate: new Date(2023, 4, 20),
              assignedBy: "Scrum Master"
            }
          ]
        }
      ]
    },
    {
      id: "TM-2",
      name: "Kalkidan",
      role: "UI/UX Designer",
      projects: [
        {
          id: "PROJ-1",
          title: "Government Portal",
          progress: 65,
          milestones: [
            {
              id: "M-5",
              title: "Admin Dashboard Design",
              status: "completed",
              dueDate: new Date(2023, 3, 25),
              assignedBy: "Scrum Master"
            },
            {
              id: "M-6",
              title: "Mobile Responsive Layouts",
              status: "in-progress",
              dueDate: new Date(2023, 5, 5),
              assignedBy: "Scrum Master"
            }
          ]
        }
      ]
    },
    {
      id: "TM-3",
      name: "Dehine",
      role: "Backend Developer",
      projects: [
        {
          id: "PROJ-2",
          title: "Healthcare App",
          progress: 85,
          milestones: [
            {
              id: "M-7",
              title: "API Integration",
              status: "in-progress",
              dueDate: new Date(2023, 5, 10),
              assignedBy: "Scrum Master"
            },
            {
              id: "M-8",
              title: "Database Optimization",
              status: "overdue",
              dueDate: new Date(2023, 4, 5),
              assignedBy: "Project Manager"
            }
          ]
        }
      ]
    }
  ]);


  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [expandedProjects, setExpandedProjects] = useState<string[]>([]);
  const [newMilestone, setNewMilestone] = useState({
    title: "",
    dueDate: "",
    status: "in-progress" as "completed" | "in-progress" | "overdue",
    projectId: ""
  });
  const [isAddingMilestone, setIsAddingMilestone] = useState(false);

  const handleMemberSelect = (member: TeamMember) => {
    setSelectedMember(member);
    // Expand all projects by default when selecting a member
    setExpandedProjects(member.projects.map(p => p.id));
  };

  const toggleProject = (projectId: string) => {
    setExpandedProjects(prev => 
      prev.includes(projectId) 
        ? prev.filter(id => id !== projectId) 
        : [...prev, projectId]
    );
  };

  const handleAddMilestone = () => {
    if (!selectedMember || !newMilestone.title || !newMilestone.dueDate) return;
    
    const newMilestoneObj = {
      id: `M-${Date.now()}`,
      title: newMilestone.title,
      status: newMilestone.status,
      dueDate: new Date(newMilestone.dueDate),
      assignedBy: "You" // Current user (manager)
    };

    // Update the selected member's projects
    const updatedMember = {
      ...selectedMember,
      projects: selectedMember.projects.map(project => 
        project.id === newMilestone.projectId
          ? {
              ...project,
              milestones: [...project.milestones, newMilestoneObj]
            }
          : project
      )
    };

    // Update team members list
    const updatedTeamMembers = teamMembers.map(member => 
      member.id === updatedMember.id ? updatedMember : member
    );

    setSelectedMember(updatedMember);
    // Reset form
    setNewMilestone({
      title: "",
      dueDate: "",
      status: "in-progress",
      projectId: ""
    });
    setIsAddingMilestone(false);
  };

  const handleDeleteMilestone = (projectId: string, milestoneId: string) => {
    if (!selectedMember) return;
    
    const updatedMember = {
      ...selectedMember,
      projects: selectedMember.projects.map(project => 
        project.id === projectId
          ? {
              ...project,
              milestones: project.milestones.filter(m => m.id !== milestoneId)
            }
          : project
      )
    };

    // Update team members list
    const updatedTeamMembers = teamMembers.map(member => 
      member.id === updatedMember.id ? updatedMember : member
    );

    setSelectedMember(updatedMember);
  };

  // Get progress color based on percentage
  const getProgressColor = (progress: number) => {
    if (progress >= 75) return "bg-green-500";
    if (progress >= 50) return "bg-green-400";
    if (progress >= 25) return "bg-yellow-400";
    return "bg-red-400";
  };


  return (
    <div className={`flex-1 min-h-screen ${darkMode ? 'bg-zinc-800 text-white' : 'bg-white text-gray-800'}`}>
      <div className={`transition-all duration-200 pt-7 ${isSidebarOpen ? 'ml-[30px]' : 'ml-[30px]'}`}>
        <div>
          <h1 className="text-3xl font-bold ml-7 mt-3">Team Milestones Dashboard</h1>
          <p className="ml-7 text-gray-500 dark:text-gray-400">Manage and assign milestones to team members</p>
        </div>
        
        <div className="flex h-full ml-4 mt-5">
          {/* Left Sidebar - Team Member Selection */}
          <div className={`w-80 flex-shrink-0 rounded-lg mt-2 mr-4 
            ${darkMode ? 'bg-zinc-700' : 'bg-gray-50'}
            h-[calc(100vh-8rem)] overflow-y-auto shadow-lg`}>
             
            <h3 className="text-lg font-bold mb-3 mt-4 flex items-center p-4 sticky top-0 z-10 bg-inherit">
              <Users className="mr-2 w-5 h-5 text-gray-500" />
              Team Members
            </h3>
            
            <div className="space-y-2 mb-8 px-4">
              {teamMembers.map(member => (
                <div
                  key={member.id}
                  onClick={() => handleMemberSelect(member)}
                  className={`p-4 rounded-lg cursor-pointer transition-all shadow-md transform hover:scale-[1.02] ${
                    selectedMember?.id === member.id 
                      ? (darkMode 
                          ? 'bg-gradient-to-r from-blue-900/50 to-blue-700/30 border border-blue-500' 
                          : 'bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-300') 
                      : (darkMode 
                          ? 'bg-zinc-600 hover:bg-zinc-500 border border-transparent' 
                          : 'bg-white hover:bg-gray-100 border border-transparent')
                  }`}
                >
                  <div className="font-medium text-lg flex items-center">
                    <User className="w-5 h-5 mr-2 text-gray-500 dark:text-gray-300" />
                    {member.name}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-300 ml-7 mb-2">
                    {member.role}
                  </div>
                  
                  <div className="flex items-center justify-between mt-3">
                    <div className="text-sm">
                      Projects: <span className="font-bold">{member.projects.length}</span>
                    </div>
                    <div className="text-sm">
                      Milestones: <span className="font-bold">
                        {member.projects.reduce((total, project) => total + project.milestones.length, 0)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="px-4 pb-4">
              <button 
                className={`w-full py-3 rounded-lg flex items-center justify-center ${
                  darkMode 
                    ? 'bg-zinc-600 hover:bg-zinc-500' 
                    : 'bg-white hover:bg-gray-100'
                } shadow border border-dashed ${darkMode ? 'border-zinc-500' : 'border-gray-300'}`}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Team Member
              </button>
            </div>
          </div>


          {/* Right Content Area - Member Details */}
          <div className="flex-1 p-5 overflow-y-auto mt-0 mr-8">
            {selectedMember ? (
              <div 
                className={`rounded-xl p-6 shadow-xl ${
                  darkMode 
                    ? 'bg-gradient-to-br from-zinc-700 to-zinc-800 border border-zinc-600' 
                    : 'bg-gradient-to-br from-white to-gray-50 border border-gray-200'
                }`}
              >
                {/* Member Header */}
                <div className="mb-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-2xl font-bold mb-1 flex items-center">
                        <User className="w-6 h-6 mr-2 text-blue-500" />
                        {selectedMember.name}
                      </h2>
                      <p className="text-gray-500 dark:text-gray-300 ml-8">
                        {selectedMember.role}
                      </p>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors">
                        <Edit className="w-4 h-4 mr-2 inline" />
                        Edit
                      </button>
                      <button className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-zinc-600 hover:bg-gray-300 dark:hover:bg-zinc-500 transition-colors">
                        Message
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Projects & Milestones */}
                <div className="mb-8">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-semibold text-xl flex items-center">
                      <Bookmark className="w-5 h-5 mr-2 text-blue-500" />
                      Projects & Milestones
                    </h3>
                    
                    <button 
                      className="px-4 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors flex items-center"
                      onClick={() => setIsAddingMilestone(!isAddingMilestone)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Milestone
                    </button>
                  </div>
                  
                  {/* Add Milestone Form */}
                  {isAddingMilestone && (
                    <div className={`p-4 rounded-lg mb-6 ${
                      darkMode ? 'bg-zinc-600' : 'bg-gray-100'
                    }`}>
                      <h4 className="font-medium mb-3">Assign New Milestone</h4>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="col-span-2">
                          <label className="block text-sm mb-1">Milestone Title</label>
                          <input
                            type="text"
                            className={`w-full p-2 rounded ${
                              darkMode ? 'bg-zinc-700 text-white' : 'bg-white'
                            } border ${darkMode ? 'border-zinc-500' : 'border-gray-300'}`}
                            value={newMilestone.title}
                            onChange={(e) => setNewMilestone({...newMilestone, title: e.target.value})}
                            placeholder="Enter milestone title"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm mb-1">Due Date</label>
                          <input
                            type="date"
                            className={`w-full p-2 rounded ${
                              darkMode ? 'bg-zinc-700 text-white' : 'bg-white'
                            } border ${darkMode ? 'border-zinc-500' : 'border-gray-300'}`}

                            value={newMilestone.dueDate}
                            onChange={(e) => setNewMilestone({...newMilestone, dueDate: e.target.value})}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm mb-1">Project</label>
                          <select
                            className={`w-full p-2 rounded ${
                              darkMode ? 'bg-zinc-700 text-white' : 'bg-white'
                            } border ${darkMode ? 'border-zinc-500' : 'border-gray-300'}`}
                            value={newMilestone.projectId}
                            onChange={(e) => setNewMilestone({...newMilestone, projectId: e.target.value})}
                          >
                            <option value="">Select project</option>
                            {selectedMember.projects.map(project => (
                              <option key={project.id} value={project.id}>{project.title}</option>
                            ))}
                          </select>
                        </div>
                        
                        <div className="md:col-span-3">
                          <label className="block text-sm mb-1">Status</label>
                          <div className="flex space-x-3">
                            {Object.entries(STATUS_COLORS).map(([status, colorClass]) => (
                              <label 
                                key={status} 
                                className={`flex items-center px-3 py-1 rounded-full cursor-pointer ${
                                  darkMode ? colorClass.replace('bg-', 'bg-dark-') : colorClass
                                } ${newMilestone.status === status ? 'ring-2 ring-blue-500' : ''}`}
                              >
                                <input
                                  type="radio"
                                  name="status"
                                  className="hidden"
                                  checked={newMilestone.status === status}
                                  onChange={() => setNewMilestone({...newMilestone, status: status as any})}
                                />
                                <span className="text-sm capitalize">
                                  {status.split('-').join(' ')}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                        
                        <div className="flex items-end">
                          <button 
                            className="px-4 py-2 w-full rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                            onClick={handleAddMilestone}
                          >
                            Assign Milestone
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Projects List */}
                  <div className="space-y-4">
                    {selectedMember.projects.map(project => (
                      <div 
                        key={project.id}
                        className={`rounded-lg overflow-hidden shadow ${
                          darkMode ? 'bg-zinc-700' : 'bg-gray-50'
                        }`}
                      >
                        <div 
                          className={`p-4 flex justify-between items-center cursor-pointer ${
                            darkMode ? 'hover:bg-zinc-600' : 'hover:bg-gray-100'
                          }`}
                          onClick={() => toggleProject(project.id)}
                        >
                          <div className="flex items-center">
                            {expandedProjects.includes(project.id) 
                              ? <ChevronUp className="w-5 h-5 mr-2 text-gray-500" />

                              : <ChevronDown className="w-5 h-5 mr-2 text-gray-500" />
                            }
                            <div className="font-medium text-lg">{project.title}</div>
                          </div>
                          
                          <div className="flex items-center">
                            <span className={`text-sm font-bold mr-4 ${
                              project.progress >= 70 ? 'text-green-500' : 
                              project.progress >= 40 ? 'text-yellow-500' : 'text-red-500'
                            }`}>
                              {project.progress}%
                            </span>
                            <div className={`h-2 w-24 rounded-full ${darkMode ? 'bg-zinc-600' : 'bg-gray-200'}`}>
                              <div 
                                className={`h-full rounded-full ${getProgressColor(project.progress)}`} 
                                style={{ width: `${project.progress}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                        
                        {expandedProjects.includes(project.id) && (
                          <div className="border-t border-gray-200 dark:border-zinc-600 p-4">
                            <h4 className="font-medium mb-3 flex items-center">
                              <Flag className="w-4 h-4 mr-2 text-gray-500" />
                              Milestones
                            </h4>
                            
                            <div className="space-y-3">
                              {project.milestones.map(milestone => (
                                <div 
                                  key={milestone.id}
                                  className={`p-3 rounded-lg flex justify-between items-center ${
                                    darkMode ? 'bg-zinc-600' : 'bg-white'
                                  } shadow`}
                                >
                                  <div>
                                    <div className="font-medium">{milestone.title}</div>
                                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-1">
                                      <Calendar className="w-4 h-4 mr-1" />
                                      <span>Due: {formatDate(milestone.dueDate)}</span>
                                      <span className="mx-2">•</span>
                                      <span>Assigned by: {milestone.assignedBy}</span>
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center space-x-2">
                                    <span className={`px-3 py-1 rounded-full text-sm flex items-center ${
                                      darkMode 
                                        ? STATUS_COLORS[milestone.status].replace('bg-', 'bg-dark-') 
                                        : STATUS_COLORS[milestone.status]
                                    }`}>
                                      {STATUS_ICONS[milestone.status]}
                                      {(milestone.status || 'Pending').charAt(0).toUpperCase() + (milestone.status || 'Pending').slice(1)}
                                    </span>
                                    
                                    <button 
                                      className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-zinc-500"
                                      onClick={() => handleDeleteMilestone(project.id, milestone.id)}
                                    >
                                      <Trash className="w-4 h-4 text-gray-500" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Upcoming Deadlines */}
                <div>
                  <h3 className="font-semibold text-xl flex items-center mb-4">
                    <Flag className="w-5 h-5 mr-2 text-blue-500" />
                    Upcoming Deadlines
                  </h3>
                  
                  <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${
                    darkMode ? 'bg-zinc-700' : 'bg-gray-50'
                  } p-4 rounded-lg`}>
                    {selectedMember.projects.flatMap(project => 
                      project.milestones
                        .filter(m => m.status !== 'completed')
                        .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
                        .slice(0, 4)
                        .map(milestone => (
                          <div 
                            key={milestone.id} 
                            className={`p-4 rounded-lg ${
                              darkMode ? 'bg-zinc-600' : 'bg-white'
                            } shadow`}
                          >
                            <div className="flex justify-between">
                              <div>
                                <div className="font-medium">{milestone.title}</div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  {project.title}
                                </div>
                              </div>
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                darkMode 
                                  ? STATUS_COLORS[milestone.status].replace('bg-', 'bg-dark-') 
                                  : STATUS_COLORS[milestone.status]
                              }`}>
                                {(milestone.status || 'Pending').charAt(0).toUpperCase() + (milestone.status || 'Pending').slice(1)}
                              </span>
                            </div>
                            
                            <div className="mt-3 flex items-center text-sm">
                              <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                              <span>Due: {formatDate(milestone.dueDate)}</span>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center mt-36 p-8">
                <div className={`p-8 rounded-xl text-center max-w-2xl ${
                  darkMode ? 'bg-gradient-to-br from-zinc-700 to-zinc-800' : 'bg-gradient-to-br from-gray-50 to-white'
                } shadow-xl`}>
                  <div className="bg-gray-200 dark:bg-zinc-700 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                    <Users className="w-12 h-12 text-gray-500" />
                  </div>
                  <h2 className="text-2xl font-bold mb-4">Select a Team Member</h2>
                  <p className="text-base text-gray-500 dark:text-gray-400 mb-6">
                    Choose a team member from the sidebar to view and manage their milestones
                  </p>
                  <div className="bg-gray-200 dark:bg-zinc-700 h-2 w-64 mx-auto rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500" 
                      style={{ width: '65%' }}
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

export default TeamMilestonesDashboard;
