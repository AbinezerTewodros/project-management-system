import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, BarChart, AlertCircle, CheckCircle2, Clock } from "lucide-react";

interface Task {
    id: string;
    title: string;
    project: string;
    teamLeader: string;
    dueDate: string;
    status: 'completed' | 'in-progress' | 'blocked';
    priority: 'high' | 'medium' | 'low';
}

interface Project {
    id: string;
    name: string;
    teamLeader: string;
    progress: number;
    status: 'active' | 'completed' | 'on-hold';
}

interface MemberDashboardProps {
    darkMode: boolean;
    setDarkMode: (darkMode: boolean) => void;
    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
}

const MemberDashboard = ({ darkMode, setDarkMode, sidebarOpen, setSidebarOpen }: MemberDashboardProps) => {
    const { user } = useAuth();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);

    useEffect(() => {
        // Mock data for tasks
        const mockTasks: Task[] = [
            {
                id: "1",
                title: "Implement user authentication",
                project: "Core Banking System Upgrade",
                teamLeader: "Sarah Chen",
                dueDate: "2024-03-15",
                status: "in-progress",
                priority: "high",
            },
            {
                id: "2",
                title: "Fix navigation bugs",
                project: "Mobile App Redesign",
                teamLeader: "Michael Rodriguez",
                dueDate: "2024-03-10",
                status: "completed",
                priority: "medium",
            },
            {
                id: "3",
                title: "Update documentation",
                project: "Security Compliance Audit",
                teamLeader: "Emily Thompson",
                dueDate: "2024-03-20",
                status: "blocked",
                priority: "low",
            },
        ];

        // Mock data for projects
        const mockProjects: Project[] = [
            {
                id: "1",
                name: "Core Banking System Upgrade",
                teamLeader: "Sarah Chen",
                progress: 65,
                status: 'active',
            },
            {
                id: "2",
                name: "Mobile App Redesign",
                teamLeader: "Michael Rodriguez",
                progress: 32,
                status: 'active',
            },
        ];

        setTasks(mockTasks);
        setProjects(mockProjects);
    }, []);

    return (
        <DashboardLayout darkMode={darkMode} setDarkMode={setDarkMode} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}>
            <div className="space-y-6 w-full">
                <div className="flex justify-between items-center">
                    <h2 className="text-3xl font-bold tracking-tight">Member Dashboard</h2>
                </div>

                {/* Overview Cards */}
                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
                            <BarChart className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{tasks.length}</div>
                            <p className="text-xs text-muted-foreground">
                                Assigned Tasks
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
                                {tasks.filter(task => task.status === 'completed').length}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                This Sprint
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {projects.filter(p => p.status === 'active').length}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Current Projects
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Upcoming Deadlines</CardTitle>
                            <Clock className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {tasks.filter(task => {
                                    const dueDate = new Date(task.dueDate);
                                    const today = new Date();
                                    const diffTime = dueDate.getTime() - today.getTime();
                                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                    return diffDays <= 7 && task.status !== 'completed';
                                }).length}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Next 7 Days
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Tasks Overview */}
                <Card>
                    <CardHeader>
                        <CardTitle>My Tasks</CardTitle>
                        <CardDescription>
                            Overview of your assigned tasks and their status
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b bg-muted/50">
                                        <th className="px-4 py-3 text-left">Task</th>
                                        <th className="px-4 py-3 text-left">Project</th>
                                        <th className="px-4 py-3 text-left">Team Leader</th>
                                        <th className="px-4 py-3 text-left">Due Date</th>
                                        <th className="px-4 py-3 text-left">Status</th>
                                        <th className="px-4 py-3 text-left">Priority</th>
                                        <th className="px-4 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tasks.map((task) => (
                                        <tr key={task.id} className="border-b hover:bg-muted/50">
                                            <td className="px-4 py-3 font-medium">{task.title}</td>
                                            <td className="px-4 py-3">{task.project}</td>
                                            <td className="px-4 py-3">{task.teamLeader}</td>
                                            <td className="px-4 py-3">{new Date(task.dueDate).toLocaleDateString()}</td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${task.status === 'completed'
                                                        ? 'bg-green-100 text-green-800'
                                                        : task.status === 'in-progress'
                                                            ? 'bg-blue-100 text-blue-800'
                                                            : 'bg-red-100 text-red-800'
                                                        }`}
                                                >
                                                    {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${task.priority === 'high'
                                                        ? 'bg-red-100 text-red-800'
                                                        : task.priority === 'medium'
                                                            ? 'bg-yellow-100 text-yellow-800'
                                                            : 'bg-green-100 text-green-800'
                                                        }`}
                                                >
                                                    {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="bg-fuchsia-800 hover:bg-stone-800 text-white text-base py-1 px-3 hover:border-yellow-400 rounded"
                                                >
                                                    Update Status
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* Projects Overview */}
                <Card>
                    <CardHeader>
                        <CardTitle>My Projects</CardTitle>
                        <CardDescription>
                            Overview of projects you are involved in
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b bg-muted/50">
                                        <th className="px-4 py-3 text-left">Project</th>
                                        <th className="px-4 py-3 text-left">Team Leader</th>
                                        <th className="px-4 py-3 text-left">Progress</th>
                                        <th className="px-4 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {projects.map((project) => (
                                        <tr key={project.id} className="border-b hover:bg-muted/50">
                                            <td className="px-4 py-3 font-medium">{project.name}</td>
                                            <td className="px-4 py-3">{project.teamLeader}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-2 w-full rounded-full bg-gray-200">
                                                        <div
                                                            className={`h-full rounded-full ${project.progress >= 80
                                                                ? "bg-green-500"
                                                                : project.progress >= 50
                                                                    ? "bg-blue-500"
                                                                    : project.progress >= 30
                                                                        ? "bg-yellow-500"
                                                                        : "bg-red-500"
                                                                }`}
                                                            style={{ width: `${project.progress}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs font-medium">{project.progress}%</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
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
                    </CardContent>
                </Card>

                {/* Critical Alerts */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 text-red-500" />
                            Important Notifications
                        </CardTitle>
                        <CardDescription>
                            Updates and notifications requiring your attention
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
                                <div>
                                    <h4 className="font-medium text-red-800">Task Blocked</h4>
                                    <p className="text-sm text-red-600">
                                        Documentation update is blocked due to missing requirements
                                    </p>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="bg-red-600 hover:bg-red-700 text-white"
                                >
                                    Review
                                </Button>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                                <div>
                                    <h4 className="font-medium text-yellow-800">Upcoming Deadline</h4>
                                    <p className="text-sm text-yellow-600">
                                        User authentication implementation due in 3 days
                                    </p>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="bg-yellow-600 hover:bg-yellow-700 text-white"
                                >
                                    Review
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default MemberDashboard;
