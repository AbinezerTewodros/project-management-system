import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Download, BarChart2, PieChart, FolderKanban } from "lucide-react";
import { format } from "date-fns";

interface PresidentReportsProps {
    darkMode: boolean;
    setDarkMode: (darkMode: boolean) => void;
    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
}

interface ProjectReport {
    id: string;
    name: string;
    division: string;
    department: string;
    status: 'completed' | 'in-progress' | 'delayed' | 'on-hold';
    startDate: string;
    endDate: string;
    progress: number;
    budget: number;
    spent: number;
    teamSize: number;
    manager: string;
    priority: 'high' | 'medium' | 'low';
}

const PresidentReports = ({ darkMode, setDarkMode, sidebarOpen, setSidebarOpen }: PresidentReportsProps) => {
    const [date, setDate] = useState<Date>();
    const [filters, setFilters] = useState({
        division: '',
        department: '',
        status: '',
        priority: '',
        dateRange: '',
    });

    // Mock data for projects
    const [projects] = useState<ProjectReport[]>([
        {
            id: '1',
            name: 'Digital Transformation',
            department: 'IT',
            division: 'Technology',
            status: 'in-progress',
            startDate: '2024-01-01',
            endDate: '2024-06-30',
            progress: 65,
            budget: 500000,
            spent: 325000,
            teamSize: 25,
            manager: 'John Smith',
            priority: 'high'
        },
        {
            id: '2',
            name: 'Customer Portal',
            department: 'IT',
            division: 'Digital',
            status: 'completed',
            startDate: '2023-10-01',
            endDate: '2024-02-28',
            progress: 100,
            budget: 300000,
            spent: 285000,
            teamSize: 15,
            manager: 'Sarah Johnson',
            priority: 'high'
        },
        {
            id: '3',
            name: 'HR System Upgrade',
            department: 'HR',
            division: 'Operations',
            status: 'delayed',
            startDate: '2024-02-01',
            endDate: '2024-05-31',
            progress: 30,
            budget: 200000,
            spent: 75000,
            teamSize: 10,
            manager: 'Mike Brown',
            priority: 'medium'
        },
        {
            id: '4',
            name: 'Financial Analytics',
            department: 'Finance',
            division: 'Analytics',
            status: 'on-hold',
            startDate: '2024-03-01',
            endDate: '2024-08-31',
            progress: 15,
            budget: 400000,
            spent: 60000,
            teamSize: 20,
            manager: 'Lisa Chen',
            priority: 'low'
        }
    ]);

    const departments = ['All', 'IT', 'HR', 'Finance', 'Operations', 'Marketing'];
    const divisions = ['All', 'Technology', 'Digital', 'Operations', 'Analytics', 'Sales'];
    const statuses = ['All', 'completed', 'in-progress', 'delayed', 'on-hold'];
    const priorities = ['All', 'high', 'medium', 'low'];

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed':
                return 'bg-green-100 text-green-800';
            case 'in-progress':
                return 'bg-blue-100 text-blue-800';
            case 'delayed':
                return 'bg-red-100 text-red-800';
            case 'on-hold':
                return 'bg-yellow-100 text-yellow-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high':
                return 'bg-red-100 text-red-800';
            case 'medium':
                return 'bg-yellow-100 text-yellow-800';
            case 'low':
                return 'bg-green-100 text-green-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const filteredProjects = projects.filter(project => {
        return (
            (filters.department === 'All' || project.department === filters.department) &&
            (filters.division === 'All' || project.division === filters.division) &&
            (filters.status === 'All' || project.status === filters.status) &&
            (filters.priority === 'All' || project.priority === filters.priority)
        );
    });

    const totalBudget = filteredProjects.reduce((sum, project) => sum + project.budget, 0);
    const totalSpent = filteredProjects.reduce((sum, project) => sum + project.spent, 0);
    const totalProjects = filteredProjects.length;
    const completedProjects = filteredProjects.filter(p => p.status === 'completed').length;
    const averageProgress = filteredProjects.reduce((sum, project) => sum + project.progress, 0) / totalProjects;

    return (
        <>
            <div className="space-y-6 w-full mt-12">
                <div className="flex justify-between items-center">
                    <h2 className="text-3xl font-bold tracking-tight">Project Reports</h2>
                    <div className="flex space-x-2">
                        <Button variant="outline" className="h-9">
                            <Download className="h-4 w-4 mr-2" />
                            Export Report
                        </Button>
                    </div>
                </div>

                {/* Filter Section */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Filters</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Division</label>
                                <Select
                                    value={filters.division}
                                    onValueChange={(value) => setFilters({ ...filters, division: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select division" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {divisions.map((div) => (
                                            <SelectItem key={div} value={div}>{div}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Department</label>
                                <Select
                                    value={filters.department}
                                    onValueChange={(value) => setFilters({ ...filters, department: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select department" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {departments.map((dept) => (
                                            <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Status</label>
                                <Select
                                    value={filters.status}
                                    onValueChange={(value) => setFilters({ ...filters, status: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {statuses.map((status) => (
                                            <SelectItem key={status} value={status}>{status}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Priority</label>
                                <Select
                                    value={filters.priority}
                                    onValueChange={(value) => setFilters({ ...filters, priority: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select priority" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {priorities.map((prio) => (
                                            <SelectItem key={prio} value={prio}>{prio}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Date Range</label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={`w-full justify-start text-left font-normal ${!date && "text-muted-foreground"}
                                            ${darkMode ? "bg-zinc-700 text-gray-100 border-zinc-600" : "border-gray-300"}
                                            `}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {date ? format(date, "PPP") : <span className={darkMode ? "text-gray-400" : "text-gray-500"}>Pick a date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className={`w-auto p-0 ${darkMode ? "bg-zinc-700 border-zinc-600" : ""}`} align="start">
                                        <Calendar
                                            mode="single"
                                            selected={date}
                                            onSelect={setDate}
                                            initialFocus
                                            className={darkMode ? "text-gray-100" : ""}
                                            styles={{
                                                caption_label: darkMode ? "text-gray-100" : "text-gray-900",
                                                nav_button_previous: darkMode ? "text-gray-100" : "text-gray-900",
                                                nav_button_next: darkMode ? "text-gray-100" : "text-gray-900",
                                                day: darkMode ? "text-gray-100" : "text-gray-900",
                                                day_today: darkMode ? "bg-zinc-600" : "bg-gray-200",
                                                day_selected: darkMode ? "bg-purple-900 text-white" : "bg-purple-600 text-white",
                                                day_range_middle: darkMode ? "bg-zinc-600 text-gray-100" : "bg-gray-100 text-gray-900",
                                                day_hidden: darkMode ? "text-zinc-600" : "text-gray-400",
                                                day_outside: darkMode ? "text-zinc-600" : "text-gray-400",
                                            }}
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className={darkMode ? "bg-zinc-700 text-gray-100" : "bg-white text-gray-800"}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
                            <FolderKanban className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{totalProjects}</div>
                            <p className="text-xs text-muted-foreground">Projects matching filters</p>
                        </CardContent>
                    </Card>
                    <Card className={darkMode ? "bg-zinc-700 text-gray-100" : "bg-white text-gray-800"}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Completed Projects</CardTitle>
                            <Badge className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{completedProjects}</div>
                            <p className="text-xs text-muted-foreground">Successfully finished</p>
                        </CardContent>
                    </Card>
                    <Card className={darkMode ? "bg-zinc-700 text-gray-100" : "bg-white text-gray-800"}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
                            <BarChart2 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">${totalBudget.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground">Overall budget for projects</p>
                        </CardContent>
                    </Card>
                    <Card className={darkMode ? "bg-zinc-700 text-gray-100" : "bg-white text-gray-800"}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Spent Budget</CardTitle>
                            <PieChart className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">${totalSpent.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground">Amount spent so far</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Project Table */}
                <Card className={darkMode ? "bg-zinc-700 text-gray-100" : "bg-white text-gray-800"}>
                    <CardHeader>
                        <CardTitle className="text-lg">Project Details</CardTitle>
                        <CardDescription>Comprehensive list of all projects and their current status.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow className={darkMode ? "bg-zinc-600 hover:bg-zinc-600" : ""}>
                                    <TableHead className={darkMode ? "text-gray-200" : ""}>Project Name</TableHead>
                                    <TableHead className={darkMode ? "text-gray-200" : ""}>Division</TableHead>
                                    <TableHead className={darkMode ? "text-gray-200" : ""}>Department</TableHead>
                                    <TableHead className={darkMode ? "text-gray-200" : ""}>Status</TableHead>
                                    <TableHead className={darkMode ? "text-gray-200" : ""}>Progress</TableHead>
                                    <TableHead className={darkMode ? "text-gray-200" : ""}>Budget</TableHead>
                                    <TableHead className={darkMode ? "text-gray-200" : ""}>Spent</TableHead>
                                    <TableHead className={darkMode ? "text-gray-200" : ""}>Team Size</TableHead>
                                    <TableHead className={darkMode ? "text-gray-200" : ""}>Manager</TableHead>
                                    <TableHead className={darkMode ? "text-gray-200" : ""}>Priority</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredProjects.map((project) => (
                                    <TableRow key={project.id} className={darkMode ? "hover:bg-zinc-600" : ""}>
                                        <TableCell className="font-medium">{project.name}</TableCell>
                                        <TableCell>{project.division}</TableCell>
                                        <TableCell>{project.department}</TableCell>
                                        <TableCell>
                                            <Badge className={`${getStatusColor(project.status)} ${darkMode ? "dark:text-gray-100" : ""}`}>
                                                {project.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center">
                                                <div className="w-16 h-2 rounded-full bg-gray-200 dark:bg-gray-500">
                                                    <div
                                                        className={`h-full rounded-full ${project.progress < 50 ? "bg-red-500" : project.progress < 80 ? "bg-yellow-500" : "bg-green-500"}`}
                                                        style={{ width: `${project.progress}%` }}
                                                    ></div>
                                                </div>
                                                <span className="ml-2 text-sm">{project.progress}%</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>${project.budget.toLocaleString()}</TableCell>
                                        <TableCell>${project.spent.toLocaleString()}</TableCell>
                                        <TableCell>{project.teamSize}</TableCell>
                                        <TableCell>{project.manager}</TableCell>
                                        <TableCell>
                                            <Badge className={`${getPriorityColor(project.priority)} ${darkMode ? "dark:text-gray-100" : ""}`}>
                                                {project.priority}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </>
    );
};

export default PresidentReports;
