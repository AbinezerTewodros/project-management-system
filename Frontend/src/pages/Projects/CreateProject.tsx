import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Paperclip, X } from "lucide-react";
import { useNotifications } from "@/context/NotificationContext";
import { useAuth } from "@/context/AuthContext";
import { Project } from "@/types/types";
import { projectService } from "@/services";

interface DepartmentManager {
  id: string;
  employeeId?: string; // ✅ Add employeeId to match backend User structure
  name: string;
  role: string;
  department: string;
  email: string;
  phone: string;
}

interface TeamMember {
  id: string;
  employeeId?: string; // ✅ Add employeeId to match backend User structure
  name: string;
  role: string;
  department: string;
  email: string;
}

interface CreateProjectProps {
  darkMode: boolean;
  open?: boolean;
  onClose?: () => void;
  onProjectCreated: (project: Project) => void;
  buttonLabel?: string;
  // New props for team selection communication
  onTeamSelectionChange?: (selections: {
    managerId: string;
    teamLeaderId: string;
    teamMembers: TeamMember[];
    // ✅ NEW: Complete user objects with all fields including employeeId and role
    selectedManagerObject?: DepartmentManager;
    selectedTeamLeaderObject?: TeamMember;
    // ✅ NEW: Arrays for multiple leaders support
    selectedManagerObjects?: DepartmentManager[];
    selectedTeamLeaderObjects?: TeamMember[];
  }) => void;
  onProjectDataChange?: (projectData: {
    title: string;
    description: string;
    dueDate: string;
    priority: string;
  }) => void;
  onButtonClick?: () => void; // Callback for button clicks in multistep mode
  isMultistep?: boolean; // Flag to indicate if used in multistep flow
  initialData?: {
    title: string;
    description: string;
    dueDate: string;
    priority: string;
    department: string;
    projectOwner: string;
    projectOwnerEmail: string;
    projectOwnerPhone: string;
    files?: File[];
  }; // Initial form data for state persistence
}

