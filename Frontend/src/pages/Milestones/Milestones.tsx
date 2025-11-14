"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import {
  Calendar,
  Clock,
  Users,
  Target,
  CheckCircle,
  AlertCircle,
  Plus,
  Search,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react"
import { toast } from "react-hot-toast"

interface Milestone {
  id: string
  title: string
  description: string
  projectId: string
  projectName: string
  dueDate: string
  status: "not-started" | "in-progress" | "completed" | "overdue"
  priority: "high" | "medium" | "low"
  progress: number
  assignedTo: string[]
  dependencies: string[]
  completionDate?: string
  createdBy: string
  createdAt: string
}

interface Project {
  id: string
  name: string
  status: "active" | "completed" | "on-hold"
}

interface MilestonesProps {
  darkMode?: boolean
  setDarkMode?: (darkMode: boolean) => void
  sidebarOpen?: boolean
  setSidebarOpen?: (open: boolean) => void
}

const Milestones = ({ darkMode = false }: MilestonesProps) => {
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [priorityFilter, setPriorityFilter] = useState<string>("all")
  const [projectFilter, setProjectFilter] = useState<string>("all")
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null)
  const [newMilestone, setNewMilestone] = useState<Partial<Milestone>>({
    title: "",
    description: "",
    projectId: "",
    dueDate: "",
    priority: "medium",
    assignedTo: [],
    dependencies: [],
  })
  const [selectedMilestoneForView, setSelectedMilestoneForView] = useState<Milestone | null>(null)

  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)

  const filteredMilestones = milestones.filter((milestone) => {
    const matchesSearch =
      (milestone.title || "").toLowerCase().includes((searchQuery || "").toLowerCase()) ||
      (milestone.description || "").toLowerCase().includes((searchQuery || "").toLowerCase()) ||
      (milestone.projectName || "").toLowerCase().includes((searchQuery || "").toLowerCase())
    const matchesStatus = statusFilter === "all" || milestone.status === statusFilter
    const matchesPriority = priorityFilter === "all" || milestone.priority === priorityFilter
    const matchesProject = projectFilter === "all" || milestone.projectId === projectFilter

    return matchesSearch && matchesStatus && matchesPriority && matchesProject
  })

  const totalItems = filteredMilestones.length
  const totalPages = itemsPerPage === -1 ? 1 : Math.ceil(totalItems / itemsPerPage)
  const startIndex = itemsPerPage === -1 ? 0 : (currentPage - 1) * itemsPerPage
  const endIndex = itemsPerPage === -1 ? totalItems : startIndex + itemsPerPage
  const paginatedMilestones = filteredMilestones.slice(startIndex, endIndex)

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, statusFilter, priorityFilter, projectFilter])

  // Mock data
  useEffect(() => {
    const mockProjects: Project[] = [
      { id: "1", name: "Core Banking System Upgrade", status: "active" },
      { id: "2", name: "Mobile App Redesign", status: "active" },
      { id: "3", name: "Security Compliance Audit", status: "completed" },
      { id: "4", name: "Customer Portal Enhancement", status: "on-hold" },
    ]

    const mockMilestones: Milestone[] = [
      {
        id: "1",
        title: "Database Schema Design",
        description: "Complete the database schema design for the new banking system",
        projectId: "1",
        projectName: "Core Banking System Upgrade",
        dueDate: "2024-03-15",
        status: "completed",
        priority: "high",
        progress: 100,
        assignedTo: ["Abebe Bikila", "Tirunesh Dibaba"],
        dependencies: [],
        completionDate: "2024-03-10",
        createdBy: "Manager",
        createdAt: "2024-02-01",
      },
      {
        id: "2",
        title: "API Development Phase 1",
        description: "Develop core API endpoints for user authentication and account management",
        projectId: "1",
        projectName: "Core Banking System Upgrade",
        dueDate: "2024-04-20",
        status: "in-progress",
        priority: "high",
        progress: 65,
        assignedTo: ["Haile Gebrselassie", "Fatuma Roba"],
        dependencies: ["1"],
        createdBy: "Manager",
        createdAt: "2024-02-15",
      },
      {
        id: "3",
        title: "UI/UX Design Review",
        description: "Review and approve the mobile app design mockups",
        projectId: "2",
        projectName: "Mobile App Redesign",
        dueDate: "2024-03-25",
        status: "in-progress",
        priority: "medium",
        progress: 40,
        assignedTo: ["Derartu Tulu"],
        dependencies: [],
        createdBy: "Manager",
        createdAt: "2024-02-20",
      },
      {
        id: "4",
        title: "Security Testing",
        description: "Conduct comprehensive security testing of the banking system",
        projectId: "3",
        projectName: "Security Compliance Audit",
        dueDate: "2024-03-01",
        status: "completed",
        priority: "high",
        progress: 100,
        assignedTo: ["Abebe Bikila", "Haile Gebrselassie"],
        dependencies: ["2"],
        completionDate: "2024-02-28",
        createdBy: "Manager",
        createdAt: "2024-01-15",
      },
      {
        id: "5",
        title: "Performance Optimization",
        description: "Optimize system performance and load testing",
        projectId: "1",
        projectName: "Core Banking System Upgrade",
        dueDate: "2024-05-10",
        status: "not-started",
        priority: "medium",
        progress: 0,
        assignedTo: ["Tirunesh Dibaba"],
        dependencies: ["2"],
        createdBy: "Manager",
        createdAt: "2024-03-01",
      },
    ]

    setProjects(mockProjects)
    setMilestones(mockMilestones)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200"
      case "in-progress":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "overdue":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "low":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: "numeric", month: "short", day: "numeric" }
    return new Date(dateString).toLocaleDateString(undefined, options)
  }

  const handleCreateMilestone = () => {
    if (!newMilestone.title || !newMilestone.projectId || !newMilestone.dueDate) {
      toast.error("Please fill in all required fields")
      return
    }

    const project = projects.find((p) => p.id === newMilestone.projectId)
    const milestone: Milestone = {
      id: Date.now().toString(),
      title: newMilestone.title!,
      description: newMilestone.description || "",
      projectId: newMilestone.projectId!,
      projectName: project?.name || "",
      dueDate: newMilestone.dueDate!,
      status: "not-started",
      priority: newMilestone.priority || "medium",
      progress: 0,
      assignedTo: newMilestone.assignedTo || [],
      dependencies: newMilestone.dependencies || [],
      createdBy: "Manager",
      createdAt: new Date().toISOString().split("T")[0],
    }

    setMilestones((prev) => [...prev, milestone])
    setNewMilestone({
      title: "",
      description: "",
      projectId: "",
      dueDate: "",
      priority: "medium",
      assignedTo: [],
      dependencies: [],
    })
    setIsCreateModalOpen(false)
    toast.success("Milestone created successfully")
  }

  const handleUpdateMilestone = () => {
    if (!selectedMilestone) return

    setMilestones((prev) => prev.map((m) => (m.id === selectedMilestone.id ? { ...selectedMilestone } : m)))
    setIsEditModalOpen(false)
    setSelectedMilestone(null)
    toast.success("Milestone updated successfully")
  }

  const handleDeleteMilestone = (id: string) => {
    setMilestones((prev) => prev.filter((m) => m.id !== id))
    toast.success("Milestone deleted successfully")
  }

  const stats = {
    total: milestones.length,
    completed: milestones.filter((m) => m.status === "completed").length,
    inProgress: milestones.filter((m) => m.status === "in-progress").length,
    overdue: milestones.filter((m) => m.status === "overdue").length,
  }

  return (
    <div className="space-y-6 w-full p-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Milestones Management
          </h2>
          <p className="text-muted-foreground mt-1">Track and manage project milestones across all your projects</p>
        </div>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white h-11 px-6 text-base transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl"
        >
          <Plus className="mr-2 h-5 w-5" />
          Create Milestone
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Milestones</CardTitle>
            <Target className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <p className="text-xs text-muted-foreground">All milestones</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">Successfully completed</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.inProgress}</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
            <p className="text-xs text-muted-foreground">Past due date</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="w-full hover:shadow-lg transition-shadow duration-200">
        <CardHeader>
          <CardTitle className="text-xl">Milestones</CardTitle>
          <CardDescription>Manage and track all project milestones</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search milestones..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px] h-10">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="not-started">Not Started</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>

              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-[140px] h-10">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>

              <Select value={projectFilter} onValueChange={setProjectFilter}>
                <SelectTrigger className="w-[180px] h-10">
                  <SelectValue placeholder="Project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Show</span>
              <Select
                value={itemsPerPage.toString()}
                onValueChange={(value) => {
                  setItemsPerPage(value === "all" ? -1 : Number.parseInt(value))
                  setCurrentPage(1)
                }}
              >
                <SelectTrigger className="w-20 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                  <SelectItem value="all">All</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground">entries ({totalItems} total)</span>
            </div>

            {itemsPerPage !== -1 && totalPages > 1 && (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm px-2">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Milestones Table */}
          <div className="overflow-x-auto rounded-lg border">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assigned
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Project
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Progress
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedMilestones.map((milestone) => (
                  <tr
                    key={milestone.id}
                    className="cursor-pointer hover:bg-gray-50 transition-colors duration-150"
                    onClick={(e) => {
                      // Prevent opening modal if clicking edit/delete
                      if ((e.target as HTMLElement).closest("button")) return
                      setSelectedMilestoneForView(milestone)
                    }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-semibold text-gray-900">{milestone.title}</div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">{milestone.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getStatusColor(milestone.status)}`}
                      >
                        {milestone.status.replace("-", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getPriorityColor(milestone.priority)}`}
                      >
                        {milestone.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        {formatDate(milestone.dueDate)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-gray-400" />
                        {milestone.assignedTo.length}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 max-w-xs truncate">
                      {milestone.projectName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{milestone.progress}%</span>
                        <div className="w-20">
                          <Progress
                            value={milestone.progress}
                            className="h-2 [&>div]:bg-gradient-to-r [&>div]:from-purple-500 [&>div]:to-purple-600"
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedMilestone(milestone)
                            setIsEditModalOpen(true)
                          }}
                          className="hover:bg-purple-50 hover:border-purple-300 hover:text-purple-700"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteMilestone(milestone.id)
                          }}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-300"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {paginatedMilestones.length === 0 && (
              <div className="text-center py-12">
                <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No milestones found</h3>
                <p className="text-gray-500">Try adjusting your search or filters</p>
              </div>
            )}
          </div>

          {itemsPerPage !== -1 && totalItems > 0 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} entries
              </div>
              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  {/* Page numbers */}
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (currentPage <= 3) {
                      pageNum = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }

                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className="w-8 h-8"
                      >
                        {pageNum}
                      </Button>
                    )
                  })}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Milestone Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Milestone</DialogTitle>
            <DialogDescription>Add a new milestone to track project progress</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Milestone Title *</Label>
                <Input
                  id="title"
                  value={newMilestone.title}
                  onChange={(e) => setNewMilestone((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter milestone title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="project">Project *</Label>
                <Select
                  value={newMilestone.projectId}
                  onValueChange={(value) => setNewMilestone((prev) => ({ ...prev, projectId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newMilestone.description}
                onChange={(e) => setNewMilestone((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Enter milestone description"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date *</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={newMilestone.dueDate}
                  onChange={(e) => setNewMilestone((prev) => ({ ...prev, dueDate: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={newMilestone.priority}
                  onValueChange={(value: "high" | "medium" | "low") =>
                    setNewMilestone((prev) => ({ ...prev, priority: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateMilestone} className="bg-purple-600 hover:bg-purple-700 text-white">
              Create Milestone
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Milestone Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Milestone</DialogTitle>
            <DialogDescription>Update milestone details and progress</DialogDescription>
          </DialogHeader>
          {selectedMilestone && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-title">Milestone Title</Label>
                  <Input
                    id="edit-title"
                    value={selectedMilestone.title}
                    onChange={(e) => setSelectedMilestone((prev) => (prev ? { ...prev, title: e.target.value } : null))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-status">Status</Label>
                  <Select
                    value={selectedMilestone.status}
                    onValueChange={(value: "not-started" | "in-progress" | "completed" | "overdue") =>
                      setSelectedMilestone((prev) => (prev ? { ...prev, status: value } : null))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not-started">Not Started</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={selectedMilestone.description}
                  onChange={(e) =>
                    setSelectedMilestone((prev) => (prev ? { ...prev, description: e.target.value } : null))
                  }
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-dueDate">Due Date</Label>
                  <Input
                    id="edit-dueDate"
                    type="date"
                    value={selectedMilestone.dueDate}
                    onChange={(e) =>
                      setSelectedMilestone((prev) => (prev ? { ...prev, dueDate: e.target.value } : null))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-progress">Progress (%)</Label>
                  <Input
                    id="edit-progress"
                    type="number"
                    min="0"
                    max="100"
                    value={selectedMilestone.progress}
                    onChange={(e) =>
                      setSelectedMilestone((prev) =>
                        prev ? { ...prev, progress: Number.parseInt(e.target.value) || 0 } : null,
                      )
                    }
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateMilestone} className="bg-purple-600 hover:bg-purple-700 text-white">
              Update Milestone
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Milestone Modal */}
      <Dialog open={!!selectedMilestoneForView} onOpenChange={(open) => !open && setSelectedMilestoneForView(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-6 border-b">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center">
                    <Target className="h-5 w-5 text-white" />
                  </div>
                  {selectedMilestoneForView?.title}
                </DialogTitle>
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-semibold ${getStatusColor(selectedMilestoneForView?.status || "")}`}
                  >
                    {selectedMilestoneForView?.status.replace("-", " ")}
                  </span>
                  <span
                    className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-semibold ${getPriorityColor(selectedMilestoneForView?.priority || "")}`}
                  >
                    {selectedMilestoneForView?.priority} priority
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-purple-600 mb-1">{selectedMilestoneForView?.progress}%</div>
                <div className="w-24">
                  <Progress
                    value={selectedMilestoneForView?.progress || 0}
                    className="h-3 [&>div]:bg-gradient-to-r [&>div]:from-purple-500 [&>div]:to-purple-600"
                  />
                </div>
              </div>
            </div>
          </DialogHeader>

          {selectedMilestoneForView && (
            <div className="py-6 space-y-8">
              {/* Description Section */}
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center">
                    <span className="text-purple-600 text-sm">📝</span>
                  </div>
                  Description
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  {selectedMilestoneForView.description || "No description provided"}
                </p>
              </div>

              {/* Key Information Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Timeline Card */}
                <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-purple-500">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2 text-gray-900">
                      <Calendar className="h-5 w-5 text-purple-600" />
                      Timeline
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-600">Due Date</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {formatDate(selectedMilestoneForView.dueDate)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-600">Created</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {formatDate(selectedMilestoneForView.createdAt)}
                      </span>
                    </div>
                    {selectedMilestoneForView.completionDate && (
                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                        <span className="text-sm font-medium text-green-700">Completed</span>
                        <span className="text-sm font-semibold text-green-800">
                          {formatDate(selectedMilestoneForView.completionDate)}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Team & Project Card */}
                <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-indigo-500">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2 text-gray-900">
                      <Users className="h-5 w-5 text-indigo-600" />
                      Team & Project
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-600 block mb-1">Project</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {selectedMilestoneForView.projectName}
                      </span>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-600 block mb-1">Created By</span>
                      <span className="text-sm font-semibold text-gray-900">{selectedMilestoneForView.createdBy}</span>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-600 block mb-2">Assigned Team</span>
                      <div className="flex flex-wrap gap-2">
                        {selectedMilestoneForView.assignedTo.length > 0 ? (
                          selectedMilestoneForView.assignedTo.map((person, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200"
                            >
                              <div className="w-4 h-4 rounded-full bg-purple-300 mr-2 flex items-center justify-center">
                                <span className="text-purple-700 text-xs">👤</span>
                              </div>
                              {person}
                            </span>
                          ))
                        ) : (
                          <span className="text-sm text-gray-500 italic">No team members assigned</span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Dependencies Section */}
              {selectedMilestoneForView.dependencies.length > 0 && (
                <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-orange-500">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2 text-gray-900">
                      <AlertCircle className="h-5 w-5 text-orange-600" />
                      Dependencies
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {selectedMilestoneForView.dependencies.map((dep, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800 border border-orange-200"
                        >
                          <div className="w-4 h-4 rounded-full bg-orange-300 mr-2 flex items-center justify-center">
                            <span className="text-orange-700 text-xs">🔗</span>
                          </div>
                          Milestone #{dep}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Progress Visualization */}
              <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-purple-500">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2 text-gray-900">
                    <CheckCircle className="h-5 w-5 text-purple-600" />
                    Progress Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-purple-600">
                        {selectedMilestoneForView.progress}% Complete
                      </span>
                      <span className="text-sm text-gray-500">
                        {selectedMilestoneForView.status === "completed"
                          ? "Finished"
                          : selectedMilestoneForView.status === "in-progress"
                            ? "In Progress"
                            : "Not Started"}
                      </span>
                    </div>
                    <div className="w-full">
                      <Progress
                        value={selectedMilestoneForView.progress}
                        className="h-4 [&>div]:bg-gradient-to-r [&>div]:from-purple-500 [&>div]:to-purple-600"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-4 mt-4">
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-lg font-bold text-gray-900">
                          {selectedMilestoneForView.status === "completed"
                            ? "✅"
                            : selectedMilestoneForView.status === "in-progress"
                              ? "🔄"
                              : "⏳"}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">Status</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-lg font-bold text-purple-600">
                          {selectedMilestoneForView.assignedTo.length}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">Team Size</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-lg font-bold text-indigo-600">
                          {selectedMilestoneForView.dependencies.length}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">Dependencies</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Milestones
