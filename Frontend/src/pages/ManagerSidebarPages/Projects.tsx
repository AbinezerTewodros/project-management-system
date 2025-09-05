import { useState, useEffect, useRef } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Info, ListChecks, Users2, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import $ from 'jquery';
import 'datatables.net-dt/css/dataTables.dataTables.css';
import DataTable from 'datatables.net-dt';

interface Project {
    id: string;
    name: string;
    members: number;
    progress: number;
    dueDate: string;
    kickOffDate: string;
    status: 'active' | 'completed' | 'on-hold';
    supervisor?: string;
    supervisorId?: string;
    supervisorStatus: 'pending' | 'accepted' | 'rejected';
    priority: 'high' | 'medium' | 'low';
    assignedBy?: string;
}

interface ProjectsProps {
    darkMode: boolean;
    setDarkMode: (darkMode: boolean) => void;
    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
}

interface TeamMember {
    id: string;
    name: string;
    role?: string;
    department?: string;
}

const Projects = ({ darkMode, setDarkMode, sidebarOpen, setSidebarOpen }: ProjectsProps) => {
    const [myProjects, setMyProjects] = useState<Project[]>([]);
    const [assignedProjects, setAssignedProjects] = useState<Project[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [priorityFilter, setPriorityFilter] = useState<string>("all");
    const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);

    const projectTeam: TeamMember[] = [
        { id: 'm1', name: 'Abebe Bikila', role: 'Frontend Developer' },
        { id: 'm2', name: 'Tirunesh Dibaba', role: 'Backend Developer' },
        { id: 'm3', name: 'Haile Gebrselassie', role: 'DevOps Engineer' },
        { id: 'm4', name: 'Fatuma Roba', role: 'UI/UX Designer' },
        { id: 'm5', name: 'Derartu Tulu', role: 'QA Tester' },
    ];
    const projectTasks = [
        { id: 't1', name: 'Develop login page', status: 'completed' as const, assignee: 'Fatuma Roba' },
        { id: 't2', name: 'Design database schema', status: 'in-progress' as const, assignee: 'Abebe Bikila' },
        { id: 't3', name: 'Setup CI/CD pipeline', status: 'in-progress' as const, assignee: 'Haile Gebrselassie' },
        { id: 't4', name: 'API endpoint for user profile', status: 'pending' as const, assignee: 'Tirunesh Dibaba' },
        { id: 't5', name: 'Test user authentication flow', status: 'pending' as const, assignee: 'Derartu Tulu' },
    ];

    useEffect(() => {
        const today = new Date();
        const nextMonth = new Date(today);
        nextMonth.setMonth(today.getMonth() + 1);
        const twoMonths = new Date(today);
        twoMonths.setMonth(today.getMonth() + 2);
        const threeMonths = new Date(today);
        threeMonths.setMonth(today.getMonth() + 3);

        const createdProjects: Project[] = [
            { id: "1", name: "Core Banking System Upgrade", members: 8, progress: 65, dueDate: nextMonth.toISOString().split('T')[0], kickOffDate: today.toISOString().split('T')[0], status: 'active', priority: 'high', supervisor: 'Abebe Bikila', supervisorStatus: 'accepted' },
            { id: "2", name: "Mobile App Redesign", members: 5, progress: 32, dueDate: twoMonths.toISOString().split('T')[0], kickOffDate: today.toISOString().split('T')[0], status: 'active', priority: 'medium', supervisor: 'Tirunesh Dibaba', supervisorStatus: 'pending' },
            { id: "3", name: "Security Compliance Audit", members: 4, progress: 91, dueDate: today.toISOString().split('T')[0], kickOffDate: today.toISOString().split('T')[0], status: 'completed', priority: 'high', supervisor: 'Haile Gebrselassie', supervisorStatus: 'accepted' },
            { id: "4", name: "Customer Portal Enhancement", members: 6, progress: 45, dueDate: threeMonths.toISOString().split('T')[0], kickOffDate: today.toISOString().split('T')[0], status: 'on-hold', priority: 'low', supervisor: 'Kenenisa Bekele', supervisorStatus: 'rejected' },
        ];

        const projectsAssignedToManager: Project[] = [
            { id: "101", name: "Digital Transformation Initiative", members: 15, progress: 20, dueDate: threeMonths.toISOString().split('T')[0], kickOffDate: today.toISOString().split('T')[0], status: 'active', priority: 'high', assignedBy: 'Director of Operations', supervisorStatus: 'accepted' },
            { id: "102", name: "Annual Financial Reporting Automation", members: 7, progress: 50, dueDate: nextMonth.toISOString().split('T')[0], kickOffDate: today.toISOString().split('T')[0], status: 'active', priority: 'medium', assignedBy: 'Chief Financial Officer', supervisorStatus: 'accepted' },
        ];

        setMyProjects(createdProjects);
        setAssignedProjects(projectsAssignedToManager);
    }, []);

    const formatDate = (dateString: string) => {
        const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    const ProjectDataTable = ({ projects, type }: { projects: Project[], type: 'my-projects' | 'assigned-to-me' }) => {
        const tableRef = useRef<HTMLTableElement>(null);
        const dtRef = useRef<InstanceType<typeof DataTable> | null>(null);

        useEffect(() => {
            if (tableRef.current && projects.length > 0) {
                const dt = new DataTable(tableRef.current, {
                    data: projects,
                    columns: [
                        { data: 'name', title: 'Name', className: 'font-medium' },
                        { data: type === 'my-projects' ? 'supervisor' : 'assignedBy', title: type === 'my-projects' ? 'Supervisor' : 'Assigned By' },
                        { data: 'progress', title: 'Progress', render: (data: number) => `<div class="w-full ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-full h-2"><div class="bg-fuchsia-600 h-2 rounded-full" style="width: ${data}%"></div></div>` },
                        { data: 'dueDate', title: 'Due Date', render: (data: string) => formatDate(data) },
                        {
                            data: 'priority', title: 'Priority', render: (data: 'high' | 'medium' | 'low') => {
                                let colorClass = '';
                                if (data === 'high') colorClass = darkMode ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-800';
                                else if (data === 'medium') colorClass = darkMode ? 'bg-yellow-900/30 text-yellow-400' : 'bg-yellow-100 text-yellow-800';
                                else colorClass = darkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-800';
                                return `<span class="px-2 py-0.5 text-xs font-semibold rounded-full ${colorClass}">${data}</span>`;
                            }
                        },
                        {
                            data: 'status', title: 'Status', render: (data: 'active' | 'completed' | 'on-hold') => {
                                let colorClass = '';
                                if (data === 'active') colorClass = darkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-800';
                                else if (data === 'completed') colorClass = darkMode ? 'bg-purple-900/30 text-purple-400' : 'bg-purple-100 text-purple-800';
                                else colorClass = darkMode ? 'bg-orange-900/30 text-orange-400' : 'bg-orange-100 text-orange-800';
                                return `<span class="px-2 py-0.5 text-xs font-semibold rounded-full ${colorClass}">${data}</span>`;
                            }
                        },
                        { 
                            data: 'id', 
                            title: 'Actions', 
                            render: (data: string) => `
                                <button class="${darkMode ? 'bg-fuchsia-700 hover:bg-fuchsia-600' : 'bg-fuchsia-700 hover:bg-fuchsia-800'} text-white rounded-md px-3 py-1.5 text-sm font-medium view-details-btn" data-project-id='${data}'>
                                    Details
                                </button>`, 
                            orderable: false 
                        },
                    ],
                    destroy: true,
                    searching: false,
                    lengthChange: false,
                    pageLength: 5,
                    dom: 'rt<"dt-bottom mt-4 flex items-center justify-between"ip>',
                });

                dtRef.current = dt;

                $(tableRef.current).on('click', '.view-details-btn', function () {
                    const projectId = $(this).data('project-id');
                    const project = projects.find(p => p.id === projectId.toString());
                    if (project) setSelectedProject(project);
                });
            }

            return () => {
                if (dtRef.current && tableRef.current) {
                    $(tableRef.current).off('click', '.view-details-btn');
                    dtRef.current.destroy();
                    dtRef.current = null;
                }
            };
        }, [projects, darkMode]);

        useEffect(() => {
            if (dtRef.current) {
                const table = dtRef.current;
                table.search(searchQuery);
                table.column(5).search(statusFilter !== 'all' ? `^${statusFilter}$` : '', true, false);
                table.column(4).search(priorityFilter !== 'all' ? `^${priorityFilter}$` : '', true, false);
                table.draw();
            }
        }, [searchQuery, statusFilter, priorityFilter]);

        return (
            <>
                <style>
                    {`
                        .dt-search {
                            display: none;
                        }
                        .dt-info {
                            font-size: 0.875rem;
                            color: ${darkMode ? '#d1d5db' : '#6b7280'};
                        }
                        .dt-paging {
                            display: flex;
                            gap: 0.5rem;
                        }
                        .dt-paging .dt-paging-button {
                            padding: 0.5rem 0.75rem;
                            border-radius: 0.375rem;
                            border: 1px solid ${darkMode ? '#374151' : '#d1d5db'};
                            cursor: pointer;
                            font-size: 0.875rem;
                            background-color: ${darkMode ? '#1f2937' : 'white'};
                            color: ${darkMode ? '#e5e7eb' : '#111827'};
                        }
                        .dt-paging .dt-paging-button:hover {
                            background-color: ${darkMode ? '#374151' : '#f3f4f6'};
                        }
                        .dt-paging .dt-paging-button.disabled {
                            cursor: not-allowed;
                            opacity: 0.5;
                        }
                        .dt-paging .dt-paging-button.current {
                            background-color: #a855f7;
                            color: white;
                            border-color: #a855f7;
                        }
                        .dataTables_wrapper .dataTables_length, 
                        .dataTables_wrapper .dataTables_filter, 
                        .dataTables_wrapper .dataTables_info, 
                        .dataTables_wrapper .dataTables_processing, 
                        .dataTables_wrapper .dataTables_paginate {
                            color: ${darkMode ? '#d1d5db' : '#6b7280'};
                        }
                        .dataTables_wrapper .dataTables_paginate .paginate_button {
                            color: ${darkMode ? '#d1d5db' : '#6b7280'} !important;
                        }
                    `}
                </style>
                <table ref={tableRef} className={`display w-full text-sm ${darkMode ? 'text-gray-300' : ''}`}></table>
            </>
        );
    };

    return (
        <DashboardLayout darkMode={darkMode} setDarkMode={setDarkMode} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}>
            <div className={`min-h-screen ${darkMode ? 'bg-zinc-900 text-gray-300' : 'bg-gray-50'}`}>
                <div className="space-y-6 w-full p-6">
                    <div>
                        <h2 className={`text-3xl font-bold tracking-tight ${darkMode ? 'text-gray-300' : ''}`}>Projects</h2>
                        <p className={`${darkMode ? 'text-gray-400' : 'text-muted-foreground'} mt-1`}>
                            Manage projects you created or that are assigned to you.
                        </p>
                    </div>

                    <Tabs defaultValue="my-projects" className="w-full">
                        <TabsList className={`grid w-full grid-cols-2 ${darkMode ? 'bg-zinc-800' : ''}`}>
                            <TabsTrigger value="my-projects" className={darkMode ? 'data-[state=active]:bg-zinc-700' : ''}>
                                My Projects
                            </TabsTrigger>
                            <TabsTrigger value="assigned-to-me" className={darkMode ? 'data-[state=active]:bg-zinc-700' : ''}>
                                Assigned to Me
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="my-projects">
                            <Card className={`mt-4 ${darkMode ? 'bg-zinc-800 border-zinc-700' : ''}`}>
                                <CardHeader>
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <CardTitle className={darkMode ? 'text-gray-300' : ''}>My Created Projects</CardTitle>
                                            <CardDescription className={darkMode ? 'text-gray-400' : ''}>
                                                Projects you have initiated and are managing.
                                            </CardDescription>
                                        </div>
                                        <Button 
                                            className={`bg-fuchsia-800 hover:bg-fuchsia-900 text-white ${darkMode ? 'hover:bg-fuchsia-700' : ''}`} 
                                            onClick={() => setIsNewProjectModalOpen(true)}
                                        >
                                            <Plus className="mr-2 h-4 w-4" /> New Project
                                        </Button>
                                    </div>
                                    <div className="flex items-center gap-2 pt-4">
                                        <div className="relative flex-grow">
                                            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${darkMode ? 'text-gray-400' : 'text-gray-400'}`} size={20} />
                                            <Input 
                                                placeholder="Search projects by name..." 
                                                value={searchQuery} 
                                                onChange={(e) => setSearchQuery(e.target.value)} 
                                                className={`pl-10 w-full ${darkMode ? 'bg-zinc-700 border-zinc-600 text-gray-300 focus:border-fuchsia-500' : ''}`} 
                                            />
                                        </div>
                                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                                            <SelectTrigger className={`w-[180px] ${darkMode ? 'bg-zinc-700 border-zinc-600 text-gray-300' : ''}`}>
                                                <SelectValue placeholder="Filter by status" />
                                            </SelectTrigger>
                                            <SelectContent className={darkMode ? 'bg-zinc-800 border-zinc-700' : ''}>
                                                <SelectItem value="all" className={darkMode ? 'hover:bg-zinc-700' : ''}>All Statuses</SelectItem>
                                                <SelectItem value="active" className={darkMode ? 'hover:bg-zinc-700' : ''}>Active</SelectItem>
                                                <SelectItem value="completed" className={darkMode ? 'hover:bg-zinc-700' : ''}>Completed</SelectItem>
                                                <SelectItem value="on-hold" className={darkMode ? 'hover:bg-zinc-700' : ''}>On Hold</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                                            <SelectTrigger className={`w-[180px] ${darkMode ? 'bg-zinc-700 border-zinc-600 text-gray-300' : ''}`}>
                                                <SelectValue placeholder="Filter by priority" />
                                            </SelectTrigger>
                                            <SelectContent className={darkMode ? 'bg-zinc-800 border-zinc-700' : ''}>
                                                <SelectItem value="all" className={darkMode ? 'hover:bg-zinc-700' : ''}>All Priorities</SelectItem>
                                                <SelectItem value="high" className={darkMode ? 'hover:bg-zinc-700' : ''}>High</SelectItem>
                                                <SelectItem value="medium" className={darkMode ? 'hover:bg-zinc-700' : ''}>Medium</SelectItem>
                                                <SelectItem value="low" className={darkMode ? 'hover:bg-zinc-700' : ''}>Low</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-4">
                                    <ProjectDataTable projects={myProjects} type="my-projects" />
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="assigned-to-me">
                            <Card className={`mt-4 ${darkMode ? 'bg-zinc-800 border-zinc-700' : ''}`}>
                                <CardHeader>
                                    <CardTitle className={darkMode ? 'text-gray-300' : ''}>Assigned to Me</CardTitle>
                                    <CardDescription className={darkMode ? 'text-gray-400' : ''}>
                                        Projects assigned to you by your superiors.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="pt-4">
                                    {assignedProjects.length > 0 ? (
                                        <ProjectDataTable projects={assignedProjects} type="assigned-to-me" />
                                    ) : (
                                        <div className={`text-center py-12 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                            <p>You have no projects assigned to you.</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>

                    <Dialog open={!!selectedProject} onOpenChange={(isOpen) => !isOpen && setSelectedProject(null)}>
                        <DialogContent className={`sm:max-w-3xl ${darkMode ? 'bg-zinc-800 border-zinc-700' : ''}`}>
                            {selectedProject && (
                                <>
                                    <DialogHeader>
                                        <DialogTitle className={`text-2xl ${darkMode ? 'text-gray-300' : ''}`}>{selectedProject.name}</DialogTitle>
                                        <DialogDescription className={darkMode ? 'text-gray-400' : ''}>
                                            {selectedProject.assignedBy ? `Assigned by: ${selectedProject.assignedBy}` : `Supervisor: ${selectedProject.supervisor}`}
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="py-4">
                                        <Tabs defaultValue="overview">
                                            <TabsList className={darkMode ? 'bg-zinc-700' : ''}>
                                                <TabsTrigger value="overview" className={darkMode ? 'data-[state=active]:bg-zinc-600' : ''}>
                                                    <Info className="mr-2 h-4 w-4" />Overview
                                                </TabsTrigger>
                                                <TabsTrigger value="tasks" className={darkMode ? 'data-[state=active]:bg-zinc-600' : ''}>
                                                    <ListChecks className="mr-2 h-4 w-4" />Tasks
                                                </TabsTrigger>
                                                <TabsTrigger value="team" className={darkMode ? 'data-[state=active]:bg-zinc-600' : ''}>
                                                    <Users2 className="mr-2 h-4 w-4" />Team
                                                </TabsTrigger>
                                            </TabsList>
                                            <TabsContent value="overview" className="pt-4">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className={darkMode ? 'text-gray-300' : ''}>
                                                        <span className="font-semibold">Kick-off Date:</span> {formatDate(selectedProject.kickOffDate)}
                                                    </div>
                                                    <div className={darkMode ? 'text-gray-300' : ''}>
                                                        <span className="font-semibold">Due Date:</span> {formatDate(selectedProject.dueDate)}
                                                    </div>
                                                    <div className={darkMode ? 'text-gray-300' : ''}>
                                                        <span className="font-semibold">Status:</span> <Badge variant={selectedProject.status === 'completed' ? 'default' : 'secondary'}>{selectedProject.status}</Badge>
                                                    </div>
                                                    <div className={darkMode ? 'text-gray-300' : ''}>
                                                        <span className="font-semibold">Priority:</span> <Badge variant={selectedProject.priority === 'high' ? 'destructive' : 'default'}>{selectedProject.priority}</Badge>
                                                    </div>
                                                </div>
                                                <div className="mt-4">
                                                    <Label className={darkMode ? 'text-gray-300' : ''}>Progress</Label>
                                                    <Progress value={selectedProject.progress} className="mt-1" />
                                                </div>
                                            </TabsContent>
                                            <TabsContent value="tasks" className="pt-4">
                                                <ul className="space-y-2">
                                                    {projectTasks.map(task => (
                                                        <li key={task.id} className={`flex items-center justify-between p-2 rounded-md ${darkMode ? 'bg-zinc-700 text-gray-300' : 'bg-gray-50'}`}>
                                                            <span>{task.name} ({task.assignee})</span>
                                                            <Badge variant={task.status === 'completed' ? 'default' : task.status === 'in-progress' ? 'secondary' : 'outline'}>
                                                                {task.status}
                                                            </Badge>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </TabsContent>
                                            <TabsContent value="team" className="pt-4">
                                                <ul className="space-y-2">
                                                    {projectTeam.map(member => (
                                                        <li key={member.id} className={`flex items-center p-2 rounded-md ${darkMode ? 'bg-zinc-700 text-gray-300' : 'bg-gray-50'}`}>
                                                            <Users2 className={`mr-3 h-5 w-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                                                            <div>
                                                                <p className="font-semibold">{member.name}</p>
                                                                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{member.role}</p>
                                                            </div>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </TabsContent>
                                        </Tabs>
                                    </div>
                                    <DialogFooter>
                                        <DialogClose asChild>
                                            <Button variant={darkMode ? 'secondary' : 'outline'}>Close</Button>
                                        </DialogClose>
                                    </DialogFooter>
                                </>
                            )}
                        </DialogContent>
                    </Dialog>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default Projects;