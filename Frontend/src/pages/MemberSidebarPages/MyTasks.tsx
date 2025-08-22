// MyTasks.tsx
import { useEffect, useState } from 'react';
import { Flag, UserCircle, Paperclip, Calendar, X, Edit, Trash2, CheckCircle, RefreshCw, Circle, ArrowLeft } from 'lucide-react';
import { projects, tasks as allTasks } from './MockData2';

type Task = {
  id: string;
  projectId: string;
  title: string;
  description: string;
  dueDate: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'to-do' | 'in-progress' | 'completed';
  team: string;
  files: string[];
  assignedBy: string;
  subtasks: {
    id: string;
    title: string;
    completed: boolean;
    weight: number;
  }[];
};

type Subtask = {
  id: string;
  title: string;
  completed: boolean;
  weight: number;
};

const STATUS_LABELS = {
  'to-do': 'To Do',
  'in-progress': 'In Progress',
  'completed': 'Completed'
};

const PRIORITY_COLORS = {
  'High': 'bg-red-100 text-red-800',
  'Medium': 'bg-yellow-100 text-yellow-800',
  'Low': 'bg-green-100 text-green-800'
};

const STATUS_COLORS = {
  'to-do': 'bg-red-100 text-red-800 border-red-300',
  'in-progress': 'bg-yellow-100 text-yellow-800 border-yellow-300',
  'completed': 'bg-green-100 text-green-800 border-green-300'
};

const STATUS_ICONS = {
  'to-do': <Circle className="w-3 h-3 mr-1" />,
  'in-progress': <RefreshCw className="w-3 h-3 mr-1" />,
  'completed': <CheckCircle className="w-3 h-3 mr-1" />
};

const MyTasks = ({ darkMode, isSidebarOpen }: { darkMode: boolean; isSidebarOpen: boolean }) => {
  const [tasks, setTasks] = useState<Task[]>(
    allTasks
      .filter(task => task.status === 'in-progress')
      .map(task => ({
        ...task,
        priority: task.priority as 'Low' | 'Medium' | 'High',
        status: task.status as 'to-do' | 'in-progress' | 'completed'
      }))
  );
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [subtaskInput, setSubtaskInput] = useState('');
  const [showEmptySubtaskModal, setShowEmptySubtaskModal] = useState(false);
  const [editingSubtask, setEditingSubtask] = useState<Subtask | null>(null);
  const [isEditingTask, setIsEditingTask] = useState(false);
  const [editedTask, setEditedTask] = useState<Task | null>(null);
  const [progress, setProgress] = useState(0);

  // Keydown handler for subtask input
  const handleSubtaskKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSubtask();
    }
  };

