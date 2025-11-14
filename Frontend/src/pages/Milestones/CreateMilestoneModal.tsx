import React, { useEffect, useState } from "react";
import { Dialog } from "@headlessui/react";
import { Paperclip, Upload, X } from "lucide-react";
import { toast } from "react-toastify";

interface Member {
  id: number;
  name: string;
  role: string;
  projectId: string[];
}

interface Project {
  id: string;
  name: string;
  members: string[];
}

interface CreateMilestoneModalProps {
  open: boolean;
  onClose: () => void;
  defaultProjectId?: string | number;
  initialProjectId?: string;
  projects: Project[];
  allMembers: Member[];
  darkMode: boolean;
  onCreate: (milestone: any) => void;
}

const getTodayDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const CreateMilestoneModal: React.FC<CreateMilestoneModalProps> = ({
  open,
  onClose,
  defaultProjectId,
  initialProjectId,
  projects,
  allMembers,
  darkMode,
  onCreate,
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState(initialProjectId || "");
  const [file, setFile] = useState<File | null>(null);
  const [filename, setFileName] = useState("");
  const [projectId, setProjectId] = useState(defaultProjectId);
  const [assignees, setAssignees] = useState<{ id: string, name: string }[]>(
    allMembers.map(member => ({
      id: member.id.toString(),
      name: member.name
    }))
  );

  const minDate = getTodayDate();

  const addAssignee = (name: string) => {
    if (name && !assignees.some(a => a.name === name)) {
      setAssignees([...assignees, { id: Date.now().toString(), name }]);
    }
  };

  const handleCreateFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setFileName(selectedFile.name);
      toast.success("File selected successfully!", {
        position: "top-right",
        autoClose: 3000,
        theme: darkMode ? "dark" : "light",
      });
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setFileName("");
  };

  useEffect(() => {
    if (open && defaultProjectId) {
      setProjectId(defaultProjectId);
    }
  }, [open, defaultProjectId]);

  if (!open) return null;

  return (
    <Dialog open={open} onClose={onClose} className={`fixed inset-0 z-50 overflow-y-auto`}>
      <div className={`flex items-center justify-center min-h-screen bg-black bg-opacity-50`}>
        <Dialog.Panel className={`bg-white p-6 rounded-lg w-fit ${
          darkMode ? "bg-zinc-800 text-gray-300" : ""
        }`}>
          <Dialog.Title className={`pb-2 mt-2 mb-1 text-2xl font-bold bg-gradient-to-r from-fuchsia-800 to-stone-800 bg-clip-text text-transparent`}>
            Create New Milestone
            <p className="text-sm ml-1 font-normal text-gray-600">Define a milestone to track important project progress</p>
          </Dialog.Title>
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);

            if (file) {
              formData.append("attachment", file);
            }
            const title = formData.get("title") as string;
            const description = formData.get("description") as string;
            const priority = formData.get("priority") as any;
            const assignee = formData.get("assignee") as string;
            const dueDate = formData.get("dueDate") as string;
            const project = formData.get("project") as string;

            onCreate({
              id: Date.now().toString(),
              title,
              description,
              priority,
              assignee,
              dueDate,
              project,
              key: `MS-${Math.floor(Math.random() * 100)}`,
              progress: 0,
              tasks: [],
              attachment: file ? {
                name: file.name,
                size: file.size,
                type: file.type,
                url: URL.createObjectURL(file),
                lastModified: file.lastModified
              } : undefined
            });
            setFile(null);
            setFileName("");
            onClose();
          }} className="space-y-4">
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Project</label>
                <select 
                  name="project"
                  required
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className={`w-full p-2 border rounded ${darkMode ? "bg-zinc-700 border-zinc-600" : ""}`} >
                  <option value=""> Select Project </option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Milestone Title</label>
                <input 
                  name="title"
                  placeholder="Milestone Title"
                  required
                  className={`w-full p-2 border rounded ${
                    darkMode ? "bg-zinc-700 border-zinc-600" : ""
                  }`} 
                />
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium">Description</label>
              <textarea 
                name="description"
                placeholder="Describe what this milestone represents"
                required
                className={`w-full p-2 border rounded ${
                  darkMode ? "bg-zinc-700 border-zinc-600" : ""
                }`}
                rows={4} 
              />
            </div>
            {/* Added Assign To section */}
            <div className="mb-4">
              <label className="block text-sm font-medium"> Assign To</label>
              <div className="flex items-center space-y-2">
                <select
                  name="assignee"
                  required
                  className={`mt-2 p-2 border rounded ${
                    darkMode ? "bg-zinc-700 border-zinc-600" : ""
                  }`}
                >
                  <option value="">Select Assignee</option>
                  {allMembers.map((member) => (
                    <option key={member.id} value={member.name}>
                      {member.id} - {member.name} ({member.role})
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Search by Employee ID"
                  id="newAssignee"
                  list="employeeList"
                  className={`w-1/3 flex ml-12 p-2 border rounded ${
                    darkMode ? "bg-zinc-700 border-zinc-600" : ""
                  }`}
                  onChange={(e) => {
                    const input = e.target as HTMLInputElement;
                    const member = allMembers.find(m => m.id.toString() === input.value);
                    if (member) {
                      const select = document.querySelector('select[name="assignee"]') as HTMLSelectElement;
                      if (select) select.value = member.name;
                    }
                  }}
                />
                <datalist id="employeeList">
                  {allMembers.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name} ({member.role})
                    </option>
                  ))}
                </datalist> 
                <button
                  type="button"
                  onClick={() => {
                    const input = document.getElementById('newAssignee') as HTMLInputElement;
                    if (input.value) {              
                      const member = allMembers.find(m => m.id.toString() === input.value);
                      if (member) {
                        addAssignee(member.id.toString());                        
                        const select = document.querySelector('select[name="assignee"]') as HTMLSelectElement;
                        if (select) select.value = member.name;
                        input.value = '';
                      } else {
                        toast.error("Invalid Employee ID");
                      }
                    }
                  }}
                  className={`ml-2 px-3 py-2 rounded ${
                    darkMode ? "bg-gray-700 hover:bg-gray-900" : "bg-purple-900 hover:bg-purple-800"
                  } text-white`}
                >
                  Add
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="">
                <label className="block text-sm font-medium mb-1">Due Date</label>
                <input
                  type="date"
                  name="dueDate"
                  min={minDate}
                  className={`w-full p-2 border rounded ${
                    darkMode ? "bg-zinc-700 border-zinc-600" : ""
                  }`}
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1"> Priority</label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input 
                      type="radio"
                      name="priority"
                      value="Low"
                      className={`mr-2 h-4 w-4 border-2 ${
                        darkMode ? 'border-gray-500' : 'border-gray-300'
                      } rounded-full appearance-none checked:border-purple-400 checked:bg-purple-400 checked:ring-1 checked:ring-purple-400 checked:ring-offset-1`} 
                    />
                    Low
                  </label>
                  <label className="flex items-center">
                    <input 
                      type="radio"
                      name="priority"
                      value="Medium"
                      className={`mr-2 h-4 w-4 border-2 ${
                        darkMode ? 'border-gray-500' : 'border-gray-300'
                      } rounded-full appearance-none checked:border-purple-400 checked:bg-purple-400 checked:ring-1 checked:ring-purple-400 checked:ring-offset-1`}
                      defaultChecked 
                    /> 
                    Medium
                  </label>
                  <label className="flex items-center">
                    <input 
                      type="radio"
                      name="priority"
                      value="High"
                      className={`mr-2 h-4 w-4 border-2 ${
                        darkMode ? 'border-gray-500' : 'border-gray-300'
                      } rounded-full appearance-none checked:border-purple-400 checked:bg-purple-400 checked:ring-1 checked:ring-purple-400 checked:ring-offset-1`}
                    /> 
                    High
                  </label>
                </div>
              </div>
            </div>
            
            <div className="w-fit">
                <label className="block text-sm font-medium mb-2">Attachments</label>
                <div className={`p-4 border-2 border-dashed rounded-lg ${darkMode  ? "border-zinc-600" : "border-gray-300"}`}>
                  {file ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Paperclip className="h-5 w-5 mr-2" />
                        <span className="truncate max-w-xs">{filename}</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveFile}
                        className="text-red-500 hover:text-red-700 ml-2"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  ) : (
                    <div className=" text-center">
                      <label className="cursor-pointer">
                        <div className=" flex flex-col items-center justify-center">
                          <Upload className="h-8 w-8 mb-2" />
                          <span className="text-sm font-medium">
                            Drag and drop files here or click to browse
                          </span>
                        </div>
                        <input
                          type="file"
                          onChange={handleCreateFileChange}
                          className="hidden"
                          accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                        />
                      </label>
                    </div>
                  )}
                </div>
              </div>
            <div className="flex justify-end space-x-3 pt-2">
              <button 
                type="button"
                onClick={onClose}
                className={`px-4 py-2 rounded ${
                  darkMode ? "bg-zinc-700 hover:bg-zinc-600" : "bg-gray-200 hover:bg-gray-300"
                }`}
              >
                Cancel
              </button>
              <button 
                type="submit"
                className={`ml-2 px-4 py-2 rounded text-white ${
                  darkMode ? "bg-gray-700 hover:bg-gray-800" : "bg-purple-900 hover:bg-purple-800"
                }`}
              >
                Create Milestone
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default CreateMilestoneModal;