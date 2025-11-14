"use client";
import type React from "react";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { authService } from "@/services/authService";
interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: string;
  employeeId: string;
  fullName: string;
  title?: string;
  company?: string;
  phoneNumber?: string;
  department?: string;
  password?: string;
  isApproved?: boolean;
  createdAt?: string;
  status?: string;
}

interface RoleOption {
  id: string;
  name: string;
}
import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
  CircularProgress,
  TextField,
  InputAdornment,
  TablePagination,
} from "@mui/material";
import { toast } from "react-hot-toast";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  Pencil,
  Trash2,
  Search,
  UserPlus,
  Eye,
  EyeOff,
  Key,
} from "lucide-react";

interface AdminDashboardProps {
  darkMode: boolean;
  setDarkMode: (darkMode: boolean) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const AdminDashboard = ({
  darkMode,
  setDarkMode,
  sidebarOpen,
  setSidebarOpen,
}: AdminDashboardProps) => {
  const { deleteUser, activateUser, updateUserRoleByRoleId, resetPassword } =
    useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<AdminUser[]>([]);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [editData, setEditData] = useState<Partial<AdminUser>>({});
  const [deletingUser, setDeletingUser] = useState<AdminUser | null>(null);
  const [resettingPassword, setResettingPassword] = useState<AdminUser | null>(
    null
  );
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    fullName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "",
    department: "",
    employeeId: "",
    title: "",
    company: "",
    phoneNumber: "",
  });
  const [addErrors, setAddErrors] = useState<Record<string, string>>({});
  const [addLoading, setAddLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [roles, setRoles] = useState<RoleOption[]>([]);

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  useEffect(() => {
    if (!search) {
      setFilteredUsers(users);
    } else {
      setFilteredUsers(
        users.filter(
          (u) =>
            (u.username &&
              u.username.toLowerCase().includes(search.toLowerCase())) ||
            (u.email && u.email.toLowerCase().includes(search.toLowerCase())) ||
            (u.role && u.role.toLowerCase().includes(search.toLowerCase()))
        )
      );
    }
  }, [search, users]);

  const paginatedUsers = filteredUsers.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const fetchUsers = async () => {
    setFetching(true);
    try {
      const response = await authService.getAllUsers();
      if (!response.success || !response.data) {
        throw new Error(response.message || "Failed to load users");
      }
      const data = response.data as unknown[];
      const mappedUsers = (data as Record<string, unknown>[]).map(
        (u): AdminUser => {
          console.log("Processing user:", u);
          const mappedUser: AdminUser = {
            id:
              (u.id as string) ||
              (u.Id as string) ||
              (u.employeeId as string) ||
              (u.EmployeeId as string) ||
              "",
            username:
              (u.username as string) ||
              (u.Username as string) ||
              (u.userName as string) ||
              "",
            email: (u.email as string) || (u.Email as string) || "",
            role: (u.role as string) || (u.Role as string) || "",
            employeeId:
              (u.employeeId as string) || (u.EmployeeId as string) || "",
            fullName: (u.fullName as string) || (u.FullName as string) || "",
            title: (u.title as string) || (u.Title as string) || "",
            company: (u.company as string) || (u.Company as string) || "",
            phoneNumber:
              (u.phoneNumber as string) || (u.PhoneNumber as string) || "",
            department:
              (u.department as string) || (u.Department as string) || "",
            isApproved: (u.isApproved as boolean) || false,
            createdAt: (u.createdAt as string) || "",
            status: (u.status as string) || "active",
          };
          return mappedUser;
        }
      );
      setUsers(mappedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
    } finally {
      setFetching(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await authService.getAllRoles();
      if (response.success && Array.isArray(response.data)) {
        setRoles(response.data as RoleOption[]);
      }
    } catch (e) {
      console.error("Error fetching roles", e);
    }
  };

  const validateAddForm = () => {
    const errors: Record<string, string> = {};
    if (!addForm.employeeId.trim())
      errors.employeeId = "Employee ID is required";
    if (!addForm.fullName.trim()) errors.fullName = "Full name is required";
    if (!addForm.username.trim()) errors.username = "Username is required";
    if (!addForm.email.trim()) errors.email = "Email is required";
    if (!addForm.password.trim()) errors.password = "Password is required";
    if (!addForm.confirmPassword.trim())
      errors.confirmPassword = "Confirm password is required";
    if (addForm.password !== addForm.confirmPassword)
      errors.confirmPassword = "Passwords do not match";
    if (!addForm.role.trim()) errors.role = "Role is required";

    if (addForm.email && !/\S+@\S+\.\S+/.test(addForm.email)) {
      errors.email = "Please enter a valid email address";
    }

    setAddErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateAddForm()) return;

    setAddLoading(true);
    try {
      console.log("🔍 Creating user with data:", addForm);
      console.log("📦 Form data being sent:", JSON.stringify(addForm, null, 2));

      // Map form data to match backend expectations
      const userData = {
        employeeId: addForm.employeeId,
        fullName: addForm.fullName,
        username: addForm.username,
        email: addForm.email,
        department: addForm.department,
        phoneNumber: addForm.phoneNumber,
        company: addForm.company,
        title: addForm.title,
        role: addForm.role,
        password: addForm.password,
        confirmPassword: addForm.confirmPassword,
      };

      console.log("🔄 Mapped user data:", JSON.stringify(userData, null, 2));
      const response = await authService.createUser(userData);
      if (response.success) {
        toast.success("User added successfully");
        setShowAddModal(false);
        setAddForm({
          fullName: "",
          username: "",
          email: "",
          password: "",
          confirmPassword: "",
          role: "",
          department: "",
          employeeId: "",
          title: "",
          company: "",
          phoneNumber: "",
        });
        setAddErrors({});
        fetchUsers();
      } else {
        toast.error(response.message || "Failed to add user");
      }
    } catch (error) {
      console.error("Error adding user:", error);
      toast.error("Failed to add user");
    } finally {
      setAddLoading(false);
    }
  };

  const handleEditClick = (user: AdminUser) => {
    setEditingUser(user);
    setEditData({
      username: user.username,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
      title: user.title,
      company: user.company,
      phoneNumber: user.phoneNumber,
      department: user.department,
    });
    // clear previous edit state errors (no longer tracked)
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setEditLoading(true);
    try {
      const response = await authService.editUser({
        identifier:
          editingUser.employeeId || editingUser.email || editingUser.id,
        fullName: editData.fullName,
        email: editData.email,
        department: editData.department,
        title: editData.title,
        phoneNumber: editData.phoneNumber,
        company: editData.company,
        // role will be updated using update-role API by roleId below
      });
      if (response.success) {
        // If role changed, call role update API using roleId
        if (editData.role && editData.role !== editingUser.role) {
          const selected = roles.find(
            (r) => r.name.toLowerCase() === String(editData.role).toLowerCase()
          );
          if (selected) {
            await updateUserRoleByRoleId(
              editingUser.employeeId || editingUser.email || editingUser.id,
              selected.id
            );
          }
        }
        toast.success("User updated successfully");
        setEditingUser(null);
        setEditData({});
        // no edit error state tracked
        fetchUsers();
      } else {
        toast.error(response.message || "Failed to update user");
      }
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error("Failed to update user");
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;

    const identifier =
      deletingUser.employeeId || deletingUser.email || deletingUser.id;
    if (!identifier) {
      toast.error("Cannot identify user for deletion");
      return;
    }

    setDeleteLoading(true);
    try {
      await deleteUser(identifier, "Deactivated by admin");
      toast.success("User deactivated successfully");
      setDeletingUser(null);
      fetchUsers();
    } catch (error) {
      console.error("Error deactivating user:", error);
      toast.error("Failed to deactivate user");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resettingPassword) return;

    const identifier =
      resettingPassword.employeeId ||
      resettingPassword.email ||
      resettingPassword.id;
    if (!identifier) {
      toast.error("Cannot identify user for password reset");
      return;
    }

    setResetPasswordLoading(true);
    try {
      await resetPassword(identifier);
      toast.success(
        "Password reset successfully. User will be prompted to change password on next login."
      );
      setResettingPassword(null);
    } catch (error) {
      console.error("Error resetting password:", error);
      toast.error("Failed to reset password");
    } finally {
      setResetPasswordLoading(false);
    }
  };

  // Table styling for dark mode
  const tableCellStyle = {
    color: darkMode ? "white" : "inherit",
    borderColor: darkMode ? "#374151" : "#e5e7eb",
    backgroundColor: darkMode ? "#262626" : "inherit",
  };

  const tableHeadStyle = {
    backgroundColor: darkMode ? "#404040" : "#f9fafb",
    color: darkMode ? "white" : "inherit",
    borderColor: darkMode ? "#374151" : "#e5e7eb",
  };

  const tableRowStyle = (index: number) => ({
    backgroundColor: darkMode
      ? index % 2 === 0
        ? "#374151"
        : "#4b5563"
      : index % 2 === 0
      ? "#f9fafb"
      : "white",
    "&:hover": {
      backgroundColor: darkMode ? "#4b5563" : "#f3f4f6",
    },
  });

  return (
    <DashboardLayout
      darkMode={darkMode}
      setDarkMode={setDarkMode}
      sidebarOpen={sidebarOpen}
      setSidebarOpen={setSidebarOpen}
    >
      <div
        className={`min-h-screen  mx-auto  ${
          darkMode ? " text-white" : " text-gray-900"
        }`}
      >
        <h1 className="text-2xl font-bold mb-6">Admin User Management</h1>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
          <TextField
            variant="outlined"
            size="small"
            placeholder="Search by username, email, or role"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search
                    size={18}
                    className={` mr-1 darkMode ? 'text-gray-200' : 'text-gray-500'`}
                  />
                </InputAdornment>
              ),
              className: darkMode ? "text-white" : "text-gray-700",
            }}
            sx={{
              width: "400px",
              "& .MuiOutlinedInput-root": {
                height: "40px",
                "& fieldset": {
                  borderColor: darkMode ? "#374151" : "#e5e7eb",
                  borderWidth: "0.5px",
                  borderRadius: "8px",
                },
                "&.Mui-focused fieldset": {
                  borderColor: "#d1d5db",
                },
                backgroundColor: darkMode ? "#3f3f46" : "white",
                color: darkMode ? "white" : "inherit",
              },
              "& .MuiInputBase-input": {
                color: darkMode ? "d1d5db" : "inherit",
              },
              "& .MuiInputBase-input::placeholder": {
                color: darkMode ? "#d1d5db" : "#6b7280",
                opacity: 1,
              },
            }}
            className="w-full md:w-1/3"
          />
          <Button
            variant="contained"
            color="primary"
            onClick={() => setShowAddModal(true)}
            sx={{
              backgroundColor: darkMode ? "#3f3f46" : "#581c87",
              "&:hover": {
                backgroundColor: darkMode ? "#52525b" : "#6b21a8",
              },
            }}
            className="w-fit md:w-auto "
          >
            Add User
          </Button>
        </div>

        <div className="overflow-x-auto rounded-lg shadow">
          {fetching ? (
            <div className="flex justify-center items-center py-10">
              <CircularProgress
                sx={{ color: darkMode ? "white" : "inherit" }}
              />
            </div>
          ) : (
            <TableContainer
              component={Paper}
              sx={{
                backgroundColor: darkMode ? "#27272a" : "white",
                boxShadow: darkMode
                  ? "0 4px 6px -1px rgba(0, 0, 0, 0.5)"
                  : "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
              }}
            >
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={tableHeadStyle}>Employee ID</TableCell>
                    <TableCell sx={tableHeadStyle}>Full Name</TableCell>
                    <TableCell sx={tableHeadStyle}>Username</TableCell>
                    <TableCell sx={tableHeadStyle}>Email</TableCell>
                    <TableCell sx={tableHeadStyle}>Role</TableCell>
                    <TableCell sx={tableHeadStyle}>Status</TableCell>
                    <TableCell sx={tableHeadStyle}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedUsers.map((user, idx) => (
                    <TableRow
                      key={`${
                        user.id || user.employeeId || user.email || "user"
                      }-${idx}`}
                      sx={tableRowStyle(idx)}
                      hover
                    >
                      <TableCell sx={tableCellStyle}>
                        {user.employeeId || "N/A"}
                      </TableCell>
                      <TableCell sx={tableCellStyle}>
                        {user.fullName || "N/A"}
                      </TableCell>
                      <TableCell sx={tableCellStyle}>
                        {user.username || "N/A"}
                      </TableCell>
                      <TableCell sx={tableCellStyle}>
                        {user.email || "N/A"}
                      </TableCell>
                      <TableCell sx={tableCellStyle}>
                        {user.role === "User" ? "Member" : user.role || "N/A"}
                      </TableCell>
                      <TableCell sx={tableCellStyle}>
                        {user.status || "Active"}
                      </TableCell>
                      <TableCell sx={tableCellStyle}>
                        <Tooltip title="Edit User">
                          <span>
                            <Button
                              size="small"
                              onClick={() => handleEditClick(user)}
                              sx={{ color: darkMode ? "#93c5fd" : "#3b82f6" }}
                            >
                              <Pencil size={16} />
                            </Button>
                          </span>
                        </Tooltip>
                        <Tooltip title="Reset Password">
                          <span>
                            <Button
                              size="small"
                              onClick={() => setResettingPassword(user)}
                              sx={{ color: darkMode ? "#fbbf24" : "#d97706" }}
                            >
                              <Key size={16} />
                            </Button>
                          </span>
                        </Tooltip>
                        <Tooltip
                          title={
                            user.status?.toLowerCase() === "inactive"
                              ? "Activate User"
                              : "Deactivate User"
                          }
                        >
                          <span>
                            <Button
                              size="small"
                              sx={{
                                color:
                                  user.status?.toLowerCase() === "inactive"
                                    ? darkMode
                                      ? "#86efac"
                                      : "#16a34a"
                                    : darkMode
                                    ? "#fca5a5"
                                    : "#ef4444",
                              }}
                              onClick={() => {
                                if (user.status?.toLowerCase() === "inactive") {
                                  const identifier =
                                    user.employeeId || user.email || user.id;
                                  if (!identifier) return;
                                  activateUser(identifier)
                                    .then(() => {
                                      toast.success("User activated");
                                      fetchUsers();
                                    })
                                    .catch(() =>
                                      toast.error("Failed to activate user")
                                    );
                                } else {
                                  setDeletingUser(user);
                                }
                              }}
                            >
                              <Trash2 size={16} />
                            </Button>
                          </span>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <TablePagination
                component="div"
                count={filteredUsers.length}
                page={page}
                onPageChange={(_, newPage) => setPage(newPage)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => {
                  setRowsPerPage(Number.parseInt(e.target.value, 10));
                  setPage(0);
                }}
                rowsPerPageOptions={[5, 10, 25, 50]}
                sx={{
                  color: darkMode ? "white" : "inherit",
                  backgroundColor: darkMode ? "#27272a" : "white",
                  borderTop: `1px solid ${darkMode ? "#374151" : "#e5e7eb"}`,
                  "& .MuiTablePagination-selectIcon": {
                    color: darkMode ? "white" : "inherit",
                  },
                }}
              />
            </TableContainer>
          )}
        </div>

        {/* Add User Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div
              className={`backdrop-blur-sm shadow-2xl border-0 rounded-3xl overflow-hidden w-[800px] lg:w-[900px] ${
                darkMode ? "bg-gray-800/95" : "bg-white/95"
              }`}
            >
              <div className="bg-gradient-to-r from-blue-900 to-purple-800 p-5 ">
                <div className="flex items-center justify-between p-3">
                  <div>
                    <h3 className="text-2xl font-bold text-white">Add User</h3>
                    <p className="text-blue-100 text-base mt-1">
                      Create a new user account
                    </p>
                  </div>
                  <div className="mb-2">
                    <UserPlus className="h-9 w-9 text-white mx-auto" />
                  </div>
                </div>
              </div>
              <div className="p-9">
                <form
                  onSubmit={handleAddUser}
                  className="grid grid-cols-2 gap-4"
                >
                  <div className="pb-2">
                    <label
                      className={`block text-sm font-medium mb-2 ${
                        darkMode ? "text-white" : "text-gray-700"
                      }`}
                    >
                      Employee ID <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      className={`w-full h-10 rounded-lg focus:ring-1 focus:ring-blue-500/20 px-3 ${
                        darkMode
                          ? "border border-gray-600 focus:border-blue-400 bg-gray-700/50 text-white"
                          : "border border-gray-300 focus:border-blue-500 bg-gray-50 text-gray-900"
                      }`}
                      placeholder="Enter employee ID"
                      aria-label="Employee ID"
                      value={addForm.employeeId}
                      onChange={(e) =>
                        setAddForm((f) => ({
                          ...f,
                          employeeId: e.target.value,
                        }))
                      }
                      required
                    />
                    {addErrors.employeeId && (
                      <div className="text-red-500 text-xs mt-1">
                        {addErrors.employeeId}
                      </div>
                    )}
                  </div>

                  <div className="pb-2">
                    <label
                      className={`block text-sm font-medium mb-2 ${
                        darkMode ? "text-white" : "text-gray-700"
                      }`}
                    >
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      className={`w-full h-10 rounded-lg focus:ring-1 focus:ring-blue-500/20 px-3 ${
                        darkMode
                          ? "border border-gray-600 focus:border-blue-400 bg-gray-700/50 text-white"
                          : "border border-gray-300 focus:border-blue-500 bg-gray-50 text-gray-900"
                      }`}
                      placeholder="Enter full name"
                      aria-label="Full Name"
                      value={addForm.fullName}
                      onChange={(e) =>
                        setAddForm((f) => ({ ...f, fullName: e.target.value }))
                      }
                      required
                    />
                    {addErrors.fullName && (
                      <div className="text-red-500 text-xs mt-1">
                        {addErrors.fullName}
                      </div>
                    )}
                  </div>

                  <div className="pb-2">
                    <label
                      className={`block text-sm font-medium mb-2 ${
                        darkMode ? "text-white" : "text-gray-700"
                      }`}
                    >
                      Username <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      className={`w-full h-10 rounded-lg focus:ring-1 focus:ring-blue-500/20 px-3 ${
                        darkMode
                          ? "border border-gray-600 focus:border-blue-400 bg-gray-700/50 text-white"
                          : "border border-gray-300 focus:border-blue-500 bg-gray-50 text-gray-900"
                      }`}
                      placeholder="Enter username"
                      aria-label="Username"
                      value={addForm.username}
                      onChange={(e) =>
                        setAddForm((f) => ({ ...f, username: e.target.value }))
                      }
                      required
                    />
                    {addErrors.username && (
                      <div className="text-red-500 text-xs mt-1">
                        {addErrors.username}
                      </div>
                    )}
                  </div>

                  <div className="pb-2">
                    <label
                      className={`block text-sm font-medium mb-2 ${
                        darkMode ? "text-white" : "text-gray-700"
                      }`}
                    >
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      className={`w-full h-10 rounded-lg focus:ring-1 focus:ring-blue-500/20 px-3 ${
                        darkMode
                          ? "border border-gray-600 bg-gray-700/50 text-white"
                          : "border border-gray-300 bg-gray-50 text-gray-900"
                      }`}
                      placeholder="Enter email"
                      aria-label="Email"
                      value={addForm.email}
                      onChange={(e) =>
                        setAddForm((f) => ({ ...f, email: e.target.value }))
                      }
                      required
                    />
                    {addErrors.email && (
                      <div className="text-red-500 text-xs mt-1">
                        {addErrors.email}
                      </div>
                    )}
                  </div>

                  <div className="pb-2 relative">
                    <label
                      className={`block text-sm font-medium mb-1 ${
                        darkMode ? "text-white" : "text-gray-700"
                      }`}
                    >
                      Password <span className="text-red-500">*</span>
                    </label>
                    <input
                      type={showPassword ? "text" : "password"}
                      className={`w-full h-10 rounded-lg focus:ring-1 focus:ring-blue-500/20 px-3 pr-10 ${
                        darkMode
                          ? "border border-gray-600 bg-gray-700/50 text-white"
                          : "border border-gray-300 focus:border-blue-500 bg-gray-50 text-gray-900"
                      }`}
                      placeholder="Enter password"
                      aria-label="Password"
                      value={addForm.password}
                      onChange={(e) =>
                        setAddForm((f) => ({ ...f, password: e.target.value }))
                      }
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute right-3 top-11 transform -translate-y-1/2 p-1 rounded"
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? (
                        <EyeOff
                          size={17}
                          className={darkMode ? "text-white" : "text-gray-600"}
                        />
                      ) : (
                        <Eye
                          size={17}
                          className={darkMode ? "text-white" : "text-gray-600"}
                        />
                      )}
                    </button>
                    {addErrors.password && (
                      <div className="text-red-500 text-xs mt-1">
                        {addErrors.password}
                      </div>
                    )}
                  </div>

                  <div className="pb-2 relative">
                    <label
                      className={`block text-sm font-medium mb-2 ${
                        darkMode ? "text-white" : "text-gray-700"
                      }`}
                    >
                      Confirm Password <span className="text-red-500">*</span>
                    </label>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      className={`w-full h-10 rounded-lg focus:ring-1 focus:ring-blue-500/20 px-3 pr-10 ${
                        darkMode
                          ? "border border-gray-600 focus:border-blue-400 bg-gray-700/50 text-white"
                          : "border border-gray-300 focus:border-blue-500 bg-gray-50 text-gray-900"
                      }`}
                      placeholder="Confirm password"
                      aria-label="Confirm Password"
                      value={addForm.confirmPassword}
                      onChange={(e) =>
                        setAddForm((f) => ({
                          ...f,
                          confirmPassword: e.target.value,
                        }))
                      }
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((s) => !s)}
                      className="absolute right-3 top-11 transform -translate-y-1/2 p-1 rounded"
                      aria-label={
                        showConfirmPassword
                          ? "Hide confirm password"
                          : "Show confirm password"
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff
                          size={18}
                          className={darkMode ? "text-white" : "text-gray-600"}
                        />
                      ) : (
                        <Eye
                          size={18}
                          className={darkMode ? "text-white" : "text-gray-600"}
                        />
                      )}
                    </button>
                    {addErrors.confirmPassword && (
                      <div className="text-red-500 text-xs mb-2">
                        {addErrors.confirmPassword}
                      </div>
                    )}
                  </div>

                  <div className="pb-2">
                    <label
                      className={`block text-sm font-medium mb-2 ${
                        darkMode ? "text-white" : "text-gray-700"
                      }`}
                    >
                      Role <span className="text-red-500">*</span>
                    </label>
                    <select
                      className={`w-full h-10 rounded-lg focus:ring-1 focus:ring-blue-500/20 px-3 ${
                        darkMode
                          ? "border border-gray-600 focus:border-gray-400 bg-zinc-800 text-white"
                          : "border border-gray-300 focus:border-purple-300 bg-gray-50 text-gray-900"
                      }`}
                      aria-label="Role"
                      value={addForm.role}
                      onChange={(e) =>
                        setAddForm((f) => ({ ...f, role: e.target.value }))
                      }
                      required
                    >
                      <option value="">Select role</option>
                      {/* Prefer dynamic roles if loaded; else fallback */}
                      {(roles.length
                        ? roles
                        : [
                            { id: "fallback-admin", name: "Admin" },
                            { id: "fallback-manager", name: "Manager" },
                            { id: "fallback-supervisor", name: "Supervisor" },
                            { id: "fallback-member", name: "Member" },
                            { id: "fallback-director", name: "Director" },
                            { id: "fallback-president", name: "President" },
                            { id: "fallback-vp", name: "Vice-President" },
                          ]
                      ).map((r) => (
                        <option key={r.id} value={r.name}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                    {addErrors.role && (
                      <div className="text-red-500 text-xs mt-2">
                        {addErrors.role}
                      </div>
                    )}
                  </div>

                  <div className="pb-2">
                    <label
                      className={`block text-sm font-medium mb-2 ${
                        darkMode ? "text-white" : "text-gray-700"
                      }`}
                    >
                      Department
                    </label>
                    <input
                      type="text"
                      className={`w-full h-10 rounded-lg focus:ring-1 focus:ring-blue-500/20 px-3 ${
                        darkMode
                          ? "border border-gray-600 focus:border-blue-400 bg-gray-700/50 text-white"
                          : "border border-gray-300 focus:border-blue-500 bg-gray-50 text-gray-900"
                      }`}
                      placeholder="Enter department"
                      aria-label="Department"
                      value={addForm.department}
                      onChange={(e) =>
                        setAddForm((f) => ({
                          ...f,
                          department: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className="pb-2">
                    <label
                      className={`block text-sm font-medium mb-1 ${
                        darkMode ? "text-white" : "text-gray-700"
                      }`}
                    >
                      Title
                    </label>
                    <input
                      type="text"
                      className={`w-full h-10 rounded-lg focus:ring-1 focus:ring-blue-500/20 px-3 ${
                        darkMode
                          ? "border border-gray-600 focus:border-blue-400 bg-gray-700/50 text-white"
                          : "border border-gray-300 focus:border-blue-500 bg-gray-50 text-gray-900"
                      }`}
                      placeholder="Enter title"
                      aria-label="Title"
                      value={addForm.title}
                      onChange={(e) =>
                        setAddForm((f) => ({ ...f, title: e.target.value }))
                      }
                    />
                  </div>

                  <div className="pb-2">
                    <label
                      className={`block text-sm font-medium mb-1 ${
                        darkMode ? "text-white" : "text-gray-700"
                      }`}
                    >
                      Company
                    </label>
                    <input
                      type="text"
                      className={`w-full h-10 rounded-lg focus:ring-1 focus:ring-blue-500/20 px-3 ${
                        darkMode
                          ? "border border-gray-600 focus:border-blue-400 bg-gray-700/50 text-white"
                          : "border border-gray-300 focus:border-blue-500 bg-gray-50 text-gray-900"
                      }`}
                      placeholder="Enter company"
                      aria-label="Company"
                      value={addForm.company}
                      onChange={(e) =>
                        setAddForm((f) => ({ ...f, company: e.target.value }))
                      }
                    />
                  </div>

                  <div className="pb-2">
                    <label
                      className={`block text-sm font-medium mb-1 ${
                        darkMode ? "text-white" : "text-gray-700"
                      }`}
                    >
                      Phone Number
                    </label>
                    <input
                      type="text"
                      className={`w-full h-10 rounded-lg focus:ring-2 focus:ring-blue-500/20 px-3 ${
                        darkMode
                          ? "border border-gray-600 focus:border-blue-400 bg-gray-700/50 text-white"
                          : "border border-gray-300 focus:border-blue-500 bg-gray-50 text-gray-900"
                      }`}
                      placeholder="Enter phone number"
                      aria-label="Phone Number"
                      value={addForm.phoneNumber}
                      onChange={(e) =>
                        setAddForm((f) => ({
                          ...f,
                          phoneNumber: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className="flex justify-end gap-4 mt-1 col-span-2">
                    <button
                      type="button"
                      className={`px-3 py-1 rounded-lg border ${
                        darkMode
                          ? "border-gray-600 hover:bg-gray-700 text-white"
                          : "border-gray-300 hover:bg-gray-100 text-gray-700"
                      }`}
                      onClick={() => {
                        setShowAddModal(false);
                        setAddForm({
                          fullName: "",
                          username: "",
                          email: "",
                          password: "",
                          confirmPassword: "",
                          role: "",
                          department: "",
                          employeeId: "",
                          title: "",
                          company: "",
                          phoneNumber: "",
                        });
                        setAddErrors({});
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={addLoading}
                    >
                      {addLoading ? (
                        <CircularProgress size={18} color="inherit" />
                      ) : (
                        "Add User"
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Edit User Modal */}
        {editingUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div
              className={`backdrop-blur-sm shadow-2xl border-0 rounded-3xl overflow-hidden w-[900px] lg:w-[1000px] ${
                darkMode ? "bg-gray-800/95" : "bg-white/95"
              }`}
            >
              <div className="bg-gradient-to-r from-blue-900 to-purple-800 p-6 ">
                <div className="flex items-center justify-between p-3">
                  <div>
                    <h3 className="text-2xl font-bold text-white">Edit User</h3>
                    <p className="text-blue-100 text-sm mt-1">
                      Update user account details
                    </p>
                  </div>
                  <div className="mb-2">
                    <Pencil className="h-8 w-8 text-white mx-auto" />
                  </div>
                </div>
              </div>
              <div className="p-8">
                <form
                  onSubmit={handleEditUser}
                  className="grid grid-cols-2 gap-4"
                >
                  <div className="pb-2">
                    <label
                      className={`block text-sm font-medium mb-1 ${
                        darkMode ? "text-white" : "text-gray-700"
                      }`}
                    >
                      Username
                    </label>
                    <input
                      type="text"
                      className={`w-full h-10 rounded-xl focus:ring-2 focus:ring-blue-500/20 px-3 ${
                        darkMode
                          ? "border-gray-600 focus:border-blue-400 bg-gray-700/50 text-white"
                          : "border-gray-300 focus:border-blue-500 bg-gray-50"
                      }`}
                      placeholder="Enter username"
                      aria-label="Username"
                      value={editData.username || editingUser.username || ""}
                      onChange={(e) =>
                        setEditData((f) => ({ ...f, username: e.target.value }))
                      }
                      required
                    />
                  </div>

                  <div className="pb-2">
                    <label
                      className={`block text-sm font-medium mb-1 ${
                        darkMode ? "text-white" : "text-gray-700"
                      }`}
                    >
                      Email
                    </label>
                    <input
                      type="email"
                      className={`w-full h-10 rounded-xl focus:ring-2 focus:ring-blue-500/20 px-3 ${
                        darkMode
                          ? "border-gray-600 focus:border-blue-400 bg-gray-700/50 text-white"
                          : "border-gray-300 focus:border-blue-500 bg-gray-50"
                      }`}
                      placeholder="Enter email"
                      aria-label="Email"
                      value={editData.email || editingUser.email || ""}
                      onChange={(e) =>
                        setEditData((f) => ({ ...f, email: e.target.value }))
                      }
                      required
                    />
                  </div>

                  <div className="pb-2">
                    <label
                      className={`block text-sm font-medium mb-1 ${
                        darkMode ? "text-white" : "text-gray-700"
                      }`}
                    >
                      Role
                    </label>
                    <select
                      className={`w-full h-10 rounded-xl focus:ring-2 focus:ring-blue-500/20 px-3 ${
                        darkMode
                          ? "border-gray-600 focus:border-blue-400 bg-gray-700/50 text-white"
                          : "border-gray-300 focus:border-blue-500 bg-gray-50"
                      }`}
                      aria-label="Role"
                      value={editData.role || editingUser.role || ""}
                      onChange={(e) =>
                        setEditData((f) => ({ ...f, role: e.target.value }))
                      }
                      required
                    >
                      <option value="">Select role</option>
                      {roles.map((r) => (
                        <option key={r.id} value={r.name}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="pb-2">
                    <label
                      className={`block text-sm font-medium mb-1 ${
                        darkMode ? "text-white" : "text-gray-700"
                      }`}
                    >
                      Full Name
                    </label>
                    <input
                      type="text"
                      className={`w-full h-10 rounded-xl focus:ring-2 focus:ring-blue-500/20 px-3 ${
                        darkMode
                          ? "border-gray-600 focus:border-blue-400 bg-gray-700/50 text-white"
                          : "border-gray-300 focus:border-blue-500 bg-gray-50"
                      }`}
                      placeholder="Enter full name"
                      aria-label="Full Name"
                      value={editData.fullName || editingUser.fullName || ""}
                      onChange={(e) =>
                        setEditData((f) => ({ ...f, fullName: e.target.value }))
                      }
                    />
                  </div>

                  <div className="pb-2">
                    <label
                      className={`block text-sm font-medium mb-1 ${
                        darkMode ? "text-white" : "text-gray-700"
                      }`}
                    >
                      Title
                    </label>
                    <input
                      type="text"
                      className={`w-full h-10 rounded-xl focus:ring-2 focus:ring-blue-500/20 px-3 ${
                        darkMode
                          ? "border-gray-600 focus:border-blue-400 bg-gray-700/50 text-white"
                          : "border-gray-300 focus:border-blue-500 bg-gray-50"
                      }`}
                      placeholder="Enter title"
                      aria-label="Title"
                      value={editData.title || editingUser.title || ""}
                      onChange={(e) =>
                        setEditData((f) => ({ ...f, title: e.target.value }))
                      }
                    />
                  </div>

                  <div className="pb-2">
                    <label
                      className={`block text-sm font-medium mb-1 ${
                        darkMode ? "text-white" : "text-gray-700"
                      }`}
                    >
                      Company
                    </label>
                    <input
                      type="text"
                      className={`w-full h-10 rounded-xl focus:ring-2 focus:ring-blue-500/20 px-3 ${
                        darkMode
                          ? "border-gray-600 focus:border-blue-400 bg-gray-700/50 text-white"
                          : "border-gray-300 focus:border-blue-500 bg-gray-50"
                      }`}
                      placeholder="Enter company"
                      aria-label="Company"
                      value={editData.company || editingUser.company || ""}
                      onChange={(e) =>
                        setEditData((f) => ({ ...f, company: e.target.value }))
                      }
                    />
                  </div>

                  <div className="pb-2">
                    <label
                      className={`block text-sm font-medium mb-1 ${
                        darkMode ? "text-white" : "text-gray-700"
                      }`}
                    >
                      Phone Number
                    </label>
                    <input
                      type="text"
                      className={`w-full h-10 rounded-xl focus:ring-2 focus:ring-blue-500/20 px-3 ${
                        darkMode
                          ? "border-gray-600 focus:border-blue-400 bg-gray-700/50 text-white"
                          : "border-gray-300 focus:border-blue-500 bg-gray-50"
                      }`}
                      placeholder="Enter phone number"
                      aria-label="Phone Number"
                      value={
                        editData.phoneNumber || editingUser.phoneNumber || ""
                      }
                      onChange={(e) =>
                        setEditData((f) => ({
                          ...f,
                          phoneNumber: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className="pb-2">
                    <label
                      className={`block text-sm font-medium mb-1 ${
                        darkMode ? "text-white" : "text-gray-700"
                      }`}
                    >
                      Department
                    </label>
                    <input
                      type="text"
                      className={`w-full h-10 rounded-xl focus:ring-2 focus:ring-blue-500/20 px-3 ${
                        darkMode
                          ? "border-gray-600 focus:border-blue-400 bg-gray-700/50 text-white"
                          : "border-gray-300 focus:border-blue-500 bg-gray-50"
                      }`}
                      placeholder="Enter department"
                      aria-label="Department"
                      value={
                        editData.department || editingUser.department || ""
                      }
                      onChange={(e) =>
                        setEditData((f) => ({
                          ...f,
                          department: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className="flex justify-end gap-2 mt-6 col-span-2">
                    <button
                      type="button"
                      className={`px-5 h-11 rounded-xl border ${
                        darkMode
                          ? "border-gray-600 hover:bg-gray-700 text-white"
                          : "border-gray-300 hover:bg-gray-100 text-gray-700"
                      }`}
                      onClick={() => {
                        setEditingUser(null);
                        setEditData({});
                        // no edit error state tracked
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-xl shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={editLoading}
                    >
                      {editLoading ? (
                        <CircularProgress size={18} color="inherit" />
                      ) : (
                        "Save Changes"
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Reset Password Modal */}
        {resettingPassword && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="relative p-4 w-full max-w-md max-h-full">
              <div
                className={`relative rounded-lg shadow-sm ${
                  darkMode ? "bg-gray-800" : "bg-white"
                }`}
              >
                <button
                  type="button"
                  className={`absolute top-3 end-2.5 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center ${
                    darkMode
                      ? "text-gray-400 bg-transparent hover:bg-gray-700 hover:text-white"
                      : "text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900"
                  }`}
                  onClick={() => setResettingPassword(null)}
                >
                  <svg
                    className="w-3 h-3"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 14 14"
                  >
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
                    />
                  </svg>
                  <span className="sr-only">Close modal</span>
                </button>
                <div className="p-4 md:p-5 text-center">
                  <div className="mx-auto mb-4 text-amber-600 w-12 h-12 dark:text-amber-400 flex items-center justify-center">
                    <Key size={48} />
                  </div>
                  <h3
                    className={`mb-5 text-lg font-normal ${
                      darkMode ? "text-gray-300" : "text-gray-500"
                    }`}
                  >
                    Reset password for{" "}
                    <span className="font-semibold">
                      {resettingPassword.username || resettingPassword.email}
                    </span>
                    ?
                  </h3>
                  <p
                    className={`mb-4 text-sm ${
                      darkMode ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    The user's password will be reset to "Welcome2cbe" and they
                    will be prompted to change it on their next login.
                    {resettingPassword.employeeId && (
                      <span className="block mt-1">
                        Employee ID: {resettingPassword.employeeId}
                      </span>
                    )}
                  </p>
                  <div className="flex justify-center gap-3 mt-6">
                    <button
                      type="button"
                      className="text-white bg-amber-600 dark:bg-amber-700 hover:bg-amber-800 focus:ring-4 focus:outline-none focus:ring-amber-300 dark:focus:ring-amber-800 font-medium rounded-lg text-sm inline-flex items-center px-5 py-2.5 text-center"
                      onClick={handleResetPassword}
                      disabled={
                        resetPasswordLoading ||
                        (!resettingPassword.employeeId &&
                          !resettingPassword.email &&
                          !resettingPassword.id)
                      }
                    >
                      {resetPasswordLoading ? (
                        <CircularProgress size={18} color="inherit" />
                      ) : (
                        "Yes, reset password"
                      )}
                    </button>
                    <button
                      type="button"
                      className={`py-2.5 px-5 ms-3 text-sm font-medium focus:outline-none rounded-lg border focus:z-10 focus:ring-4 ${
                        darkMode
                          ? "text-gray-300 bg-gray-800 border-gray-600 hover:text-white hover:bg-gray-700 focus:ring-gray-700"
                          : "text-gray-900 bg-white border-gray-200 hover:bg-gray-100 hover:text-blue-700 focus:ring-gray-100"
                      }`}
                      onClick={() => setResettingPassword(null)}
                    >
                      No, cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete User Modal - Updated to match template */}
        {deletingUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="relative p-4 w-full max-w-md max-h-full">
              <div
                className={`relative rounded-lg shadow-sm ${
                  darkMode ? "bg-gray-800" : "bg-white"
                }`}
              >
                <button
                  type="button"
                  className={`absolute top-3 end-2.5 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center ${
                    darkMode
                      ? "text-gray-400 bg-transparent hover:bg-gray-700 hover:text-white"
                      : "text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900"
                  }`}
                  onClick={() => setDeletingUser(null)}
                >
                  <svg
                    className="w-3 h-3"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 14 14"
                  >
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
                    />
                  </svg>
                  <span className="sr-only">Close modal</span>
                </button>
                <div className="p-4 md:p-5 text-center">
                  <svg
                    className="mx-auto mb-4 text-red-600 w-12 h-12 dark:text-red-400"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 20 20"
                  >
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M10 11V6m0 8h.01M19 10a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                    />
                  </svg>
                  <h3
                    className={`mb-5 text-lg font-normal ${
                      darkMode ? "text-gray-300" : "text-gray-500"
                    }`}
                  >
                    Are you sure you want to deactivate{" "}
                    <span className="font-semibold">
                      {deletingUser.username || deletingUser.email}
                    </span>
                    ?
                  </h3>
                  <p
                    className={`mb-4 text-sm ${
                      darkMode ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    Deactivating a user will remove their access to the system.
                    {deletingUser.employeeId && (
                      <span className="block mt-1">
                        Employee ID: {deletingUser.employeeId}
                      </span>
                    )}
                  </p>
                  <div className="flex justify-center gap-3 mt-6">
                    <button
                      type="button"
                      className="text-white bg-red-600 dark:bg-red-700 hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-red-300 dark:focus:ring-red-800 font-medium rounded-lg text-sm inline-flex items-center px-5 py-2.5 text-center"
                      onClick={handleDeleteUser}
                      disabled={
                        deleteLoading ||
                        (!deletingUser.employeeId &&
                          !deletingUser.email &&
                          !deletingUser.id)
                      }
                    >
                      {deleteLoading ? (
                        <CircularProgress size={18} color="inherit" />
                      ) : (
                        "Yes, I'm sure"
                      )}
                    </button>
                    <button
                      type="button"
                      className={`py-2.5 px-5 ms-3 text-sm font-medium focus:outline-none rounded-lg border focus:z-10 focus:ring-4 ${
                        darkMode
                          ? "text-gray-300 bg-gray-800 border-gray-600 hover:text-white hover:bg-gray-700 focus:ring-gray-700"
                          : "text-gray-900 bg-white border-gray-200 hover:bg-gray-100 hover:text-blue-700 focus:ring-gray-100"
                      }`}
                      onClick={() => setDeletingUser(null)}
                    >
                      No, cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
