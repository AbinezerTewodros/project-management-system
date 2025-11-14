"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChevronLeft, Calendar, Paperclip } from "lucide-react"
import { useTasks } from "@/context/TaskContext";
import { Task, ProjectTaskUpdateDto, IndependentTaskUpdateDto, TodoItemUpdateDto, PersonalTodoUpdateDto, TaskPriority, TaskStatus } from "@/types/taskTypes";

const EditTask: React.FC<{ darkMode: boolean }> = ({ darkMode }) => {
  const { state, updateTask } = useTasks();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [task, setTask] = useState<Task | null>(null);
  const [editedTask, setEditedTask] = useState<Partial<Task>>({});

  useEffect(() => {
    const taskId = location.pathname.split('/').pop();
    const foundTask = state.tasks.find(t => t.id === taskId);
    if (foundTask) {
      setTask(foundTask);
      setEditedTask(foundTask);
    } else {
      // Handle task not found, maybe redirect or show an error
      navigate('/dashboard/member');
    }
  }, [location.pathname, state.tasks, navigate]);


  const handleSave = () => {
    if (!task) return;

    let updateDto: ProjectTaskUpdateDto | IndependentTaskUpdateDto | TodoItemUpdateDto | PersonalTodoUpdateDto;

    switch (task.type) {
      case 'Project':
        updateDto = {
          title: editedTask.title,
          description: editedTask.description,
          priority: editedTask.priority as TaskPriority,
          status: editedTask.status as TaskStatus,
          dueDate: editedTask.dueDate,
        } as ProjectTaskUpdateDto;
        break;
      case 'Independent':
        updateDto = {
          title: editedTask.title,
          description: editedTask.description,
          priority: editedTask.priority as TaskPriority,
          dueDate: editedTask.dueDate,
        } as IndependentTaskUpdateDto;
        break;
      // Add cases for 'Todo' and 'Personal' if they are editable in this view
      default:
        return;
    }

    updateTask(task.id, updateDto, task.type);
    navigate(-1); // Go back to the previous page
  };

  const onBack = () => {
    navigate(-1);
  }

  if (!task) {
    return <div>Loading...</div>; // Or some other loading state
  }

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        darkMode ? "bg-zinc-900 text-white" : "bg-white text-gray-800"
      }`}
    >
      <div className="mx-auto px-3 py-4">
        <div className={`p-4 overflow-y-auto ${darkMode ? "bg-zinc-900 text-white" : "bg-white text-gray-800"}`}>
          <div>
            <div className="flex items-center mb-6">
              <Button variant="ghost" onClick={onBack} className="mr-4 p-2">
                <ChevronLeft className="w-6 h-6" />
              </Button>
              <h2 className="text-2xl font-bold">
                <Input
                  type="text"
                  className={`w-full p-2 rounded-lg ${darkMode ? "bg-zinc-800 border-zinc-700" : "bg-gray-100"}`}
                  value={editedTask.title || ''}
                  onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
                />
              </h2>
            </div>

            <div className="flex flex-col gap-2 mb-6">
              <select
                className={`px-3 py-1 rounded-lg w-fit ml-3 ${darkMode ? "bg-zinc-800 border-zinc-700" : "bg-gray-100"}`}
                value={editedTask.priority}
                onChange={(e) =>
                  setEditedTask({ ...editedTask, priority: e.target.value as TaskPriority })
                }
              >
                <option value="Low">Low Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="High">High Priority</option>
              </select>
            </div>

            <div className="flex flex-col lg:flex-row w-full">
              <div className="lg:w-1/2 lg:pr-6 ml-3">
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium">Task Progress</span>
                    <span className="lg:mr-px text-sm font-medium">{editedTask.progress || 0}%</span>
                  </div>
                  <div className={`lg:w-auto h-2 rounded-full ${darkMode ? "bg-zinc-700" : "bg-gray-200"}`}>
                    <div
                      className="h-2 rounded-full bg-purple-500"
                      style={{ width: `${editedTask.progress || 0}%` }}
                    ></div>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="font-bold mb-2">Description</h3>
                  <textarea
                    className={`lg:w-2/3 p-3 rounded-lg ${darkMode ? "bg-zinc-800 border-zinc-700 text-white" : "bg-white border-gray-200"} border`}
                    value={editedTask.description || ''}
                    onChange={(e) => setEditedTask({ ...editedTask, description: e.target.value })}
                    rows={4}
                  />
                </div>

                <div className="mb-6">
                  <h3 className="font-bold mb-2">Details</h3>
                  <div
                    className={`lg:w-auto p-3 rounded-lg ${darkMode ? "bg-zinc-800 text-white" : "bg-gray-100 text-gray-700"}`}
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"} mb-1`}>Assigned To</h4>
                        <p>{editedTask.assignee}</p>
                      </div>
                      <div>
                        <h4 className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"} mb-1`}>Due Date</h4>
                        <p className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2" />
                          <Input
                            type="date"
                            className={`p-1 rounded ${darkMode ? "bg-zinc-700 border-zinc-600" : "bg-white border-gray-200"} border`}
                            value={editedTask.dueDate ? new Date(editedTask.dueDate).toISOString().split('T')[0] : ''}
                            onChange={(e) => setEditedTask({ ...editedTask, dueDate: e.target.value })}
                          />
                        </p>
                      </div>
                      <div className="col-span-2 w-fit">
                        <h4 className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"} mb-1`}>Status</h4>
                        <div className="flex space-x-2">
                          <Button
                            variant={editedTask.status === "To Do" ? "default" : "outline"}
                            size="sm"
                            className={editedTask.status === "To Do" ? "bg-gray-500 text-white" : ""}
                            onClick={() => setEditedTask({ ...editedTask, status: "To Do" })}
                          >
                            To Do
                          </Button>
                          <Button
                            variant={editedTask.status === "In Progress" ? "default" : "outline"}
                            size="sm"
                            className={editedTask.status === "In Progress" ? "bg-purple-600 text-white" : ""}
                            onClick={() => setEditedTask({ ...editedTask, status: "In Progress" })}
                          >
                            In Progress
                          </Button>
                          <Button
                            variant={editedTask.status === "Done" ? "default" : "outline"}
                            size="sm"
                            className={editedTask.status === "Done" ? "bg-green-600 text-white" : ""}
                            onClick={() => setEditedTask({ ...editedTask, status: "Done" })}
                          >
                            Done
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="font-bold mb-2">Attachments</h3>
                  <div
                    className={`p-3 w-fit rounded-lg ${darkMode ? "bg-zinc-800 text-white" : "bg-gray-100 text-gray-700"}`}
                  >
                    <div className="space-y-2">
                      {task.files?.map(file => (
                        <div className="flex items-center" key={file.id}>
                          <Paperclip className="w-4 h-4 mr-2" />
                          <a href={file.url} className="text-purple-600 hover:underline" download>
                            {file.name}
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {task.type === 'Project' && (
                <div className="lg:w-1/2 lg:pl-2">
                  {/* Subtask functionality can be added here later */}
                </div>
              )}
            </div>
            <div className="mt-6">
              <Button variant="outline" className="mr-3 bg-transparent" onClick={onBack}>
                Cancel
              </Button>
              <Button className="bg-purple-900 hover:bg-purple-800 text-white" onClick={handleSave}>
                Save
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EditTask
