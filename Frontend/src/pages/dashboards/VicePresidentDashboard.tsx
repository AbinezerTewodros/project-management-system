import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserCog, Users, BarChart, TrendingUp, CheckCircle2, Clock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import $ from "jquery";
import "datatables.net";

interface DirectorPerformance {
    id: string;
    name: string;
    division: string;
    projectsCompleted: number;
    projectsInProgress: number;
    teamSize: number;
    performance: number;
}

interface VicePresidentDashboardProps {
    darkMode: boolean;
    setDarkMode: (darkMode: boolean) => void;
    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
}

const VicePresidentDashboard = ({ darkMode, setDarkMode, sidebarOpen, setSidebarOpen }: VicePresidentDashboardProps) => {
    const { user } = useAuth();
    const [directors, setDirectors] = useState<DirectorPerformance[]>([
        {
            id: "1",
            name: "John Doe",
            division: "Engineering",
            projectsCompleted: 8,
            projectsInProgress: 4,
            teamSize: 25,
            performance: 88
        },
        {
            id: "2",
            name: "Jane Smith",
            division: "Product",
            projectsCompleted: 6,
            projectsInProgress: 3,
            teamSize: 20,
            performance: 92
        }
    ]);
    const [selectedDirector, setSelectedDirector] = useState<DirectorPerformance | null>(null);
    const tableRef = useRef<HTMLTableElement>(null);
    const dataTableRef = useRef<any>(null);

    const handleDirectorSelect = (director: DirectorPerformance) => {
        setSelectedDirector(director);
    };

    useEffect(() => {
        const initializeDataTable = async () => {
            try {
                if (tableRef.current) {
                    const dataTable = $(tableRef.current).DataTable({
                        destroy: true,
                        retrieve: true,
                        pageLength: 5,
                        lengthMenu: [[5, 10, 25, 50, -1], [5, 10, 25, 50, "All"]],
                        order: [[0, 'asc']],
                        columnDefs: [
                            { orderable: false, targets: 5 }
                        ],
                        language: {
                            paginate: {
                                first: 'First',
                                previous: 'Previous',
                                next: 'Next',
                                last: 'Last'
                            },
                            info: 'Showing _START_ to _END_ of _TOTAL_ entries',
                            search: 'Search directors:',
                            lengthMenu: 'Show _MENU_ directors'
                        },
                        dom: `<"flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 mt-2 ml-2"<"flex flex-col sm:flex-row items-start sm:items-center gap-2"l><"flex items-center gap-2"f>>t<"flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-4 px-4 sm:px-6"<"text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}"i><"flex items-center gap-2"p>>`
                    });
                    dataTableRef.current = dataTable;
                }
            } catch (error) {
                console.error('Error initializing DataTable:', error);
            }
        };

        initializeDataTable();

        return () => {
            if (dataTableRef.current) {
                dataTableRef.current.destroy();
                dataTableRef.current = null;
            }
        };
    }, [directors, darkMode]);

    return (
        <div className={`space-y-6 w-full ${darkMode ? 'dark' : ''}`}>
            <div className="flex justify-between items-center">
                <h2 className={`text-3xl font-bold tracking-tight ${darkMode ? 'text-gray-300' : ''}`}>Vice President Dashboard</h2>
            </div>

            {/* Overview Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card className={darkMode ? 'bg-zinc-800 border-zinc-700' : ''}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className={`text-sm font-medium ${darkMode ? 'text-gray-300' : ''}`}>Total Directors</CardTitle>
                        <UserCog className={`h-4 w-4 ${darkMode ? 'text-gray-400' : 'text-muted-foreground'}`} />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${darkMode ? 'text-gray-300' : ''}`}>{directors.length}</div>
                        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-muted-foreground'}`}>
                            Active Directors
                        </p>
                    </CardContent>
                </Card>
                <Card className={darkMode ? 'bg-zinc-800 border-zinc-700' : ''}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className={`text-sm font-medium ${darkMode ? 'text-gray-300' : ''}`}>Total Projects</CardTitle>
                        <BarChart className={`h-4 w-4 ${darkMode ? 'text-gray-400' : 'text-muted-foreground'}`} />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${darkMode ? 'text-gray-300' : ''}`}>
                            {directors.reduce((acc, dir) => acc + dir.projectsInProgress, 0)}
                        </div>
                        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-muted-foreground'}`}>
                            Active Projects
                        </p>
                    </CardContent>
                </Card>
                <Card className={darkMode ? 'bg-zinc-800 border-zinc-700' : ''}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className={`text-sm font-medium ${darkMode ? 'text-gray-300' : ''}`}>Total Team Size</CardTitle>
                        <Users className={`h-4 w-4 ${darkMode ? 'text-gray-400' : 'text-muted-foreground'}`} />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${darkMode ? 'text-gray-300' : ''}`}>
                            {directors.reduce((acc, dir) => acc + dir.teamSize, 0)}
                        </div>
                        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-muted-foreground'}`}>
                            Across All Divisions
                        </p>
                    </CardContent>
                </Card>
                <Card className={darkMode ? 'bg-zinc-800 border-zinc-700' : ''}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className={`text-sm font-medium ${darkMode ? 'text-gray-300' : ''}`}>Average Performance</CardTitle>
                        <TrendingUp className={`h-4 w-4 ${darkMode ? 'text-gray-400' : 'text-muted-foreground'}`} />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${darkMode ? 'text-gray-300' : ''}`}>
                            {Math.round(
                                directors.reduce((acc, dir) => acc + dir.performance, 0) / directors.length
                            )}%
                        </div>
                        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-muted-foreground'}`}>
                            Director Performance Score
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Directors Performance Table */}
            <Card className={darkMode ? 'bg-zinc-800 border-zinc-700' : ''}>
                <CardHeader>
                    <CardTitle className={darkMode ? 'text-gray-300' : ''}>Directors Performance</CardTitle>
                    <CardDescription className={darkMode ? 'text-gray-400' : ''}>
                        Overview of Director performance and division metrics
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className={`rounded-md border ${darkMode ? 'border-zinc-700' : ''}`}>
                        <table ref={tableRef} className="w-full text-sm">
                            <thead>
                                <tr className={`border-b ${darkMode ? 'bg-zinc-700 text-gray-300' : 'bg-muted/50'}`}>
                                    <th className="px-4 py-3 text-left">Name</th>
                                    <th className="px-4 py-3 text-left">Division</th>
                                    <th className="px-4 py-3 text-left">Team Size</th>
                                    <th className="px-4 py-3 text-left">Projects</th>
                                    <th className="px-4 py-3 text-left">Performance</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {directors.map((director) => (
                                    <tr key={director.id} className={`border-b hover:${darkMode ? 'bg-zinc-700/50' : 'bg-muted/50'} ${darkMode ? 'border-zinc-700' : ''}`}>
                                        <td className="px-4 py-3">
                                            <button
                                                className={`font-medium ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'} hover:underline focus:outline-none`}
                                                onClick={() => handleDirectorSelect(director)}
                                            >
                                                {director.name}
                                            </button>
                                        </td>
                                        <td className={`px-4 py-3 ${darkMode ? 'text-gray-300' : ''}`}>{director.division}</td>
                                        <td className={`px-4 py-3 ${darkMode ? 'text-gray-300' : ''}`}>{director.teamSize} members</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <span className={`${darkMode ? 'text-green-400' : 'text-green-600'}`}>{director.projectsCompleted} completed</span>
                                                <span className={`${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>/ {director.projectsInProgress} active</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-16 h-2 ${darkMode ? 'bg-zinc-600' : 'bg-gray-200'} rounded-full`}>
                                                    <div
                                                        className={`h-full rounded-full ${director.performance >= 90 ? 'bg-green-500' :
                                                            director.performance >= 80 ? 'bg-blue-500' :
                                                                'bg-yellow-500'
                                                            }`}
                                                        style={{ width: `${director.performance}%` }}
                                                    ></div>
                                                </div>
                                                <span className={darkMode ? 'text-gray-300' : ''}>{director.performance}%</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleDirectorSelect(director)}
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

            {/* Director Details Modal */}
            {selectedDirector && (
                <Dialog open={!!selectedDirector} onOpenChange={() => setSelectedDirector(null)}>
                    <DialogContent className={`sm:max-w-[1000px] ${darkMode ? 'bg-zinc-800 border-zinc-700' : 'bg-white/95 backdrop-blur-sm border-fuchsia-200'} shadow-xl`}>
                        <DialogHeader>
                            <DialogTitle className={`text-2xl font-bold ${darkMode ? 'text-gray-300' : 'bg-gradient-to-r from-fuchsia-800 to-stone-800 bg-clip-text text-transparent'}`}>
                                {selectedDirector.name}'s Division Overview
                            </DialogTitle>
                            <DialogDescription className={`text-base ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                Detailed performance metrics for {selectedDirector.division} division
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid grid-cols-2 gap-4">
                            {/* Left Column */}
                            <div className="space-y-4">
                                {/* Division Overview Cards */}
                                <div className="grid grid-cols-3 gap-3">
                                    <Card className={`p-3 ${darkMode ? 'bg-zinc-700 border-zinc-600' : ''}`}>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : ''}`}>Completed</p>
                                                <p className={`text-2xl font-bold ${darkMode ? 'text-gray-300' : ''}`}>{selectedDirector.projectsCompleted}</p>
                                            </div>
                                            <CheckCircle2 className={`h-5 w-5 ${darkMode ? 'text-gray-400' : 'text-muted-foreground'}`} />
                                        </div>
                                    </Card>
                                    <Card className={`p-3 ${darkMode ? 'bg-zinc-700 border-zinc-600' : ''}`}>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : ''}`}>Active</p>
                                                <p className={`text-2xl font-bold ${darkMode ? 'text-gray-300' : ''}`}>{selectedDirector.projectsInProgress}</p>
                                            </div>
                                            <Clock className={`h-5 w-5 ${darkMode ? 'text-gray-400' : 'text-muted-foreground'}`} />
                                        </div>
                                    </Card>
                                    <Card className={`p-3 ${darkMode ? 'bg-zinc-700 border-zinc-600' : ''}`}>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : ''}`}>Team Size</p>
                                                <p className={`text-2xl font-bold ${darkMode ? 'text-gray-300' : ''}`}>{selectedDirector.teamSize}</p>
                                            </div>
                                            <Users className={`h-5 w-5 ${darkMode ? 'text-gray-400' : 'text-muted-foreground'}`} />
                                        </div>
                                    </Card>
                                </div>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
};

export default VicePresidentDashboard;