import { useState } from "react";
import { toast } from "react-toastify";
import { Paperclip, X, Image, FileText, Download, Search } from "lucide-react";

type TeamMember = {
  id: number;
  name: string;
  role: string;
  avatar?: string;
  status: 'online' | 'offline';
  unread?: number;
  isManager?: boolean;
  department: string;
};

type Department = {
  id: string;
  name: string;
  projects: Project[];
}

type Project = {
  id: number;
  name: string;
  members: number[];
};

type FileAttachment = {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
}

type Message = {
  id: number;
  sender: string;
  senderId: number;
  text: string;
  timestamp: string;
  isSupervisor?: boolean;
  attachments?: FileAttachment[];
  projectId?: number;
  recipientId?: number | 'all';
};
type ActiveChat = {
  type: 'search' | 'project' |'department'|'manager'| 'member';
  memberId?: number;
  projectId?: number;
}

const mockData = {
  departments: [
    {id: 'sdc', name: 'Software Development and Customization(SDC)',
      projects: [
        { id: 1, name: "Website Redesign", members: [70801, 70858, 70749, 70802] },
        { id: 2, name: "Mobile App", members: [70801, 70749, 70802] },
      ]
    },
    {id: 'design', name: 'Design',
      projects: [
        { id: 3, name: "UI Refresh", members: [70702, 70802] },
      ]
    }

  ],
  projects: [
    { id: 1, name: "Website Redesign", members: [70801, 70858, 70749, 70802] },
    { id: 2, name: "Mobile App", members: [70801, 70749, 70802] },
    { id: 3, name: "API Integration", members: [70858, 70749, 70802] },
  ],
  conversations: {
    // Project conversations (project-wide)
    1: [
      {id:1, sender:"Kalkidan", senderId: 70801, text:"Finished the sidebar layout", timestamp: "9:40 AM", projectId: 1, recipientId: 'all'},
      {id:2, sender:"Mahlet", senderId: 70858, text:"Need assistant on communication page", timestamp: "9:54 AM", projectId: 1, recipientId: 'all'},
      {id:3, sender:"Dehine", senderId: 70749, text:"Finished the login session", timestamp: "10:30 AM", projectId: 1, recipientId: 'all'},
      {id:4, sender:"You", senderId: 70802, text:"Great work! keep up, I will review it.", timestamp: "11:00 AM", isSupervisor: true, projectId: 1, recipientId: 'all'},
    ],
    // Individual conversations (within project 1)
    '1-70801': [
      {id:1, sender:"Kalkidan", senderId: 70801, text:"Hi supervisor, I've completed the sidebar", timestamp: "9:40 AM", projectId: 1, recipientId: 70802},
      {id:2, sender:"You", senderId: 70802, text:"Great job! Any issues?", timestamp: "9:45 AM", isSupervisor: true, projectId: 1, recipientId: 70801},
    ],
    // Manager conversation
    70701: [
      {id: 1, sender: "Genet", senderId: 70701, text:"How is the project going?", timestamp:"1:15 AM"},
      {id: 2, sender: "You", senderId: 70802, text:"it will be completed in two days", timestamp:"1:18 AM", isSupervisor: true},
    ]
  }
};

