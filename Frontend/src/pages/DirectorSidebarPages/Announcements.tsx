import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Megaphone, AlertCircle, Bell } from "lucide-react";
import { useState } from "react";

interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  priority: 'normal' | 'important' | 'urgent';
}

interface DirectorAnnouncementsProps {
    darkMode: boolean;
    setDarkMode: (darkMode: boolean) => void;
    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
}

const DirectorAnnouncements = ({ darkMode }: DirectorAnnouncementsProps) => {
    const [announcements, setAnnouncements] = useState<Announcement[]>([
        {
            id: "1",
            title: "Quarterly Strategy Meeting",
            content: "All directors are required to attend the quarterly strategy meeting on Friday at 10 AM in the main conference room.",
            date: "2024-06-15",
            priority: 'important'
        },
        {
            id: "2",
            title: "New Compliance Guidelines",
            content: "Please review the updated compliance guidelines that have been uploaded to the shared drive.",
            date: "2024-06-10",
            priority: 'normal'
        },
        {
            id: "3",
            title: "System Maintenance",
            content: "There will be scheduled system maintenance this weekend. All systems will be unavailable from 10 PM Saturday to 4 AM Sunday.",
            date: "2024-06-08",
            priority: 'urgent'
        }
    ]);

    const [newAnnouncement, setNewAnnouncement] = useState({
        title: '',
        content: '',
        priority: 'normal' as 'normal' | 'important' | 'urgent'
    });
    const [isCreating, setIsCreating] = useState(false);

    const handleCreateAnnouncement = () => {
        if (newAnnouncement.title && newAnnouncement.content) {
            const announcement: Announcement = {
                id: Date.now().toString(),
                title: newAnnouncement.title,
                content: newAnnouncement.content,
                date: new Date().toISOString().split('T')[0],
                priority: newAnnouncement.priority
            };
            setAnnouncements([announcement, ...announcements]);
            setNewAnnouncement({ title: '', content: '', priority: 'normal' });
            setIsCreating(false);
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'urgent':
                return darkMode ? 'bg-red-900/30 text-red-400 border-red-800' : 'bg-red-50 text-red-600 border-red-200';
            case 'important':
                return darkMode ? 'bg-yellow-900/30 text-yellow-400 border-yellow-800' : 'bg-yellow-50 text-yellow-600 border-yellow-200';
            default:
                return darkMode ? 'bg-blue-900/30 text-blue-400 border-blue-800' : 'bg-blue-50 text-blue-600 border-blue-200';
        }
    };

    const getPriorityIcon = (priority: string) => {
        switch (priority) {
            case 'urgent':
                return <AlertCircle className="h-4 w-4" />;
            case 'important':
                return <Megaphone className="h-4 w-4" />;
            default:
                return <Bell className="h-4 w-4" />;
        }
    };

    return (
        <div className={`space-y-6 w-full ${darkMode ? 'dark' : ''}`}>
            <div className="flex justify-between items-center">
                <h2 className={`text-3xl font-bold tracking-tight ${darkMode ? 'text-gray-300' : ''}`}>Director Announcements</h2>
                <Button 
                    onClick={() => setIsCreating(true)}
                    className={`${darkMode ? 'bg-blue-700 hover:bg-blue-800' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
                >
                    <Plus className="mr-2 h-4 w-4" />
                    New Announcement
                </Button>
            </div>

            {/* Create Announcement Modal */}
            {isCreating && (
                <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${darkMode ? 'dark' : ''}`}>
                    <div className={`p-6 rounded-lg shadow-xl w-full max-w-md ${darkMode ? 'bg-zinc-800 border-zinc-700' : 'bg-white border'}`}>
                        <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-gray-300' : ''}`}>Create New Announcement</h3>
                        
                        <div className="space-y-4">
                            <div>
                                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : ''}`}>Title</label>
                                <input
                                    type="text"
                                    value={newAnnouncement.title}
                                    onChange={(e) => setNewAnnouncement({...newAnnouncement, title: e.target.value})}
                                    className={`w-full p-2 rounded border ${darkMode ? 'bg-zinc-700 border-zinc-600 text-gray-300' : 'bg-white border-gray-300'}`}
                                    placeholder="Announcement title"
                                />
                            </div>
                            
                            <div>
                                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : ''}`}>Content</label>
                                <textarea
                                    value={newAnnouncement.content}
                                    onChange={(e) => setNewAnnouncement({...newAnnouncement, content: e.target.value})}
                                    className={`w-full p-2 rounded border ${darkMode ? 'bg-zinc-700 border-zinc-600 text-gray-300' : 'bg-white border-gray-300'}`}
                                    rows={4}
                                    placeholder="Announcement details"
                                />
                            </div>
                            
                            <div>
                                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : ''}`}>Priority</label>
                                <select
                                    value={newAnnouncement.priority}
                                    onChange={(e) => setNewAnnouncement({...newAnnouncement, priority: e.target.value as any})}
                                    className={`w-full p-2 rounded border ${darkMode ? 'bg-zinc-700 border-zinc-600 text-gray-300' : 'bg-white border-gray-300'}`}
                                >
                                    <option value="normal">Normal</option>
                                    <option value="important">Important</option>
                                    <option value="urgent">Urgent</option>
                                </select>
                            </div>
                            
                            <div className="flex justify-end space-x-3">
                                <Button 
                                    variant="outline" 
                                    onClick={() => setIsCreating(false)}
                                    className={darkMode ? 'border-zinc-600 hover:bg-zinc-700' : ''}
                                >
                                    Cancel
                                </Button>
                                <Button 
                                    onClick={handleCreateAnnouncement}
                                    className={`${darkMode ? 'bg-blue-700 hover:bg-blue-800' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
                                >
                                    Create
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Announcements List */}
            <Card className={darkMode ? 'bg-zinc-800 border-zinc-700' : ''}>
                <CardHeader>
                    <CardTitle className={darkMode ? 'text-gray-300' : ''}>Recent Announcements</CardTitle>
                    <CardDescription className={darkMode ? 'text-gray-400' : ''}>
                        Important updates and notifications for directors
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {announcements.length > 0 ? (
                        announcements.map((announcement) => (
                            <div 
                                key={announcement.id} 
                                className={`p-4 rounded-lg border ${getPriorityColor(announcement.priority)} ${darkMode ? 'hover:bg-zinc-700/50' : 'hover:bg-gray-50'}`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start space-x-3">
                                        <div className={`p-2 rounded-full ${getPriorityColor(announcement.priority)}`}>
                                            {getPriorityIcon(announcement.priority)}
                                        </div>
                                        <div>
                                            <h4 className={`font-medium ${darkMode ? 'text-gray-300' : ''}`}>{announcement.title}</h4>
                                            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{announcement.content}</p>
                                        </div>
                                    </div>
                                    <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                        {new Date(announcement.date).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className={`text-center py-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            No announcements yet. Create your first announcement!
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default DirectorAnnouncements;