import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, Users, BarChart, X, AlertCircle, Clock, ArrowUpRight,  Download, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "react-hot-toast";
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
    resources: ProjectResource[];
    ownerName: string;
    ownerEmail: string;
    ownerPhone: string;
    ownerDepartment: string;
    supervisorId: string;
    supervisorStatus: 'pending' | 'accepted' | 'rejected';
}

interface NewProject {
    name: string;
    dueDate: string;
    supervisor: string;
    scrumMaster: string;
    priority: 'high' | 'medium' | 'low';
    department: string;
    resources: ProjectResource[];
    ownerName: string;
    ownerEmail: string;
    ownerPhone: string;
}

interface ProjectResource {
    id: string;
    name: string;
    category: ResourceCategory;
    file?: File;
    url?: string;
    customCategory?: string;
}

type ResourceCategory =
    | 'Documentation'
    | 'Tools & Templates'
    | 'Reports'
    | 'Training & Guidelines'
    | 'Contracts & Legal'
    | 'Design Assets'
    | 'Credentials & Access'
    | 'Change Logs'
    | 'External References'
    | 'Other';

interface DepartmentManager {
    id: string;
    name: string;
    email: string;
    phone: string;
    department: string;
}

interface ManagerDashboardProps {
    darkMode: boolean;
    setDarkMode: (darkMode: boolean) => void;
    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
}

interface TeamMember {
    id: string;
    name: string;
    role: string;
    department: string;
}

