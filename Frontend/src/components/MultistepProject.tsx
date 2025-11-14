import { useEffect, useMemo, useState } from "react";
import { Paperclip, Calendar, Search, X, User, Crown, Shield, ArrowLeft } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { mockEmployees, currentUser, getTodayDate, mockProjects } from "./MockData";
import { Project, Employee, Milestone, Task } from "@/types/types";


const MultistepProjectCreation = ({ darkMode, onProjectCreated }: { darkMode: boolean, onProjectCreated: (project: Project) => void}) => {

  const { step } = useParams<{ step: string }>();
  const navigate = useNavigate();
  const [formStep, setFormStep] = useState(1);
  const [newProjectTitle, setNewProjectTitle] = useState("");
  const [newProjectDescription, setNewProjectDescription] = useState("");
  const [newProjectDueDate, setNewProjectDueDate] = useState("");
  const [newProjectPriority, setNewProjectPriority] = useState<'High' | 'Medium' | 'Low'>("Medium");
  const [newProjectFiles, setNewProjectFiles] = useState<File[]>([]);
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
  const [selectedTeamMembers, setSelectedTeamMembers] = useState<Employee[]>([]);
  const [selectedScrumMaster, setSelectedScrumMaster] = useState<Employee | null>(null);
  const [selectedTeamLeader, setSelectedTeamLeader] = useState<Employee | null>(null);
  const [newMilestoneTitle, setNewMilestoneTitle] = useState("");
  const [newMilestoneDescription, setNewMilestoneDescription] = useState("");
  const [newMilestoneDueDate, setNewMilestoneDueDate] = useState("");
  const [newMilestonePriority, setNewMilestonePriority] = useState<'High' | 'Medium' | 'Low'>("Medium");
  const [newMilestoneAssignee, setNewMilestoneAssignee] = useState("");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<'Low' | 'Medium' | 'High'>("Medium");
  const [newTaskAssignee, setNewTaskAssignee] = useState("");
  const [newTaskMilestone, setNewTaskMilestone] = useState<string | "">("");
  const [tempProject, setTempProject] = useState<Project | null>(null);

  // Initialize tempProject when component mounts or when form data changes
  useEffect(() => {
    if (newProjectTitle && (selectedTeamMembers.length > 0 || selectedScrumMaster || selectedTeamLeader)) {
      setTempProject(prev => {
        if (!prev) {
          return {
            id: Math.max(...mockProjects.map(p => p.id), 0) + 1,
            title: newProjectTitle,
            description: newProjectDescription,
            dueDate: newProjectDueDate,
            createdBy: currentUser.name,
            teamMembers: selectedTeamMembers,
            scrumMaster: selectedScrumMaster,
            teamLeader: selectedTeamLeader,
            priority: newProjectPriority,
            status: "To Do",
            progress: 0,
            files: newProjectFiles.map(file => ({
              name: file.name,
              size: file.size,
              type: file.type,
              url: URL.createObjectURL(file)
            })),
            milestones: [],
            tasks: []
          };
        }
        return prev;
      });
    }
  }, [newProjectTitle, selectedTeamMembers, selectedScrumMaster, selectedTeamLeader, newProjectDescription, newProjectDueDate, newProjectPriority, newProjectFiles]);

  const minDate = getTodayDate();

  // Filter employees based on search
    const filteredEmployees = useMemo(() => {
    if (!employeeSearch) return mockEmployees;
    const searchLower = employeeSearch.toLowerCase();
    return mockEmployees.filter(
      (employee) =>
        employee.name.toLowerCase().includes(searchLower) ||
        employee.id.toLowerCase().includes(searchLower) ||
        employee.department.toLowerCase().includes(searchLower) ||
        employee.position.toLowerCase().includes(searchLower)
    ).filter(emp => !selectedTeamMembers.some(selected => selected.id === emp.id) &&
      emp.id !== selectedScrumMaster?.id &&
      emp.id !== selectedTeamLeader?.id);
  }, [employeeSearch, selectedTeamMembers, selectedScrumMaster, selectedTeamLeader]);

  // Handle employee selection for different roles
  const handleSelectEmployee = (employee: Employee, role: 'team_member' | 'scrum_master' | 'team_leader') => {
    if (role === 'team_member') {
      if (!selectedTeamMembers.some(member => member.id === employee.id)) {
        setSelectedTeamMembers([...selectedTeamMembers, employee]);
      }
    } else if (role === 'scrum_master') {
      setSelectedScrumMaster(employee);
    } else if (role === 'team_leader') {
      setSelectedTeamLeader(employee);
    }
    setEmployeeSearch("");
    setShowEmployeeDropdown(false);
  };

  // Remove selected employee
  const removeEmployee = (employeeId: string, role: 'team_member' | 'scrum_master' | 'team_leader') => {
    if (role === 'team_member') {
      setSelectedTeamMembers(selectedTeamMembers.filter(emp => emp.id !== employeeId));
    } else if (role === 'scrum_master') {
      setSelectedScrumMaster(null);
    } else if (role === 'team_leader') {
      setSelectedTeamLeader(null);
    }
  };

  // Handle milestone creation
  const handleCreateMilestone = () => {
    if (!newMilestoneTitle.trim() || !newMilestoneAssignee) return;

    const assignee = selectedTeamMembers.find(member => member.id === newMilestoneAssignee);

    const newMilestone: Milestone = {
      id: `milestone${Date.now()}`,
      title: newMilestoneTitle,
      description: newMilestoneDescription,
      assignee: assignee?.name || "",
      assigneeId: newMilestoneAssignee,
      status: "To Do",
      priority: newMilestonePriority,
      dueDate: newMilestoneDueDate,
      weight: 100,
      tasks: []
    };

    setTempProject(prev => {
      if (!prev) {
        // Create a new project with this milestone
        const newProject: Project = {
          id: Math.max(...mockProjects.map(p => p.id), 0) + 1,
          title: newProjectTitle,
          description: newProjectDescription,
          dueDate: newProjectDueDate,
          createdBy: currentUser.name,
          teamMembers: selectedTeamMembers,
          scrumMaster: selectedScrumMaster,
          teamLeader: selectedTeamLeader,
          priority: newProjectPriority,
          status: "To Do",
          progress: 0,
          files: newProjectFiles.map(file => ({
            name: file.name,
            size: file.size,
            type: file.type,
            url: URL.createObjectURL(file)
          })),
          milestones: [newMilestone],
          tasks: []
        };
        return newProject;
      } else {
        // Add milestone to existing temp project
        return {
          ...prev,
          milestones: [...(prev.milestones || []), newMilestone]
        };
      }
    });

    setNewMilestoneTitle("");
    setNewMilestoneDescription("");
    setNewMilestoneDueDate("");
    setNewMilestonePriority("Medium");
    setNewMilestoneAssignee("");
  };

  // Handle task creation
  const handleCreateTask = () => {
    if (!newTaskTitle.trim() || !newTaskAssignee) return;

    const assignee = selectedTeamMembers.find(member => member.id === newTaskAssignee);

    const newTask: Task = {
      id: `task${Date.now()}`,
      title: newTaskTitle,
      description: newTaskDescription,
      assignee: assignee?.name || "",
      assigneeId: newTaskAssignee,
      status: "To Do",
      priority: newTaskPriority,
      dueDate: newTaskDueDate
    };

    setTempProject(prev => {
      if (!prev) {
        // Create a new project with this task
        const newProject: Project = {
          id: Math.max(...mockProjects.map(p => p.id), 0) + 1,
          title: newProjectTitle,
          description: newProjectDescription,
          dueDate: newProjectDueDate,
          createdBy: currentUser.name,
          teamMembers: selectedTeamMembers,
          scrumMaster: selectedScrumMaster,
          teamLeader: selectedTeamLeader,
          priority: newProjectPriority,
          status: "To Do",
          progress: 0,
          files: newProjectFiles.map(file => ({
            name: file.name,
            size: file.size,
            type: file.type,
            url: URL.createObjectURL(file)
          })),
          milestones: [],
          tasks: [newTask]
        };
        return newProject;
      } else {
        if (newTaskMilestone) {
          const updatedMilestones = prev.milestones?.map(milestone =>
            milestone.id === newTaskMilestone
              ? { ...milestone, tasks: [...(milestone.tasks || []), newTask] }
              : milestone
          ) || [];

          return {
            ...prev,
            milestones: updatedMilestones
          };
        } else {
          // Add as standalone task
          return {
            ...prev,
            tasks: [...(prev.tasks || []), newTask]
          };
        }
      }
    });

    setNewTaskTitle("");
    setNewTaskDescription("");
    setNewTaskDueDate("");
    setNewTaskPriority("Medium");
    setNewTaskAssignee("");
    setNewTaskMilestone(""); // Reset milestone assignment
  };

  // Handle project creation
  const handleCreateProject = () => {
    if (!newProjectTitle.trim()) return;

    const newProject: Project = {
      id: Math.max(...mockProjects.map(p => p.id), 0) + 1,
      title: newProjectTitle,
      description: newProjectDescription,
      dueDate: newProjectDueDate,
      createdBy: currentUser.name,
      teamMembers: selectedTeamMembers,
      scrumMaster: selectedScrumMaster,
      teamLeader: selectedTeamLeader,
      priority: newProjectPriority,
      status: "To Do",
      progress: 0,
      files: newProjectFiles.map(file => ({
        name: file.name,
        size: file.size,
        type: file.type,
        url: URL.createObjectURL(file)
      })),
      milestones: tempProject?.milestones || [],
      tasks: tempProject?.tasks || []
    };

    console.log('About to call onProjectCreated with:', newProject);
    console.log('TempProject state:', tempProject);
    console.log('Milestones:', tempProject?.milestones);
    console.log('Tasks:', tempProject?.tasks);

    onProjectCreated(newProject); // save the project
    navigate('/dashboard/member/projects/mine')
  };

  // Function to navigate between steps
 const navigateToStep = (stepNumber: number) => {
    navigate(`/dashboard/member/projects/new/${stepNumber}`);
  };

  // Update form step when URL params change
  useEffect(() => {
  const stepNumber = step ? parseInt(step) : 1;

  // Redirect if step is invalid
  if (stepNumber < 1 || stepNumber > 3) {
    navigate('new/1', { replace: true });
  } else {
    setFormStep(stepNumber);
  }
}, [step, navigate]);


  return (
    <div className={`p-6 ${darkMode ? "bg-zinc-800 text-gray-100" : "bg-white text-gray-800"} min-h-screen`}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-6">
          <button
            onClick={() => {
              if (formStep > 1) {
                navigateToStep(formStep - 1);
              } else {
                navigate('/dashboard/member/projects/mine');
              }
            }}
            className="flex items-center text-purple-600 hover:text-purple-700"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </button>
          <h1 className="text-2xl font-bold ml-4">Create New Project</h1>
          <div className="ml-auto flex items-center">
            <span className="text-sm text-gray-500 mr-4">Step {formStep} of 3</span>
            <div className="flex space-x-1">
              {[1, 2, 3].map((stepNum) => (
                <div
                  key={stepNum}
                  className={`w-2 h-2 rounded-full ${
                    formStep >= stepNum
                      ? 'bg-purple-600'
                      : darkMode
                      ? 'bg-zinc-600'
                      : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className={`w-full h-2 rounded-full ${darkMode ? 'bg-zinc-700' : 'bg-gray-200'}`}>
            <div
              className="h-2 rounded-full bg-purple-600 transition-all duration-300"
              style={{ width: `${(formStep / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        <div className={`rounded-lg p-6 ${darkMode ? 'bg-zinc-700' : 'bg-gray-50'} mb-6`}>
          {formStep === 1 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Project Information</h2>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Project Title</label>
                <input
                  type="text"
                  value={newProjectTitle}
                  onChange={(e) => setNewProjectTitle(e.target.value)}
                  className={`w-full p-2 rounded-lg border ${darkMode ? 'bg-zinc-600 border-zinc-500 text-white' : 'bg-white border-gray-300 text-gray-800'}`}
                  placeholder="Project Title"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={newProjectDescription}
                  onChange={(e) => setNewProjectDescription(e.target.value)}
                  className={`w-full p-2 rounded-lg border ${darkMode ? 'bg-zinc-600 border-zinc-500 text-white' : 'bg-white border-gray-300 text-gray-800'}`}
                  placeholder="Description"
                  rows={3}
                />
              </div>

              {/* Assign To with Employee Search */}
              <div className="mb-4 relative">
                <label className="block text-sm font-medium mb-1">Assign Team Roles</label>
                <div className="relative mb-2">
                  <input
                    type="text"
                    value={employeeSearch}
                    onChange={(e) => {
                      setEmployeeSearch(e.target.value);
                      setShowEmployeeDropdown(true);
                    }}
                    onFocus={() => setShowEmployeeDropdown(true)}
                    className={`w-full p-2 rounded-lg border ${darkMode ? 'bg-zinc-600 border-zinc-500 text-white' : 'bg-white border-gray-300 text-gray-800'} pr-10`}
                    placeholder="Search employees by name or ID"
                  />
                  <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                </div>

                {showEmployeeDropdown && filteredEmployees.length > 0 && (
                  <div className={`absolute z-10 w-full mt-1 max-h-60 overflow-y-auto rounded-md shadow-lg ${
                    darkMode ? 'bg-zinc-700' : 'bg-white'
                  } border ${darkMode ? 'border-zinc-600' : 'border-gray-300'}`}>
                    {filteredEmployees.map((employee) => (
                      <div
                        key={employee.id}
                        className={`p-2 cursor-pointer hover:${darkMode ? 'bg-zinc-600' : 'bg-gray-100'}`}
                      >
                        <div className="font-medium">{employee.name}</div>
                        <div className="text-sm opacity-75">
                          ID: {employee.id} | {employee.department} | {employee.position}
                        </div>
                        <div className="flex space-x-2 mt-2">
                          <button
                            onClick={() => handleSelectEmployee(employee, 'team_member')}
                            className="text-xs px-2 py-1 bg-gray-400 hover:bg-gray-500 text-white rounded"
                          >
                            Add as Member
                          </button>
                          <button
                            onClick={() => handleSelectEmployee(employee, 'scrum_master')}
                            className="text-xs px-2 py-1 bg-gray-500 hover:bg-gray-600 text-white rounded"
                          >
                            Set as Scrum Master
                          </button>
                          <button
                            onClick={() => handleSelectEmployee(employee, 'team_leader')}
                            className="text-xs px-2 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded"
                          >
                            Set as Team Leader
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Selected Team Members */}
                <div className="mt-4">
                  <h3 className="text-sm font-medium mb-2">Team Members</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedTeamMembers.map((member) => (
                      <div key={member.id} className={`flex items-center px-2 py-1 rounded-full ${
                        darkMode ? 'bg-zinc-600' : 'bg-blue-100'
                      }`}>
                        <User className="w-3 h-3 mr-1" />
                        <span className="text-sm">{member.name}</span>
                        <button
                          onClick={() => removeEmployee(member.id, 'team_member')}
                          className="ml-1 text-red-500"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Selected Scrum Master */}
                <div className="mt-4">
                  <h3 className="text-sm font-medium mb-2">Scrum Master</h3>
                  {selectedScrumMaster ? (
                    <div className={`flex items-center px-2 py-1 rounded-full ${
                      darkMode ? 'bg-zinc-600' : 'bg-green-100'
                    }`}>
                      <Shield className="w-3 h-3 mr-1" />
                      <span className="text-sm">{selectedScrumMaster.name}</span>
                      <button
                        onClick={() => removeEmployee(selectedScrumMaster.id, 'scrum_master')}
                        className="ml-1 text-red-500"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No scrum master assigned</p>
                  )}
                </div>

                {/* Selected Team Leader */}
                <div className="mt-4">
                  <h3 className="text-sm font-medium mb-2">Team Leader</h3>
                  {selectedTeamLeader ? (
                    <div className={`flex items-center px-2 py-1 rounded-full ${
                      darkMode ? 'bg-zinc-600' : 'bg-purple-100'
                    }`}>
                      <Crown className="w-3 h-3 mr-1" />
                      <span className="text-sm">{selectedTeamLeader.name}</span>
                      <button
                        onClick={() => removeEmployee(selectedTeamLeader.id, 'team_leader')}
                        className="ml-1 text-red-500"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No team leader assigned</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Due Date</label>
                  <div className={`flex items-center p-2 rounded-lg border ${darkMode ? 'bg-zinc-600 border-zinc-500' : 'bg-white border-gray-300'}`}>
                    <Calendar className="w-4 h-4 mr-2" />
                    <input
                      type="date"
                      value={newProjectDueDate}
                      onChange={(e) => setNewProjectDueDate(e.target.value)}
                      min={minDate}
                      className={`w-full bg-transparent ${darkMode ? 'text-white' : 'text-gray-800'}`}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Priority</label>
                  <select
                    value={newProjectPriority}
                    onChange={(e) => setNewProjectPriority(e.target.value as 'High' | 'Medium' | 'Low')}
                    className={`w-full p-2 rounded-lg border ${darkMode ? 'bg-zinc-600 border-zinc-500 text-white' : 'bg-white border-gray-300 text-gray-800'}`}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Attachments</label>
                <div
                  className={`border-2 border-dashed rounded-lg p-4 text-center ${darkMode ? 'border-zinc-500 bg-zinc-600' : 'border-gray-300 bg-white'}`}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const droppedFiles = Array.from(e.dataTransfer.files);
                    setNewProjectFiles([...newProjectFiles, ...droppedFiles]);
                  }}
                >
                  <Paperclip className="mx-auto w-6 h-6 mb-2" />
                  <p className="text-sm mb-2">Drag and drop files here or click to browse</p>
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files) {
                        const selectedFiles = Array.from(e.target.files);
                        setNewProjectFiles([...newProjectFiles, ...selectedFiles]);
                      }
                    }}
                    multiple
                  />
                  <label
                    htmlFor="file-upload"
                    className={`inline-block px-4 py-2 rounded-lg text-sm ${darkMode ? 'bg-zinc-500 hover:bg-zinc-400' : 'bg-gray-200 hover:bg-gray-300'} cursor-pointer`}
                  >
                    Browse Files
                  </label>
                </div>
                {newProjectFiles.length > 0 && (
                  <div className="mt-2">
                    {newProjectFiles.map((file, index) => (
                      <div key={index} className="text-sm flex items-center">
                        <Paperclip className="w-4 h-4 mr-2" />
                        {file.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {formStep === 2 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Add Initial Milestones</h2>
              <p className="text-sm text-gray-500 mb-4">Add the key milestones for your project (optional)</p>

              <div className="space-y-4">
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Milestone Title</label>
                  <input
                    type="text"
                    value={newMilestoneTitle}
                    onChange={(e) => setNewMilestoneTitle(e.target.value)}
                    className={`w-full p-2 rounded-lg border ${darkMode ? 'bg-zinc-600 border-zinc-500 text-white' : 'bg-white border-gray-300 text-gray-800'}`}
                    placeholder="Milestone title"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    value={newMilestoneDescription}
                    onChange={(e) => setNewMilestoneDescription(e.target.value)}
                    className={`w-full p-2 rounded-lg border ${darkMode ? 'bg-zinc-600 border-zinc-500 text-white' : 'bg-white border-gray-300 text-gray-800'}`}
                    placeholder="Milestone description"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Due Date</label>
                    <input
                      type="date"
                      value={newMilestoneDueDate}
                      onChange={(e) => setNewMilestoneDueDate(e.target.value)}
                      min={minDate}
                      className={`w-full p-2 rounded-lg border ${darkMode ? 'bg-zinc-600 border-zinc-500 text-white' : 'bg-white border-gray-300 text-gray-800'}`}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Priority</label>
                    <select
                      value={newMilestonePriority}
                      onChange={(e) => setNewMilestonePriority(e.target.value as 'High' | 'Medium' | 'Low')}
                      className={`w-full p-2 rounded-lg border ${darkMode ? 'bg-zinc-600 border-zinc-500 text-white' : 'bg-white border-gray-300 text-gray-800'}`}
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Assign To</label>
                  <select
                    value={newMilestoneAssignee}
                    onChange={(e) => setNewMilestoneAssignee(e.target.value)}
                    className={`w-full p-2 rounded-lg border ${darkMode ? 'bg-zinc-600 border-zinc-500 text-white' : 'bg-white border-gray-300 text-gray-800'}`}
                  >
                    <option value="">Select team member</option>
                    {selectedTeamMembers.map(member => (
                      <option key={member.id} value={member.id}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleCreateMilestone}
                  disabled={!newMilestoneTitle.trim() || !newMilestoneAssignee}
                  className={`px-4 py-2 rounded-lg text-white ${
                    !newMilestoneTitle.trim() || !newMilestoneAssignee
                      ? 'bg-gray-400'
                      : darkMode
                      ? 'bg-purple-600 hover:bg-purple-500'
                      : 'bg-purple-600 hover:bg-purple-500'
                  }`}
                >
                  Add Milestone
                </button>
              </div>

              {/* Debug info */}
              <div className="mt-4 p-2 bg-gray-100 rounded text-xs">
                <strong>Debug:</strong> TempProject has {tempProject?.milestones?.length || 0} milestones and {tempProject?.tasks?.length || 0} tasks
              </div>

              {/* Show added milestones */}
              {tempProject?.milestones && tempProject.milestones.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-semibold mb-3">Added Milestones</h3>
                  <div className="space-y-3">
                    {tempProject.milestones.map((milestone) => (
                      <div
                        key={milestone.id}
                        className={`p-3 rounded-lg ${darkMode ? 'bg-zinc-600' : 'bg-white'} border ${darkMode ? 'border-zinc-500' : 'border-gray-200'}`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{milestone.title}</h4>
                            <p className="text-sm opacity-75">{milestone.description}</p>
                          </div>
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              milestone.priority === "High"
                                ? "bg-red-100 text-red-800"
                                : milestone.priority === "Medium"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {milestone.priority}
                          </span>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-sm">Assigned to: {milestone.assignee}</span>
                          <span className="text-sm">Due: {new Date(milestone.dueDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {formStep === 3 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Add Initial Tasks</h2>
              <p className="text-sm text-gray-500 mb-4">Add the initial tasks for your project (optional)</p>

              <div className="space-y-4">
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Task Title</label>
                  <input
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    className={`w-full p-2 rounded-lg border ${darkMode ? 'bg-zinc-600 border-zinc-500 text-white' : 'bg-white border-gray-300 text-gray-800'}`}
                    placeholder="Task title"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    value={newTaskDescription}
                    onChange={(e) => setNewTaskDescription(e.target.value)}
                    className={`w-full p-2 rounded-lg border ${darkMode ? 'bg-zinc-600 border-zinc-500 text-white' : 'bg-white border-gray-300 text-gray-800'}`}
                    placeholder="Task description"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Due Date</label>
                    <input
                      type="date"
                      value={newTaskDueDate}
                      onChange={(e) => setNewTaskDueDate(e.target.value)}
                      min={minDate}
                      className={`w-full p-2 rounded-lg border ${darkMode ? 'bg-zinc-600 border-zinc-500 text-white' : 'bg-white border-gray-300 text-gray-800'}`}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Priority</label>
                    <select
                      value={newTaskPriority}
                      onChange={(e) => setNewTaskPriority(e.target.value as 'Low' | 'Medium' | 'High')}
                      className={`w-full p-2 rounded-lg border ${darkMode ? 'bg-zinc-600 border-zinc-500 text-white' : 'bg-white border-gray-300 text-gray-800'}`}
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Assign To</label>
                  <select
                    value={newTaskAssignee}
                    onChange={(e) => setNewTaskAssignee(e.target.value)}
                    className={`w-full p-2 rounded-lg border ${darkMode ? 'bg-zinc-600 border-zinc-500 text-white' : 'bg-white border-gray-300 text-gray-800'}`}
                  >
                    <option value="">Select team member</option>
                    {selectedTeamMembers.map(member => (
                      <option key={member.id} value={member.id}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleCreateTask}
                  disabled={!newTaskTitle.trim() || !newTaskAssignee}
                  className={`px-4 py-2 rounded-lg text-white ${
                    !newTaskTitle.trim() || !newTaskAssignee
                      ? 'bg-gray-400'
                      : darkMode
                      ? 'bg-purple-600 hover:bg-purple-500'
                      : 'bg-purple-600 hover:bg-purple-500'
                  }`}
                >
                  Add Task
                </button>
              </div>

              {/* Debug info for tasks */}
              <div className="mt-4 p-2 bg-gray-100 rounded text-xs">
                 TempProject has {tempProject?.milestones?.length || 0} milestones and {tempProject?.tasks?.length || 0} tasks
              </div>

              {/* Show added tasks */}
              {tempProject?.tasks && tempProject.tasks.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-semibold mb-3">Added Tasks</h3>
                  <div className="space-y-3">
                    {tempProject.tasks.map((task) => (
                      <div
                        key={task.id}
                        className={`p-3 rounded-lg ${darkMode ? 'bg-zinc-600' : 'bg-white'} border ${darkMode ? 'border-zinc-500' : 'border-gray-200'}`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{task.title}</h4>
                            <p className="text-sm opacity-75">{task.description}</p>
                          </div>
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              task.priority === "High"
                                ? "bg-red-100 text-red-800"
                                : task.priority === "Medium"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {task.priority}
                          </span>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-sm">Assigned to: {task.assignee}</span>
                          <span className="text-sm">Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <button
            onClick={() => {
              if (formStep > 1) {
                navigateToStep(formStep - 1);
              } else {
                navigate('/dashboard/member/projects/mine');
              }
            }}
            className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
          >
            {formStep === 1 ? 'Cancel' : 'Back'}
          </button>

          <div className="flex space-x-2">
           {formStep < 3 && (
      selectedScrumMaster?.id === currentUser.id ||
      selectedTeamLeader?.id === currentUser.id ? (
        <button
          onClick={() => navigateToStep(formStep + 1)}
          disabled={!newProjectTitle.trim()}
          className={`px-4 py-2 rounded-lg text-white ${
            !newProjectTitle.trim() ? 'bg-gray-400' : 'bg-purple-600 hover:bg-purple-500'
          }`}
        >
          Next
        </button>
      ) : (
        <button
          onClick={handleCreateProject}
          disabled={!newProjectTitle.trim()}
          className={`px-4 py-2 rounded-lg text-white ${
            !newProjectTitle.trim() ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-500'
          }`}
        >
          Create Project
        </button>
      )
    )}

    {formStep === 3 && (
      <button
        onClick={handleCreateProject}
        className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-500"
      >
        Create Project
      </button>
    )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default MultistepProjectCreation;
