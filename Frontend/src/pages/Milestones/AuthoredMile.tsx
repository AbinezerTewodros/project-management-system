import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Edit, Trash2, Plus, Users,  Paperclip, X, ChevronLeft, Calendar, Flag, UserCircle, RefreshCw } from 'lucide-react';
import DataTable from 'react-data-table-component';
import { Dialog } from '@headlessui/react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Reuse types from MyTasks
type Member = {
  id: number;
  name: string;
  role: string;
  projectId: string[];
};

type Project = {
  id: string;
  name: string;
  members: string[];
};

type Comment = {
  id: string;
  author: string;
  content: string;
  timestamp: Date;
};

type FileAttachment = {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  lastModified?: number;
};

type SubTask = {
  id: string;
  title: string;
  description: string;
  priority: 'High' | 'Medium' | 'Low' | 'Urgent';
  assignee: string;
  status: 'To Do' | 'In Progress' | 'Done';
  key: string;
  progress: number;
  weight?: number;
  completed?: boolean;
};

type Task = {
  id: string;
  title: string;
  priority: 'High' | 'Medium' | 'Low' | 'Urgent';
  description: string;
  assignee: string;
  status?: 'To Do' | 'In Progress' | 'Done';
  dueDate?: string;
  project: string;
  key: string;
  weight?: number;
  progress: number;
  lastUpdated?: string;
  subtask: SubTask[];
  files?: FileAttachment[];
  deleted?: boolean;
  comments?: Comment[];
};

type Milestone = {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  status: 'To Do' | 'In Progress' | 'Done';
  progress: number;
  assignedTo: string;
  createdBy: string;
  project: string;
  weight: number;
  tasks: Task[];
  createdAt: string;
  comments?: Comment[];
  files?: FileAttachment[];
};

// (Removed local mock data — component uses API-driven data)

interface AuthoredMileProps {
  darkMode: boolean;
  showHeader?: boolean;
}

