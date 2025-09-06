import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Bell, Calendar, Clock, User, Trash2, Edit2 } from "lucide-react";
import { toast } from "react-hot-toast";

interface PresidentAnnouncementsProps {
    darkMode: boolean;
    setDarkMode: (darkMode: boolean) => void;
    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
}

interface Announcement {
    id: string;
    title: string;
    content: string;
    priority: 'high' | 'medium' | 'low';
    department: string;
    createdAt: string;
    createdBy: string;
}

const PresidentAnnouncements = ({ darkMode }: PresidentAnnouncementsProps) => {
    const [announcements, setAnnouncements] = useState<Announcement[]>([
        {
            id: '1',
            title: 'System Maintenance Notice',
            content: 'Scheduled maintenance will be performed on the production servers this weekend. Please save your work and expect some downtime.',
            priority: 'high',
            department: 'IT',
            createdAt: '2024-03-15T10:00:00',
            createdBy: 'John Doe'
        },
        {
            id: '2',
            title: 'New Project Launch',
            content: 'We are excited to announce the launch of our new customer portal project. All teams are requested to review the project documentation.',
            priority: 'medium',
            department: 'All',
            createdAt: '2024-03-14T15:30:00',
            createdBy: 'Jane Smith'
        },
        {
            id: '3',
            title: 'Team Building Event',
            content: 'Join us for our quarterly team building event next Friday. More details will be shared in the coming days.',
            priority: 'low',
            department: 'HR',
            createdAt: '2024-03-13T09:15:00',
            createdBy: 'Mike Johnson'
        }
    ]);

    const [newAnnouncement, setNewAnnouncement] = useState<Partial<Announcement>>({
        title: '',
        content: '',
        priority: 'medium',
        department: 'All'
    });

    const [isCreating, setIsCreating] = useState(false);

    const handleCreateAnnouncement = () => {
        if (!newAnnouncement.title || !newAnnouncement.content) {
            toast.error('Please fill in all required fields');
            return;
        }

        const announcement: Announcement = {
            id: Date.now().toString(),
            title: newAnnouncement.title!,
            content: newAnnouncement.content!,
            priority: newAnnouncement.priority!,
            department: newAnnouncement.department!,
            createdAt: new Date().toISOString(),
            createdBy: 'Current User'
        };

        setAnnouncements([announcement, ...announcements]);
        setNewAnnouncement({
            title: '',
            content: '',
            priority: 'medium',
            department: 'All'
        });
        setIsCreating(false);
        toast.success('Announcement created successfully!');
    };

    const handleDeleteAnnouncement = (id: string) => {
        setAnnouncements(announcements.filter(a => a.id !== id));
        toast.success('Announcement deleted successfully!');
    };

    const getPriorityColor = (priority: string, darkMode: boolean) => {
        switch (priority) {
            case 'high':
                return darkMode ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-800';
            case 'medium':
                return darkMode ? 'bg-yellow-900/30 text-yellow-400' : 'bg-yellow-100 text-yellow-800';
            case 'low':
                return darkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-800';
            default:
                return darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className={`space-y-6 w-full mt-12 ${darkMode ? "bg-zinc-900 min-h-screen p-6" : ""}`}>
            <div className="flex justify-between items-center">
                <h2 className={`text-3xl font-bold tracking-tight ${darkMode ? "text-zinc-100" : ""}`}>
                    Announcements
                </h2>
                <Dialog open={isCreating} onOpenChange={setIsCreating}>
                    <DialogTrigger asChild>
                        <Button className={`${darkMode ? "bg-fuchsia-700 hover:bg-fuchsia-600" : "bg-fuchsia-800 hover:bg-stone-800"} text-white`}>
                            <Plus className="mr-2 h-4 w-4" />
                            Create Announcement
                        </Button>
                    </DialogTrigger>
                    <DialogContent className={`sm:max-w-[500px] ${darkMode ? "bg-zinc-800 border-zinc-700" : ""}`}>
                        <DialogHeader>
                            <DialogTitle className={darkMode ? "text-zinc-100" : ""}>
                                Create New Announcement
                            </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <label className={`text-sm font-medium ${darkMode ? "text-zinc-300" : ""}`}>
                                    Title
                                </label>
                                <Input
                                    value={newAnnouncement.title}
                                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                                    placeholder="Enter announcement title"
                                    className={darkMode ? "bg-zinc-700 border-zinc-600 text-zinc-100 placeholder-zinc-400" : ""}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className={`text-sm font-medium ${darkMode ? "text-zinc-300" : ""}`}>
                                    Content
                                </label>
                                <Textarea
                                    value={newAnnouncement.content}
                                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
                                    placeholder="Enter announcement content"
                                    rows={4}
                                    className={darkMode ? "bg-zinc-700 border-zinc-600 text-zinc-100 placeholder-zinc-400" : ""}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className={`text-sm font-medium ${darkMode ? "text-zinc-300" : ""}`}>
                                        Priority
                                    </label>
                                    <Select
                                        value={newAnnouncement.priority}
                                        onValueChange={(value: 'high' | 'medium' | 'low') =>
                                            setNewAnnouncement({ ...newAnnouncement, priority: value })
                                        }
                                    >
                                        <SelectTrigger className={darkMode ? "bg-zinc-700 border-zinc-600 text-zinc-100" : ""}>
                                            <SelectValue placeholder="Select priority" />
                                        </SelectTrigger>
                                        <SelectContent className={darkMode ? "bg-zinc-800 border-zinc-700" : ""}>
                                            <SelectItem value="high" className={darkMode ? "hover:bg-zinc-700" : ""}>High</SelectItem>
                                            <SelectItem value="medium" className={darkMode ? "hover:bg-zinc-700" : ""}>Medium</SelectItem>
                                            <SelectItem value="low" className={darkMode ? "hover:bg-zinc-700" : ""}>Low</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <label className={`text-sm font-medium ${darkMode ? "text-zinc-300" : ""}`}>
                                        Department
                                    </label>
                                    <Select
                                        value={newAnnouncement.department}
                                        onValueChange={(value) =>
                                            setNewAnnouncement({ ...newAnnouncement, department: value })
                                        }
                                    >
                                        <SelectTrigger className={darkMode ? "bg-zinc-700 border-zinc-600 text-zinc-100" : ""}>
                                            <SelectValue placeholder="Select department" />
                                        </SelectTrigger>
                                        <SelectContent className={darkMode ? "bg-zinc-800 border-zinc-700" : ""}>
                                            <SelectItem value="All" className={darkMode ? "hover:bg-zinc-700" : ""}>All Departments</SelectItem>
                                            <SelectItem value="IT" className={darkMode ? "hover:bg-zinc-700" : ""}>IT</SelectItem>
                                            <SelectItem value="HR" className={darkMode ? "hover:bg-zinc-700" : ""}>HR</SelectItem>
                                            <SelectItem value="Finance" className={darkMode ? "hover:bg-zinc-700" : ""}>Finance</SelectItem>
                                            <SelectItem value="Operations" className={darkMode ? "hover:bg-zinc-700" : ""}>Operations</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="flex justify-end space-x-2">
                                <Button 
                                    variant="outline" 
                                    onClick={() => setIsCreating(false)}
                                    className={darkMode ? "border-zinc-600 text-zinc-100 hover:bg-zinc-700" : ""}
                                >
                                    Cancel
                                </Button>
                                <Button 
                                    onClick={handleCreateAnnouncement} 
                                    className={`${darkMode ? "bg-fuchsia-700 hover:bg-fuchsia-600" : "bg-fuchsia-800 hover:bg-stone-800"} text-white`}
                                >
                                    Create
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Announcements List */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {announcements.map((announcement) => (
                    <Card 
                        key={announcement.id} 
                        className={`${darkMode ? "bg-zinc-800 border-zinc-700 text-zinc-100" : "bg-white text-gray-800"} hover:shadow-lg transition-shadow`}
                    >
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-lg flex items-center">
                                <Bell className={`mr-2 h-5 w-5 ${darkMode ? "text-purple-400" : "text-purple-600"}`} />
                                {announcement.title}
                            </CardTitle>
                            <Badge className={`${getPriorityColor(announcement.priority, darkMode)} px-2 py-1 rounded-full text-xs`}>
                                {announcement.priority}
                            </Badge>
                        </CardHeader>
                        <CardContent>
                            <p className={`text-sm mb-4 ${darkMode ? "text-zinc-300" : "text-gray-700"}`}>
                                {announcement.content}
                            </p>
                            <div className={`flex items-center justify-between text-xs ${darkMode ? "text-zinc-400" : "text-gray-500"}`}>
                                <div className="flex items-center">
                                    <Calendar className={`mr-1 h-3 w-3 ${darkMode ? "text-zinc-400" : ""}`} />
                                    <span>{new Date(announcement.createdAt).toLocaleDateString()}</span>
                                    <Clock className={`ml-3 mr-1 h-3 w-3 ${darkMode ? "text-zinc-400" : ""}`} />
                                    <span>{new Date(announcement.createdAt).toLocaleTimeString()}</span>
                                </div>
                                <div className="flex items-center">
                                    <User className={`mr-1 h-3 w-3 ${darkMode ? "text-zinc-400" : ""}`} />
                                    <span>{announcement.createdBy}</span>
                                </div>
                            </div>
                            <div className="flex justify-end space-x-2 mt-4">
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className={darkMode ? "border-zinc-600 text-zinc-100 hover:bg-zinc-700" : ""}
                                >
                                    <Edit2 className="h-4 w-4 mr-2" /> Edit
                                </Button>
                                <Button 
                                    variant="destructive" 
                                    size="sm" 
                                    onClick={() => handleDeleteAnnouncement(announcement.id)}
                                    className={darkMode ? "bg-red-900/30 hover:bg-red-800/30 text-red-400" : ""}
                                >
                                    <Trash2 className="h-4 w-4 mr-2" /> Delete
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default PresidentAnnouncements;