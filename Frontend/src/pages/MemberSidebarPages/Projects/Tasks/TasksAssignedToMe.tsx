/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { Calendar, Flag, UserCircle, Paperclip, X, Edit, Trash2, CheckCircle, RefreshCw, Circle,  MoreVertical,  ChevronLeft } from 'lucide-react';
import { projects, tasks } from '../../MockData2';
import { useLocation } from 'react-router-dom';

// Add new issue types
type IssueType = 'Subtask' | 'Bug'  | 'Story' | 'Epic';

type Task = {
  id: string;
  projectId: string;
  title: string;
  description: string;
  dueDate: string;
  assumedKickoff: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'to-do' | 'in-progress' | 'completed';
  team: string;
  files: string[];
  assignedBy: string;
  subtasks: Subtask[];
  archived: boolean;
};

type Subtask = {
  id: string;
  title: string;
  completed: boolean;
  weight: number;
  issueType: IssueType;
  assignee?: string; // Added
  creator?: string; // Added
};

// Add issue type colors
const ISSUE_TYPE_COLORS = {
  'Subtask': 'bg-blue-100 text-blue-800',
  'Bug': 'bg-red-100 text-red-800',
  'Story': 'bg-purple-100 text-purple-800',
  'Epic': 'bg-orange-100 text-orange-800',
};

const ISSUE_TYPE_ICONS = {
  'Subtask': <div className="w-2 h-2 rounded-full bg-gray-500 mr-2"></div>,
  'Bug': <div className="w-2 h-2 rounded-full bg-gray-500 mr-2"></div>,
  'Story': <div className="w-2 h-2 rounded-full bg-gray-500 mr-2"></div>,
  'Epic': <div className="w-2 h-2 rounded-full bg-gray-500 mr-2"></div>,
};

const CURRENT_USER = 'Mahlet';

const STATUS_LABELS = {
  'to-do': 'To Do',
  'in-progress': 'In Progress',
  'completed': 'Completed'
};

const PRIORITY_COLORS = {
  'High': 'bg-red-100 text-red-800',
  'Medium': 'bg-yellow-100 text-yellow-800',
  'Low': 'bg-green-100 text-green-800',
};

const STATUS_COLORS = {
  'to-do': 'bg-red-100 text-red-800 border-red-300',
  'in-progress': 'bg-yellow-100 text-yellow-800 border-yellow-300',
  'completed': 'bg-green-100 text-green-800 border-green-300',
};

const STATUS_ICONS = {
  'to-do': <Circle className="w-3 h-3 mr-1" />,
  'in-progress': <RefreshCw className="w-3 h-3 mr-1" />,
  'completed': <CheckCircle className="w-3 h-3 mr-1" />
};


