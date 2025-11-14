import { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Archive, 
  Calendar,
  Flag,
  CheckCircle,
  RefreshCw,
  Circle,
  UserCircle,
  Paperclip
} from 'lucide-react';

interface ArchivedTask {
  id: string;
  title: string;
  status: 'to-do' | 'in-progress' | 'completed';
  dueDate: string;
  priority: 'Low' | 'Medium' | 'High';
  project: string;
  team: string;
  files: number;
}

const ArchivedTasks = ({ darkMode, isSidebarOpen }: { darkMode: boolean; isSidebarOpen: boolean }) => {
  const location = useLocation();
  const [tasks, setTasks] = useState<ArchivedTask[]>([]);
  const [title, setTitle] = useState('Archived Tasks');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [listDarkMode, setListDarkMode] = useState(false);

  useEffect(() => {
    if (location.state) {
      setTasks(location.state.tasks || []);
      setTitle(location.state.title || 'Archived Tasks');
      setSelectedId(location.state.selectedId || null);
      setListDarkMode(location.state.darkMode || false);
    }
  }, [location.state]);

  const statusIcons = {
    'completed': <CheckCircle className="w-4 h-4 mr-1" />,
    'in-progress': <RefreshCw className="w-4 h-4 mr-1" />,
    'to-do': <Circle className="w-4 h-4 mr-1" />
  };

  const priorityColors = {
    'High': 'bg-red-100 text-red-800',
    'Medium': 'bg-yellow-100 text-yellow-800',
    'Low': 'bg-green-100 text-green-800'
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className={`flex-1 min-h-screen ${darkMode ? 'bg-zinc-800 text-gray-200' : 'bg-white text-gray-800'}`}>
      <div className={`transition-all duration-200 pt-5 ${
        isSidebarOpen ? 'ml-[2px]' : 'ml-[2px]'
      }`}>
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


          <div className="mx-8">
            {tasks.length === 0 ? (
              <div className={`text-center py-12 rounded-lg ${darkMode ? 'bg-zinc-700' : 'bg-gray-50'}`}>
                <p className="text-lg">No archived tasks found</p>
                <p className="mt-2 text-gray-500">
                  Tasks you archive will appear here
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className={`p-4 rounded-lg border transition-colors ${
                      listDarkMode 
                        ? `border-zinc-600 ${task.id === selectedId ? 'bg-zinc-600' : 'bg-zinc-700'}`
                        : `border-gray-200 ${task.id === selectedId ? 'bg-purple-50' : 'bg-white'}`
                    } shadow-sm`}
                  >
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-lg flex items-center">
                        <Archive className="w-4 h-4 mr-2 text-gray-500" />
                        {task.title}
                      </h3>
                      <span className={`text-xs px-2 py-1 rounded-md flex items-center ${priorityColors[task.priority]}`}>
                        <Flag className="w-3 h-3 mr-1" />
                        {task.priority}
                      </span>
                    </div>
                    
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className={`text-xs px-2 py-1 rounded-md flex items-center ${
                        task.status === 'completed' ? 'bg-green-100 text-green-800' :
                        task.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {statusIcons[task.status]}
                        {task.status.replace('-', ' ')}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-md ${darkMode ? 'bg-zinc-600' : 'bg-gray-200'}`}>
                        {task.project}
                      </span>
                    </div>
                    
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center text-sm text-gray-500">
                        <UserCircle className="w-4 h-4 mr-1" />
                        <span>{task.team}</span>
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="w-4 h-4 mr-1" />
                        {formatDate(task.dueDate)}
                      </div>
                    </div>
                    
                    {task.files > 0 && (
                      <div className="mt-3 flex items-center text-sm text-gray-500">
                        <Paperclip className="w-4 h-4 mr-1" />
                        {task.files} file{task.files > 1 ? 's' : ''}
                      </div>
                    )}
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

export default ArchivedTasks;
