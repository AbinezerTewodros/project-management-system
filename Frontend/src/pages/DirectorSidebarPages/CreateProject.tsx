import { useState, useEffect } from "react";
//import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "react-hot-toast";
import { Search, X, Plus } from "lucide-react";
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

interface DirectorCreateProjectProps {
    darkMode: boolean;
    setDarkMode: (darkMode: boolean) => void;
    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
}

const DirectorCreateProject = ({ darkMode}: DirectorCreateProjectProps) => {
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
    }>(
        {
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
        //const mockDepartments = ['IT', 'Finance', 'HR', 'Operations', 'Marketing'];

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

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setNewResource(prev => ({ ...prev, file }));
        }
    };

    return (
        <div className={`min-h-screen ${darkMode ? 'bg-zinc-800 text-gray-300' : 'bg-gradient-to-br from-gray-50 via-white to-fuchsia-50/30'}`}>
            <div className="space-y-6 w-full p-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className={`text-3xl font-bold tracking-tight ${darkMode ? 'text-gray-300' : 'bg-gradient-to-r from-fuchsia-800 to-stone-800 bg-clip-text text-transparent'}`}>
                            Create New Project
                        </h2>
                        <p className={`${darkMode ? 'text-gray-400' : 'text-muted-foreground'} mt-1`}>
                            Fill in the details to create a new project for your team
                        </p>
                    </div>
                </div>

                <Card className={`w-full hover:shadow-lg transition-shadow duration-200 ${darkMode ? 'bg-zinc-700 border-zinc-600' : ''}`}>
                    <CardHeader>
                        <CardTitle className={`text-xl ${darkMode ? 'text-gray-300' : ''}`}>Project Details</CardTitle>
                        <CardDescription className={`text-base ${darkMode ? 'text-gray-400' : ''}`}>
                            Enter the required information to create a new project
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleNewProjectSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="projectName" className={`text-base font-medium ${darkMode ? 'text-gray-300' : ''}`}>
                                    Project Name
                                </Label>
                                <Input
                                    id="projectName"
                                    value={newProject.name}
                                    onChange={(e) => setNewProject(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="Enter project name"
                                    className={`h-11 text-base ${darkMode ? 'bg-zinc-600 border-zinc-500 text-gray-300 focus:border-fuchsia-500 focus:ring-fuchsia-500' : 'border-gray-200 focus:border-fuchsia-500 focus:ring-fuchsia-500'}`}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="department" className={`text-base font-medium ${darkMode ? 'text-gray-300' : ''}`}>
                                    Project Owner Department
                                </Label>
                                <Input
                                    id="department"
                                    value={newProject.department}
                                    onChange={(e) => setNewProject(prev => ({ ...prev, department: e.target.value }))}
                                    placeholder="Enter department name"
                                    className={`h-10 text-base ${darkMode ? 'bg-zinc-600 border-zinc-500 text-gray-300 focus:border-fuchsia-500 focus:ring-fuchsia-500' : 'border-gray-200 focus:border-fuchsia-500 focus:ring-fuchsia-500'}`}
                                    required
                                />
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="ownerName" className={`text-base font-medium ${darkMode ? 'text-gray-300' : ''}`}>
                                        Project Owner Name
                                    </Label>
                                    <Input
                                        id="ownerName"
                                        value={newProject.ownerName}
                                        onChange={(e) => setNewProject(prev => ({ ...prev, ownerName: e.target.value }))}
                                        placeholder="Enter owner name"
                                        className={`h-10 text-base ${darkMode ? 'bg-zinc-600 border-zinc-500 text-gray-300 focus:border-fuchsia-500 focus:ring-fuchsia-500' : 'border-gray-200 focus:border-fuchsia-500 focus:ring-fuchsia-500'}`}
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="ownerEmail" className={`text-base font-medium ${darkMode ? 'text-gray-300' : ''}`}>
                                            Project Owner Email
                                        </Label>
                                        <Input
                                            id="ownerEmail"
                                            type="email"
                                            value={newProject.ownerEmail}
                                            onChange={(e) => setNewProject(prev => ({ ...prev, ownerEmail: e.target.value }))}
                                            placeholder="Enter email address"
                                            className={`h-10 text-base ${darkMode ? 'bg-zinc-600 border-zinc-500 text-gray-300 focus:border-fuchsia-500 focus:ring-fuchsia-500' : 'border-gray-200 focus:border-fuchsia-500 focus:ring-fuchsia-500'}`}
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="ownerPhone" className={`text-base font-medium ${darkMode ? 'text-gray-300' : ''}`}>
                                            Project Owner Phone
                                        </Label>
                                        <Input
                                            id="ownerPhone"
                                            type="tel"
                                            value={newProject.ownerPhone}
                                            onChange={(e) => setNewProject(prev => ({ ...prev, ownerPhone: e.target.value }))}
                                            placeholder="Enter phone number"
                                            className={`h-10 text-base ${darkMode ? 'bg-zinc-600 border-zinc-500 text-gray-300 focus:border-fuchsia-500 focus:ring-fuchsia-500' : 'border-gray-200 focus:border-fuchsia-500 focus:ring-fuchsia-500'}`}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            {selectedManager && (
                                <div className={`space-y-2 p-4 rounded-lg ${darkMode ? 'bg-zinc-600 text-gray-300' : 'bg-gray-50'}`}>
                                    <h3 className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>Department Manager Information</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Name</p>
                                            <p className="font-medium">{selectedManager.name}</p>
                                        </div>
                                        <div>
                                            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Email</p>
                                            <p className="font-medium">{selectedManager.email}</p>
                                        </div>
                                        <div>
                                            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Phone</p>
                                            <p className="font-medium">{selectedManager.phone}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="dueDate" className={`text-base font-medium ${darkMode ? 'text-gray-300' : ''}`}>
                                    Due Date
                                </Label>
                                <Input
                                    id="dueDate"
                                    type="date"
                                    value={newProject.dueDate}
                                    onChange={(e) => setNewProject(prev => ({ ...prev, dueDate: e.target.value }))}
                                    className={`h-11 text-base ${darkMode ? 'bg-zinc-600 border-zinc-500 text-gray-300 focus:border-fuchsia-500 focus:ring-fuchsia-500' : 'border-gray-200 focus:border-fuchsia-500 focus:ring-fuchsia-500'}`}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="supervisor" className={`text-base font-medium ${darkMode ? 'text-gray-300' : ''}`}>
                                    Assign Supervisor/Team Leader
                                </Label>
                                <div className="relative">
                                    <div className="relative">
                                        <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${darkMode ? 'text-gray-400' : 'text-gray-400'}`} size={20} />
                                        <Input
                                            id="supervisor"
                                            value={searchQuery}
                                            onChange={(e) => {
                                                setSearchQuery(e.target.value);
                                                setShowSearchResults(true);
                                            }}
                                            onFocus={() => setShowSearchResults(true)}
                                            placeholder="Search by name, role, or department..."
                                            className={`pl-10 h-11 text-base ${darkMode ? 'bg-zinc-600 border-zinc-500 text-gray-300 focus:border-fuchsia-500 focus:ring-fuchsia-500' : 'border-gray-200 focus:border-fuchsia-500 focus:ring-fuchsia-500'}`}
                                        />
                                        {newProject.supervisor && (
                                            <button
                                                onClick={() => {
                                                    setNewProject(prev => ({ ...prev, supervisor: '' }));
                                                    setSearchQuery('');
                                                }}
                                                className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
                                            >
                                                <X size={20} />
                                            </button>
                                        )}
                                    </div>
                                    {showSearchResults && searchQuery && (
                                        <div className={`absolute z-10 w-full mt-1 rounded-md shadow-lg max-h-60 overflow-auto ${darkMode ? 'bg-zinc-700 border-zinc-600' : 'bg-white border border-gray-200'}`}>
                                            {filteredTeamMembers.length > 0 ? (
                                                filteredTeamMembers.map((member) => (
                                                    <div
                                                        key={member.id}
                                                        onClick={() => handleSupervisorSelect(member)}
                                                        className={`px-4 py-2 cursor-pointer flex items-center justify-between ${darkMode ? 'hover:bg-zinc-600' : 'hover:bg-gray-100'}`}
                                                    >
                                                        <div>
                                                            <div className={`font-medium ${darkMode ? 'text-gray-300' : ''}`}>{member.name}</div>
                                                            <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                                {member.role} • {member.department}
                                                            </div>
                                                        </div>
                                                        <Badge variant="outline" className={`ml-2 ${darkMode ? 'border-zinc-500' : ''}`}>
                                                            {member.role}
                                                        </Badge>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className={`px-4 py-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                    No team members found
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="priority" className={`text-base font-medium ${darkMode ? 'text-gray-300' : ''}`}>
                                    Priority
                                </Label>
                                <Select
                                    value={newProject.priority}
                                    onValueChange={(value: 'high' | 'medium' | 'low') =>
                                        setNewProject(prev => ({ ...prev, priority: value }))
                                    }
                                >
                                    <SelectTrigger className={`h-11 text-base ${darkMode ? 'bg-zinc-600 border-zinc-500 text-gray-300 focus:border-fuchsia-500 focus:ring-fuchsia-500' : 'border-gray-200 focus:border-fuchsia-500 focus:ring-fuchsia-500'}`}>
                                        <SelectValue placeholder="Select priority" />
                                    </SelectTrigger>
                                    <SelectContent className={darkMode ? 'bg-zinc-700 border-zinc-600' : ''}>
                                        <SelectItem value="high" className={`text-base ${darkMode ? 'hover:bg-zinc-600' : ''}`}>
                                            <div className="flex items-center gap-2">
                                                <span className="h-2 w-2 rounded-full bg-red-500"></span>
                                                High
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="medium" className={`text-base ${darkMode ? 'hover:bg-zinc-600' : ''}`}>
                                            <div className="flex items-center gap-2">
                                                <span className="h-2 w-2 rounded-full bg-yellow-500"></span>
                                                Medium
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="low" className={`text-base ${darkMode ? 'hover:bg-zinc-600' : ''}`}>
                                            <div className="flex items-center gap-2">
                                                <span className="h-2 w-2 rounded-full bg-green-500"></span>
                                                Low
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label className={`text-base font-medium ${darkMode ? 'text-gray-300' : ''}`}>
                                        Project Resources
                                    </Label>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsAddingResource(true)}
                                        className={`h-8 px-3 text-sm ${darkMode ? 'bg-zinc-600 border-zinc-500 text-gray-300 hover:border-fuchsia-500 hover:text-fuchsia-400' : 'border-gray-200 hover:border-fuchsia-500 hover:text-fuchsia-700'}`}
                                    >
                                        <Plus className="h-4 w-4 mr-1" />
                                        Add Resource
                                    </Button>
                                </div>

                                {newProject.resources.length > 0 && (
                                    <div className={`border rounded-lg divide-y ${darkMode ? 'border-zinc-600 divide-zinc-600' : ''}`}>
                                        {newProject.resources.map((resource) => (
                                            <div key={resource.id} className={`p-3 flex items-center justify-between ${darkMode ? 'hover:bg-zinc-600' : ''}`}>
                                                <div>
                                                    <div className={`font-medium ${darkMode ? 'text-gray-300' : ''}`}>{resource.name}</div>
                                                    <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{resource.category}</div>
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleRemoveResource(resource.id)}
                                                    className={`${darkMode ? 'text-red-400 hover:text-red-300 hover:bg-zinc-500' : 'text-red-500 hover:text-red-700 hover:bg-red-50'}`}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {isAddingResource && (
                                <div className={`p-4 border rounded-lg space-y-4 ${darkMode ? 'bg-zinc-700 border-zinc-600' : ''}`}>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="resourceName" className={`text-sm font-medium ${darkMode ? 'text-gray-300' : ''}`}>
                                                Resource Name
                                            </Label>
                                            <Input
                                                id="resourceName"
                                                value={newResource.name}
                                                onChange={(e) => setNewResource(prev => ({ ...prev, name: e.target.value }))}
                                                placeholder="Enter resource name"
                                                className={`h-9 text-sm ${darkMode ? 'bg-zinc-600 border-zinc-500 text-gray-300' : ''}`}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="resourceCategory" className={`text-sm font-medium ${darkMode ? 'text-gray-300' : ''}`}>
                                                Category
                                            </Label>
                                            <Select
                                                value={newResource.category}
                                                onValueChange={(value: ResourceCategory) =>
                                                    setNewResource(prev => ({ ...prev, category: value }))
                                                }
                                            >
                                                <SelectTrigger className={`h-9 text-sm ${darkMode ? 'bg-zinc-600 border-zinc-500 text-gray-300' : ''}`}>
                                                    <SelectValue placeholder="Select category" />
                                                </SelectTrigger>
                                                <SelectContent className={darkMode ? 'bg-zinc-700 border-zinc-600' : ''}>
                                                    {resourceCategories.map((category) => (
                                                        <SelectItem 
                                                            key={category} 
                                                            value={category}
                                                            className={darkMode ? 'hover:bg-zinc-600' : ''}
                                                        >
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
                                                    className={`h-9 text-sm mt-2 ${darkMode ? 'bg-zinc-600 border-zinc-500 text-gray-300' : ''}`}
                                                    required
                                                />
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="resourceFile" className={`text-sm font-medium ${darkMode ? 'text-gray-300' : ''}`}>
                                            Upload File
                                        </Label>
                                        <Input
                                            id="resourceFile"
                                            type="file"
                                            onChange={handleFileChange}
                                            className={`h-9 text-sm ${darkMode ? 'bg-zinc-600 border-zinc-500 text-gray-300' : ''}`}
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
                                            className={`h-9 px-4 text-sm ${darkMode ? 'bg-zinc-600 border-zinc-500 text-gray-300 hover:bg-zinc-500' : ''}`}
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

                            <div className="flex justify-end space-x-3 pt-4">
                                <Button
                                    type="submit"
                                    className={`h-11 px-6 text-base transition-all duration-200 hover:scale-105 shadow-md hover:shadow-lg ${darkMode ? 'bg-fuchsia-700 hover:bg-fuchsia-600 text-white' : 'bg-fuchsia-800 hover:bg-stone-800 text-white hover:border-yellow-400'}`}
                                >
                                    Create Project
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default DirectorCreateProject;