const TaskBoard = ({ darkMode, isSidebarOpen }: { darkMode: boolean; isSidebarOpen: boolean }) => {
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [subtaskInput, setSubtaskInput] = useState('');
  const [newIssueType, setNewIssueType] = useState<IssueType>('Subtask');
  const [filteredTasks, setFilteredTasks] = useState<Task[]>(
    tasks.map(task => ({
      ...task,
      priority: task.priority as 'Low' | 'Medium' | 'High',
      status: task.status as 'to-do' | 'in-progress' | 'completed',
      assumedKickoff: task.assumedKickoff,
      archived: task.archived ?? false,
      subtasks: task.subtasks.map((subtask: any) => {
        if (typeof subtask === 'object' && subtask !== null) {
          return {
            ...subtask,
            issueType: subtask.issueType ?? 'Task',
          };
        }
        return {
          id: '',
          title: '',
          completed: false,
          weight: 0,
          issueType: 'Subtask',
          ...(typeof subtask === 'string' ? { title: subtask } : {}),
        };
      })
    }))
  );
  const [showEmptySubtaskModal, setShowEmptySubtaskModal] = useState(false);
  const [editingSubtask, setEditingSubtask] = useState<Subtask | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isEditingTask, setIsEditingTask] = useState(false);
  const [editedTask, setEditedTask] = useState<Task | null>(null);
  const [progress, setProgress] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [tasksPerPage] = useState(5);
  const [contextFilter, setContextFilter] = useState<'assigned' | 'created' | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null); // Added for dropdown
  const location = useLocation();
  
  // Add keydown handler for subtask input
  const handleSubtaskKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault(); 
      handleAddSubtask();
    }
  };

  useEffect(() => {
    if (selectedTask) {
      setEditedTask({ ...selectedTask });
      const totalWeight = selectedTask.subtasks.reduce((sum, st) => sum + st.weight, 0);
      const completedWeight = selectedTask.subtasks
        .filter(st => st.completed)
        .reduce((sum, st) => sum + st.weight, 0);
      
      const newProgress = totalWeight > 0 
        ? Math.round((completedWeight / totalWeight) * 100) 
        : selectedTask.subtasks.length > 0 ? 100 : 0;
        
      setProgress(newProgress);
    }
  }, [selectedTask]);

  useEffect(() => {
    let result = tasks;

    result = result.filter(task => !task.archived);
    
    if (selectedProject) {
      result = result.filter(task => task.projectId === selectedProject);
    }
    
    if (statusFilter !== 'all') {
      result = result.filter(task => task.status === statusFilter);
    }

    // Context filter (fixed)
    if (contextFilter) {
      result = result.filter(task => {
        return task.subtasks.some((subtask) => {
          if (contextFilter === 'assigned') {
            return subtask.assignee === CURRENT_USER;
          } else if (contextFilter === 'created') {
            return subtask.creator === CURRENT_USER;
          }
          return true;
        });
      });
    }
    
    setFilteredTasks(
      result.map(task => ({
        ...task,
        priority: task.priority as 'Low' | 'Medium' | 'High',
        status: task.status as 'to-do' | 'in-progress' | 'completed',
        assumedKickoff: task.assumedKickoff,
        archived: task.archived ?? false,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        subtasks: task.subtasks.map((subtask: any) => ({
          ...subtask,
          issueType: subtask.issueType ?? 'Task'
        }))
      }))
    );
  }, [selectedProject, statusFilter, contextFilter]);


  useEffect(() => {
    // Handle state passed from Home
    if (location.state) {
      const { filter, context } = location.state;
      
      if (filter && filter !== 'all') {
        setStatusFilter(filter);
      }
      
      if (context) {
        setContextFilter(context);
      }
    }
  }, [location.state]);

  // Archive task function (added)
  const handleArchiveTask = (taskId: string) => {
    const updatedTasks = filteredTasks.map(task => 
      task.id === taskId ? { ...task, archived: true } : task
    ).filter(task => !task.archived);
    
    setFilteredTasks(updatedTasks);
    setOpenDropdownId(null);
    
    if (selectedTask && selectedTask.id === taskId) {
      setSelectedTask(null);
    }
  };

  const handleAddSubtask = () => {
    if (!subtaskInput.trim()) {
      setShowEmptySubtaskModal(true);
      return;
    }
    if (selectedTask && editedTask) {
      const newSubtask: Subtask = {
        id: `${selectedTask.id}-${selectedTask.subtasks.length + 1}`,
        title: subtaskInput,
        completed: false,
        weight: 0,
        issueType: newIssueType
      };
      
      const updatedSubtasks = [...editedTask.subtasks, newSubtask];
      const updatedTask = { ...editedTask, subtasks: updatedSubtasks };
      setEditedTask(updatedTask);
      
      const completedSubtasks = updatedTask.subtasks.filter(st => st.completed).length;
      const totalSubtasks = updatedTask.subtasks.length;
      const newProgress = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;
      setProgress(newProgress);
      
      setSubtaskInput('');
      setNewIssueType('Subtask');
    }
  };

  const handleEditSubtask = (subtask: Subtask) => {
    setEditingSubtask(subtask);
  };

  const saveEditedSubtask = () => {
    if (editingSubtask && editedTask) {
      const updatedSubtasks = editedTask.subtasks.map(st => 
        st.id === editingSubtask.id ? { ...st, title: editingSubtask.title, weight: editingSubtask.weight } : st
      );
      const updatedTask = { ...editedTask, subtasks: updatedSubtasks };
      setEditedTask(updatedTask);
      
      const completedSubtasks = updatedTask.subtasks.filter(st => st.completed).length;
      const totalSubtasks = updatedTask.subtasks.length;
      const newProgress = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;
      setProgress(newProgress);
      
      setEditingSubtask(null);
    }
  };

  const handleDeleteSubtask = (subtaskId: string) => {
    if (editedTask) {
      const updatedSubtasks = editedTask.subtasks.filter(st => st.id !== subtaskId);
      const updatedTask = { ...editedTask, subtasks: updatedSubtasks };
      setEditedTask(updatedTask);
      
      const completedSubtasks = updatedTask.subtasks.filter(st => st.completed).length;
      const totalSubtasks = updatedTask.subtasks.length;
      const newProgress = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;
      setProgress(newProgress);
    }
  };

  const saveTaskChanges = () => {
    if (editedTask) {
      const allSubtasksCompleted = editedTask.subtasks.length > 0 && 
        editedTask.subtasks.every(st => st.completed);
      
      const updatedTask = allSubtasksCompleted ? 
        { ...editedTask, status: 'completed' } : 
        editedTask;
      
      const updatedTasks = tasks.map(task => 
        task.id === updatedTask.id ? updatedTask : task
      );
      
      setFilteredTasks(
        updatedTasks.map(task => ({
          ...task,
          priority: task.priority as 'Low' | 'Medium' | 'High',
          status: task.status as 'to-do' | 'in-progress' | 'completed',
          subtasks: task.subtasks.map((subtask: any) => ({
            ...subtask,
            issueType: subtask.issueType ?? 'Task'
          }))
        }))
      );
      setSelectedTask({ ...updatedTask, status: updatedTask.status as 'to-do' | 'in-progress' | 'completed' });
      setIsEditingTask(false);
    }
  };


  const handleSubtaskToggle = (subtaskId: string) => {
    if (!editedTask) return;
    
    const updatedSubtasks = editedTask.subtasks.map(st => 
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    );
    
    const updatedTask = { ...editedTask, subtasks: updatedSubtasks };
    setEditedTask(updatedTask);
    
    const completedSubtasks = updatedTask.subtasks.filter(st => st.completed).length;
    const totalSubtasks = updatedTask.subtasks.length;
    const newProgress = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;
    setProgress(newProgress);
    
    const allSubtasksCompleted = totalSubtasks > 0 && 
      completedSubtasks === totalSubtasks;
    
    if (allSubtasksCompleted) {
      const statusUpdatedTask = { ...updatedTask, status: 'completed' as 'to-do' | 'in-progress' | 'completed' };
      setEditedTask(statusUpdatedTask);
    }
  };

    const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
   // Pagination logic
  const indexOfLastTask = currentPage * tasksPerPage;
  const indexOfFirstTask = indexOfLastTask - tasksPerPage;
  const currentTasks = filteredTasks.slice(indexOfFirstTask, indexOfLastTask);
  const totalPages = Math.ceil(filteredTasks.length / tasksPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);


  const renderTaskTable = () => {
    if (filteredTasks.length === 0) {
      return (
        <div className={`flex flex-col items-center justify-center py-12 px-4 rounded-lg  ${
          darkMode ? 'bg-zinc-700' : 'bg-white'} border`}>
          <div className="bg-gray-200 dark:bg-zinc-600 border-dashed rounded-full w-16 h-16 flex items-center justify-center mb-4">
            <div className="bg-gray-300 dark:bg-zinc-500 border-2 border-dashed rounded-xl w-8 h-8"></div>
          </div>
          <h3 className="text-xl font-bold mb-2">
            No tasks found 
          </h3>
          <p className={`text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'} max-w-md`}>
            Try adjusting your filters or create new tasks.
          </p>
        </div>
      );
    }
    
    return (
      <div className={`overflow-x-auto border rounded-lg ${darkMode ? 'border-zinc-600' : 'border-gray-200'}`}>
        <table className={`table-auto w-full rounded-lg ${darkMode ? 'bg-zinc-700 text-gray-200' : 'bg-white text-gray-800'}`}>
          <thead>
            <tr className={` ${darkMode ? 'bg-zinc-800' : 'bg-gray-100'}`}>
              <th className="p-4 text-left w-2/6">Task</th>
              <th className="p-4 text-left w-1/6">Project</th>
              <th className="p-4 text-left w-1/6">Status</th>
              <th className="p-4 text-left w-1/6">Due Date</th>
              <th className="p-4 text-left w-1/6">Kickoff Date</th>
              <th className="p-4 text-left w-1/6"></th>
            </tr>
          </thead>
          <tbody>
            {currentTasks.map(task => (
              <tr 
                key={task.id} 
                onClick={() => {
                  setSelectedTask(task);
                  setIsEditingTask(false);
                }}
        
                className={`cursor-pointer ${darkMode ? 'hover:bg-zinc-600' : 'hover:bg-gray-50'} border-t ${darkMode ? 'border-zinc-600' : 'border-gray-200'}`}>
                <td className="px-5 py-2">
                  <div className="flex flex-col">
                    <span className="font-medium">{task.title}</span>
                   
                  </div>
                </td>
                 <td className="px-3 py-2 text-sm whitespace-nowrap">
                  {projects.find(p => p.id === task.projectId)?.name}
                </td>
                <td className="px-3 py-2 text-sm whitespace-nowrap">
                  <span className={`text-xs px-2 py-1 rounded-md flex items-center w-fit ${STATUS_COLORS[task.status]}`}>

                    {STATUS_ICONS[task.status]}
                    {STATUS_LABELS[task.status]}
                  </span>
                </td>
                 <td className="px-3 py-2 text-sm whitespace-nowrap">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1"/>
                    {formatDate(task.dueDate)}
                  </div>
                </td>
                 <td className="px-3 py-2 text-sm whitespace-nowrap">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1"/>
                    {formatDate(task.assumedKickoff)}
                  </div>
                </td>
                {/* Actions cell with dropdown */}
                <td className="px-3 py-2 text-sm whitespace-nowrap relative">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenDropdownId(openDropdownId === task.id ? null : task.id);
                    }}
                    className="text-gray-500 hover:text-gray-500"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  {openDropdownId === task.id && (
                    <div className={`absolute right-0 mt-2 w-48 rounded-md shadow-lg z-10 ${darkMode ? 'bg-zinc-700' : 'bg-white'} ring-1 ring-black ring-opacity-5`}>
                      <div className="py-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleArchiveTask(task.id);
                          }}
                          className={`block w-full text-left px-4 py-2 text-sm ${darkMode ? 'text-gray-200 hover:bg-zinc-600' : 'text-gray-700 hover:bg-gray-100'}`}
                        >
                          Archive
                        </button>
                      </div>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      
       {/* Pagination */}
        {totalPages > 1 && (
          <div className={`w-auto flex justify-between items-center py-3 px-4 ${darkMode ? 'bg-zinc-800' : 'bg-gray-50'}`}>
            <span className="text-xs">
              Showing {indexOfFirstTask + 1} to {Math.min(indexOfLastTask, filteredTasks.length)} of {filteredTasks.length} tasks
            </span>
            <div className="flex space-x-1 ">
              <button
                disabled={currentPage === 1}
                onClick={() => paginate(currentPage - 1)}
                className={`px-3 py-1 rounded text-sm ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''} ${darkMode ? 'bg-zinc-700 hover:bg-zinc-600' : 'bg-gray-200 hover:bg-gray-300'}`}
              >
                Previous
              </button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => paginate(page)}
                  className={`px-3 py-1 rounded  text-sm before:${page === currentPage ? darkMode ? 'bg-gray-700' : 'bg-gray-200' : darkMode ? 'bg-zinc-700 hover:bg-zinc-600' : 'bg-gray-200 hover:bg-gray-300'}`}
                >
                  {page}
                </button>
              ))}
               <button
                disabled={currentPage === totalPages}
                onClick={() => paginate(currentPage + 1)}
                className={`px-3 py-1 rounded text-sm ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''} ${darkMode ? 'bg-zinc-700 hover:bg-zinc-600' : 'bg-gray-200 hover:bg-gray-300'}`}
                 >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
      
     );
    };
  const renderTaskDetails = () => {
    if (!selectedTask) return null;
    
  const task = isEditingTask && editedTask ? editedTask : selectedTask;
        
  return (

    <div className={`flex-1 min-h-screen  ${darkMode ? 'bg-zinc-800 text-gray-200' : 'bg-white text-gray-800'}`}>
      <div className={`transition-all duration-200 mt-3 ${isSidebarOpen ? 'ml-[20px]' : 'ml-[20px]'}`}>
        <div className="flex items-center mb-6">
          <button 
            onClick={() => setSelectedTask(null)}
            className={`mr-4 `}>
              <ChevronLeft className="w-6 h-6 "/>
          </button>
          <h2 className="text-2xl font-bold ">
            {isEditingTask ? (
              <input
                type="text"
                value={task.title}
                onChange={(e) => editedTask && setEditedTask({...editedTask, title: e.target.value})}
                className={`w-full p-2 rounded-lg `}
              />
            ) : (
              task.title
            )}
          </h2>
        </div>
          <div className="flex flex-col gap-2 mb-6 ">
            {isEditingTask ? (
              <select
                value={task.priority}
                onChange={(e) => editedTask && setEditedTask({...editedTask, priority: e.target.value as 'Low' | 'Medium' | 'High'})}
                className={` px-3 py-1 rounded-lg w-fit ml-3 ${darkMode ? 'bg-zinc-700' : 'bg-gray-100'}`}
              >
                <option value="Low">Low Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="High">High Priority</option>
              </select>
            ) : (
              <div className={`px-3 py-1 ml-3 rounded-md flex items-center w-fit ${PRIORITY_COLORS[task.priority]}`}>
                <Flag className="w-4 h-4 mr-4"/>
                {task.priority} Priority
              </div>
            )}
            
            <div className={`py-2 rounded-md ml-5`}><span className="font-bold">Project Name:</span> {  }
              {projects.find(p => p.id === task.projectId)?.name}
            </div>
          </div>
          
         <div className="flex flex-col lg:flex-row w-full ">
            {/* Left side - Task details */}
            <div className="lg:w-1/2 lg:pr-6 ml-3">
               <div className="mb-6 ">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium">Task Progress</span>
                  <span className="lg:mr-px text-sm font-medium">{progress}%</span>
                </div>
                <div className={`lg:w-auto h-2 rounded-full ${darkMode ? 'bg-zinc-700' : 'bg-gray-200'}`}>
                  <div 
                    className={` h-2 rounded-full ${progress === 100 ? 'bg-green-400' : 'bg-green-300'}`}
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="font-bold mb-2">Description</h3>
                {isEditingTask ? (
                  <textarea
                    value={task.description}
                    onChange={(e) => editedTask && setEditedTask({...editedTask, description: e.target.value})}
                    className={`lg:w-2/3 p-3 rounded-lg  ${darkMode ? 'bg-zinc-700' : 'bg-white'}`}
                  />
                ) : (
                  <p className={`p-3 rounded-lg ${darkMode ? 'bg-zinc-700 text-gray-200' : 'bg-white text-gray-700'}`}>
                    {task.description}
                  </p>
                )}
              </div>
              
              <div className="mb-6">
                <h3 className="font-bold mb-2">Details</h3>
                <div className={`lg:w-auto p-3 rounded-lg ${darkMode ? 'bg-zinc-700 text-gray-200' : 'bg-gray-100 text-gray-700'}`}>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-1`}>
                        Assigned By
                      </h4>
                      <p className="flex items-center">
                        <UserCircle className="w-4 h-4 mr-2"/>

                        {task.assignedBy}
                      </p>
                    </div>
                    
                    <div>
                      <h4 className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-1`}>Due Date</h4>
                      <p className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        {isEditingTask ? (
                          <input
                            type="date"
                            value={task.dueDate}
                            onChange={(e) => editedTask && setEditedTask({...editedTask, dueDate: e.target.value})}
                            className={`p-1 rounded ${darkMode ? 'bg-zinc-800' : 'bg-white'}`}
                          />
                        ) : (
                          formatDate(task.dueDate)
                        )}
                      </p>
                    </div>

                    <div className="col-span-2 w-fit">
                      <h4 className={`text-sm  ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-1`}>Status</h4>
                      {isEditingTask ? (
                        <div className="flex space-x-2">
                          {(['to-do', 'in-progress', 'completed'] as const).map(status => (
                            <button
                              key={status}
                              onClick={() => editedTask && setEditedTask({...editedTask, status})}
                              className={`px-3 py-1 rounded-md flex items-center ${
                                task.status === status ?
                                `${
                                  status === 'to-do' ? 'bg-red-200 text-white' :
                                  status === 'in-progress' ? 'bg-yellow-500 text-white' :
                                  'bg-green-500 text-white'
                                }` : 
                                `${darkMode ? 'bg-zinc-600' : 'bg-gray-200'}`
                              }`}
                            >
                              {status === 'to-do' && <Circle className="w-4 h-4 mr-1" />}
                              {status === 'in-progress' && <RefreshCw className="w-4 h-4 mr-1 " />}
                              {status === 'completed' && <CheckCircle className="w-4 h-4 mr-1" />}
                              {STATUS_LABELS[status]}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <span className={`px-3 py-1 rounded-md flex items-center ${STATUS_COLORS[task.status]}`}>
                          {STATUS_ICONS[task.status]}
                          {STATUS_LABELS[task.status]}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {task.files.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-bold mb-2">Attachments</h3>
                  <div className={`p-3 w-fit rounded-lg ${darkMode ? 'bg-zinc-700 text-gray-200' : 'bg-gray-100 text-gray-700'}`}>
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
            
            {/* Right side - Subtasks */}
            <div className="lg:w-1/2 lg:pl-2">
              <div className={`rounded-xl p-4 ${darkMode ? 'bg-zinc-700' : 'bg-white'}`}>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-xl">Issues</h3>
                </div>
              <div className="space-y-6">

              {/* Add new subtask section */}
              <div>
                <h4 className="text-sm text-gray-500 font-medium mb-3 ">Add New Issue</h4>
                <div className="flex flex-col gap-3">
                  {/* Issue type selector */}
                  <div className="flex gap-2 flex-wrap mb-2">
                    {(['Task', 'Subtask', 'Bug', 'Story', 'Epic'] as IssueType[]).map((type) => (
                      <button
                        key={type}
                        onClick={() => setNewIssueType(type)}
                        className={`px-4 py-1 rounded-lg text-sm flex items-center ${
                          newIssueType === type
                            ? 'bg-zinc-800 text-white'
                            : darkMode
                            ? 'bg-zinc-600 text-gray-200'
                            : 'bg-gray-100 text-gray-700'
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
                        darkMode ? 'bg-zinc-600 border-zinc-500 text-gray-200' : 'bg-white border-gray-200 text-gray-700'
                      } border`}
                    />
                    <button
                      onClick={handleAddSubtask}
                      className="px-3 py-1 bg-purple-900 text-white rounded-lg hover:bg-purple-800 transition-colors">
                      Add
                    </button>
                  </div>
                </div>
              </div>
            
              {/* Subtasks list */}
              <div className="">
                <h4 className="text-sm font-medium mb-3 pr-6 ">Issues List</h4>
                {task.subtasks.length > 0 ? (
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-6">
                  {task.subtasks.map((subtask) => (
                    <div
                      key={subtask.id}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        darkMode ? 'bg-zinc-600 text-gray-200' : 'bg-white text-gray-700'
                      } border ${darkMode ? 'border-zinc-500' : 'border-gray-200'}`}
                    >
                      {editingSubtask?.id === subtask.id ? (
                        <div className="w-full space-y-2">
                          <input
                            type="text"
                            value={editingSubtask.title}
                            onChange={(e) => setEditingSubtask({...editingSubtask, title: e.target.value})}
                            className={`w-full p-2 rounded-lg text-sm ${
                              darkMode ? 'bg-zinc-700 border-zinc-500 text-gray-200' : 'bg-white border-gray-200 text-gray-700'
                            } border`}
                          />
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={editingSubtask.weight}
                            onChange={(e) => setEditingSubtask({...editingSubtask, weight: Number(e.target.value)})}
                            min="0"
                            max="100"
                            className={`w-20 p-2 rounded-lg text-sm ${
                              darkMode ? 'bg-zinc-700 border-zinc-500 text-gray-200' : 'bg-white border-gray-200 text-gray-700'
                            } border`}
                          />
                          <span className="text-sm">% weight</span>

                          <button
                            onClick={saveEditedSubtask}
                            className="ml-auto px-3 py-1 bg-purple-900 text-white rounded-lg hover:bg-purple-800 transition-colors text-sm"
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
                        onChange={() => handleSubtaskToggle(subtask.id)}
                        className="mr-3 w-4 h-4 text-purple-900 rounded"
                      />
                      <div className="flex flex-col flex-1">
                        <div className="flex items-center">
                          <span className={`${subtask.completed ? 'line-through text-gray-500' : ''}`}>
                            {subtask.title}
                          </span>
                        </div>
                        <div className="flex gap-2 mt-1">
                          <span className={`text-xs px-2 py-0.5 rounded ${ISSUE_TYPE_COLORS[subtask.issueType]}`}>
                            {ISSUE_TYPE_ICONS[subtask.issueType]}
                            {subtask.issueType}
                          </span>
                          <span className="text-xs text-gray-500">
                            {subtask.weight}% weight
                          </span>
                        </div>
                      </div>
                    </div>
                    {isEditingTask && (
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleEditSubtask(subtask)}
                          className="text-gray-500 hover:text-purple-500"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                        onClick={() => handleDeleteSubtask(subtask.id)}
                        className="text-gray-500 hover:text-purple-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      ) : (
      <div className={`p-4 text-center rounded-lg ${darkMode ? 'bg-zinc-600 text-gray-400' : 'bg-gray-200 text-gray-500'}`}>
        No issues created yet
      </div>
    )}
  <div className="">
      {isEditingTask ? (
      <>
        <button
          onClick={() => setIsEditingTask(false)}
          className={`px-4 py-2 text-base mt-10 mr-3 rounded-lg border ${darkMode ? 'border-zinc-600' : 'border-gray-300'}`}
        >
          Cancel
        </button>
        <button
          onClick={saveTaskChanges}
          className="px-4 py-2 text-base mt-10  bg-purple-900 text-white rounded-lg hover:bg-purple-800 transition-colors">
        
          Save
        </button>
      </>
    ) : (
         <div className="flex">
            <button
              onClick={() => setIsEditingTask(true)}
              className="px-4 py-2 text-base mt-10 bg-purple-900 text-white rounded-lg hover:bg-purple-800 transition-colors flex items-center"
            >
              <Edit className="w-4 h-4 mr-1" />
              Edit Task
            </button>
           
          </div>
    )}           </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
    );
  };


return (
    <div className={`flex-1 min-h-screen p-4 ${darkMode ? 'bg-zinc-800 text-gray-200' : 'bg-white text-gray-800'}`}>
      <div 
        className={`transition-all duration-200   ${isSidebarOpen ? 'ml-[20px]' : 'ml-[20px]'}`}
      >
      {showEmptySubtaskModal && (
        <div className="fixed inset-0 bg-zinc-900 bg-opacity-50 flex items-center justify-center z-50">
          <div className={`p-6 rounded-lg w-96 ${darkMode ? 'bg-zinc-900 text-gray-100' : 'bg-white text-gray-700'}`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Attention Required</h3>
              <button
                onClick={() => setShowEmptySubtaskModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="mb-6">Please enter a subtask title before adding.</p>
            <button
              onClick={() => setShowEmptySubtaskModal(false)}
              className="mr-0 px-4 py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-600 transition-colors"
            >
              Confirm
            </button>
          </div>
        </div>
      )}
      
        <div className="p-3">
          {selectedTask ? null : (
            <>
              <div className="flex justify-between items-center mt-4 mb-8">
                <h1 className="text-3xl font-bold">Task Board</h1>
                
                <div className="flex items-center space-x-4">
                  <div className={`flex items-center px-3 py-1 rounded-lg ${darkMode ? 'bg-zinc-700 text-gray-100 hover-gray-700' : 'bg-gray-100 text-gray-500 hover-gray-200'}`}>
                   
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className={`bg-transparent ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}
                    >
                      <option value="all">All Tasks</option>
                      <option value="to-do">To Do</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                  
                  <div className={`flex items-center px-3 py-1 rounded-lg ${darkMode ? 'bg-zinc-700' : 'bg-gray-100'}`}>
                    <select
                      value={selectedProject || ''}
                      onChange={(e) => setSelectedProject(e.target.value || null)}
                      className={`bg-transparent focus:outline-none ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}
                    >
                      <option value="">All Projects</option>
                      {projects.map(project => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {renderTaskTable()}
            </>
          )}
        </div>
      </div>
      
      {selectedTask && renderTaskDetails()}
    </div>
  );
};

export default TaskBoard;
