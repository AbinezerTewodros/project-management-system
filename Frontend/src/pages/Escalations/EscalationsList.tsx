import React from 'react';
import { Megaphone, Mail, X, Loader2, AlertCircle } from 'lucide-react';
import AttachmentUploader, { AttachmentItem } from '../../components/AttachmentUploader';
import { escalationService, EscalationDto, SendEscalationDto, EscalationStatus } from '@/services/escalationService';
import { userService, UserSummary } from '@/services/userService';
import { useAuth } from '@/context/AuthContext';

// Using backend types from escalationService
type EscalationItem = EscalationDto;

// No more mock data - using real backend data

const formatDate = (iso?: string) => (iso ? new Date(iso).toLocaleString() : '—');

const EscalationsList: React.FC<{ darkMode?: boolean }> = ({ darkMode = false }) => {
  const { user } = useAuth();
  const [filterStatus, setFilterStatus] = React.useState<string>('All');
  const [viewMode, setViewMode] = React.useState<'received' | 'sent'>('received');
  const [search, setSearch] = React.useState<string>('');
  const [items, setItems] = React.useState<EscalationItem[]>([]);
  const [receivedCount, setReceivedCount] = React.useState(0);
  const [sentCount, setSentCount] = React.useState(0);
  const [selected, setSelected] = React.useState<EscalationItem | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [users, setUsers] = React.useState<UserSummary[]>([]);

  // Fetch escalations on mount and when view mode changes
  React.useEffect(() => {
    loadEscalations();
  }, [viewMode]);

  // Fetch users for recipient selection
  React.useEffect(() => {
    loadUsers();
  }, []);

  const loadEscalations = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('🔄 Loading escalations, mode:', viewMode);
      
      // Load both received and sent to get accurate counts
      const [receivedResponse, sentResponse] = await Promise.all([
        escalationService.getReceivedEscalations(),
        escalationService.getSentEscalations()
      ]);
      
      // Update counts
      setReceivedCount(receivedResponse.success && receivedResponse.data ? receivedResponse.data.length : 0);
      setSentCount(sentResponse.success && sentResponse.data ? sentResponse.data.length : 0);
      
      // Set items based on current view mode
      const response = viewMode === 'received' ? receivedResponse : sentResponse;
      
      if (response.success && response.data) {
        console.log('✅ Loaded escalations:', response.data);
        setItems(response.data);
      } else {
        console.warn('⚠️ Failed to load escalations:', response.message);
        setError(response.message || 'Failed to load escalations');
        setItems([]);
      }
    } catch (err: any) {
      console.error('❌ Error loading escalations:', err);
      setError(err.message || 'Error loading escalations');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await userService.getAllUsers();
      if (response.success && response.data) {
        setUsers(response.data);
        console.log('✅ Loaded users:', response.data.length);
      }
    } catch (err) {
      console.error('❌ Error loading users:', err);
    }
  };

  const getStatusString = (status: EscalationStatus): string => {
    return escalationService.getStatusLabel(status);
  };

  const filtered = items.filter((e) => {
    // Filter by status
    if (filterStatus && filterStatus !== 'All') {
      const statusLabel = getStatusString(e.status);
      if (statusLabel !== filterStatus) return false;
    }
    // Search filter
    if (search) {
      const s = search.toLowerCase();
      return (
        e.title.toLowerCase().includes(s) ||
        e.content.toLowerCase().includes(s) ||
        e.senderId.toLowerCase().includes(s)
      );
    }
    return true;
  });

  const [showNewModal, setShowNewModal] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [newEsc, setNewEsc] = React.useState<Partial<SendEscalationDto>>({
    title: '',
    type: 'Technical',
    content: '',
    projectId: undefined,
    milestoneId: undefined,
    projectTaskId: undefined,
    independentTaskId: undefined,
    userIds: [],
    responseTimeLimit: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days default
  });
  const [newEscAttachments, setNewEscAttachments] = React.useState<AttachmentItem[]>([]);
  const [selectedUserIds, setSelectedUserIds] = React.useState<string[]>([]);

  const createEscalation = async () => {
    // Validation
    if (!newEsc.title || !newEsc.content) {
      alert('Title and content are required');
      return;
    }
    if (!selectedUserIds.length) {
      alert('Please select at least one recipient');
      return;
    }

    setSubmitting(true);
    try {
      const dto: SendEscalationDto = {
        title: newEsc.title,
        type: newEsc.type || 'Technical',
        content: newEsc.content,
        projectId: newEsc.projectId || null,
        projectTaskId: newEsc.projectTaskId || null,
        independentTaskId: newEsc.independentTaskId || null,
        milestoneId: newEsc.milestoneId || null,
        userIds: selectedUserIds,
        attachmentId: newEscAttachments.length > 0 ? newEscAttachments[0].blobId : undefined,
        responseTimeLimit: newEsc.responseTimeLimit || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: EscalationStatus.Active,
      };

      console.log('📤 Sending escalation:', dto);
      const response = await escalationService.sendEscalation(dto);
      
      if (response.success) {
        console.log('✅ Escalation sent successfully');
        alert('Escalation sent successfully!');
        setShowNewModal(false);
        // Reset form
        setNewEsc({
          title: '',
          type: 'Technical',
          content: '',
          projectId: undefined,
          milestoneId: undefined,
          projectTaskId: undefined,
          independentTaskId: undefined,
          userIds: [],
          responseTimeLimit: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        });
        setSelectedUserIds([]);
        setNewEscAttachments([]);
        // Reload escalations
        loadEscalations();
      } else {
        console.error('❌ Failed to send escalation:', response.message);
        alert(`Failed to send escalation: ${response.message}`);
      }
    } catch (err: any) {
      console.error('❌ Error sending escalation:', err);
      alert(`Error sending escalation: ${err.message || 'Unknown error'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkAsRead = async (escalationId: number) => {
    try {
      const response = await escalationService.markAsRead(escalationId);
      if (response.success) {
        console.log('✅ Marked as read');
        setSelected(null);
        loadEscalations();
      } else {
        alert('Failed to mark as read');
      }
    } catch (err: any) {
      console.error('❌ Error marking as read:', err);
      alert('Error marking as read');
    }
  };

  const handleResolve = async (escalationId: number) => {
    try {
      const response = await escalationService.resolveEscalation(escalationId);
      if (response.success) {
        console.log('✅ Escalation resolved');
        alert('Escalation marked as resolved!');
        setSelected(null);
        loadEscalations();
      } else {
        alert('Failed to resolve escalation');
      }
    } catch (err: any) {
      console.error('❌ Error resolving escalation:', err);
      alert('Error resolving escalation');
    }
  };

  return (
    <div className={`min-h-screen p-8 ${darkMode ? 'bg-zinc-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: darkMode ? '#f3f4f6' : '#2c0340' }}>
            Escalation Management
          </h1>
          <p className={`text-base ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Manage and track escalations across your organization
          </p>
        </div>

        {error && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${darkMode ? 'bg-red-900/20 border-2 border-red-700' : 'bg-red-50 border-2 border-red-200'}`}>
            <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
            <div>
              <p className={`font-semibold ${darkMode ? 'text-red-200' : 'text-red-800'}`}>Error Loading Escalations</p>
              <p className={`text-sm ${darkMode ? 'text-red-300' : 'text-red-700'}`}>{error}</p>
            </div>
          </div>
        )}

        {/* Controls Section */}
        <div className={`mb-6 p-6 rounded-xl shadow-sm ${darkMode ? 'bg-zinc-800' : 'bg-white'}`}>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              {/* View mode toggle */}
              <div className="flex items-center gap-2 p-1 rounded-lg" style={{ background: darkMode ? '#1f2937' : '#f3f4f6' }}>
                <button
                  onClick={() => setViewMode('received')}
                  className={`px-5 py-2.5 rounded-lg font-semibold transition-all duration-200 ${
                    viewMode === 'received' 
                      ? 'bg-[#581c87] text-white shadow-md' 
                      : darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  📥 Received ({receivedCount})
                </button>
                <button
                  onClick={() => setViewMode('sent')}
                  className={`px-5 py-2.5 rounded-lg font-semibold transition-all duration-200 ${
                    viewMode === 'sent' 
                      ? 'bg-[#581c87] text-white shadow-md' 
                      : darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  📤 Sent ({sentCount})
                </button>
              </div>

              {/* Status Filter */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className={`px-4 py-2.5 rounded-lg border-2 font-medium transition-all ${
                  darkMode 
                    ? 'bg-zinc-700 border-zinc-600 text-gray-200 hover:border-zinc-500' 
                    : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                }`}
              >
                <option value="All">All Status</option>
                <option value="Active">🟡 Active</option>
                <option value="Responded">💬 Responded</option>
                <option value="Escalated">⬆️ Escalated</option>
                <option value="Resolved">✅ Resolved</option>
                <option value="Closed">🔒 Closed</option>
              </select>
            </div>

            <div className="flex items-center gap-3">
              {/* Search */}
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="🔍 Search escalations..."
                className={`px-4 py-2.5 rounded-lg border-2 w-80 transition-all ${
                  darkMode 
                    ? 'bg-zinc-700 border-zinc-600 text-gray-200 placeholder-gray-500 focus:border-[#581c87]' 
                    : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-[#581c87]'
                }`}
              />

              {/* New Escalation Button */}
              <button 
                className="px-5 py-2.5 rounded-lg font-semibold flex items-center gap-2 transition-all duration-200 hover:shadow-lg transform hover:scale-105" 
                style={{ background: '#581c87', color: '#ffffff' }} 
                onClick={() => setShowNewModal(true)}
              >
                <Megaphone className="w-5 h-5" />
                New Escalation
              </button>
            </div>
          </div>
        </div>

        {/* Escalations List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center p-16">
            <Loader2 className="w-12 h-12 animate-spin text-[#581c87] mb-4" />
            <span className={`text-lg font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Loading escalations...
            </span>
          </div>
        ) : (
        <div className="grid grid-cols-1 gap-4">
        {filtered.length === 0 ? (
          <div className={`p-12 rounded-xl text-center ${darkMode ? 'bg-zinc-800' : 'bg-white'} shadow-sm`}>
            <div className="text-6xl mb-4">📭</div>
            <div className="text-xl font-bold mb-2" style={{ color: darkMode ? '#f3f4f6' : '#1f1140' }}>
              No Escalations Found
            </div>
            <div className="text-base" style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}>
              {search ? (
                <>
                  No escalations match <span className="font-semibold">"${search}"</span>. Try different keywords.
                </>
              ) : (
                `You have no ${viewMode === 'received' ? 'received' : 'sent'} escalations ${filterStatus !== 'All' ? `with status "${filterStatus}"` : 'yet'}.`
              )}
            </div>
            {viewMode === 'received' && !search && filterStatus === 'All' && (
              <p className={`mt-4 text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                When someone escalates an issue to you, it will appear here.
              </p>
            )}
          </div>
        ) : (
          filtered.map((e) => (
            <div key={e.id} className={`p-5 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 flex items-start justify-between border-2 ${
              darkMode ? 'bg-zinc-800 border-zinc-700 hover:border-[#581c87]' : 'bg-white border-gray-100 hover:border-[#581c87]'
            }`}>
              <div className="flex items-start gap-4">
                <div className="rounded-xl p-3 flex-shrink-0" style={{ background: darkMode ? '#581c8720' : '#f8f6ff' }}>
                  <Mail className="w-6 h-6 text-[#581c87]" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <h3 className="font-bold text-lg" style={{ color: darkMode ? '#f3f4f6' : '#1f1140' }}>
                      {e.title}
                    </h3>
                    <span className="text-xs font-semibold rounded-lg px-3 py-1" style={{ background: darkMode ? '#581c8740' : '#f1eefb', color: '#581c87' }}>
                      {e.type}
                    </span>
                    <span className="text-xs font-semibold rounded-lg px-3 py-1" style={{ 
                      background: e.status === EscalationStatus.Resolved ? '#dcfce7' : 
                                 e.status === EscalationStatus.Active ? '#fef3c7' : 
                                 e.status === EscalationStatus.Escalated ? '#dbeafe' : '#e5e7eb',
                      color: e.status === EscalationStatus.Resolved ? '#166534' : 
                             e.status === EscalationStatus.Active ? '#92400e' : 
                             e.status === EscalationStatus.Escalated ? '#1e40af' : '#374151'
                    }}>
                      {getStatusString(e.status)}
                    </span>
                    {!e.isRead && viewMode === 'received' && (
                      <span className="text-xs font-bold text-white bg-gradient-to-r from-red-500 to-pink-500 rounded-full px-3 py-1 animate-pulse">
                        🔔 New
                      </span>
                    )}
                  </div>
                  <p className={`text-sm mb-3 leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {e.content.slice(0, 160)}{e.content.length > 160 ? '…' : ''}
                  </p>
                  
                  <div className="flex items-center gap-4 text-xs" style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}>
                    <span>👤 <strong>{e.senderId}</strong></span>
                    <span>📊 Level {e.escalationLevel}</span>
                    <span>🕐 {formatDate(e.timeSent)}</span>
                  </div>
                  
                </div>
              </div>

              <button 
                className="px-5 py-2.5 rounded-lg font-semibold transition-all duration-200 hover:shadow-md flex-shrink-0" 
                style={{ background: '#581c87', color: '#ffffff' }} 
                onClick={() => setSelected(e)}
              >
                View Details
              </button>
            </div>
          ))
        )}
        </div>
        )}
      </div>

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className={`w-full max-w-2xl rounded-2xl shadow-2xl ${darkMode ? 'bg-zinc-900 text-gray-100' : 'bg-white text-gray-900'}`}>
            {/* Modal Header */}
            <div className={`p-6 border-b-2 ${darkMode ? 'border-zinc-800' : 'border-gray-100'}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-2" style={{ color: darkMode ? '#f3f4f6' : '#2c0340' }}>
                    {selected.title}
                  </h2>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold rounded-lg px-3 py-1" style={{ background: darkMode ? '#581c8740' : '#f1eefb', color: '#581c87' }}>
                      {selected.type}
                    </span>
                    <span className="text-xs font-semibold rounded-lg px-3 py-1" style={{ 
                      background: selected.status === EscalationStatus.Resolved ? '#dcfce7' : 
                                 selected.status === EscalationStatus.Active ? '#fef3c7' : 
                                 selected.status === EscalationStatus.Escalated ? '#dbeafe' : '#e5e7eb',
                      color: selected.status === EscalationStatus.Resolved ? '#166534' : 
                             selected.status === EscalationStatus.Active ? '#92400e' : 
                             selected.status === EscalationStatus.Escalated ? '#1e40af' : '#374151'
                    }}>
                      {getStatusString(selected.status)}
                    </span>
                    {!selected.isRead && viewMode === 'received' && (
                      <span className="text-xs font-bold text-white bg-gradient-to-r from-red-500 to-pink-500 rounded-full px-3 py-1">
                        🔔 Unread
                      </span>
                    )}
                  </div>
                </div>
                <button 
                  className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-zinc-800' : 'hover:bg-gray-100'}`} 
                  onClick={() => setSelected(null)}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              <div>
                <h3 className={`text-sm font-semibold mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>MESSAGE</h3>
                <p className={`text-base leading-relaxed ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                  {selected.content}
                </p>
              </div>

              <div className={`grid grid-cols-2 gap-4 p-4 rounded-xl ${darkMode ? 'bg-zinc-800' : 'bg-gray-50'}`}>
                <div>
                  <p className={`text-xs font-semibold mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>SENDER</p>
                  <p className={`font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{selected.senderId}</p>
                </div>
                <div>
                  <p className={`text-xs font-semibold mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>SENT ON</p>
                  <p className={`font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{formatDate(selected.timeSent)}</p>
                </div>
                <div>
                  <p className={`text-xs font-semibold mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>PROJECT ID</p>
                  <p className={`font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{selected.projectId ?? 'N/A'}</p>
                </div>
                <div>
                  <p className={`text-xs font-semibold mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>ESCALATION LEVEL</p>
                  <p className={`font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>Level {selected.escalationLevel}</p>
                </div>
                {selected.attachmentId && (
                  <div className="col-span-2">
                    <p className={`text-xs font-semibold mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>ATTACHMENT</p>
                    <p className={`font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>📎 {selected.attachmentId}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className={`p-6 border-t-2 flex justify-end gap-3 ${darkMode ? 'border-zinc-800' : 'border-gray-100'}`}>
              {viewMode === 'received' && !selected.isRead && (
                <button 
                  className={`px-5 py-2.5 rounded-lg font-semibold border-2 transition-all ${darkMode ? 'border-zinc-700 hover:bg-zinc-800' : 'border-gray-300 hover:bg-gray-50'}`}
                  onClick={() => handleMarkAsRead(selected.id)}
                >
                  Mark as Read
                </button>
              )}
              {viewMode === 'received' && selected.status === EscalationStatus.Active && (
                <button 
                  className="px-5 py-2.5 rounded-lg font-semibold transition-all hover:shadow-lg" 
                  style={{ background: '#16a34a', color: '#fff' }}
                  onClick={() => handleResolve(selected.id)}
                >
                  ✅ Resolve
                </button>
              )}
              <button 
                className={`px-5 py-2.5 rounded-lg font-semibold border-2 transition-all ${darkMode ? 'border-zinc-700 hover:bg-zinc-800' : 'border-gray-300 hover:bg-gray-50'}`}
                onClick={() => setSelected(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Escalation modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className={`w-full max-w-3xl rounded-2xl shadow-2xl ${darkMode ? 'bg-zinc-900 text-gray-100' : 'bg-white text-gray-900'} my-8`}>
            <div className={`flex items-center justify-between p-6 border-b-2 ${darkMode ? 'border-zinc-800' : 'border-gray-100'}`}>
              <div>
                <h3 className="text-2xl font-bold" style={{ color: darkMode ? '#f3f4f6' : '#2c0340' }}>Create New Escalation</h3>
                <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Send an escalation to your team members</p>
              </div>
              <button 
                className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-zinc-800' : 'hover:bg-gray-100'}`} 
                onClick={() => setShowNewModal(false)}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
              <div>
                <label className={`text-sm font-semibold block mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  RECIPIENTS (select one or more) *
                </label>
                <select 
                  multiple 
                  size={5}
                  value={selectedUserIds} 
                  onChange={(e) => {
                    const options = Array.from(e.target.selectedOptions, option => option.value);
                    setSelectedUserIds(options);
                  }} 
                  className={`w-full px-4 py-2 border-2 rounded-lg transition-all ${darkMode ? 'bg-zinc-800 border-zinc-700 text-gray-200' : 'bg-white border-gray-200 text-gray-900'}`}
                >
                  {users.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.firstName} {u.lastName} ({u.email}) {u.department ? `- ${u.department}` : ''}
                    </option>
                  ))}
                </select>
                <p className={`text-xs mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>💡 Hold Ctrl/Cmd to select multiple recipients</p>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className={`text-sm font-semibold block mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>TYPE *</label>
                  <select value={newEsc.type} onChange={(e) => setNewEsc(s => ({ ...s, type: e.target.value }))} className={`w-full px-4 py-2 border-2 rounded-lg transition-all ${darkMode ? 'bg-zinc-800 border-zinc-700 text-gray-200' : 'bg-white border-gray-200 text-gray-900'}`}>
                    <option>Technical</option>
                    <option>Process</option>
                    <option>Clarification</option>
                    <option>Other</option>
                  </select>
                </div>

                <div>
                  <label className={`text-sm font-semibold block mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>TITLE *</label>
                  <input value={newEsc.title || ''} onChange={(e) => setNewEsc(s => ({ ...s, title: e.target.value }))} className={`w-full px-4 py-2 border-2 rounded-lg transition-all ${darkMode ? 'bg-zinc-800 border-zinc-700 text-gray-200' : 'bg-white border-gray-200 text-gray-900'}`} placeholder="Enter escalation title" />
                </div>
                <div>
                  <label className={`text-sm font-semibold block mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>PROJECT ID (optional)</label>
                  <input value={newEsc.projectId ?? ''} onChange={(e) => setNewEsc(s => ({ ...s, projectId: e.target.value ? Number(e.target.value) : undefined }))} className={`w-full px-4 py-2 border-2 rounded-lg transition-all ${darkMode ? 'bg-zinc-800 border-zinc-700 text-gray-200' : 'bg-white border-gray-200 text-gray-900'}`} placeholder="Optional project ID" />
                </div>
              </div>

              <div>
                <label className={`text-sm font-semibold block mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>MESSAGE *</label>
                <textarea value={newEsc.content || ''} onChange={(e) => setNewEsc(s => ({ ...s, content: e.target.value }))} rows={6} className={`w-full px-4 py-2 border-2 rounded-lg transition-all ${darkMode ? 'bg-zinc-800 border-zinc-700 text-gray-200' : 'bg-white border-gray-200 text-gray-900'}`} placeholder="Describe the issue, impact, requested action, and deadlines..." />
              </div>

              <div>
                <label className={`text-sm font-semibold block mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>ATTACHMENT (optional)</label>
                <AttachmentUploader darkMode={darkMode} attachmentList={newEscAttachments} setAttachmentList={setNewEscAttachments} uploadedBy={user?.id || 'system'} />
              </div>
            </div>

            <div className={`p-6 border-t-2 flex justify-end gap-3 ${darkMode ? 'border-zinc-800' : 'border-gray-100'}`}>
              <button 
                className={`px-6 py-3 rounded-lg font-semibold border-2 transition-all ${darkMode ? 'border-zinc-700 hover:bg-zinc-800' : 'border-gray-300 hover:bg-gray-50'}`}
                onClick={() => setShowNewModal(false)} 
                disabled={submitting}
              >
                Cancel
              </button>
              <button 
                className="px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed" 
                style={{ background: submitting ? '#9ca3af' : '#581c87', color: '#fff' }} 
                onClick={createEscalation}
                disabled={submitting}
              >
                {submitting && <Loader2 className="w-5 h-5 animate-spin" />}
                {submitting ? 'Sending...' : '📤 Submit Escalation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EscalationsList;
