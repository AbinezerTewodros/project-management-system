import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Users, BarChart, AlertCircle, Clock } from "lucide-react";
import $ from 'jquery';
import 'datatables.net';
import 'datatables.net-bs5';
import 'datatables.net-bs5/css/dataTables.bootstrap5.min.css';

interface Project {
    id: string;
    name: string;
    members: number;
    progress: number;
    dueDate: string;
    kickOffDate: string;
    status: 'active' | 'completed' | 'on-hold';
    supervisor?: string;
    priority: 'high' | 'medium' | 'low';
    department: string;
    ownerName: string;
    ownerEmail: string;
    ownerPhone: string;
    ownerDepartment: string;
}

interface ProjectsProps {
    darkMode: boolean;
}

const Projects = ({ darkMode }: ProjectsProps) => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const tableRef = useRef<HTMLTableElement>(null);
    const dataTableRef = useRef<any>(null);

    useEffect(() => {
        // Get current date for relative dates
        const today = new Date();
        const nextMonth = new Date(today);
        nextMonth.setMonth(today.getMonth() + 1);
        const twoMonths = new Date(today);
        twoMonths.setMonth(today.getMonth() + 2);
        const threeMonths = new Date(today);
        threeMonths.setMonth(today.getMonth() + 3);

        const allProjects = [
            {
                id: "1",
                name: "Core Banking System Upgrade",
                members: 8,
                progress: 75,
                dueDate: nextMonth.toISOString().split('T')[0],
                kickOffDate: today.toISOString().split('T')[0],
                status: 'active' as const,
                priority: 'high' as const,
                supervisor: 'Abel Mekonnen',
                department: 'IT',
                ownerName: 'Abel Mekonnen',
                ownerEmail: 'abel.mekonnen@bank.com',
                ownerPhone: '+251 911 123 456',
                ownerDepartment: 'IT',
            },
            {
                id: "2",
                name: "Mobile App Redesign",
                members: 5,
                progress: 45,
                dueDate: twoMonths.toISOString().split('T')[0],
                kickOffDate: today.toISOString().split('T')[0],
                status: 'active' as const,
                priority: 'medium' as const,
                supervisor: 'Liyu Tadesse',
                department: 'IT',
                ownerName: 'Liyu Tadesse',
                ownerEmail: 'liyu.tadesse@bank.com',
                ownerPhone: '+251 912 234 567',
                ownerDepartment: 'Finance',
            },
            {
                id: "3",
                name: "Security Compliance Audit",
                members: 4,
                progress: 92,
                dueDate: today.toISOString().split('T')[0],
                kickOffDate: today.toISOString().split('T')[0],
                status: 'active' as const,
                priority: 'high' as const,
                supervisor: 'Selam Tesfaye',
                department: 'IT',
                ownerName: 'Selam Tesfaye',
                ownerEmail: 'selam.tesfaye@bank.com',
                ownerPhone: '+251 913 345 678',
                ownerDepartment: 'HR',
            },
            {
                id: "4",
                name: "Customer Portal Enhancement",
                members: 6,
                progress: 38,
                dueDate: threeMonths.toISOString().split('T')[0],
                kickOffDate: today.toISOString().split('T')[0],
                status: 'active' as const,
                priority: 'low' as const,
                supervisor: 'Mekdes Alemu',
                department: 'IT',
                ownerName: 'Mekdes Alemu',
                ownerEmail: 'mekdes.alemu@bank.com',
                ownerPhone: '+251 914 456 789',
                ownerDepartment: 'Operations',
            },
            {
                id: "5",
                name: "Payment Gateway Integration",
                members: 7,
                progress: 82,
                dueDate: twoMonths.toISOString().split('T')[0],
                kickOffDate: today.toISOString().split('T')[0],
                status: 'active' as const,
                priority: 'high' as const,
                supervisor: 'Yonatan Bekele',
                department: 'IT',
                ownerName: 'Yonatan Bekele',
                ownerEmail: 'yonatan.bekele@bank.com',
                ownerPhone: '+251 915 567 890',
                ownerDepartment: 'Marketing',
            },
            {
                id: "6",
                name: "Database Optimization",
                members: 3,
                progress: 65,
                dueDate: nextMonth.toISOString().split('T')[0],
                kickOffDate: today.toISOString().split('T')[0],
                status: 'active' as const,
                priority: 'medium' as const,
                supervisor: 'Saron Hailu',
                department: 'IT',
                ownerName: 'Saron Hailu',
                ownerEmail: '',
                ownerPhone: '',
                ownerDepartment: 'IT',
            },
        ];

        // Sort projects by due date (nearest first)
        const sortedProjects = allProjects.sort((a, b) => {
            const dateA = new Date(a.dueDate);
            const dateB = new Date(b.dueDate);
            return dateA.getTime() - dateB.getTime();
        });

        setProjects(sortedProjects);
    }, []);

    // Format date to be more readable
    const formatDate = (dateString: string) => {
        const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    const handleProjectSelect = (project: Project) => {
        setSelectedProject(project);
    };

    useEffect(() => {
        const initializeDataTable = async () => {
            if (!tableRef.current) return;

            // Check if DataTable is already initialized
            const existingTable = $(tableRef.current).DataTable();
            if (existingTable) {
                existingTable.destroy();
            }

            try {
                // Import DataTables dynamically
                await import('datatables.net');
                await import('datatables.net-bs5');

                if (tableRef.current) {
                    const dataTable = $(tableRef.current).DataTable({
                        destroy: true,
                        retrieve: true,
                        pageLength: 5,
                        lengthMenu: [[5, 10, 25, 50, -1], [5, 10, 25, 50, "All"]],
                        order: [[4, 'asc']],
                        columnDefs: [
                            { orderable: false, targets: 6 },
                            {
                                targets: 3,
                                render: function (data: any, type: any, row: any) {
                                    if (type === 'display') {
                                        const progress = parseInt(data) || 0;
                                        const color = progress >= 80 ? "green" : progress >= 50 ? "blue" : progress >= 30 ? "yellow" : "red";
                                        return `
                                            <div class="flex items-center gap-2">
                                                <div class="h-2 w-full rounded-full bg-gray-200">
                                                    <div class="h-full rounded-full transition-all duration-500 bg-${color}-500" style="width: ${progress}%"></div>
                                                </div>
                                                <span class="text-xs font-medium text-${color}-600">${progress}%</span>
                                            </div>
                                        `;
                                    }
                                    return data;
                                }
                            }
                        ],
                        language: {
                            search: "",
                            searchPlaceholder: "Search projects...",
                            lengthMenu: "Show _MENU_ projects",
                            info: "Showing _START_ to _END_ of _TOTAL_ projects",
                            infoEmpty: "No projects found",
                            infoFiltered: "(filtered from _MAX_ total projects)",
                            paginate: {
                                first: "First",
                                last: "Last",
                                next: "Next",
                                previous: "Previous"
                            }
                        },
                        dom: '<"flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 mt-2 ml-2"<"flex flex-col sm:flex-row items-start sm:items-center gap-2"l><"flex items-center gap-2"f>>rt<"flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-4 px-4 sm:px-6"<"text-sm text-gray-500"i><"flex items-center gap-2"p>>',
                        responsive: true,
                        drawCallback: function () {
                            // Reapply styles after each draw
                            // Removed pagination/info styling from here to apply in initComplete

                            // Reapply styles for length selector and search
                            $('.dt-length select').addClass('border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent w-full sm:w-auto');
                            $('.dt-length label').addClass('text-sm text-gray-600 flex items-center gap-2 font-medium whitespace-nowrap');
                            $('.dt-length label').html(function (_, html) {
                                return html.replace('Show', '<span class="font-bold">Show</span>');
                            });
                            $('.dt-search input').addClass('border rounded px-2 sm:px-3 py-1 text-sm w-full sm:w-auto focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent');

                            // Responsive table styles
                            $('.dataTable').addClass('w-full min-w-[640px] sm:min-w-0');
                            $('.dataTables_wrapper').addClass('w-full overflow-x-auto -mx-4 sm:mx-0');
                        },
                        initComplete: function () {
                            // Style length selector
                            $('.dt-length select').addClass('border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent w-full sm:w-auto');
                            $('.dt-length label').addClass('text-sm text-gray-600 flex items-center gap-2 font-medium whitespace-nowrap');
                            $('.dt-length label').html(function (_, html) {
                                return html.replace('Show', '<span class="font-bold">Show</span>');
                            });

                            // Style search input
                            $('.dt-search input').addClass('border rounded px-2 sm:px-3 py-1 text-sm w-full sm:w-auto focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent');

                            // Apply styles for pagination container and elements as in Manager Dashboard
                            $('.dataTables_paginate').addClass('flex items-center gap-2');
                            $('.dt-paging').addClass('flex items-center gap-2');
                            $('.pagination').addClass('flex items-center gap-1 flex-wrap justify-center sm:justify-end');

                            // Apply styles for pagination buttons
                            $('.page-link').addClass('border rounded px-2 sm:px-3 py-1 text-sm hover:bg-gray-100 transition-colors');
                            $('.page-item.active .page-link').addClass('bg-fuchsia-800 text-white hover:bg-stone-800');
                            $('.page-item.disabled .page-link').addClass('opacity-50 cursor-not-allowed hover:bg-transparent');

                            // Apply styles for page items (li)
                            $('.dt-paging-button').addClass('mx-1');
                            $('.dt-paging-button:first-child').removeClass('mx-1').addClass('mr-1');
                            $('.dt-paging-button:last-child').removeClass('mx-1').addClass('ml-1');

                            // Style info text
                            $('.dataTables_info').addClass('text-sm text-gray-500');

                            // Add hover effects to pagination buttons
                            $('.page-link:not(.disabled)').hover(
                                function () { $(this).addClass('bg-gray-100'); },
                                function () { $(this).removeClass('bg-gray-100'); }
                            );

                            // Add responsive container classes if needed
                            if (!$('.dataTables_wrapper').parent().hasClass('w-full.overflow-hidden')) {
                                $('.dataTables_wrapper').wrap('<div class="w-full overflow-hidden"></div>');
                            }
                        }
                    });

                    dataTableRef.current = dataTable;
                }
            } catch (error) {
                console.error('Error initializing DataTable:', error);
            }
        };

        initializeDataTable();

        // Cleanup
        return () => {
            if (dataTableRef.current) {
                dataTableRef.current.destroy();
                dataTableRef.current = null;
            }
        };
    }, [projects]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-fuchsia-50/30 pt-15">
            <div className="space-y-6 w-full p-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-fuchsia-800 to-stone-800 bg-clip-text text-transparent">Projects</h2>
                        <p className="text-muted-foreground mt-1">Manage and monitor all ongoing projects</p>
                    </div>
                </div>

                <Card className="w-full hover:shadow-lg transition-shadow duration-200">
                    <CardHeader>
                        <CardTitle className="text-xl">Projects</CardTitle>
                        <CardDescription className="text-base">
                            Manage and monitor all your ongoing projects
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-lg border">
                            <table ref={tableRef} className="w-full text-sm">
                                <thead>
                                    <tr className="border-b bg-muted/50">
                                        <th className="px-6 py-4 text-left font-semibold">Name</th>
                                        <th className="px-6 py-4 text-left font-semibold">Priority</th>
                                        <th className="px-6 py-4 text-left font-semibold">Supervisor</th>
                                        <th className="px-6 py-4 text-left font-semibold">Progress</th>
                                        <th className="px-6 py-4 text-left font-semibold">Kick-off Date</th>
                                        <th className="px-6 py-4 text-left font-semibold">Due Date</th>
                                        <th className="px-6 py-4 text-right font-semibold">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {projects.map((project) => (
                                        <tr key={project.id} className="border-b hover:bg-muted/50 transition-colors duration-200">
                                            <td className="px-6 py-4">
                                                <div className="font-medium">{project.name}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge
                                                    variant="outline"
                                                    className={`${project.priority === 'high'
                                                        ? 'border-red-500 text-red-500 bg-red-50'
                                                        : project.priority === 'medium'
                                                            ? 'border-yellow-500 text-yellow-500 bg-yellow-50'
                                                            : 'border-green-500 text-green-500 bg-green-50'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-1.5">
                                                        <span className={`h-2 w-2 rounded-full ${project.priority === 'high'
                                                            ? 'bg-red-500'
                                                            : project.priority === 'medium'
                                                                ? 'bg-yellow-500'
                                                                : 'bg-green-500'
                                                            }`}></span>
                                                        {project.priority.charAt(0).toUpperCase() + project.priority.slice(1)}
                                                    </div>
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <Users className="h-4 w-4 text-muted-foreground" />
                                                    {project.supervisor}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">{project.progress}</td>
                                            <td className="px-6 py-4">{formatDate(project.kickOffDate)}</td>
                                            <td className="px-6 py-4">{formatDate(project.dueDate)}</td>
                                            <td className="px-6 py-4 text-right">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleProjectSelect(project)}
                                                    className="bg-fuchsia-800 hover:bg-stone-800 text-white text-base py-2 px-4 hover:border-yellow-400 rounded-lg transition-all duration-200 hover:scale-105 shadow-md hover:shadow-lg"
                                                >
                                                    Details
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

            {/* Project Details Modal */}
            {selectedProject && (
                <Dialog open={!!selectedProject} onOpenChange={() => setSelectedProject(null)}>
                    <DialogContent className="sm:max-w-[1000px] bg-white/95 backdrop-blur-sm border-fuchsia-200 shadow-xl">
                        <DialogHeader className="pb-2">
                            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-fuchsia-800 to-stone-800 bg-clip-text text-transparent">
                                {selectedProject.name}
                            </DialogTitle>
                            <DialogDescription className="text-base text-gray-600">
                                Project details and progress overview
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4">
                            {/* Project Overview */}
                            <div className="grid gap-4 md:grid-cols-4">
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Progress</CardTitle>
                                        <BarChart className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{selectedProject.progress}%</div>
                                        <div className="mt-1">
                                            <div className="h-2 w-full rounded-full bg-gray-200">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-500 ${selectedProject.progress >= 80
                                                        ? "bg-green-500"
                                                        : selectedProject.progress >= 50
                                                            ? "bg-blue-500"
                                                            : selectedProject.progress >= 30
                                                                ? "bg-yellow-500"
                                                                : "bg-red-500"
                                                        }`}
                                                    style={{ width: `${selectedProject.progress}%` }}
                                                />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Team Size</CardTitle>
                                        <Users className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{selectedProject.members}</div>
                                        <p className="text-xs text-muted-foreground">
                                            Active team members
                                        </p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Priority</CardTitle>
                                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <Badge
                                            variant="outline"
                                            className={`${selectedProject.priority === 'high'
                                                ? 'border-red-500 text-red-500 bg-red-50'
                                                : selectedProject.priority === 'medium'
                                                    ? 'border-yellow-500 text-yellow-500 bg-yellow-50'
                                                    : 'border-green-500 text-green-500 bg-green-50'
                                                }`}
                                        >
                                            <div className="flex items-center gap-1.5">
                                                <span
                                                    className={`h-2 w-2 rounded-full ${selectedProject.priority === 'high'
                                                        ? 'bg-red-500'
                                                        : selectedProject.priority === 'medium'
                                                            ? 'bg-yellow-500'
                                                            : 'bg-green-500'
                                                        }`}
                                                ></span>
                                                {selectedProject.priority.charAt(0).toUpperCase() + selectedProject.priority.slice(1)}
                                            </div>
                                        </Badge>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Status</CardTitle>
                                        <Clock className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <Badge
                                            variant="outline"
                                            className={`${selectedProject.status === 'active'
                                                ? 'border-green-500 text-green-500 bg-green-50'
                                                : selectedProject.status === 'completed'
                                                    ? 'border-blue-500 text-blue-500 bg-blue-50'
                                                    : 'border-yellow-500 text-yellow-500 bg-yellow-50'
                                                }`}
                                        >
                                            {selectedProject.status.charAt(0).toUpperCase() + selectedProject.status.slice(1)}
                                        </Badge>
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                {/* Project Timeline */}
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-base">Project Timeline</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <div className="text-sm font-medium">Kick-off Date</div>
                                                    <div className="text-sm text-muted-foreground">
                                                        {formatDate(selectedProject.kickOffDate)}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium">Due Date</div>
                                                    <div className="text-sm text-muted-foreground">
                                                        {formatDate(selectedProject.dueDate)}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="h-2 w-full rounded-full bg-gray-200">
                                                <div
                                                    className="h-full rounded-full bg-fuchsia-500"
                                                    style={{
                                                        width: `${(selectedProject.progress / 100) * 100}%`,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Project Details */}
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-base">Project Details</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <div className="text-sm font-medium">Supervisor</div>
                                                <div className="text-sm text-muted-foreground">
                                                    {selectedProject.supervisor}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium">Project Owner</div>
                                                <div className="text-sm text-muted-foreground">
                                                    {selectedProject.ownerName}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium">Owner Department</div>
                                                <div className="text-sm text-muted-foreground">
                                                    {selectedProject.ownerDepartment}
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex justify-end space-x-3 pt-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setSelectedProject(null)}
                                    className="h-10 px-6 text-base border-gray-200 hover:border-fuchsia-500 hover:text-fuchsia-700"
                                >
                                    Close
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
};

export default Projects;