const Team = ({darkMode}:{darkMode:boolean}) => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    {id: 70801, name: "Kalkidan", role:"Frontend Developer",department: "SDC", status: "online", unread: 2 },
    {id: 70858, name: "Mahlet", role:"Frontend Developer",department: "SDC", status: "online", unread: 1 },
    {id: 70749, name:"Dehine", role:"Backend Developer",department: "SDC", status: "offline"},  
    {id: 70701, name:"Genet", role:"Manager",department: "SDC", status: "offline", isManager:true},
    {id: 70701, name:"Abinezer", role:"Designer",department: "Design", status: "offline"}, 
    {id: 70701, name:"Rediet", role:"Designer",department: "Design", status: "online"},


  ]);
  
  //const [projects] = useState<Project[]>(mockData.projects);
  const [messages, setMessages] = useState<Message[]>([]);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [activeChat, setActiveChat] = useState<ActiveChat>({type: 'department'});
  //const [departments] = useState<Department[]>([...]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all') ;
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  //const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const currentUserId = 70802;
  const getDisplayMembers = () => {
    if (searchQuery) {
      return teamMembers.filter(member => 
        member.id.toString().includes(searchQuery) ||
        member.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    // Project members
    if (selectedProject) {
      return teamMembers.filter(m => 
        selectedProject.members.includes(m.id) || m.isManager
      );
    }
    // Department members
    if (selectedDepartment !== 'all') {
      return teamMembers.filter(m => 
        m.department.toLowerCase() === selectedDepartment.toLowerCase()
      );
    }
    // All members
    return teamMembers;
  };

  const canAccessProject = (project: Project) => {
    return project.members.includes(currentUserId) || 
       teamMembers.find(m => m.id === currentUserId)?.isManager;
  }

  const getAccessibleProjects = () => {
    if (selectedDepartment === 'all') return [];
    const dept = mockData.departments.find(d => d.id === selectedDepartment);
    if (!dept) return [];
    return dept.projects.filter(canAccessProject);
  };

  // const getFilteredProjects = () => {
  //   if (selectedDepartment === ' all') return [];
  //   return mockData.departments.find(d => d.id === selectedDepartment)?.projects || [];
  // };

   const getCurrentMessages = () => {
    if (activeChat.type === 'manager') return mockData.conversations[70701];
    if (activeChat.type === 'member' && activeChat.memberId) {
      const projectId = selectedProject?.id || 'global';
      const key = `${projectId}-${activeChat.memberId}`;
      return mockData.conversations[key as keyof typeof mockData.conversations] || [];
    }
    if (selectedProject) {
      return mockData.conversations[selectedProject.id as keyof typeof mockData.conversations] || [];
    }
    return mockData.conversations.team || [];
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFileToUpload(e.target.files[0]);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image size={16} className="mr-1" />;
    if (type === 'application/pdf') return <FileText size={16} className="mr-1" />;
    return <FileText size={16} className="mr-1" />;
  };

  const handleSendMessage = async () => {
    if (!(newMessage.trim() || fileToUpload) || !selectedProject) return;
    
    let attachments: FileAttachment[] = [];
    
    if (fileToUpload) {
      setIsUploading(true);
      try {
        // Simulate upload progress
        for (let progress = 0; progress <= 100; progress += 10) {
          await new Promise(resolve => setTimeout(resolve, 100));
          setUploadProgress(progress);
        }


        attachments = [{
          id: Date.now().toString(),
          name: fileToUpload.name,
          size: fileToUpload.size,
          type: fileToUpload.type,
          url: URL.createObjectURL(fileToUpload) // In real app, use server URL
        }];
      } catch (error) {
        toast.error("Failed to upload file");
        console.error("Upload error:", error);
        return;
      } finally {
        setIsUploading(false);
      }
    }

    const newMsg: Message = {
      id: messages.length + 1,
      sender: "You",
      senderId: 70802,
      text: newMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isSupervisor: true,
      attachments,
      projectId: selectedProject.id,
      recipientId: activeChat.type === 'member' && activeChat.memberId ? activeChat.memberId : 'all'
    };

    //where to store the message
    let conversationKey: string | number;
    if (activeChat.type === 'manager') {
      conversationKey = 70701;
    } else if (activeChat.type === 'member' && activeChat.memberId) {
      conversationKey = `${selectedProject.id}-${activeChat.memberId}`;
    } else {
      conversationKey = selectedProject.id;
    }

    // Update the appropriate conversation
    if (!mockData.conversations[conversationKey as keyof typeof mockData.conversations]) {
      mockData.conversations[conversationKey as keyof typeof mockData.conversations] = [];
    }
    mockData.conversations[conversationKey as keyof typeof mockData.conversations].push(newMsg);

    // Update state to trigger re-render
    setMessages([...messages, newMsg]);
    setNewMessage('');
    setFileToUpload(null);
    setUploadProgress(0);
  };

  const handleMemberClick = (memberId: number) => {
    //if(!selectedProject) return;
    const isManager = memberId === 70701;
    setActiveChat({
      type: isManager ? 'manager' : 'member',
      memberId
    });
    setSearchQuery('');
     
    setTeamMembers(teamMembers.map(member => 
      member.id === memberId ? {...member, unread: 0} : member
    ));
  };
 
  return (
    <div className={`min-h-screen transition-colors duration-200 ${darkMode ? "bg-zinc-800" : "bg-gray-50"}`}>
      <div className="container mx-auto p-4">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Contacts Panel */}
          <div className={`w-full md:w-1/3 rounded-lg shadow-md p-4 ${darkMode ? "bg-zinc-700 text-gray-300" : "bg-gray-100 text-gray-700"} overflow-y-auto`}>
            <h2 className="text-xl font-bold mb-4">Contacts</h2>
            <div className="mb-4 relative">
              <div className={`flex items-center rounded-lg px-3 py-2 ${darkMode ? "bg-zinc-600" : "bg-white"}`}>
                <Search size={18} className="text-gray-400 mr-2"/>
                <input type="text"
                       value={searchQuery}
                       onChange={(e) => {setSearchQuery(e.target.value);
                              if (e.target.value) {
                                setActiveChat({type: 'search'});
                                setSelectedProject(null);
                              }
                       }}
                       placeholder="Search by ID or name"
                       className={`flex-1 outline-none ${darkMode ? "bg-zinc-600 text-white" : "bg-white"}`}/>
                 {searchQuery && (
                  <button onClick={() => { setSearchQuery('');
                                   setActiveChat({type: 'department'})
                         }}
                         className="text-gray-400 hover:text-gray-200">
                     <X size={18}/>
                  </button>
                 )}       
              </div>
            </div>


            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Department</label>
              <select value={selectedDepartment}
                      onChange={(e) =>{ 
                        setSelectedDepartment(e.target.value);
                        setSelectedProject(null);
                        setActiveChat({type: 'department'});
                        setSearchQuery('');
                      }}
                      className={`w-full p-2 rounded-lg ${darkMode ? "bg-zinc-600 text-white ": "bg-white text-gray-700"}`}>
                        <option value="all"> All Departments</option>
                        {mockData.departments.map(dept => (
                          <option key={dept.id} value={dept.id}>{dept.name}</option>
                        ))}
              </select>
            </div>

            {selectedDepartment !== 'all' && !searchQuery && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1"> Project </label>
                <select value={selectedProject?.id || ''}
                       onChange={(e) => {
                        const project = getAccessibleProjects().find(p => p.id.toString() === e.target.value) || null;
                        setSelectedProject(project);
                        setActiveChat(project ? {type: 'project'} : {type: 'department'});
                       }}
                       className={`w-full p-2 rounded-lg ${darkMode ? "bg-zinc-600 text-white": "bg-white text-gray-700"}`}>
                   <option value="">Select Project</option>
                   {getAccessibleProjects().map(project => (
                    <option key={project.id} value={project.id}>{project.name}</option>
                   ))}
                </select>
              </div>
            )}
            <div className="mt-6 space-y-3">
              <h3 className="font-semibold mb-2 text-sm uppercase tracking-wider">
                {searchQuery ? 'Search Results' :
                 selectedProject ? `${selectedProject.name} Members` :
                 selectedDepartment === 'all' ? 'All Employees' :
                 `${mockData.departments.find(d => d.id === selectedDepartment)?.name} Members`}
                ({getDisplayMembers().filter(m => !m.isManager).length})
              </h3>
              <span className="text-sm opacity-75">
                {getDisplayMembers().filter(m => m.status === 'online').length} online
              </span>
            
               <div className="mb-4">
                 <h3 className="font-semibold mb-2 text-sm uppercase tracking-wider">Management</h3>
                 {teamMembers.filter(m => m.isManager).map(member => (
                   <div 
                     key={member.id}
                     onClick={() => handleMemberClick(member.id)}
                     className={`flex items-center p-3 rounded-lg cursor-pointer ${activeChat.type === 'manager' ? 
                       darkMode ? "bg-gray-500" : "bg-gray-300" :  darkMode ? "hover:bg-zinc-600" : "hover:bg-gray-200"}`}>
                     <div className="relative">
                       <div className={`w-10 h-10 rounded-full flex items-center justify-center ${darkMode ? "bg-zinc-800" : "bg-white"}`}>
                         {member.name.charAt(0)}
                       </div>
                       <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 ${darkMode ? "border-gray-500" : "border-gray-300"} 
                         ${member.status === 'online' ? 'bg-green-500' : 'bg-gray-400'}`}/>
                     </div>
                     <div className="ml-3">
                       <p className="font-medium">{member.name}</p>
                       <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                         Project Manager
                       </p>
                     </div>
                   </div>
                  ))}
               </div>


               <div className="mt-6">
                 <h3 className="font-semibold mb-2 text-sm uppercase tracking-wider">Team Members</h3>
                 {getDisplayMembers().filter(m => !m.isManager).map(member => (
                   <div 
                    key={member.id}
                    onClick={() => handleMemberClick(member.id)}
                    className={`flex items-center p-3 rounded-lg cursor-pointer mb-2 ${activeChat.type === 'member' && activeChat.memberId === member.id ? 
                      darkMode ? "bg-purple-400" : "bg-purple-300" : darkMode ? "hover:bg-zinc-600" : "hover:bg-gray-200"}`}>
                    <div className="relative">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${darkMode ? "bg-zinc-800" : "bg-white"}`}>
                         {member.name.charAt(0)}
                      </div>
                      <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 ${darkMode ? "border-gray-500" : "border-gray-300"} 
                        ${member.status === 'online' ? 'bg-green-500' : 'bg-gray-400'}`}/>
                    </div> 
                    <div className="ml-3 flex-1">
                      <p className={`font-semibold ${darkMode ? "text-gray-200" : "text-gray-700"}`}>{member.name}</p>
                      <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>{member.role}</p>
                    </div>
                    {(member.unread && member.unread > 0 && !(activeChat.type === 'member' && activeChat.memberId === member.id)) ? (
                      <span className={`text-xs px-2 py-1 rounded-full ${darkMode ? "bg-blue-400 text-white" : "bg-blue-100 text-blue-800"}`}>
                        {member.unread}
                     </span>
                    ): null}
                   </div>
                 ))}
               </div>
              </div>
          </div>
         
          {/* Chat Panel */}
          <div className={`w-full md:w-2/3 rounded-lg shadow-md p-4 flex flex-col ${darkMode ? "bg-zinc-700 text-gray-300" : "bg-white text-gray-700"}`}>
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-300 dark:border-gray-700">
              <h2 className="text-xl font-bold">
                {activeChat.type === 'manager' ? "Manager Chat" :
                 activeChat.type === 'member' ? `Chat with ${teamMembers.find(m => m.id === activeChat.memberId)?.name || 'Member'}` :
                 selectedProject ? `${selectedProject.name} Team Chat` :
                 searchQuery ? "Direct Message" :
                 "Team Chat"}
              </h2>
              {selectedProject && activeChat.type !== 'project' && (
                <button
                  onClick={() => setActiveChat({type: 'project'})}
                  className={`text-sm px-3 py-1 rounded ${
                    darkMode ? "bg-gray-500 hover:bg-gray-600 text-white" : "bg-gray-200 hover:bg-gray-300"}`}
                >
                  ← Back to Project
                </button>
              )}
            </div>


            {/* Messages */}
            
              <div className="flex-1 overflow-y-auto mb-4 space-y-4">
                {getCurrentMessages().map((message) => (
                  <div key={message.id} className={`flex ${message.isSupervisor ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs md:max-w-md rounded-lg p-3 ${message.isSupervisor ? 
                        darkMode ? "bg-blue-600 text-white" : "bg-blue-500 text-white" : 
                        darkMode ? "bg-gray-700 text-gray-100" : "bg-gray-200 text-gray-700"}`}>
                       {!message.isSupervisor && (
                         <p className="font-semibold">{message.sender}</p>
                       )}
                       <p>{message.text}</p>
                    
                      {/* File Attachments */}
                      {message.attachments?.map(file => (
                        <div key={file.id} className={`mt-2 p-2 rounded flex items-center ${darkMode ? "bg-blue-800" : "bg-blue-100"}`}>
                           {getFileIcon(file.type)}
                          <div className="ml-2 flex-1 min-w-0">
                             <p className="text-sm truncate">{file.name}</p>
                             <div className="flex justify-between text-xs mt-1">
                               <span>{formatFileSize(file.size)}</span>
                               <a 
                                 href={file.url} 
                                 download={file.name}
                                 className="text-blue-500 hover:text-blue-700">
                                 <Download size={14} />
                               </a>
                             </div>
                          </div>
                        </div>
                      ))}
                    
                      <p className={`text-xs mt-1 ${message.isSupervisor ? "text-blue-200" : darkMode ? "text-gray-400" : "text-gray-500"}`}>
                        {message.timestamp}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            
            {/* Message Input */}
            
              <div className="sticky bottom-0 mb-4 bg-inherit pt-4">
                 {/* File Upload Preview */}
                {fileToUpload && (
                <div className={`mb-2 p-3 rounded flex items-center justify-between ${darkMode ? "bg-zinc-600" : "bg-gray-200"}`}>
                  <div className="flex items-center">
                    <Paperclip size={16} className="mr-2" />
                    <span className="text-sm truncate max-w-xs">{fileToUpload.name}</span>
                  </div>
                  <div className="flex items-center">
                    {isUploading && (
                      <div className={`w-24 h-1 rounded-full mr-2 ${darkMode ? "bg-zinc-500" : "bg-gray-300"}`}>
                        <div 
                          className={`h-full rounded-full ${darkMode ? "bg-blue-400" : "bg-blue-500"}`}
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                    )}
                    <button 
                      onClick={() => setFileToUpload(null)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
                )}


              <div className="flex gap-2">
                <label className={`p-2 rounded-lg cursor-pointer ${darkMode ? " hover:bg-zinc-500" : " hover:bg-gray-300"}`}>
                  <input 
                    type="file"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Paperclip size={20} />
                </label>
                
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className={`flex-1 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 transition ${
                    darkMode ? "bg-zinc-600 border-gray-600 focus:ring-blue-500 placeholder-gray-400" : 
                    "bg-gray-100 border-gray-300 focus:ring-blue-500 placeholder-gray-500"
                  }`}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                />
                
                <button
                  onClick={handleSendMessage}
                  disabled={!(newMessage.trim() || fileToUpload) || isUploading}
                  className={`px-4 py-2 rounded-lg transition ${
                    darkMode ? "bg-blue-600 hover:bg-blue-700 text-white" : 
                    "bg-blue-500 hover:bg-blue-600 text-white"
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

export default Team;
