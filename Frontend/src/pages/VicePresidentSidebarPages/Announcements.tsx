import { useState } from "react";
import { Card, CardContent, } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Bell, Calendar, Clock, User, Trash2, Edit2 } from "lucide-react";
import { toast } from "react-hot-toast";

interface VicePresidentAnnouncementsProps {
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

const VicePresidentAnnouncements = ({ darkMode, setDarkMode, sidebarOpen, setSidebarOpen }: VicePresidentAnnouncementsProps) => {
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
            createdBy: 'Current User' // Replace with actual user name
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

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high':
                return 'bg-red-100 text-red-800';
            case 'medium':
                return 'bg-yellow-100 text-yellow-800';
            case 'low':
                return 'bg-green-100 text-green-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="space-y-6 w-full">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold tracking-tight">Announcements</h2>
                <Dialog open={isCreating} onOpenChange={setIsCreating}>
                    <DialogTrigger asChild>
                        <Button className="bg-fuchsia-800 hover:bg-stone-800 text-white">
                            <Plus className="mr-2 h-4 w-4" />
                            Create Announcement
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>Create New Announcement</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Title</label>
                                <Input
                                    value={newAnnouncement.title}
                                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                                    placeholder="Enter announcement title"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Content</label>
                                <Textarea
                                    value={newAnnouncement.content}
                                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
                                    placeholder="Enter announcement content"
                                    rows={4}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Priority</label>
                                    <Select
                                        value={newAnnouncement.priority}
                                        onValueChange={(value: 'high' | 'medium' | 'low') =>
                                            setNewAnnouncement({ ...newAnnouncement, priority: value })
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select priority" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="high">High</SelectItem>
                                            <SelectItem value="medium">Medium</SelectItem>
                                            <SelectItem value="low">Low</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Department</label>
                                    <Select
                                        value={newAnnouncement.department}
                                        onValueChange={(value) =>
                                            setNewAnnouncement({ ...newAnnouncement, department: value })
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select department" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="All">All Departments</SelectItem>
                                            <SelectItem value="IT">IT</SelectItem>
                                            <SelectItem value="HR">HR</SelectItem>
                                            <SelectItem value="Finance">Finance</SelectItem>
                                            <SelectItem value="Operations">Operations</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="flex justify-end space-x-2">
                                <Button variant="outline" onClick={() => setIsCreating(false)}>
                                    Cancel
                                </Button>
                                <Button onClick={handleCreateAnnouncement} className="bg-fuchsia-800 hover:bg-stone-800 text-white">
                                    Create
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="space-y-4">
                {announcements.map((announcement) => (
                    <Card key={announcement.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start">
                                <div className="space-y-2">
                                    <div className="flex items-center space-x-2">
                                        <h3 className="text-xl font-semibold">{announcement.title}</h3>
                                        <Badge className={getPriorityColor(announcement.priority)}>
                                            {announcement.priority}
                                        </Badge>
                                    </div>
                                    <p className="text-gray-600">{announcement.content}</p>
                                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                                        <div className="flex items-center">
                                            <User className="h-4 w-4 mr-1" />
                                            {announcement.createdBy}
                                        </div>
                                        <div className="flex items-center">
                                            <Calendar className="h-4 w-4 mr-1" />
                                            {new Date(announcement.createdAt).toLocaleDateString()}
                                        </div>
                                        <div className="flex items-center">
                                            <Clock className="h-4 w-4 mr-1" />
                                            {new Date(announcement.createdAt).toLocaleTimeString()}
                                        </div>
                                        <div className="flex items-center">
                                            <Bell className="h-4 w-4 mr-1" />
                                            {announcement.department}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex space-x-2">
                                    <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700">
                                        <Edit2 className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-red-500 hover:text-red-700"
                                        onClick={() => handleDeleteAnnouncement(announcement.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default VicePresidentAnnouncements;
