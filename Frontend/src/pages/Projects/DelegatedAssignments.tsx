import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from 'react-router-dom';
import { Calendar, Flag, Target, Clock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { milestoneService } from '@/services/milestoneService';

interface DelegatedMilestonesViewProps {
  darkMode: boolean;
  showHeader?: boolean;
}

const DelegatedAssignments = ({ darkMode, showHeader }: DelegatedMilestonesViewProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [myMilestones, setMyMilestones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMilestone, setSelectedMilestone] = useState<any | null>(null);
  
  // Milestone Accept/Reject Dialog State
  const [showMilestoneApproveDialog, setShowMilestoneApproveDialog] = useState(false);
  const [showMilestoneRejectDialog, setShowMilestoneRejectDialog] = useState(false);
  const [milestoneToApprove, setMilestoneToApprove] = useState<any | null>(null);
  const [milestoneToReject, setMilestoneToReject] = useState<any | null>(null);
  const [milestoneRejectionReason, setMilestoneRejectionReason] = useState('');
  
  // Milestone Detail View State
  const [showMilestoneDetailView, setShowMilestoneDetailView] = useState(false);

  // Load milestones on component mount
  useEffect(() => {
    loadMilestones();
  }, [user]);

  const loadMilestones = async () => {
    if (!user?.id) {
      console.log('⚠️ No user ID found');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('🔍 Loading delegated milestones...');

      // ✅ Get all milestones - then filter for this user
      const allMilestonesResponse = await milestoneService.getAllMilestones();
      console.log('📡 All milestones API response:', allMilestonesResponse);

      if (allMilestonesResponse.success && Array.isArray(allMilestonesResponse.data)) {
        console.log('📡 Total milestones:', allMilestonesResponse.data.length);
        
        // Filter milestones assigned to this user
        const myMilestonesFiltered = allMilestonesResponse.data.filter((m: any) => {
          return m.assignedMemberId === user.id || m.assignedMemberId === user.employeeId;
        });
        
        setMyMilestones(myMilestonesFiltered);
        console.log('✅ Milestones assigned to me:', myMilestonesFiltered.length);
      } else {
        console.warn('⚠️ No milestones found or not array');
        setMyMilestones([]);
      }
      
    } catch (error) {
      console.error('❌ Error loading milestones:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewMilestone = (milestoneId: number) => {
    console.log('👁️ Viewing milestone:', milestoneId);
    const milestone = myMilestones.find(m => (m.milestoneId || m.id) === milestoneId);
    if (milestone) {
      setSelectedMilestone(milestone);
      setShowMilestoneDetailView(true);
    } else {
      console.error('❌ Milestone not found:', milestoneId);
    }
  };
  
  // ✅ Handle Accept Milestone Assignment
  const handleAcceptMilestone = async () => {
    if (!milestoneToApprove) return;
    
    try {
      console.log('✅ Accepting milestone assignment:', milestoneToApprove.milestoneId || milestoneToApprove.id);
      
      const milestoneId = milestoneToApprove.milestoneId || milestoneToApprove.id;
      
      // ✅ Check if already accepted
      if (milestoneToApprove.assignmentStatus === 'Accepted' || milestoneToApprove.assignmentStatus === 1) {
        alert('This milestone has already been accepted!');
        setShowMilestoneApproveDialog(false);
        return;
      }
      
      // Call backend API
      const response = await milestoneService.acceptMilestoneAssignment(milestoneId);
      console.log('✅ Backend response:', response);
      
      if (response.success || response.status === 204) {
        console.log('✅ Milestone assignment accepted successfully');
        
        // Refresh milestones
        await loadMilestones();
        
        // Close dialog
        setShowMilestoneApproveDialog(false);
        setMilestoneToApprove(null);
        
        alert(`Successfully accepted milestone: ${milestoneToApprove.milestoneName || milestoneToApprove.title}`);
      } else {
        console.error('❌ Failed to accept milestone:', response.message);
        const errorMsg = response.message || response.data || 'Unknown error';
        alert(`Failed to accept milestone: ${errorMsg}`);
      }
    } catch (error: any) {
      console.error('❌ Error accepting milestone:', error);
      const errorMsg = error.message || error.data || 'Unknown error';
      alert(`Failed to accept milestone: ${errorMsg}`);
    }
  };
  
  // ✅ Handle Reject Milestone Assignment
  const handleRejectMilestone = async () => {
    if (!milestoneToReject || !milestoneRejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }
    
    try {
      console.log('❌ Rejecting milestone assignment:', milestoneToReject.milestoneId || milestoneToReject.id);
      const milestoneId = milestoneToReject.milestoneId || milestoneToReject.id;
      
      // Call backend API
      const response = await milestoneService.rejectMilestoneAssignment(milestoneId, milestoneRejectionReason);
      
      if (response.success) {
        console.log('✅ Milestone assignment rejected successfully');
        
        // Refresh milestones
        await loadMilestones();
        
        // Close dialog and reset
        setShowMilestoneRejectDialog(false);
        setMilestoneToReject(null);
        setMilestoneRejectionReason('');
        
        alert(`Successfully rejected milestone: ${milestoneToReject.milestoneName || milestoneToReject.title}`);
      } else {
        console.error('❌ Failed to reject milestone:', response.message);
        alert(`Failed to reject milestone: ${response.message}`);
      }
    } catch (error) {
      console.error('❌ Error rejecting milestone:', error);
      alert('Failed to reject milestone. Please try again.');
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'Pending': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
      'Planning': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'InProgress': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'OnHold': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      'Completed': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'Cancelled': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    };
    return colors[status as keyof typeof colors] || colors['Pending'];
  };

  // Render Milestone Card
  const renderMilestoneCard = (milestone: any) => {
    return (
      <Card 
        key={milestone.milestoneId || milestone.id} 
        className={`mb-4 cursor-pointer hover:shadow-lg transition-shadow ${
          darkMode ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'
        }`}
        onClick={() => handleViewMilestone(milestone.milestoneId || milestone.id)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-500" />
                {milestone.milestoneName || milestone.title}
              </CardTitle>
              {milestone.description && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {milestone.description}
                </p>
              )}
            </div>
            <Badge className={getStatusColor(milestone.status)}>
              {milestone.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Progress Bar */}
            {typeof milestone.progress === 'number' && (
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600 dark:text-gray-400">Progress</span>
                  <span className="font-semibold">{milestone.progress}%</span>
                </div>
                <div className={`w-full h-2 rounded-full ${darkMode ? 'bg-zinc-700' : 'bg-gray-200'}`}>
                  <div
                    className={`h-2 rounded-full ${
                      milestone.progress < 30 ? 'bg-red-500' :
                      milestone.progress < 70 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${milestone.progress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Milestone Info */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              {milestone.dueDate && (
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Calendar className="w-4 h-4" />
                  <span>Due: {formatDate(milestone.dueDate)}</span>
                </div>
              )}
              {milestone.weight && (
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Flag className="w-4 h-4" />
                  <span>Weight: {milestone.weight}</span>
                </div>
              )}
            </div>

            {/* ✅ Accept/Reject Buttons - Only show for Pending milestones */}
            <div className="pt-3 border-t dark:border-zinc-700 space-y-2">
              {/* Show assignment status badge */}
              {milestone.assignmentStatus !== undefined && (
                <div className={`text-xs px-3 py-1 rounded-full text-center font-semibold ${
                  milestone.assignmentStatus === 'Accepted' || milestone.assignmentStatus === 1
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : milestone.assignmentStatus === 'Rejected' || milestone.assignmentStatus === 2
                    ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                }`}>
                  {milestone.assignmentStatus === 'Accepted' || milestone.assignmentStatus === 1 ? '✓ Assignment Accepted' :
                   milestone.assignmentStatus === 'Rejected' || milestone.assignmentStatus === 2 ? '✗ Assignment Rejected' :
                   '⏳ Awaiting Your Response'}
                </div>
              )}
              
              {/* Only show Accept/Reject if Pending */}
              {(milestone.assignmentStatus === 'Pending' || milestone.assignmentStatus === 0 || !milestone.assignmentStatus) && (
                <div className="flex gap-2">
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMilestoneToApprove(milestone);
                      setShowMilestoneApproveDialog(true);
                    }}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  >
                    ✓ Accept
                  </Button>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMilestoneToReject(milestone);
                      setShowMilestoneRejectDialog(true);
                    }}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  >
                    ✗ Reject
                  </Button>
                </div>
              )}
              
              {/* View Details Button - Always show */}
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  handleViewMilestone(milestone.milestoneId || milestone.id);
                }}
                variant="outline"
                className="w-full"
              >
                View Milestone Details
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderEmptyState = (message: string, icon: any = <Target className="w-8 h-8 text-gray-400" />) => (
    <div className={`flex flex-col items-center justify-center py-16 px-4 rounded-lg border-2 border-dashed ${
      darkMode ? 'border-zinc-700 bg-zinc-800' : 'border-gray-300 bg-gray-50'
    }`}>
      <div className={`rounded-full w-16 h-16 flex items-center justify-center mb-4 ${
        darkMode ? 'bg-zinc-700' : 'bg-gray-200'
      }`}>
        {icon}
      </div>
      <h3 className="text-lg font-semibold mb-2">No Milestones Found</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-md">
        {message}
      </p>
    </div>
  );

  if (loading) {
    return (
      <div className={`flex-1 p-6 ${darkMode ? 'bg-zinc-900 text-gray-200' : 'bg-gray-50 text-gray-800'}`}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading your milestones...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex-1 p-6 ${darkMode ? 'bg-zinc-900 text-gray-200' : 'bg-gray-50 text-gray-800'}`}>
      {/* Header (optional - parent can control via showHeader) */}
      {showHeader !== false && (
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Milestones Delegated to Me</h1>
          <p className="text-gray-500 dark:text-gray-400">
            View all milestones assigned to you
          </p>
        </div>
      )}

      {/* Statistics Card */}
      {/* <Card className={darkMode ? 'bg-zinc-800 border-zinc-700' : 'bg-white'}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">My Milestones</p>
              <p className="text-2xl font-bold text-purple-600">{myMilestones.length}</p>
            </div>
            <Target className="w-8 h-8 text-purple-600" />
          </div>
        </CardContent>
      </Card> */}

      {/* Milestones List */}
      <div className="mt-6">
        {myMilestones.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myMilestones.map(milestone => renderMilestoneCard(milestone))}
          </div>
        ) : (
          renderEmptyState(
            "You don't have any milestones assigned to you yet.",
            <Target className="w-8 h-8 text-gray-400" />
          )
        )}
      </div>

      {/* ✅ Milestone Approve Dialog */}
      <Dialog open={showMilestoneApproveDialog} onOpenChange={setShowMilestoneApproveDialog}>
        <DialogContent className={darkMode ? 'bg-zinc-800 border-zinc-700' : 'bg-white'}>
          <DialogHeader>
            <DialogTitle>Accept Milestone Assignment</DialogTitle>
            <DialogDescription className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
              Are you sure you want to accept the assignment to milestone "{milestoneToApprove?.milestoneName || milestoneToApprove?.title}"?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {milestoneToApprove && (
              <div className={`p-4 rounded-lg ${darkMode ? 'bg-zinc-700' : 'bg-gray-100'}`}>
                <p className="text-sm"><strong>Milestone:</strong> {milestoneToApprove.milestoneName || milestoneToApprove.title}</p>
                <p className="text-sm"><strong>Due Date:</strong> {formatDate(milestoneToApprove.dueDate)}</p>
                <p className="text-sm"><strong>Priority:</strong> {milestoneToApprove.priority}</p>
                <p className="text-sm"><strong>Weight:</strong> {milestoneToApprove.weight}</p>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowMilestoneApproveDialog(false);
                  setMilestoneToApprove(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAcceptMilestone}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                ✓ Accept Milestone
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ✅ Milestone Reject Dialog */}
      <Dialog open={showMilestoneRejectDialog} onOpenChange={setShowMilestoneRejectDialog}>
        <DialogContent className={darkMode ? 'bg-zinc-800 border-zinc-700' : 'bg-white'}>
          <DialogHeader>
            <DialogTitle>Reject Milestone Assignment</DialogTitle>
            <DialogDescription className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
              Please provide a reason for rejecting the assignment to "{milestoneToReject?.milestoneName || milestoneToReject?.title}".
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {milestoneToReject && (
              <div className={`p-4 rounded-lg ${darkMode ? 'bg-zinc-700' : 'bg-gray-100'}`}>
                <p className="text-sm"><strong>Milestone:</strong> {milestoneToReject.milestoneName || milestoneToReject.title}</p>
                <p className="text-sm"><strong>Due Date:</strong> {formatDate(milestoneToReject.dueDate)}</p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="milestoneRejectionReason">Reason for Rejection</Label>
              <Textarea
                id="milestoneRejectionReason"
                value={milestoneRejectionReason}
                onChange={(e) => setMilestoneRejectionReason(e.target.value)}
                placeholder="Please explain why you're rejecting this milestone assignment..."
                className={darkMode ? 'bg-zinc-700 border-zinc-600' : ''}
                rows={4}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowMilestoneRejectDialog(false);
                  setMilestoneToReject(null);
                  setMilestoneRejectionReason('');
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleRejectMilestone}
                className="bg-red-600 hover:bg-red-700 text-white"
                disabled={!milestoneRejectionReason.trim()}
              >
                ✗ Reject Milestone
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ✅ Milestone Detail View Dialog */}
      <Dialog open={showMilestoneDetailView} onOpenChange={setShowMilestoneDetailView}>
        <DialogContent className={`max-w-4xl max-h-[90vh] overflow-y-auto ${darkMode ? 'bg-zinc-800 border-zinc-700' : 'bg-white'}`}>
          <DialogHeader>
            <DialogTitle className="text-2xl">Milestone Details</DialogTitle>
          </DialogHeader>
          {selectedMilestone && (
            <div className="space-y-6 mt-4">
              {/* Milestone Info */}
              <div className={`p-4 rounded-lg ${darkMode ? 'bg-zinc-700' : 'bg-gray-100'}`}>
                <h3 className="text-xl font-bold mb-2">{selectedMilestone.milestoneName || selectedMilestone.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {selectedMilestone.description || 'No description provided.'}
                </p>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  {/* ✅ Assignment Status */}
                  <div className="col-span-2 md:col-span-3">
                    <span className="text-gray-500 dark:text-gray-400">Assignment Status:</span>
                    <span className={`ml-2 px-3 py-1 rounded-full text-xs font-semibold ${
                      selectedMilestone.assignmentStatus === 'Accepted' || selectedMilestone.assignmentStatus === 1
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : selectedMilestone.assignmentStatus === 'Rejected' || selectedMilestone.assignmentStatus === 2
                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                    }`}>
                      {selectedMilestone.assignmentStatus === 'Accepted' || selectedMilestone.assignmentStatus === 1 ? '✓ You Accepted This Assignment' :
                       selectedMilestone.assignmentStatus === 'Rejected' || selectedMilestone.assignmentStatus === 2 ? '✗ You Rejected This Assignment' :
                       '⏳ Awaiting Your Response'}
                    </span>
                  </div>
                  
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Work Status:</span>
                    <span className="ml-2 font-semibold">{selectedMilestone.status}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Priority:</span>
                    <span className="ml-2 font-semibold">{selectedMilestone.priority}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Weight:</span>
                    <span className="ml-2 font-semibold">{selectedMilestone.weight}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Due Date:</span>
                    <span className="ml-2 font-semibold">{formatDate(selectedMilestone.dueDate)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Progress:</span>
                    <span className="ml-2 font-semibold">{selectedMilestone.progress}%</span>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              {typeof selectedMilestone.progress === 'number' && (
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600 dark:text-gray-400">Overall Progress</span>
                    <span className="font-semibold">{selectedMilestone.progress}%</span>
                  </div>
                  <div className={`w-full h-3 rounded-full ${darkMode ? 'bg-zinc-700' : 'bg-gray-200'}`}>
                    <div
                      className={`h-3 rounded-full transition-all ${
                        selectedMilestone.progress < 30 ? 'bg-red-500' :
                        selectedMilestone.progress < 70 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${selectedMilestone.progress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Action Buttons - Only show if Pending */}
              {(selectedMilestone.assignmentStatus === 'Pending' || selectedMilestone.assignmentStatus === 0 || !selectedMilestone.assignmentStatus) ? (
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      setShowMilestoneDetailView(false);
                      setMilestoneToApprove(selectedMilestone);
                      setShowMilestoneApproveDialog(true);
                    }}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  >
                    ✓ Accept Milestone
                  </Button>
                  <Button
                    onClick={() => {
                      setShowMilestoneDetailView(false);
                      setMilestoneToReject(selectedMilestone);
                      setShowMilestoneRejectDialog(true);
                    }}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  >
                    ✗ Reject Milestone
                  </Button>
                </div>
              ) : (
                <div className={`p-4 text-center rounded-lg ${
                  selectedMilestone.assignmentStatus === 'Accepted' || selectedMilestone.assignmentStatus === 1
                    ? 'bg-green-100 dark:bg-green-900/30'
                    : 'bg-red-100 dark:bg-red-900/30'
                }`}>
                  <p className="text-sm font-semibold">
                    {selectedMilestone.assignmentStatus === 'Accepted' || selectedMilestone.assignmentStatus === 1
                      ? '✅ Assignment Already Accepted'
                      : '❌ Assignment Already Rejected'}
                  </p>
                </div>
              )}

              <Button
                variant="outline"
                onClick={() => {
                  setShowMilestoneDetailView(false);
                  setSelectedMilestone(null);
                }}
                className="w-full"
              >
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DelegatedAssignments;