const AuthoredMile = ({ darkMode, showHeader }: AuthoredMileProps) => {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [projectMembers, setProjectMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [newAssignee, setNewAssignee] = useState('');
  const [showDetailView, setShowDetailView] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedAttachment, setSelectedAttachment] = useState<FileAttachment | null>(null);
  
  // Form state
  const [newMilestone, setNewMilestone] = useState<Partial<Milestone>>({
    title: '',
    description: '',
    dueDate: '',
    priority: 'Medium' as const,
    assignedTo: '',
    project: '',
    weight: 5
  });

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // ✅ Fetch real milestone data from API
  useEffect(() => {
    const fetchMilestones = async () => {
      try {
        setIsLoading(true);
        console.log('📊 Fetching authored milestones from API...');
        
        const { milestoneService } = await import('@/services/milestoneService');
        const { projectService } = await import('@/services/projectService');
        const { userService } = await import('@/services/userService');
        
        // Fetch all milestones
        const milestonesResponse = await milestoneService.getAllMilestones();
        console.log('📊 Milestones response:', milestonesResponse);
        
        // Fetch all projects
        const projectsResponse = await projectService.getAllProjects();
        console.log('📊 Projects response:', projectsResponse);
        
        // Fetch all users
        const usersResponse = await userService.getAllUsers();
        console.log('📊 Users response:', usersResponse);
        
        // Transform API milestones to component format
        const users = usersResponse?.data || [];
        const transformedMilestones: Milestone[] = (milestonesResponse.data || []).map((m: any) => {
          // Resolve assignedTo: prefer name fields, otherwise look up by assignedMemberId in users
          const nameFromPayload = m.assignedMemberName || m.assignedTo || m.assigneeName || '';
          let assignedToResolved = nameFromPayload;
          if ((!assignedToResolved || assignedToResolved === '') && (m.assignedMemberId || m.assignedToId || m.assigneeId)) {
            const aid = m.assignedMemberId || m.assignedToId || m.assigneeId;
            const matched = users.find((u: any) => String(u.id) === String(aid) || String(u.userId) === String(aid) || String(u.employeeId) === String(aid));
            assignedToResolved = matched ? String((matched as any).userName || (matched as any).fullName || (matched as any).name || (matched as any).email || (matched as any).user?.name || aid) : String(aid);
          }

          return {
            id: m.milestoneId?.toString() || '',
            title: m.milestoneName || 'Untitled',
            description: m.description || '',
            dueDate: m.dueDate || '',
            priority: m.priority || 'Medium',
            status: m.status || 'To Do',
            progress: m.progress || 0,
            assignedTo: assignedToResolved || '',
            createdBy: 'You',
            project: m.projectId?.toString() || '',
            weight: m.weight || 5,
            tasks: [],
            createdAt: m.createdAt || new Date().toISOString(),
            comments: [],
            files: []
          } as Milestone;
        });
        
        // Transform projects
        const transformedProjects: Project[] = (projectsResponse.data || []).map((p: any) => ({
          id: p.projectId?.toString() || p.id?.toString() || '',
          name: p.projectName || p.name || 'Unnamed Project',
          members: []
        }));
        
        // Transform members
        const transformedMembers: Member[] = (usersResponse.data || []).map((u: any) => ({
          id: u.userId || u.id || 0,
          name: u.userName || u.name || 'Unknown',
          role: u.role || 'Member',
          projectId: []
        }));
        
        console.log('✅ Transformed milestones:', transformedMilestones.length);
        console.log('✅ Transformed projects:', transformedProjects.length);
        console.log('✅ Transformed members:', transformedMembers.length);
        
        setMilestones(transformedMilestones);
        setProjects(transformedProjects);
        setAllMembers(transformedMembers);
        setIsLoading(false);
        
      } catch (error) {
        console.error('❌ Error fetching milestones:', error);
        setIsLoading(false);
      }
    };
    
    fetchMilestones();
  }, []);

  // Reusable helper to fetch and resolve project members
  const fetchAndSetProjectMembers = async (projectIdRaw?: string | number) => {
    if (!projectIdRaw) {
      setProjectMembers([]);
      return [] as Member[];
    }

    // Resolve projectId to a numeric id if possible. Accept numeric strings or lookup by project list.
    let projectId: number | undefined;
    if (typeof projectIdRaw === 'number') projectId = projectIdRaw;
    else if (typeof projectIdRaw === 'string') {
      if (/^\d+$/.test(projectIdRaw)) projectId = parseInt(projectIdRaw, 10);
      else {
        const found = projects.find(p => p.id === projectIdRaw || p.name === projectIdRaw);
        if (found) projectId = parseInt(String(found.id), 10);
      }
    }

    if (!projectId || Number.isNaN(projectId)) {
      console.warn('⚠️ fetchAndSetProjectMembers: could not resolve numeric projectId for', projectIdRaw);
      setProjectMembers([]);
      return [] as Member[];
    }

    try {
      const { projectAssignmentService } = await import('@/services/projectAssignmentService');
      const res: any = await projectAssignmentService.getProjectMembers(projectId);
      const members = res && res.data ? (Array.isArray(res.data) ? res.data : (res.data.members || res.data.data || [])) : [];
      console.log('👥 Raw project members payload (fetchAndSet):', members);

      const transformed: Member[] = members.map((m: any, idx: number) => {
        if (typeof m === 'string') {
          return { id: idx + 1, name: m, role: 'Member', projectId: [String(projectId)] } as Member;
        }
        const get = (obj: any, ...keys: string[]) => {
          for (const k of keys) {
            if (!obj) continue;
            if (k.includes('.')) {
              const parts = k.split('.');
              let cur = obj;
              for (const p of parts) {
                cur = cur?.[p];
                if (cur === undefined) break;
              }
              if (cur) return cur;
            } else if (obj[k] !== undefined && obj[k] !== null && obj[k] !== '') {
              return obj[k];
            }
          }
          return undefined;
        };

        const possibleName = get(m,
          'name', 'userName', 'UserName', 'employeeName', 'EmployeeName', 'fullName', 'FullName', 'memberName', 'MemberName',
          'displayName', 'DisplayName', 'profile.displayName', 'user.fullName', 'user.name', 'person.fullName', 'firstName', 'lastName', 'email', 'Email'
        );
        let derivedName = '';
        if (possibleName) {
          if (typeof possibleName === 'object') {
            derivedName = `${possibleName.firstName || possibleName.first || ''} ${possibleName.lastName || possibleName.last || ''}`.trim();
          } else {
            derivedName = String(possibleName);
          }
        } else if ((m.firstName || m.lastName)) {
          derivedName = `${m.firstName || ''} ${m.lastName || ''}`.trim();
        }
        if (!derivedName) derivedName = m.name || m.userName || m.employeeId || m.id || `Member-${idx + 1}`;
        if (!derivedName || derivedName === '') {
          console.warn('⚠️ Unresolved project member name for payload item (fetchAndSet):', m);
          derivedName = `Member-${idx + 1}`;
        }
        return {
          id: m.id || m.employeeId || m.memberId || m.userId || idx + 1,
          name: derivedName as string,
          role: m.role || m.memberRole || 'Member',
          projectId: [String(projectId)]
        } as Member;
      });

      // Attempt resolution using userService if the names look like numeric IDs
      try {
        const unresolved = transformed.filter(m => /^\d+$/.test(String(m.name)) || /^Member-\d+$/.test(String(m.name)));
        if (unresolved.length > 0) {
          const { userService } = await import('@/services/userService');
          const usersResp: any = await userService.getAllUsers();
          const users = usersResp && usersResp.data ? usersResp.data : [];
          const resolved = transformed.map(pm => {
            if (!pm.name) return pm;
            if (!(/^\d+$/.test(String(pm.name)) || /^Member-\d+$/.test(String(pm.name)))) return pm;
            const match = users.find((u: any) => String(u.employeeId) === String(pm.name) || String(u.id) === String(pm.name) || String(u.userId) === String(pm.name) || String(u.employeeId) === String(pm.id));
            if (match) {
              return { ...pm, name: match.userName || match.fullName || match.name || match.email || String(match.id) };
            }
            return pm;
          });
          setProjectMembers(resolved);
          return resolved;
        }
      } catch (resolveError) {
        console.error('❌ Error resolving member names via userService in fetchAndSet:', resolveError);
      }

      setProjectMembers(transformed);
      return transformed;
    } catch (error) {
      console.error('❌ Error fetching project members (fetchAndSet):', error);
      setProjectMembers([]);
      return [] as Member[];
    }
  };

  // Helper to remove identifying/key properties from payloads
  const sanitizeMilestonePayload = (obj: any) => {
    if (!obj || typeof obj !== 'object') return obj;
    const copy = { ...obj };
    // common key names to remove
    delete copy.milestoneId;
    delete copy.MilestoneId;
    delete copy.id;
    delete copy.Id;
    delete copy.projectId;
    delete copy.ProjectId;
    // In case UI uses 'project' field, don't send it as projectId
    delete copy.project;
    return copy;
  };

  // Fetch project members when a project is selected for new milestone
  useEffect(() => {
    const fetchProjectMembers = async () => {
      if (!newMilestone.project) {
        setProjectMembers([]);
        return;
      }

      try {
        const { projectAssignmentService } = await import('@/services/projectAssignmentService');
        const res: any = await projectAssignmentService.getProjectMembers(parseInt(newMilestone.project));
        if (res && res.data) {
          // Normalize response (array of member objects)
          const members = Array.isArray(res.data) ? res.data : (res.data.members || res.data.data || []);
          console.log('👥 Raw project members payload:', members);
          const transformed: Member[] = members.map((m: any, idx: number) => {
            // If member is a simple string (e.g., ['Alice','Bob'])
            if (typeof m === 'string') {
              return { id: idx + 1, name: m, role: 'Member', projectId: [newMilestone.project] } as Member;
            }

            // Helper to safely get nested props
            const get = (obj: any, ...keys: string[]) => {
              for (const k of keys) {
                if (!obj) continue;
                if (k.includes('.')) {
                  const parts = k.split('.');
                  let cur = obj;
                  for (const p of parts) {
                    cur = cur?.[p];
                    if (cur === undefined) break;
                  }
                  if (cur) return cur;
                } else if (obj[k] !== undefined && obj[k] !== null && obj[k] !== '') {
                  return obj[k];
                }
              }
              return undefined;
            };

            const possibleName = get(m,
              'name', 'userName', 'UserName', 'employeeName', 'EmployeeName', 'fullName', 'FullName', 'memberName', 'MemberName',
              'displayName', 'DisplayName', 'profile.displayName', 'user.fullName', 'user.name', 'person.fullName', 'firstName', 'lastName', 'email', 'Email'
            );

            let derivedName = '';
            if (possibleName) {
              if (typeof possibleName === 'object') {
                // If it's an object with first/last
                derivedName = `${possibleName.firstName || possibleName.first || ''} ${possibleName.lastName || possibleName.last || ''}`.trim();
              } else {
                derivedName = String(possibleName);
              }
            } else if ((m.firstName || m.lastName)) {
              derivedName = `${m.firstName || ''} ${m.lastName || ''}`.trim();
            }

            if (!derivedName) {
              // Fallbacks
              derivedName = m.name || m.userName || m.employeeId || m.id || `Member-${idx + 1}`;
            }

            // Final safety: if still falsy mark as unresolved and log raw
            if (!derivedName || derivedName === '') {
              console.warn('⚠️ Unresolved project member name for payload item:', m);
              derivedName = `Member-${idx + 1}`;
            }

            return {
              id: m.id || m.employeeId || m.memberId || m.userId || idx + 1,
              name: derivedName as string,
              role: m.role || m.memberRole || 'Member',
              projectId: [newMilestone.project]
            };
          });
          // If some derived names are numeric IDs or placeholders, try to resolve via userService
          try {
            const unresolved = transformed.filter(m => /^\d+$/.test(String(m.name)) || /^Member-\d+$/.test(String(m.name)));
            if (unresolved.length > 0) {
              const { userService } = await import('@/services/userService');
              const usersResp: any = await userService.getAllUsers();
              const users = usersResp && usersResp.data ? usersResp.data : [];
              const resolved = transformed.map(pm => {
                if (!pm.name) return pm;
                if (!(/^\d+$/.test(String(pm.name)) || /^Member-\d+$/.test(String(pm.name)))) return pm;
                // Try to find user by employeeId or id
                const match = users.find((u: any) => String(u.employeeId) === String(pm.name) || String(u.id) === String(pm.name) || String(u.userId) === String(pm.name));
                if (match) {
                  return { ...pm, name: match.userName || match.fullName || match.name || match.email || String(match.id) };
                }
                return pm;
              });
              setProjectMembers(resolved);
            } else {
              setProjectMembers(transformed);
            }
          } catch (resolveError) {
            console.error('❌ Error resolving member names via userService:', resolveError);
            setProjectMembers(transformed);
          }
        } else {
          setProjectMembers([]);
        }
      } catch (error) {
        console.error('❌ Error fetching project members:', error);
        setProjectMembers([]);
      }
    };

    fetchProjectMembers();
  }, [newMilestone.project]);


  const filteredMilestones = useMemo(() => {
    let result = milestones;

    if (searchText) {
      const searchLower = searchText.toLowerCase();
      result = result.filter(milestone => 
        (milestone.title || "").toLowerCase().includes(searchLower) ||
        (milestone.description || "").toLowerCase().includes(searchLower) ||
        (milestone.assignedTo || "").toLowerCase().includes(searchLower)
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter(milestone => milestone.status === statusFilter);
    }

    if (priorityFilter !== 'all') {
      result = result.filter(milestone => milestone.priority === priorityFilter);
    }

    if (projectFilter !== 'all') {
      result = result.filter(milestone => milestone.project === projectFilter);
    }

    return result;
  }, [milestones, searchText, statusFilter, priorityFilter, projectFilter]);

  const handleCreateMilestone = async () => {
    if (!newMilestone.title || !newMilestone.dueDate || !newMilestone.project) {
      toast.error("Please fill in required fields: Title, Due Date, and Project", {
        position: "top-right",
        theme: darkMode ? "dark" : "light",
      });
      return;
    }

    try {
      console.log('📝 Creating milestone with data:', newMilestone);
      
      // ✅ Call backend API to create milestone
      const { milestoneService } = await import('@/services/milestoneService');
      
      // Prepare milestone data for backend
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      // Build payload, omit assignedMemberId when not provided (assignment optional)
      const payload: any = {
        milestoneName: newMilestone.title || '',
        description: newMilestone.description || '',
        dueDate: newMilestone.dueDate || '',
        weight: newMilestone.weight || 5,
        projectId: parseInt(newMilestone.project || '0', 10),
        startDate: tomorrow.toISOString(), // ✅ Required, must be in future
        status: 'Pending' as const
      };

      if (newMilestone.assignedTo && newMilestone.assignedTo !== '') {
        payload.assignedMemberId = newMilestone.assignedTo;
      }
      
  console.log('📤 Sending milestone data to backend:', payload);
  const response = await milestoneService.createMilestone(payload);
      
      if (response.success && response.data) {
        console.log('✅ Milestone created successfully:', response.data);
        
        // Refresh milestones from backend
        const milestonesResponse = await milestoneService.getAllMilestones();
        if (milestonesResponse.data) {
          const transformedMilestones: Milestone[] = (milestonesResponse.data || []).map((m: any) => ({
            id: m.milestoneId?.toString() || '',
            title: m.milestoneName || 'Untitled',
            description: m.description || '',
            dueDate: m.dueDate || '',
            priority: m.priority || 'Medium',
            status: m.status || 'To Do',
            progress: m.progress || 0,
            assignedTo: m.assignedMemberName || '',
            createdBy: 'You',
            project: m.projectId?.toString() || '',
            weight: m.weight || 5,
            tasks: [],
            createdAt: m.createdAt || new Date().toISOString(),
            comments: [],
            files: []
          }));
          
          setMilestones(transformedMilestones);
        }
        
        setShowCreateModal(false);
        setNewMilestone({
          title: '',
          description: '',
          dueDate: '',
          priority: 'Medium',
          assignedTo: '',
          project: '',
          weight: 5
        });

        toast.success("Milestone created successfully!", {
          position: "top-right",
          theme: darkMode ? "dark" : "light",
        });
      } else {
        toast.error(response.message || "Failed to create milestone", {
          position: "top-right",
          theme: darkMode ? "dark" : "light",
        });
      }
    } catch (error) {
      console.error('❌ Error creating milestone:', error);
      toast.error("Failed to create milestone. Please try again.", {
        position: "top-right",
        theme: darkMode ? "dark" : "light",
      });
    }
  };

  const handleUpdateMilestone = async () => {
    if (!selectedMilestone) return;

    try {
      // Build payload for backend
      const payload: any = sanitizeMilestonePayload({
        milestoneName: selectedMilestone.title,
        description: selectedMilestone.description,
        dueDate: selectedMilestone.dueDate,
        weight: selectedMilestone.weight,
        status: selectedMilestone.status,
        progress: selectedMilestone.progress
      });

      const { milestoneService } = await import('@/services/milestoneService');
      const idNum = parseInt(String(selectedMilestone.id), 10) || 0;
      const response: any = await milestoneService.updateMilestone(idNum, payload);

  if (response && response.success) {
        // Prefer using server-returned milestone data when available
        const updatedFromServer: any = response.data;

        const updatedMilestones = milestones.map(m => {
          if (m.id === selectedMilestone.id) {
            // Map server fields back to UI shape where possible
            const assignedName = updatedFromServer?.assignedMemberName || selectedMilestone.assignedTo;
            return {
              ...m,
              title: updatedFromServer?.milestoneName || selectedMilestone.title,
              description: updatedFromServer?.description || selectedMilestone.description,
              dueDate: updatedFromServer?.dueDate || selectedMilestone.dueDate,
              weight: updatedFromServer?.weight ?? selectedMilestone.weight,
              status: updatedFromServer?.status || selectedMilestone.status,
              progress: updatedFromServer?.progress ?? selectedMilestone.progress,
              assignedTo: assignedName
            };
          }
          return m;
        });

        setMilestones(updatedMilestones);
        setShowEditModal(false);

        toast.success("Milestone updated successfully!", {
          position: "top-right",
          theme: darkMode ? "dark" : "light",
        });
      } else {
        console.error('❌ Update milestone failed:', response);
        // Detect EF Core key modification message and show a clearer UX message
        const msg = response?.message || '';
        if (typeof msg === 'string' && msg.includes('part of a key')) {
          toast.error('Server rejected the update because it attempted to change a key (MilestoneId or identifying FK). Do not change IDs or projectId when updating. To move a milestone between projects the server must delete and recreate it.', { position: 'top-right', theme: darkMode ? 'dark' : 'light', autoClose: 8000 });
        } else {
          toast.error(msg || 'Failed to update milestone', { position: 'top-right', theme: darkMode ? 'dark' : 'light' });
        }
      }
    } catch (error) {
      console.error('❌ Error updating milestone:', error);
      toast.error('Error updating milestone. Please try again.', {
        position: 'top-right',
        theme: darkMode ? 'dark' : 'light'
      });
    }
  };

  const handleAssignMilestone = async () => {
    if (!selectedMilestone || !newAssignee) {
      toast.error('Please select an assignee before assigning.', { position: 'top-right', theme: darkMode ? 'dark' : 'light' });
      return;
    }

    try {
        const { milestoneService } = await import('@/services/milestoneService');
        const idNum = parseInt(String(selectedMilestone.id), 10) || 0;

        // Fetch current milestone from server to include required fields in update payload
        let currentData: any = null;
        try {
          const getResp: any = await milestoneService.getMilestoneById(idNum);
          if (getResp && getResp.success && getResp.data) currentData = getResp.data;
        } catch (err) {
          console.warn('⚠️ Could not fetch milestone from server, will use local state as fallback', err);
        }

        // Build payload using server data when available, otherwise use selectedMilestone mapping
        const basePayload: any = currentData || {
          milestoneName: selectedMilestone.title || '',
          description: selectedMilestone.description || '',
          dueDate: selectedMilestone.dueDate || '',
          weight: selectedMilestone.weight || 5,
          projectId: selectedMilestone.project ? parseInt(String(selectedMilestone.project), 10) : undefined,
          startDate: (currentData && currentData.startDate) || new Date().toISOString(),
          status: selectedMilestone.status || undefined
        };

        const payload = sanitizeMilestonePayload({ ...basePayload, assignedMemberId: String(newAssignee) });
        const response: any = await milestoneService.updateMilestone(idNum, payload);

      if (response && response.success) {
        const updatedFromServer: any = response.data;
        const assignedName = updatedFromServer?.assignedMemberName || newAssignee;

        const updatedMilestones = milestones.map(m =>
          m.id === selectedMilestone.id ? { ...m, assignedTo: assignedName } : m
        );

        setMilestones(updatedMilestones);
        setSelectedMilestone({ ...selectedMilestone, assignedTo: assignedName });
        setShowAssignModal(false);

        toast.success('Milestone assigned successfully!', { position: 'top-right', theme: darkMode ? 'dark' : 'light' });
      } else {
        console.error('❌ Assign milestone failed:', response);
        const msg = response?.message || '';
        if (typeof msg === 'string' && msg.includes('part of a key')) {
          toast.error('Server rejected the assignment because the request attempted to change an identifying key. Ensure you only send assignedMemberId and not milestoneId/projectId.', { position: 'top-right', theme: darkMode ? 'dark' : 'light', autoClose: 8000 });
        } else {
          toast.error(msg || 'Failed to assign milestone', { position: 'top-right', theme: darkMode ? 'dark' : 'light' });
        }
      }
    } catch (error) {
      console.error('❌ Error assigning milestone:', error);
      toast.error('Error assigning milestone. Please try again.', { position: 'top-right', theme: darkMode ? 'dark' : 'light' });
    }
  };

  const handleDeleteMilestone = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this milestone?')) return;

    try {
        const { milestoneService } = await import('@/services/milestoneService');
        const idNum = parseInt(String(id), 10) || 0;

        // Verify existence first to provide clearer UX on 404s
        try {
          const getResp: any = await milestoneService.getMilestoneById(idNum);
          if (!(getResp && getResp.success && getResp.data)) {
            console.warn('⚠️ Milestone not found on server before delete:', idNum, getResp);
            toast.info('Milestone not found on server. Refreshing local list.', { position: 'top-right', theme: darkMode ? 'dark' : 'light' });
            // Refresh local list
            try {
              const allResp: any = await import('@/services/milestoneService').then(m => m.milestoneService.getAllMilestones());
              if (allResp && allResp.data) {
                const transformed: Milestone[] = (allResp.data || []).map((m: any) => ({
                  id: m.milestoneId?.toString() || '',
                  title: m.milestoneName || 'Untitled',
                  description: m.description || '',
                  dueDate: m.dueDate || '',
                  priority: m.priority || 'Medium',
                  status: m.status || 'To Do',
                  progress: m.progress || 0,
                  assignedTo: m.assignedMemberName || '',
                  createdBy: 'You',
                  project: m.projectId?.toString() || '',
                  weight: m.weight || 5,
                  tasks: [],
                  createdAt: m.createdAt || new Date().toISOString(),
                  comments: [],
                  files: []
                }));
                setMilestones(transformed);
              }
            } catch (refreshErr) {
              console.error('❌ Error refreshing milestones after missing-delete:', refreshErr);
            }
            return;
          }
        } catch (getErr) {
          // If get failed with 404-like behavior, continue and try delete to surface server error
          console.warn('⚠️ getMilestoneById failed, proceeding to delete to surface server error:', getErr);
        }

        const response: any = await milestoneService.deleteMilestone(idNum);

        // apiClient.delete may return { success: true } or similar
        if (response && (response.success || response.status === 200 || response.status === 204)) {
          setMilestones(milestones.filter(m => m.id !== id));
          if (selectedMilestone?.id === id) {
            setSelectedMilestone(null);
            setShowDetailView(false);
          }

          toast.success('Milestone deleted successfully!', { position: 'top-right', theme: darkMode ? 'dark' : 'light' });
        } else {
          console.error('❌ Delete milestone failed:', response);
          const msg = response?.message || '';
          if (typeof msg === 'string' && msg.includes('part of a key')) {
            toast.error('Server rejected the delete request due to a key/relationship constraint. Check server logs.', { position: 'top-right', theme: darkMode ? 'dark' : 'light', autoClose: 8000 });
          } else if (response && response.status === 404) {
            toast.error('Milestone not found on server (404). It may have been removed already. Refreshing list.', { position: 'top-right', theme: darkMode ? 'dark' : 'light' });
            // Refresh local list
            try {
              const allResp: any = await import('@/services/milestoneService').then(m => m.milestoneService.getAllMilestones());
              if (allResp && allResp.data) {
                const transformed: Milestone[] = (allResp.data || []).map((m: any) => ({
                  id: m.milestoneId?.toString() || '',
                  title: m.milestoneName || 'Untitled',
                  description: m.description || '',
                  dueDate: m.dueDate || '',
                  priority: m.priority || 'Medium',
                  status: m.status || 'To Do',
                  progress: m.progress || 0,
                  assignedTo: m.assignedMemberName || '',
                  createdBy: 'You',
                  project: m.projectId?.toString() || '',
                  weight: m.weight || 5,
                  tasks: [],
                  createdAt: m.createdAt || new Date().toISOString(),
                  comments: [],
                  files: []
                }));
                setMilestones(transformed);
              }
            } catch (refreshErr) {
              console.error('❌ Error refreshing milestones after 404:', refreshErr);
            }
          } else {
            toast.error(msg || 'Failed to delete milestone', { position: 'top-right', theme: darkMode ? 'dark' : 'light' });
          }
        }
    } catch (error) {
      console.error('❌ Error deleting milestone:', error);
      toast.error('Error deleting milestone. Please try again.', { position: 'top-right', theme: darkMode ? 'dark' : 'light' });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFileToUpload(e.target.files[0]);
    }
  };

  const handleAddComment = () => {
    if (!newComment.trim() || !selectedMilestone) return;

    const comment: Comment = {
      id: Date.now().toString(),
      author: "You",
      content: newComment,
      timestamp: new Date()
    };

    const updatedMilestone = {
      ...selectedMilestone,
      comments: [...(selectedMilestone.comments || []), comment]
    };

    setSelectedMilestone(updatedMilestone);
    setMilestones(milestones.map(m => 
      m.id === selectedMilestone.id ? updatedMilestone : m
    ));
    setNewComment("");
  };

  const handleUploadFile = async () => {
    if (!fileToUpload || !selectedMilestone) return;

    setIsUploading(true);
    try {
      for (let progress = 0; progress <= 100; progress += 10) {
        await new Promise(resolve => setTimeout(resolve, 100));
        setUploadProgress(progress);
      }

      const fileAttachment: FileAttachment = {
        id: Date.now().toString(),
        name: fileToUpload.name,
        size: fileToUpload.size,
        type: fileToUpload.type,
        url: URL.createObjectURL(fileToUpload),
        lastModified: fileToUpload.lastModified
      };

      const updatedMilestone = {
        ...selectedMilestone,
        files: [...(selectedMilestone.files || []), fileAttachment]
      };

      setSelectedMilestone(updatedMilestone);
      setMilestones(milestones.map(m => 
        m.id === selectedMilestone.id ? updatedMilestone : m
      ));
      setFileToUpload(null);
      setUploadProgress(0);
    } catch (error) {
      toast.error("Failed to upload file");
      console.error("Upload error:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteAttachment = (fileId: string) => {
    if (!selectedMilestone) return;

    const updatedMilestone = {
      ...selectedMilestone,
      files: (selectedMilestone.files || []).filter(f => f.id !== fileId)
    };

    setSelectedMilestone(updatedMilestone);
    setMilestones(milestones.map(m => 
      m.id === selectedMilestone.id ? updatedMilestone : m
    ));
  };

  const columns = [
    {
      name: 'Title',
      sortable: true,
      cell: (row: Milestone) => (
        <div className="min-w-[200px]">
          <div className="font-medium">{row.title}</div>
          <div className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"} truncate`}>
            {row.description}
          </div>
        </div>
      ),
      grow: 2
    },
    {
      name: 'Priority',
      sortable: true,
      cell: (row: Milestone) => (
        <span className={`text-xs px-2 py-1 rounded-full ${
          row.priority === 'High' || row.priority === 'Urgent' 
            ? (darkMode ? "bg-red-300 text-red-900" : "bg-red-100 text-red-800") 
            : row.priority === 'Medium' 
              ? (darkMode ? "bg-yellow-100 text-yellow-900" : "bg-yellow-100 text-yellow-800") 
              : (darkMode ? "bg-green-300 text-green-900" : "bg-green-100 text-green-800")
        }`}>
          {row.priority}
        </span>
      ),
      width: '120px'
    },
    {
      name: 'Status',
      sortable: true,
      cell: (row: Milestone) => (
        <span className={`px-2 py-1 text-xs rounded-full ${
          row.status === 'Done' 
            ? (darkMode ? "bg-green-900 text-green-300" : "bg-green-100 text-green-800")
            : row.status === 'In Progress' 
              ? (darkMode ? "bg-yellow-900 text-yellow-300" : "bg-yellow-100 text-yellow-800")
              : (darkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-800")
        }`}>
          {row.status}
        </span>
      ),
      width: '120px'
    },
    {
      name: 'Assigned To',
      selector: (row: Milestone) => row.assignedTo,
      sortable: true,
      width: '150px'
    },
    {
      name: 'Project',
      selector: (row: Milestone) => projects.find(p => p.id === row.project)?.name || row.project,
      sortable: true,
      width: '150px'
    },
    {
      name: 'Due Date',
      selector: (row: Milestone) => formatDate(row.dueDate),
      sortable: true,
      width: '120px'
    },
    {
      name: 'Progress',
      sortable: true,
      cell: (row: Milestone) => (
        <div className="flex items-center">
          <div className={`w-20 h-2 rounded-full ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}>
            <div 
              className={`h-full rounded-full ${
                row.progress < 30 ? "bg-red-500" :
                row.progress < 70 ? "bg-yellow-500" : "bg-green-500"
              }`}
              style={{ width: `${row.progress}%` }}
            ></div>
          </div>
          <span className="ml-2 text-sm">{row.progress}%</span>
        </div>
      ),
      width: '150px'
    },
    {
      name: 'Actions',
      cell: (row: Milestone) => (
        <div className="flex space-x-2">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              console.log('🖊️ Table Edit clicked for', row.id);
              setSelectedMilestone({ ...row });
              setShowEditModal(true);
            }}
            className={`text-xs px-2 py-1 rounded ${darkMode ? "bg-blue-900 hover:bg-blue-800 text-blue-300" : "bg-blue-100 hover:bg-blue-200 text-blue-800"}`}
          >
            <Edit size={16}/>
          </button>
          <button 
            onClick={async (e) => {
              e.stopPropagation();
              console.log('🔀 Table Assign clicked for', row.id);
              setSelectedMilestone({ ...row });
              setNewAssignee(row.assignedTo || '');
              // fetch members for this project then open modal
              await fetchAndSetProjectMembers(row.project);
              setShowAssignModal(true);
            }}
            className={`text-xs px-2 py-1 rounded ${darkMode ? "bg-purple-900 hover:bg-purple-800 text-purple-300" : "bg-purple-100 hover:bg-purple-200 text-purple-800"}`}
          >
            <Users size={16}/>
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              console.log('🗑️ Table Delete clicked for', row.id);
              handleDeleteMilestone(String(row.id));
            }}
            className={`text-xs px-2 py-1 rounded ${darkMode ? "bg-red-900 hover:bg-red-800 text-red-300" : "bg-red-100 hover:bg-red-200 text-red-800"}`}
          >
            <Trash2 size={16}/>
          </button>
        </div>
      ),
      width: '160px',
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
    },
  ];

  const customStyles = {
    headRow: {
      style: {
        backgroundColor: darkMode ? '#27272a' : '#e5e7eb',
        color: darkMode ? '#f3f4f6' : '#111827',
        fontWeight: 'bold',
        fontSize: '0.75rem',
        textTransform: 'uppercase' as const,
        minHeight: '48px',
      },
    },
    headCells: {
      style: {
        paddingLeft: '8px',
        paddingRight: '8px',
      },
    },
    cells: {
      style: {
        paddingLeft: '8px',
        paddingRight: '8px',
        color: darkMode ? '#e5e7eb' : '#111827',
      },
    },
    rows: {
      style: {
        minHeight: '72px',
        backgroundColor: darkMode ? '#1e1e1e' : '#ffffff',
        '&:hover': {
          backgroundColor: darkMode ? '#2d2d2d' : '#f5f5f5',
        },
        '&:not(:last-of-type)': {
          borderBottomColor: darkMode ? '#3f3f46' : '#e5e7eb',
        },
      },
    },
    pagination: {
      style: {
        backgroundColor: darkMode ? '#1e1e1e' : '#ffffff',
        borderTopColor: darkMode ? '#3f3f46' : '#e5e7eb',
        color: darkMode ? '#e5e7eb' : '#111827',
      },
    },
  };

  const renderMilestoneDetailView = () => {
    if (!selectedMilestone) return null;

    return (
      <div className={`p-6 ${darkMode ? "bg-zinc-800 text-gray-100" : "bg-white text-gray-800"}`}>
        <div className="flex items-center mb-6">
          <button 
            onClick={() => {
              setShowDetailView(false);
              setSelectedMilestone(null);
            }}
            className="mr-4"
          >
            <ChevronLeft className="w-6 h-6"/>
          </button>
          <h2 className="text-2xl font-bold">Milestone Details</h2>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left panel - Milestone details */}
          <div className="lg:w-2/3">
            <div className="mb-6">
              <h3 className="text-xl font-bold mb-2">{selectedMilestone.title}</h3>
              <p className={`p-3 rounded-lg ${darkMode ? 'bg-zinc-700 text-gray-200' : 'bg-gray-100 text-gray-700'}`}>
                {selectedMilestone.description}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className={`p-4 rounded-lg ${darkMode ? 'bg-zinc-700' : 'bg-gray-100'}`}>
                <h4 className="font-medium mb-2">Status</h4>
                <span className={`px-3 py-1 rounded-md flex items-center w-fit ${
                  selectedMilestone.status === 'Done' 
                    ? (darkMode ? "bg-green-900 text-green-300" : "bg-green-100 text-green-800")
                    : selectedMilestone.status === 'In Progress' 
                      ? (darkMode ? "bg-yellow-900 text-yellow-300" : "bg-yellow-100 text-yellow-800")
                      : (darkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-800")
                }`}>
                  {selectedMilestone.status}
                </span>
              </div>

              <div className={`p-4 rounded-lg ${darkMode ? 'bg-zinc-700' : 'bg-gray-100'}`}>
                <h4 className="font-medium mb-2">Priority</h4>
                <div className={`px-3 py-1 rounded-md flex items-center w-fit ${
                  selectedMilestone.priority === 'High' || selectedMilestone.priority === 'Urgent' 
                    ? (darkMode ? "bg-red-300 text-red-900" : "bg-red-100 text-red-800") 
                    : selectedMilestone.priority === 'Medium' 
                      ? (darkMode ? "bg-yellow-100 text-yellow-900" : "bg-yellow-100 text-yellow-800") 
                      : (darkMode ? "bg-green-300 text-green-900" : "bg-green-100 text-green-800")
                }`}>
                  <Flag className="w-4 h-4 mr-2"/>
                  {selectedMilestone.priority}
                </div>
              </div>

              <div className={`p-4 rounded-lg ${darkMode ? 'bg-zinc-700' : 'bg-gray-100'}`}>
                <h4 className="font-medium mb-2">Due Date</h4>
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2"/>
                  {formatDate(selectedMilestone.dueDate)}
                </div>
              </div>

              <div className={`p-4 rounded-lg ${darkMode ? 'bg-zinc-700' : 'bg-gray-100'}`}>
                <h4 className="font-medium mb-2">Progress</h4>
                <div className="flex items-center">
                  <div className={`w-20 h-2 rounded-full ${darkMode ? "bg-gray-600" : "bg-gray-300"}`}>
                    <div 
                      className={`h-full rounded-full ${
                        selectedMilestone.progress < 30 ? "bg-red-500" :
                        selectedMilestone.progress < 70 ? "bg-yellow-500" : "bg-green-500"
                      }`}
                      style={{ width: `${selectedMilestone.progress}%` }}
                    ></div>
                  </div>
                  <span className="ml-2 text-sm">{selectedMilestone.progress}%</span>
                </div>
              </div>

              <div className={`p-4 rounded-lg ${darkMode ? 'bg-zinc-700' : 'bg-gray-100'}`}>
                <h4 className="font-medium mb-2">Assigned To</h4>
                <div className="flex items-center">
                  <UserCircle className="w-4 h-4 mr-2"/>
                  {selectedMilestone.assignedTo}
                </div>
              </div>

              <div className={`p-4 rounded-lg ${darkMode ? 'bg-zinc-700' : 'bg-gray-100'}`}>
                <h4 className="font-medium mb-2">Created By</h4>
                <div className="flex items-center">
                  <UserCircle className="w-4 h-4 mr-2"/>
                  {selectedMilestone.createdBy}
                </div>
              </div>
            </div>

            {/* Tasks section */}
            <div className="mb-6">
              <h4 className="font-bold mb-4">Tasks in this Milestone</h4>
              {selectedMilestone.tasks.length > 0 ? (
                <div className="space-y-3">
                  {selectedMilestone.tasks.map(task => (
                    <div key={task.id} className={`p-4 rounded-lg ${darkMode ? 'bg-zinc-700' : 'bg-gray-100'} border ${darkMode ? 'border-zinc-600' : 'border-gray-200'}`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <h5 className="font-medium">{task.title}</h5>
                          <p className="text-sm text-gray-500 mt-1">{task.description}</p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-md ${
                          task.status === 'Done' 
                            ? (darkMode ? "bg-green-900 text-green-300" : "bg-green-100 text-green-800")
                            : task.status === 'In Progress' 
                              ? (darkMode ? "bg-yellow-900 text-yellow-300" : "bg-yellow-100 text-yellow-800")
                              : (darkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-800")
                        }`}>
                          {task.status}
                        </span>
                      </div>
                      <div className="flex items-center mt-3 text-sm text-gray-500">
                        <Flag className="w-3 h-3 mr-1"/>
                        <span className="mr-4">{task.priority} Priority</span>
                        <Calendar className="w-3 h-3 mr-1"/>
                        <span>Due: {task.dueDate ? formatDate(task.dueDate) : 'No due date'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={`p-4 text-center rounded-lg ${darkMode ? 'bg-zinc-700 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
                  No tasks created for this milestone yet.
                </div>
              )}
            </div>

            {/* Comments section */}
            <div className="mb-6">
              <h4 className="font-bold mb-4">Comments</h4>
              <div className="space-y-4">
                {(selectedMilestone.comments || []).map(comment => (
                  <div key={comment.id} className={`p-4 rounded-lg ${darkMode ? 'bg-zinc-700' : 'bg-gray-100'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium">{comment.author}</span>
                      <span className="text-sm text-gray-500">
                        {comment.timestamp.toLocaleDateString()} at {comment.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <p>{comment.content}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  rows={3}
                  className={`w-full p-3 rounded-lg border ${
                    darkMode ? 'bg-zinc-700 border-zinc-600 text-white' : 'bg-white border-gray-300 text-gray-700'
                  }`}
                />
                <button
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                  className={`mt-2 px-4 py-2 rounded-md text-white ${
                    darkMode ? 'bg-purple-600 hover:bg-purple-500 disabled:bg-gray-500' : 
                    'bg-purple-500 hover:bg-purple-400 disabled:bg-gray-200 disabled:text-gray-700'
                  }`}
                >
                  Add Comment
                </button>
              </div>
            </div>
          </div>

          {/* Right panel - Attachments and actions */}
          <div className="lg:w-1/3">
            <div className={`rounded-lg p-4 ${darkMode ? 'bg-zinc-700' : 'bg-gray-100'}`}>
              <h4 className="font-bold mb-4">Attachments</h4>
              {(selectedMilestone.files || []).length > 0 ? (
                <div className="space-y-3">
                  {(selectedMilestone.files || []).map(file => (
                    <div key={file.id} className={`p-3 rounded-lg flex justify-between items-center ${darkMode ? 'bg-zinc-600' : 'bg-white'}`}>
                      <div className="flex items-center">
                        <Paperclip className="w-4 h-4 mr-2" />
                        <div>
                          <p className="text-sm font-medium">{file.name}</p>
                          <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:text-blue-700"
                        >
                          View
                        </a>
                        <button
                          onClick={() => handleDeleteAttachment(file.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={`text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No attachments</p>
              )}

              <div className="mt-4">
                {fileToUpload && (
                  <div className={`mb-2 p-3 rounded ${darkMode ? 'bg-zinc-600' : 'bg-white'}`}>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <Paperclip size={16} className="mr-2" />
                        <span className="truncate max-w-xs">{fileToUpload.name}</span>
                      </div>
                      <button
                        onClick={() => setFileToUpload(null)}
                        className="text-red-500 hover:text-red-700 ml-2"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    {isUploading && (
                      <div className={`w-full h-1 mt-2 rounded-full ${darkMode ? 'bg-zinc-500' : 'bg-gray-300'}`}>
                        <div
                          className={`h-full rounded-full ${darkMode ? 'bg-blue-400' : 'bg-blue-500'}`}
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                    )}
                  </div>
                )}

                <label className={`block p-2 rounded-md cursor-pointer text-center ${darkMode ? 'bg-zinc-600 hover:bg-zinc-500' : 'bg-white hover:bg-gray-200 border border-gray-300'}`}>
                  <input
                    type="file"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Paperclip size={16} className="inline mr-2" />
                  Add Attachment
                </label>

                {fileToUpload && (
                  <button
                    onClick={handleUploadFile}
                    disabled={isUploading}
                    className={`w-full mt-2 px-4 py-2 rounded-md text-white ${darkMode ? 'bg-purple-600 hover:bg-purple-500 disabled:bg-gray-500' : 'bg-purple-500 hover:bg-purple-400 disabled:bg-gray-200 disabled:text-gray-700'}`}
                  >
                    {isUploading ? 'Uploading...' : 'Upload File'}
                  </button>
                )}
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <button
                onClick={() => {
                  console.log('🖊️ Edit button clicked for milestone:', selectedMilestone?.id);
                  // clone to ensure state change and fresh reference
                  setSelectedMilestone(selectedMilestone ? { ...selectedMilestone } : null);
                  setShowEditModal(true);
                }}
                className={`w-full py-2 px-4 rounded-md flex items-center justify-center ${darkMode ? 'bg-blue-600 hover:bg-blue-500' : 'bg-blue-500 hover:bg-blue-400'} text-white`}
              >
                <Edit size={16} className="mr-2" />
                Edit Milestone
              </button>

              <button
                onClick={async () => {
                  console.log('🔀 Assign button clicked for milestone:', selectedMilestone?.id);
                  setSelectedMilestone(selectedMilestone ? { ...selectedMilestone } : null);
                  setNewAssignee(selectedMilestone?.assignedTo || '');
                  // fetch project members for the milestone's project before opening modal
                  const projectIdToFetch = selectedMilestone?.project || undefined;
                  await fetchAndSetProjectMembers(projectIdToFetch);
                  setShowAssignModal(true);
                }}
                className={`w-full py-2 px-4 rounded-md flex items-center justify-center ${darkMode ? 'bg-purple-600 hover:bg-purple-500' : 'bg-purple-500 hover:bg-purple-400'} text-white`}
              >
                <Users size={16} className="mr-2" />
                Assign Milestone
              </button>

              <button
                onClick={() => {
                  console.log('🗑️ Delete button clicked for milestone:', selectedMilestone?.id);
                  if (selectedMilestone) handleDeleteMilestone(selectedMilestone.id);
                }}
                className={`w-full py-2 px-4 rounded-md flex items-center justify-center ${darkMode ? 'bg-red-600 hover:bg-red-500' : 'bg-red-500 hover:bg-red-400'} text-white`}
              >
                <Trash2 size={16} className="mr-2" />
                Delete Milestone
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={` p-6 mt-3 ${darkMode ? " text-gray-100" : " text-gray-800"}`}>
      <ToastContainer />
      
      {/* ✅ Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <RefreshCw className={`w-12 h-12 animate-spin mx-auto mb-4 ${darkMode ? "text-gray-400" : "text-gray-600"}`} />
            <p className={`text-lg ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Loading milestones...</p>
          </div>
        </div>
      ) : showDetailView && selectedMilestone ? (
        renderMilestoneDetailView()
      ) : (
        <>
          {showHeader !== false && (
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center">
                <div className="ml-2">
                <h1 className="text-2xl font-bold">Authored Milestones</h1>
                <p className={`text-sm mt-1  ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                  Key Metrics and Insight | <span>{milestones.length}</span> Total Milestones
                </p>
                </div>
              </div>
              <button 
                onClick={() => setShowCreateModal(true)}
                className={`flex items-center w-fit py-2 px-3 rounded-lg ${darkMode ? "bg-zinc-700 hover:bg-zinc-500" : "bg-purple-900 hover:bg-purple-800"} text-white`}
              >
                 Create Milestone
              </button>
            </div>
          )}

          {/* Filters */}
          <div className="mb-5">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search milestones..."
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      className={`sm:w-54 lg:w-72 pl-10 pr-4 py-2 rounded-lg border ${
                        darkMode
                          ? "bg-zinc-700 border-zinc-600 text-white placeholder-gray-400 "
                          : "bg-white border-gray-300 text-gray-800 placeholder-gray-500 "
                      } focus:outline-none`}
                    />
                    <div className={`absolute left-3 top-2.5 ${
                      darkMode ? "text-gray-400" : "text-gray-500"
                    }`}>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className={`p-2 rounded-md border ${
                      darkMode ? "bg-zinc-700 border-zinc-600 text-white" : "bg-white border-gray-300"
                    }`}
                  >
                    <option value="all">All Statuses</option>
                    <option value="To Do">To Do</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Done">Done</option>
                  </select>
                  
                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className={`p-2 rounded-md border ${
                      darkMode ? "bg-zinc-700 border-zinc-600 text-white" : "bg-white border-gray-300"
                    }`}
                  >
                    <option value="all">All Priorities</option>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                  
                  <select
                    value={projectFilter}
                    onChange={(e) => setProjectFilter(e.target.value)}
                    className={`p-2 rounded-md border ${
                      darkMode ? "bg-zinc-700 border-zinc-600 text-white" : "bg-white border-gray-300"
                    }`}
                  >
                    <option value="all">All Projects</option>
                    {projects.map(project => (
                      <option key={project.id} value={project.id}>{project.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          

          {/* Milestones Table */}
          <Card className={`${darkMode ? "bg-zinc-800 border-zinc-700" : "bg-white border-gray-200"}`}>
            <CardContent className="p-0">
              <DataTable
                columns={columns}
                data={filteredMilestones}
                customStyles={customStyles}
                onRowClicked={async (row) => {
                  console.log('📋 Milestone clicked:', row.title);
                  console.log('📋 Milestone ID:', row.id);
                  
                  // ✅ Fetch tasks for this milestone
                  try {
                    const { projectTaskService } = await import('@/services/projectTaskService');
                    const tasksResponse = await projectTaskService.getTasksByProject(parseInt(row.project));
                    console.log('📋 Tasks response:', tasksResponse);
                    
                    if (tasksResponse && Array.isArray(tasksResponse)) {
                      // Filter tasks for this specific milestone
                      const milestoneTasks = tasksResponse.filter((task: any) => {
                        const metadata = task.metadata || task.Metadata || {};
                        const taskMilestoneId = metadata.milestoneId?.toString() || task.milestoneId?.toString();
                        return taskMilestoneId === row.id;
                      }).map((task: any) => {
                        const metadata = task.metadata || task.Metadata || {};
                        return {
                          id: task.value || task.Value || task.id || '',
                          key: task.value || task.Value || task.id || '',
                          title: task.label || task.Label || task.title || 'Untitled',
                          description: task.description || task.Description || metadata.description || '',
                          dueDate: metadata.dueDate || task.dueDate || '',
                          priority: (metadata.priority || task.priority || 'Medium') as "Low" | "Medium" | "High" | "Urgent",
                          status: metadata.status || task.status || 'To Do',
                          assignee: metadata.assignedMemberName || '',
                          weight: metadata.weight || task.weight || 0,
                          project: task.projectId?.toString() || task.project?.toString() || row.project,
                          progress: metadata.progress || task.progress || 0,
                          subtask: metadata.subtasks || task.subtasks || []
                        } as Task;
                      });
                      
                      console.log('📋 Tasks in this milestone:', milestoneTasks);
                      
                      // Set selected milestone with tasks
                      setSelectedMilestone({ ...row, tasks: milestoneTasks });
                    } else {
                      setSelectedMilestone(row);
                    }
                  } catch (error) {
                    console.error('❌ Error fetching tasks:', error);
                    setSelectedMilestone(row);
                  }
                  
                  setShowDetailView(true);
                }}
                highlightOnHover
                pointerOnHover
                pagination
                paginationPerPage={10}
                paginationRowsPerPageOptions={[5, 10, 15, 20]}
                theme={darkMode ? "dark" : "light"}
                noDataComponent={
                  <div className={`p-8 text-center ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                    No milestones found. Create your first milestone to get started.
                  </div>
                }
                persistTableHead
                responsive
              />
            </CardContent>
          </Card>
        </>
      )}

      {/* Create Milestone Modal */}
      <Dialog open={showCreateModal} onClose={() => setShowCreateModal(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className={`w-full max-w-md rounded-lg p-6 ${darkMode ? "bg-zinc-800 text-gray-100" : "bg-white text-gray-800"}`}>
            <Dialog.Title className="text-lg font-bold mb-4 flex items-center">
              <Plus className="w-5 h-5 mr-2" /> Create New Milestone
            </Dialog.Title>
            
            <div className="space-y-4">
              <div>
                  <label className="block text-sm font-medium mb-1">Project *</label>
                  <select
                    value={newMilestone.project}
                    onChange={(e) => setNewMilestone({...newMilestone, project: e.target.value})}
                    className={`w-full p-2 rounded-md border ${
                      darkMode ? "bg-zinc-700 border-zinc-600" : "bg-white border-gray-300"
                    }`}
                  >
                    <option value="">Select project</option>
                    {projects.map(project => (
                      <option key={project.id} value={project.id}>{project.name}</option>
                    ))}
                  </select>
                </div>
              <div>
                <label className="block text-sm font-medium mb-1">Title *</label>
                <input
                  type="text"
                  value={newMilestone.title}
                  onChange={(e) => setNewMilestone({...newMilestone, title: e.target.value})}
                  className={`w-full p-2 rounded-md border ${
                    darkMode ? "bg-zinc-700 border-zinc-600" : "bg-white border-gray-300"
                  }`}
                  placeholder="Milestone title"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={newMilestone.description}
                  onChange={(e) => setNewMilestone({...newMilestone, description: e.target.value})}
                  rows={3}
                  className={`w-full p-2 rounded-md border ${
                    darkMode ? "bg-zinc-700 border-zinc-600" : "bg-white border-gray-300"
                  }`}
                  placeholder="Milestone description"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Due Date *</label>
                  <input
                    type="date"
                    value={newMilestone.dueDate}
                    onChange={(e) => setNewMilestone({...newMilestone, dueDate: e.target.value})}
                    className={`w-full p-2 rounded-md border ${
                      darkMode ? "bg-zinc-700 border-zinc-600" : "bg-white border-gray-300"
                    }`}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Priority</label>
                  <select
                    value={newMilestone.priority}
                    onChange={(e) => setNewMilestone({...newMilestone, priority: e.target.value as any})}
                    className={`w-full p-2 rounded-md border ${
                      darkMode ? "bg-zinc-700 border-zinc-600" : "bg-white border-gray-300"
                    }`}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Assign To (optional)</label>
                  <select
                    value={newMilestone.assignedTo}
                    onChange={(e) => setNewMilestone({...newMilestone, assignedTo: e.target.value})}
                    className={`w-full p-2 rounded-md border ${
                      darkMode ? "bg-zinc-700 border-zinc-600" : "bg-white border-gray-300"
                    }`}
                  >
                    <option value="">No assignee</option>
                    {(projectMembers && projectMembers.length > 0 ? projectMembers : allMembers).map(member => (
                      <option key={member.id} value={member.name}>{member.name}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">You can assign this milestone later from the milestone details.</p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Weight</label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={newMilestone.weight}
                  onChange={(e) => setNewMilestone({...newMilestone, weight: parseInt(e.target.value)})}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Low</span>
                  <span>{newMilestone.weight}/10</span>
                  <span>High</span>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className={`px-4 py-2 rounded-md ${darkMode ? "bg-zinc-700 hover:bg-zinc-600" : "bg-gray-200 hover:bg-gray-300"}`}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateMilestone}
                className={`px-4 py-2 rounded-md text-white ${darkMode ? "bg-purple-600 hover:bg-purple-500" : "bg-purple-500 hover:bg-purple-400"}`}
              >
                Create
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Edit Milestone Modal */}
      <Dialog open={showEditModal} onClose={() => setShowEditModal(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className={`w-full max-w-md rounded-lg p-6 ${darkMode ? "bg-zinc-800 text-gray-100" : "bg-white text-gray-800"}`}>
            <Dialog.Title className="text-lg font-bold mb-4 flex items-center">
              <Edit className="w-5 h-5 mr-2" /> Edit Milestone
            </Dialog.Title>
            
            {selectedMilestone && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Title</label>
                  <input
                    type="text"
                    value={selectedMilestone.title}
                    onChange={(e) => setSelectedMilestone({...selectedMilestone, title: e.target.value})}
                    className={`w-full p-2 rounded-md border ${
                      darkMode ? "bg-zinc-700 border-zinc-600" : "bg-white border-gray-300"
                    }`}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    value={selectedMilestone.description}
                    onChange={(e) => setSelectedMilestone({...selectedMilestone, description: e.target.value})}
                    rows={3}
                    className={`w-full p-2 rounded-md border ${
                      darkMode ? "bg-zinc-700 border-zinc-600" : "bg-white border-gray-300"
                    }`}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Due Date</label>
                    <input
                      type="date"
                      value={selectedMilestone.dueDate}
                      onChange={(e) => setSelectedMilestone({...selectedMilestone, dueDate: e.target.value})}
                      className={`w-full p-2 rounded-md border ${
                        darkMode ? "bg-zinc-700 border-zinc-600" : "bg-white border-gray-300"
                      }`}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Priority</label>
                    <select
                      value={selectedMilestone.priority}
                      onChange={(e) => setSelectedMilestone({...selectedMilestone, priority: e.target.value as any})}
                      className={`w-full p-2 rounded-md border ${
                        darkMode ? "bg-zinc-700 border-zinc-600" : "bg-white border-gray-300"
                      }`}
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select
                    value={selectedMilestone.status}
                    onChange={(e) => setSelectedMilestone({...selectedMilestone, status: e.target.value as any})}
                    className={`w-full p-2 rounded-md border ${
                      darkMode ? "bg-zinc-700 border-zinc-600" : "bg-white border-gray-300"
                    }`}
                  >
                    <option value="To Do">To Do</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Done">Done</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Progress</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={selectedMilestone.progress}
                      onChange={(e) => setSelectedMilestone({...selectedMilestone, progress: parseInt(e.target.value)})}
                      className="flex-1"
                    />
                    <span className="w-12 text-sm">{selectedMilestone.progress}%</span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Weight</label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={selectedMilestone.weight}
                    onChange={(e) => setSelectedMilestone({...selectedMilestone, weight: parseInt(e.target.value)})}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Low</span>
                    <span>{selectedMilestone.weight}/10</span>
                    <span>High</span>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className={`px-4 py-2 rounded-md ${darkMode ? "bg-zinc-700 hover:bg-zinc-600" : "bg-gray-200 hover:bg-gray-300"}`}
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateMilestone}
                className={`px-4 py-2 rounded-md text-white ${darkMode ? "bg-purple-600 hover:bg-purple-500" : "bg-purple-500 hover:bg-purple-400"}`}
              >
                Save Changes
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Assign Milestone Modal */}
      <Dialog open={showAssignModal} onClose={() => setShowAssignModal(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className={`w-full max-w-md rounded-lg p-6 ${darkMode ? "bg-zinc-800 text-gray-100" : "bg-white text-gray-800"}`}>
            <Dialog.Title className="text-lg font-bold mb-4 flex items-center">
              <Users className="w-5 h-5 mr-2" /> Assign Milestone
            </Dialog.Title>
            
            {selectedMilestone && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Milestone</label>
                  <div className={`p-3 rounded-md ${darkMode ? "bg-zinc-700" : "bg-gray-100"}`}>
                    {selectedMilestone.title}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Current Assignee</label>
                  <div className={`p-3 rounded-md ${darkMode ? "bg-zinc-700" : "bg-gray-100"}`}>
                    {selectedMilestone.assignedTo}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">New Assignee</label>
                  <select
                    value={newAssignee}
                    onChange={(e) => setNewAssignee(e.target.value)}
                    className={`w-full p-2 rounded-md border ${
                      darkMode ? "bg-zinc-700 border-zinc-600" : "bg-white border-gray-300"
                    }`}
                  >
                    <option value="">Select assignee</option>
                    {(projectMembers && projectMembers.length > 0 ? projectMembers : allMembers).map(member => (
                      <option key={member.id} value={member.name}>{member.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowAssignModal(false)}
                className={`px-4 py-2 rounded-md ${darkMode ? "bg-zinc-700 hover:bg-zinc-600" : "bg-gray-200 hover:bg-gray-300"}`}
              >
                Cancel
              </button>
              <button
                onClick={handleAssignMilestone}
                disabled={!newAssignee}
                className={`px-4 py-2 rounded-md text-white ${darkMode ? "bg-purple-600 hover:bg-purple-500 disabled:bg-gray-500" : "bg-purple-500 hover:bg-purple-400 disabled:bg-gray-200 disabled:text-gray-700"}`}
              >
                Assign
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Attachment Details Modal */}
      <Dialog open={!!selectedAttachment} onClose={() => setSelectedAttachment(null)}>
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Dialog.Panel className={`w-full max-w-md rounded-lg p-6 ${darkMode ? "bg-zinc-800" : "bg-white"}`}>
            {selectedAttachment && (
              <>
                <div className="flex justify-between items-start mb-4">
                  <Dialog.Title className="text-xl font-bold">
                    Attachment Details
                  </Dialog.Title>
                  <button 
                    onClick={() => setSelectedAttachment(null)}
                    className={`p-1 rounded-full ${
                      darkMode 
                        ? "hover:bg-zinc-700" 
                        : "hover:bg-gray-100"
                    }`}
                  >
                    <X size={20} />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center">
                    <Paperclip className="h-6 w-6 mr-3" />
                    <div>
                      <p className="font-medium">{selectedAttachment.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {formatFileSize(selectedAttachment.size)} • {selectedAttachment.type}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Type</p>
                      <p>{selectedAttachment.type}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Size</p>
                      <p>{formatFileSize(selectedAttachment.size)}</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-3 pt-4">
                    <a
                      href={selectedAttachment.url}
                      download={selectedAttachment.name}
                      className={`px-4 py-2 rounded-md ${darkMode ? "bg-blue-600 hover:bg-blue-500" : "bg-blue-500 hover:bg-blue-400"} text-white`}>
                      Download
                    </a>
                    <a
                      href={selectedAttachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`px-4 py-2 rounded-md ${darkMode ? "bg-gray-600 hover:bg-gray-500" : "bg-gray-200 hover:bg-gray-300" }`} >
                      Open
                    </a>
                  </div>
                </div>
              </>
            )}
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
};

export default AuthoredMile;