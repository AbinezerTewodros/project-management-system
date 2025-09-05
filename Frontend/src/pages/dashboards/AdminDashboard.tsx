import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { User } from '@/types/auth';
import { toast } from "react-hot-toast";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pencil, Trash2, Undo2 } from "lucide-react";

interface AdminDashboardProps {
    darkMode: boolean;
    setDarkMode: (darkMode: boolean) => void;
    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
}

const AdminDashboard = ({ darkMode, setDarkMode, sidebarOpen, setSidebarOpen }: AdminDashboardProps) => {
    const { getPendingUsers, getApprovedUsers, getRejectedUsers, approveUser, rejectUser, updateUserRole, deleteUser } = useAuth();
    const [pendingUsers, setPendingUsers] = useState<User[]>([]);
    const [approvedUsers, setApprovedUsers] = useState<User[]>([]);
    const [rejectedUsers, setRejectedUsers] = useState<User[]>([]);
    const [activeTab, setActiveTab] = useState<"pending" | "approved" | "rejected">("pending");
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [newRole, setNewRole] = useState<string>("");
    const [deletingUser, setDeletingUser] = useState<User | null>(null);
    const [deleteReason, setDeleteReason] = useState<string>("");

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = () => {
        setPendingUsers(getPendingUsers());
        setApprovedUsers(getApprovedUsers());
        setRejectedUsers(getRejectedUsers());
    };

    const handleApprove = async (userId: string) => {
        try {
            await approveUser(userId);
            toast.success("User approved successfully");
            loadUsers();
        } catch (error) {
            toast.error("Failed to approve user");
        }
    };

    const handleReject = async (userId: string) => {
        try {
            await rejectUser(userId);
            toast.success("User rejected successfully");
            loadUsers();
        } catch (error) {
            toast.error("Failed to reject user");
        }
    };

    const handleRoleUpdate = async (userId: string) => {
        try {
            await updateUserRole(userId, newRole);
            toast.success("User role updated successfully");
            setEditingUser(null);
            loadUsers();
        } catch (error) {
            toast.error("Failed to update user role");
        }
    };

    const handleDelete = async (userId: string) => {
        try {
            if (!deleteReason) {
                toast.error("Please provide a reason for deletion");
                return;
            }
            await deleteUser(userId, deleteReason);
            toast.success("User deleted successfully");
            setDeletingUser(null);
            setDeleteReason("");
            loadUsers();
        } catch (error) {
            toast.error("Failed to delete user");
        }
    };

    const handleUndo = async (userId: string) => {
        try {
            const users = JSON.parse(localStorage.getItem("users") || "[]");
            const userIndex = users.findIndex((u: User) => u.id === userId);

            if (userIndex === -1) {
                throw new Error("User not found");
            }

            users[userIndex] = {
                ...users[userIndex],
                isApproved: false,
                isRejected: false,
                rejectedAt: undefined,
                rejectedBy: undefined,
                deleteReason: undefined,
                deletedAt: undefined,
                deletedBy: undefined
            };

            localStorage.setItem("users", JSON.stringify(users));
            toast.success("User moved to pending approvals");
            loadUsers();
        } catch (error) {
            toast.error("Failed to undo user status");
        }
    };

    const renderUserList = (users: User[]) => {
        return users.map((user) => (
            <div
                key={user.id}
                className="bg-white dark:bg-zinc-800 rounded-lg shadow-md p-6 mb-4 transition-colors duration-200"
            >
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">{user.username}</h3>
                        <p className="text-gray-700 dark:text-gray-300">{user.email}</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300">Role: {user.role}</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300">Employee ID: {user.employeeId}</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                            Created: {new Date(user.createdAt).toLocaleDateString()}
                        </p>
                        {user.approvedAt && (
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                                Approved: {new Date(user.approvedAt).toLocaleDateString()}
                            </p>
                        )}
                        {user.deleteReason && (
                            <p className="text-sm text-red-500 dark:text-red-400">
                                Reason: {user.deleteReason}
                            </p>
                        )}
                    </div>
                    <div className="flex gap-2">
                        {!user.isApproved && !user.isRejected && (
                            <>
                                <button
                                    onClick={() => handleApprove(user.id)}
                                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
                                >
                                    Approve
                                </button>
                                <button
                                    onClick={() => handleReject(user.id)}
                                    className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
                                >
                                    Reject
                                </button>
                            </>
                        )}
                        {user.isApproved && (
                            <>
                                <button
                                    onClick={() => {
                                        setEditingUser(user);
                                        setNewRole(user.role);
                                    }}
                                    className="bg-fuchsia-800 text-white px-4 py-2 rounded hover:bg-fuchsia-900 flex items-center gap-2 transition-colors"
                                >
                                    <Pencil size={16} />
                                    Edit Role
                                </button>
                                <button
                                    onClick={() => setDeletingUser(user)}
                                    className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 flex items-center gap-2 transition-colors"
                                >
                                    <Trash2 size={16} />
                                    Delete
                                </button>
                            </>
                        )}
                        {user.isRejected && (
                            <button
                                onClick={() => handleUndo(user.id)}
                                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center gap-2 transition-colors"
                            >
                                <Undo2 size={16} />
                                Undo
                            </button>
                        )}
                    </div>
                </div>
            </div>
        ));
    };

    return (
        <DashboardLayout
            darkMode={darkMode}
            setDarkMode={setDarkMode}
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
        >
            <div className="container mx-auto px-4 py-8 bg-gray-50 dark:bg-zinc-900 min-h-screen transition-colors duration-200">
                <h1 className="text-3xl font-bold mb-8 text-gray-700 dark:text-gray-300">Admin Dashboard</h1>

                <div className="mb-6">
                    <div className="flex border-b dark:border-zinc-700">
                        <button
                            className={`px-4 py-2 ${activeTab === "pending"
                                ? "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400"
                                : "text-gray-700 dark:text-gray-300"
                                }`}
                            onClick={() => setActiveTab("pending")}
                        >
                            Pending Approvals ({pendingUsers.length})
                        </button>
                        <button
                            className={`px-4 py-2 ${activeTab === "approved"
                                ? "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400"
                                : "text-gray-700 dark:text-gray-300"
                                }`}
                            onClick={() => setActiveTab("approved")}
                        >
                            Approved Users ({approvedUsers.length})
                        </button>
                        <button
                            className={`px-4 py-2 ${activeTab === "rejected"
                                ? "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400"
                                : "text-gray-700 dark:text-gray-300"
                                }`}
                            onClick={() => setActiveTab("rejected")}
                        >
                            Rejected Users ({rejectedUsers.length})
                        </button>
                    </div>
                </div>

                <div className="mt-6">
                    {activeTab === "pending" ? (
                        pendingUsers.length > 0 ? (
                            renderUserList(pendingUsers)
                        ) : (
                            <p className="text-gray-700 dark:text-gray-300">No pending approvals</p>
                        )
                    ) : activeTab === "approved" ? (
                        approvedUsers.length > 0 ? (
                            renderUserList(approvedUsers)
                        ) : (
                            <p className="text-gray-700 dark:text-gray-300">No approved users</p>
                        )
                    ) : (
                        rejectedUsers.length > 0 ? (
                            renderUserList(rejectedUsers)
                        ) : (
                            <p className="text-gray-700 dark:text-gray-300">No rejected users</p>
                        )
                    )}
                </div>

                {/* Role Edit Modal */}
                {editingUser && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white dark:bg-zinc-800 p-6 rounded-lg w-96 transition-colors duration-200">
                            <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">Edit User Role</h3>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Select New Role
                                </label>
                                <Select
                                    value={newRole}
                                    onValueChange={setNewRole}
                                >
                                    <SelectTrigger className="w-full dark:border-zinc-600 dark:bg-zinc-700 dark:text-gray-300">
                                        <SelectValue placeholder="Select role" />
                                    </SelectTrigger>
                                    <SelectContent className="dark:bg-zinc-800 dark:border-zinc-700">
                                        <SelectItem value="manager" className="dark:hover:bg-zinc-700 dark:text-gray-300">Manager</SelectItem>
                                        <SelectItem value="supervisor" className="dark:hover:bg-zinc-700 dark:text-gray-300">Supervisor</SelectItem>
                                        <SelectItem value="member" className="dark:hover:bg-zinc-700 dark:text-gray-300">Member</SelectItem>
                                        <SelectItem value="director" className="dark:hover:bg-zinc-700 dark:text-gray-300">Director</SelectItem>
                                        <SelectItem value="president" className="dark:hover:bg-zinc-700 dark:text-gray-300">President</SelectItem>
                                        <SelectItem value="vice_president" className="dark:hover:bg-zinc-700 dark:text-gray-300">Vice President</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={() => setEditingUser(null)}
                                    className="px-4 py-2 border rounded hover:bg-gray-100 dark:hover:bg-zinc-700 text-gray-700 dark:text-gray-300 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleRoleUpdate(editingUser.id)}
                                    className="px-4 py-2 bg-fuchsia-800 text-white rounded hover:bg-fuchsia-900 transition-colors"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Delete User Modal */}
                {deletingUser && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white dark:bg-zinc-800 p-6 rounded-lg w-96 transition-colors duration-200">
                            <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">Delete User</h3>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Reason for Deletion
                                </label>
                                <Select
                                    value={deleteReason}
                                    onValueChange={setDeleteReason}
                                >
                                    <SelectTrigger className="w-full dark:border-zinc-600 dark:bg-zinc-700 dark:text-gray-300">
                                        <SelectValue placeholder="Select reason" />
                                    </SelectTrigger>
                                    <SelectContent className="dark:bg-zinc-800 dark:border-zinc-700">
                                        <SelectItem value="fired" className="dark:hover:bg-zinc-700 dark:text-gray-300">Fired</SelectItem>
                                        <SelectItem value="quit" className="dark:hover:bg-zinc-700 dark:text-gray-300">Quit</SelectItem>
                                        <SelectItem value="inactive" className="dark:hover:bg-zinc-700 dark:text-gray-300">Inactive</SelectItem>
                                        <SelectItem value="other" className="dark:hover:bg-zinc-700 dark:text-gray-300">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={() => {
                                        setDeletingUser(null);
                                        setDeleteReason("");
                                    }}
                                    className="px-4 py-2 border rounded hover:bg-gray-100 dark:hover:bg-zinc-700 text-gray-700 dark:text-gray-300 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleDelete(deletingUser.id)}
                                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                                >
                                    Delete User
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default AdminDashboard;