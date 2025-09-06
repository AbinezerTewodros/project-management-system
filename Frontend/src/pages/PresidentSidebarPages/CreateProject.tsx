import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "react-hot-toast";
import {  X, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TeamMember {
    id: string;
    name: string;
    role: string;
    department: string;
}

interface DepartmentManager {
    id: string;
    name: string;
    email: string;
    phone: string;
    department: string;
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

interface PresidentCreateProjectProps {
    darkMode: boolean;
    setDarkMode: (darkMode: boolean) => void;
    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
}

const PresidentCreateProject = ({ darkMode }: PresidentCreateProjectProps) => {
    //const { user } = useAuth();
    const [newProject, setNewProject] = useState<{
        name: string;
        dueDate: string;
        supervisor: string;
        priority: 'high' | 'medium' | 'low';
        department: string;
        resources: ProjectResource[];
        ownerName: string;
        ownerEmail: string;
        ownerPhone: string;
    }>({
        name: '',
        dueDate: '',
        supervisor: '',
        priority: 'medium',
        department: '',
        resources: [],
        ownerName: '',
        ownerEmail: '',
        ownerPhone: '',
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [showSearchResults, setShowSearchResults] = useState(false);
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [departments, setDepartments] = useState<string[]>([]);
    const [departmentManagers, setDepartmentManagers] = useState<DepartmentManager[]>([]);
    const [selectedManager, setSelectedManager] = useState<DepartmentManager | null>(null);
    const [newResource, setNewResource] = useState<Partial<ProjectResource>>({
        name: '',
        category: 'Documentation',
        customCategory: '',
    });
    const [isAddingResource, setIsAddingResource] = useState(false);

    // Mock data for departments and their managers
    useEffect(() => {
        const mockDepartments = ['IT', 'Finance', 'HR', 'Operations', 'Marketing'];
        setDepartments(mockDepartments);

        const mockManagers: DepartmentManager[] = [
            { id: '1', name: 'Abel Mekonnen', email: 'abel.mekonnen@bank.com', phone: '+251 911 123 456', department: 'IT' },
            { id: '2', name: 'Liyu Tadesse', email: 'liyu.tadesse@bank.com', phone: '+251 912 234 567', department: 'Finance' },
            { id: '3', name: 'Selam Tesfaye', email: 'selam.tesfaye@bank.com', phone: '+251 913 345 678', department: 'HR' },
            { id: '4', name: 'Mekdes Alemu', email: 'mekdes.alemu@bank.com', phone: '+251 914 456 789', department: 'Operations' },
            { id: '5', name: 'Yonatan Bekele', email: '+yonatan.bekele@bank.com', phone: '+251 915 567 890', department: 'Marketing' },
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
    const filteredTeamMembers = teamMembers.filter(member =>
        member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.department.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSupervisorSelect = (member: TeamMember) => {
        setNewProject(prev => ({ ...prev, supervisor: member.name }));
        setSearchQuery(member.name);
        setShowSearchResults(false);
    };

    const handleNewProjectSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Here you would typically make an API call to create the project
        console.log('Creating project:', newProject);

        // Reset form
        setNewProject({
            name: '',
            dueDate: '',
            supervisor: '',
            priority: 'medium',
            department: '',
            resources: [],
            ownerName: '',
            ownerEmail: '',
            ownerPhone: '',
        });
        setSearchQuery('');

        toast.success('Project created successfully!');
    };

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

    return (
        <div className={`p-4 overflow-y-auto mt-12 ${darkMode ? "bg-zinc-800 text-gray-100" : "bg-white text-gray-800"}`}>
            <h1 className="text-2xl font-bold mb-4">Create New Project</h1>
            <Card className={darkMode ? "bg-zinc-700 text-gray-100" : "bg-white text-gray-800"}>
                <CardContent className="p-6">
                    <form onSubmit={handleNewProjectSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="projectName" className={darkMode ? "text-gray-200" : "text-gray-700"}>Project Name</Label>
                                <Input
                                    id="projectName"
                                    value={newProject.name}
                                    onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                                    placeholder="Enter project name"
                                    required
                                    className={darkMode ? "bg-zinc-800 text-gray-100 border-zinc-600" : "border-gray-300"}
                                />
                            </div>
                            <div>
                                <Label htmlFor="dueDate" className={darkMode ? "text-gray-200" : "text-gray-700"}>Due Date</Label>
                                <Input
                                    id="dueDate"
                                    type="date"
                                    value={newProject.dueDate}
                                    onChange={(e) => setNewProject({ ...newProject, dueDate: e.target.value })}
                                    required
                                    className={darkMode ? "bg-zinc-800 text-gray-100 border-zinc-600" : "border-gray-300"}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="relative">
                                <Label htmlFor="supervisor" className={darkMode ? "text-gray-200" : "text-gray-700"}>Assign Supervisor</Label>
                                <Input
                                    id="supervisor"
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        setShowSearchResults(true);
                                    }}
                                    onFocus={() => setShowSearchResults(true)}
                                    placeholder="Search for a supervisor"
                                    className={darkMode ? "bg-zinc-800 text-gray-100 border-zinc-600" : "border-gray-300"}
                                />
                                {searchQuery && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            setSearchQuery('');
                                            setNewProject(prev => ({ ...prev, supervisor: '' }));
                                            setShowSearchResults(false);
                                        }}
                                        className="absolute right-2 top-8 text-muted-foreground"
                                    >
                                        <X size={16} />
                                    </Button>
                                )}
                                {showSearchResults && searchQuery && ( // Only show if search query is not empty
                                    <Card className={`absolute z-10 w-full mt-1 ${darkMode ? "bg-zinc-800 border-zinc-600" : "bg-white border-gray-200"}`}>
                                        <CardContent className="p-2">
                                            {filteredTeamMembers.length > 0 ? (
                                                filteredTeamMembers.map((member) => (
                                                    <div
                                                        key={member.id}
                                                        onClick={() => handleSupervisorSelect(member)}
                                                        className={`p-2 cursor-pointer hover:bg-gray-100 ${darkMode ? "hover:bg-zinc-700" : ""}`}
                                                    >
                                                        <p className="font-medium">{member.name}</p>
                                                        <p className="text-sm text-muted-foreground">{member.role} - {member.department}</p>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="p-2 text-sm text-muted-foreground">No matching supervisors found.</p>
                                            )}
                                        </CardContent>
                                    </Card>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="priority" className={darkMode ? "text-gray-200" : "text-gray-700"}>Priority</Label>
                                <Select
                                    value={newProject.priority}
                                    onValueChange={(value: 'high' | 'medium' | 'low') =>
                                        setNewProject({ ...newProject, priority: value })
                                    }
                                >
                                    <SelectTrigger className={darkMode ? "bg-zinc-800 text-gray-100 border-zinc-600" : "border-gray-300"}>
                                        <SelectValue placeholder="Select priority" />
                                    </SelectTrigger>
                                    <SelectContent className={darkMode ? "bg-zinc-800 text-gray-100 border-zinc-600" : ""}>
                                        <SelectItem value="high">High</SelectItem>
                                        <SelectItem value="medium">Medium</SelectItem>
                                        <SelectItem value="low">Low</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="department" className={darkMode ? "text-gray-200" : "text-gray-700"}>Department</Label>
                            <Select
                                value={newProject.department}
                                onValueChange={(value) =>
                                    setNewProject({ ...newProject, department: value })
                                }
                            >
                                <SelectTrigger className={darkMode ? "bg-zinc-800 text-gray-100 border-zinc-600" : "border-gray-300"}>
                                    <SelectValue placeholder="Select department" />
                                </SelectTrigger>
                                <SelectContent className={darkMode ? "bg-zinc-800 text-gray-100 border-zinc-600" : ""}>
                                    {departments.map(dept => (
                                        <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {selectedManager && (
                                <p className={`mt-2 text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                                    Department Manager: <span className="font-medium">{selectedManager.name} ({selectedManager.email})</span>
                                </p>
                            )}
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold mb-2">Project Resources</h3>
                            <div className="space-y-2 mb-4">
                                {newProject.resources.map(resource => (
                                    <Badge key={resource.id} variant="secondary" className={`flex justify-between items-center pr-2 ${darkMode ? "bg-zinc-600 text-gray-100" : ""}`}>
                                        <span>{resource.name} ({resource.category})</span>
                                        <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveResource(resource.id)} className={`ml-2 ${darkMode ? "text-gray-300 hover:bg-zinc-500" : "hover:bg-gray-200"}`}>
                                            <X size={14} />
                                        </Button>
                                    </Badge>
                                ))}
                            </div>

                            <Button type="button" variant="outline" onClick={() => setIsAddingResource(true)} className={darkMode ? "border-zinc-600 text-gray-300 hover:bg-zinc-700" : ""}>
                                <Plus size={16} className="mr-2" /> Add Resource
                            </Button>

                            {isAddingResource && (
                                <Card className={`mt-4 p-4 ${darkMode ? "bg-zinc-600" : "bg-gray-50"}`}>
                                    <h4 className="font-semibold mb-2">New Resource</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="resourceName" className={darkMode ? "text-gray-200" : "text-gray-700"}>Resource Name</Label>
                                            <Input
                                                id="resourceName"
                                                value={newResource.name}
                                                onChange={(e) => setNewResource({ ...newResource, name: e.target.value })}
                                                placeholder="e.g., Project Proposal, Budget Spreadsheet"
                                                className={darkMode ? "bg-zinc-700 text-gray-100 border-zinc-500" : "border-gray-300"}
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="resourceCategory" className={darkMode ? "text-gray-200" : "text-gray-700"}>Category</Label>
                                            <Select
                                                value={newResource.category}
                                                onValueChange={(value: ResourceCategory) =>
                                                    setNewResource({ ...newResource, category: value, customCategory: value === 'Other' ? newResource.customCategory : '' })
                                                }
                                            >
                                                <SelectTrigger className={darkMode ? "bg-zinc-700 text-gray-100 border-zinc-500" : "border-gray-300"}>
                                                    <SelectValue placeholder="Select category" />
                                                </SelectTrigger>
                                                <SelectContent className={darkMode ? "bg-zinc-700 text-gray-100 border-zinc-500" : ""}>
                                                    {resourceCategories.map(cat => (
                                                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    {newResource.category === 'Other' && (
                                        <div className="mt-4">
                                            <Label htmlFor="customCategory" className={darkMode ? "text-gray-200" : "text-gray-700"}>Custom Category Name</Label>
                                            <Input
                                                id="customCategory"
                                                value={newResource.customCategory}
                                                onChange={(e) => setNewResource({ ...newResource, customCategory: e.target.value })}
                                                placeholder="Enter custom category"
                                                className={darkMode ? "bg-zinc-700 text-gray-100 border-zinc-500" : "border-gray-300"}
                                            />
                                        </div>
                                    )}
                                    <div className="mt-4 flex gap-2">
                                        <Button type="button" onClick={handleAddResource} className="bg-green-600 hover:bg-green-700 text-white">
                                            Add Resource
                                        </Button>
                                        <Button type="button" variant="outline" onClick={() => setIsAddingResource(false)} className={darkMode ? "border-zinc-500 text-gray-300 hover:bg-zinc-700" : ""}>
                                            Cancel
                                        </Button>
                                    </div>
                                </Card>
                            )}
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold mb-2">Project Owner Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <Label htmlFor="ownerName" className={darkMode ? "text-gray-200" : "text-gray-700"}>Owner Name</Label>
                                    <Input
                                        id="ownerName"
                                        value={newProject.ownerName}
                                        onChange={(e) => setNewProject({ ...newProject, ownerName: e.target.value })}
                                        placeholder="Enter owner's name"
                                        className={darkMode ? "bg-zinc-800 text-gray-100 border-zinc-600" : "border-gray-300"}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="ownerEmail" className={darkMode ? "text-gray-200" : "text-gray-700"}>Owner Email</Label>
                                    <Input
                                        id="ownerEmail"
                                        type="email"
                                        value={newProject.ownerEmail}
                                        onChange={(e) => setNewProject({ ...newProject, ownerEmail: e.target.value })}
                                        placeholder="Enter owner's email"
                                        className={darkMode ? "bg-zinc-800 text-gray-100 border-zinc-600" : "border-gray-300"}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="ownerPhone" className={darkMode ? "text-gray-200" : "text-gray-700"}>Owner Phone</Label>
                                    <Input
                                        id="ownerPhone"
                                        value={newProject.ownerPhone}
                                        onChange={(e) => setNewProject({ ...newProject, ownerPhone: e.target.value })}
                                        placeholder="Enter owner's phone"
                                        className={darkMode ? "bg-zinc-800 text-gray-100 border-zinc-600" : "border-gray-300"}
                                    />
                                </div>
                            </div>
                        </div>

                        <Button type="submit" className="w-full bg-purple-900 hover:bg-purple-800 text-white">
                            Create Project
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default PresidentCreateProject;
