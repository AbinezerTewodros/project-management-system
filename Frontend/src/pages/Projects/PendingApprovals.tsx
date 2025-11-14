import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle, Clock, AlertCircle, FileText } from "lucide-react";
import { projectService } from "@/services/projectService";
import { useAuth } from "@/context/AuthContext";
import { PendingProjectApproval } from "@/types/approval";
import { useNotifications } from "@/context/NotificationContext";

interface PendingApprovalsProps {
  darkMode: boolean;
  showHeader?: boolean;
}

const PendingApprovals = ({ darkMode, showHeader = true }: PendingApprovalsProps) => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [pendingProjects, setPendingProjects] = useState<PendingProjectApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedProject, setSelectedProject] = useState<PendingProjectApproval | null>(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");

  // Fetch pending approvals
  const fetchPendingApprovals = async () => {
    setLoading(true);
    try {
      console.log('📋 Fetching pending approvals...');
      const response = await projectService.getPendingApprovals();
      
      console.log('📋 Pending approvals response:', response);
      
      if (response.success && response.data) {
        const projects = Array.isArray(response.data) ? response.data : [];
        console.log('✅ Loaded pending projects:', projects.length);
        setPendingProjects(projects);
      } else {
        console.warn('⚠️ No pending approvals found');
        setPendingProjects([]);
      }
    } catch (error) {
      console.error('❌ Error fetching pending approvals:', error);
      addNotification({
        type: "error",
        title: "Error Loading Approvals",
        message: "Failed to load pending approvals. Please try again.",
        category: "PROJECT_UPDATE",
        userId: user?.id || "",
      });
      setPendingProjects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingApprovals();
  }, []);

  // Handle approve
  const handleApprove = async () => {
    if (!selectedProject) return;

    setActionLoading(true);
    try {
      console.log('✅ Approving project:', selectedProject.projectId);
      const response = await projectService.approveProject(selectedProject.projectId, approvalNotes);
      
      if (response.success) {
        console.log('✅ Project approved successfully');
        
        addNotification({
          type: "success",
          title: "Project Approved",
          message: `Project "${selectedProject.projectName}" has been approved successfully.`,
          category: "PROJECT_UPDATE",
          userId: user?.id || "",
        });

        // Remove from pending list
        setPendingProjects(prev => prev.filter(p => p.projectId !== selectedProject.projectId));
        setShowApproveDialog(false);
        setSelectedProject(null);
        setApprovalNotes("");
      } else {
        throw new Error(response.message || 'Approval failed');
      }
    } catch (error: any) {
      console.error('❌ Error approving project:', error);
      addNotification({
        type: "error",
        title: "Approval Failed",
        message: error.message || "Failed to approve project. Please try again.",
        category: "PROJECT_UPDATE",
        userId: user?.id || "",
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle reject
  const handleReject = async () => {
    if (!selectedProject || !rejectionReason.trim()) return;

    setActionLoading(true);
    try {
      console.log('❌ Rejecting project:', selectedProject.projectId);
      const response = await projectService.rejectProject(selectedProject.projectId, rejectionReason);
      
      if (response.success) {
        console.log('✅ Project rejected successfully');
        
        addNotification({
          type: "warning",
          title: "Project Rejected",
          message: `Project "${selectedProject.projectName}" has been rejected.`,
          category: "PROJECT_UPDATE",
          userId: user?.id || "",
        });

        // Remove from pending list
        setPendingProjects(prev => prev.filter(p => p.projectId !== selectedProject.projectId));
        setShowRejectDialog(false);
        setSelectedProject(null);
        setRejectionReason("");
      } else {
        throw new Error(response.message || 'Rejection failed');
      }
    } catch (error: any) {
      console.error('❌ Error rejecting project:', error);
      addNotification({
        type: "error",
        title: "Rejection Failed",
        message: error.message || "Failed to reject project. Please try again.",
        category: "PROJECT_UPDATE",
        userId: user?.id || "",
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Priority badge color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'High':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'Low':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  if (loading) {
    return (
      <div className={`p-6 ${darkMode ? 'bg-zinc-900 text-white' : 'bg-white'}`}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading pending approvals...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`max-w-8xl mx-auto ${darkMode ? 'bg-zinc-900 text-white' : 'bg-white'}`}>
      <div >
        {/* Header */}
          {showHeader !== false && (
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Pending Project Approvals</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Review and approve projects created by team members
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className={darkMode ? 'bg-zinc-800 border-zinc-700' : ''}>
          <CardHeader >
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Pending Approvals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Clock className="h-7 w-7 text-yellow-500 mr-3" />
              <span className="text-3xl font-bold">{pendingProjects.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card className={darkMode ? 'bg-zinc-800 border-zinc-700' : ''}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              High Priority
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <AlertCircle className="h-7 w-7 text-red-500 mr-3" />
              <span className="text-3xl font-bold">
                {pendingProjects.filter(p => p.priority === 'High' || p.priority === 'Critical').length}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className={darkMode ? 'bg-zinc-800 border-zinc-700' : ''}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Your Role
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <CheckCircle className="h-7 w-7 text-green-500 mr-3" />
              <span className="text-2xl font-bold capitalize">{user?.role || 'Manager'}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Projects List */}
      {pendingProjects.length === 0 ? (
        <Card className={darkMode ? 'bg-zinc-800 border-zinc-700' : ''}>
          <CardContent className="py-12">
            <div className="text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">All Caught Up!</h3>
              <p className="text-gray-600 dark:text-gray-400">
                There are no pending project approvals at this time.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {pendingProjects.map((project) => (
            <Card key={project.projectId} className={darkMode ? 'bg-zinc-800 border-zinc-700' : 'hover:shadow-lg transition-shadow'}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2 flex items-center gap-2">
                      <FileText className="h-5 w-5 text-purple-600" />
                      {project.projectName}
                    </CardTitle>
                    <CardDescription className={darkMode ? 'text-gray-400' : ''}>
                      {project.description || 'No description provided'}
                    </CardDescription>
                  </div>
                  <Badge className={getPriorityColor(project.priority)}>
                    {project.priority}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Department</p>
                    <p className="font-medium">{project.department || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Project Owner</p>
                    <p className="font-medium">{project.projectOwner}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Created By</p>
                    <p className="font-medium">{project.createdBy}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Due Date</p>
                    <p className="font-medium">
                      {project.dueDate ? new Date(project.dueDate).toLocaleDateString() : 'Not set'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-4 border-t dark:border-zinc-700">
                  <Button
                    onClick={() => {
                      setSelectedProject(project);
                      setShowApproveDialog(true);
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white"
                    disabled={actionLoading}
                  >
                    <CheckCircle className="h-3 w-3 mr-2" />
                    Approve
                  </Button>
                  <Button
                    onClick={() => {
                      setSelectedProject(project);
                      setShowRejectDialog(true);
                    }}
                    variant="destructive"
                    disabled={actionLoading}
                  >
                    <XCircle className="h-3 w-3 mr-2" />
                    Reject
                  </Button>
                  <div className="ml-auto text-sm text-gray-500 dark:text-gray-400">
                    <Clock className="h-3 w-3 inline mr-1" />
                    Submitted {new Date(project.createdDate).toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent className={darkMode ? 'bg-zinc-800 border-zinc-700' : ''}>
          <DialogHeader>
            <DialogTitle>Approve Project</DialogTitle>
            <DialogDescription className={darkMode ? 'text-gray-400' : ''}>
              You are about to approve "{selectedProject?.projectName}". This will activate the project.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="approval-notes">Approval Notes (Optional)</Label>
              <Textarea
                id="approval-notes"
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                placeholder="Add any notes or comments..."
                className={darkMode ? 'bg-zinc-700 border-zinc-600' : ''}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowApproveDialog(false);
                setApprovalNotes("");
                setSelectedProject(null);
              }}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleApprove}
              className="bg-green-600 hover:bg-green-700 text-white"
              disabled={actionLoading}
            >
              {actionLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Approving...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirm Approval
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className={darkMode ? 'bg-zinc-800 border-zinc-700' : ''}>
          <DialogHeader>
            <DialogTitle>Reject Project</DialogTitle>
            <DialogDescription className={darkMode ? 'text-gray-400' : ''}>
              You are about to reject "{selectedProject?.projectName}". Please provide a reason.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="rejection-reason">
                Rejection Reason <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="rejection-reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Explain why this project is being rejected..."
                className={darkMode ? 'bg-zinc-700 border-zinc-600' : ''}
                rows={4}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                The project creator will see this reason
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectDialog(false);
                setRejectionReason("");
                setSelectedProject(null);
              }}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleReject}
              variant="destructive"
              disabled={actionLoading || !rejectionReason.trim()}
            >
              {actionLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Rejecting...
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Confirm Rejection
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
        </div>
      
    </div>
  );
};

export default PendingApprovals;

