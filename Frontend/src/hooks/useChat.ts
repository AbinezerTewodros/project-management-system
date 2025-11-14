import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { messageService } from "@/services/messageService";
import {
  CreateMessageDto,
  EditMessageDto,
  MessageDto,
  MessageType,
  UnreadCountDto,
} from "@/types/messageTypes";

interface PersonalThreadSummary {
  userId: string;
  employeeId?: string;
  displayName: string;
  messages: MessageDto[];
  unreadCount: number;
  lastMessage?: MessageDto;
}

interface ProjectThreadSummary {
  projectId: number;
  messages: MessageDto[];
  unreadCount: number;
  lastMessage?: MessageDto;
}

interface UseChatOptions {
  /**
   * Authenticated user's identity. Used to compute personal threads accurately.
   */
  currentUserId?: string;
}

interface UseChatResult {
  departmentMessages: MessageDto[];
  projectMessages: MessageDto[];
  personalMessages: MessageDto[];
  projectThreads: ProjectThreadSummary[];
  personalThreads: PersonalThreadSummary[];
  unreadCounts: UnreadCountDto | null;
  loading: boolean;
  error: string | null;
  refreshMessages: () => Promise<void>;
  refreshUnreadCounts: () => Promise<void>;
  sendMessage: (payload: CreateMessageDto) => Promise<MessageDto>;
  editMessage: (payload: EditMessageDto) => Promise<void>;
  deleteMessage: (messageId: number) => Promise<void>;
  markMessageAsRead: (messageId: number) => Promise<void>;
  markGroupMessageAsRead: (messageId: number) => Promise<void>;
  loadProjectMessagesById: (projectId: number) => Promise<void>;
  loadPersonalMessagesWith: (employeeId: string) => Promise<void>;
  loadDepartmentMessages: () => Promise<void>;
  loadPersonalInbox: () => Promise<void>;
}

function sortMessages(messages: MessageDto[]): MessageDto[] {
  return [...messages].sort((a, b) => {
    const aDate = new Date(a.timeSent).getTime();
    const bDate = new Date(b.timeSent).getTime();
    return aDate - bDate;
  });
}