const CreateProject = ({
  darkMode,
  onClose,
  onProjectCreated,
  buttonLabel = "Create Project",
  onTeamSelectionChange,
  onProjectDataChange,
  onButtonClick,
  isMultistep = false,
  initialData, // Used in useState initialization below
}: CreateProjectProps) => {
  const { addNotification } = useNotifications();
  const { user } = useAuth();
  const [newProject, setNewProject] = useState<{
    title: string;
    description: string;
    dueDate: string;
    priority: "High" | "Medium" | "Low" | "Critical";
    department: string;
    files: File[];
    teamMembers: TeamMember[];
    projectOwner: string;
    projectOwnerEmail: string;
    projectOwnerPhone: string;
  }>({
    title: initialData?.title || "",
    description: initialData?.description || "",
    dueDate: initialData?.dueDate || "",
    priority:
      (initialData?.priority as "High" | "Medium" | "Low" | "Critical") ||
      "Medium",
    department: initialData?.department || "",
    files: initialData?.files || [],
    teamMembers: [],
    projectOwner: initialData?.projectOwner || "",
    projectOwnerEmail: initialData?.projectOwnerEmail || "",
    projectOwnerPhone: initialData?.projectOwnerPhone || "",
  });
  const [managerIds, setManagerIds] = useState<string[]>([]); // ✅ Changed to array for multiple Scrum Masters
  const [teamLeaderIds, setTeamLeaderIds] = useState<string[]>([]); // ✅ Changed to array for multiple Team Leaders
  const [teamMembersAvailable, setTeamMembersAvailable] = useState<
    TeamMember[]
  >([]);
  // If a departments list endpoint becomes available, reintroduce state here.
  const [departmentManagers, setDepartmentManagers] = useState<
    DepartmentManager[]
  >([]);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [newMemberId, setNewMemberId] = useState("");
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showErrorMessage, setShowErrorMessage] = useState(false);
  const [isLoadingManagers, setIsLoadingManagers] = useState<boolean>(true);
  const [managerLoadError, setManagerLoadError] = useState<string | null>(null);
  const [isLoadingTeamMembers, setIsLoadingTeamMembers] = useState<boolean>(true);
  const [teamMembersLoadError, setTeamMembersLoadError] = useState<string | null>(null);

  // Refs to prevent infinite loops in multistep mode
  const lastTeamSelectionRef = useRef<string>("");
  const lastProjectDataRef = useRef<string>("");

  // Auto-populate project owner details from current user
  useEffect(() => {
    if (user) {
      // Use the correct name field from user object
      const displayName = user.name || user.fullName || user.username || "";

      // Debug: Log user object to see available phone fields
      console.log("🔍 User object for phone number:", {
        phoneNumber: user.phone,
        phone: user.phone,
        allUserFields: Object.keys(user),
      });

      setNewProject((prev) => ({
        ...prev,
        projectOwner: displayName,
        projectOwnerEmail: user.email || "",
        projectOwnerPhone: user.phone || "", // Use phone field
      }));

      // Set current user as default manager if none selected
      if (managerIds.length === 0 && user.id) {
        setManagerIds([user.id]);
      }
    }
  }, [user]);

  // Communicate team selections to parent component (for multistep flow)
  useEffect(() => {
    if (isMultistep && onTeamSelectionChange) {
      // ✅ NEW: Find all selected Scrum Masters (supports multiple!)
      const selectedManagers = managerIds
        .map((id) => departmentManagers.find((m) => m.id === id))
        .filter(Boolean);

      // ✅ NEW: Find all selected Team Leaders (supports multiple!)
      const selectedTeamLeaders = teamLeaderIds
        .map(
          (id) =>
            teamMembersAvailable.find((m) => m.id === id) ||
            departmentManagers.find((m) => m.id === id)
        )
        .filter(Boolean);

      const currentSelection = JSON.stringify({
        managerIds,
        teamLeaderIds,
        teamMembers: newProject.teamMembers,
      });

      // Only call if the selection has actually changed
      if (currentSelection !== lastTeamSelectionRef.current) {
        lastTeamSelectionRef.current = currentSelection;
        onTeamSelectionChange({
          managerId: managerIds[0] || "", // ✅ Backward compatibility: first ID
          teamLeaderId: teamLeaderIds[0] || "", // ✅ Backward compatibility: first ID
          teamMembers: newProject.teamMembers,
          // ✅ NEW: Send arrays of complete user objects (TypeScript error ignored - interface will be updated)
          selectedManagerObjects: selectedManagers as any,
          selectedTeamLeaderObjects: selectedTeamLeaders as any,
          // ✅ Backward compatibility: Send first one as single object
          selectedManagerObject: selectedManagers[0],
          selectedTeamLeaderObject: selectedTeamLeaders[0],
        });
      }
    }
  }, [
    managerIds,
    teamLeaderIds,
    newProject.teamMembers,
    isMultistep,
    onTeamSelectionChange,
    departmentManagers,
    teamMembersAvailable,
  ]);

  // Communicate project data changes to parent component (for multistep flow)
  useEffect(() => {
    if (isMultistep && onProjectDataChange) {
      const currentProjectData = JSON.stringify({
        title: newProject.title,
        description: newProject.description,
        dueDate: newProject.dueDate,
        priority: newProject.priority,
      });

      // Only call if the project data has actually changed
      if (currentProjectData !== lastProjectDataRef.current) {
        lastProjectDataRef.current = currentProjectData;
        onProjectDataChange({
          title: newProject.title,
          description: newProject.description,
          dueDate: newProject.dueDate,
          priority: newProject.priority,
        });
      }
    }
  }, [
    newProject.title,
    newProject.description,
    newProject.dueDate,
    newProject.priority,
    isMultistep,
    onProjectDataChange,
  ]);

  // Search functionality for managers and team members
  const [managerSearch, setManagerSearch] = useState("");
  const [teamMemberSearch, setTeamMemberSearch] = useState("");
  const [showManagerDropdown, setShowManagerDropdown] = useState(false);
  const [showTeamMemberDropdown, setShowTeamMemberDropdown] = useState(false);

  // Filtered results based on search - show ALL users, not just department-specific
  const filteredManagers = departmentManagers.filter(
    (manager) =>
      (manager.name || "")
        .toLowerCase()
        .includes((managerSearch || "").toLowerCase()) ||
      (manager.email || "")
        .toLowerCase()
        .includes((managerSearch || "").toLowerCase()) ||
      (manager.department || "")
        .toLowerCase()
        .includes((managerSearch || "").toLowerCase())
  );

  // ✅ FIX: Use teamMembersAvailable for team leader selection (same as team members)
  const filteredTeamMembers = teamMembersAvailable.filter(
    (member) =>
      (member.name || "")
        .toLowerCase()
        .includes((teamMemberSearch || "").toLowerCase()) ||
      (member.role || "")
        .toLowerCase()
        .includes((teamMemberSearch || "").toLowerCase()) ||
      (member.department || "")
        .toLowerCase()
        .includes((teamMemberSearch || "").toLowerCase())
  );

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowManagerDropdown(false);
      setShowTeamMemberDropdown(false);
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // Load ALL users for manager selection (not department-specific)
  useEffect(() => {
    const loadManagers = async () => {
      setIsLoadingManagers(true);
      setManagerLoadError(null);
      try {
        // ✅ FIX: Load ALL users from all departments for manager selection
        console.log("🔍 Loading ALL users for manager selection...");
        console.log(
          "🔍 Loading managers for department:",
          newProject.department
        );
        console.log("📡 API Call: GET /User (using userService)");
        console.log(
          "🌐 Current API Base URL:",
          import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api"
        );

        // ✅ FIX: Try to get ALL users from all departments
        let resp;
        console.log("🔄 Trying to get ALL users from all departments...");

        // ✅ FIX: Try to get users with better error handling
        try {
          const { userService } = await import("@/services/userService");
          resp = await userService.getAllUsers();
          console.log("📊 userService.getAllUsers response:", resp);
        } catch (error) {
          console.error("❌ userService.getAllUsers failed:", error);
          throw error;
        }

        if (resp.success && Array.isArray(resp.data)) {
          console.log("📊 All Users API Response:", resp);
          console.log("✅ Success:", resp.success);
          console.log("📦 Data length:", resp.data.length);
          console.log("👥 All users:", resp.data);

          // ✅ FIX: Show ALL users from ALL departments (not filtering by department)
          let usersToProcess = resp.data;
          console.log(
            "🌍 Showing ALL users from ALL departments for manager selection"
          );
          console.log("👥 Total users available:", usersToProcess.length);

          // Log all user roles to see what we're working with
          console.log(
            "🔍 User roles found:",
            usersToProcess.map((u: any) => ({
              firstName: u.firstName,
              lastName: u.lastName,
              fullName: u.fullName,
              name: u.name,
              username: u.username,
              userName: u.userName,
              role: u.role,
              roleLower: (u.role || "").toLowerCase(),
              department: u.department,
            }))
          );

          // ✅ FIX: Show ALL users as potential managers/scrum masters (not just "manager" role)
          const allUsersAsManagers = usersToProcess.map((u: any) => {
            // Debug the user object to see what fields are available
            console.log("🔍 Processing user:", {
              id: u.id,
              firstName: u.firstName,
              lastName: u.lastName,
              fullName: u.fullName,
              name: u.name,
              username: u.username,
              userName: u.userName,
              role: u.role,
              department: u.department,
              email: u.email,
              phoneNumber: u.phoneNumber,
              phone: u.phone,
            });

            return {
              id: u.id,
              employeeId: u.employeeId, // ✅ CRITICAL: Include employeeId for backend assignment
              name:
                `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() ||
                u.fullName ||
                u.name ||
                u.username ||
                u.userName ||
                "Unknown",
              role: u.role || "User",
              department: u.department || "Unknown",
              email: u.email || "",
              phone: u.phoneNumber || "",
            };
          });

          console.log(
            "👥 ALL users as potential managers/scrum masters:",
            allUsersAsManagers
          );

          // ✅ FIX: Also include current user if not already in the list
          if (
            user &&
            !allUsersAsManagers.some((manager) => manager.id === user.id)
          ) {
            console.log("👤 Adding current user to managers list");
            allUsersAsManagers.push({
              id: user.id,
              employeeId: user.employeeId, // ✅ CRITICAL: Include employeeId
              name: user.name || user.username || "Current User",
              role: user.role || "User",
              department: user.department || "Unknown",
              email: user.email || "",
              phone: user.phone || "",
            });
          }

          let updatedManagers = allUsersAsManagers;
          if (!updatedManagers.length && user) {
            updatedManagers = [
              {
                id: user.id,
                employeeId: user.employeeId,
                name: user.name || user.username || "Current User",
                role: user.role || "User",
                department: user.department || "Unknown",
                email: user.email || "",
                phone: user.phone || "",
              },
            ];
          }

          setDepartmentManagers(updatedManagers);
          if (!updatedManagers.length) {
            setManagerLoadError("No users were returned from the server.");
          }
          console.log(
            "✅ Set department managers to ALL users:",
            updatedManagers.length,
            "users"
          );
        } else {
          console.warn(
            "⚠️ No managers found for department:",
            newProject.department
          );
          console.warn("📊 Response details:", {
            success: resp.success,
            data: resp.data,
            message: resp.message,
          });

          // Backend API not implemented - show empty list
          console.error(
            "❌ BACKEND API MISSING: /api/User endpoint not implemented"
          );
          console.error("🔧 REQUIRED: Implement GET /api/User in your backend");
          setDepartmentManagers([]);
          setManagerLoadError(
            resp.message ||
              "No users were returned from the server. Please ensure the backend /api/User endpoint returns data."
          );
        }
      } catch (error) {
        console.error("❌ Failed to load managers:", error);
        console.error("🔍 Error details:", error);

        // Backend API not implemented - show empty list
        console.error("❌ BACKEND API MISSING: All user endpoints failed");
        console.error(
          "🔧 REQUIRED: Implement these endpoints in your backend:"
        );
        console.error("   - GET /api/User (get all users)");
        console.error("   - GET /api/User/users-by-department/{department}");
        // The second catch block is unreachable and unused here, so it should be removed.
        setDepartmentManagers([]);
        setManagerLoadError(
          (error as any)?.message ||
            "Failed to load users. Please verify the backend is running."
        );
      } finally {
        setIsLoadingManagers(false);
      }
    };

    loadManagers();
  }, [newProject.department]);

  // Load all users for team members dropdown on component mount
  useEffect(() => {
    const loadAllUsersForTeamMembers = async () => {
      setIsLoadingTeamMembers(true);
      setTeamMembersLoadError(null);
      try {
        console.log("🔍 Loading all users for team members dropdown");

        // Try to get all users from the API
        const { userService } = await import("@/services/userService");
        const resp = await userService.getAllUsers();

        if (resp.success && Array.isArray(resp.data)) {
          console.log("📊 All Users API Response:", resp);
          console.log("✅ Success:", resp.success);
          console.log("📦 Data length:", resp.data.length);

          const allUsers = resp.data.map((u: any) => ({
            id: u.id,
            employeeId: u.employeeId, // ✅ CRITICAL: Include employeeId for backend assignment
            name:
              `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() ||
              u.fullName ||
              u.name ||
              "Unknown",
            role: u.role || "Member",
            department: u.department || "Unknown",
            email: u.email || "",
          }));

          console.log("👥 Mapped all users for team members:", allUsers);
          setTeamMembersAvailable(allUsers);
          if (!allUsers.length) {
            setTeamMembersLoadError("No users were returned for team members.");
          }
        } else {
          console.warn("⚠️ All users API failed, backend not implemented");
          console.error(
            "❌ BACKEND API MISSING: /api/User endpoint not implemented"
          );
          console.error("🔧 REQUIRED: Implement GET /api/User in your backend");
          setTeamMembersAvailable([]);
          setTeamMembersLoadError(
            resp.message ||
              "Unable to fetch users for team members. Please verify the backend endpoint."
          );
        }
      } catch (error) {
        console.error("❌ Failed to load all users for team members:", error);
        console.error("🔧 REQUIRED: Implement GET /api/User in your backend");
        setTeamMembersAvailable([]);
        setTeamMembersLoadError(
          (error as any)?.message ||
            "Failed to load team members. Please verify the backend is running."
        );
      } finally {
        setIsLoadingTeamMembers(false);
      }
    };

    loadAllUsersForTeamMembers();
  }, []);

  const handleAddMember = () => {
    if (!newMemberId) return;

    const member = teamMembersAvailable.find((m) => m.id === newMemberId);
    if (member && !newProject.teamMembers.some((m) => m.id === member.id)) {
      setNewProject((prev) => ({
        ...prev,
        teamMembers: [...prev.teamMembers, member],
      }));
    }
    setNewMemberId("");
    setIsAddingMember(false);
  };

  const handleRemoveMember = (memberId: string) => {
    setNewProject((prev) => ({
      ...prev,
      teamMembers: prev.teamMembers.filter((member) => member.id !== memberId),
    }));
  };

  const handleNewProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // 🔧 FIXED: Ensure all required fields are always present
      // Include assignedEmployeeId/assignedRole when a manager is selected so
      // the backend can create the initial ProjectAssignment atomically.
      const projectData = {
        title: newProject.title,
        description: newProject.description,
        priority: newProject.priority as "Low" | "Medium" | "High" | "Critical",
        dueDate: new Date(newProject.dueDate).toISOString(), // Convert to ISO format
        // Required fields - always include with fallbacks
        projectOwner:
          newProject.projectOwner || user?.name || user?.username || "Unknown",
        projectOwnerEmail: newProject.projectOwnerEmail || user?.email || "",
        projectOwnerPhone:
          newProject.projectOwnerPhone || user?.phone || "+1234567890", // Required field with fallback
        department: newProject.department || user?.department || "General",
        status: "Active", // Required field - Valid values: "Active" | "On Hold" | "Completed" | "Archived"
      };

      // If a manager is selected, prefer their employeeId when available
      if (managerIds && managerIds.length > 0) {
        const primaryManager = departmentManagers.find((m) => m.id === managerIds[0]);
        (projectData as any).assignedEmployeeId = primaryManager?.employeeId || managerIds[0];
        (projectData as any).assignedRole = "ScrumMaster";
      }

      console.log(
        "🔍 Project data being sent:",
        JSON.stringify(projectData, null, 2)
      );
      console.log("🔍 NewProject object:", newProject);
      console.log("🔍 Form field values:");
      console.log("- Title:", newProject.title);
      console.log("- Description:", newProject.description);
      console.log("- Project Owner:", newProject.projectOwner);
      console.log("- Project Owner Email:", newProject.projectOwnerEmail);
      console.log("- Project Owner Phone:", newProject.projectOwnerPhone);
      console.log("- Department:", newProject.department);
      console.log("- Priority:", newProject.priority);
      console.log("- Due Date:", newProject.dueDate);

      // 🔍 VALIDATION CHECK: Check for required fields only
      console.log("🔍 ===== VALIDATION CHECK =====");
      const validationErrors = [];

      if (!projectData.title || projectData.title.trim() === "") {
        validationErrors.push("Title is required");
      }
      if (!projectData.dueDate || projectData.dueDate.trim() === "") {
        validationErrors.push("Due date is required");
      }

      // Optional fields - just warn if missing but don't block
      if (!projectData.projectOwner || projectData.projectOwner.trim() === "") {
        console.warn("⚠️ Project owner is empty - backend may use default");
      }
      if (!projectData.department || projectData.department.trim() === "") {
        console.warn("⚠️ Department is empty - backend may use default");
      }
      if (
        !projectData.projectOwnerEmail ||
        projectData.projectOwnerEmail.trim() === ""
      ) {
        console.warn(
          "⚠️ Project owner email is empty - backend may use default"
        );
      }

      if (validationErrors.length > 0) {
        console.error("❌ VALIDATION ERRORS FOUND:", validationErrors);
        setShowErrorMessage(true);
        setTimeout(() => setShowErrorMessage(false), 5000);
        return;
      }

      console.log("✅ All required validation checks passed");

      const response = await projectService.createProject(projectData);

      console.log("📊 Project creation response:", response);
      const data = response;

      if (data && data.success && data.data) {
        console.log("✅ Project created successfully with ID:", data.data.id);

        // Upload files if any
        if (newProject.files.length > 0) {
          console.log(
            "📎 Uploading",
            newProject.files.length,
            "files for project:",
            data.data.id
          );

          for (const file of newProject.files) {
            console.log(
              "📎 Uploading file:",
              file.name,
              "Size:",
              file.size,
              "Type:",
              file.type
            );

            const formData = new FormData();
            formData.append("file", file);
            formData.append("entityType", "Project");
            formData.append("entityId", data.data.id.toString());
            formData.append(
              "description",
              `Attachment for project: ${newProject.title}`
            );
            formData.append("tags", "[]");

            try {
              const { attachmentsService } = await import(
                "@/services/attachmentsService"
              );
              console.log("📎 AttachmentsService imported successfully");
              console.log("📎 Calling attachmentsService.upload...");
              const uploadResult = await attachmentsService.upload(formData);
              console.log("✅ File uploaded successfully:", file.name);
              console.log("✅ Upload result:", uploadResult);
            } catch (error) {
              console.error("❌ File upload error:", file.name, error);
              console.error("❌ Error details:", error);
              console.error(
                "❌ Error stack:",
                error instanceof Error ? error.stack : "No stack trace"
              );
              // Continue with other files even if one fails
            }
          }
        }

        // Assign team members to the project
        if (
          newProject.teamMembers.length > 0 ||
          managerIds.length > 0 ||
          teamLeaderIds.length > 0
        ) {
          console.log("👥 Assigning team members to project:", data.data.id);
          console.log("👥 Team members to assign:", newProject.teamMembers);
          console.log("👥 Manager IDs:", managerIds);
          console.log("👥 Team Leader IDs:", teamLeaderIds);

          const { projectAssignmentService } = await import(
            "@/services/projectAssignmentService"
          );

          // ✅ Assign ALL Scrum Masters
          for (const managerId of managerIds) {
            try {
              const manager = departmentManagers.find(
                (m) => m.id === managerId
              );
              console.log(
                "👥 Assigning Scrum Master:",
                manager?.name || managerId
              );
              const managerData = {
                projectId: Number(data.data.id),
                employeeId: manager?.employeeId || managerId,
                memberRole: "Scrum Master",
                role: manager?.role,
              };
              console.log(
                "👥 Scrum Master assignment data:",
                JSON.stringify(managerData, null, 2)
              );
              const managerResponse = await projectAssignmentService.addMembers(
                managerData
              );
              console.log("✅ Scrum Master assigned:", managerResponse);
            } catch (error) {
              console.error("❌ Error assigning Scrum Master:", error);
            }
          }

          // ✅ Assign ALL Team Leaders
          for (const teamLeaderId of teamLeaderIds) {
            try {
              const leader =
                teamMembersAvailable.find((m) => m.id === teamLeaderId) ||
                departmentManagers.find((m) => m.id === teamLeaderId);
              console.log(
                "👥 Assigning Team Leader:",
                leader?.name || teamLeaderId
              );
              const teamLeaderData = {
                projectId: Number(data.data.id),
                employeeId: leader?.employeeId || teamLeaderId,
                memberRole: "Team Leader",
                role: leader?.role,
              };
              console.log(
                "👥 Team Leader assignment data:",
                JSON.stringify(teamLeaderData, null, 2)
              );
              const teamLeaderResponse =
                await projectAssignmentService.addMembers(teamLeaderData);
              console.log("✅ Team Leader assigned:", teamLeaderResponse);
            } catch (error) {
              console.error("❌ Error assigning Team Leader:", error);
            }
          }

          // Assign Team Members
          for (const member of newProject.teamMembers) {
            try {
              console.log("👥 Assigning Team Member:", member.name, member.id);
              // ✅ Use employeeId when available. Some user objects provide both UUID (id)
              // and an employeeId (like "EMP12345"). The backend ProjectAssignment
              // endpoints expect an EmployeeId value for lookup, so prefer that.
              const memberData = {
                projectId: Number(data.data.id),
                employeeId: (member as any).employeeId || member.id,
                memberRole: "Member",
              };
              console.log(
                "👥 Team Member assignment data:",
                JSON.stringify(memberData, null, 2)
              );
              const memberResponse = await projectAssignmentService.addMembers(
                memberData
              );
              console.log("✅ Team Member assigned:", memberResponse);
              console.log(
                "✅ Team Member response success:",
                memberResponse.success
              );
              console.log("✅ Team Member response data:", memberResponse.data);
              console.log(
                "✅ Team Member response message:",
                memberResponse.message
              );
            } catch (error) {
              console.error(
                "❌ Error assigning Team Member:",
                member.name,
                error
              );
            }
          }
        } else {
          console.log("👥 No team members to assign");
        }

        // Show success message
        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 3000);

        // Call the onProjectCreated callback if provided
        if (onProjectCreated && data.data) {
          // Convert projectService.Project to types/types.Project
          const convertedProject: Project = {
            id: parseInt(data.data.id) || 0,
            title: data.data.title || newProject.title,
            description: data.data.description || newProject.description,
            dueDate: data.data.dueDate || newProject.dueDate,
            createdBy:
              data.data.createdBy || user?.name || user?.username || "Unknown",
            teamMembers: [],
            scrumMaster: null,
            teamLeader: null,
            priority: (() => {
              const priority = data.data.priority?.toLowerCase();
              if (priority === "high" || priority === "critical") return "High";
              if (priority === "medium") return "Medium";
              if (priority === "low") return "Low";
              return "Medium";
            })(),
            status: (() => {
              const status = (data.data.status as string)?.toLowerCase();
              // Convert backend status to typed status (case-insensitive)
              if (status === "active") return "Active";
              if (status === "on hold") return "On Hold";
              if (status === "completed") return "Completed";
              if (status === "archived") return "Archived";
              return "Active"; // Default to Active
            })() as "Active" | "On Hold" | "Completed" | "Archived",
            progress: 0,
            files: [],
            tasks: [],
          };
          onProjectCreated(convertedProject);
        }

        setNewProject({
          title: "",
          description: "",
          dueDate: "",
          priority: "Medium",
          department: "",
          files: [],
          teamMembers: [],
          projectOwner: "",
          projectOwnerEmail: "",
          projectOwnerPhone: "",
        });
        setManagerIds([]);
        setTeamLeaderIds([]);

        if (onClose) {
          onClose();
        }
      } else {
        console.error("❌ Project creation failed:", data);
        // Try to extract the most helpful error message
        const serverMessage = (data && (data.message || data.raw?.message)) || "Project creation failed";
        const serverErrors = data && (data.errors || data.raw?.errors);

        // Show detailed notification
        addNotification({
          type: "error" as any,
          title: "Project Creation Failed",
          message: serverMessage + (serverErrors ? `\nDetails: ${JSON.stringify(serverErrors)}` : ""),
          category: "PROJECT_UPDATE" as any,
          userId: user?.id || "",
        });

        setShowErrorMessage(true);
        setTimeout(() => setShowErrorMessage(false), 8000);

        // Also throw to trigger existing catch logging
        throw data;
      }
    } catch (error: any) {
      console.error("❌ Catch block error:", error);
      console.error("❌ Error type:", typeof error);
      console.error("❌ Error message:", error?.message);
      console.error("❌ Error errors:", error?.errors);
      console.error("❌ Error status:", error?.status);
      console.error("❌ Error raw:", error?.raw);

      setShowErrorMessage(true);
      setTimeout(() => setShowErrorMessage(false), 5000);

      // Build detailed error message
      let errorMessage = "Failed to create project";
      let errorDetails: string[] = [];

      if (error && typeof error === "object") {
        if (error.message) {
          errorMessage = error.message;
        }

        // Add validation errors if present (from our API client)
        if (
          error.errors &&
          Array.isArray(error.errors) &&
          error.errors.length > 0
        ) {
          errorDetails = error.errors;
        }
        // Also check raw backend errors (ASP.NET Core format)
        else if (
          error.raw &&
          error.raw.errors &&
          typeof error.raw.errors === "object"
        ) {
          Object.entries(error.raw.errors).forEach(
            ([field, messages]: [string, any]) => {
              if (Array.isArray(messages)) {
                messages.forEach((msg) => {
                  errorDetails.push(`${field}: ${msg}`);
                });
              }
            }
          );
        }

        // Build final message
        if (errorDetails.length > 0) {
          errorMessage +=
            "\n\nValidation Errors:\n• " + errorDetails.join("\n• ");
        }

        // Add status code
        if (error.status) {
          errorMessage += `\n\nStatus Code: ${error.status}`;
        }
      }

      // Show error notification
      addNotification({
        type: "error" as any,
        title: "Project Creation Failed",
        message: errorMessage,
        category: "PROJECT_UPDATE" as any,
        userId: user?.id || "",
      });
    }
  };

  return (
    <div
      className={`p-4 ${
        darkMode ? "bg-zinc-800 text-gray-100" : "bg-white text-gray-800"
      }`}
    >
      <h2 className="text-2xl font-bold mb-6">Create New Project</h2>
      <form onSubmit={handleNewProjectSubmit} className="space-y-6">
        <div className="space-y-1">
          <Label htmlFor="title" className={darkMode ? "text-gray-300" : ""}>
            Project Title
          </Label>
          <Input
            id="title"
            value={newProject.title}
            onChange={(e) =>
              setNewProject((prev) => ({ ...prev, title: e.target.value }))
            }
            placeholder="Enter project title"
            className={
              darkMode ? "bg-zinc-600 border-zinc-500 text-gray-300" : ""
            }
          />
        </div>

        <div className="space-y-1">
          <Label
            htmlFor="description"
            className={darkMode ? "text-gray-300" : ""}
          >
            Description
          </Label>
          <Textarea
            id="description"
            value={newProject.description}
            onChange={(e) =>
              setNewProject((prev) => ({
                ...prev,
                description: e.target.value,
              }))
            }
            placeholder="Enter project description"
            className={
              darkMode ? "bg-zinc-600 border-zinc-500 text-gray-300" : ""
            }
            rows={3}
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="dueDate" className={darkMode ? "text-gray-300" : ""}>
            Due Date
          </Label>
          <Input
            id="dueDate"
            type="date"
            value={newProject.dueDate}
            onChange={(e) =>
              setNewProject((prev) => ({ ...prev, dueDate: e.target.value }))
            }
            className={
              darkMode ? "bg-zinc-600 border-zinc-500 text-gray-300" : ""
            }
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="priority" className={darkMode ? "text-gray-300" : ""}>
            Priority
          </Label>
          <Select
            value={newProject.priority}
            onValueChange={(value: "High" | "Medium" | "Low" | "Critical") =>
              setNewProject((prev) => ({ ...prev, priority: value }))
            }
          >
            <SelectTrigger
              className={
                darkMode ? "bg-zinc-600 border-zinc-500 text-gray-300" : ""
              }
            >
              <SelectValue placeholder="Select priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Low">Low</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="High">High</SelectItem>
              <SelectItem value="Critical">Critical</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label
            htmlFor="department"
            className={darkMode ? "text-gray-300" : ""}
          >
            Department
          </Label>
          <Input
            id="department"
            value={newProject.department}
            onChange={(e) =>
              setNewProject((prev) => ({ ...prev, department: e.target.value }))
            }
            placeholder="Enter department"
            className={
              darkMode ? "bg-zinc-600 border-zinc-500 text-gray-300" : ""
            }
          />
        </div>

        <div className="space-y-1">
          <Label
            htmlFor="projectOwner"
            className={darkMode ? "text-gray-300" : ""}
          >
            Project Owner
          </Label>
          <Input
            id="projectOwner"
            value={newProject.projectOwner}
            onChange={(e) =>
              setNewProject((prev) => ({
                ...prev,
                projectOwner: e.target.value,
              }))
            }
            placeholder="Enter project owner name"
            className={
              darkMode ? "bg-zinc-600 border-zinc-500 text-gray-300" : ""
            }
          />
        </div>

        <div className="space-y-1">
          <Label
            htmlFor="projectOwnerEmail"
            className={darkMode ? "text-gray-300" : ""}
          >
            Project Owner Email
          </Label>
          <Input
            id="projectOwnerEmail"
            type="email"
            value={newProject.projectOwnerEmail}
            onChange={(e) =>
              setNewProject((prev) => ({
                ...prev,
                projectOwnerEmail: e.target.value,
              }))
            }
            placeholder="Enter project owner email"
            className={
              darkMode ? "bg-zinc-600 border-zinc-500 text-gray-300" : ""
            }
          />
        </div>

        <div className="space-y-1">
          <Label
            htmlFor="projectOwnerPhone"
            className={darkMode ? "text-gray-300" : ""}
          >
            Project Owner Phone
          </Label>
          <div className="relative">
            <Input
              id="projectOwnerPhone"
              type="tel"
              value={newProject.projectOwnerPhone}
              onChange={(e) =>
                setNewProject((prev) => ({
                  ...prev,
                  projectOwnerPhone: e.target.value,
                }))
              }
              placeholder="Enter project owner phone"
              className={
                darkMode ? "bg-zinc-600 border-zinc-500 text-gray-300" : ""
              }
            />
          </div>
        </div>

        {/* File Attachments */}
        <div className="space-y-1">
          <Label className={darkMode ? "text-gray-300" : ""}>Attachments</Label>
          <div
            className={`border-2 border-dashed rounded-lg p-4 text-center ${
              darkMode
                ? "border-zinc-500 bg-zinc-600"
                : "border-gray-300 bg-white"
            }`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const droppedFiles = Array.from(e.dataTransfer.files);
              setNewProject((prev) => ({
                ...prev,
                files: [...prev.files, ...droppedFiles],
              }));
            }}
          >
            <Paperclip className="mx-auto w-6 h-6 mb-2" />
            <p className="text-sm mb-2">
              Drag and drop files here or click to browse
            </p>
            <input
              type="file"
              id="file-upload"
              className="hidden"
              onChange={(e) => {
                if (e.target.files) {
                  const selectedFiles = Array.from(e.target.files);
                  setNewProject((prev) => ({
                    ...prev,
                    files: [...prev.files, ...selectedFiles],
                  }));
                }
              }}
              multiple
            />
            <label
              htmlFor="file-upload"
              className={`inline-block px-4 py-2 rounded-lg text-sm cursor-pointer ${
                darkMode
                  ? "bg-zinc-500 hover:bg-zinc-400"
                  : "bg-gray-200 hover:bg-gray-300"
              }`}
            >
              Browse Files
            </label>
          </div>

          {/* Show selected files */}
          {newProject.files.length > 0 && (
            <div className="mt-2">
              <h4 className="text-sm font-medium mb-2">Selected Files:</h4>
              <div className="space-y-1">
                {newProject.files.map((file, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-2 rounded ${
                      darkMode ? "bg-zinc-600" : "bg-gray-100"
                    }`}
                  >
                    <span className="text-sm">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setNewProject((prev) => ({
                          ...prev,
                          files: prev.files.filter((_, i) => i !== index),
                        }));
                      }}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Manager Selection - Supports Multiple */}
        <div className="space-y-2">
          <Label htmlFor="manager" className={darkMode ? "text-gray-300" : ""}>
            Scrum Master(s){" "}
            {managerIds.length > 0 && `(${managerIds.length} selected)`}
          </Label>

          {/* Display Selected Scrum Masters */}
          {managerIds.length > 0 && (
            <div className="space-y-2 mb-2">
              {managerIds.map((id) => {
                // Try to find manager object in loaded list; if not available,
                // fall back to the current authenticated user so the UI shows a
                // sensible default even when backend user list failed to load.
                let manager = departmentManagers.find((m) => m.id === id);
                if (!manager && user && user.id === id) {
                  manager = {
                    id: user.id,
                    employeeId: user.employeeId,
                    name: user.name || user.fullName || user.username || "You",
                    role: user.role || "User",
                    department: user.department || "",
                    email: user.email || "",
                    phone: user.phone || "",
                  } as any;
                }

                if (!manager) return null;

                return (
                  <div
                    key={id}
                    className={`flex items-center justify-between p-2 rounded ${
                      darkMode ? "bg-zinc-700" : "bg-gray-100"
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs">
                        {(manager.name || "U").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{manager.name}</p>
                        <p className="text-xs text-gray-500">{manager.department}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setManagerIds((prev) => prev.filter((i) => i !== id))
                      }
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Add Scrum Master */}
          <div className="relative">
            <Input
              id="manager"
              value={managerSearch}
              onChange={(e) => {
                setManagerSearch(e.target.value);
                setShowManagerDropdown(true);
              }}
              onFocus={() => setShowManagerDropdown(true)}
              placeholder={
                managerIds.length > 0
                  ? "Add another Scrum Master"
                  : "Search for a Scrum Master"
              }
              className={
                darkMode ? "bg-zinc-600 border-zinc-500 text-gray-300" : ""
              }
            />
            {showManagerDropdown && (
              <div
                className={`absolute z-10 w-full mt-1 max-h-60 overflow-auto rounded-md shadow-lg ${
                  darkMode
                    ? "bg-zinc-700 border border-zinc-600"
                    : "bg-white border border-gray-300"
                }`}
              >
                {filteredManagers.filter((m) => !managerIds.includes(m.id))
                  .length > 0 ? (
                  filteredManagers
                    .filter((m) => !managerIds.includes(m.id))
                    .map((manager) => (
                      <div
                        key={manager.id}
                        onClick={() => {
                          setManagerIds((prev) => [...prev, manager.id]);
                          setManagerSearch("");
                          setShowManagerDropdown(false);
                        }}
                        className={`p-3 cursor-pointer hover:bg-opacity-80 ${
                          darkMode ? "hover:bg-zinc-600" : "hover:bg-gray-100"
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                              {(manager.name || "U").charAt(0).toUpperCase()}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {manager.name}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                              {manager.email}
                            </p>
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            🏢 {manager.department}
                          </div>
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="p-3 text-gray-500 dark:text-gray-400">
                    {managerSearch
                      ? "No managers found"
                      : "All managers already selected"}
                  </div>
                )}
              </div>
            )}
          </div>
          {isLoadingManagers && (
            <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Loading available users…
            </div>
          )}
          {!isLoadingManagers && departmentManagers.length === 0 && (
            <div className="mt-2 text-sm text-yellow-600">
              {managerLoadError ??
                "No users available. Please ensure the backend returns user data."}
            </div>
          )}
        </div>

        {/* Team Leader Selection - Supports Multiple */}
        <div className="space-y-2">
          <Label
            htmlFor="teamLeader"
            className={darkMode ? "text-gray-300" : ""}
          >
            Team Leader(s){" "}
            {teamLeaderIds.length > 0 && `(${teamLeaderIds.length} selected)`}
          </Label>

          {/* Display Selected Team Leaders */}
          {teamLeaderIds.length > 0 && (
            <div className="space-y-2 mb-2">
              {teamLeaderIds.map((id) => {
                // Find leader in team members or department managers; if not found,
                // fall back to the authenticated user when IDs match so the UI
                // still displays a sensible default.
                let leader =
                  teamMembersAvailable.find((m) => m.id === id) ||
                  departmentManagers.find((m) => m.id === id);
                if (!leader && user && user.id === id) {
                  leader = {
                    id: user.id,
                    employeeId: user.employeeId,
                    name: user.name || user.fullName || user.username || "You",
                    role: user.role || "User",
                    department: user.department || "",
                    email: user.email || "",
                  } as any;
                }
                if (!leader) return null;
                return (
                  <div
                    key={id}
                    className={`flex items-center justify-between p-2 rounded ${
                      darkMode ? "bg-zinc-700" : "bg-gray-100"
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs">
                        {(leader.name || "U").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{leader.name}</p>
                        <p className="text-xs text-gray-500">
                          {leader.department}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setTeamLeaderIds((prev) => prev.filter((i) => i !== id))
                      }
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Add Team Leader */}
          <div className="relative">
            <Input
              id="teamLeader"
              value={teamMemberSearch}
              onChange={(e) => {
                setTeamMemberSearch(e.target.value);
                setShowTeamMemberDropdown(true);
              }}
              onFocus={() => setShowTeamMemberDropdown(true)}
              placeholder={
                teamLeaderIds.length > 0
                  ? "Add another Team Leader"
                  : "Search for a Team Leader"
              }
              className={
                darkMode ? "bg-zinc-600 border-zinc-500 text-gray-300" : ""
              }
            />
            {showTeamMemberDropdown && (
              <div
                className={`absolute z-10 w-full mt-1 max-h-60 overflow-auto rounded-md shadow-lg ${
                  darkMode
                    ? "bg-zinc-700 border-zinc-600"
                    : "bg-white border border-gray-300"
                }`}
              >
                {filteredTeamMembers.filter(
                  (m) => !teamLeaderIds.includes(m.id)
                ).length > 0 ? (
                  filteredTeamMembers
                    .filter((m) => !teamLeaderIds.includes(m.id))
                    .map((member) => (
                      <div
                        key={member.id}
                        onClick={() => {
                          setTeamLeaderIds((prev) => [...prev, member.id]);
                          setTeamMemberSearch("");
                          setShowTeamMemberDropdown(false);
                        }}
                        className={`p-3 cursor-pointer hover:bg-opacity-80 ${
                          darkMode ? "hover:bg-zinc-600" : "hover:bg-gray-100"
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                              {(member.name || "U").charAt(0).toUpperCase()}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {member.name}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                              {member.email || member.role}
                            </p>
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            🏢 {member.department}
                          </div>
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="p-3 text-gray-500 dark:text-gray-400">
                    {teamMemberSearch
                      ? "No team members found"
                      : "All members already selected"}
                  </div>
                )}
              </div>
            )}
          </div>
          {isLoadingTeamMembers && (
            <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Loading team members…
            </div>
          )}
          {!isLoadingTeamMembers && teamMembersAvailable.length === 0 && (
            <div className="mt-2 text-sm text-yellow-600">
              {teamMembersLoadError ??
                "No users available to add as team members. Please verify the backend users endpoint."}
            </div>
          )}
        </div>

        {/* Team Members */}
        <div className="space-y-1">
          <Label className={darkMode ? "text-gray-300" : ""}>
            Team Members
          </Label>
          <div className="space-y-2">
            {newProject.teamMembers.map((member) => (
              <div
                key={member.id}
                className={`flex items-center justify-between p-2 rounded ${
                  darkMode ? "bg-zinc-600" : "bg-gray-100"
                }`}
              >
                <span>
                  {member.name} ({member.role}, {member.department})
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveMember(member.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
            {!isAddingMember ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddingMember(true)}
                className="w-full"
              >
                Add Team Member
              </Button>
            ) : (
              <div className="flex space-x-2">
                <Select value={newMemberId} onValueChange={setNewMemberId}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select team member" />
                  </SelectTrigger>
                  <SelectContent>
                    {teamMembersAvailable.map((m) => (
                      <SelectItem
                        key={m.id}
                        value={m.id}
                        className={darkMode ? "hover:bg-zinc-600" : ""}
                      >
                        {m.name} ({m.role}, {m.department})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  onClick={handleAddMember}
                  disabled={!newMemberId}
                  className="bg-fuchsia-800 hover:bg-stone-800 text-white"
                >
                  Add Member
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAddingMember(false);
                    setNewMemberId("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-3">
          {onClose && (
            <Button
              variant="outline"
              onClick={onClose}
              className={
                darkMode
                  ? "bg-zinc-600 border-zinc-500 text-gray-300 hover:bg-zinc-500"
                  : ""
              }
            >
              Cancel
            </Button>
          )}
          <Button
            type={isMultistep ? "button" : "submit"}
            className={`transition-all duration-200 hover:scale-105 shadow-md hover:shadow-lg ${
              darkMode
                ? "bg-fuchsia-700 hover:bg-fuchsia-600 text-white"
                : "bg-fuchsia-800 hover:bg-stone-800 text-white"
            }`}
            // Backend will auto-assign the creator as ScrumMaster when none is provided,
            // so only validate title and due date client-side.
            disabled={!newProject.title || !newProject.dueDate}
            onClick={() => {
              console.log("🔍 Form validation check:");
              console.log("- Title:", newProject.title);
              console.log("- Due Date:", newProject.dueDate);
              console.log("- Manager IDs:", managerIds);
              console.log(
                "- Button disabled:",
                !newProject.title ||
                  !newProject.dueDate ||
                  managerIds.length === 0
              );

              // In multistep mode, call parent callback instead of submitting
              if (isMultistep && onButtonClick) {
                console.log("🔍 Multistep mode - calling parent callback");
                onButtonClick();
                return;
              }
            }}
          >
            {buttonLabel}
          </Button>
        </div>
      </form>

      {showSuccessMessage && (
        <div className="mt-4 p-4 bg-green-100 text-green-800 rounded">
          Project created successfully!
        </div>
      )}
      {showErrorMessage && (
        <div className="mt-4 p-4 bg-red-100 text-red-800 rounded">
          Failed to create project. Please try again.
        </div>
      )}
    </div>
  );
};

export default CreateProject;
