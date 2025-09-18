import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Clock, CheckCircle, List, ChevronRight, RefreshCw, Bell } from 'lucide-react'; 
import { tasksData, projects } from '@/pages/MemberSidebarPages/MockData'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

// Add user constant (current user)
const CURRENT_USER = 'Mahlet';

// Color constants
const PURPLE_PRIMARY = '#7e22ce';

const PURPLE_PALETTE = [
  '#7e22ce', // Primary purple (darkest)
  '#a855f7', // Medium purple
  '#d8b4fe', // Secondary purple (lightest)
  '#ede9fe'  // Very light purple
];

// Helper function to get greeting based on time
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

const formattedDate = getFormattedDate();

// Chart Card Component
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

const Home = ({ darkMode, isSidebarOpen }: { darkMode: boolean; isSidebarOpen: boolean }) => {
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
        // Add filter state
    const [filter, setFilter] = useState<'assigned' | 'created'>('assigned');
    
    // Add states for pending tasks and completed tasks for confirmation
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

    const showModal = (message: string) => {
    setModalMessage(message);
    setModalVisible(true);
    setTimeout(() => setModalVisible(false), 2000); 
  };
    
  

     // Get all tasks and subtasks
  
    const allSubtasks = allTasks.flatMap(task => task.subtasks);


    // Get filtered subtasks based on selected filter
    const filteredSubtasks = allSubtasksState.filter(subtask => 
       filter === 'assigned' 
          ? subtask.assignee === CURRENT_USER 
          : subtask.creator === CURRENT_USER
      
    );
  // Task statistics based on filter
    const taskStats = {
      total: filteredSubtasks.length,
      pending: filteredSubtasks.filter(s => s.status === 'to-do').length,
      inProgress: filteredSubtasks.filter(s => s.status === 'in-progress').length,
      completed: filteredSubtasks.filter(s => s.status === 'completed').length
    };
    
    // Task distribution data based on filter
    const distributionData = [
      { name: 'Completed', value: taskStats.completed },
      { name: 'In Progress', value: taskStats.inProgress },
      { name: 'To Do', value: taskStats.pending }, // Changed from 'Pending'
    ];
  
  // Priority distribution data based on filter
  const priorityData = [
    { name: 'High', value: filteredSubtasks.filter(s => s.priority === 'High').length },
    { name: 'Medium', value: filteredSubtasks.filter(s => s.priority === 'Medium').length }, 
    { name: 'Low', value: filteredSubtasks.filter(s => s.priority === 'Low').length },
  ];
  
    // Get recently viewed tasks and accepted tasks
     useEffect(() => {
      setRecentTasks({
        assigned: [ // Tasks assigned to current user
          { projectId: '1', taskId: '1-1' },
          { projectId: '2', taskId: '2-1' },
          { projectId: '3', taskId: '3-1' },
        ],
        created: [ // Tasks created by current user
          { projectId: '1', taskId: '1-2' },
          { projectId: '2', taskId: '2-1' },
          { projectId: '3', taskId: '3-1' },
        ]
      });
      
      // Add mock data for pending tasks
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
      
      // Add mock data for completed tasks for confirmation
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
    }, []);


    
   // Function to confirm completed task
    const handleConfirmCompleted = (projectId: string, taskId: string, subtaskId: string) => {
      // Remove from confirmation list
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
        
        // Update subtask status in state
        setAllSubtasksState(prev => 
            prev.map(subtask => 
                subtask.id === pendingToMove.subtaskId 
                    ? { ...subtask, status: 'to-do' } 
                    : subtask
            )
        );

        // Remove from pending tasks
        setPendingTasks(pendingTasks.filter(t => t.subtaskId !== pendingToMove.subtaskId));
        
        showModal("Task moved to To Do list");
        setPendingToMove(null);
    };
    // Get greeting message
    const greeting = getGreeting();


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
              <h1 className="text-3xl font-bold ">{greeting}, Mahlet!</h1>
              <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>{formattedDate}</p>
           </div>
 
          {/* Right-aligned filter */}
          <div className="flex items-center mr-24 mt-4 rounded-lg">
            <span className="mr-2 font-medium rounded-lg ">
              {filter === 'assigned' ? 'Assigned to Me' : 'Created by Me'}
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button 
                  className={`px-4 py-1 rounded-lg ${darkMode ? 'bg-zinc-700 ' : 'bg-purple-200 ' }`}
                >
                  Filter
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent >
                <DropdownMenuItem 
                  onClick={() => setFilter('assigned')}>
                    Assigned to Me
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setFilter('created')}>
                    Created by Me
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        {/* Task Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Link 
              to="/dashboard/member/TasksList" 
              state={{ 
                subtasks: allSubtasks,
                title: "All Tasks",
                filter: 'all',
                context: filter, 
                darkMode 
              }}
              className="block">


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
                title: "To Do Tasks", // Changed from "Pending Tasks"
                filter: 'to-do',
                context: filter, 
                darkMode 
              }}
              className="block"
            >
              <SummaryCard 
                title="To Do" // Changed from "Pending"
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
               context: filter, 
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
                context: filter, 
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
          </div>
          
          {/* NEW CARDS: Pending Tasks and Completed Tasks for Confirmation */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Pending Tasks Card */}
            <div className={`rounded-lg p-4 ${darkMode ? 'bg-zinc-700' : 'bg-white shadow'}`}>
              <div className="flex items-center mb-4">
                <div className=" p-2 rounded-lg mr-3">
                  <Bell size={20} className="text-purple-500" />
                </div>
                <h2 className="text-xl font-bold">Pending Tasks</h2>
              </div>
              
              <div className="space-y-3">
                {pendingTasks.length === 0 ? (
                  <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-center py-4`}>No pending tasks</p>
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
                                className={`px-3 py-2 text-xs rounded-lg ${
                                    darkMode 
                                        ? ' text-white hover:bg-yellow-700' 
                                        : ' text-yellow-800 hover:bg-yellow-200'
                                }`}

                            >
                                Move to To Do
                            </button>
                    </div>
                  ))
                )}
              </div>
            </div>
            
            {/* Completed Tasks for Confirmation Card */}
            <div className={`rounded-lg p-4 ${darkMode ? 'bg-zinc-700' : 'bg-white shadow'}`}>
              <div className="flex items-center mb-4">
                <div className=" p-2 rounded-lg mr-3">
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
          </div>
       {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Task Distribution Chart */}
            <ChartCard 
              title="Task Distribution" 
              darkMode={darkMode}
            >
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={distributionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {distributionData.map((_entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={PURPLE_PALETTE[index % PURPLE_PALETTE.length]} 
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
            
            {/* Task Priority Chart */}
            <ChartCard 
              title="Task Priority Level" 
              darkMode={darkMode}
            >
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={priorityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar 
                    dataKey="value" 
                    name="Tasks" 
                    fill='#ede9fe'
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
          
          {/* Recent Tasks Section */}
          <div className={`rounded-lg p-4 ${darkMode ? 'bg-zinc-700' : 'bg-gray-50'}`}>

            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold ml-3">Recently Viewed Tasks</h2>
              <Link 
                to="/dashboard/member/TaskBoard" 
                className="flex items-center ml-12 text-gray-700 dark:text-gray-200 "
              >
                See All <ChevronRight size={16} />
              </Link>
            </div>
            
            <div className="space-y-3">
              {recentTasks[filter].map((recent, index) => {
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
                      <span className={`px-2 py-1 text-xs rounded-md ${
                        task.subtasks[0].status === 'completed' ? 'bg-green-100 text-green-800' :
                        task.subtasks[0].status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {task.subtasks[0].status.replace('-', ' ')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    
  );
};

// Summary Card Component
const SummaryCard = ({ 
  title, 
  value, 
  icon, 
  color,
  darkMode 
}: { 
  title: string; 
  value: number; 
  icon: React.ReactNode;
  color: string;
  darkMode: boolean;
}) => (
  <div className={`p-4 rounded-lg flex items-center ${darkMode ? 'bg-zinc-700' : 'bg-white shadow'}`}>
    <div 
      className="w-10 h-10 rounded-lg flex items-center justify-center mr-4" 
     
    >
      <div style={{ color }}>{icon}</div>
    </div>
    <div>
      <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>{title}</p>
      <p className="text-2xl font-bold" style={{ color: darkMode ? 'text-gray-200' : 'text-gray-700' }}>{value}</p>
    </div>
  </div>
);

export default Home;