export function useChat(options: UseChatOptions = {}): UseChatResult {
  const { currentUserId } = options;

  const [departmentMessages, setDepartmentMessages] = useState<MessageDto[]>(
    []
  );
  const [projectMessages, setProjectMessages] = useState<MessageDto[]>([]);
  const [personalMessages, setPersonalMessages] = useState<MessageDto[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<UnreadCountDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const refreshUnreadCounts = useCallback(async () => {
    try {
      const counts = await messageService.getUnreadCount();
      if (isMounted.current) {
        setUnreadCounts(counts);
      }
    } catch (err) {
      console.error("Failed to fetch unread counts", err);
    }
  }, []);

  // Manual loader: fetch all scopes once on demand
  const loadAllMessages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [dept, projects, personals] = await Promise.all([
        messageService.getDepartmentMessages(),
        messageService.getProjectMessages(),
        messageService.getPersonalMessages(),
      ]);
      if (!isMounted.current) return;
      setDepartmentMessages(sortMessages(dept));
      setProjectMessages(sortMessages(projects));
      setPersonalMessages(sortMessages(personals));
      await refreshUnreadCounts();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load messages";
      if (isMounted.current) setError(message);
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, [refreshUnreadCounts]);

  // Scoped: Department only
  const loadDepartmentMessages = useCallback(async () => {
    setLoading(true);
    try {
      const dept = await messageService.getDepartmentMessages();
      if (!isMounted.current) return;
      setDepartmentMessages(sortMessages(dept));
      await refreshUnreadCounts();
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, [refreshUnreadCounts]);

  // Stop auto-loading; the caller will invoke refreshMessages explicitly
  // New helpers: scoped loaders used by the Chat UI
  const loadProjectMessagesById = useCallback(
    async (projectId: number) => {
      setLoading(true);
      try {
        const msgs = await messageService.getProjectMessagesById(projectId);
        if (!isMounted.current) return;
        // Merge into projectMessages list (replace that project's messages)
        const other = projectMessages.filter((m) => m.projectId !== projectId);
        setProjectMessages(sortMessages([...other, ...msgs]));
        await refreshUnreadCounts();
      } finally {
        if (isMounted.current) setLoading(false);
      }
    },
    [projectMessages, refreshUnreadCounts]
  );

  const loadPersonalMessagesWith = useCallback(
    async (employeeId: string) => {
      setLoading(true);
      try {
        const msgs = await messageService.getPersonalMessagesWith(employeeId);
        if (!isMounted.current) return;

        // Determine counterpart userId from returned messages relative to currentUserId
        const counterpartIds = new Set<string>();
        msgs.forEach((m) => {
          const otherUserId =
            m.senderId === (currentUserId ?? "")
              ? m.receiverId ?? ""
              : m.senderId;
          if (otherUserId) counterpartIds.add(otherUserId);
        });
        const counterpartId = Array.from(counterpartIds)[0];

        // Keep messages for other conversations, replace this conversation
        const otherConversations = personalMessages.filter((m) => {
          const other =
            m.senderId === (currentUserId ?? "")
              ? m.receiverId ?? ""
              : m.senderId;
          return other !== counterpartId;
        });

        setPersonalMessages(sortMessages([...otherConversations, ...msgs]));
        await refreshUnreadCounts();
      } finally {
        if (isMounted.current) setLoading(false);
      }
    },
    [personalMessages, refreshUnreadCounts, currentUserId]
  );

  // Scoped: Personal inbox (all DM messages)
  const loadPersonalInbox = useCallback(async () => {
    setLoading(true);
    try {
      const personals = await messageService.getPersonalMessages();
      if (!isMounted.current) return;
      setPersonalMessages(sortMessages(personals));
      await refreshUnreadCounts();
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, [refreshUnreadCounts]);

  const handleMessageInsert = useCallback((message: MessageDto) => {
    switch (message.messageType) {
      case MessageType.Project:
        setProjectMessages((prev) =>
          sortMessages([
            ...prev.filter((m) => m.messageId !== message.messageId),
            message,
          ])
        );
        break;
      case MessageType.Department:
        setDepartmentMessages((prev) =>
          sortMessages([
            ...prev.filter((m) => m.messageId !== message.messageId),
            message,
          ])
        );
        break;
      case MessageType.Personal:
        setPersonalMessages((prev) =>
          sortMessages([
            ...prev.filter((m) => m.messageId !== message.messageId),
            message,
          ])
        );
        break;
      default:
        break;
    }
  }, []);

  const handleMessageRemoval = useCallback((messageId: number) => {
    setDepartmentMessages((prev) =>
      prev.filter((msg) => msg.messageId !== messageId)
    );
    setProjectMessages((prev) =>
      prev.filter((msg) => msg.messageId !== messageId)
    );
    setPersonalMessages((prev) =>
      prev.filter((msg) => msg.messageId !== messageId)
    );
  }, []);

  const sendMessage = useCallback(
    async (payload: CreateMessageDto) => {
      try {
        const message = await messageService.sendMessage(payload);
        if (!isMounted.current) return message;

        handleMessageInsert(message);
        await refreshUnreadCounts();
        return message;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to send message";
        if (isMounted.current) {
          setError(message);
        }
        throw err;
      }
    },
    [handleMessageInsert, refreshUnreadCounts]
  );

  const editMessage = useCallback(
    async (payload: EditMessageDto) => {
      try {
        await messageService.editMessage(payload);
        await loadAllMessages();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to edit message";
        if (isMounted.current) {
          setError(message);
        }
        throw err;
      }
    },
    [loadAllMessages]
  );

  const deleteMessage = useCallback(
    async (messageId: number) => {
      try {
        await messageService.deleteMessage(messageId);
        if (!isMounted.current) return;

        handleMessageRemoval(messageId);
        await refreshUnreadCounts();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to delete message";
        if (isMounted.current) {
          setError(message);
        }
        throw err;
      }
    },
    [handleMessageRemoval, refreshUnreadCounts]
  );

  const markMessageAsRead = useCallback(
    async (messageId: number) => {
      try {
        await messageService.markMessageAsRead(messageId);
        if (!isMounted.current) return;

        setPersonalMessages((prev) =>
          prev.map((msg) =>
            msg.messageId === messageId ? { ...msg, isRead: true } : msg
          )
        );
        await refreshUnreadCounts();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to mark message as read";
        if (isMounted.current) {
          setError(message);
        }
        throw err;
      }
    },
    [refreshUnreadCounts]
  );

  const markGroupMessageAsRead = useCallback(
    async (messageId: number) => {
      try {
        await messageService.markGroupMessageAsRead(messageId);
        if (!isMounted.current) return;

        setDepartmentMessages((prev) =>
          prev.map((msg) =>
            msg.messageId === messageId ? { ...msg, isRead: true } : msg
          )
        );
        setProjectMessages((prev) =>
          prev.map((msg) =>
            msg.messageId === messageId ? { ...msg, isRead: true } : msg
          )
        );
        await refreshUnreadCounts();
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Failed to mark group message as read";
        if (isMounted.current) {
          setError(message);
        }
        throw err;
      }
    },
    [refreshUnreadCounts]
  );

  const projectThreads = useMemo<ProjectThreadSummary[]>(() => {
    const grouped = new Map<number, MessageDto[]>();

    projectMessages.forEach((message) => {
      if (message.projectId === undefined || message.projectId === null) return;
      const list = grouped.get(message.projectId) ?? [];
      list.push(message);
      grouped.set(message.projectId, list);
    });

    return Array.from(grouped.entries())
      .map(([projectId, messages]) => {
        const sorted = sortMessages(messages);
        return {
          projectId,
          messages: sorted,
          unreadCount: sorted.filter((msg) => !msg.isRead).length,
          lastMessage: sorted[sorted.length - 1],
        } as ProjectThreadSummary;
      })
      .sort((a, b) => {
        const aTime = a.lastMessage
          ? new Date(a.lastMessage.timeSent).getTime()
          : 0;
        const bTime = b.lastMessage
          ? new Date(b.lastMessage.timeSent).getTime()
          : 0;
        return bTime - aTime;
      });
  }, [projectMessages]);

  const personalThreads = useMemo<PersonalThreadSummary[]>(() => {
    if (!currentUserId) return [];

    const grouped = new Map<string, MessageDto[]>();

    personalMessages.forEach((message) => {
      const otherUserId =
        message.senderId === currentUserId
          ? message.receiverId
          : message.senderId;
      if (!otherUserId) return;
      const list = grouped.get(otherUserId) ?? [];
      list.push(message);
      grouped.set(otherUserId, list);
    });

    return Array.from(grouped.entries())
      .map(([userId, messages]) => {
        const sorted = sortMessages(messages);
        const lastMessage = sorted[sorted.length - 1];
        const counterpartMessage = sorted.find(
          (msg) => msg.senderId === userId
        );

        return {
          userId,
          employeeId: counterpartMessage?.employeeId,
          displayName: counterpartMessage?.senderName || "Unknown user",
          messages: sorted,
          unreadCount: sorted.filter(
            (msg) => !msg.isRead && msg.receiverId === currentUserId
          ).length,
          lastMessage,
        } as PersonalThreadSummary;
      })
      .sort((a, b) => {
        const aTime = a.lastMessage
          ? new Date(a.lastMessage.timeSent).getTime()
          : 0;
        const bTime = b.lastMessage
          ? new Date(b.lastMessage.timeSent).getTime()
          : 0;
        return bTime - aTime;
      });
  }, [personalMessages, currentUserId]);

  return {
    departmentMessages,
    projectMessages,
    personalMessages,
    projectThreads,
    personalThreads,
    unreadCounts,
    loading,
    error,
    refreshMessages: loadAllMessages,
    refreshUnreadCounts,
    sendMessage,
    editMessage,
    deleteMessage,
    markMessageAsRead,
    markGroupMessageAsRead,
    loadProjectMessagesById,
    loadPersonalMessagesWith,
    loadDepartmentMessages,
    loadPersonalInbox,
  };
}
