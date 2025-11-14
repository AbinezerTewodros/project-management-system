"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import {
  Building2,
  Loader2,
  MessageSquare,
  RefreshCw,
  Send,
  Users,
  Pencil,
  Trash2,
  Check,
  X,
  UserCircle,
  Paperclip,
  XCircle,
} from "lucide-react";
import { format } from "date-fns";

import { useAuth } from "@/context/AuthContext";
import { messageService } from "@/services/messageService";
import { projectAssignmentService } from "@/services/projectAssignmentService";
import { userService } from "@/services/userService";
import { attachmentService } from "@/services/attachmentService";
import {
  CreateMessageDto,
  MessageDto,
  MessageType,
} from "@/types/messageTypes";

type ChatTab = "department" | "project" | "personal";

export default function ChatV2({ darkMode }: { darkMode: boolean }) {
  const { user } = useAuth();
  const currentUserId = user?.id ?? "";
  const currentEmployeeId = user?.employeeId ?? "";

  const [activeTab, setActiveTab] = useState<ChatTab>("project");

  // Department
  const [deptLoading, setDeptLoading] = useState(false);
  const [deptMessages, setDeptMessages] = useState<MessageDto[]>([]);

  // Project
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projectList, setProjectList] = useState<
    { projectId: number; projectName: string }[]
  >([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(
    null
  );
  const [projectLoading, setProjectLoading] = useState(false);
  const [projectMessages, setProjectMessages] = useState<
    Record<number, MessageDto[]>
  >({});

  // Personal
  const [inboxLoading, setInboxLoading] = useState(false);
  const [personalMessages, setPersonalMessages] = useState<MessageDto[]>([]);
  const [people, setPeople] = useState<
    { id: string; employeeId: string; name: string }[]
  >([]);
  const [peopleSearch, setPeopleSearch] = useState("");
  const [projectsSearch, setProjectsSearch] = useState("");
  const [selectedPerson, setSelectedPerson] = useState<{
    id: string;
    employeeId: string;
    name: string;
  } | null>(null);
  const [composer, setComposer] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Unread counts from API (real-time)
  const [unreadCounts, setUnreadCounts] = useState<{
    personalUnread: number;
    departmentUnread: number;
    projectUnread: number;
    groupUnread: number;
    total: number;
  }>({
    personalUnread: 0,
    departmentUnread: 0,
    projectUnread: 0,
    groupUnread: 0,
    total: 0,
  });

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState<string>("");

  // Project members modal
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [projectMembers, setProjectMembers] = useState<
    Array<{
      id: string;
      fullName: string;
      employeeId: string;
      email: string;
      department: string;
    }>
  >([]);

  // Delete confirmation
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  // Initial load - fetch all messages to get accurate counts
  useEffect(() => {
    // Load department messages immediately
    void refreshDepartment();
    // Load project list
    void refreshProjects();
    // Load personal inbox
    void refreshInbox();
    // Load people directory
    void loadDirectory();
    // Load all project messages to calculate unread counts
    void loadAllProjectMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Tab-specific loads
  useEffect(() => {
    if (activeTab === "department" && !deptMessages.length) {
      void refreshDepartment();
    }
    if (activeTab === "project" && !projectList.length) {
      void refreshProjects();
    }
    if (activeTab === "personal") {
      if (!personalMessages.length) {
        void refreshInbox();
      }
      if (!people.length) {
        void loadDirectory();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Initial load of unread counts on mount
  useEffect(() => {
    void refreshUnread();
  }, []);

  // Auto-refresh unread counts every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      void refreshUnread();
    }, 10000); // 10 seconds

    return () => clearInterval(interval);
  }, []);

  // Auto-refresh ALL messages every 20 seconds to keep counts accurate
  useEffect(() => {
    const interval = setInterval(() => {
      void refreshDepartment();
      void refreshInbox();
      // Refresh all project messages to keep unread counts accurate
      void loadAllProjectMessages();
    }, 20000); // 20 seconds

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-mark messages as read when viewing them
  useEffect(() => {
    const activeMessages: MessageDto[] =
      activeTab === "department"
        ? deptMessages
        : activeTab === "project" && selectedProjectId
        ? projectMessages[selectedProjectId] ?? []
        : activeTab === "personal" && selectedPerson
        ? personalMessages.filter(
            (m) =>
              m.senderId === selectedPerson.id ||
              m.receiverId === selectedPerson.id
          )
        : [];

    if (activeMessages.length > 0) {
      // Small delay to ensure messages are visible
      const timer = setTimeout(() => {
        void autoMarkMessagesAsRead(activeMessages);
      }, 1000); // 1 second delay

      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    activeTab,
    deptMessages,
    projectMessages,
    personalMessages,
    selectedProjectId,
    selectedPerson,
  ]);

  async function refreshUnread() {
    try {
      const counts = await messageService.getUnreadCount();
      console.log("📊 Unread counts from backend:", counts);
      setUnreadCounts(counts);
    } catch (e) {
      console.error("❌ Failed to get unread counts:", e);
    }
  }

  async function refreshDepartment() {
    setDeptLoading(true);
    try {
      const msgs = await messageService.getDepartmentMessages();
      setDeptMessages(msgs);
      await refreshUnread();
    } catch (e: unknown) {
      const errorMsg =
        e instanceof Error ? e.message : "Failed to load department messages";
      toast.error(errorMsg);
    } finally {
      setDeptLoading(false);
    }
  }

  async function refreshProjects() {
    // Use currentUserId if employeeId is not available
    const identifier = currentEmployeeId || currentUserId;
    if (!identifier) {
      return;
    }
    setProjectsLoading(true);
    try {
      const res = await projectAssignmentService.getUserProjects(identifier);
      if (res.success && Array.isArray(res.data)) {
        const mapped = (res.data as Array<Record<string, unknown>>)
          .map((p) => {
            const pid = p.projectId ?? p.ProjectId;
            if (!pid) return null;
            return {
              projectId: Number(pid),
              projectName: (p.projectName ??
                p.ProjectName ??
                `Project #${pid}`) as string,
            };
          })
          .filter(Boolean) as { projectId: number; projectName: string }[];
        setProjectList(mapped);
        if (!selectedProjectId && mapped.length)
          setSelectedProjectId(mapped[0].projectId);
      }
      await refreshUnread();
    } catch (e: unknown) {
      const errorMsg =
        e instanceof Error ? e.message : "Failed to load projects";
      toast.error(errorMsg);
    } finally {
      setProjectsLoading(false);
    }
  }

  async function loadProjectChat(projectId: number) {
    setProjectLoading(true);
    try {
      const msgs = await messageService.getProjectMessagesById(projectId);
      setProjectMessages((prev) => ({ ...prev, [projectId]: msgs }));
      await refreshUnread();
    } catch (e: unknown) {
      const errorMsg =
        e instanceof Error ? e.message : "Failed to load project chat";
      toast.error(errorMsg);
    } finally {
      setProjectLoading(false);
    }
  }

  async function loadAllProjectMessages() {
    try {
      // Load all project messages to calculate unread counts for each project
      const allProjectMsgs = await messageService.getProjectMessages();

      // Group messages by projectId
      const groupedMessages: Record<number, MessageDto[]> = {};
      allProjectMsgs.forEach((msg) => {
        if (msg.projectId) {
          if (!groupedMessages[msg.projectId]) {
            groupedMessages[msg.projectId] = [];
          }
          groupedMessages[msg.projectId].push(msg);
        }
      });

      console.log("📊 Loaded project messages:", groupedMessages);
      setProjectMessages(groupedMessages);
      await refreshUnread();
    } catch (e: unknown) {
      const errorMsg =
        e instanceof Error ? e.message : "Failed to load project messages";
      console.error("Failed to load all project messages:", errorMsg);
      // Don't show toast error for this background operation
    }
  }

  async function refreshInbox() {
    setInboxLoading(true);
    try {
      const msgs = await messageService.getPersonalMessages();
      setPersonalMessages(msgs);
      await refreshUnread();
    } catch (e: unknown) {
      const errorMsg = e instanceof Error ? e.message : "Failed to load inbox";
      toast.error(errorMsg);
    } finally {
      setInboxLoading(false);
    }
  }

  async function loadDirectory() {
    try {
      const res = await userService.getAllUsers();

      // Unwrap the response if it's wrapped in {success, data}
      const resData = res as unknown;
      const usersArray = Array.isArray(res)
        ? res
        : (resData as Record<string, unknown>)?.data ?? [];

      if (Array.isArray(usersArray)) {
        const mapped = (usersArray as Array<Record<string, unknown>>)
          .map((u) => ({
            id: (u.id ?? u.Id ?? "") as string,
            employeeId: (u.employeeId ?? u.EmployeeId ?? "") as string,
            name: (u.fullName ??
              u.FullName ??
              u.userName ??
              u.username ??
              u.email ??
              "User") as string,
          }))
          .filter((x) => x.id);
        setPeople(mapped);
      }
    } catch (e) {
      // ignore
    }
  }

  async function loadProjectMembers(projectId: number) {
    try {
      const members = await messageService.getProjectMembers(projectId);
      setProjectMembers(members);
      setShowMembersModal(true);
    } catch (e: unknown) {
      const errorMsg =
        e instanceof Error ? e.message : "Failed to load project members";
      toast.error(errorMsg);
    }
  }

  const projectThreads = useMemo(() => {
    const msgs = selectedProjectId
      ? projectMessages[selectedProjectId] ?? []
      : [];
    return msgs;
  }, [projectMessages, selectedProjectId]);

  const personalThreads = useMemo(() => {
    // group by counterpart userId
    const grouped = new Map<string, MessageDto[]>();
    personalMessages.forEach((m) => {
      const other =
        m.senderId === currentUserId ? m.receiverId ?? "" : m.senderId;
      if (!other) return;
      const list = grouped.get(other) ?? [];
      list.push(m);
      grouped.set(other, list);
    });
    return Array.from(grouped.entries())
      .map(([userId, messages]) => {
        const last = messages[messages.length - 1];
        const counterpart = messages.find((x) => x.senderId === userId);
        const unreadCount = messages.filter(
          (x) => !x.isRead && x.receiverId === currentUserId
        ).length;
        return {
          userId,
          displayName: counterpart?.senderName ?? "User",
          employeeId: counterpart?.employeeId,
          messages,
          unreadCount,
          lastMessage: last,
        };
      })
      .sort((a, b) => {
        // Sort by unread first, then by most recent message
        if (a.unreadCount !== b.unreadCount) {
          return b.unreadCount - a.unreadCount; // Unread first
        }
        const at = a.lastMessage
          ? new Date(a.lastMessage.timeSent).getTime()
          : 0;
        const bt = b.lastMessage
          ? new Date(b.lastMessage.timeSent).getTime()
          : 0;
        return bt - at;
      });
  }, [personalMessages, currentUserId]);

  // Filter and sort projects based on search and unread status
  const filteredProjects = useMemo(() => {
    let projects = projectList;

    // Filter by search if there's a search term
    if (projectsSearch.trim()) {
      projects = projectList.filter((p) =>
        p.projectName.toLowerCase().includes(projectsSearch.toLowerCase())
      );
    }

    // Sort projects: unread first, then by most recent activity
    return projects.sort((a, b) => {
      const aMessages = projectMessages[a.projectId] ?? [];
      const bMessages = projectMessages[b.projectId] ?? [];

      const aUnread = aMessages.filter(
        (m) => !m.isRead && m.senderId !== currentUserId
      ).length;

      const bUnread = bMessages.filter(
        (m) => !m.isRead && m.senderId !== currentUserId
      ).length;

      // First sort by unread count (unread first)
      if (aUnread !== bUnread) {
        return bUnread - aUnread;
      }

      // Then sort by most recent message
      const aLastMessage = aMessages[aMessages.length - 1];
      const bLastMessage = bMessages[bMessages.length - 1];

      if (aLastMessage && bLastMessage) {
        const aTime = new Date(aLastMessage.timeSent).getTime();
        const bTime = new Date(bLastMessage.timeSent).getTime();
        return bTime - aTime;
      }

      // If one has messages and the other doesn't, prioritize the one with messages
      if (aLastMessage && !bLastMessage) return -1;
      if (!aLastMessage && bLastMessage) return 1;

      // Finally, sort alphabetically by project name
      return a.projectName.localeCompare(b.projectName);
    });
  }, [projectList, projectsSearch, projectMessages, currentUserId]);

  // Unread counts now come from backend API (unreadCounts state)
  // No need to calculate department/project counts locally anymore

  async function handleSend(content: string) {
    try {
      let attachmentId: string | undefined;

      // Upload file first if attached
      if (selectedFile) {
        // Determine entity type and ID for attachment
        let entityType = "Message";
        let entityId = "0"; // Temporary ID for new messages

        if (activeTab === "project" && selectedProjectId) {
          entityType = "Project";
          entityId = selectedProjectId.toString();
        }

        // Upload using attachment service
        const uploadedAttachment = await attachmentService.uploadFile(
          selectedFile,
          entityType,
          entityId,
          3 // Communication category = 3 (for chat messages)
        );

        attachmentId =
          uploadedAttachment.id ||
          (uploadedAttachment as unknown as { Id: string }).Id;
        console.log("📎 File uploaded successfully:", attachmentId);
      }

      const payload: CreateMessageDto = {
        content: content || "(File attachment)",
        messageType: MessageType.Department,
        attachmentId,
      };

      if (activeTab === "project") {
        if (!selectedProjectId) return toast.info("Pick a project first.");
        payload.messageType = MessageType.Project;
        payload.projectId = selectedProjectId;
      } else if (activeTab === "personal") {
        const empId = selectedPerson?.employeeId;
        if (!empId) return toast.info("Select a person to message.");
        payload.messageType = MessageType.Personal;
        payload.receiverId = empId; // EmployeeId per backend
      } else {
        payload.messageType = MessageType.Department;
      }

      const sent = await messageService.sendMessage(payload);

      // merge into state
      if (payload.messageType === MessageType.Department)
        setDeptMessages((prev) => [...prev, sent]);
      if (payload.messageType === MessageType.Project && payload.projectId)
        setProjectMessages((prev) => ({
          ...prev,
          [payload.projectId!]: [...(prev[payload.projectId!] ?? []), sent],
        }));
      if (payload.messageType === MessageType.Personal)
        setPersonalMessages((prev) => [...prev, sent]);

      await refreshUnread();

      // Refresh project messages if it's a project message
      if (payload.messageType === MessageType.Project) {
        await loadAllProjectMessages();
      }

      toast.success("Message sent!");
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("Failed to send message");
    }
  }

  function isLoadingForActive(messages: MessageDto[], loadingFlag: boolean) {
    return loadingFlag && messages.length === 0;
  }

  const activeMessages: MessageDto[] = useMemo(() => {
    if (activeTab === "department") return deptMessages;
    if (activeTab === "project") return projectThreads;
    if (activeTab === "personal")
      return selectedPerson
        ? personalMessages.filter(
            (m) =>
              m.senderId === selectedPerson.id ||
              m.receiverId === selectedPerson.id
          )
        : [];
    return [];
  }, [
    activeTab,
    deptMessages,
    projectThreads,
    personalMessages,
    selectedPerson,
  ]);

  // Actions for edit/delete/mark-read
  async function onEditMessage(message: MessageDto) {
    try {
      const newContent = editText.trim();
      if (!newContent) return;
      await messageService.editMessage({
        messageId: message.messageId,
        newContent,
      });
      const updated: MessageDto = {
        ...message,
        content: newContent,
        timeEdited: new Date().toISOString(),
      };
      // Update locally
      if (updated.messageType === MessageType.Department) {
        setDeptMessages((prev) =>
          prev.map((m) => (m.messageId === updated.messageId ? updated : m))
        );
      } else if (
        updated.messageType === MessageType.Project &&
        updated.projectId
      ) {
        setProjectMessages((prev) => ({
          ...prev,
          [updated.projectId!]: (prev[updated.projectId!] ?? []).map((m) =>
            m.messageId === updated.messageId ? updated : m
          ),
        }));
      } else if (updated.messageType === MessageType.Personal) {
        setPersonalMessages((prev) =>
          prev.map((m) => (m.messageId === updated.messageId ? updated : m))
        );
      }
      setEditingId(null);
      setEditText("");
      toast.success("Message updated");
    } catch (e: unknown) {
      const errorMsg =
        e instanceof Error ? e.message : "Failed to edit message";
      toast.error(errorMsg);
    }
  }

  async function confirmDeleteMessage(messageId: number) {
    const message = [
      ...deptMessages,
      ...Object.values(projectMessages).flat(),
      ...personalMessages,
    ].find((m) => m.messageId === messageId);

    if (!message) return;

    try {
      await messageService.deleteMessage(messageId);
      if (message.messageType === MessageType.Department) {
        setDeptMessages((prev) =>
          prev.filter((m) => m.messageId !== messageId)
        );
      } else if (
        message.messageType === MessageType.Project &&
        message.projectId
      ) {
        setProjectMessages((prev) => ({
          ...prev,
          [message.projectId!]: (prev[message.projectId!] ?? []).filter(
            (m) => m.messageId !== messageId
          ),
        }));
      } else if (message.messageType === MessageType.Personal) {
        setPersonalMessages((prev) =>
          prev.filter((m) => m.messageId !== messageId)
        );
      }
      await refreshUnread();
      setDeleteConfirmId(null);
      toast.success("Message deleted");
    } catch (e: unknown) {
      const errorMsg =
        e instanceof Error ? e.message : "Failed to delete message";
      toast.error(errorMsg);
    }
  }

  async function onMarkRead(message: MessageDto) {
    try {
      if (message.messageType === MessageType.Personal) {
        await messageService.markMessageAsRead(message.messageId);
      } else {
        await messageService.markGroupMessageAsRead(message.messageId);
      }
      const updated: MessageDto = { ...message, isRead: true };
      if (updated.messageType === MessageType.Department) {
        setDeptMessages((prev) =>
          prev.map((m) => (m.messageId === updated.messageId ? updated : m))
        );
      } else if (
        updated.messageType === MessageType.Project &&
        updated.projectId
      ) {
        setProjectMessages((prev) => ({
          ...prev,
          [updated.projectId!]: (prev[updated.projectId!] ?? []).map((m) =>
            m.messageId === updated.messageId ? updated : m
          ),
        }));
      } else if (updated.messageType === MessageType.Personal) {
        setPersonalMessages((prev) =>
          prev.map((m) => (m.messageId === updated.messageId ? updated : m))
        );
      }
      await refreshUnread();
    } catch (e: unknown) {
      const errorMsg =
        e instanceof Error ? e.message : "Failed to mark as read";
      toast.error(errorMsg);
    }
  }

  // Auto-mark all unread messages as read when viewing them
  async function autoMarkMessagesAsRead(messages: MessageDto[]) {
    const unreadMessages = messages.filter(
      (m) => !m.isRead && m.senderId !== currentUserId
    );

    if (unreadMessages.length === 0) return;

    console.log(`📖 Auto-marking ${unreadMessages.length} messages as read`);

    // Mark each unread message
    for (const message of unreadMessages) {
      try {
        if (message.messageType === MessageType.Personal) {
          await messageService.markMessageAsRead(message.messageId);
        } else {
          await messageService.markGroupMessageAsRead(message.messageId);
        }
      } catch (e) {
        console.error("Failed to mark message as read:", e);
      }
    }

    // Update local state
    if (activeTab === "department") {
      setDeptMessages((prev) =>
        prev.map((m) =>
          m.senderId !== currentUserId ? { ...m, isRead: true } : m
        )
      );
    } else if (activeTab === "project") {
      setProjectMessages((prev) => {
        const updated = { ...prev };
        Object.keys(updated).forEach((projectId) => {
          updated[Number(projectId)] = updated[Number(projectId)].map((m) =>
            m.senderId !== currentUserId ? { ...m, isRead: true } : m
          );
        });
        return updated;
      });
    } else if (activeTab === "personal") {
      setPersonalMessages((prev) =>
        prev.map((m) =>
          m.senderId !== currentUserId ? { ...m, isRead: true } : m
        )
      );
    }

    await refreshUnread();
  }

  return (
    <div
      className={`h-fit  ${
        darkMode ? "bg-zinc-900 text-zinc-100" : "bg-gray-100 text-gray-900"
      }`}
    >
      <div className="mx-auto max-w-6xl px-4 pt-0 flex flex-col gap-1 h-fit">
        <header>
          <h1 className="text-xl font-semibold">Team Chat</h1>
        </header>

        <div
          className={`rounded-xl shadow-xl overflow-hidden flex flex-col ${
            darkMode ? "bg-zinc-800" : "bg-white"
          }`}
          style={{ height: "calc(100vh - 120px)" }}
        >
          <div
            className={`flex border-b ${
              darkMode ? "border-zinc-700" : "border-gray-200"
            }`}
          >
            {(["department", "project", "personal"] as ChatTab[]).map((t) => {
              // Use backend API counts for real-time updates
              const unreadCount =
                t === "department"
                  ? unreadCounts.departmentUnread
                  : t === "project"
                  ? unreadCounts.projectUnread
                  : unreadCounts.personalUnread;

              console.log(`🏷️ ${t} tab unread count:`, unreadCount);
              console.log(`🏷️ Full unreadCounts state:`, unreadCounts);

              return (
                <button
                  aria-label={`Switch to ${t} chat${
                    unreadCount > 0 ? ` (${unreadCount} unread)` : ""
                  }`}
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className={`flex-1 py-3 text-sm flex items-center justify-center gap-2 ${
                    activeTab === t
                      ? darkMode
                        ? "bg-purple-600 text-white"
                        : "bg-purple-100 text-purple-900"
                      : darkMode
                      ? "text-gray-300 hover:bg-zinc-700"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {t === "department" ? (
                    <Building2 aria-hidden className="h-4 w-4" />
                  ) : (
                    <Users aria-hidden className="h-4 w-4" />
                  )}
                  <span>{t.charAt(0).toUpperCase() + t.slice(1)}</span>
                  {unreadCount > 0 && (
                    <span
                      className={`inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold ${
                        activeTab === t
                          ? darkMode
                            ? "bg-white text-purple-600"
                            : "bg-purple-600 text-white"
                          : darkMode
                          ? "bg-red-500 text-white"
                          : "bg-red-500 text-white"
                      }`}
                    >
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </button>
              );
            })}
            <button
              aria-label="Refresh messages"
              onClick={() => {
                if (activeTab === "department") void refreshDepartment();
                if (activeTab === "project") void loadAllProjectMessages();
                if (activeTab === "personal") void refreshInbox();
              }}
              className={`px-3 ${darkMode ? "text-gray-200" : "text-gray-700"}`}
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>

          <div className="flex md:flex-row flex-col flex-1 overflow-hidden">
            {/* Left column */}
            <aside
              className={`md:w-72 w-full border-b md:border-b-0 md:border-r flex flex-col ${
                darkMode ? "border-zinc-700" : "border-gray-200"
              }`}
            >
              {/* Fixed header section - doesn't scroll */}
              <div className="flex-shrink-0 p-3 border-b border-gray-200 dark:border-zinc-700">
                {activeTab === "project" && (
                  <div className="space-y-3">
                    <input
                      value={projectsSearch}
                      onChange={(e) => setProjectsSearch(e.target.value)}
                      placeholder="Search projects..."
                      className={`w-full text-xs rounded-lg px-3 py-2 border ${
                        darkMode
                          ? "border-zinc-700 bg-zinc-800 text-gray-100"
                          : "border-gray-300 bg-white"
                      }`}
                    />

                    {selectedProjectId && (
                      <button
                        onClick={() => loadProjectMembers(selectedProjectId)}
                        aria-label="View project members"
                        title="View project members"
                        className={`w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium rounded-lg border ${
                          darkMode
                            ? "border-purple-500/50 bg-purple-900/20 text-purple-300 hover:bg-purple-900/40"
                            : "border-purple-300 bg-purple-50 text-purple-700 hover:bg-purple-100"
                        }`}
                      >
                        <UserCircle className="h-4 w-4" />
                        Members
                      </button>
                    )}
                  </div>
                )}

                {activeTab === "personal" && (
                  <input
                    value={peopleSearch}
                    onChange={(e) => setPeopleSearch(e.target.value)}
                    placeholder="Search people..."
                    className={`w-full text-xs rounded-lg px-3 py-2 border ${
                      darkMode
                        ? "border-zinc-700 bg-zinc-800 text-gray-100"
                        : "border-gray-300 bg-white"
                    }`}
                  />
                )}
              </div>

              {/* Scrollable content section */}
              <div className="flex-1 overflow-y-auto p-3">
                {activeTab === "project" && (
                  <div className="space-y-3">
                    {projectsLoading && projectList.length === 0 ? (
                      <div className="text-sm opacity-75 flex items-center">
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />{" "}
                        Loading projects...
                      </div>
                    ) : null}
                    {projectsSearch.trim() === "" ? (
                      <div className="space-y-3">
                        {/* Unread Projects */}
                        {filteredProjects.filter((p) => {
                          const projectMsgs =
                            projectMessages[p.projectId] ?? [];
                          return (
                            projectMsgs.filter(
                              (m) => !m.isRead && m.senderId !== currentUserId
                            ).length > 0
                          );
                        }).length > 0 && (
                          <div>
                            <p className="text-xs font-semibold opacity-60 mb-2">
                              Unread Messages
                            </p>
                            <ul className="space-y-1">
                              {filteredProjects
                                .filter((p) => {
                                  const projectMsgs =
                                    projectMessages[p.projectId] ?? [];
                                  return (
                                    projectMsgs.filter(
                                      (m) =>
                                        !m.isRead &&
                                        m.senderId !== currentUserId
                                    ).length > 0
                                  );
                                })
                                .map((p) => {
                                  const projectMsgs =
                                    projectMessages[p.projectId] ?? [];
                                  const projectUnread = projectMsgs.filter(
                                    (m) =>
                                      !m.isRead && m.senderId !== currentUserId
                                  ).length;
                                  const lastMessage =
                                    projectMsgs[projectMsgs.length - 1];

                                  return (
                                    <li key={p.projectId}>
                                      <button
                                        aria-label={`Select project ${p.projectName} (${projectUnread} unread)`}
                                        className={`w-full text-left rounded-lg px-3 py-2 text-xs border ${
                                          selectedProjectId === p.projectId
                                            ? darkMode
                                              ? "border-purple-500 bg-purple-900/30"
                                              : "border-purple-300 bg-purple-50"
                                            : darkMode
                                            ? "border-transparent hover:bg-zinc-700"
                                            : "border-transparent hover:bg-purple-50/70"
                                        }`}
                                        onClick={async () => {
                                          setSelectedProjectId(p.projectId);
                                          // Messages are already loaded by loadAllProjectMessages()
                                          // Only load if not already loaded (fallback)
                                          if (!projectMessages[p.projectId]) {
                                            await loadProjectChat(p.projectId);
                                          }
                                          await refreshUnread();
                                        }}
                                      >
                                        <div className="flex items-center justify-between">
                                          <span className="font-semibold">
                                            {p.projectName}
                                          </span>
                                          <span
                                            className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                                              darkMode
                                                ? "bg-red-500 text-white"
                                                : "bg-red-500 text-white"
                                            }`}
                                          >
                                            {projectUnread > 9
                                              ? "9+"
                                              : projectUnread}
                                          </span>
                                        </div>
                                        {lastMessage && (
                                          <p className="mt-1 text-[11px] opacity-70 truncate">
                                            {lastMessage.content}
                                          </p>
                                        )}
                                      </button>
                                    </li>
                                  );
                                })}
                            </ul>
                          </div>
                        )}

                        {/* Recent Projects */}
                        {filteredProjects.filter((p) => {
                          const projectMsgs =
                            projectMessages[p.projectId] ?? [];
                          const projectUnread = projectMsgs.filter(
                            (m) => !m.isRead && m.senderId !== currentUserId
                          ).length;
                          return projectUnread === 0 && projectMsgs.length > 0;
                        }).length > 0 && (
                          <div>
                            <p className="text-xs font-semibold opacity-60 mb-2">
                              Recent Projects
                            </p>
                            <ul className="space-y-1">
                              {filteredProjects
                                .filter((p) => {
                                  const projectMsgs =
                                    projectMessages[p.projectId] ?? [];
                                  const projectUnread = projectMsgs.filter(
                                    (m) =>
                                      !m.isRead && m.senderId !== currentUserId
                                  ).length;
                                  return (
                                    projectUnread === 0 &&
                                    projectMsgs.length > 0
                                  );
                                })
                                .map((p) => {
                                  const projectMsgs =
                                    projectMessages[p.projectId] ?? [];
                                  const lastMessage =
                                    projectMsgs[projectMsgs.length - 1];

                                  return (
                                    <li key={p.projectId}>
                                      <button
                                        aria-label={`Select project ${p.projectName}`}
                                        className={`w-full text-left rounded-lg px-3 py-2 text-xs border ${
                                          selectedProjectId === p.projectId
                                            ? darkMode
                                              ? "border-purple-500 bg-purple-900/30"
                                              : "border-purple-300 bg-purple-50"
                                            : darkMode
                                            ? "border-transparent hover:bg-zinc-700"
                                            : "border-transparent hover:bg-purple-50/70"
                                        }`}
                                        onClick={async () => {
                                          setSelectedProjectId(p.projectId);
                                          // Messages are already loaded by loadAllProjectMessages()
                                          // Only load if not already loaded (fallback)
                                          if (!projectMessages[p.projectId]) {
                                            await loadProjectChat(p.projectId);
                                          }
                                          await refreshUnread();
                                        }}
                                      >
                                        <span className="font-semibold">
                                          {p.projectName}
                                        </span>
                                        {lastMessage && (
                                          <p className="mt-1 text-[11px] opacity-70 truncate">
                                            {lastMessage.content}
                                          </p>
                                        )}
                                      </button>
                                    </li>
                                  );
                                })}
                            </ul>
                          </div>
                        )}

                        {/* Show message when no projects have messages */}
                        {filteredProjects.every((p) => {
                          const projectMsgs =
                            projectMessages[p.projectId] ?? [];
                          return projectMsgs.length === 0;
                        }) && (
                          <div className="text-center py-8">
                            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-xs opacity-60">
                              No project messages yet. Start a conversation!
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      // Show search results when searching
                      <ul className="space-y-2">
                        {filteredProjects.map((p) => {
                          const projectMsgs =
                            projectMessages[p.projectId] ?? [];
                          const projectUnread = projectMsgs.filter(
                            (m) => !m.isRead && m.senderId !== currentUserId
                          ).length;

                          return (
                            <li key={p.projectId}>
                              <button
                                aria-label={`Select project ${p.projectName}${
                                  projectUnread > 0
                                    ? ` (${projectUnread} unread)`
                                    : ""
                                }`}
                                className={`w-full text-left rounded-lg px-3 py-2 border ${
                                  selectedProjectId === p.projectId
                                    ? darkMode
                                      ? "border-purple-500 bg-purple-900/30"
                                      : "border-purple-300 bg-purple-50"
                                    : darkMode
                                    ? "border-transparent hover:bg-zinc-800"
                                    : "border-transparent hover:bg-purple-50/70"
                                }`}
                                onClick={async () => {
                                  setSelectedProjectId(p.projectId);
                                  // Messages are already loaded by loadAllProjectMessages()
                                  // Only load if not already loaded (fallback)
                                  if (!projectMessages[p.projectId]) {
                                    await loadProjectChat(p.projectId);
                                  }
                                  await refreshUnread();
                                }}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-medium">
                                    {p.projectName}
                                  </span>
                                  {projectUnread > 0 && (
                                    <span
                                      className={`inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold ${
                                        darkMode
                                          ? "bg-red-500 text-white"
                                          : "bg-red-500 text-white"
                                      }`}
                                    >
                                      {projectUnread}
                                    </span>
                                  )}
                                </div>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                )}

                {activeTab === "personal" && (
                  <div className="space-y-3">
                    {/* Show search results when searching */}
                    {peopleSearch.trim() !== "" && (
                      <div className="space-y-1">
                        <p className="text-xs font-semibold opacity-60 mb-2">
                          Search Results
                        </p>
                        {people
                          .filter(
                            (p) =>
                              p.name
                                .toLowerCase()
                                .includes(peopleSearch.toLowerCase()) ||
                              p.employeeId
                                .toLowerCase()
                                .includes(peopleSearch.toLowerCase())
                          )
                          .map((p) => (
                            <button
                              aria-label={`Start DM with ${p.name}`}
                              title={`Start DM with ${p.name}`}
                              key={p.id}
                              className={`w-full text-left rounded-lg px-3 py-2 text-xs border ${
                                selectedPerson?.id === p.id
                                  ? darkMode
                                    ? "border-purple-500 bg-purple-900/30"
                                    : "border-purple-300 bg-purple-50"
                                  : darkMode
                                  ? "border-transparent hover:bg-zinc-700"
                                  : "border-transparent hover:bg-purple-50"
                              }`}
                              onClick={async () => {
                                setSelectedPerson(p);
                                setPeopleSearch(""); // Clear search after selection
                                await refreshUnread();
                              }}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-semibold">{p.name}</span>
                                <span className="text-xs opacity-60">
                                  {p.employeeId ? `ID: ${p.employeeId}` : ""}
                                </span>
                              </div>
                            </button>
                          ))}
                      </div>
                    )}

                    {/* Show conversation list when not searching - only unread and previous chats */}
                    {peopleSearch.trim() === "" && (
                      <div className="space-y-3">
                        {/* Unread conversations */}
                        {personalThreads.filter((t) => t.unreadCount > 0)
                          .length > 0 && (
                          <div>
                            <p className="text-xs font-semibold opacity-60 mb-2">
                              Unread Messages
                            </p>
                            <ul className="space-y-1">
                              {personalThreads
                                .filter((t) => t.unreadCount > 0)
                                .map((thread) => (
                                  <li key={thread.userId}>
                                    <button
                                      aria-label={`Chat with ${thread.displayName} (${thread.unreadCount} unread)`}
                                      className={`w-full text-left rounded-lg px-3 py-2 text-xs border ${
                                        selectedPerson?.id === thread.userId
                                          ? darkMode
                                            ? "border-purple-500 bg-purple-900/30"
                                            : "border-purple-300 bg-purple-50"
                                          : darkMode
                                          ? "border-transparent hover:bg-zinc-700"
                                          : "border-transparent hover:bg-purple-50/70"
                                      }`}
                                      onClick={async () => {
                                        setSelectedPerson({
                                          id: thread.userId,
                                          employeeId: thread.employeeId ?? "",
                                          name: thread.displayName,
                                        });
                                        await refreshUnread();
                                      }}
                                    >
                                      <div className="flex items-center justify-between">
                                        <span className="font-semibold">
                                          {thread.displayName}
                                        </span>
                                        <span
                                          className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                                            darkMode
                                              ? "bg-red-500 text-white"
                                              : "bg-red-500 text-white"
                                          }`}
                                        >
                                          {thread.unreadCount > 9
                                            ? "9+"
                                            : thread.unreadCount}
                                        </span>
                                      </div>
                                      {thread.lastMessage && (
                                        <p className="mt-1 text-[11px] opacity-70 truncate">
                                          {thread.lastMessage.content}
                                        </p>
                                      )}
                                    </button>
                                  </li>
                                ))}
                            </ul>
                          </div>
                        )}

                        {/* Recent conversations - only show users we've chatted with before */}
                        {personalThreads.filter((t) => t.unreadCount === 0)
                          .length > 0 && (
                          <div>
                            <p className="text-xs font-semibold opacity-60 mb-2">
                              Recent Chats
                            </p>
                            <ul className="space-y-1">
                              {personalThreads
                                .filter((t) => t.unreadCount === 0)
                                .map((thread) => (
                                  <li key={thread.userId}>
                                    <button
                                      aria-label={`Chat with ${thread.displayName}`}
                                      className={`w-full text-left rounded-lg px-3 py-2 text-xs border ${
                                        selectedPerson?.id === thread.userId
                                          ? darkMode
                                            ? "border-purple-500 bg-purple-900/30"
                                            : "border-purple-300 bg-purple-50"
                                          : darkMode
                                          ? "border-transparent hover:bg-zinc-700"
                                          : "border-transparent hover:bg-purple-50/70"
                                      }`}
                                      onClick={async () => {
                                        setSelectedPerson({
                                          id: thread.userId,
                                          employeeId: thread.employeeId ?? "",
                                          name: thread.displayName,
                                        });
                                        await refreshUnread();
                                      }}
                                    >
                                      <span className="font-semibold">
                                        {thread.displayName}
                                      </span>
                                      {thread.lastMessage && (
                                        <p className="mt-1 text-[11px] opacity-70 truncate">
                                          {thread.lastMessage.content}
                                        </p>
                                      )}
                                    </button>
                                  </li>
                                ))}
                            </ul>
                          </div>
                        )}

                        {/* Show message when no conversations exist */}
                        {personalThreads.length === 0 && (
                          <div className="text-center py-8">
                            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-xs opacity-60">
                              No conversations yet. Search for someone to start
                              chatting!
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </aside>

            {/* Right column - messages */}
            <section className="flex-1 flex flex-col">
              <div className="flex-1 overflow-y-auto px-4 py-4">
                {isLoadingForActive(
                  activeMessages,
                  activeTab === "department"
                    ? deptLoading
                    : activeTab === "project"
                    ? projectLoading
                    : inboxLoading
                ) ? (
                  <div className="flex h-64 items-center justify-center text-sm opacity-75">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading
                    messages...
                  </div>
                ) : null}

                {!(activeTab === "department"
                  ? deptLoading
                  : activeTab === "project"
                  ? projectLoading
                  : inboxLoading) &&
                  activeMessages.length === 0 && (
                    <div className="flex h-64 items-center justify-center text-sm opacity-75">
                      <MessageSquare className="h-6 w-6 mr-2" /> No messages yet
                    </div>
                  )}

                {activeMessages.map((m) => {
                  const isOwn = m.senderId === currentUserId;
                  return (
                    <div
                      key={m.messageId}
                      className={`flex ${
                        isOwn ? "justify-end" : "justify-start"
                      } mb-3`}
                    >
                      <div
                        className={`max-w-lg rounded-2xl px-4 py-3 shadow ${
                          isOwn
                            ? darkMode
                              ? "bg-purple-500/50 text-gray-900"
                              : "bg-purple-300/80 text-gray-900"
                            : darkMode
                            ? "bg-zinc-700 text-gray-100"
                            : "bg-gray-100 text-gray-900"
                        }`}
                      >
                        <div className="text-[11px] opacity-70 flex items-center gap-2">
                          {!isOwn && (
                            <span className="font-semibold">
                              {m.senderName}
                            </span>
                          )}
                          <span>
                            {(() => {
                              try {
                                // Show actual time (e.g., "10:30 AM")
                                const sentDate = new Date(m.timeSent);
                                return format(sentDate, "h:mm a");
                              } catch (err) {
                                return m.timeSent;
                              }
                            })()}
                          </span>
                          {m.timeEdited && <span>• Edited</span>}
                        </div>
                        <div className="mt-2 text-sm whitespace-pre-line">
                          {editingId === m.messageId ? (
                            <div className="space-y-2">
                              <input
                                type="text"
                                className={`w-full px-2 py-1 text-sm bg-transparent focus:outline-none ${
                                  isOwn
                                    ? "text-gray-900 placeholder-gray-500"
                                    : darkMode
                                    ? "text-gray-100 placeholder-zinc-400"
                                    : "text-gray-900 placeholder-gray-400"
                                }`}
                                style={{
                                  border: "none",
                                  borderBottom: isOwn
                                    ? darkMode
                                      ? "2px solid rgba(216, 180, 254, 0.3)"
                                      : "2px solid rgba(216, 180, 254, 0.4)"
                                    : darkMode
                                    ? "2px solid rgba(161, 161, 170, 0.3)"
                                    : "2px solid rgba(156, 163, 175, 0.3)",
                                }}
                                aria-label="Edit message content"
                                placeholder="Edit message..."
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                autoFocus
                              />
                              <div className="flex gap-2">
                                <button
                                  aria-label="Save edit"
                                  title="Save changes"
                                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
                                    darkMode
                                      ? "bg-green-600 text-white hover:bg-green-500"
                                      : "bg-green-600 text-white hover:bg-green-500"
                                  }`}
                                  onClick={() => onEditMessage(m)}
                                  disabled={!editText.trim()}
                                >
                                  <Check className="h-3 w-3" />
                                  Save
                                </button>
                                <button
                                  aria-label="Cancel edit"
                                  title="Cancel editing"
                                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
                                    darkMode
                                      ? "bg-zinc-600 text-gray-100 hover:bg-zinc-500"
                                      : "bg-gray-300 text-gray-700 hover:bg-gray-400"
                                  }`}
                                  onClick={() => {
                                    setEditingId(null);
                                    setEditText("");
                                  }}
                                >
                                  <X className="h-3 w-3" />
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              {m.content}
                              {m.attachment && (
                                <div
                                  className={`mt-2 p-2 rounded-lg border flex items-center gap-2 ${
                                    darkMode
                                      ? "bg-zinc-800 border-zinc-600"
                                      : "bg-white border-gray-300"
                                  }`}
                                >
                                  <Paperclip className="h-4 w-4" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium truncate">
                                      {m.attachment.fileName}
                                    </p>
                                    <p className="text-[10px] opacity-60">
                                      {(m.attachment.fileSize / 1024).toFixed(
                                        1
                                      )}{" "}
                                      KB
                                    </p>
                                  </div>
                                  <button
                                    onClick={async () => {
                                      try {
                                        await attachmentService.downloadFile(
                                          m.attachment!.id
                                        );
                                      } catch (error) {
                                        console.error(
                                          "Download failed:",
                                          error
                                        );
                                        toast.error("Failed to download file");
                                      }
                                    }}
                                    className={`text-xs px-2 py-1 rounded ${
                                      darkMode
                                        ? "bg-purple-600 hover:bg-purple-500 text-white"
                                        : "bg-purple-600 hover:bg-purple-500 text-white"
                                    }`}
                                    aria-label="Download attachment"
                                  >
                                    Download
                                  </button>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                        <div className="mt-2 flex gap-2">
                          {!isOwn && !m.isRead && (
                            <button
                              aria-label="Mark as read"
                              title="Mark as read"
                              onClick={() => onMarkRead(m)}
                              className={`text-xs px-2 py-1 rounded ${
                                darkMode
                                  ? "hover:bg-zinc-600"
                                  : "hover:bg-gray-200"
                              }`}
                            >
                              Mark read
                            </button>
                          )}
                          {isOwn && (
                            <>
                              <button
                                aria-label="Edit message"
                                title="Edit message"
                                onClick={() => {
                                  setEditingId(m.messageId);
                                  setEditText(m.content);
                                }}
                                className={`flex items-center gap-1 text-xs px-2 py-1 rounded transition ${
                                  darkMode
                                    ? "hover:bg-purple-700/50 text-gray-900"
                                    : "hover:bg-purple-600/20 text-gray-900"
                                }`}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button
                                aria-label="Delete message"
                                title="Delete message"
                                onClick={() => setDeleteConfirmId(m.messageId)}
                                className={`flex items-center gap-1 text-xs px-2 py-1 rounded transition ${
                                  darkMode
                                    ? "hover:bg-red-900/50 text-red-400"
                                    : "hover:bg-red-100 text-red-600"
                                }`}
                              >
                                <Trash2 className="h-3.5 w-3.5 stroke-[2.5]" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Composer */}
              <div
                className={`border-t p-4 ${
                  darkMode ? "border-zinc-700" : "border-gray-200"
                }`}
              >
                {/* File preview */}
                {selectedFile && (
                  <div
                    className={`mb-2 p-2 rounded-lg flex items-center justify-between ${
                      darkMode ? "bg-zinc-700" : "bg-gray-100"
                    }`}
                  >
                    <div className="flex items-center gap-2 text-sm">
                      <Paperclip className="h-4 w-4" />
                      <span className="truncate max-w-xs">
                        {selectedFile.name}
                      </span>
                      <span className="text-xs opacity-70">
                        ({(selectedFile.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                    <button
                      onClick={() => setSelectedFile(null)}
                      className="p-1 hover:bg-red-100 dark:hover:bg-red-900 rounded"
                      aria-label="Remove attachment"
                    >
                      <XCircle className="h-4 w-4 text-red-500" />
                    </button>
                  </div>
                )}

                <div className="flex gap-2">
                  <div className="flex-1 flex flex-col gap-2">
                    <textarea
                      className={`w-full rounded-xl px-3 py-2 text-sm border ${
                        darkMode
                          ? "border-zinc-700 bg-zinc-800 text-gray-100"
                          : "border-gray-300 bg-white"
                      }`}
                      placeholder={
                        activeTab === "department"
                          ? "Share an update with your department..."
                          : activeTab === "project"
                          ? "Message the selected project..."
                          : "Select a person or search to start a DM..."
                      }
                      value={composer}
                      onChange={(e) => setComposer(e.target.value)}
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <input
                        type="file"
                        id="chat-file-input"
                        className="hidden"
                        aria-label="Select file to attach"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setSelectedFile(file);
                          }
                        }}
                      />
                      <button
                        onClick={() =>
                          document.getElementById("chat-file-input")?.click()
                        }
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs ${
                          darkMode
                            ? "bg-zinc-700 hover:bg-zinc-600 text-gray-300"
                            : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                        }`}
                        aria-label="Attach file"
                        title="Attach file"
                      >
                        <Paperclip className="h-4 w-4" />
                        <span>Attach</span>
                      </button>
                    </div>
                  </div>
                  <button
                    aria-label="Send message"
                    title="Send message"
                    disabled={
                      (!composer.trim() && !selectedFile) ||
                      (activeTab === "project" && !selectedProjectId) ||
                      (activeTab === "personal" && !selectedPerson)
                    }
                    onClick={async () => {
                      const c = composer.trim();
                      if (!c && !selectedFile) return;
                      await handleSend(c);
                      setComposer("");
                      setSelectedFile(null);
                    }}
                    className={`h-11 px-4 rounded-xl text-sm font-semibold self-end ${
                      darkMode
                        ? "bg-purple-600 text-white hover:bg-purple-500 disabled:bg-zinc-700 disabled:text-zinc-500"
                        : "bg-purple-600 text-white hover:bg-purple-500 disabled:bg-gray-200 disabled:text-gray-400"
                    }`}
                  >
                    <Send aria-hidden className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {deleteConfirmId !== null && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={() => setDeleteConfirmId(null)}
          >
            <div
              className={`mx-4 w-full max-w-md rounded-xl p-6 shadow-2xl ${
                darkMode ? "bg-zinc-800 text-white" : "bg-white text-gray-900"
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-3">Delete Message?</h3>
              <p className="text-sm opacity-75 mb-6">
                Are you sure you want to delete this message? This action cannot
                be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    darkMode
                      ? "bg-zinc-700 hover:bg-zinc-600"
                      : "bg-gray-200 hover:bg-gray-300"
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={() => confirmDeleteMessage(deleteConfirmId)}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-500"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Project Members Modal */}
        {showMembersModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={() => setShowMembersModal(false)}
          >
            <div
              className={`mx-4 w-full max-w-md rounded-xl p-6 shadow-2xl ${
                darkMode ? "bg-zinc-800 text-white" : "bg-white text-gray-900"
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <UserCircle className="h-5 w-5" />
                Project Members
              </h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {projectMembers.map((member) => (
                  <button
                    key={member.id}
                    onClick={() => {
                      setShowMembersModal(false);
                      setActiveTab("personal");
                      setSelectedPerson({
                        id: member.id,
                        employeeId: member.employeeId,
                        name: member.fullName,
                      });
                    }}
                    className={`w-full text-left px-4 py-3 rounded-lg border transition ${
                      darkMode
                        ? "border-zinc-700 hover:bg-zinc-700"
                        : "border-gray-200 hover:bg-purple-50"
                    }`}
                  >
                    <div className="font-semibold text-sm">
                      {member.fullName}
                    </div>
                    <div className="text-xs opacity-70 mt-1">
                      {member.employeeId && `ID: ${member.employeeId} • `}
                      {member.department}
                    </div>
                    <div className="text-xs opacity-60 mt-0.5">
                      {member.email}
                    </div>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowMembersModal(false)}
                className={`mt-4 w-full px-4 py-2 rounded-lg text-sm font-medium ${
                  darkMode
                    ? "bg-zinc-700 hover:bg-zinc-600"
                    : "bg-gray-200 hover:bg-gray-300"
                }`}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
