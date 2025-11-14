import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Mock projects for the manager
const projects = [
  { id: 1, name: "Website Redesign" },
  { id: 2, name: "Mobile App" },
];

const mockAnnouncements = [
  { id: 1, title: "Quarterly Review Meeting", date: "2024-07-08", content: "The quarterly review meeting will be held on July 15th at 10am.", audience: "For All" },
  { id: 2, title: "New Project Launch", date: "2024-07-05", content: "We are excited to announce the launch of the new mobile app redesign project.", audience: "Mobile App" },
  { id: 3, title: "Team Building Event", date: "2024-07-01", content: "Join us for a team building event this Friday at the main hall.", audience: "Website Redesign" },
];

interface AnnouncementsProps {
  darkMode: boolean;
}

const Announcements: React.FC<AnnouncementsProps> = ({ darkMode }) => {
  const [announcements, setAnnouncements] = useState(mockAnnouncements);
  const [showModal, setShowModal] = useState(false);
  const [audience, setAudience] = useState('For All');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const handleAddAnnouncement = () => {
    setAnnouncements([
      {
        id: announcements.length + 1,
        title,
        date: new Date().toISOString().split('T')[0],
        content,
        audience,
      },
      ...announcements,
    ]);
    setShowModal(false);
    setTitle('');
    setContent('');
    setAudience('For All');
  };

  return (
    <Card className={`max-w-6xl mx-auto mt-4 ${darkMode ? "bg-zinc-900 border-zinc-800" : ""}`}>
      <CardHeader>
        <CardTitle className={darkMode ? "text-zinc-100" : ""}>Announcements</CardTitle>
      </CardHeader>
      <CardContent>
        <Button 
          className="mb-4" 
          onClick={() => setShowModal(true)}
          variant={darkMode ? "secondary" : "default"}
        >
          + Add Announcement
        </Button>
        
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className={`rounded-lg p-6 w-full max-w-md shadow-lg ${darkMode ? "bg-zinc-800 border border-zinc-700" : "bg-white"}`}>
              <h2 className={`text-xl font-bold mb-4 ${darkMode ? "text-zinc-100" : ""}`}>Add Announcement</h2>
              <div className="mb-4">
                <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-zinc-300" : ""}`}>Audience</label>
                <select
                  className={`w-full p-2 rounded border ${darkMode ? "bg-zinc-700 border-zinc-600 text-zinc-100" : ""}`}
                  value={audience}
                  onChange={e => setAudience(e.target.value)}
                >
                  <option value="For All">For All</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.name}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-zinc-300" : ""}`}>Title</label>
                <Input 
                  value={title} 
                  onChange={e => setTitle(e.target.value)} 
                  placeholder="Announcement title"
                  className={darkMode ? "bg-zinc-700 border-zinc-600 text-zinc-100" : ""}
                />
              </div>
              <div className="mb-4">
                <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-zinc-300" : ""}`}>Content</label>
                <textarea
                  className={`w-full p-2 rounded border min-h-[80px] ${darkMode ? "bg-zinc-700 border-zinc-600 text-zinc-100" : ""}`}
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="Write your announcement..."
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowModal(false)}
                  className={darkMode ? "border-zinc-600 text-zinc-100 hover:bg-zinc-700" : ""}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleAddAnnouncement} 
                  disabled={!title.trim() || !content.trim()}
                  className={darkMode ? "bg-fuchsia-600 hover:bg-fuchsia-700" : ""}
                >
                  Add
                </Button>
              </div>
            </div>
          </div>
        )}
        
        <ul className="space-y-4">
          {announcements.map((a) => (
            <li 
              key={a.id} 
              className={`border rounded p-4 ${darkMode ? "bg-zinc-800 border-zinc-700" : "bg-gray-50"}`}
            >
              <div className="flex justify-between items-center mb-2">
                <span className={`font-bold ${darkMode ? "text-fuchsia-400" : "text-fuchsia-800"}`}>
                  {a.title}
                </span>
                <span className={`text-xs ${darkMode ? "text-zinc-400" : "text-gray-500"}`}>
                  {a.date}
                </span>
              </div>
              <div className={`mb-2 text-sm ${darkMode ? "text-zinc-300" : "text-gray-600"}`}>
                Audience: <span className="font-semibold">{a.audience}</span>
              </div>
              <div className={darkMode ? "text-zinc-200" : ""}>
                {a.content}
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};

export default Announcements;