const ManagerDashboard = ({ darkMode, setDarkMode, sidebarOpen, setSidebarOpen }: ManagerDashboardProps) => {
    const { user } = useAuth();
    const [projects, setProjects] = useState<Project[]>([]);
    const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [newProject, setNewProject] = useState<NewProject>({
        name: '',
        dueDate: '',
        supervisor: '',
        scrumMaster: '',
        priority: 'medium',
        department: '',
        resources: [],
        ownerName: '',
        ownerEmail: '',
        ownerPhone: '',
    });
    const [newResource, setNewResource] = useState<Partial<ProjectResource>>({
        name: '',
        category: 'Documentation',
        customCategory: '',
    });
    const [isAddingResource, setIsAddingResource] = useState(false);
    // const [searchQuery, setSearchQuery] = useState('');
    // const [ setShowSearchResults] = useState(false);
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [ departments, setDepartments] = useState<string[]>([]);
    const [departmentManagers, setDepartmentManagers] = useState<DepartmentManager[]>([]);
    const [selectedManager, setSelectedManager] = useState<DepartmentManager | null>(null);
    const tableRef = useRef<HTMLTableElement>(null);
    const dataTableRef = useRef<any>(null);
    //const [isDataTableInitialized, setIsDataTableInitialized] = useState(false);

    const resourceCategories: ResourceCategory[] = [
        'Documentation',
        'Tools & Templates',
        'Reports',
        'Training & Guidelines',
        'Contracts & Legal',
        'Design Assets',
        'Credentials & Access',
        'Change Logs',
        'External References',
        'Other'
    ];

    // Mock data for departments and their managers
    useEffect(() => {
        const mockDepartments = ['IT', 'Finance', 'HR', 'Operations', 'Marketing'];
        setDepartments(mockDepartments);

        const mockManagers: DepartmentManager[] = [
            { id: '1', name: 'Abel Mekonnen', email: 'abel.mekonnen@bank.com', phone: '+251 911 123 456', department: 'IT' },
            { id: '2', name: 'Liyu Tadesse', email: 'liyu.tadesse@bank.com', phone: '+251 912 234 567', department: 'Finance' },
            { id: '3', name: 'Selam Tesfaye', email: 'selam.tesfaye@bank.com', phone: '+251 913 345 678', department: 'HR' },
            { id: '4', name: 'Mekdes Alemu', email: 'mekdes.alemu@bank.com', phone: '+251 914 456 789', department: 'Operations' },
            { id: '5', name: 'Yonatan Bekele', email: 'yonatan.bekele@bank.com', phone: '+251 915 567 890', department: 'Marketing' },
        ];
        setDepartmentManagers(mockManagers);

        const mockTeamMembers: TeamMember[] = [
            { id: '1', name: 'Abel Mekonnen', role: 'Senior Developer', department: 'IT' },
            { id: '2', name: 'Liyu Tadesse', role: 'Team Leader', department: 'IT' },
            { id: '3', name: 'Selam Tesfaye', role: 'Senior Developer', department: 'IT' },
            { id: '4', name: 'Mekdes Alemu', role: 'Team Leader', department: 'IT' },
            { id: '5', name: 'Yonatan Bekele', role: 'Senior Developer', department: 'IT' },
            { id: '6', name: 'Saron Hailu', role: 'Team Leader', department: 'IT' },
        ];
        setTeamMembers(mockTeamMembers);
    }, []);

    // Update selected manager when department changes
    useEffect(() => {
        if (newProject.department) {
            const manager = departmentManagers.find(m => m.department === newProject.department);
            setSelectedManager(manager || null);
        } else {
            setSelectedManager(null);
        }
    }, [newProject.department, departmentManagers]);

    // Filter team members based on search query
    // const filteredTeamMembers = teamMembers.filter(member =>
    //     member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    //     member.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
    //     member.department.toLowerCase().includes(searchQuery.toLowerCase())
    // );

    // const handleSupervisorSelect = (member: TeamMember) => {
    //     setNewProject(prev => ({ ...prev, supervisor: member.name }));
    //     setSearchQuery(member.name);
    //     setShowSearchResults(false);
    // };

    const handleNewProjectSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const project: Project = {
            id: Date.now().toString(),
            name: newProject.name,
            members: 0,
            progress: 0,
            dueDate: newProject.dueDate,
            kickOffDate: new Date().toISOString().split('T')[0],
            status: 'active',
            supervisor: newProject.supervisor,
            supervisorId: selectedManager?.id || '',
            supervisorStatus: 'pending',
            priority: newProject.priority,
            department: newProject.department,
            resources: [],
            ownerName: newProject.ownerName,
            ownerEmail: newProject.ownerEmail,
            ownerPhone: newProject.ownerPhone,
            ownerDepartment: '',
        };

        setProjects(prev => [project, ...prev]);
        setIsNewProjectModalOpen(false);
        setNewProject({
            name: '',
            dueDate: '',
            supervisor: '',
            scrumMaster: '',
            priority: 'medium',
            department: '',
            resources: [],
            ownerName: '',
            ownerEmail: '',
            ownerPhone: '',
        });

        // Add notification for the supervisor
        addNotification({
            type: 'project',
            title: 'New Project Assignment',
            message: `You have been assigned to supervise the project: ${project.name}`,
            metadata: {
                projectId: project.id,
                projectName: project.name
            }
        });

        toast.success('Project created successfully!');
    };

    const handleProjectSelect = (project: Project) => {
        setSelectedProject(project);
    };

    const handleAddResource = () => {
        if (newResource.name && newResource.category) {
            const resource: ProjectResource = {
                id: Date.now().toString(),
                name: newResource.name,
                category: newResource.category === 'Other' ? newResource.customCategory as ResourceCategory : newResource.category,
                file: newResource.file,
                url: newResource.url,
            };
            setNewProject(prev => ({
                ...prev,
                resources: [...prev.resources, resource]
            }));
            setNewResource({ name: '', category: 'Documentation', customCategory: '' });
            setIsAddingResource(false);
        }
    };

    const handleRemoveResource = (resourceId: string) => {
        setNewProject(prev => ({
            ...prev,
            resources: prev.resources.filter(r => r.id !== resourceId)
        }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setNewResource(prev => ({ ...prev, file }));
        }
    };

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
                resources: [],
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
                resources: [],
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
                resources: [],
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
                resources: [],
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
                resources: [],
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
                resources: [],
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
    }, [user]);

    // Format date to be more readable
    const formatDate = (dateString: string) => {
        const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    // Calculate upcoming deadlines
    const upcomingDeadlines = projects.filter(p => {
        const dueDate = new Date(p.dueDate);
        const today = new Date();
        const diffTime = dueDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 30 && p.status === 'active';
    });

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
                        //responsive: true,
                        drawCallback: function () {
                            // Reapply styles after each draw
                            $('.dataTables_paginate').addClass('flex items-center gap-2');
                            $('.dt-paging').addClass('flex items-center gap-2');
                            $('.pagination').addClass('flex items-center gap-1 flex-wrap justify-center sm:justify-end');
                            $('.page-link').addClass('border rounded px-2 sm:px-3 py-1 text-sm hover:bg-gray-100 transition-colors');
                            $('.page-item.active .page-link').addClass('bg-fuchsia-800 text-white hover:bg-stone-800');
                            $('.page-item.disabled .page-link').addClass('opacity-50 cursor-not-allowed hover:bg-transparent');
                            $('.dt-paging-button').addClass('mx-1');
                            $('.dt-paging-button:first-child').removeClass('mx-1').addClass('mr-1');
                            $('.dt-paging-button:last-child').removeClass('mx-1').addClass('ml-1');

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

                            // Style pagination container and elements
                            $('.dataTables_paginate').addClass('flex items-center gap-2');
                            $('.dt-paging').addClass('flex items-center gap-2');
                            $('.pagination').addClass('flex items-center gap-1 flex-wrap justify-center sm:justify-end');

                            // Style pagination buttons
                            $('.page-link').addClass('border rounded px-2 sm:px-3 py-1 text-sm hover:bg-gray-100 transition-colors');
                            $('.page-item.active .page-link').addClass('bg-fuchsia-800 text-white hover:bg-stone-800');
                            $('.page-item.disabled .page-link').addClass('opacity-50 cursor-not-allowed hover:bg-transparent');

                            // Style info text
                            $('.dataTables_info').addClass('text-sm text-gray-500');

                            // Add hover effects to pagination buttons
                            $('.page-link:not(.disabled)').hover(
                                function () { $(this).addClass('bg-gray-100'); },
                                function () { $(this).removeClass('bg-gray-100'); }
                            );

                            // Ensure proper spacing between pagination elements
                            $('.dt-paging-button').addClass('mx-1');
                            $('.dt-paging-button:first-child').removeClass('mx-1').addClass('mr-1');
                            $('.dt-paging-button:last-child').removeClass('mx-1').addClass('ml-1');

                            // Add responsive classes to the table wrapper
                            $('.dataTables_wrapper').addClass('w-full overflow-x-auto -mx-4 sm:mx-0');
                            $('.dataTable').addClass('w-full min-w-[640px] sm:min-w-0');

                            // Add responsive container classes
                            $('.dataTables_wrapper').wrap('<div class="w-full overflow-hidden"></div>');
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
        <DashboardLayout darkMode={darkMode} setDarkMode={setDarkMode} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}>
            <div className={`min-h-screen ${darkMode ? 'bg-zinc-900' : 'bg-gradient-to-br from-gray-50 via-white to-fuchsia-50/30'} pt-15 transition-colors duration-200`}>
                <div className="space-y-6 w-full p-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className={`text-3xl font-bold tracking-tight ${darkMode ? 'text-gray-300' : 'bg-gradient-to-r from-fuchsia-800 to-stone-800 bg-clip-text text-transparent'}`}>Welcome back, {user?.email?.split('@')[0]}</h2>
                            <p className={`${darkMode ? 'text-gray-400' : 'text-muted-foreground'} mt-1`}>Here's an overview of your projects and team</p>
                        </div>
                        <Button
                            onClick={() => setIsNewProjectModalOpen(true)}
                            className={`${darkMode ? 'bg-fuchsia-700 hover:bg-fuchsia-800' : 'bg-fuchsia-800 hover:bg-stone-800'} text-white text-base py-2 px-4 hover:border-yellow-400 rounded-lg transition-all duration-200 hover:scale-105 shadow-md hover:shadow-lg`}
                        >
                            <Plus className="mr-2 h-5 w-5" />
                            New Project
                        </Button>
                    </div>

                    {/* New Project Modal */}
                    <Dialog open={isNewProjectModalOpen} onOpenChange={setIsNewProjectModalOpen}>
                        <DialogContent className={`sm:max-w-[800px] ${darkMode ? 'bg-zinc-800 border-zinc-700' : 'bg-white/95 backdrop-blur-sm border-fuchsia-200'} shadow-xl transition-colors duration-200`}>
                            <DialogHeader className="pb-2">
                                <DialogTitle className={`text-2xl font-bold ${darkMode ? 'text-gray-300' : 'bg-gradient-to-r from-fuchsia-800 to-stone-800 bg-clip-text text-transparent'}`}>Create New Project</DialogTitle>
                                <DialogDescription className={`text-base ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                    Fill in the details to create a new project for your team.
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleNewProjectSubmit} className="space-y-4">
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="projectName" className="text-base font-medium">Project Name</Label>
                                            <Input
                                                id="projectName"
                                                value={newProject.name}
                                                onChange={(e) => setNewProject(prev => ({ ...prev, name: e.target.value }))}
                                                placeholder="Enter project name"
                                                className="h-10 text-base border-gray-200 focus:border-fuchsia-500 focus:ring-fuchsia-500"
                                                required
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="department" className="text-base font-medium">Project Owner Department</Label>
                                            <Input
                                                id="department"
                                                value={newProject.department}
                                                onChange={(e) => setNewProject(prev => ({ ...prev, department: e.target.value }))}
                                                placeholder="Enter department name"
                                                className="h-10 text-base border-gray-200 focus:border-fuchsia-500 focus:ring-fuchsia-500"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="ownerName" className="text-base font-medium">Project Owner Name</Label>
                                            <Input
                                                id="ownerName"
                                                value={newProject.ownerName}
                                                onChange={(e) => setNewProject(prev => ({ ...prev, ownerName: e.target.value }))}
                                                placeholder="Enter owner name"
                                                className="h-10 text-base border-gray-200 focus:border-fuchsia-500 focus:ring-fuchsia-500"
                                                required
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="ownerEmail" className="text-base font-medium">Project Owner Email</Label>
                                                <Input
                                                    id="ownerEmail"
                                                    type="email"
                                                    value={newProject.ownerEmail}
                                                    onChange={(e) => setNewProject(prev => ({ ...prev, ownerEmail: e.target.value }))}
                                                    placeholder="Enter email address"
                                                    className="h-10 text-base border-gray-200 focus:border-fuchsia-500 focus:ring-fuchsia-500"
                                                    required
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="ownerPhone" className="text-base font-medium">Project Owner Phone</Label>
                                                <Input
                                                    id="ownerPhone"
                                                    type="tel"
                                                    value={newProject.ownerPhone}
                                                    onChange={(e) => setNewProject(prev => ({ ...prev, ownerPhone: e.target.value }))}
                                                    placeholder="Enter phone number"
                                                    className="h-10 text-base border-gray-200 focus:border-fuchsia-500 focus:ring-fuchsia-500"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="scrumMaster" className="text-base font-medium">Scrum Master</Label>
                                        <Input
                                            id="scrumMaster"
                                            value={newProject.scrumMaster}
                                            onChange={e => setNewProject(prev => ({ ...prev, scrumMaster: e.target.value }))}
                                            placeholder="Enter scrum master name (optional)"
                                            className="h-10 text-base border-gray-200 focus:border-fuchsia-500 focus:ring-fuchsia-500"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="supervisor" className="text-base font-medium">Supervisor / Team Leader</Label>
                                        <Input
                                            id="supervisor"
                                            value={newProject.supervisor}
                                            onChange={e => setNewProject(prev => ({ ...prev, supervisor: e.target.value }))}
                                            placeholder="Enter supervisor or team leader name (optional)"
                                            className="h-10 text-base border-gray-200 focus:border-fuchsia-500 focus:ring-fuchsia-500"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="dueDate" className="text-base font-medium">Due Date</Label>
                                        <Input
                                            id="dueDate"
                                            type="date"
                                            value={newProject.dueDate}
                                            onChange={(e) => setNewProject(prev => ({ ...prev, dueDate: e.target.value }))}
                                            className="h-10 text-base border-gray-200 focus:border-fuchsia-500 focus:ring-fuchsia-500"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="priority" className="text-base font-medium">Priority</Label>
                                        <Select
                                            value={newProject.priority}
                                            onValueChange={(value: 'high' | 'medium' | 'low') =>
                                                setNewProject(prev => ({ ...prev, priority: value }))
                                            }
                                        >
                                            <SelectTrigger className="h-10 text-base border-gray-200 focus:border-fuchsia-500 focus:ring-fuchsia-500">
                                                <SelectValue placeholder="Select priority" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="high" className="text-base">
                                                    <div className="flex items-center gap-2">
                                                        <span className="h-2 w-2 rounded-full bg-red-500"></span>
                                                        High
                                                    </div>
                                                </SelectItem>
                                                <SelectItem value="medium" className="text-base">
                                                    <div className="flex items-center gap-2">
                                                        <span className="h-2 w-2 rounded-full bg-yellow-500"></span>
                                                        Medium
                                                    </div>
                                                </SelectItem>
                                                <SelectItem value="low" className="text-base">
                                                    <div className="flex items-center gap-2">
                                                        <span className="h-2 w-2 rounded-full bg-green-500"></span>
                                                        Low
                                                    </div>
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-base font-medium">Project Resources</Label>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setIsAddingResource(true)}
                                            className="h-8 px-3 text-sm border-gray-200 hover:border-fuchsia-500 hover:text-fuchsia-700"
                                        >
                                            <Plus className="h-4 w-4 mr-1" />
                                            Add Resource
                                        </Button>
                                    </div>

                                    {newProject.resources.length > 0 && (
                                        <div className="border rounded-lg divide-y">
                                            {newProject.resources.map((resource) => (
                                                <div key={resource.id} className="p-3 flex items-center justify-between">
                                                    <div>
                                                        <div className="font-medium">{resource.name}</div>
                                                        <div className="text-sm text-gray-500">{resource.category}</div>
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleRemoveResource(resource.id)}
                                                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {isAddingResource && (
                                    <div className="p-4 border rounded-lg space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="resourceName" className="text-sm font-medium">Resource Name</Label>
                                                <Input
                                                    id="resourceName"
                                                    value={newResource.name}
                                                    onChange={(e) => setNewResource(prev => ({ ...prev, name: e.target.value }))}
                                                    placeholder="Enter resource name"
                                                    className="h-9 text-sm"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="resourceCategory" className="text-sm font-medium">Category</Label>
                                                <Select
                                                    value={newResource.category}
                                                    onValueChange={(value: ResourceCategory) =>
                                                        setNewResource(prev => ({ ...prev, category: value }))
                                                    }
                                                >
                                                    <SelectTrigger className="h-9 text-sm">
                                                        <SelectValue placeholder="Select category" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {resourceCategories.map((category) => (
                                                            <SelectItem key={category} value={category}>
                                                                {category}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                {newResource.category === 'Other' && (
                                                    <Input
                                                        value={newResource.customCategory}
                                                        onChange={(e) => setNewResource(prev => ({ ...prev, customCategory: e.target.value }))}
                                                        placeholder="Enter the category name"
                                                        className="h-9 text-sm mt-2"
                                                        required
                                                    />
                                                )}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="resourceFile" className="text-sm font-medium">Upload File</Label>
                                            <Input
                                                id="resourceFile"
                                                type="file"
                                                onChange={handleFileChange}
                                                className="h-9 text-sm"
                                            />
                                        </div>

                                        <div className="flex justify-end space-x-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => {
                                                    setIsAddingResource(false);
                                                    setNewResource({ name: '', category: 'Documentation', customCategory: '' });
                                                }}
                                                className="h-9 px-4 text-sm"
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                type="button"
                                                onClick={handleAddResource}
                                                className="h-9 px-4 text-sm bg-fuchsia-800 hover:bg-stone-800 text-white"
                                            >
                                                Add Resource
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                <div className="flex justify-end space-x-3 pt-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsNewProjectModalOpen(false)}
                                        className="h-10 px-6 text-base border-gray-200 hover:border-fuchsia-500 hover:text-fuchsia-700"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        className="bg-fuchsia-800 hover:bg-stone-800 text-white hover:border-yellow-400 h-10 px-6 text-base transition-all duration-200 hover:scale-105 shadow-md hover:shadow-lg"
                                    >
                                        Create Project
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>

                    <div className="grid gap-6 md:grid-cols-3">
                        <Card className={`hover:shadow-lg transition-all duration-200 ${darkMode ? 'bg-zinc-800 border-zinc-700' : ''}`}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className={`text-base font-semibold ${darkMode ? 'text-gray-300' : ''}`}>Active Projects</CardTitle>
                                <BarChart className={`h-5 w-5 ${darkMode ? 'text-fuchsia-400' : 'text-fuchsia-800'}`} />
                            </CardHeader>
                            <CardContent>
                                <div className={`text-3xl font-bold ${darkMode ? 'text-gray-300' : ''}`}>{projects.filter(p => p.status === 'active').length}</div>
                                <div className="flex items-center gap-2 mt-2">
                                    <ArrowUpRight className="h-4 w-4 text-green-500" />
                                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-muted-foreground'}`}>
                                        +2 since last month
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className={`hover:shadow-lg transition-all duration-200 ${darkMode ? 'bg-zinc-800 border-zinc-700' : ''}`}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className={`text-base font-semibold ${darkMode ? 'text-gray-300' : ''}`}>Team Members</CardTitle>
                                <Users className={`h-5 w-5 ${darkMode ? 'text-fuchsia-400' : 'text-fuchsia-800'}`} />
                            </CardHeader>
                            <CardContent>
                                <div className={`text-3xl font-bold ${darkMode ? 'text-gray-300' : ''}`}>12</div>
                                <div className="flex items-center gap-2 mt-2">
                                    <ArrowUpRight className="h-4 w-4 text-green-500" />
                                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-muted-foreground'}`}>
                                        +3 new this quarter
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className={`hover:shadow-lg transition-all duration-200 ${darkMode ? 'bg-zinc-800 border-zinc-700' : ''}`}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className={`text-base font-semibold ${darkMode ? 'text-gray-300' : ''}`}>Upcoming Deadlines</CardTitle>
                                <Calendar className={`h-5 w-5 ${darkMode ? 'text-fuchsia-400' : 'text-fuchsia-800'}`} />
                            </CardHeader>
                            <CardContent>
                                <div className={`text-3xl font-bold ${darkMode ? 'text-gray-300' : ''}`}>{upcomingDeadlines.length}</div>
                                <div className="flex items-center gap-2 mt-2">
                                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-muted-foreground'}`}>
                                        Next: {upcomingDeadlines[0]?.name || 'No upcoming deadlines'}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className={`w-full hover:shadow-lg transition-all duration-200 ${darkMode ? 'bg-zinc-800 border-zinc-700' : ''}`}>
                        <CardHeader>
                            <CardTitle className={`text-xl ${darkMode ? 'text-gray-300' : ''}`}>Projects</CardTitle>
                            <CardDescription className={`text-base ${darkMode ? 'text-gray-400' : ''}`}>
                                Manage and monitor all your ongoing projects
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className={`rounded-lg border ${darkMode ? 'border-zinc-700' : ''}`}>
                                <table ref={tableRef} className="w-full text-sm">
                                    <thead>
                                        <tr className={`border-b ${darkMode ? 'bg-zinc-700' : 'bg-muted/50'}`}>
                                            <th className={`px-6 py-4 text-left font-semibold ${darkMode ? 'text-gray-300' : ''}`}>Name</th>
                                            <th className={`px-6 py-4 text-left font-semibold ${darkMode ? 'text-gray-300' : ''}`}>Priority</th>
                                            <th className={`px-6 py-4 text-left font-semibold ${darkMode ? 'text-gray-300' : ''}`}>Supervisor</th>
                                            <th className={`px-6 py-4 text-left font-semibold ${darkMode ? 'text-gray-300' : ''}`}>Progress</th>
                                            <th className={`px-6 py-4 text-left font-semibold ${darkMode ? 'text-gray-300' : ''}`}>Kick-off Date</th>
                                            <th className={`px-6 py-4 text-left font-semibold ${darkMode ? 'text-gray-300' : ''}`}>Due Date</th>
                                            <th className={`px-6 py-4 text-right font-semibold ${darkMode ? 'text-gray-300' : ''}`}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {projects.map((project) => (
                                            <tr key={project.id} className={`border-b hover:${darkMode ? 'bg-zinc-700/50' : 'bg-muted/50'} transition-colors duration-200 ${darkMode ? 'border-zinc-700' : ''}`}>
                                                <td className={`px-6 py-4 ${darkMode ? 'text-gray-300' : ''}`}>
                                                    <div className="font-medium">{project.name}</div>
                                                </td>
                                                <td className={`px-6 py-4 ${darkMode ? 'text-gray-300' : ''}`}>
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
                                                <td className={`px-6 py-4 ${darkMode ? 'text-gray-300' : ''}`}>
                                                    <div className="flex items-center gap-2">
                                                        <Users className="h-4 w-4 text-muted-foreground" />
                                                        {project.supervisor}
                                                    </div>
                                                </td>
                                                <td className={`px-6 py-4 ${darkMode ? 'text-gray-300' : ''}`}>{project.progress}</td>
                                                <td className={`px-6 py-4 ${darkMode ? 'text-gray-300' : ''}`}>{formatDate(project.kickOffDate)}</td>
                                                <td className={`px-6 py-4 ${darkMode ? 'text-gray-300' : ''}`}>{formatDate(project.dueDate)}</td>
                                                <td className={`px-6 py-4 text-right ${darkMode ? 'text-gray-300' : ''}`}>
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
            </div>

            {/* Project Details Modal */}
            {selectedProject && (
                <Dialog open={!!selectedProject} onOpenChange={() => setSelectedProject(null)}>
                    <DialogContent className={`sm:max-w-[1000px] ${darkMode ? 'bg-zinc-800 border-zinc-700' : 'bg-white/95 backdrop-blur-sm border-fuchsia-200'} shadow-xl transition-colors duration-200`}>
                        <DialogHeader className="pb-2">
                            <DialogTitle className={`text-2xl font-bold ${darkMode ? 'text-gray-300' : 'bg-gradient-to-r from-fuchsia-800 to-stone-800 bg-clip-text text-transparent'}`}>
                                {selectedProject.name}
                            </DialogTitle>
                            <DialogDescription className={`text-base ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                Project details and progress overview
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4">
                            {/* Project Overview */}
                            <div className="grid gap-4 md:grid-cols-4">
                                <Card className={darkMode ? 'bg-zinc-700 border-zinc-600' : ''}>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className={`text-sm font-medium ${darkMode ? 'text-gray-300' : ''}`}>Progress</CardTitle>
                                        <BarChart className={`h-4 w-4 ${darkMode ? 'text-gray-400' : 'text-muted-foreground'}`} />
                                    </CardHeader>
                                    <CardContent>
                                        <div className={`text-2xl font-bold ${darkMode ? 'text-gray-300' : ''}`}>{selectedProject.progress}%</div>
                                        <div className="mt-1">
                                            <div className={`h-2 w-full rounded-full ${darkMode ? 'bg-zinc-600' : 'bg-gray-200'}`}>
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
                                <Card className={darkMode ? 'bg-zinc-700 border-zinc-600' : ''}>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className={`text-sm font-medium ${darkMode ? 'text-gray-300' : ''}`}>Team Size</CardTitle>
                                        <Users className={`h-4 w-4 ${darkMode ? 'text-gray-400' : 'text-muted-foreground'}`} />
                                    </CardHeader>
                                    <CardContent>
                                        <div className={`text-2xl font-bold ${darkMode ? 'text-gray-300' : ''}`}>{selectedProject.members}</div>
                                        <p className="text-xs text-muted-foreground">
                                            Active team members
                                        </p>
                                    </CardContent>
                                </Card>
                                <Card className={darkMode ? 'bg-zinc-700 border-zinc-600' : ''}>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className={`text-sm font-medium ${darkMode ? 'text-gray-300' : ''}`}>Priority</CardTitle>
                                        <AlertCircle className={`h-4 w-4 ${darkMode ? 'text-gray-400' : 'text-muted-foreground'}`}/>
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
                                <Card className={darkMode ? 'bg-zinc-700 border-zinc-600' : ''}>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className={`text-sm font-medium ${darkMode ? 'text-gray-300' : ''}`}>Status</CardTitle>
                                        <Clock className={`h-4 w-4 ${darkMode ? 'text-gray-400' : 'text-muted-foreground'}`} />
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
                                <Card className={darkMode ? 'bg-zinc-700 border-zinc-600' : ''}>
                                    <CardHeader className="pb-2">
                                        <CardTitle className={`text-sm font-medium ${darkMode ? 'text-gray-300' : ''}`}>Project Timeline</CardTitle>
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
                                <Card className={darkMode ? 'bg-zinc-700 border-zinc-600' : ''}>
                                    <CardHeader className="pb-2">
                                        <CardTitle className={`text-sm font-medium ${darkMode ? 'text-gray-300' : ''}`}>Project Details</CardTitle>
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

                            {/* Project Resources */}
                            <Card className={darkMode ? 'bg-zinc-700 border-zinc-600' : ''}>
                                <CardHeader className="pb-2">
                                    <CardTitle className={`text-sm font-medium ${darkMode ? 'text-gray-300' : ''}`}>Project Resources</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {selectedProject.resources && selectedProject.resources.length > 0 ? (
                                        <div className="grid gap-3 md:grid-cols-2">
                                            {selectedProject.resources.map((resource) => (
                                                <div key={resource.id} className="p-3 border rounded-lg">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <div className="font-medium">{resource.name}</div>
                                                            <div className="text-sm text-gray-500">{resource.category}</div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {resource.file && (
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="h-8 px-3 text-sm"
                                                                >
                                                                    <Download className="h-4 w-4 mr-1" />
                                                                    Download
                                                                </Button>
                                                            )}
                                                            {resource.url && (
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="h-8 px-3 text-sm"
                                                                    onClick={() => window.open(resource.url, '_blank')}
                                                                >
                                                                    <ExternalLink className="h-4 w-4 mr-1" />
                                                                    Open Link
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-4 text-gray-500">
                                            No resources attached to this project
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Action Buttons */}
                            <div className="flex justify-end space-x-3 pt-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setSelectedProject(null)}
                                    className={`h-10 px-6 text-base ${darkMode ? 'bg-gray-600 border-zinc-600 hover:border-fuchsia-500 hover:text-fuchsia-400 text-gray-300' : 'border-gray-200 hover:border-fuchsia-500 hover:text-fuchsia-700'}`}
                                >
                                    Close
                                </Button>
                                <Button
                                    className={`${darkMode ? 'bg-fuchsia-700 hover:bg-fuchsia-800' : 'bg-fuchsia-800 hover:bg-stone-800'} text-white hover:border-yellow-400 h-10 px-6 text-base transition-all duration-200 hover:scale-105 shadow-md hover:shadow-lg`}
                                >
                                    Edit Project
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </DashboardLayout>
    );
};

export default ManagerDashboard;
