import { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ArrowLeft, MoreVertical } from 'lucide-react'; // Added Archive icon
import { tasksData } from './MockData';

interface Subtask {
  id: string;
  title: string;
  status: string;
  priority: string;
}

const TasksList = ({ darkMode, isSidebarOpen }: { darkMode: boolean; isSidebarOpen: boolean }) => {
  const location = useLocation();
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [title, setTitle] = useState('Subtasks List');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'to-do' | 'in-progress' | 'completed'>('all');
  const [archivedIds, setArchivedIds] = useState<Set<string>>(new Set()); // Track archived subtask IDs
  const [showMenuId, setShowMenuId] = useState<string | null>(null); // Track which menu is open

  useEffect(() => {
    if (location.state) {
      setSubtasks(location.state.subtasks);
      setTitle(location.state.title);
      setSelectedId(location.state.selectedId);
    } else {
      // Get all subtasks from mock data
      const allSubtasks: Subtask[] = [];
      Object.values(tasksData).forEach(projectTasks => {
        projectTasks.forEach(task => {
          allSubtasks.push(...task.subtasks);
        });
      });
      setSubtasks(allSubtasks);
    }
    
    // Load archived IDs from localStorage
    const savedArchived = localStorage.getItem('archivedSubtasks');
    if (savedArchived) {
      setArchivedIds(new Set(JSON.parse(savedArchived)));
    }
  }, [location.state]);

  // Archive a subtask
  const handleArchive = (subtaskId: string) => {
    const newArchived = new Set(archivedIds);
    newArchived.add(subtaskId);
    setArchivedIds(newArchived);
    setShowMenuId(null); // Close the menu
    
    // Save to localStorage
    localStorage.setItem('archivedSubtasks', JSON.stringify(Array.from(newArchived)));
  };

  // Apply filter and remove archived subtasks
  const filteredSubtasks = (filter === 'all' 
    ? subtasks 
    : subtasks.filter(subtask => subtask.status === filter)
  ).filter(subtask => !archivedIds.has(subtask.id)); // Filter out archived

  return (
    <div className={`flex-1 min-h-screen ml-0 ${darkMode ? 'bg-zinc-800 text-gray-200' : 'bg-white text-gray-800'}`}>
      <div className={`transition-all duration-200 pt-4 pb-4 `}>
        <div className="p-6">
          <div className="flex items-center mb-6">
            <Link 
              to="/dashboard/member" 
              className={`mr-4 p-2 rounded-lg ${darkMode ? 'hover:bg-zinc-700' : 'hover:bg-gray-100'}`}
            >
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <h2 className="text-3xl font-bold">{title}</h2>
          </div>

          {/* Filter Controls */}
          <div className="flex mb-6 space-x-2 mx-8">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === 'all'
                 ? darkMode 
                    ? 'bg-gray-600 text-white' 
                    : 'bg-gray-600 text-white'
                  : darkMode 
                    ? 'bg-zinc-700 hover:bg-zinc-600' 
                    : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              All Tasks
            </button>
            <button
              onClick={() => setFilter('to-do')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === 'to-do'
                  ? darkMode 
                    ? 'bg-gray-600 text-white' 
                    : 'bg-gray-600 text-white'
                  : darkMode 
                    ? 'bg-zinc-700 hover:bg-zinc-600' 
                    : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              To Do
            </button>
            <button
              onClick={() => setFilter('in-progress')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === 'in-progress'
                  ? darkMode 
                    ? 'bg-gray-600 text-white' 
                    : 'bg-gray-600 text-white'
                  : darkMode 
                    ? 'bg-zinc-700 hover:bg-zinc-600' 
                    : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              In Progress
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === 'completed'
                  ? darkMode 
                    ? 'bg-gray-600 text-white' 
                    : 'bg-gray-600 text-white'
                  : darkMode 
                    ? 'bg-zinc-700 hover:bg-zinc-600' 
                    : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              Completed
            </button>
          </div>

          <div className="mx-8">
            {filteredSubtasks.length === 0 ? (
              <div className={`text-center py-12 rounded-lg ${darkMode ? 'bg-zinc-700' : 'bg-gray-50'}`}>
                <p className="text-lg">No {filter !== 'all' ? filter.replace('-', ' ') : ''} subtasks found</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredSubtasks.map((subtask) => (
                  <div
                    key={subtask.id}
                    className={`p-3 rounded-lg border transition-colors ${
                      darkMode 
                        ? `border-zinc-600 ${subtask.id === selectedId ? 'bg-zinc-600' : 'bg-zinc-700'}`
                        : `border-gray-200 ${subtask.id === selectedId ? 'bg-purple-100' : 'bg-white'}`
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-sm">{subtask.title}</span>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`px-2 py-1 text-xs rounded-md ${
                            subtask.priority === 'High'
                              ? 'bg-red-100 text-red-800'
                              : subtask.priority === 'Medium'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {subtask.priority}
                        </span>
                        <span
                          className={`px-2 py-1 text-xs rounded-md ${
                            subtask.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : subtask.status === 'in-progress'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {subtask.status.replace('-', ' ')}
                        </span>
                        
                        {/* Action Menu */}
                        <div className="relative">
                          <button
                            onClick={() => setShowMenuId(showMenuId === subtask.id ? null : subtask.id)}
                            className={`p-1 rounded ${
                              darkMode ? 'hover:bg-zinc-600' : 'hover:bg-gray-200'
                            }`}
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          
                          {/* Dropdown Menu */}
                          {showMenuId === subtask.id && (
                            <div 
                              className={`absolute right-0 top-full mt-1 z-10 rounded-md shadow-lg ${
                                darkMode ? 'bg-zinc-700' : 'bg-white'
                              }`}
                              style={{ minWidth: '120px' }}
                            >
                              <button
                                onClick={() => handleArchive(subtask.id)}
                                className={`w-full text-left px-3 py-2 text-sm flex items-center ${
                                  darkMode 
                                    ? 'hover:bg-zinc-600 text-gray-200' 
                                    : 'hover:bg-gray-100 text-gray-800'
                                }`}
                              >
                               
                                Archive
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TasksList;