import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Briefcase, Users, BarChart, TrendingUp, AlertCircle } from "lucide-react";
import $ from "jquery";
import "datatables.net";

interface ManagerPerformance {
    id: string;
    name: string;
    team: string;
    projectsCompleted: number;
    projectsInProgress: number;
    teamSize: number;
    performance: number;
}

interface DirectorDashboardProps {
    darkMode: boolean;
    setDarkMode: (darkMode: boolean) => void;
    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
}

const DirectorDashboard = ({ darkMode }: DirectorDashboardProps) => {
    const {} = useAuth();
    const [managerPerformance] = useState<ManagerPerformance[]>([
        {
            id: "1",
            name: "John Doe",
            team: "Frontend",
            projectsCompleted: 5,
            projectsInProgress: 2,
            teamSize: 8,
            performance: 85
        },
        {
            id: "2",
            name: "Jane Smith",
            team: "Backend",
            projectsCompleted: 4,
            projectsInProgress: 3,
            teamSize: 6,
            performance: 92
        }
    ]);
    const tableRef = useRef<HTMLTableElement>(null);
    const dataTableRef = useRef<any>(null);

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
                            search: 'Search managers:',
                            lengthMenu: 'Show _MENU_ managers'
                        },
                        dom: '<"flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 mt-2 ml-2"<"flex flex-col sm:flex-row items-start sm:items-center gap-2"l><"flex items-center gap-2"f>>t<"flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-4 px-4 sm:px-6"<"text-sm text-gray-500 dark:text-gray-400"i><"flex items-center gap-2"p>>'
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
    }, []);

    return (
        <div className={`space-y-6 w-full ${darkMode ? 'dark' : ''}`}>
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold tracking-tight text-gray-700 dark:text-gray-300">Director Dashboard</h2>
            </div>

            {/* Overview Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card className="dark:bg-zinc-800 transition-colors duration-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Managers</CardTitle>
                        <Briefcase className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-700 dark:text-gray-300">{managerPerformance.length}</div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Active Managers
                        </p>
                    </CardContent>
                </Card>
                <Card className="dark:bg-zinc-800 transition-colors duration-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Projects</CardTitle>
                        <BarChart className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-700 dark:text-gray-300">
                            {managerPerformance.reduce((acc, mgr) => acc + mgr.projectsInProgress, 0)}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Active Projects
                        </p>
                    </CardContent>
                </Card>
                <Card className="dark:bg-zinc-800 transition-colors duration-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Team Size</CardTitle>
                        <Users className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-700 dark:text-gray-300">
                            {managerPerformance.reduce((acc, mgr) => acc + mgr.teamSize, 0)}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Across All Teams
                        </p>
                    </CardContent>
                </Card>
                <Card className="dark:bg-zinc-800 transition-colors duration-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Average Performance</CardTitle>
                        <TrendingUp className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-700 dark:text-gray-300">
                            {Math.round(
                                managerPerformance.reduce((acc, mgr) => acc + mgr.performance, 0) / managerPerformance.length
                            )}%
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Manager Performance Score
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Manager Performance Table */}
            <Card className="dark:bg-zinc-800 transition-colors duration-200">
                <CardHeader>
                    <CardTitle className="text-gray-700 dark:text-gray-300">Managers Performance</CardTitle>
                    <CardDescription className="text-gray-500 dark:text-gray-400">
                        Overview of Manager performance and team metrics
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border dark:border-zinc-700">
                        <table ref={tableRef} className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-gray-100 dark:bg-zinc-700">
                                    <th className="px-4 py-3 text-left text-gray-700 dark:text-gray-300">Name</th>
                                    <th className="px-4 py-3 text-left text-gray-700 dark:text-gray-300">Team</th>
                                    <th className="px-4 py-3 text-left text-gray-700 dark:text-gray-300">Team Size</th>
                                    <th className="px-4 py-3 text-left text-gray-700 dark:text-gray-300">Projects</th>
                                    <th className="px-4 py-3 text-left text-gray-700 dark:text-gray-300">Performance</th>
                                    <th className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {managerPerformance.map((manager) => (
                                    <tr key={manager.id} className="border-b hover:bg-gray-50 dark:hover:bg-zinc-700/50 dark:border-zinc-700">
                                        <td className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">{manager.name}</td>
                                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{manager.team}</td>
                                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{manager.teamSize} members</td>
                                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                                            <div className="flex items-center gap-2">
                                                <span className="text-green-600 dark:text-green-400">{manager.projectsCompleted} completed</span>
                                                <span className="text-blue-600 dark:text-blue-400">/ {manager.projectsInProgress} active</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                                            <div className="flex items-center gap-2">
                                                <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-zinc-600">
                                                    <div
                                                        className={`h-full rounded-full ${manager.performance >= 90 ? "bg-green-500" :
                                                            manager.performance >= 80 ? "bg-blue-500" :
                                                                "bg-yellow-500"
                                                            }`}
                                                        style={{ width: `${manager.performance}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs font-medium">{manager.performance}%</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="bg-fuchsia-800 hover:bg-fuchsia-900 text-white dark:bg-fuchsia-700 dark:hover:bg-fuchsia-800 transition-colors"
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
            <Card className="dark:bg-zinc-800 transition-colors duration-200">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                        <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400" />
                        Critical Alerts
                    </CardTitle>
                    <CardDescription className="text-gray-500 dark:text-gray-400">
                        Important notifications requiring your attention
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                            <div>
                                <h4 className="font-medium text-red-800 dark:text-red-200">Technical Debt Alert</h4>
                                <p className="text-sm text-red-600 dark:text-red-300">
                                    Frontend team needs to address accumulated technical debt
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 text-white transition-colors"
                            >
                                Review
                            </Button>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                            <div>
                                <h4 className="font-medium text-yellow-800 dark:text-yellow-200">Resource Allocation Warning</h4>
                                <p className="text-sm text-yellow-600 dark:text-yellow-300">
                                    Backend team needs additional developers
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                className="bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-700 dark:hover:bg-yellow-800 text-white transition-colors"
                            >
                                Review
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default DirectorDashboard;