import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, BarChart,  TrendingUp,  CheckCircle2,  ChevronLeft, ChevronRight } from "lucide-react";

interface TeamMember {
    id: string;
    name: string;
    role: string;
    tasksCompleted: number;
    tasksInProgress: number;
    performance: number;
}

interface Project {
    id: string;
    name: string;
    progress: number;
    dueDate: string;
    status: 'active' | 'completed' | 'on-hold';
    teamMembers: number;
}

interface SupervisorDashboardProps {
    darkMode: boolean;
    setDarkMode: (darkMode: boolean) => void;
    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
}

const SupervisorDashboard = ({ darkMode, setDarkMode, sidebarOpen, setSidebarOpen }: SupervisorDashboardProps) => {
    const { user } = useAuth();
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
    const membersPerPage = 5;

    useEffect(() => {
        // Mock data for team members
        const mockTeamMembers: TeamMember[] = [
            {
                id: "1",
                name: "Roman Endale",
                role: "Senior Developer",
                tasksCompleted: 12,
                tasksInProgress: 3,
                performance: 92,
            },
            {
                id: "2",
                name: "Beza Melaku",
                role: "Developer",
                tasksCompleted: 8,
                tasksInProgress: 4,
                performance: 85,
            },
            {
                id: "3",
                name: "Bereket Molla",
                role: "Junior Developer",
                tasksCompleted: 6,
                tasksInProgress: 2,
                performance: 88,
            },
            {
                id: "4",
                name: "Sena Kebede",
                role: "Developer",
                tasksCompleted: 10,
                tasksInProgress: 3,
                performance: 90,
            },
            {
                id: "5",
                name: "Fitsum Tulu",
                role: "Developer",
                tasksCompleted: 7,
                tasksInProgress: 5,
                performance: 82,
            },
        ];

        // Mock data for projects
        const mockProjects: Project[] = [
            {
                id: "1",
                name: "Core Banking System Upgrade",
                progress: 75,
                dueDate: "2024-06-15",
                status: "active",
                teamMembers: 4,
            },
            {
                id: "2",
                name: "Mobile App Redesign",
                progress: 45,
                dueDate: "2024-07-01",
                status: "active",
                teamMembers: 3,
            },
            {
                id: "3",
                name: "Security Compliance Audit",
                progress: 90,
                dueDate: "2024-05-30",
                status: "active",
                teamMembers: 2,
            },
        ];

        setTeamMembers(mockTeamMembers);
        setProjects(mockProjects);
    }, []);

    // Calculate pagination
    const indexOfLastMember = currentPage * membersPerPage;
    const indexOfFirstMember = indexOfLastMember - membersPerPage;
    const currentMembers = teamMembers.slice(indexOfFirstMember, indexOfLastMember);
    const totalPages = Math.ceil(teamMembers.length / membersPerPage);

    const handleMemberSelect = (member: TeamMember) => {
        setSelectedMember(member);
    };

    // Format date to be more readable
    const formatDate = (dateString: string) => {
        const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    return (
        <DashboardLayout
            darkMode={darkMode}
            setDarkMode={setDarkMode}
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
        >
            <div className="space-y-6 w-full">
                <div className="flex justify-between items-center">
                    <h2 className="text-3xl font-bold tracking-tight">Supervisor Dashboard</h2>
                </div>

                {/* Overview Cards */}
                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{teamMembers.length}</div>
                            <p className="text-xs text-muted-foreground">
                                Active Team Members
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
                            <BarChart className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {teamMembers.reduce((acc, member) => acc + member.tasksInProgress, 0)}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Active Tasks
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Completed Tasks</CardTitle>
                            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {teamMembers.reduce((acc, member) => acc + member.tasksCompleted, 0)}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                This Sprint
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Average Performance</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {Math.round(
                                    teamMembers.reduce((acc, member) => acc + member.performance, 0) / teamMembers.length
                                )}%
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Team Performance Score
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Projects Overview */}
                {/* <Card>
                    <CardHeader>
                        <CardTitle>Active Projects</CardTitle>
                        <CardDescription>
                            Overview of current project progress
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {projects.map((project) => (
                                <div key={project.id} className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h4 className="font-medium">{project.name}</h4>
                                            <p className="text-sm text-muted-foreground">
                                                Due: {formatDate(project.dueDate)} • {project.teamMembers} team members
                                            </p>
                                        </div>
                                        <span className="text-sm font-medium">{project.progress}%</span>
                                    </div>
                                    <div className="h-2 w-full rounded-full bg-gray-200">
                                        <div
                                            className={`h-full rounded-full ${project.progress >= 80
                                                ? "bg-green-500"
                                                : project.progress >= 50
                                                    ? "bg-blue-500"
                                                    : "bg-yellow-500"
                                                }`}
                                            style={{ width: `${project.progress}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card> */}

                {/* Team Members Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Team Members</CardTitle>
                        <CardDescription>
                            Overview of team member performance and tasks
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b bg-muted/50">
                                        <th className="px-4 py-3 text-left">Name</th>
                                        <th className="px-4 py-3 text-left">Role</th>
                                        <th className="px-4 py-3 text-left">Tasks</th>
                                        <th className="px-4 py-3 text-left">Performance</th>
                                        <th className="px-4 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentMembers.map((member) => (
                                        <tr key={member.id} className="border-b hover:bg-muted/50">
                                            <td className="px-4 py-3 font-medium">{member.name}</td>
                                            <td className="px-4 py-3">{member.role}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-green-600">{member.tasksCompleted} completed</span>
                                                    <span className="text-blue-600">/ {member.tasksInProgress} active</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-2 w-full rounded-full bg-gray-200">
                                                        <div
                                                            className={`h-full rounded-full ${member.performance >= 90
                                                                ? "bg-green-500"
                                                                : member.performance >= 80
                                                                    ? "bg-blue-500"
                                                                    : "bg-yellow-500"
                                                                }`}
                                                            style={{ width: `${member.performance}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs font-medium">{member.performance}%</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleMemberSelect(member)}
                                                    className="bg-fuchsia-800 hover:bg-stone-800 text-white text-base py-1 px-3 hover:border-yellow-400 rounded"
                                                >
                                                    View Details
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-end space-x-2 mt-4">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="bg-fuchsia-800 hover:bg-stone-800 text-white text-base py-1 px-3 hover:border-yellow-400 rounded"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <span className="text-sm text-muted-foreground">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="bg-fuchsia-800 hover:bg-stone-800 text-white text-base py-1 px-3 hover:border-yellow-400 rounded"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Team Member Details Modal */}
                {/* {selectedMember && (
                    <Card className="mt-6">
                        <CardHeader>
                            <CardTitle>{selectedMember.name}'s Performance Overview</CardTitle>
                            <CardDescription>
                                Detailed performance metrics and task breakdown
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 md:grid-cols-3">
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Completed Tasks</CardTitle>
                                        <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{selectedMember.tasksCompleted}</div>
                                        <p className="text-xs text-muted-foreground">
                                            Successfully delivered
                                        </p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Active Tasks</CardTitle>
                                        <Clock className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{selectedMember.tasksInProgress}</div>
                                        <p className="text-xs text-muted-foreground">
                                            Currently in progress
                                        </p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Performance Score</CardTitle>
                                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{selectedMember.performance}%</div>
                                        <p className="text-xs text-muted-foreground">
                                            Overall performance
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>
                        </CardContent>
                    </Card>
                )} */}
            </div>
        </DashboardLayout>
    );
};

export default SupervisorDashboard;
