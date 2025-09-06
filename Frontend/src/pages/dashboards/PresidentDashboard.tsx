import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserCog, Users, BarChart, CheckCircle2, Clock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import $ from "jquery";
import "datatables.net";

interface TeamMember {
    id: string;
    name: string;
    role: string;
    department: string;
    email: string;
    phone: string;
    location: string;
}

interface VicePresidentPerformance {
    id: string;
    name: string;
    role: string;
    department: string;
    email: string;
    phone: string;
    location: string;
    division: string;
    projectsCompleted: number;
    projectsInProgress: number;
    teamSize: number;
    performance: number;
    completedProjects: {
        name: string;
        completionDate: string;
    }[];
    activeProjects: {
        name: string;
        dueDate: string;
        progress: number;
    }[];
    directors: {
        id: string;
        name: string;
        division: string;
        teamSize: number;
    }[];
}

interface PresidentDashboardProps {
    darkMode: boolean;
    setDarkMode: (darkMode: boolean) => void;
    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
}

const PresidentDashboard = ({darkMode  }: PresidentDashboardProps) => {
    const { user } = useAuth();
    const tableRef = useRef<HTMLTableElement>(null);
    const dataTableRef = useRef<any>(null);
    const [vicePresidents, setVicePresidents] = useState<VicePresidentPerformance[]>([
        {
            id: "1",
            name: "John Doe",
            role: "Senior Developer",
            department: "Engineering",
            email: "john.doe@example.com",
            phone: "+1 234 567 890",
            location: "New York",
            division: "Engineering",
            projectsCompleted: 12,
            projectsInProgress: 5,
            teamSize: 50,
            performance: 90,
            completedProjects: [
                { name: "System Migration", completionDate: "2024-02-15" },
                { name: "Security Audit", completionDate: "2024-01-30" }
            ],
            activeProjects: [
                { name: "Cloud Integration", dueDate: "2024-04-30", progress: 65 },
                { name: "API Development", dueDate: "2024-05-15", progress: 40 }
            ],
            directors: [
                { id: "d1", name: "Alice Smith", division: "Backend", teamSize: 20 },
                { id: "d2", name: "Bob Johnson", division: "Frontend", teamSize: 15 }
            ]
        },
        {
            id: "2",
            name: "Jane Smith",
            role: "Product Manager",
            department: "Product",
            email: "jane.smith@example.com",
            phone: "+1 234 567 891",
            location: "San Francisco",
            division: "Product",
            projectsCompleted: 10,
            projectsInProgress: 4,
            teamSize: 45,
            performance: 95,
            completedProjects: [
                { name: "UI Redesign", completionDate: "2024-02-20" },
                { name: "User Testing", completionDate: "2024-01-25" }
            ],
            activeProjects: [
                { name: "Mobile App", dueDate: "2024-04-15", progress: 75 },
                { name: "Feature Launch", dueDate: "2024-05-01", progress: 50 }
            ],
            directors: [
                { id: "d3", name: "Carol White", division: "Design", teamSize: 15 },
                { id: "d4", name: "David Brown", division: "UX", teamSize: 10 }
            ]
        }
    ]);
    const [selectedVP, setSelectedVP] = useState<VicePresidentPerformance | null>(null);

    useEffect(() => {
        // Initialize DataTable
        if (tableRef.current) {
            const dataTable = $(tableRef.current).DataTable({
                destroy: true,
                retrieve: true,
                pageLength: 5,
                lengthMenu: [[5, 10, 25, 50, -1], [5, 10, 25, 50, "All"]],
                order: [[0, 'asc']],
                columnDefs: [
                    { orderable: false, targets: 5 } // Actions column
                ],
                language: {
                    paginate: {
                        first: 'First',
                        previous: 'Previous',
                        next: 'Next',
                        last: 'Last'
                    },
                    info: 'Showing _START_ to _END_ of _TOTAL_ entries',
                    search: 'Search team members:',
                    lengthMenu: 'Show _MENU_ members'
                },
                dom: '<"flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 mt-2 ml-2"<"flex flex-col sm:flex-row items-start sm:items-center gap-2"l><"flex items-center gap-2"f>>t<"flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-4 px-4 sm:px-6"<"text-sm text-gray-500"i><"flex items-center gap-2"p>>'
            });
            dataTableRef.current = dataTable;
        }

        // Cleanup
        return () => {
            if (dataTableRef.current) {
                dataTableRef.current.destroy();
                dataTableRef.current = null;
            }
        };
    }, [vicePresidents]);

    useEffect(() => {
        // Mock data for Vice President performance
        const mockData: VicePresidentPerformance[] = [
            {
                id: "1",
                name: "Frehiwot Ayalew",
                role: "Senior Developer",
                department: "Technology",
                email: "frehiwot.ayalew@example.com",
                phone: "+1 234 567 892",
                location: "New York",
                division: "Technology",
                projectsCompleted: 12,
                projectsInProgress: 5,
                teamSize: 120,
                performance: 95,
                completedProjects: [
                    { name: "Cloud Migration", completionDate: "2024-02-15" },
                    { name: "Security Audit", completionDate: "2024-01-30" },
                    { name: "DevOps Implementation", completionDate: "2024-01-15" }
                ],
                activeProjects: [
                    { name: "AI Integration", dueDate: "2024-04-30", progress: 65 },
                    { name: "Mobile App Development", dueDate: "2024-05-15", progress: 40 },
                    { name: "Database Optimization", dueDate: "2024-03-30", progress: 80 }
                ],
                directors: [
                    { id: "d1", name: "Natnael Admasu", division: "Software Development", teamSize: 45 },
                    { id: "d2", name: "Eden Gebretsadik", division: "Infrastructure", teamSize: 35 },
                    { id: "d3", name: "Tewodros Zewdu", division: "Quality Assurance", teamSize: 30 }
                ]
            },
            {
                id: "2",
                name: "Aster Yohannes",
                role: "Product Manager",
                department: "Operations",
                email: "aster.yohannes@example.com",
                phone: "+1 234 567 893",
                location: "San Francisco",
                division: "Operations",
                projectsCompleted: 10,
                projectsInProgress: 4,
                teamSize: 85,
                performance: 92,
                completedProjects: [
                    { name: "Process Optimization", completionDate: "2024-02-20" },
                    { name: "Supply Chain Review", completionDate: "2024-01-25" }
                ],
                activeProjects: [
                    { name: "Logistics Automation", dueDate: "2024-04-15", progress: 75 },
                    { name: "Inventory Management", dueDate: "2024-05-01", progress: 50 }
                ],
                directors: [
                    { id: "d4", name: "Meklit Tadesse", division: "Supply Chain", teamSize: 30 },
                    { id: "d5", name: "Yonas Bekele", division: "Logistics", teamSize: 25 },
                    { id: "d6", name: "Sara Haile", division: "Quality Control", teamSize: 20 }
                ]
            }
        ];
        setVicePresidents(mockData);
    }, []);

    const handleVPSelect = (vp: VicePresidentPerformance) => {
        setSelectedVP(vp);
    };

    return (
        <div className={`space-y-6 mt-12 ${darkMode ? 'dark' : ''}`}>
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className={`${darkMode ? 'bg-zinc-800 border-zinc-700' : ''}`}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className={`text-sm font-medium ${darkMode ? 'text-gray-300' : ''}`}>Total Vice Presidents</CardTitle>
                        <UserCog className={`h-4 w-4 ${darkMode ? 'text-gray-400' : 'text-muted-foreground'}`}/>
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${darkMode ? 'text-gray-300' : ''}`}>{vicePresidents.length}</div>
                        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-muted-foreground'}`}>
                            Active Vice Presidents
                        </p>
                    </CardContent>
                </Card>
                <Card className={`${darkMode ? 'bg-zinc-800 border-zinc-700' : ''}`}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className={`text-sm font-medium ${darkMode ? 'text-gray-300' : ''}`}>Total Projects</CardTitle>
                        <BarChart className={`h-4 w-4 ${darkMode ? 'text-gray-400' : 'text-muted-foreground'}`} />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${darkMode ? 'text-gray-300' : ''}`}>
                            {vicePresidents.reduce((acc, vp) => acc + vp.projectsInProgress, 0)}
                        </div>
                        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-muted-foreground'}`}>
                            Active Projects
                        </p>
                    </CardContent>
                </Card>
                <Card className={`${darkMode ? 'bg-zinc-800 border-zinc-700' : ''}`}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className={`text-sm font-medium ${darkMode ? 'text-gray-300' : ''}`}>Total Team Size</CardTitle>
                        <Users className={`h-4 w-4 ${darkMode ? 'text-gray-400' : 'text-muted-foreground'}`} />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${darkMode ? 'text-gray-300' : ''}`}>
                            {vicePresidents.reduce((acc, vp) => acc + vp.teamSize, 0)}
                        </div>
                        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-muted-foreground'}`}>
                            Across All Departments
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* VP Performance Table */}
            <Card className={`${darkMode ? 'bg-zinc-800 border-zinc-700' : ''}`}>
                <CardHeader>
                    <CardTitle className={`${darkMode ? 'text-gray-300' : ''}`}>Vice Presidents</CardTitle>
                    <CardDescription className={`${darkMode ? 'text-gray-400' : ''}`}>
                        Overview of VP and department metrics
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className={`rounded-md border ${darkMode ? 'border-zinc-700' : ''}`}>
                        <table ref={tableRef} className="w-full text-sm">
                            <thead>
                                <tr className={`border-b ${darkMode ? 'bg-zinc-700 text-gray-300' : 'bg-muted/50'}`}>
                                    <th className="px-4 py-3 text-left">Name</th>
                                    <th className="px-4 py-3 text-left">Department</th>
                                    <th className="px-4 py-3 text-left">Team Size</th>
                                    <th className="px-4 py-3 text-left">Projects</th>
                                    <th className="px-4 py-3 text-left">Performance</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {vicePresidents.map((vp) => (
                                    <tr key={vp.id} className={`border-b hover:${darkMode ? 'bg-zinc-700/50' : 'bg-muted/50'} ${darkMode ? 'border-zinc-700' : ''}`}>
                                        <td className="px-4 py-3">
                                            <button
                                                className={`font-medium ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'} hover:underline focus:outline-none`}
                                                onClick={() => handleVPSelect(vp)}
                                            >
                                                {vp.name}
                                            </button>
                                        </td>
                                        <td className={`px-4 py-3 ${darkMode ? 'text-gray-300' : ''}`}>{vp.division}</td>
                                        <td className={`px-4 py-3 ${darkMode ? 'text-gray-300' : ''}`}>{vp.teamSize} members</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <span className={`${darkMode ? 'text-green-400' : 'text-green-600'}`}>{vp.projectsCompleted} completed</span>
                                                <span className={`${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>/ {vp.projectsInProgress} active</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-16 h-2 ${darkMode ? 'bg-zinc-600' : 'bg-gray-200'} rounded-full`}>
                                                    <div
                                                        className={`h-full rounded-full ${vp.performance >= 90 ? 'bg-green-500' :
                                                            vp.performance >= 80 ? 'bg-blue-500' :
                                                                'bg-yellow-500'
                                                            }`}
                                                        style={{ width: `${vp.performance}%` }}
                                                    ></div>
                                                </div>
                                                <span className={darkMode ? 'text-gray-300' : ''}>{vp.performance}%</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleVPSelect(vp)}
                                                className={`${darkMode ? 'bg-zinc-700 border-zinc-600 text-gray-300 hover:bg-zinc-600' : ''}`}
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

            {/* VP Details Modal */}
            {selectedVP && (
                <Dialog open={!!selectedVP} onOpenChange={() => setSelectedVP(null)}>
                    <DialogContent className={`sm:max-w-[1000px] ${darkMode ? 'bg-zinc-800 border-zinc-700' : 'bg-white/95 backdrop-blur-sm border-fuchsia-200'} shadow-xl`}>
                        <DialogHeader>
                            <DialogTitle className={`text-2xl font-bold ${darkMode ? 'text-gray-300' : 'bg-gradient-to-r from-fuchsia-800 to-stone-800 bg-clip-text text-transparent'}`}>
                                {selectedVP.name}'s Department Overview
                            </DialogTitle>
                            <DialogDescription className={`text-base ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                Detailed performance metrics for {selectedVP.division} department
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid grid-cols-2 gap-4">
                            {/* Left Column */}
                            <div className="space-y-4">
                                {/* Department Overview Cards */}
                                <div className="grid grid-cols-3 gap-3">
                                    <Card className={`p-3 ${darkMode ? 'bg-zinc-700 border-zinc-600' : ''}`}>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : ''}`}>Completed</p>
                                                <p className={`text-2xl font-bold ${darkMode ? 'text-gray-300' : ''}`}>{selectedVP.projectsCompleted}</p>
                                            </div>
                                            <CheckCircle2 className={`h-5 w-5 ${darkMode ? 'text-gray-400' : 'text-muted-foreground'}`} />
                                        </div>
                                    </Card>
                                    <Card className={`p-3 ${darkMode ? 'bg-zinc-700 border-zinc-600' : ''}`}>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : ''}`}>Active</p>
                                                <p className={`text-2xl font-bold ${darkMode ? 'text-gray-300' : ''}`}>{selectedVP.projectsInProgress}</p>
                                            </div>
                                            <Clock className={`h-5 w-5 ${darkMode ? 'text-gray-400' : 'text-muted-foreground'}`} />
                                        </div>
                                    </Card>
                                    <Card className={`p-3 ${darkMode ? 'bg-zinc-700 border-zinc-600' : ''}`}>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : ''}`}>Team Size</p>
                                                <p className={`text-2xl font-bold ${darkMode ? 'text-gray-300' : ''}`}>{selectedVP.teamSize}</p>
                                            </div>
                                            <Users className={`h-5 w-5 ${darkMode ? 'text-gray-400' : 'text-muted-foreground'}`} />
                                        </div>
                                    </Card>
                                </div>

                                {/* Completed Projects Table */}
                                <Card className={darkMode ? 'bg-zinc-700 border-zinc-600' : ''}>
                                    <CardHeader className="p-3">
                                        <CardTitle className={`text-base ${darkMode ? 'text-gray-300' : ''}`}>Completed Projects</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-3 pt-0">
                                        <div className={`rounded-md border ${darkMode ? 'border-zinc-600' : ''}`}>
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className={`border-b ${darkMode ? 'bg-zinc-600 text-gray-300' : 'bg-muted/50'}`}>
                                                        <th className="px-3 py-2 text-left">Project Name</th>
                                                        <th className="px-3 py-2 text-left">Completion Date</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {selectedVP.completedProjects.map((project, index) => (
                                                        <tr key={index} className={`border-b hover:${darkMode ? 'bg-zinc-600/50' : 'bg-muted/50'} ${darkMode ? 'border-zinc-600' : ''}`}>
                                                            <td className={`px-3 py-2 ${darkMode ? 'text-gray-300' : ''}`}>{project.name}</td>
                                                            <td className={`px-3 py-2 ${darkMode ? 'text-gray-300' : ''}`}>{project.completionDate}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Right Column */}
                            <div className="space-y-4">
                                {/* Directors Table */}
                                <Card className={darkMode ? 'bg-zinc-700 border-zinc-600' : ''}>
                                    <CardHeader className="p-3">
                                        <CardTitle className={`text-base ${darkMode ? 'text-gray-300' : ''}`}>Directors</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-3 pt-0">
                                        <div className={`rounded-md border ${darkMode ? 'border-zinc-600' : ''}`}>
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className={`border-b ${darkMode ? 'bg-zinc-600 text-gray-300' : 'bg-muted/50'}`}>
                                                        <th className="px-3 py-2 text-left">Name</th>
                                                        <th className="px-3 py-2 text-left">Division</th>
                                                        <th className="px-3 py-2 text-left">Team Size</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {selectedVP.directors.map((director) => (
                                                        <tr key={director.id} className={`border-b hover:${darkMode ? 'bg-zinc-600/50' : 'bg-muted/50'} ${darkMode ? 'border-zinc-600' : ''}`}>
                                                            <td className={`px-3 py-2 ${darkMode ? 'text-gray-300' : ''}`}>{director.name}</td>
                                                            <td className={`px-3 py-2 ${darkMode ? 'text-gray-300' : ''}`}>{director.division}</td>
                                                            <td className={`px-3 py-2 ${darkMode ? 'text-gray-300' : ''}`}>{director.teamSize} members</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Active Projects Table */}
                                <Card className={darkMode ? 'bg-zinc-700 border-zinc-600' : ''}>
                                    <CardHeader className="p-3">
                                        <CardTitle className={`text-base ${darkMode ? 'text-gray-300' : ''}`}>Active Projects</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-3 pt-0">
                                        <div className={`rounded-md border ${darkMode ? 'border-zinc-600' : ''}`}>
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className={`border-b ${darkMode ? 'bg-zinc-600 text-gray-300' : 'bg-muted/50'}`}>
                                                        <th className="px-3 py-2 text-left">Project Name</th>
                                                        <th className="px-3 py-2 text-left">Due Date</th>
                                                        <th className="px-3 py-2 text-left">Progress</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {selectedVP.activeProjects.map((project, index) => (
                                                        <tr key={index} className={`border-b hover:${darkMode ? 'bg-zinc-600/50' : 'bg-muted/50'} ${darkMode ? 'border-zinc-600' : ''}`}>
                                                            <td className={`px-3 py-2 ${darkMode ? 'text-gray-300' : ''}`}>{project.name}</td>
                                                            <td className={`px-3 py-2 ${darkMode ? 'text-gray-300' : ''}`}>{project.dueDate}</td>
                                                            <td className="px-3 py-2">
                                                                <div className="flex items-center gap-2">
                                                                    <div className={`w-16 h-2 ${darkMode ? 'bg-zinc-600' : 'bg-gray-200'} rounded-full`}>
                                                                        <div
                                                                            className={`h-full rounded-full ${project.progress >= 90 ? 'bg-green-500' :
                                                                                project.progress >= 70 ? 'bg-blue-500' :
                                                                                    project.progress >= 40 ? 'bg-yellow-500' :
                                                                                        'bg-red-500'
                                                                                }`}
                                                                            style={{ width: `${project.progress}%` }}
                                                                        ></div>
                                                                    </div>
                                                                    <span className={darkMode ? 'text-gray-300' : ''}>{project.progress}%</span>
                                                                </div>
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
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
};

export default PresidentDashboard;
