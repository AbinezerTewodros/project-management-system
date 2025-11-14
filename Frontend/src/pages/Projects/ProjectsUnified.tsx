
import { useState } from "react";
// Replaced Card wrapper with simple div to remove border
import { Button } from "@/components/ui/button";
import { CheckCircle, UserCircle, ClipboardCheck } from "lucide-react";
import PendingApprovals from "./PendingApprovals";
import MyProjects from "./MyProjects";
import AssignedToMe from "./AssignedToMe";


interface ProjectsUnifiedProps {
  darkMode: boolean;
  isSidebarOpen?: boolean;
  initialProjectId?: string;
}

const ProjectsUnified = ({ darkMode }: ProjectsUnifiedProps) => {
    const [activeView, setActiveView] = useState<"delegated" | "authored" | "approvals">("delegated");

    const headerFor = (view: "delegated" | "authored" | "approvals") => {
      switch (view) {
        case 'delegated':
          return {
            title: 'Delegated Projects',
            subtitle: 'projects delegated to me'
          };
        case 'authored':
          return {
            title: 'Authored Projects',
            subtitle: 'projects I created'
          };
        case 'approvals':
        default:
          return {
            title: 'Pending Project Approvals',
            subtitle: 'Review and approve projects created by team members'
          };
      }
    };
    const currentHeader = headerFor(activeView);
  return (
    <div className={`${darkMode ? "bg-zinc-900 text-gray-200" : "bg-white text-gray-800"} `}>
      <div className="p-6">
        <div className="max-w-8xl mx-auto">
          <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-sm p-6 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{currentHeader.title}</h1>
                <p className={`text-sm mt-1 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                  {currentHeader.subtitle}
                </p>
              </div>
              <div className="flex gap-2">
            <Button
              onClick={() => setActiveView("delegated")}
              className={`${activeView === "delegated" ? (darkMode ? "bg-purple-600 hover:bg-purple-700" : "bg-purple-900 hover:bg-purple-800") 
                : (darkMode ? "bg-zinc-700 hover:bg-zinc-600" : "bg-gray-300 hover:bg-gray-400 text-gray-800")} text-white px-4`}
            >
              <UserCircle className="w-4 h-4 mr-2" /> Delegated To Me
            </Button>
            <Button
              onClick={() => setActiveView("authored")}
              className={`${activeView === "authored" ? (darkMode ? "bg-purple-600 hover:bg-purple-700" : "bg-purple-900 hover:bg-purple-800") 
                : (darkMode ? "bg-zinc-700 hover:bg-zinc-600" : "bg-gray-300 hover:bg-gray-400 text-gray-800")} text-white px-4`}
            >
              <CheckCircle className="w-4 h-4 mr-2" /> Authored By Me
            </Button>
            <Button
              onClick={() => setActiveView("approvals")}
              className={`${activeView === "approvals" ? (darkMode ? "bg-purple-600 hover:bg-purple-700" : "bg-purple-900 hover:bg-purple-800") 
                : (darkMode ? "bg-zinc-700 hover:bg-zinc-600" : "bg-gray-300 hover:bg-gray-400 text-gray-800")} text-white px-4`}
            >
              <ClipboardCheck className="w-4 h-4 mr-2" /> Pending Approvals
            </Button>
              </div>
            </div>
          </div>

          <div className={`${darkMode ? "bg-zinc-800" : "bg-white"} rounded-lg shadow-sm`}> 
            <div className="p-4">
              {activeView === "delegated" && (
                <AssignedToMe darkMode={darkMode} showHeader={false} />
              )}
              {activeView === "authored" && (
                <MyProjects darkMode={darkMode} onProjectCreated={() => {}} />
              )}
              {activeView === "approvals" && (
                <PendingApprovals darkMode={darkMode} showHeader={false} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectsUnified;