import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, LineChart, PieChart, Download, Calendar } from "lucide-react";

interface ProjectStats {
    id: string;
    name: string;
    completionRate: number;
    budgetUtilization: number;
    teamProductivity: number;
    riskLevel: 'low' | 'medium' | 'high';
    timelineAdherence: number;
}

interface ReportsProps {
    darkMode: boolean;
    setDarkMode: (darkMode: boolean) => void;
    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
}

const Reports = ({ darkMode, setDarkMode, sidebarOpen, setSidebarOpen }: ReportsProps) => {
    const [timeRange, setTimeRange] = useState<string>("month");
    const [projectStats, setProjectStats] = useState<ProjectStats[]>([]);

    useEffect(() => {
        // Mock data for project statistics
        const stats = [
            {
                id: "1",
                name: "Core Banking System Upgrade",
                completionRate: 85,
                budgetUtilization: 78,
                teamProductivity: 92,
                riskLevel: 'low' as const,
                timelineAdherence: 88
            },
            {
                id: "2",
                name: "Mobile App Redesign",
                completionRate: 65,
                budgetUtilization: 82,
                teamProductivity: 78,
                riskLevel: 'medium' as const,
                timelineAdherence: 72
            },
            {
                id: "3",
                name: "Security Compliance Audit",
                completionRate: 92,
                budgetUtilization: 95,
                teamProductivity: 88,
                riskLevel: 'low' as const,
                timelineAdherence: 90
            },
            {
                id: "4",
                name: "Customer Portal Enhancement",
                completionRate: 45,
                budgetUtilization: 62,
                teamProductivity: 68,
                riskLevel: 'high' as const,
                timelineAdherence: 55
            }
        ];

        setProjectStats(stats);
    }, []);

    // Calculate overall statistics
    const overallStats = {
        averageCompletionRate: Math.round(projectStats.reduce((acc, curr) => acc + curr.completionRate, 0) / projectStats.length),
        averageBudgetUtilization: Math.round(projectStats.reduce((acc, curr) => acc + curr.budgetUtilization, 0) / projectStats.length),
        averageTeamProductivity: Math.round(projectStats.reduce((acc, curr) => acc + curr.teamProductivity, 0) / projectStats.length),
        averageTimelineAdherence: Math.round(projectStats.reduce((acc, curr) => acc + curr.timelineAdherence, 0) / projectStats.length)
    };

    return (
        <DashboardLayout darkMode={darkMode} setDarkMode={setDarkMode} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}>
            <div className={`min-h-screen ${darkMode ? "bg-zinc-900" : "bg-gradient-to-br from-gray-50 via-white to-fuchsia-50/30"}`}>
                <div className="space-y-6 w-full p-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className={`text-3xl font-bold tracking-tight ${darkMode ? "text-zinc-100" : "bg-gradient-to-r from-fuchsia-800 to-stone-800 bg-clip-text text-transparent"}`}>
                                Reports
                            </h2>
                            <p className={`mt-1 ${darkMode ? "text-zinc-400" : "text-muted-foreground"}`}>
                                View project statistics and performance metrics
                            </p>
                        </div>
                        <div className="flex items-center space-x-4">
                            <Select value={timeRange} onValueChange={setTimeRange}>
                                <SelectTrigger className={`w-[180px] h-11 ${darkMode ? "bg-zinc-800 border-zinc-700 text-zinc-100" : ""}`}>
                                    <SelectValue placeholder="Select time range" />
                                </SelectTrigger>
                                <SelectContent className={darkMode ? "bg-zinc-800 border-zinc-700" : ""}>
                                    <SelectItem 
                                        value="week" 
                                        className={darkMode ? "hover:bg-zinc-700 focus:bg-zinc-700" : ""}
                                    >
                                        Last Week
                                    </SelectItem>
                                    <SelectItem 
                                        value="month" 
                                        className={darkMode ? "hover:bg-zinc-700 focus:bg-zinc-700" : ""}
                                    >
                                        Last Month
                                    </SelectItem>
                                    <SelectItem 
                                        value="quarter" 
                                        className={darkMode ? "hover:bg-zinc-700 focus:bg-zinc-700" : ""}
                                    >
                                        Last Quarter
                                    </SelectItem>
                                    <SelectItem 
                                        value="year" 
                                        className={darkMode ? "hover:bg-zinc-700 focus:bg-zinc-700" : ""}
                                    >
                                        Last Year
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            <Button
                                variant={darkMode ? "secondary" : "default"}
                                className="h-11"
                            >
                                <Download className="h-4 w-4 mr-2" />
                                Export Report
                            </Button>
                        </div>
                    </div>

                    {/* Overall Statistics */}
                    <div className="grid gap-6 md:grid-cols-4">
                        <Card className={`hover:shadow-lg transition-shadow duration-200 ${darkMode ? "bg-zinc-800 border-zinc-700" : ""}`}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className={`text-base font-semibold ${darkMode ? "text-zinc-300" : ""}`}>
                                    Completion Rate
                                </CardTitle>
                                <BarChart className={`h-5 w-5 ${darkMode ? "text-fuchsia-400" : "text-fuchsia-800"}`} />
                            </CardHeader>
                            <CardContent>
                                <div className={`text-3xl font-bold ${darkMode ? "text-zinc-100" : ""}`}>
                                    {overallStats.averageCompletionRate}%
                                </div>
                                <div className="flex items-center gap-2 mt-2">
                                    <div className={`h-2 w-full rounded-full ${darkMode ? "bg-zinc-700" : "bg-gray-200"}`}>
                                        <div
                                            className={`h-full rounded-full ${darkMode ? "bg-fuchsia-500" : "bg-fuchsia-500"}`}
                                            style={{ width: `${overallStats.averageCompletionRate}%` }}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className={`hover:shadow-lg transition-shadow duration-200 ${darkMode ? "bg-zinc-800 border-zinc-700" : ""}`}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className={`text-base font-semibold ${darkMode ? "text-zinc-300" : ""}`}>
                                    Budget Utilization
                                </CardTitle>
                                <PieChart className={`h-5 w-5 ${darkMode ? "text-fuchsia-400" : "text-fuchsia-800"}`} />
                            </CardHeader>
                            <CardContent>
                                <div className={`text-3xl font-bold ${darkMode ? "text-zinc-100" : ""}`}>
                                    {overallStats.averageBudgetUtilization}%
                                </div>
                                <div className="flex items-center gap-2 mt-2">
                                    <div className={`h-2 w-full rounded-full ${darkMode ? "bg-zinc-700" : "bg-gray-200"}`}>
                                        <div
                                            className={`h-full rounded-full ${darkMode ? "bg-fuchsia-500" : "bg-fuchsia-500"}`}
                                            style={{ width: `${overallStats.averageBudgetUtilization}%` }}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className={`hover:shadow-lg transition-shadow duration-200 ${darkMode ? "bg-zinc-800 border-zinc-700" : ""}`}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className={`text-base font-semibold ${darkMode ? "text-zinc-300" : ""}`}>
                                    Team Productivity
                                </CardTitle>
                                <LineChart className={`h-5 w-5 ${darkMode ? "text-fuchsia-400" : "text-fuchsia-800"}`} />
                            </CardHeader>
                            <CardContent>
                                <div className={`text-3xl font-bold ${darkMode ? "text-zinc-100" : ""}`}>
                                    {overallStats.averageTeamProductivity}%
                                </div>
                                <div className="flex items-center gap-2 mt-2">
                                    <div className={`h-2 w-full rounded-full ${darkMode ? "bg-zinc-700" : "bg-gray-200"}`}>
                                        <div
                                            className={`h-full rounded-full ${darkMode ? "bg-fuchsia-500" : "bg-fuchsia-500"}`}
                                            style={{ width: `${overallStats.averageTeamProductivity}%` }}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className={`hover:shadow-lg transition-shadow duration-200 ${darkMode ? "bg-zinc-800 border-zinc-700" : ""}`}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className={`text-base font-semibold ${darkMode ? "text-zinc-300" : ""}`}>
                                    Timeline Adherence
                                </CardTitle>
                                <Calendar className={`h-5 w-5 ${darkMode ? "text-fuchsia-400" : "text-fuchsia-800"}`} />
                            </CardHeader>
                            <CardContent>
                                <div className={`text-3xl font-bold ${darkMode ? "text-zinc-100" : ""}`}>
                                    {overallStats.averageTimelineAdherence}%
                                </div>
                                <div className="flex items-center gap-2 mt-2">
                                    <div className={`h-2 w-full rounded-full ${darkMode ? "bg-zinc-700" : "bg-gray-200"}`}>
                                        <div
                                            className={`h-full rounded-full ${darkMode ? "bg-fuchsia-500" : "bg-fuchsia-500"}`}
                                            style={{ width: `${overallStats.averageTimelineAdherence}%` }}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Project-wise Statistics */}
                    <Card className={`w-full hover:shadow-lg transition-shadow duration-200 ${darkMode ? "bg-zinc-800 border-zinc-700" : ""}`}>
                        <CardHeader>
                            <CardTitle className={`text-xl ${darkMode ? "text-zinc-100" : ""}`}>
                                Project Performance
                            </CardTitle>
                            <CardDescription className={`text-base ${darkMode ? "text-zinc-400" : ""}`}>
                                Detailed statistics for each project
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className={`rounded-lg border ${darkMode ? "border-zinc-700" : ""}`}>
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className={`border-b ${darkMode ? "bg-zinc-700/50 border-zinc-700" : "bg-muted/50"}`}>
                                            <th className={`px-6 py-4 text-left font-semibold ${darkMode ? "text-zinc-300" : ""}`}>Project</th>
                                            <th className={`px-6 py-4 text-left font-semibold ${darkMode ? "text-zinc-300" : ""}`}>Completion Rate</th>
                                            <th className={`px-6 py-4 text-left font-semibold ${darkMode ? "text-zinc-300" : ""}`}>Budget Utilization</th>
                                            <th className={`px-6 py-4 text-left font-semibold ${darkMode ? "text-zinc-300" : ""}`}>Team Productivity</th>
                                            <th className={`px-6 py-4 text-left font-semibold ${darkMode ? "text-zinc-300" : ""}`}>Risk Level</th>
                                            <th className={`px-6 py-4 text-left font-semibold ${darkMode ? "text-zinc-300" : ""}`}>Timeline Adherence</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {projectStats.map((project) => (
                                            <tr 
                                                key={project.id} 
                                                className={`border-b ${darkMode ? "hover:bg-zinc-700/30 border-zinc-700" : "hover:bg-muted/50"} transition-colors duration-200`}
                                            >
                                                <td className={`px-6 py-4 font-medium ${darkMode ? "text-zinc-200" : ""}`}>
                                                    {project.name}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`h-2 w-full rounded-full ${darkMode ? "bg-zinc-700" : "bg-gray-200"}`}>
                                                            <div
                                                                className={`h-full rounded-full ${project.completionRate >= 80
                                                                        ? "bg-green-500"
                                                                        : project.completionRate >= 60
                                                                            ? "bg-yellow-500"
                                                                            : "bg-red-500"
                                                                    }`}
                                                                style={{ width: `${project.completionRate}%` }}
                                                            />
                                                        </div>
                                                        <span className={darkMode ? "text-zinc-200" : ""}>
                                                            {project.completionRate}%
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`h-2 w-full rounded-full ${darkMode ? "bg-zinc-700" : "bg-gray-200"}`}>
                                                            <div
                                                                className={`h-full rounded-full ${project.budgetUtilization >= 80
                                                                        ? "bg-green-500"
                                                                        : project.budgetUtilization >= 60
                                                                            ? "bg-yellow-500"
                                                                            : "bg-red-500"
                                                                    }`}
                                                                style={{ width: `${project.budgetUtilization}%` }}
                                                            />
                                                        </div>
                                                        <span className={darkMode ? "text-zinc-200" : ""}>
                                                            {project.budgetUtilization}%
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`h-2 w-full rounded-full ${darkMode ? "bg-zinc-700" : "bg-gray-200"}`}>
                                                            <div
                                                                className={`h-full rounded-full ${project.teamProductivity >= 80
                                                                        ? "bg-green-500"
                                                                        : project.teamProductivity >= 60
                                                                            ? "bg-yellow-500"
                                                                            : "bg-red-500"
                                                                    }`}
                                                                style={{ width: `${project.teamProductivity}%` }}
                                                            />
                                                        </div>
                                                        <span className={darkMode ? "text-zinc-200" : ""}>
                                                            {project.teamProductivity}%
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span
                                                        className={`px-2 py-1 rounded-full text-xs font-medium ${project.riskLevel === 'low'
                                                                ? darkMode 
                                                                    ? 'bg-green-900/30 text-green-400' 
                                                                    : 'bg-green-100 text-green-700'
                                                                : project.riskLevel === 'medium'
                                                                    ? darkMode 
                                                                        ? 'bg-yellow-900/30 text-yellow-400' 
                                                                        : 'bg-yellow-100 text-yellow-700'
                                                                    : darkMode 
                                                                        ? 'bg-red-900/30 text-red-400' 
                                                                        : 'bg-red-100 text-red-700'
                                                            }`}
                                                    >
                                                        {project.riskLevel.charAt(0).toUpperCase() + project.riskLevel.slice(1)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`h-2 w-full rounded-full ${darkMode ? "bg-zinc-700" : "bg-gray-200"}`}>
                                                            <div
                                                                className={`h-full rounded-full ${project.timelineAdherence >= 80
                                                                        ? "bg-green-500"
                                                                        : project.timelineAdherence >= 60
                                                                            ? "bg-yellow-500"
                                                                            : "bg-red-500"
                                                                    }`}
                                                                style={{ width: `${project.timelineAdherence}%` }}
                                                            />
                                                        </div>
                                                        <span className={darkMode ? "text-zinc-200" : ""}>
                                                            {project.timelineAdherence}%
                                                        </span>
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
        </DashboardLayout>
    );
};

export default Reports;