import React, { useState } from "react";
import { Paperclip, X, Image, FileText, Download } from "lucide-react";

type User = { id: number; name: string; role: string; };
type Project = { id: number; name: string; members: User[]; createdBy: number; };
type Task = { id: number; title: string; assignedBy: User; projectId: number; };
type FileAttachment = { id: string; name: string; size: number; type: string; url: string; };
type Message = { id: number; sender: User; text: string; timestamp: string; attachments?: FileAttachment[]; contextType: 'task' | 'project'; contextId: number; recipientId?: number | 'all'; };

type ChatMode = 'tasks' | 'projects';

interface ChatProps {
  darkMode: boolean;
}

const manager: User = { id: 1, name: "Manager", role: "manager" };
const superiors: User[] = [
    { id: 2, name: "Director", role: "director" },
    { id: 3, name: "VP", role: "vice_president" }
];
const members: User[] = [
    { id: 4, name: "Alice", role: "developer" },
    { id: 5, name: "Bob", role: "designer" },
    { id: 6, name: "Carol", role: "qa" }
];
const projects: Project[] = [
    { id: 1, name: "Website Redesign", members, createdBy: manager.id },
    { id: 2, name: "Mobile App", members: [members[0], members[2]], createdBy: manager.id }
];
const tasks: Task[] = [
    { id: 1, title: "Prepare Report", assignedBy: superiors[0], projectId: 1 },
    { id: 2, title: "Review UI", assignedBy: superiors[1], projectId: 2 }
];

const initialChatHistory: Record<string, Message[]> = {};

