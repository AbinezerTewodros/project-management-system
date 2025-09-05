import { useState, useEffect, useRef } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import $ from "jquery";
import "datatables.net";

interface TeamMember {
    id: string;
    name: string;
    position: string;
}

interface TeamsProps {
    darkMode: boolean;
    setDarkMode: (darkMode: boolean) => void;
    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
}

const Teams = ({ darkMode, setDarkMode, sidebarOpen, setSidebarOpen }: TeamsProps) => {
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
        {
            id: "1",
            name: "Abebe Kebede",
            position: "Senior Developer",
        },
        {
            id: "2",
            name: "Almaz Bekele",
            position: "Product Manager",
        },
        {
            id: "3",
            name: "Kebede Alemu",
            position: "UX Designer",
        },
        {
            id: "4",
            name: "Mulu Habte",
            position: "QA Engineer",
        },
        {
            id: "5",
            name: "Tigist Fikre",
            position: "DevOps Engineer",
        },
        {
            id: "6",
            name: "Getachew Tadesse",
            position: "Frontend Developer",
        },
        {
            id: "7",
            name: "Hanna Tesfaye",
            position: "Backend Developer",
        },
        {
            id: "8",
            name: "Birhanu Degu",
            position: "Product Designer",
        },
        {
            id: "9",
            name: "Selamawit Asfaw",
            position: "Project Manager",
        },
        {
            id: "10",
            name: "Yared Mamo",
            position: "QA Lead",
        }
    ]);
    const [searchQuery, setSearchQuery] = useState("");
    const [roleFilter, setRoleFilter] = useState<string>("all");
    const tableRef = useRef<HTMLTableElement>(null);
    const dataTableRef = useRef<any>(null);
    const [showModal, setShowModal] = useState(false);
    const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

    useEffect(() => {
        if (tableRef.current) {
            const dataTable = $(tableRef.current).DataTable({
                destroy: true,
                pageLength: 5,
                lengthMenu: [[5, 10, 25, 50, -1], [5, 10, 25, 50, "All"]],
                order: [[0, 'asc']],
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

        return () => {
            if (dataTableRef.current) {
                dataTableRef.current.destroy();
                dataTableRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        if (!dataTableRef.current) return;
        dataTableRef.current.search(searchQuery).draw();
    }, [searchQuery]);

    useEffect(() => {
        if (!dataTableRef.current) return;
        if (roleFilter === "all") {
            dataTableRef.current.column(1).search("").draw();
        } else {
            dataTableRef.current.column(1).search(roleFilter).draw();
        }
    }, [roleFilter]);

    const uniquePositions = Array.from(new Set(teamMembers.map(member => member.position)));

    const mockProjects = [
        { id: '1', name: 'Banking System Upgrade', members: ['1', '2', '3'] },
        { id: '2', name: 'Mobile Wallet App', members: ['1', '4', '5'] },
    ];
    const mockTasks = [
        { id: 't1', title: 'Design Dashboard UI', assignedTo: '1', status: 'completed', projectId: '1' },
        { id: 't2', title: 'Integrate Payment API', assignedTo: '1', status: 'in-progress', projectId: '2' },
        { id: 't3', title: 'Write Test Cases', assignedTo: '2', status: 'in-progress', projectId: '1' },
        { id: 't4', title: 'Review User Stories', assignedTo: '3', status: 'completed', projectId: '1' },
    ];

    const handleViewMember = (member: TeamMember) => {
        setSelectedMember(member);
        setShowModal(true);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed':
                return darkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-800';
            case 'in-progress':
                return darkMode ? 'bg-yellow-900/30 text-yellow-400' : 'bg-yellow-100 text-yellow-800';
            default:
                return darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <DashboardLayout darkMode={darkMode} setDarkMode={setDarkMode} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}>
            <div className={`min-h-screen ${darkMode ? 'bg-zinc-900 text-gray-300' : 'bg-gradient-to-br from-gray-50 via-white to-fuchsia-50/30'} pt-12`}>
                <div className="space-y-6 w-full p-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className={`text-3xl font-bold tracking-tight ${darkMode ? 'text-gray-300' : 'bg-gradient-to-r from-fuchsia-800 to-stone-800 bg-clip-text text-transparent'}`}>
                                Team Members
                            </h2>
                            <p className={`${darkMode ? 'text-gray-400' : 'text-muted-foreground'} mt-1`}>
                                Manage and view your team members
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${darkMode ? 'text-gray-400' : 'text-gray-400'}`} size={20} />
                            <Input
                                type="text"
                                placeholder="Search by name or position..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className={`pl-10 h-11 text-base ${darkMode ? 'bg-zinc-700 border-zinc-600 text-gray-300 focus:border-fuchsia-500' : ''}`}
                            />
                        </div>
                        <Select value={roleFilter} onValueChange={setRoleFilter}>
                            <SelectTrigger className={`w-[180px] h-11 text-base ${darkMode ? 'bg-zinc-700 border-zinc-600 text-gray-300' : ''}`}>
                                <SelectValue placeholder="Filter by position" />
                            </SelectTrigger>
                            <SelectContent className={darkMode ? 'bg-zinc-800 border-zinc-700' : ''}>
                                <SelectItem value="all" className={darkMode ? 'hover:bg-zinc-700' : ''}>All Positions</SelectItem>
                                {uniquePositions.map(position => (
                                    <SelectItem 
                                        key={position} 
                                        value={position}
                                        className={darkMode ? 'hover:bg-zinc-700' : ''}
                                    >
                                        {position}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <Card className={`w-full hover:shadow-lg transition-shadow duration-200 ${darkMode ? 'bg-zinc-800 border-zinc-700' : ''}`}>
                        <CardHeader>
                            <CardTitle className={`text-xl ${darkMode ? 'text-gray-300' : ''}`}>Team Members</CardTitle>
                            <CardDescription className={`text-base ${darkMode ? 'text-gray-400' : ''}`}>
                                View and manage your team members
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className={`rounded-lg border ${darkMode ? 'border-zinc-700' : ''}`}>
                                <table ref={tableRef} className={`display w-full text-sm ${darkMode ? 'text-gray-300' : ''}`}>
                                    <thead className={darkMode ? 'bg-zinc-700' : ''}>
                                        <tr>
                                            <th className={darkMode ? 'border-zinc-600' : ''}>Name</th>
                                            <th className={darkMode ? 'border-zinc-600' : ''}>Position</th>
                                            <th className={darkMode ? 'border-zinc-600' : ''}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {teamMembers.map((member) => (
                                            <tr 
                                                key={member.id} 
                                                className={`border-b ${darkMode ? 'hover:bg-zinc-700 border-zinc-600' : 'hover:bg-muted/50'}`}
                                            >
                                                <td className={`px-6 py-4 ${darkMode ? 'border-zinc-600' : ''}`}>{member.name}</td>
                                                <td className={`px-6 py-4 ${darkMode ? 'border-zinc-600' : ''}`}>{member.position}</td>
                                                <td className={`px-6 py-4 text-right ${darkMode ? 'border-zinc-600' : ''}`}>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleViewMember(member)}
                                                        className={darkMode ? 'hover:bg-zinc-700' : ''}
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
                </div>
            </div>

            {/* Modal for member details */}
            {showModal && selectedMember && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                    <div className={`rounded-lg p-6 w-full max-w-lg shadow-lg ${darkMode ? 'bg-zinc-800 text-gray-300' : 'bg-white'}`}>
                        <h2 className={`text-xl font-bold mb-4 ${darkMode ? 'text-gray-300' : ''}`}>{selectedMember.name}'s Details</h2>
                        <div className="mb-3">
                            <span className="font-semibold">Position:</span> {selectedMember.position}
                        </div>
                        <div className="mb-3">
                            <span className="font-semibold">Projects Involved:</span>
                            <ul className="list-disc ml-6">
                                {mockProjects.filter(p => p.members.includes(selectedMember.id)).map(p => (
                                    <li key={p.id}>{p.name}</li>
                                ))}
                            </ul>
                        </div>
                        <div className="mb-3">
                            <span className="font-semibold">All Tasks Assigned:</span>
                            <ul className="list-disc ml-6">
                                {mockTasks.filter(t => t.assignedTo === selectedMember.id).map(t => (
                                    <li key={t.id}>
                                        {t.title} <span className={`ml-2 text-xs px-2 py-1 rounded-full ${getStatusColor(t.status)}`}>
                                            {t.status}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="mb-3">
                            <span className="font-semibold">Completed Tasks:</span>
                            <ul className="list-disc ml-6">
                                {mockTasks.filter(t => t.assignedTo === selectedMember.id && t.status === 'completed').map(t => (
                                    <li key={t.id}>{t.title}</li>
                                ))}
                            </ul>
                        </div>
                        <div className="mb-3">
                            <span className="font-semibold">Current Active Tasks:</span>
                            <ul className="list-disc ml-6">
                                {mockTasks.filter(t => t.assignedTo === selectedMember.id && t.status !== 'completed').map(t => (
                                    <li key={t.id}>{t.title}</li>
                                ))}
                            </ul>
                        </div>
                        <div className="flex justify-end gap-2 mt-4">
                            <Button 
                                variant={darkMode ? 'secondary' : 'outline'} 
                                onClick={() => setShowModal(false)}
                            >
                                Close
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
};

export default Teams;