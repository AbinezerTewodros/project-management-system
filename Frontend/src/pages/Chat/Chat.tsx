"use client";

import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import {
  Building2,
  Layers,
  Loader2,
  MessageSquare,
  RefreshCw,
  Send,
  User,
  Users,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import { useAuth } from "@/context/AuthContext";
import { useChat } from "@/hooks/useChat";
import { projectAssignmentService } from "@/services/projectAssignmentService";
import { userService } from "@/services/userService";
import {
  CreateMessageDto,
  MessageDto,
  MessageType,
} from "@/types/messageTypes";

type ChatTab = "department" | "project" | "personal";

type ConversationTab = {
  key: ChatTab;
  label: string;
  icon: ReactNode;
  badge?: number;
};

const Chat = ({ darkMode }: { darkMode: boolean }) => {
  const { user } = useAuth();
  const currentUserId = user?.id ?? null;
  const currentEmployeeId = user?.employeeId ?? "";

  const {
    departmentMessages,
    projectThreads,
    personalThreads,
    unreadCounts,
    loading,
    error,
    sendMessage,
    deleteMessage,
    markMessageAsRead,
    markGroupMessageAsRead,
    refreshMessages,
    loadProjectMessagesById,
    loadPersonalMessagesWith,
    loadDepartmentMessages,
    loadPersonalInbox,
  } = useChat({ currentUserId: currentUserId ?? undefined });

  const [activeTab, setActiveTab] = useState<ChatTab>("project");
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(
    null
  );
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<{
    id: string;
    employeeId: string;
    name: string;
  } | null>(null);
  const [messageContent, setMessageContent] = useState("");
  const [sending, setSending] = useState(false);

  // Projects the current user is part of (populates the left panel under Projects)
  const [projectList, setProjectList] = useState<
    Array<{ projectId: number; projectName: string }>
  >([]);

  // Directory for personal messaging (search + pick any teammate)
  const [people, setPeople] = useState<
    Array<{ id: string; employeeId: string; name: string }>
  >([]);
  const [peopleSearch, setPeopleSearch] = useState("");

  const processedReadIds = useRef<Set<number>>(new Set());
  const loadedProjectRef = useRef<number | null>(null);
  const loadedPersonRef = useRef<string | null>(null);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  // Load per tab (once on switch)
  const loadedTabsRef = useRef<{
    department?: boolean;
    project?: boolean;
    personal?: boolean;
  }>({});
  useEffect(() => {
    const run = async () => {
      if (activeTab === "department" && !loadedTabsRef.current.department) {
        loadedTabsRef.current.department = true;
        try {
          await loadDepartmentMessages();
        } catch (e) {
          console.error(e);
        }
      }
      if (activeTab === "personal" && !loadedTabsRef.current.personal) {
        loadedTabsRef.current.personal = true;
        try {
          await loadPersonalInbox();
        } catch (e) {
          console.error(e);
        }
      }
    };
    run();
  }, [activeTab, loadDepartmentMessages, loadPersonalInbox]);

  useEffect(() => {
    if (activeTab === "project" && selectedProjectId === null) {
      // Prefer first project from the user's project list if available; otherwise fallback to message-derived threads
      if (projectList.length > 0) {
        setSelectedProjectId(projectList[0].projectId);
      } else if (projectThreads.length > 0) {
        setSelectedProjectId(projectThreads[0].projectId);
      }
    }
  }, [activeTab, projectThreads, selectedProjectId, projectList]);

  useEffect(() => {
    if (
      activeTab === "personal" &&
      personalThreads.length > 0 &&
      selectedUserId === null
    ) {
      setSelectedUserId(personalThreads[0].userId);
    }
  }, [activeTab, personalThreads, selectedUserId]);

  // Load user's projects when switching to Projects tab (or on mount if already there)
  useEffect(() => {
    const loadProjects = async () => {
      if (!currentEmployeeId) return;
      try {
        const res = await projectAssignmentService.getUserProjects(
          currentEmployeeId
        );
        if (res.success && Array.isArray(res.data)) {
          const mapped = (
            res.data as {
              projectId?: number;
              ProjectId?: number;
              projectName?: string;
              ProjectName?: string;
            }[]
          )
            .map((p) => {
              const pid = (p.projectId ?? p.ProjectId) as number | undefined;
              if (!pid) return null;
              const pname = p.projectName ?? p.ProjectName ?? `Project #${pid}`;
              return { projectId: pid, projectName: pname } as {
                projectId: number;
                projectName: string;
              };
            })
            .filter(
              (x): x is { projectId: number; projectName: string } => x !== null
            );
          setProjectList(mapped);
          if (!selectedProjectId && mapped.length > 0) {
            setSelectedProjectId(mapped[0].projectId);
          }
        }
      } catch (err) {
        console.error("Failed to load user projects", err);
      }
    };
    if (activeTab === "project") {
      loadProjects();
    }
  }, [activeTab, currentEmployeeId, selectedProjectId]);

  // Load people directory for personal chat when switching to Personal tab
  useEffect(() => {
    const loadPeople = async () => {
      try {
        const res = await userService.getAllUsers();
        if (Array.isArray(res)) {
          const mapped = (
            res as {
              id?: string;
              Id?: string;
              employeeId?: string;
              EmployeeId?: string;
              fullName?: string;
              FullName?: string;
              userName?: string;
              username?: string;
              email?: string;
            }[]
          )
            .map((u) => ({
              id: u.id ?? u.Id ?? "",
              employeeId: u.employeeId ?? u.EmployeeId ?? "",
              name:
                u.fullName ??
                u.FullName ??
                u.userName ??
                u.username ??
                u.email ??
                "User",
            }))
            .filter((x) => x.id);
          setPeople(mapped);
        }
      } catch (err) {
        console.error("Failed to load users directory", err);
      }
    };
    if (activeTab === "personal") {
      loadPeople();
    }
  }, [activeTab]);

  // Move selection-based loaders after memoized thread selectors to avoid TDZ
  const selectedProjectThread = useMemo(() => {
    return (
      projectThreads.find((thread) => thread.projectId === selectedProjectId) ??
      null
    );
  }, [projectThreads, selectedProjectId]);

  const selectedPersonalThread = useMemo(() => {
    return (
      personalThreads.find((thread) => thread.userId === selectedUserId) ?? null
    );
  }, [personalThreads, selectedUserId]);

  // Load selected project's messages once on selection
  useEffect(() => {
    if (activeTab !== "project") return;
    if (!selectedProjectId) return;
    if (loadedProjectRef.current === selectedProjectId) return;
    loadedProjectRef.current = selectedProjectId;
    loadProjectMessagesById(selectedProjectId).catch(() => {});
  }, [activeTab, selectedProjectId, loadProjectMessagesById]);

  // Load selected personal conversation once on selection
  useEffect(() => {
    if (activeTab !== "personal") return;
    const empId =
      (selectedPersonalThread
        ? selectedPersonalThread.employeeId
        : undefined) || selectedPerson?.employeeId;
    if (!empId) return;
    if (loadedPersonRef.current === empId) return;
    loadedPersonRef.current = empId;
    loadPersonalMessagesWith(empId).catch(() => {});
  }, [
    activeTab,
    selectedPersonalThread,
    selectedPerson,
    loadPersonalMessagesWith,
  ]);

  useEffect(() => {
    if (
      selectedProjectId !== null &&
      !projectThreads.some((thread) => thread.projectId === selectedProjectId)
    ) {
      setSelectedProjectId(projectThreads[0]?.projectId ?? null);
    }
  }, [projectThreads, selectedProjectId]);

  useEffect(() => {
    if (
      selectedUserId !== null &&
      !personalThreads.some((thread) => thread.userId === selectedUserId)
    ) {
      setSelectedUserId(personalThreads[0]?.userId ?? null);
    }
  }, [personalThreads, selectedUserId]);

  const activeMessages: MessageDto[] = useMemo(() => {
    switch (activeTab) {
      case "department":
        return departmentMessages;
      case "project":
        return selectedProjectThread?.messages ?? [];
      case "personal":
        return selectedPersonalThread?.messages ?? [];
      default:
        return [];
    }
  }, [
    activeTab,
    departmentMessages,
    selectedPersonalThread,
    selectedProjectThread,
  ]);

  useEffect(() => {
    if (activeMessages.length === 0) return;

    const unreadMessages = activeMessages.filter((message) => {
      if (processedReadIds.current.has(message.messageId)) return false;
      if (message.isRead) return false;
      if (activeTab === "personal" && currentUserId) {
        return message.receiverId === currentUserId;
      }
      return activeTab !== "personal";
    });

    if (unreadMessages.length === 0) return;

    const markAsRead = async () => {
      try {
        if (activeTab === "personal" && currentUserId) {
          await Promise.all(
            unreadMessages.map((message) =>
              markMessageAsRead(message.messageId)
            )
          );
        } else {
          await Promise.all(
            unreadMessages.map((message) =>
              markGroupMessageAsRead(message.messageId)
            )
          );
        }
        unreadMessages.forEach((message) =>
          processedReadIds.current.add(message.messageId)
        );
      } catch (markError) {
        console.error("Failed to update read state", markError);
      }
    };

    markAsRead();
  }, [
    activeMessages,
    activeTab,
    currentUserId,
    markGroupMessageAsRead,
    markMessageAsRead,
  ]);

  const departmentUnread = useMemo(
    () => departmentMessages.filter((message) => !message.isRead).length,
    [departmentMessages]
  );
  const projectUnread = useMemo(
    () => projectThreads.reduce((sum, thread) => sum + thread.unreadCount, 0),
    [projectThreads]
  );
  const personalUnread = useMemo(
    () => personalThreads.reduce((sum, thread) => sum + thread.unreadCount, 0),
    [personalThreads]
  );

  const tabs: ConversationTab[] = useMemo(
    () => [
      {
        key: "department",
        label: "Department",
        icon: <Building2 className="h-4 w-4" />,
        badge: departmentUnread,
      },
      {
        key: "project",
        label: "Projects",
        icon: <Layers className="h-4 w-4" />,
        badge: projectUnread,
      },
      {
        key: "personal",
        label: "Direct Messages",
        icon: <Users className="h-4 w-4" />,
        badge: personalUnread,
      },
    ],
    [departmentUnread, personalUnread, projectUnread]
  );

  const conversationTitle = useMemo(() => {
    switch (activeTab) {
      case "department":
        return "Department Broadcast";
      case "project":
        if (selectedProjectId) {
          const p = projectList.find((p) => p.projectId === selectedProjectId);
          return p ? `${p.projectName}` : `Project #${selectedProjectId}`;
        }
        return "Project Messages";
      case "personal":
        return selectedPersonalThread
          ? selectedPersonalThread.displayName
          : selectedPerson?.name ?? "Direct Messages";
      default:
        return "Messages";
    }
  }, [
    activeTab,
    selectedPersonalThread,
    selectedProjectId,
    projectList,
    selectedPerson,
  ]);

  const composerPlaceholder = useMemo(() => {
    switch (activeTab) {
      case "department":
        return "Share an update with your department...";
      case "project":
        return selectedProjectId
          ? `Message project #${selectedProjectId}...`
          : "Select a project to chat with the team...";
      case "personal":
        return selectedPersonalThread
          ? `Message ${selectedPersonalThread.displayName}...`
          : selectedPerson
          ? `Message ${selectedPerson.name}...`
          : "Select a teammate to start a conversation...";
      default:
        return "Type a message...";
    }
  }, [activeTab, selectedPersonalThread, selectedProjectId, selectedPerson]);

  const canSend = useMemo(() => {
    if (!messageContent.trim()) return false;
    if (sending) return false;

    switch (activeTab) {
      case "department":
        return true;
      case "project":
        return selectedProjectId !== null;
      case "personal":
        return selectedPersonalThread !== null || !!selectedPerson;
      default:
        return false;
    }
  }, [
    activeTab,
    messageContent,
    selectedPersonalThread,
    selectedProjectId,
    selectedPerson,
    sending,
  ]);

  const formatTimestamp = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch (err) {
      console.warn("Failed to format timestamp", err);
      return timestamp;
    }
  };

  const handleSendMessage = async () => {
    if (!canSend) return;

    const trimmedContent = messageContent.trim();
    if (!trimmedContent) return;

    const payload: CreateMessageDto = {
      content: trimmedContent,
      messageType: MessageType.Department,
    };

    if (activeTab === "project") {
      if (selectedProjectId === null) {
        toast.info("Pick a project first.");
        return;
      }
      payload.messageType = MessageType.Project;
      payload.projectId = selectedProjectId;
    } else if (activeTab === "personal") {
      if (!selectedPersonalThread) {
        // Allow new DM start via directory selection
        if (!selectedPerson) {
          toast.info("Select a teammate to message.");
          return;
        }
      }
      payload.messageType = MessageType.Personal;
      // Backend expects ReceiverId to be the receiver's EmployeeId (not GUID user id)
      const receiverEmpId =
        selectedPersonalThread?.employeeId || selectedPerson?.employeeId;
      if (!receiverEmpId) {
        toast.error("Cannot determine recipient employee ID.");
        return;
      }
      payload.receiverId = receiverEmpId;
    }

    setSending(true);
    try {
      await sendMessage(payload);
      setMessageContent("");
    } catch (sendError) {
      const message =
        sendError instanceof Error
          ? sendError.message
          : "Unable to send message right now.";
      toast.error(message);
    } finally {
      setSending(false);
    }
  };

  const handleDeleteMessage = async (messageId: number) => {
    try {
      await deleteMessage(messageId);
      toast.success("Message removed");
    } catch (deleteError) {
      const message =
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to delete message right now.";
      toast.error(message);
    }
  };

  const handleRefresh = async () => {
    try {
      await refreshMessages();
      toast.success("Messages refreshed!", {
        position: "top-right",
        autoClose: 1000,
        theme: darkMode ? "dark" : "light",
      });
    } catch (refreshError) {
      const message =
        refreshError instanceof Error
          ? refreshError.message
          : "Unable to refresh messages.";
      toast.error(message);
    }
  };

  return (
    <div
      className={`min-h-screen transition-colors ${
        darkMode ? "bg-zinc-900 text-zinc-100" : "bg-gray-100 text-gray-900"
      }`}
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6">
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">Team Chat</h1>
          <p className="text-sm opacity-75">
            Stay in sync with your projects, department, and teammates. Messages
            load on-demand for better performance.
          </p>
        </header>

        <div
          className={`flex min-h-[600px] flex-col overflow-hidden rounded-2xl shadow-xl ${
            darkMode ? "bg-zinc-800" : "bg-white"
          }`}
        >
          <div
            className={`flex border-b ${
              darkMode ? "border-zinc-700" : "border-gray-200"
            }`}
          >
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                aria-label={`Switch to ${tab.label} tab`}
                className={`flex flex-1 items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition ${
                  activeTab === tab.key
                    ? darkMode
                      ? "bg-purple-600 text-white"
                      : "bg-purple-100 text-purple-900"
                    : darkMode
                    ? "text-gray-300 hover:bg-zinc-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {!!tab.badge && tab.badge > 0 && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      activeTab === tab.key
                        ? "bg-white text-purple-600"
                        : darkMode
                        ? "bg-zinc-700 text-gray-100"
                        : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="flex flex-1 flex-col md:flex-row">
            <aside
              className={`flex w-full flex-col gap-4 border-b p-4 md:w-72 md:border-b-0 md:border-r ${
                darkMode
                  ? "border-zinc-700 bg-zinc-900/40"
                  : "border-gray-200 bg-gray-50"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider opacity-80">
                  <MessageSquare className="h-4 w-4" /> Conversations
                </span>
                <button
                  type="button"
                  onClick={handleRefresh}
                  disabled={loading}
                  aria-label="Refresh messages"
                  title="Refresh messages"
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium transition ${
                    darkMode
                      ? "bg-zinc-700 text-gray-100 hover:bg-zinc-600"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  } ${loading ? "opacity-50" : ""}`}
                >
                  <RefreshCw
                    className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
                  />
                  Refresh
                </button>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                {activeTab === "department" && (
                  <div
                    className={`rounded-xl border p-4 text-sm ${
                      darkMode
                        ? "border-purple-500/40 bg-purple-900/20 text-purple-100"
                        : "border-purple-200 bg-purple-50 text-purple-900"
                    }`}
                  >
                    <p className="font-semibold">Department Updates</p>
                    <p className="mt-1 text-xs opacity-80">
                      Everyone in your department can see these messages.
                    </p>
                    <p className="mt-3 text-xs font-medium">
                      Unread messages: {departmentUnread}
                    </p>
                  </div>
                )}

                {activeTab === "project" && (
                  <ul className="space-y-2">
                    {projectList.length === 0 && (
                      <li className="text-xs opacity-70">
                        You are not assigned to any projects.
                      </li>
                    )}
                    {projectList.map((proj) => {
                      const isActive = proj.projectId === selectedProjectId;
                      const thread = projectThreads.find(
                        (t) => t.projectId === proj.projectId
                      );
                      const unread = thread?.unreadCount ?? 0;
                      const subtitle = thread?.lastMessage
                        ? `${thread.lastMessage.senderName}: ${thread.lastMessage.content}`
                        : undefined;
                      return (
                        <li key={proj.projectId}>
                          <button
                            type="button"
                            onClick={async () => {
                              setSelectedProjectId(proj.projectId);
                              try {
                                await loadProjectMessagesById(proj.projectId);
                              } catch (e) {
                                console.error(e);
                              }
                            }}
                            aria-label={`Select project ${proj.projectName}`}
                            className={`w-full rounded-xl border px-3 py-2 text-left transition ${
                              isActive
                                ? darkMode
                                  ? "border-purple-500 bg-purple-900/30 text-purple-100"
                                  : "border-purple-300 bg-purple-50 text-purple-900"
                                : darkMode
                                ? "border-transparent bg-zinc-800/60 hover:bg-zinc-700"
                                : "border-transparent bg-white hover:border-purple-200 hover:bg-purple-50/70"
                            }`}
                          >
                            <span className="flex items-center justify-between text-sm font-semibold">
                              {proj.projectName}
                              {unread > 0 && (
                                <span
                                  className={`ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                                    isActive
                                      ? "bg-white text-purple-600"
                                      : darkMode
                                      ? "bg-zinc-700 text-gray-100"
                                      : "bg-gray-200 text-gray-700"
                                  }`}
                                >
                                  {unread}
                                </span>
                              )}
                            </span>
                            {subtitle && (
                              <p className="mt-1 line-clamp-2 text-xs opacity-75">
                                {subtitle}
                              </p>
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}

                {activeTab === "personal" && (
                  <ul className="space-y-2">
                    {personalThreads.length === 0 && (
                      <li className="text-xs opacity-70">
                        No direct conversations yet.
                      </li>
                    )}
                    {personalThreads.map((thread) => {
                      const isActive = thread.userId === selectedUserId;
                      return (
                        <li key={thread.userId}>
                          <button
                            type="button"
                            onClick={() => setSelectedUserId(thread.userId)}
                            aria-label={`Select conversation with ${thread.displayName}`}
                            className={`w-full rounded-xl border px-3 py-2 text-left transition ${
                              isActive
                                ? darkMode
                                  ? "border-purple-500 bg-purple-900/30 text-purple-100"
                                  : "border-purple-300 bg-purple-50 text-purple-900"
                                : darkMode
                                ? "border-transparent bg-zinc-800/60 hover:bg-zinc-700"
                                : "border-transparent bg-white hover:border-purple-200 hover:bg-purple-50/70"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-semibold">
                                {thread.displayName}
                              </span>
                              {thread.unreadCount > 0 && (
                                <span
                                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                                    isActive
                                      ? "bg-white text-purple-600"
                                      : darkMode
                                      ? "bg-zinc-700 text-gray-100"
                                      : "bg-gray-200 text-gray-700"
                                  }`}
                                >
                                  {thread.unreadCount}
                                </span>
                              )}
                            </div>
                            {thread.lastMessage && (
                              <p className="mt-1 line-clamp-2 text-xs opacity-75">
                                {thread.lastMessage.senderId === currentUserId
                                  ? "You"
                                  : thread.lastMessage.senderName}
                                : {thread.lastMessage.content}
                              </p>
                            )}
                          </button>
                        </li>
                      );
                    })}
                    {/* Directory search and list */}
                    <li className="pt-2">
                      <input
                        type="text"
                        placeholder="Search people..."
                        aria-label="Search people"
                        className={`mb-2 w-full rounded-lg border px-3 py-2 text-xs ${
                          darkMode
                            ? "border-zinc-700 bg-zinc-800 text-gray-100"
                            : "border-gray-300 bg-white text-gray-900"
                        }`}
                        value={peopleSearch}
                        onChange={(e) => setPeopleSearch(e.target.value)}
                      />
                      {peopleSearch.trim() !== "" && (
                        <div className="max-h-64 overflow-y-auto space-y-1">
                          {people
                            .filter(
                              (p) =>
                                p.name
                                  .toLowerCase()
                                  .includes(peopleSearch.toLowerCase()) ||
                                p.employeeId
                                  ?.toLowerCase()
                                  .includes(peopleSearch.toLowerCase())
                            )
                            .map((p) => (
                              <button
                                key={p.id}
                                type="button"
                                onClick={async () => {
                                  setSelectedPerson(p);
                                  setSelectedUserId(p.id);
                                  try {
                                    await loadPersonalMessagesWith(
                                      p.employeeId
                                    );
                                  } catch (e) {
                                    console.error(e);
                                  }
                                }}
                                aria-label={`Start conversation with ${p.name}`}
                                className={`w-full text-left rounded-lg px-3 py-2 text-xs ${
                                  darkMode
                                    ? "hover:bg-zinc-700"
                                    : "hover:bg-purple-50"
                                }`}
                              >
                                {p.name}{" "}
                                {p.employeeId ? `(ID: ${p.employeeId})` : ""}
                              </button>
                            ))}
                        </div>
                      )}
                    </li>
                  </ul>
                )}
              </div>

              <div className="rounded-xl border px-4 py-3 text-xs opacity-70">
                <p className="font-medium">Quick Stats</p>
                <p className="mt-1">
                  You have {unreadCounts?.total ?? 0} unread messages.
                </p>
                <p className="mt-1">
                  Personal: {unreadCounts?.personalUnread ?? personalUnread}
                </p>
                <p className="mt-1">
                  Group:{" "}
                  {unreadCounts?.groupUnread ??
                    projectUnread + departmentUnread}
                </p>
              </div>
            </aside>

            <section className="flex flex-1 flex-col">
              <header
                className={`flex items-center justify-between border-b px-6 py-4 ${
                  darkMode ? "border-zinc-700" : "border-gray-200"
                }`}
              >
                <div>
                  <h2 className="text-xl font-semibold">{conversationTitle}</h2>
                  {selectedPersonalThread && activeTab === "personal" && (
                    <p className="text-xs opacity-70">
                      Employee ID: {selectedPersonalThread.employeeId ?? "N/A"}
                    </p>
                  )}
                  <p className="mt-1 text-xs opacity-60">
                    {activeMessages.length} message
                    {activeMessages.length === 1 ? "" : "s"} in this
                    conversation.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs opacity-70">
                  <Users className="h-4 w-4" />
                  {currentUserId
                    ? "You are signed in and can chat."
                    : "Sign in to participate."}
                </div>
              </header>

              <div className="flex-1 space-y-4 overflow-y-auto px-4 py-6">
                {loading && activeMessages.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-sm opacity-75">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading
                    messages...
                  </div>
                ) : null}

                {!loading && activeMessages.length === 0 && (
                  <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-sm opacity-70">
                    <MessageSquare className="h-10 w-10" />
                    <p>
                      Nothing here yet. Start the conversation by sending a
                      message.
                    </p>
                  </div>
                )}

                {!loading &&
                  activeMessages.map((message) => {
                    const isOwn = currentUserId
                      ? message.senderId === currentUserId
                      : false;
                    const bubbleClasses = isOwn
                      ? darkMode
                        ? "bg-purple-600 text-white"
                        : "bg-purple-500 text-white"
                      : darkMode
                      ? "bg-zinc-700 text-gray-100"
                      : "bg-gray-100 text-gray-900";

                    return (
                      <div
                        key={message.messageId}
                        className={`flex ${
                          isOwn ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-lg rounded-2xl px-4 py-3 shadow ${bubbleClasses}`}
                        >
                          <div className="flex items-center gap-2 text-xs uppercase tracking-wide opacity-70">
                            {!isOwn && (
                              <span className="font-semibold">
                                {message.senderName}
                              </span>
                            )}
                            <span>{formatTimestamp(message.timeSent)}</span>
                            {message.timeEdited && <span>Edited</span>}
                          </div>
                          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed">
                            {message.content}
                          </p>

                          {message.attachment && (
                            <div
                              className={`mt-3 flex items-center gap-2 rounded-lg px-3 py-2 text-xs ${
                                isOwn
                                  ? "bg-white/10 text-white"
                                  : darkMode
                                  ? "bg-zinc-800 text-gray-100"
                                  : "bg-white text-gray-700"
                              }`}
                            >
                              <User className="h-4 w-4" />
                              <span className="font-medium">
                                {message.attachment.fileName}
                              </span>
                              <span className="opacity-70">
                                {Math.round(message.attachment.fileSize / 1024)}{" "}
                                KB
                              </span>
                            </div>
                          )}

                          {isOwn && (
                            <div className="mt-3 flex items-center gap-3 text-xs opacity-70">
                              <button
                                type="button"
                                className="underline-offset-2 hover:underline"
                                onClick={() =>
                                  handleDeleteMessage(message.messageId)
                                }
                                aria-label="Delete message"
                                title="Delete this message"
                              >
                                Delete
                              </button>
                              {message.isRead && <span>Seen</span>}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>

              <footer
                className={`border-t px-6 py-4 ${
                  darkMode ? "border-zinc-700" : "border-gray-200"
                }`}
              >
                <div className="flex items-end gap-3">
                  <textarea
                    value={messageContent}
                    onChange={(event) => setMessageContent(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder={composerPlaceholder}
                    rows={3}
                    aria-label="Message content"
                    className={`flex-1 resize-none rounded-xl border px-3 py-2 text-sm outline-none transition focus:ring-2 ${
                      darkMode
                        ? "border-zinc-700 bg-zinc-800 text-gray-100 focus:border-purple-500 focus:ring-purple-500/40"
                        : "border-gray-300 bg-white text-gray-900 focus:border-purple-500 focus:ring-purple-200"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={handleSendMessage}
                    disabled={!canSend}
                    aria-label="Send message"
                    title="Send message (or press Enter)"
                    className={`inline-flex h-11 items-center gap-2 rounded-xl px-4 text-sm font-semibold transition ${
                      canSend
                        ? darkMode
                          ? "bg-purple-600 text-white hover:bg-purple-500"
                          : "bg-purple-600 text-white hover:bg-purple-500"
                        : darkMode
                        ? "bg-zinc-700 text-gray-400"
                        : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    <Send
                      className={`h-4 w-4 ${sending ? "animate-pulse" : ""}`}
                    />
                    {sending ? "Sending..." : "Send"}
                  </button>
                </div>
              </footer>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
