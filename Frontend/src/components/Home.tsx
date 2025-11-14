import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid,  Legend, Tooltip  } from 'recharts';
import { Clock, CheckCircle, List, ChevronRight, RefreshCw, Bell, Folder, ClipboardCheck, FileEdit, ChevronDown  } from 'lucide-react'; 
import { tasksData, projects } from '@/pages/MockData/MockData';
import { motion, AnimatePresence } from "framer-motion";  


const CURRENT_USER = 'User!';

const PURPLE_PRIMARY = '#7e22ce';

const PURPLE_PALETTE = [
  '#7e22ce', // Primary purple (darkest)
  '#a855f7', // Medium purple
  '#d8b4fe', // Secondary purple (lightest)
  '#ede9fe'  // Very light purple
];

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

const getFormattedDate = () => {
  const date = new Date();
  return date.toLocaleDateString(undefined, { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
};

const ChartCard = ({ 
  title, 
  children,
  darkMode 
}: { 
  title: string; 
  children: React.ReactNode;
  darkMode: boolean;
}) => (
  <div className={`rounded-lg p-4 ${darkMode ? 'bg-zinc-700' : 'bg-white shadow'}`}>
    <h3 className="text-lg font-bold mb-4">{title}</h3>
    {children}
  </div>
);

const SummaryCard = ({ 
  title, 
  value, 
  icon, 
  color,
  darkMode 
}: { 
  title: string; 
  value: number | string; 
  icon: React.ReactNode;
  color: string;
  darkMode: boolean;
}) => (
  <div className={`p-4 rounded-lg flex items-center ${darkMode ? 'bg-zinc-700' : 'bg-white shadow'}`}>
    <div className="w-10 h-10 rounded-lg flex items-center justify-center mr-4">
      <div style={{ color }}>{icon}</div>
    </div>
    <div>
      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{title}</p>
      <p className="text-2xl font-bold" style={{ color: darkMode ? '#f3f4f6' : '#374151' }}>
        {value}
      </p>
    </div>
  </div>
);

type FilterType = 'projects' | 'tasks';
type FilterContext = 'assigned' | 'created';
interface FilterState {
  type: FilterType;
  context: FilterContext;
}

const Home = ({ darkMode, isSidebarOpen }: { darkMode: boolean; isSidebarOpen: boolean }) => {
  const filterRef = useRef<HTMLDivElement>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [pendingToMove, setPendingToMove] = useState<{subtaskId: string} | null>(null);
  const allTasks = Object.values(tasksData).flat();
  const [allSubtasksState, setAllSubtasksState] = useState(
      allTasks.flatMap(task => task.subtasks)
  );
  const [recentTasks, setRecentTasks] = useState<{
          assigned: Array<{projectId: string, taskId: string}>,
          created: Array<{projectId: string, taskId: string}>
      }>({ assigned: [], created: [] });
  const [showFilterOptions, setShowFilterOptions] = useState(false);
  const [showTaskOptions, setShowTaskOptions] = useState(false);
  const [showProjectsDropdown, setShowProjectsDropdown] = useState(false);
  const [showTasksDropdown, setShowTasksDropdown] = useState(false);
  
  const [pendingTasks, setPendingTasks] = useState<Array<{
    projectId: string;
    taskId: string;
    subtaskId: string;
    title: string;
    projectName: string;
  }>>([]);
  
  const [completedForConfirmation, setCompletedForConfirmation] = useState<Array<{
    projectId: string;
    taskId: string;
    subtaskId: string;
    title: string;
    projectName: string;
  }>>([]);

  const [pendingProjects, setPendingProjects] = useState<Array<{
  id: string;
  title: string;
}>>([]);

const [completedProjectsForConfirmation, setCompletedProjectsForConfirmation] = useState<Array<{
  id: string;
  title: string;
}>>([]);


  const [filter, setFilter] = useState<FilterState>({ 
    type: 'tasks', 
    context: 'assigned' 
  });

useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setShowFilterOptions(false);
        setShowTaskOptions(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const showModal = (message: string) => {
    setModalMessage(message);
    setModalVisible(true);
    setTimeout(() => setModalVisible(false), 2000); 
  };
  
  const allSubtasks = allTasks.flatMap(task => task.subtasks);
  const filteredProjects = projects.filter(project => 
    filter.context === 'assigned' 
      ? project.members.includes(CURRENT_USER)
      : project.creator === CURRENT_USER
  );

  
  const projectStats = {
    total: filteredProjects.length,
    active: filteredProjects.filter(p => p.status === 'active').length,
    completed: filteredProjects.filter(p => p.status === 'completed').length,
    onHold: filteredProjects.filter(p => p.status === 'onHold').length,
  };

  
  const projectStatusData = [
    { name: 'Active', value: projectStats.active },
    { name: 'Completed', value: projectStats.completed },
    { name: 'On Hold', value: projectStats.onHold },
  ];

  
  const projectPriorityData = [
    { name: 'High', value: filteredProjects.filter(p => p.priority === 'High').length },
    { name: 'Medium', value: filteredProjects.filter(p => p.priority === 'Medium').length },
    { name: 'Low', value: filteredProjects.filter(p => p.priority === 'Low').length },
  ];


  
  const filteredSubtasks = allSubtasksState.filter(subtask => 
     filter.context === 'assigned' 
        ? subtask.assignee === CURRENT_USER 
        : subtask.creator === CURRENT_USER
  );
  
  
  const taskStats = {
    total: filteredSubtasks.length,
    pending: filteredSubtasks.filter(s => s.status === 'to-do').length,
    inProgress: filteredSubtasks.filter(s => s.status === 'in-progress').length,
    completed: filteredSubtasks.filter(s => s.status === 'completed').length
  };
  
  
  const taskDistributionData = [
    { name: 'Completed', value: taskStats.completed },
    { name: 'In Progress', value: taskStats.inProgress },
    { name: 'To Do', value: taskStats.pending },
  ];

 
  const taskPriorityData = [
    { name: 'High', value: filteredSubtasks.filter(s => s.priority === 'High').length },
    { name: 'Medium', value: filteredSubtasks.filter(s => s.priority === 'Medium').length }, 
    { name: 'Low', value: filteredSubtasks.filter(s => s.priority === 'Low').length },
  ];

  useEffect(() => {
    setRecentTasks({
      assigned: [
        { projectId: '1', taskId: '1-1' },
        { projectId: '2', taskId: '2-1' },
        { projectId: '3', taskId: '3-1' },
      ],
      created: [
        { projectId: '1', taskId: '1-2' },
        { projectId: '2', taskId: '2-1' },
        { projectId: '3', taskId: '3-1' },
      ]
    });
    
    setPendingTasks([
      { 
        projectId: '1', 
        taskId: '1-4', 
        subtaskId: 'sub-4',
        title: 'Review Documentation',
        projectName: 'Project Alpha'
      },
      { 
        projectId: '2', 
        taskId: '2-3', 
        subtaskId: 'sub-5',
        title: 'Update API Endpoints',
        projectName: 'Project Beta'
      }
    ]);
    
    setCompletedForConfirmation([
      { 
        projectId: '1', 
        taskId: '1-5', 
        subtaskId: 'sub-6',
        title: 'Implement Auth System',
        projectName: 'Project Alpha'
      },
      { 
        projectId: '3', 
        taskId: '3-2', 
        subtaskId: 'sub-7',
        title: 'Create User Dashboard',
        projectName: 'Project Gamma'
      }
    ]);

    setPendingProjects([
    { 
      id: '4', 
      title: 'Project Delta'
    },
    { 
      id: '5', 
      title: 'Project Epsilon'
    }
  ]);
  
  setCompletedProjectsForConfirmation([
    { 
      id: '6', 
      title: 'Project Zeta'
    },
    { 
      id: '7', 
      title: 'Project Eta'
    }
  ]);

  }, []);

  
  const handleConfirmCompleted = (projectId: string, taskId: string, subtaskId: string) => {
    setCompletedForConfirmation(prev => 
      prev.filter(task => 
        !(task.projectId === projectId && 
          task.taskId === taskId && 
          task.subtaskId === subtaskId)
      )
    );
    showModal('Task confirmation sent to project manager!');
  };
  
  const movePendingToTodo = () => {
    if (!pendingToMove) return;
    
    
    setAllSubtasksState(prev => 
      prev.map(subtask => 
        subtask.id === pendingToMove.subtaskId 
          ? { ...subtask, status: 'to-do' } 
          : subtask
      )
    );

    setPendingTasks(prev => prev.filter(t => t.subtaskId !== pendingToMove.subtaskId));
    showModal("Task moved to To Do list");
    setPendingToMove(null);
  };

  const handleAcceptProject = (projectId: string) => {
  setPendingProjects(prev => prev.filter(project => project.id !== projectId));
  showModal('Project accepted successfully!');
};

const handleConfirmProject = (projectId: string) => {
  setCompletedProjectsForConfirmation(prev => 
    prev.filter(project => project.id !== projectId)
  );
  showModal('Project completion confirmed!');
};
  
  const greeting = getGreeting();

  const formattedDate = getFormattedDate();

  // Helper to get filter display text
  const getFilterText = () => {
    if (filter.type === 'projects') {
      return filter.context === 'assigned' 
        ? 'Delegated Projects' 
        : 'Authored Projects';
    } else {
      return filter.context === 'assigned' 
        ? 'Delegated Tasks'
        : 'Authored Tasks';
    }
  };

   return (
    <div className={`flex-1 min-h-screen ${darkMode ? 'bg-zinc-800 text-gray-200' : 'bg-white text-gray-800'}`}>
      {/* Modal component */}
      {modalVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`p-6 rounded-lg shadow-lg max-w-sm w-full ${darkMode ? 'bg-zinc-700' : 'bg-white'}`}>
            <p className="mb-4">{modalMessage}</p>
            <div className="flex justify-end">
              <button 
                onClick={() => setModalVisible(false)}
                className={`px-4 py-2 rounded ${darkMode ? 'bg-purple-600 text-white' : 'bg-purple-200 text-gray-800'}`}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

   {/* Confirmation modal for pending tasks */}
    {pendingToMove && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className={`p-6 rounded-lg shadow-lg max-w-sm w-full ${darkMode ? 'bg-zinc-700' : 'bg-white'}`}>
          <p className="mb-4">Move this task to your To Do list?</p>
          <div className="flex justify-end space-x-2">
            <button 
              onClick={() => setPendingToMove(null)}
              className={`px-4 py-2 rounded ${darkMode ? 'bg-gray-600' : 'bg-gray-200'}`}
            >
              Cancel
            </button>
            <button 
              onClick={movePendingToTodo}
              className={`px-4 py-2 rounded ${darkMode ? 'bg-purple-600 text-white' : 'bg-purple-200 text-gray-800'}`}
            >
              Move
            </button>
          </div>
        </div>
      </div>
    )}

  <div className={`transition-all duration-200 pt-7 pr-5 ${isSidebarOpen ? 'ml-[30px]' : 'ml-[30px]'}`}>
    <div className="flex justify-between items-start ml-3 mt-4 mb-8 ">
      {/* Left-aligned greeting section */}
      <div>
        <h1 className="text-3xl font-bold ">{greeting}, user!</h1>
        <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>{formattedDate}</p>
      </div>

  {/* Right-aligned filter */}
    <div className="flex items-center mt-4 rounded-lg mr-8">
        <span className={`mr-2 text-sm font-semibold font-sans rounded-lg flex items-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          {getFilterText()}
        </span>
        <div className="relative" ref={filterRef}>
          <button 
            className={`px-3 py-1 rounded-lg flex items-center ${darkMode ? 'bg-zinc-700' : 'bg-purple-300'}`}
            onClick={() => setShowFilterOptions(!showFilterOptions)}
          >
            Filter
          </button>
    <AnimatePresence>
    {showFilterOptions && (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className={`absolute right-0 mt-2 w-48 shadow-lg rounded-lg overflow-hidden border z-50 ${darkMode ? "bg-zinc-800 border-gray-700" : "bg-white border-gray-200"}`}
    >
      <div className="py-2">
        {/* Projects Section */}
        <div className="px-4 py-2">
          <div 
            className="flex items-center justify-between cursor-pointer"
            onClick={() => setShowProjectsDropdown(!showProjectsDropdown)}
          >
            <div className="flex items-center">
              <Folder size={14} className="mr-3" />
              <span className="font-medium">Projects</span>
            </div>
            <ChevronDown
              size={18}
              className={`transition-transform ${showProjectsDropdown ? "rotate-180" : "rotate-0"}`}
            />
          </div>
          {showProjectsDropdown && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="ml-4 mt-2 space-y-2"
            >
              <button
                className={`w-full text-left py-2 px-4 rounded-md ${darkMode ? 'hover:bg-zinc-700' : 'hover:bg-gray-100'}`}
                onClick={() => {
                  setFilter({ type: 'projects', context: 'assigned' });
                  setShowFilterOptions(false);
                }}
              >
                <div className="flex items-center">
                  <ClipboardCheck size={20} className="mr-2" />
                  Delegated Projects
              </div>
          </button>
                      
          <button className={`w-full text-left py-2 px-4 rounded-md ${darkMode ? 'hover:bg-zinc-700' : 'hover:bg-gray-100'}`}
            onClick={() => {
              setFilter({ type: 'projects', context: 'created' });
              setShowFilterOptions(false);
            }}
          >
            <div className="flex items-center">
              <FileEdit size={20} className="mr-2" />
              Authored Projects
            </div>
          </button>
        </motion.div>
      )}
    </div>
    {/* Tasks Section */}
    <div className="px-4 py-2">
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setShowTasksDropdown(!showTasksDropdown)}
      >
        <div className="flex items-center">
          <List size={14} className="mr-3" />
          <span className="font-medium">Tasks</span>
        </div>
        <ChevronDown
          size={18}
          className={`transition-transform ${showTasksDropdown ? "rotate-180" : "rotate-0"}`}
        />
      </div>
      {showTasksDropdown && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="ml-4 mt-2 space-y-2"
        >
          <button
            className={`w-full text-left py-2 px-4 rounded-md ${darkMode ? 'hover:bg-zinc-700' : 'hover:bg-gray-100'}`}
            onClick={() => {
              setFilter({ type: 'tasks', context: 'assigned' });
              setShowFilterOptions(false);
            }}
          >
            <div className="flex items-center">
              <ClipboardCheck size={20} className="mr-2" />
              Delegated Tasks
            </div>
          </button>
      
       <button
        className={`w-full text-left py-2 px-4 rounded-md ${darkMode ? 'hover:bg-zinc-700' : 'hover:bg-gray-100'}`}
        onClick={() => {
          setFilter({ type: 'tasks', context: 'created' });
          setShowFilterOptions(false);
        }}
      >
        <div className="flex items-center">
          <FileEdit size={20} className="mr-2" />
          Authored Tasks
        </div>
      </button>
    </motion.div>
    )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  </div>
</div>
        
{/* Task/Project Summary Cards */}
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 ${filter.type === 'projects' && filter.context === 'assigned' ? 'lg:grid-cols-5' : ''}`}>
      {filter.type === 'tasks' ? (
        <>
          <Link 
            to="/dashboard/member/TasksList" 
            state={{ 
              subtasks: allSubtasks,
              title: "All Tasks",
              filter: 'all',
              context: filter.context, 
              darkMode 
            }}
            className="block"
          >
            <SummaryCard 
              title="Total Tasks" 
              value={taskStats.total} 
              icon={<List size={20} />}
              color={PURPLE_PRIMARY}
              darkMode={darkMode}
            />
          </Link>
              
          <Link 
            to="/dashboard/member/TasksList" 
            state={{ 
              subtasks: allSubtasks.filter(s => s.status === 'to-do'),
              title: "To Do Tasks",
              filter: 'to-do',
              context: filter.context, 
              darkMode 
            }}
            className="block"
          >
            <SummaryCard 
              title="To Do"
              value={taskStats.pending} 
              icon={<Clock size={20} />}
              color={PURPLE_PRIMARY}
              darkMode={darkMode}
            />
          </Link>
              
          <Link 
            to="/dashboard/member/TasksList" 
            state={{ 
              subtasks: allSubtasks.filter(s => s.status === 'in-progress'),
              title: "In Progress Tasks",
              filter: 'in-progress',
              context: filter.context, 
              darkMode 
            }}
            className="block"
          >
            <SummaryCard

              title="In Progress" 
              value={taskStats.inProgress} 
              icon={<RefreshCw size={20} />}
              color={PURPLE_PRIMARY}
              darkMode={darkMode}
            />
          </Link>
              
          <Link 
            to="/dashboard/member/TasksList" 
            state={{ 
              subtasks: allSubtasks.filter(s => s.status === 'completed'),
              title: "Completed Tasks",
              filter: 'completed',
              context: filter.context, 
              darkMode 
            }}
            className="block"
          >
            <SummaryCard 
              title="Completed" 
              value={taskStats.completed}

              icon={<CheckCircle size={20} />}
              color={PURPLE_PRIMARY}
              darkMode={darkMode}
            />
          </Link>
        </>
          ) : (
            <>
              <SummaryCard 
                title="Total Projects" 
                value={projectStats.total} 
                icon={<Folder size={20} />}
                color={PURPLE_PRIMARY}
                darkMode={darkMode}
              />
              
              <SummaryCard 
                title="Active Projects" 
                value={projectStats.active} 
                icon={<RefreshCw size={20} />}
                color={PURPLE_PRIMARY}
                darkMode={darkMode}
              />
              
              <SummaryCard 
                title="Completed Projects" 
                value={projectStats.completed} 
                icon={<CheckCircle size={20} />}
                color={PURPLE_PRIMARY}
                darkMode={darkMode}
              />
              
              <SummaryCard 
                title="On Hold Projects" 
                value={projectStats.onHold} 
                icon={<Clock size={20} />}
                color={PURPLE_PRIMARY}
                darkMode={darkMode}
              />
           </>
          )}
        </div>
        
    
{filter.type === 'tasks' ? (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
    {/* Show Incoming Tasks only for delegated tasks */}
    {filter.context === 'assigned' && (
      <div className={`rounded-lg p-4 ${darkMode ? 'bg-zinc-700' : 'bg-white shadow'}`}>
        <div className="flex items-center mb-4">
          <div className="p-2 rounded-lg mr-3">
            <Bell size={20} className="text-purple-500" />
          </div>
          <h2 className="text-xl font-bold">Incoming Tasks</h2>
        </div>
              
      <div className="space-y-3">
          {pendingTasks.length === 0 ? (
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-center py-4`}>No Incoming tasks</p>
          ) : (
            pendingTasks.map((task, index) => (
              <div 
                key={`pending-${index}`}
                className={`flex items-center justify-between p-1 rounded-lg ${darkMode ? 'bg-zinc-700' : 'bg-white'}`}
              >
                <div>
                  <h3 className="font-medium">{task.title}</h3>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{task.projectName}</p>
                </div>
                <button
                  onClick={() => setPendingToMove({ subtaskId: task.subtaskId })}
                  className={`px-3 py-2 text-xs rounded-lg ${darkMode ? 'bg-yellow-600 text-white hover:bg-yellow-700' : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'}`}
                >
                  Move to To Do
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    )}
    {/* Completed Tasks for Confirmation Card */}
      {filter.context === 'created' && (
      <div className={`rounded-lg p-4 ${darkMode ? 'bg-zinc-700' : 'bg-white shadow'}`}>
        <div className="flex items-center mb-4">
          <div className="p-2 rounded-lg mr-3">
            <CheckCircle size={20} className="text-purple-500" />
          </div>
          <h2 className="text-xl font-bold">Confirm Completed Tasks</h2>
        </div>
        
     <div className="space-y-3">
          {completedForConfirmation.length === 0 ? (
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-center py-4`}>No tasks to confirm</p>
          ) : (
            completedForConfirmation.map((task, index) => (
              <div 
                key={`confirm-${index}`}
                className={`flex items-center justify-between p-1 rounded-lg ${darkMode ? 'bg-zinc-700' : 'bg-white'}`}
              >
                <div>
                  <h3 className="font-medium">{task.title}</h3>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{task.projectName}</p>
                </div>
                <button
                  onClick={() => handleConfirmCompleted(task.projectId, task.taskId, task.subtaskId)}
                  className={`flex items-center px-3 py-1 rounded-lg ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-purple-900 hover:bg-purple-700 text-white'}`}
                >
                  Confirm
                </button>
              </div>
                ))
              )}
            </div>
          </div>
        )}
        </div>
      ) : (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
    {/* Show Incoming Projects only for delegated projects */}
    {filter.context === 'assigned' && (
      <div className={`rounded-lg p-4 ${darkMode ? 'bg-zinc-700' : 'bg-white shadow'}`}>
        <div className="flex items-center mb-4">
          <div className="p-2 rounded-lg mr-3">
            <Bell size={20} className="text-purple-500" />
          </div>
          <h2 className="text-xl font-bold">Incoming Projects</h2>
        </div>
        
        <div className="space-y-3">
          {pendingProjects.length === 0 ? (
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-center py-4`}>No Incoming projects</p>
          ) : (
            pendingProjects.map((project, index) => (
              <div 
                key={`pending-project-${index}`}
                className={`flex items-center justify-between p-1 rounded-lg ${darkMode ? 'bg-zinc-700' : 'bg-white'}`}
              >
                 <div>
                  <h3 className="font-medium">{project.title}</h3>
                </div>
                <button
                  onClick={() => handleAcceptProject(project.id)}
                  className={`px-3 py-2 text-xs rounded-lg ${darkMode ? 'bg-yellow-600 text-white hover:bg-yellow-700' : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'}`}
                >
                  Accept Project
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    )}
      {/* Show Completed Projects for Confirmation only for authored projects */}
    {filter.context === 'created' && (
      <div className={`rounded-lg p-4 ${darkMode ? 'bg-zinc-700' : 'bg-white shadow'}`}>
        <div className="flex items-center mb-4">
          <div className="p-2 rounded-lg mr-3">
            <CheckCircle size={20} className="text-purple-500" />
          </div>
          <h2 className="text-xl font-bold">Confirm Completed Projects</h2>
        </div>
        
        <div className="space-y-3">
          {completedProjectsForConfirmation.length === 0 ? (
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-center py-4`}>No projects to confirm</p>
          ) : (
            completedProjectsForConfirmation.map((project, index) => (
              <div 
                key={`confirm-project-${index}`}
                className={`flex items-center justify-between p-1 rounded-lg ${darkMode ? 'bg-zinc-700' : 'bg-white'}`}
              >
                <div>
                  <h3 className="font-medium">{project.title}</h3>
                </div>
                <button
                  onClick={() => handleConfirmProject(project.id)}
                  className={`flex items-center px-3 py-1 rounded-lg ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-purple-900 hover:bg-purple-700 text-white'}`}
                >
                    Confirm
                  </button>
                    </div>
              ))
            )}
          </div>
        </div>
      )}
      </div>
      )}
    {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Task/Project Distribution Chart */}
        
        <ChartCard 
          title={filter.type === 'tasks' ? "Task Distribution" : "Project Status"} 
          darkMode={darkMode}
        >
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={filter.type === 'tasks' ? taskDistributionData : projectStatusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              
              >
                {(filter.type === 'tasks' ? taskDistributionData : projectStatusData).map((_entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={PURPLE_PALETTE[index % PURPLE_PALETTE.length]} 
                  />
                ))}
              </Pie>
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
          
          {/* Task/Project Priority Chart */}
          <ChartCard 
            title={filter.type === 'tasks' ? "Task Priority Level" : "Project Priority Level"} 
            darkMode={darkMode}
          >
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={filter.type === 'tasks' ? taskPriorityData : projectPriorityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar 
                  dataKey="value" 
                  name={filter.type === 'tasks' ? "Tasks" : "Projects"} 
                  fill='#663399'     
                />    
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
        
{/* Recent Tasks/Projects Section */}
  <div className={`rounded-lg p-4 ${darkMode ? 'bg-zinc-700' : 'bg-gray-50'}`}> 
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-xl font-bold ml-3">
        {filter.type === 'tasks' 
          ? 'Recently Viewed Tasks' 
          : 'Recently Viewed Delegated Projects'
        }
      </h2>
      <Link 
        to={
          filter.type === 'tasks' 
            ? filter.context === 'assigned' 
              ? "tasks/delegated" 
              : "tasks/authored"
            : "projects/delegated" 
        }
        className="flex items-center ml-12 text-gray-700 dark:text-gray-200"
      >
        See All <ChevronRight size={16} />
      </Link>
    </div>
        
<div className="space-y-3">
  {filter.type === 'tasks' ? (
    recentTasks[filter.context].map((recent, index) => {
      const project = projects.find(p => p.id === recent.projectId);
      const task = tasksData[recent.projectId as keyof typeof tasksData]?.find(t => t.id === recent.taskId);
      
      if (!project || !task) return null;
      
      return (
        <div 
          key={`recent-${index}`}
          className={`flex items-center justify-between p-3 rounded-lg ${darkMode ? 'bg-zinc-600' : 'bg-white'}`}
        >
          <div className="flex items-center">
            <div>
              <h3 className="font-medium">{task.title}</h3>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{project.name}</p>
            </div>
          </div>
          <div className="flex items-center">
            <div className="flex items-center mr-4">
              <span className="text-sm">
                {task.subtasks[0].priority} Priority
              </span>
            </div>
            <span className={`px-2 py-1 text-xs rounded-md ${task.subtasks[0].status === 'completed' ? (darkMode ? 'bg-green-800 text-green-100' : 'bg-green-100 text-green-800') : task.subtasks[0].status === 'in-progress' ? (darkMode ? 'bg-yellow-800 text-yellow-100' : 'bg-yellow-100 text-yellow-800') : (darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-800')}`}>
              {task.subtasks[0].status.replace('-', ' ')}
            </span>
          </div>
        </div>
      );
    })
            ) : (
               filteredProjects.slice(0, 3).map((project, index) => {
                return (
                  <div 
                    key={`project-${index}`}
                    className={`p-4 rounded-lg ${darkMode ? 'bg-zinc-600' : 'bg-white'} shadow-sm`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{project.name}</h3>
                        <p className={`text-sm truncate ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {project.description}
                        </p>
                         </div>
                      </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
