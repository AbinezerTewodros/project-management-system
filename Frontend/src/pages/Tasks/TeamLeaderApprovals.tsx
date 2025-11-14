import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { todoItemService } from '@/services/todoItemService';
import { projectTaskService } from '@/services/projectTaskService';
import { userService } from '@/services/userService';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  CheckCircle,
  X,
  Clock,
  TrendingUp,
  AlertCircle,
  ListTodo,
  User,
  Calendar,
} from 'lucide-react';
import type { TodoItemReadDto } from '@/types/taskTypes';

interface ExtendedTodoItem extends TodoItemReadDto {
  taskTitle?: string;
  projectName?: string;
  assigneeName?: string;
  submittedDate?: string;
}

interface RejectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  darkMode: boolean;
  title: string;
}

const RejectModal: React.FC<RejectModalProps> = ({ isOpen, onClose, onConfirm, darkMode, title }) => {
  const [reason, setReason] = useState('');

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!reason.trim()) {
      toast.error('Please provide a reason for rejection', { theme: darkMode ? 'dark' : 'light' });
      return;
    }
    onConfirm(reason);
    setReason('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`rounded-lg p-6 w-full max-w-md ${darkMode ? 'bg-zinc-800 text-white' : 'bg-white text-gray-800'}`}>
        <h3 className="text-xl font-bold mb-4">{title}</h3>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Please provide detailed feedback on what needs to be improved..."
          className={`w-full p-3 border rounded-lg h-32 ${
            darkMode
              ? 'bg-zinc-700 border-zinc-600 text-white placeholder-gray-400'
              : 'bg-white border-gray-300 text-gray-800'
          }`}
        />
        <div className="flex justify-end gap-3 mt-4">
          <button
            onClick={() => {
              setReason('');
              onClose();
            }}
            className={`px-4 py-2 rounded-lg ${
              darkMode ? 'bg-zinc-700 hover:bg-zinc-600' : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium"
          >
            Request Revision
          </button>
        </div>
      </div>
    </div>
  );
};

const TeamLeaderApprovals = ({ darkMode, showHeader = true }: { darkMode: boolean; showHeader?: boolean }) => {
  const { user: currentUser } = useAuth();
  const [pendingTodoItems, setPendingTodoItems] = useState<ExtendedTodoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedTodoItem, setSelectedTodoItem] = useState<ExtendedTodoItem | null>(null);
  const [allUsers, setAllUsers] = useState<any[]>([]);

  console.log('🎯 TeamLeaderApprovals Component Mounted/Rendered');
  console.log('👤 Current User:', currentUser);
  console.log('👥 All Users Count:', allUsers.length);
  console.log('📋 Pending TodoItems Count:', pendingTodoItems.length);

  // Fetch all users once
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const users = await userService.getAllUsers();
        if (users.data && Array.isArray(users.data)) {
          setAllUsers(users.data);
          console.log('✅ Fetched all users:', users.data.length);
        }
      } catch (error) {
        console.error('❌ Error fetching users:', error);
      }
    };
    fetchUsers();
  }, []);

  // Fetch pending approvals
  const fetchPendingApprovals = async () => {
    try {
      setLoading(true);
      console.log('═══════════════════════════════════════════');
      console.log('🔄 FETCHING PENDING APPROVALS');
      console.log('═══════════════════════════════════════════');
      console.log('👤 Current User:', currentUser?.username, currentUser?.role);
      console.log('👥 All Users Loaded:', allUsers.length);

      // SIMPLER APPROACH: Get all project tasks and their TodoItems
      const projectTasksResponse = await projectTaskService.getAllTasks();
      const allProjectTasks = projectTasksResponse || [];
      console.log('📋 All project tasks:', allProjectTasks.length);
      console.log('📋 Sample project task:', allProjectTasks[0]);

      // For each project task, get its TodoItems
      console.log('🔄 Fetching TodoItems for each task...');
      const allTodoItemsPromises = allProjectTasks.map(async (task: any) => {
        try {
          console.log(`  📌 Fetching TodoItems for task ${task.id}: "${task.title}"`);
          const todoItems = await todoItemService.getTodoItemsByProjectTaskId(task.id);
          console.log(`  ✅ Task ${task.id} has ${todoItems.length} TodoItems`);
          
          if (todoItems.length > 0) {
            console.log(`  📋 TodoItems for task ${task.id}:`, todoItems.map((t: any) => ({
              id: t.id,
              title: t.title,
              status: t.status,
              assigneeId: t.assigneeId
            })));
          }
          
          // Add task context to each TodoItem
          return todoItems.map((item: any) => ({
            ...item,
            taskTitle: task.title,
            taskId: task.id,
            projectAssignmentId: task.projectAssignmentId,
          }));
        } catch (error) {
          console.error(`❌ Error fetching TodoItems for task ${task.id}:`, error);
          return [];
        }
      });

      const allTodoItems = (await Promise.all(allTodoItemsPromises)).flat();
      console.log('═══════════════════════════════════════════');
      console.log('📋 Total TodoItems fetched:', allTodoItems.length);
      console.log('📋 All TodoItems:', allTodoItems.map((t: any) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        assigneeId: t.assigneeId,
        taskTitle: t.taskTitle
      })));
      console.log('═══════════════════════════════════════════');
      
      // Filter for WaitingForReview status  
      const waitingForReview = allTodoItems.filter(
        (item: any) => {
          const isWaiting = item.status === 'WaitingForReview';
          console.log(`🔍 TodoItem ${item.id} "${item.title}": status="${item.status}", isWaiting=${isWaiting}`);
          return isWaiting;
        }
      );

      console.log('═══════════════════════════════════════════');
      console.log('✅ Found TodoItems waiting for review:', waitingForReview.length);
      console.log('📋 WaitingForReview TodoItems:', waitingForReview);
      console.log('═══════════════════════════════════════════');

      // Enrich with additional data
      const enrichedItems = waitingForReview.map((item: any) => {
        // Get assignee name from allUsers
        let assigneeName = 'Unknown';
        if (item.assigneeId && allUsers.length > 0) {
          const user = allUsers.find((u: any) => u.id === item.assigneeId);
          if (user) {
            assigneeName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Unknown';
          } else {
            assigneeName = item.assigneeId.substring(0, 8) + '...';
          }
        }

        return {
          ...item,
          assigneeName,
          taskTitle: item.title || 'Untitled',
          projectName: 'Project', // Can be enhanced to fetch actual project name
          submittedDate: item.updatedAt || item.createdAt,
        };
      });

      setPendingTodoItems(enrichedItems);
    } catch (error) {
      console.error('❌ Error fetching pending approvals:', error);
      toast.error('Failed to load pending approvals', { theme: darkMode ? 'dark' : 'light' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('🔄 useEffect triggered for fetchPendingApprovals');
    console.log('  ✓ currentUser?', !!currentUser, currentUser?.id);
    console.log('  ✓ allUsers.length?', allUsers.length);
    console.log('  ✓ Will fetch?', !!(currentUser && allUsers.length > 0));
    
    if (currentUser && allUsers.length > 0) {
      console.log('✅ Conditions met, calling fetchPendingApprovals...');
      fetchPendingApprovals();
    } else {
      console.log('⏸️ Waiting for currentUser and allUsers...');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id, allUsers.length]);

  // Handle Approve TodoItem
  const handleApproveTodoItem = async (todoItem: ExtendedTodoItem) => {
    try {
      console.log('✅ Approving TodoItem:', todoItem.id);
      await todoItemService.acceptApproval(todoItem.id);
      toast.success(`"${todoItem.title}" approved successfully!`, { theme: darkMode ? 'dark' : 'light' });
      await fetchPendingApprovals(); // Refresh list
    } catch (error: any) {
      console.error('❌ Error approving TodoItem:', error);
      toast.error(error.message || 'Failed to approve', { theme: darkMode ? 'dark' : 'light' });
    }
  };

  // Handle Reject TodoItem
  const handleRejectTodoItem = async (reason: string) => {
    if (!selectedTodoItem) return;

    try {
      console.log('❌ Requesting revision for TodoItem:', selectedTodoItem.id, 'Reason:', reason);
      await todoItemService.rejectCompletion(selectedTodoItem.id, reason);
      toast.success(`Revision requested for "${selectedTodoItem.title}"`, { theme: darkMode ? 'dark' : 'light' });
      setShowRejectModal(false);
      setSelectedTodoItem(null);
      await fetchPendingApprovals(); // Refresh list
    } catch (error: any) {
      console.error('❌ Error requesting revision:', error);
      toast.error(error.message || 'Failed to request revision', { theme: darkMode ? 'dark' : 'light' });
    }
  };

  // Calculate time ago
  const getTimeAgo = (date: string | undefined) => {
    if (!date) return 'Unknown';
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  return (
    <div className={`p-6 ${darkMode ? 'bg-zinc-900 text-gray-100' : 'bg-gray-50 text-gray-800'}`}>
      <ToastContainer />
      
      {/* Header (parent can suppress by passing showHeader={false}) */}
      {showHeader !== false && (
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Action Item Reviews</h1>
              <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Review and approve completed action items (TodoItems) from your team
              </p>
            </div>
            <div className={`px-4 py-2 rounded-lg font-bold text-lg ${
              pendingTodoItems.length > 0
                ? 'bg-yellow-600 text-white'
                : darkMode ? 'bg-zinc-700 text-gray-300' : 'bg-gray-200 text-gray-600'
            }`}>
              {pendingTodoItems.length} Pending
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Empty State */}
      {!loading && pendingTodoItems.length === 0 && (
        <div className={`p-12 text-center ${
          darkMode ? 'bg-zinc-800' : 'bg-white'
        }`}>
          <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
          <h3 className="text-xl font-semibold mb-2">All Caught Up!</h3>
          <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
            No action items (TodoItems) are waiting for your approval at this time.
          </p>
          <div className={`mt-4 p-4 rounded-lg text-left text-sm ${darkMode ? 'bg-zinc-700' : 'bg-blue-50'}`}>
            <p className="font-semibold mb-2">💡 Troubleshooting:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Check console for detailed logs</li>
              <li>Verify backend is restarted (iisreset)</li>
              <li>Ensure team members have submitted items for review</li>
              <li>TodoItem status must be "WaitingForReview"</li>
            </ul>
          </div>
        </div>
      )}

      {/* Pending TodoItems List */}
      {!loading && pendingTodoItems.length > 0 && (
        <div className="space-y-4">
          {pendingTodoItems.map((todoItem) => (
            <div
              key={todoItem.id}
              className={`p-6 ${
                darkMode ? 'bg-zinc-800' : 'bg-white'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2">{todoItem.title}</h3>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {todoItem.description || 'No description provided'}
                  </p>
                </div>
                <div className="px-4 py-2 rounded-lg bg-yellow-600 text-white font-semibold text-sm flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Waiting For Review
                </div>
              </div>

              {/* Metadata Grid */}
              <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-lg mb-4 ${
                darkMode ? 'bg-zinc-700' : 'bg-gray-50'
              }`}>
                <div>
                  <div className="flex items-center gap-2 text-sm mb-1">
                    <User className="w-4 h-4" />
                    <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Assignee</span>
                  </div>
                  <p className="font-semibold">{todoItem.assigneeName || 'Unknown'}</p>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-sm mb-1">
                    <TrendingUp className="w-4 h-4" />
                    <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Progress</span>
                  </div>
                  <p className="font-semibold text-green-600">{todoItem.progress || 0}%</p>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-sm mb-1">
                    <Calendar className="w-4 h-4" />
                    <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Submitted</span>
                  </div>
                  <p className="font-semibold">{getTimeAgo(todoItem.submittedDate)}</p>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-sm mb-1">
                    <ListTodo className="w-4 h-4" />
                    <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Weight</span>
                  </div>
                  <p className="font-semibold">{todoItem.weight || 50}</p>
                </div>
              </div>

              {/* Completion Details */}
              {todoItem.completionDetails && (
                <div className={`p-4 rounded-lg mb-4 ${darkMode ? 'bg-zinc-700' : 'bg-blue-50'}`}>
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 text-blue-600" />
                    <div>
                      <p className="text-sm font-semibold mb-1">Completion Notes:</p>
                      <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {todoItem.completionDetails}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => handleApproveTodoItem(todoItem)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                >
                  <CheckCircle className="w-5 h-5" />
                  Approve
                </button>
                <button
                  onClick={() => {
                    setSelectedTodoItem(todoItem);
                    setShowRejectModal(true);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                >
                  <X className="w-5 h-5" />
                  Request Revision
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      <RejectModal
        isOpen={showRejectModal}
        onClose={() => {
          setShowRejectModal(false);
          setSelectedTodoItem(null);
        }}
        onConfirm={handleRejectTodoItem}
        darkMode={darkMode}
        title="Request Revision"
      />
    </div>
  );
};

export default TeamLeaderApprovals;

