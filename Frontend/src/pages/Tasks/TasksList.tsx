import { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, MoreVertical } from 'lucide-react';
import { useTasks } from '@/context/TaskContext';
import { Task } from '@/types/taskTypes';

const TasksList = ({ darkMode }: { darkMode: boolean }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { state, deleteTask } = useTasks();
  const { tasks, loading } = state;

  const [title, setTitle] = useState('Tasks List');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'To Do' | 'In Progress' | 'Done'>(
    location.state?.filter || 'all'
  );
  const [showMenuId, setShowMenuId] = useState<string | null>(null);

  useEffect(() => {
    if (location.state) {
      setTitle(location.state.title || 'Tasks List');
      setSelectedId(location.state.selectedId || null);
    }
  }, [location.state]);

  const handleDelete = (task: Task, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteTask(task.id, task.type);
    setShowMenuId(null);
  };

  const handleTaskClick = (task: Task) => {
    if (task.projectId) {
      navigate("/dashboard/member/taskboard", {
        state: { taskId: task.id, projectId: task.projectId }
      });
    }
  };

  const filteredTasks = (filter === 'all'
    ? tasks
    : tasks.filter(task => task.status === filter)
  );

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
              onClick={() => setFilter('To Do')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === 'To Do'
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
              onClick={() => setFilter('In Progress')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === 'In Progress'
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
              onClick={() => setFilter('Done')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === 'Done'
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
            {loading ? (
                 <div className={`text-center py-12 rounded-lg ${darkMode ? 'bg-zinc-700' : 'bg-gray-50'}`}>
                    <p className="text-lg">Loading tasks...</p>
                 </div>
            ) : filteredTasks.length === 0 ? (
              <div className={`text-center py-12 rounded-lg ${darkMode ? 'bg-zinc-700' : 'bg-gray-50'}`}>
                <p className="text-lg">No {filter !== 'all' ? filter.replace('-', ' ') : ''} tasks found</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredTasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => handleTaskClick(task)}
                    className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                      darkMode
                        ? `border-zinc-600 ${task.id === selectedId ? 'bg-zinc-600' : 'bg-zinc-700'}`
                        : `border-gray-200 ${task.id === selectedId ? 'bg-purple-100' : 'bg-white'}`
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-sm">{task.title}</span>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`px-2 py-1 text-xs rounded-md ${
                            task.priority === 'High'
                              ? 'bg-red-100 text-red-800'
                              : task.priority === 'Medium'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {task.priority}
                        </span>
                        <span
                          className={`px-2 py-1 text-xs rounded-md ${
                            task.status === 'Completed'
                              ? 'bg-green-100 text-green-800'
                              : task.status === 'WaitingForReview'
                              ? 'bg-orange-100 text-orange-800'
                              : task.status === 'InProgress'
                              ? 'bg-purple-100 text-purple-800'
                              : task.status === 'Accepted'
                              ? 'bg-blue-100 text-blue-800'
                              : task.status === 'Pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : task.status === 'Rejected'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {task.status}
                        </span>

                        {/* Action Menu */}
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowMenuId(showMenuId === task.id ? null : task.id);
                            }}
                            className={`p-1 rounded ${
                              darkMode ? 'hover:bg-zinc-600' : 'hover:bg-gray-200'
                            }`}
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {/* Dropdown Menu */}
                          {showMenuId === task.id && (
                            <div
                              className={`absolute right-0 top-full mt-1 z-10 rounded-md shadow-lg ${
                                darkMode ? 'bg-zinc-700' : 'bg-white'
                              }`}
                              style={{ minWidth: '120px' }}
                            >
                              <button
                                onClick={(e) => handleDelete(task, e)}
                                className={`w-full text-left px-3 py-2 text-sm flex items-center ${
                                  darkMode
                                    ? 'hover:bg-zinc-600 text-gray-200'
                                    : 'hover:bg-gray-100 text-gray-800'
                                }`}
                              >
                                Delete
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