// Calculate progress when task selection changes
  useEffect(() => {
    if (selectedTaskId) {
      const task = tasks.find(t => t.id === selectedTaskId);
      if (task) {
        setEditedTask({ ...task });
        const totalWeight = task.subtasks.reduce((sum, st) => sum + st.weight, 0);
        const completedWeight = task.subtasks
          .filter(st => st.completed)
          .reduce((sum, st) => sum + st.weight, 0);

        const newProgress = totalWeight > 0
          ? Math.round((completedWeight / totalWeight) * 100)
          : task.subtasks.length > 0 ? 100 : 0;

        setProgress(newProgress);
      }
    }
  }, [selectedTaskId, tasks]);

  const addRandomTask = () => {
    const pendingTasks = allTasks.filter(task =>
      task.status !== 'in-progress' &&
      !tasks.some(t => t.id === task.id)
    );

    if (pendingTasks.length === 0) {
      alert('No pending tasks available!');
      return;
    }

    const highPriorityTasks = pendingTasks.filter(task => task.priority === 'High');
    const mediumPriorityTasks = pendingTasks.filter(task => task.priority === 'Medium');
    const lowPriorityTasks = pendingTasks.filter(task => task.priority === 'Low');

    const candidates =
      highPriorityTasks.length > 0 ? highPriorityTasks :
      mediumPriorityTasks.length > 0 ? mediumPriorityTasks :
      lowPriorityTasks;

    const randomTask = candidates[Math.floor(Math.random() * candidates.length)];

    const updatedTask: Task = {
      ...randomTask,
      status: 'in-progress' as const,
      priority: randomTask.priority as 'Low' | 'Medium' | 'High'
    };

    setTasks(prev => [...prev, updatedTask]);
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Subtask functions
  const handleAddSubtask = () => {
    if (!subtaskInput.trim()) {
      setShowEmptySubtaskModal(true);
      return;
    }
    if (editedTask) {
      const newSubtask: Subtask = {
        id: `${editedTask.id}-${editedTask.subtasks.length + 1}`,
        title: subtaskInput,
        completed: false,
        weight: 0
      };

      const updatedSubtasks = [...editedTask.subtasks, newSubtask];
      const updatedTask = { ...editedTask, subtasks: updatedSubtasks };
      setEditedTask(updatedTask);

      const completedSubtasks = updatedTask.subtasks.filter(st => st.completed).length;
      const totalSubtasks = updatedTask.subtasks.length;
      const newProgress = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;
      setProgress(newProgress);

      setSubtaskInput('');
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

      // Update tasks list
      const updatedTasks = tasks.map(task =>
        task.id === updatedTask.id ? updatedTask : task
      );

      // Filter out completed tasks and ensure status type
      const filteredTasks = updatedTasks
        .filter(task => task.status === 'in-progress')
        .map(task => ({
          ...task,
          status: task.status as 'to-do' | 'in-progress' | 'completed',
          priority: task.priority as 'Low' | 'Medium' | 'High'
        }));
      setTasks(filteredTasks);

      // If task is completed, close detail view
      if (allSubtasksCompleted) {
        setSelectedTaskId(null);
      } else {
        setSelectedTaskId(updatedTask.id);
      }

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

  const renderTaskDetails = () => {
    if (!selectedTaskId || !editedTask) return null;

    return (
      <div
        className={`fixed inset-0 z-40 overflow-y-auto ${darkMode ? 'bg-zinc-800 text-gray-200' : 'bg-white text-gray-800'}`}
        style={{
          marginLeft: isSidebarOpen ? '240px' : '80px',
          marginTop: '64px',
          width: isSidebarOpen ? 'calc(100% - 240px)' : 'calc(100% - 80px)',
          height: 'calc(100vh - 64px)'
        }}
      >
        <div className="p-6 h-full mt-8 ml-5 mr-5">
          <div className="flex items-center mb-6">
            <button
              onClick={() => setSelectedTaskId(null)}
              className={`mr-1 p-2 rounded-full ${darkMode ? 'hover:bg-zinc-700' : 'hover:bg-gray-200'}`}
            >
              <ArrowLeft className="w-5 h-5"/>
            </button>
            <h2 className="text-2xl font-bold">
              {isEditingTask ? (
                <input
                  type="text"
                  value={editedTask.title}
                  onChange={(e) => setEditedTask({...editedTask, title: e.target.value})}
                  className={`w-full p-2 rounded-lg ${darkMode ? 'bg-zinc-700 text-gray-200' : 'bg-white text-gray-700'}`}
                />
              ) : (
                editedTask.title
              )}
            </h2>
          </div>

          <div className="flex flex-col items-start gap-2 mb-6">
            {isEditingTask ? (
              <select
                value={editedTask.priority}
                onChange={(e) => setEditedTask({...editedTask, priority: e.target.value as 'Low' | 'Medium' | 'High'})}
                className={`px-3 py-1 rounded-md w-fit mb-3 ${darkMode ? 'bg-zinc-700 text-gray-200' : 'bg-gray-100 text-gray-700'}`}
              >
                <option value="Low">Low Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="High">High Priority</option>
              </select>
            ) : (
              <span className={`px-3 py-1 rounded-md flex items-center mb-3  ${PRIORITY_COLORS[editedTask.priority]}`}>
                <Flag className="w-4 h-4 mr-1"/>
                {editedTask.priority} Priority
              </span>
            )}

            <div className={`px-3 py-1 rounded-md w-fit `}><span className="font-bold">Project Name: { }</span>
              {projects.find(p => p.id === editedTask.projectId)?.name}
            </div>


          </div>

          <div className="flex flex-col lg:flex-row gap-6 h-[calc(100%-120px)]">
            {/* Left side - Task details */}
            <div className="lg:w-2/3 h-full overflow-y-auto">
              <div className="mb-6">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium">Task Progress</span>
                  <span className="mr-60 text-sm font-medium">{progress}%</span>
                </div>
                <div className={`w-9/12 h-2 rounded-full ${darkMode ? 'bg-zinc-700' : 'bg-gray-200'}`}>
                  <div
                    className={`h-2 rounded-full ${progress === 100 ? 'bg-green-400' : 'bg-green-300'}`}
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-bold mb-2">Description</h3>
                {isEditingTask ? (
                  <textarea
                    value={editedTask.description}
                    onChange={(e) => setEditedTask({...editedTask, description: e.target.value})}
                    className={`w-full p-3 rounded-lg min-h-[120px] ${darkMode ? 'bg-zinc-700 text-gray-200' : 'bg-gray-100 text-gray-700'}`}
                  />
                ) : (
                  <p className={`p-3 rounded-lg ${darkMode ? 'bg-zinc-700 text-gray-200' : 'bg-gray-100 text-gray-700'}`}>
                    {editedTask.description}
                  </p>
                )}
              </div>

              <div className="mb-6">
                <h3 className="font-bold mb-2">Details</h3>
                <div className={`p-3 rounded-lg ${darkMode ? 'bg-zinc-700 text-gray-200' : 'bg-white text-gray-700'}`}>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-1`}>
                        Assigned By
                      </h4>
                      <p className="flex items-center">
                        <UserCircle className="w-4 h-4 mr-2" />
                        {editedTask.assignedBy}
                      </p>
                    </div>

                    <div>
                      <h4 className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-1`}>Due Date</h4>
                      <p className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        {isEditingTask ? (
                          <input
                            type="date"
                            value={editedTask.dueDate}
                            onChange={(e) => setEditedTask({...editedTask, dueDate: e.target.value})}
                            className={`p-1 rounded ${darkMode ? 'bg-zinc-800 text-gray-200' : 'bg-white text-gray-700'}`}
                          />
                        ) : (
                          formatDate(editedTask.dueDate)
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
                              onClick={() => setEditedTask({...editedTask, status})}
                              className={`px-3 py-1 rounded-md flex items-center ${
                                editedTask.status === status ?
                                `${
                                  status === 'to-do' ? 'bg-red-500 text-white' :
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
                        <span className={`px-3 py-1 rounded-md flex items-center ${STATUS_COLORS[editedTask.status]}`}>
                          {STATUS_ICONS[editedTask.status]}
                          {STATUS_LABELS[editedTask.status]}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {editedTask.files.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-bold mb-2">Attachments</h3>
                  <div className={`p-3 rounded-lg w-fit ${darkMode ? 'bg-zinc-700 text-gray-200' : 'bg-gray-100 text-gray-700'}`}>
                    <div className="space-y-2">
                      {editedTask.files.map((file, index) => (
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
            <div className="lg:w-1/3">
              <div className={`p-4 rounded-xl ${darkMode ? 'bg-zinc-700' : 'bg-white'}`}>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-xl">Subtasks</h3>
                </div>
                <div className="space-y-6">
                  {/* Add new subtask section */}
                  <div>
                    <h4 className="text-sm text-gray-500 font-medium mb-2">Add new Subtask here</h4>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={subtaskInput}
                        onChange={(e) => setSubtaskInput(e.target.value)}
                        onKeyDown={handleSubtaskKeyDown}
                        placeholder="Enter subtask title"
                        className={`flex-1 p-2 rounded-lg text-sm ${
                          darkMode ? 'bg-zinc-600 border-zinc-500 text-gray-200' : 'bg-white border-gray-200 text-gray-700'
                        } border`}
                      />
                      <button
                        onClick={handleAddSubtask}
                        className="px-3 py-1 bg-purple-900 text-gray-200 rounded-lg hover:bg-purple-800 transition-colors"
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  {/* Subtasks list */}
                  <div>
                    <h4 className="text-sm font-medium mb-3">Subtasks List</h4>
                    {editedTask.subtasks.length > 0 ? (
                      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                        {editedTask.subtasks.map((subtask) => (
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
                                  <span className={`flex-1 ${subtask.completed ? 'line-through text-gray-500' : ''}`}>
                                    {subtask.title}
                                  </span>
                                  <span className="ml-2 text-xs text-gray-500">
                                    {subtask.weight}%
                                  </span>
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
                                      className="text-gray-500 hover:text-red-500"
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
                        No subtasks created yet
                      </div>
                    )}
                    <div className="mt-6">
                      {isEditingTask ? (
                        <>
                          <button
                            onClick={() => setIsEditingTask(false)}
                            className={`px-4 py-2 text-base mr-3 rounded-lg border ${darkMode ? 'border-zinc-600' : 'border-gray-300'}`}
                          >
                            Cancel
                          </button>
                          <button
                            onClick={saveTaskChanges}
                            className="px-4 py-2 text-base bg-purple-900 text-white rounded-lg hover:bg-purple-800 transition-colors"
                          >
                            Save
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setIsEditingTask(true)}
                          className="px-4 py-2 text-base bg-purple-900 text-white rounded-lg hover:bg-purple-800 transition-colors flex items-center"
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit Task
                        </button>
                      )}
                    </div>
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
    <div className={`flex-1 min-h-screen ${darkMode ? 'bg-zinc-800 text-gray-200' : 'bg-white text-gray-800'}`}>
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
      <div
        className={`transition-all duration-200 pt-16 pb-16 ${isSidebarOpen ? 'ml-[240px]' : 'ml-[80px]'}`}
      >
        <div className="p-6">
          {selectedTaskId ? null : (
            <>
              <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">My Tasks</h1>

                <button
                  onClick={addRandomTask}
                  className="flex items-center px-4 py-2 bg-purple-900 text-white rounded-lg hover:bg-purple-800 transition-colors"
                > Add pending Task
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tasks.length > 0 ? tasks.map(task => (
                  <div
                    key={task.id}
                    onClick={() => setSelectedTaskId(task.id)}
                    className={`p-4 rounded-lg transition-all duration-200 cursor-pointer ${
                      darkMode ? 'bg-zinc-700 hover:bg-zinc-600' : 'bg-white hover:bg-purple-50'
                    } shadow-sm border ${darkMode ? 'border-zinc-600' : 'border-gray-200'}`}
                  >
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-lg">{task.title}</h3>
                      <span className={`text-xs px-2 py-1 rounded-md flex items-center ${PRIORITY_COLORS[task.priority]}`}>
                        <Flag className="w-3 h-3 mr-1" />
                        {task.priority}
                      </span>
                    </div>

                    <p className="text-sm mt-2 text-gray-500 line-clamp-2">
                      {task.description}
                    </p>

                    <div className="mt-3">
                      <div className={`text-xs px-2 py-1 rounded-md flex items-center w-fit ${task.status === 'in-progress' ? 'bg-yellow-500 text-white' : 'bg-green-500 text-white'}`}>
                        {task.status === 'in-progress' && <span className="animate-pulse mr-1">●</span>}
                        {task.status === 'in-progress' ? 'In Progress' : task.status}
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className={`text-xs px-2 py-1 rounded-md ${darkMode ? 'bg-zinc-600' : 'bg-gray-200'}`}>
                        {projects.find(p => p.id === task.projectId)?.name}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center justify-between">


                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="w-4 h-4 mr-1" />
                        {formatDate(task.dueDate)}
                      </div>
                    </div>

                    {task.files.length > 0 && (
                      <div className="mt-3 flex items-center text-sm text-gray-500">
                        <Paperclip className="w-4 h-4 mr-1" />
                        {task.files.length} file{task.files.length > 1 ? 's' : ''}
                      </div>
                    )}

                    <div className="mt-3 text-sm text-gray-500">
                      Subtasks: {task.subtasks.length}
                    </div>
                  </div>
                )) : (
                  <div className={`col-span-3 p-8 text-center rounded-lg ${darkMode ? 'bg-zinc-700' : 'bg-gray-100'}`}>
                    <h3 className="text-xl font-medium mb-4">No tasks in progress</h3>
                    <p className="text-gray-500 mb-6">Use the "Add pending Task" button to move pending tasks to in-progress</p>

                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {selectedTaskId && renderTaskDetails()}
    </div>
  );
};

export default MyTasks;
