"use client"

import { useState, useEffect, useRef } from "react"
import DashboardLayout from "@/components/layout/DashboardLayout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Briefcase, Code, CheckCircle, Clock, X, Mail } from "lucide-react"
import $ from "jquery"
import "datatables.net"

interface TeamMember {
  id: string
  name: string
  position: string
  skills: string[]
}

interface TeamsProps {
  darkMode: boolean
  setDarkMode: (darkMode: boolean) => void
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
}

const Teams = ({ darkMode, setDarkMode, sidebarOpen, setSidebarOpen }: TeamsProps) => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    {
      id: "1",
      name: "Abebe Kebede",
      position: "Senior Developer",
      skills: ["React", "Node.js", "TypeScript", "MongoDB", "AWS"],
    },
    {
      id: "2",
      name: "Almaz Bekele",
      position: "Product Manager",
      skills: ["Agile", "Scrum", "Product Strategy", "User Research", "Analytics"],
    },
    {
      id: "3",
      name: "Kebede Alemu",
      position: "UX Designer",
      skills: ["Figma", "Adobe XD", "User Research", "Prototyping", "Design Systems"],
    },
    {
      id: "4",
      name: "Mulu Habte",
      position: "QA Engineer",
      skills: ["Selenium", "Jest", "Cypress", "Manual Testing", "API Testing"],
    },
    {
      id: "5",
      name: "Tigist Fikre",
      position: "DevOps Engineer",
      skills: ["Docker", "Kubernetes", "Jenkins", "AWS", "Terraform"],
    },
    {
      id: "6",
      name: "Getachew Tadesse",
      position: "Frontend Developer",
      skills: ["React", "Vue.js", "CSS", "JavaScript", "Tailwind CSS"],
    },
    {
      id: "7",
      name: "Hanna Tesfaye",
      position: "Backend Developer",
      skills: ["Python", "Django", "PostgreSQL", "Redis", "GraphQL"],
    },
    {
      id: "8",
      name: "Birhanu Degu",
      position: "Product Designer",
      skills: ["Sketch", "InVision", "User Testing", "Wireframing", "Brand Design"],
    },
    {
      id: "9",
      name: "Selamawit Asfaw",
      position: "Project Manager",
      skills: ["PMP", "Jira", "Risk Management", "Stakeholder Management", "Budget Planning"],
    },
    {
      id: "10",
      name: "Yared Mamo",
      position: "QA Lead",
      skills: ["Test Strategy", "Team Leadership", "Automation", "Performance Testing", "Quality Assurance"],
    },
  ])
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const tableRef = useRef<HTMLTableElement>(null)
  const dataTableRef = useRef<any>(null)
  const [showModal, setShowModal] = useState(false)
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null)

  useEffect(() => {
    if (tableRef.current) {
      const dataTable = $(tableRef.current).DataTable({
        destroy: true,
        pageLength: 5,
        lengthMenu: [
          [5, 10, 25, 50, -1],
          [5, 10, 25, 50, "All"],
        ],
        order: [[0, "asc"]],
        language: {
          paginate: {
            first: "First",
            previous: "Previous",
            next: "Next",
            last: "Last",
          },
          info: "Showing _START_ to _END_ of _TOTAL_ entries",
          search: "Search team members:",
          lengthMenu: "Show _MENU_ members",
        },
        dom: '<"flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 mt-2 ml-2"<"flex flex-col sm:flex-row items-start sm:items-center gap-2"l><"flex items-center gap-2"f>>t<"flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-4 px-4 sm:px-6"<"text-sm text-gray-500"i><"flex items-center gap-2"p>>',
      })
      dataTableRef.current = dataTable
    }

    return () => {
      if (dataTableRef.current) {
        dataTableRef.current.destroy()
        dataTableRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (!dataTableRef.current) return
    dataTableRef.current.search(searchQuery).draw()
  }, [searchQuery])

  useEffect(() => {
    if (!dataTableRef.current) return
    if (roleFilter === "all") {
      dataTableRef.current.column(1).search("").draw()
    } else {
      dataTableRef.current.column(1).search(roleFilter).draw()
    }
  }, [roleFilter])

  const uniquePositions = Array.from(new Set(teamMembers.map((member) => member.position)))

  const mockProjects = [
    { id: "1", name: "Banking System Upgrade", members: ["1", "2", "3"] },
    { id: "2", name: "Mobile Wallet App", members: ["1", "4", "5"] },
  ]
  const mockTasks = [
    { id: "t1", title: "Design Dashboard UI", assignedTo: "1", status: "completed", projectId: "1" },
    { id: "t2", title: "Integrate Payment API", assignedTo: "1", status: "in-progress", projectId: "2" },
    { id: "t3", title: "Write Test Cases", assignedTo: "2", status: "in-progress", projectId: "1" },
    { id: "t4", title: "Review User Stories", assignedTo: "3", status: "completed", projectId: "1" },
  ]

  const handleViewMember = (member: TeamMember) => {
    setSelectedMember(member)
    setShowModal(true)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return darkMode ? "bg-green-900/30 text-green-400" : "bg-green-100 text-green-800"
      case "in-progress":
        return darkMode ? "bg-yellow-900/30 text-yellow-400" : "bg-yellow-100 text-yellow-800"
      default:
        return darkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-800"
    }
  }

  return (
    <DashboardLayout
      darkMode={darkMode}
      setDarkMode={setDarkMode}
      sidebarOpen={sidebarOpen}
      setSidebarOpen={setSidebarOpen}
    >
      <div
        className={`min-h-screen ${darkMode ? "bg-zinc-900 text-gray-300" : "bg-gradient-to-br from-gray-50 via-white to-fuchsia-50/30"} pt-12`}
      >
        <div className="space-y-6 w-full p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2
                className={`text-3xl font-bold tracking-tight ${darkMode ? "text-gray-300" : "bg-gradient-to-r from-fuchsia-800 to-stone-800 bg-clip-text text-transparent"}`}
              >
                Team Members
              </h2>
              <p className={`${darkMode ? "text-gray-400" : "text-muted-foreground"} mt-1`}>
                Manage and view your team members
              </p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search
                className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${darkMode ? "text-gray-400" : "text-gray-400"}`}
                size={20}
              />
              <Input
                type="text"
                placeholder="Search by name or position..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`pl-10 h-11 text-base ${darkMode ? "bg-zinc-700 border-zinc-600 text-gray-300 focus:border-fuchsia-500" : ""}`}
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger
                className={`w-[180px] h-11 text-base ${darkMode ? "bg-zinc-700 border-zinc-600 text-gray-300" : ""}`}
              >
                <SelectValue placeholder="Filter by position" />
              </SelectTrigger>
              <SelectContent className={darkMode ? "bg-zinc-800 border-zinc-700" : ""}>
                <SelectItem value="all" className={darkMode ? "hover:bg-zinc-700" : ""}>
                  All Positions
                </SelectItem>
                {uniquePositions.map((position) => (
                  <SelectItem key={position} value={position} className={darkMode ? "hover:bg-zinc-700" : ""}>
                    {position}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Card
            className={`w-full hover:shadow-lg transition-shadow duration-200 ${darkMode ? "bg-zinc-800 border-zinc-700" : ""}`}
          >
            <CardHeader>
              <CardTitle className={`text-xl ${darkMode ? "text-gray-300" : ""}`}>Team Members</CardTitle>
              <CardDescription className={`text-base ${darkMode ? "text-gray-400" : ""}`}>
                View and manage your team members
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className={`rounded-lg border ${darkMode ? "border-zinc-700" : ""}`}>
                <table ref={tableRef} className={`display w-full text-sm ${darkMode ? "text-gray-300" : ""}`}>
                  <thead className={darkMode ? "bg-zinc-700" : ""}>
                    <tr>
                      <th className={darkMode ? "border-zinc-600" : ""}>Name</th>
                      <th className={darkMode ? "border-zinc-600" : ""}>Position</th>
                      <th className={darkMode ? "border-zinc-600" : ""}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamMembers.map((member) => (
                      <tr
                        key={member.id}
                        className={`border-b ${darkMode ? "hover:bg-zinc-700 border-zinc-600" : "hover:bg-muted/50"}`}
                      >
                        <td className={`px-6 py-4 ${darkMode ? "border-zinc-600" : ""}`}>{member.name}</td>
                        <td className={`px-6 py-4 ${darkMode ? "border-zinc-600" : ""}`}>{member.position}</td>
                        <td className={`px-6 py-4 text-right ${darkMode ? "border-zinc-600" : ""}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewMember(member)}
                            className={darkMode ? "hover:bg-zinc-700" : ""}
                          >
                            View Details
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {showModal && selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div
            className={`relative rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden ${
              darkMode ? "bg-zinc-900 border border-zinc-700" : "bg-white border border-gray-200"
            }`}
          >
            {/* Header with close button */}
            <div
              className={`relative p-6 pb-4 ${
                darkMode ? "bg-gradient-to-r from-zinc-800 to-zinc-900" : "bg-gradient-to-r from-gray-50 to-white"
              }`}
            >
              <button
                onClick={() => setShowModal(false)}
                className={`absolute top-4 right-4 p-2 rounded-full transition-colors ${
                  darkMode
                    ? "hover:bg-zinc-700 text-gray-400 hover:text-white"
                    : "hover:bg-gray-100 text-gray-500 hover:text-gray-700"
                }`}
              >
                <X size={20} />
              </button>

              {/* Profile section */}
              <div className="flex items-start gap-4">
                <div className="relative">
                  <div
                    className={`w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold ${
                      darkMode
                        ? "bg-gradient-to-br from-blue-600 to-purple-600 text-white"
                        : "bg-gradient-to-br from-blue-500 to-purple-500 text-white"
                    }`}
                  >
                    {selectedMember.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                </div>

                <div className="flex-1">
                  <h2 className={`text-2xl font-bold mb-1 ${darkMode ? "text-white" : "text-gray-900"}`}>
                    {selectedMember.name}
                  </h2>
                  <div className="flex items-center gap-2 mb-3">
                    <Briefcase size={16} className={darkMode ? "text-blue-400" : "text-blue-600"} />
                    <span className={`font-medium ${darkMode ? "text-blue-400" : "text-blue-600"}`}>
                      {selectedMember.position}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Mail size={14} className={darkMode ? "text-gray-400" : "text-gray-500"} />
                      <span className={darkMode ? "text-gray-400" : "text-gray-600"}>
                        {selectedMember.name.toLowerCase().replace(" ", ".")}@company.com
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
              {/* Skills Section */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Code size={18} className={darkMode ? "text-purple-400" : "text-purple-600"} />
                  <h3 className={`font-semibold text-lg ${darkMode ? "text-white" : "text-gray-900"}`}>
                    Skills & Expertise
                  </h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedMember.skills.map((skill, index) => (
                    <span
                      key={index}
                      className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
                        darkMode
                          ? "bg-purple-900/30 text-purple-300 border border-purple-700/50 hover:bg-purple-800/40"
                          : "bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100"
                      }`}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Projects Section */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Briefcase size={18} className={darkMode ? "text-green-400" : "text-green-600"} />
                  <h3 className={`font-semibold text-lg ${darkMode ? "text-white" : "text-gray-900"}`}>
                    Active Projects
                  </h3>
                </div>
                <div className="space-y-3">
                  {mockProjects
                    .filter((p) => p.members.includes(selectedMember.id))
                    .map((project) => (
                      <div
                        key={project.id}
                        className={`p-4 rounded-xl border ${
                          darkMode ? "bg-zinc-800/50 border-zinc-700" : "bg-gray-50 border-gray-200"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`font-medium ${darkMode ? "text-white" : "text-gray-900"}`}>
                            {project.name}
                          </span>
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              darkMode ? "bg-green-900/30 text-green-400" : "bg-green-100 text-green-700"
                            }`}
                          >
                            Active
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Tasks Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* All Tasks */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle size={18} className={darkMode ? "text-blue-400" : "text-blue-600"} />
                    <h3 className={`font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>All Tasks</h3>
                  </div>
                  <div className="space-y-2">
                    {mockTasks
                      .filter((t) => t.assignedTo === selectedMember.id)
                      .map((task) => (
                        <div
                          key={task.id}
                          className={`p-3 rounded-lg border ${
                            darkMode ? "bg-zinc-800/30 border-zinc-700" : "bg-white border-gray-200"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className={`text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                              {task.title}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(task.status)}`}>
                              {task.status === "in-progress" ? "In Progress" : "Completed"}
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Task Statistics */}
                <div>
                  <h3 className={`font-semibold mb-3 ${darkMode ? "text-white" : "text-gray-900"}`}>Task Statistics</h3>
                  <div className="space-y-3">
                    <div
                      className={`p-3 rounded-lg ${
                        darkMode ? "bg-green-900/20 border border-green-700/30" : "bg-green-50 border border-green-200"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle size={16} className={darkMode ? "text-green-400" : "text-green-600"} />
                        <span className={`text-sm font-medium ${darkMode ? "text-green-400" : "text-green-700"}`}>
                          Completed Tasks
                        </span>
                      </div>
                      <div className={`text-2xl font-bold mt-1 ${darkMode ? "text-green-300" : "text-green-800"}`}>
                        {mockTasks.filter((t) => t.assignedTo === selectedMember.id && t.status === "completed").length}
                      </div>
                    </div>

                    <div
                      className={`p-3 rounded-lg ${
                        darkMode
                          ? "bg-yellow-900/20 border border-yellow-700/30"
                          : "bg-yellow-50 border border-yellow-200"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Clock size={16} className={darkMode ? "text-yellow-400" : "text-yellow-600"} />
                        <span className={`text-sm font-medium ${darkMode ? "text-yellow-400" : "text-yellow-700"}`}>
                          Active Tasks
                        </span>
                      </div>
                      <div className={`text-2xl font-bold mt-1 ${darkMode ? "text-yellow-300" : "text-yellow-800"}`}>
                        {mockTasks.filter((t) => t.assignedTo === selectedMember.id && t.status !== "completed").length}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div
              className={`p-6 pt-4 border-t ${
                darkMode ? "border-zinc-700 bg-zinc-800/50" : "border-gray-200 bg-gray-50"
              }`}
            >
              <div className="flex justify-end">
                <Button
                  onClick={() => setShowModal(false)}
                  className={`px-6 ${
                    darkMode ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}

export default Teams