const Chat: React.FC<ChatProps> = ({ darkMode }) => {
    const [mode, setMode] = useState<ChatMode>('tasks');
    const [selectedTask, setSelectedTask] = useState<Task | null>(tasks[0]);
    const [selectedSuperior, setSelectedSuperior] = useState<User | null>(superiors[0]);
    const [selectedProject, setSelectedProject] = useState<Project | null>(projects[0]);
    const [selectedMember, setSelectedMember] = useState<User | null>(null);
    const [chatHistory, setChatHistory] = useState<Record<string, Message[]>>(initialChatHistory);
    const [newMessage, setNewMessage] = useState('');
    const [fileToUpload, setFileToUpload] = useState<File | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);

    const getChatKey = () => {
        if (mode === 'tasks' && selectedTask && selectedSuperior) {
            return `task-${selectedTask.id}-sup-${selectedSuperior.id}`;
        }
        if (mode === 'projects' && selectedProject) {
            if (selectedMember) return `project-${selectedProject.id}-mem-${selectedMember.id}`;
            return `project-${selectedProject.id}-group`;
        }
        return '';
    };

    const getChatLabel = () => {
        if (mode === 'tasks' && selectedTask && selectedSuperior) {
            return `Chat with ${selectedSuperior.name} (Task: ${selectedTask.title})`;
        }
        if (mode === 'projects' && selectedProject) {
            if (selectedMember) return `Chat with ${selectedMember.name} (Project: ${selectedProject.name})`;
            return `Group Chat: ${selectedProject.name}`;
        }
        return '';
    };

    const getCurrentMessages = () => {
        const key = getChatKey();
        return chatHistory[key] || [];
    };

    const getSuperiorsForTask = (task: Task) => [task.assignedBy];
    const getMembersForProject = (project: Project) => project.members;

    const handleSendMessage = async () => {
        if (!(newMessage.trim() || fileToUpload)) return;
        let attachments: FileAttachment[] = [];
        if (fileToUpload) {
            setIsUploading(true);
            try {
                for (let progress = 0; progress <= 100; progress += 10) {
                    await new Promise(resolve => setTimeout(resolve, 50));
                    setUploadProgress(progress);
                }
                attachments = [{
                    id: Date.now().toString(),
                    name: fileToUpload.name,
                    size: fileToUpload.size,
                    type: fileToUpload.type,
                    url: URL.createObjectURL(fileToUpload)
                }];
            } finally {
                setIsUploading(false);
            }
        }
        const key = getChatKey();
        const contextType = mode === 'tasks' ? 'task' : 'project';
        const contextId = mode === 'tasks' && selectedTask ? selectedTask.id : mode === 'projects' && selectedProject ? selectedProject.id : 0;
        const recipientId = mode === 'tasks' && selectedSuperior ? selectedSuperior.id : mode === 'projects' && selectedMember ? selectedMember.id : 'all';
        const msg: Message = {
            id: (chatHistory[key]?.length || 0) + 1,
            sender: manager,
            text: newMessage,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            attachments,
            contextType,
            contextId,
            recipientId
        };
        setChatHistory(prev => ({ ...prev, [key]: [...(prev[key] || []), msg] }));
        setNewMessage('');
        setFileToUpload(null);
        setUploadProgress(0);
    };

    return (
        <div className={`min-h-screen ${darkMode ? "bg-zinc-900" : "bg-gray-50"}`}>
            <div className="container mx-auto p-4">
                <div className="flex flex-col md:flex-row gap-6">
                    {/* Left Panel: Mode & Selection */}
                    <div className={`w-full md:w-1/3 rounded-lg shadow-md p-4 overflow-y-auto ${
                        darkMode ? "bg-zinc-800 text-zinc-200" : "bg-gray-100 text-gray-700"
                    }`}>
                        <h2 className={`text-xl font-bold mb-4 ${darkMode ? "text-zinc-100" : ""}`}>Chat Mode</h2>
                        <div className="mb-4">
                            <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-zinc-300" : ""}`}>Mode</label>
                            <select 
                                value={mode} 
                                onChange={e => {
                                    setMode(e.target.value as ChatMode);
                                    setSelectedMember(null);
                                }} 
                                className={`w-full p-2 rounded-lg ${
                                    darkMode ? "bg-zinc-700 border-zinc-600 text-zinc-100" : "bg-white text-gray-700"
                                }`}
                            >
                                <option value="tasks">Tasks</option>
                                <option value="projects">Projects</option>
                            </select>
                        </div>
                        {mode === 'tasks' && (
                            <>
                                <div className="mb-4">
                                    <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-zinc-300" : ""}`}>Select Task</label>
                                    <select 
                                        value={selectedTask?.id || ''} 
                                        onChange={e => {
                                            const t = tasks.find(t => t.id === Number(e.target.value)) || null;
                                            setSelectedTask(t);
                                            setSelectedSuperior(t ? t.assignedBy : null);
                                        }} 
                                        className={`w-full p-2 rounded-lg ${
                                            darkMode ? "bg-zinc-700 border-zinc-600 text-zinc-100" : "bg-white text-gray-700"
                                        }`}
                                    >
                                        {tasks.map(task => (
                                            <option key={task.id} value={task.id}>{task.title}</option>
                                        ))}
                                    </select>
                                </div>
                                {selectedTask && (
                                    <div className="mb-4">
                                        <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-zinc-300" : ""}`}>Superior</label>
                                        {getSuperiorsForTask(selectedTask).map(sup => (
                                            <div 
                                                key={sup.id} 
                                                className={`flex items-center p-3 rounded-lg cursor-pointer mb-2 ${
                                                    darkMode 
                                                        ? selectedSuperior?.id === sup.id 
                                                            ? "bg-zinc-700 ring-2 ring-blue-400" 
                                                            : "bg-zinc-700 hover:bg-zinc-600"
                                                        : selectedSuperior?.id === sup.id 
                                                            ? "bg-gray-200 ring-2 ring-blue-400" 
                                                            : "bg-gray-200 hover:bg-gray-300"
                                                }`}
                                                onClick={() => setSelectedSuperior(sup)}
                                            >
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                                    darkMode ? "bg-zinc-600 text-zinc-100" : "bg-white"
                                                } mr-3`}>
                                                    {sup.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-medium">{sup.name}</p>
                                                    <p className={`text-sm ${
                                                        darkMode ? "text-zinc-400" : "text-gray-600"
                                                    }`}>{sup.role}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                        {mode === 'projects' && (
                            <>
                                <div className="mb-4">
                                    <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-zinc-300" : ""}`}>Select Project</label>
                                    <select 
                                        value={selectedProject?.id || ''} 
                                        onChange={e => {
                                            const p = projects.find(p => p.id === Number(e.target.value)) || null;
                                            setSelectedProject(p);
                                            setSelectedMember(null);
                                        }} 
                                        className={`w-full p-2 rounded-lg ${
                                            darkMode ? "bg-zinc-700 border-zinc-600 text-zinc-100" : "bg-white text-gray-700"
                                        }`}
                                    >
                                        {projects.map(project => (
                                            <option key={project.id} value={project.id}>{project.name}</option>
                                        ))}
                                    </select>
                                </div>
                                {selectedProject && (
                                    <>
                                        <div className="mb-4">
                                            <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-zinc-300" : ""}`}>Project Members</label>
                                            <div 
                                                className={`mb-2 flex items-center p-3 rounded-lg cursor-pointer ${
                                                    darkMode 
                                                        ? !selectedMember 
                                                            ? "bg-zinc-700 ring-2 ring-blue-400" 
                                                            : "bg-zinc-700 hover:bg-zinc-600"
                                                        : !selectedMember 
                                                            ? "bg-gray-300 ring-2 ring-blue-400" 
                                                            : "bg-gray-200 hover:bg-gray-300"
                                                }`}
                                                onClick={() => setSelectedMember(null)}
                                            >
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                                    darkMode ? "bg-zinc-600 text-zinc-100" : "bg-white"
                                                } mr-3`}>G</div>
                                                <div>
                                                    <p className="font-medium">Group Chat</p>
                                                    <p className={`text-sm ${
                                                        darkMode ? "text-zinc-400" : "text-gray-600"
                                                    }`}>All members</p>
                                                </div>
                                            </div>
                                            {getMembersForProject(selectedProject).map(mem => (
                                                <div 
                                                    key={mem.id} 
                                                    className={`flex items-center p-3 rounded-lg cursor-pointer mb-2 ${
                                                        darkMode 
                                                            ? selectedMember?.id === mem.id 
                                                                ? "bg-zinc-700 ring-2 ring-blue-400" 
                                                                : "bg-zinc-700 hover:bg-zinc-600"
                                                            : selectedMember?.id === mem.id 
                                                                ? "bg-gray-200 ring-2 ring-blue-400" 
                                                                : "bg-gray-200 hover:bg-gray-300"
                                                    }`}
                                                    onClick={() => setSelectedMember(mem)}
                                                >
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                                        darkMode ? "bg-zinc-600 text-zinc-100" : "bg-white"
                                                    } mr-3`}>
                                                        {mem.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">{mem.name}</p>
                                                        <p className={`text-sm ${
                                                            darkMode ? "text-zinc-400" : "text-gray-600"
                                                        }`}>{mem.role}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </>
                        )}
                    </div>
                    {/* Chat Panel */}
                    <div className={`w-full md:w-2/3 rounded-lg shadow-md p-4 flex flex-col ${
                        darkMode ? "bg-zinc-800 text-zinc-200" : "bg-white text-gray-700"
                    }`}>
                        <div className={`flex justify-between items-center mb-4 pb-2 ${
                            darkMode ? "border-zinc-700" : "border-gray-300"
                        } border-b`}>
                            <h2 className={`text-xl font-bold ${darkMode ? "text-zinc-100" : ""}`}>{getChatLabel()}</h2>
                        </div>
                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto mb-4 space-y-4" style={{ minHeight: 300 }}>
                            {getCurrentMessages().map((message) => (
                                <div key={message.id} className={`flex ${
                                    message.sender.id === manager.id ? 'justify-end' : 'justify-start'
                                }`}>
                                    <div className={`max-w-xs md:max-w-md rounded-lg p-3 ${
                                        message.sender.id === manager.id
                                            ? darkMode
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-blue-500 text-white'
                                            : darkMode
                                                ? 'bg-zinc-700 text-zinc-200'
                                                : 'bg-gray-200 text-gray-700'
                                    }`}>
                                        {message.sender.id !== manager.id && (
                                            <p className="font-semibold">{message.sender.name}</p>
                                        )}
                                        <p>{message.text}</p>
                                        {/* File Attachments */}
                                        {message.attachments?.map(file => (
                                            <div key={file.id} className={`mt-2 p-2 rounded flex items-center ${
                                                darkMode ? "bg-blue-900/50" : "bg-blue-100"
                                            }`}>
                                                {file.type.startsWith('image/') ? 
                                                    <Image size={16} className="mr-1" /> : 
                                                    <FileText size={16} className="mr-1" />
                                                }
                                                <div className="ml-2 flex-1 min-w-0">
                                                    <p className="text-sm truncate">{file.name}</p>
                                                    <div className="flex justify-between text-xs mt-1">
                                                        <span>{(file.size / 1024).toFixed(1)} KB</span>
                                                        <a 
                                                            href={file.url} 
                                                            download={file.name} 
                                                            className={`${
                                                                darkMode ? "text-blue-400 hover:text-blue-300" : "text-blue-500 hover:text-blue-700"
                                                            }`}
                                                        >
                                                            <Download size={14} />
                                                        </a>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        <p className={`text-xs mt-1 ${
                                            darkMode ? "text-blue-300" : "text-blue-200"
                                        }`}>{message.timestamp}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {/* Message Input */}
                        <div className="sticky bottom-0 mb-4 bg-inherit pt-4">
                            {/* File Upload Preview */}
                            {fileToUpload && (
                                <div className={`mb-2 p-3 rounded flex items-center justify-between ${
                                    darkMode ? "bg-zinc-700" : "bg-gray-200"
                                }`}>
                                    <div className="flex items-center">
                                        <Paperclip size={16} className="mr-2" />
                                        <span className="text-sm truncate max-w-xs">{fileToUpload.name}</span>
                                    </div>
                                    <div className="flex items-center">
                                        {isUploading && (
                                            <div className={`w-24 h-1 rounded-full mr-2 ${
                                                darkMode ? "bg-zinc-600" : "bg-gray-300"
                                            }`}>
                                                <div className="h-full rounded-full bg-blue-500" style={{ width: `${uploadProgress}%` }}></div>
                                            </div>
                                        )}
                                        <button 
                                            onClick={() => setFileToUpload(null)} 
                                            className={`${
                                                darkMode ? "text-red-400 hover:text-red-300" : "text-red-500 hover:text-red-700"
                                            }`}
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                </div>
                            )}
                            <div className="flex gap-2">
                                <label className={`p-2 rounded-lg cursor-pointer ${
                                    darkMode ? "hover:bg-zinc-700" : "hover:bg-gray-300"
                                }`}>
                                    <input type="file" onChange={e => setFileToUpload(e.target.files?.[0] || null)} className="hidden" />
                                    <Paperclip size={20} />
                                </label>
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={e => setNewMessage(e.target.value)}
                                    placeholder="Type a message..."
                                    className={`flex-1 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 transition ${
                                        darkMode 
                                            ? "bg-zinc-700 border-zinc-600 focus:ring-blue-500 placeholder-zinc-400" 
                                            : "bg-gray-100 border-gray-300 focus:ring-blue-500 placeholder-gray-500"
                                    }`}
                                    onKeyPress={e => e.key === "Enter" && handleSendMessage()}
                                />
                                <button
                                    onClick={handleSendMessage}
                                    disabled={!(newMessage.trim() || fileToUpload) || isUploading}
                                    className={`px-4 py-2 rounded-lg transition ${
                                        darkMode 
                                            ? "bg-blue-600 hover:bg-blue-700 text-white" 
                                            : "bg-blue-500 hover:bg-blue-600 text-white"
                                    } disabled:opacity-50`}
                                >
                                    Send
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Chat;