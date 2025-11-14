

import { useState } from "react";
// parent container intentionally uses plain divs so child tables render without an outer card/border
import { Button } from "@/components/ui/button";
import { CheckCircle, UserCircle, ClipboardCheck } from "lucide-react";
import TaskBoard from "@/pages/Tasks/TasksAssignedToMe";
import MyTasks from "@/pages/Tasks/MyTasks";
import TeamLeaderApprovals from "@/pages/Tasks/TeamLeaderApprovals";

type TasksUnifiedProps = {
  darkMode: boolean;
  isSidebarOpen?: boolean;
  initialProjectId?: string;
};

const TasksUnified = ({ darkMode, isSidebarOpen = false, initialProjectId }: TasksUnifiedProps) => {
  const [activeView, setActiveView] = useState<"delegated" | "authored" | "approvals">("delegated");

  const headerFor = (view: "delegated" | "authored" | "approvals") => {
    switch (view) {
      case 'delegated':
        return { title: 'Tasks', subtitle: 'tasks assigned to me | 0 Active tasks' };
      case 'authored':
        return { title: 'Tasks', subtitle: 'tasks authored by me | 0 Active tasks' };
      case 'approvals':
        return { title: 'Tasks', subtitle: 'action item reviews | 0 Pending' };
    }
  };

  const currentHeader = headerFor(activeView);

  return (
    <div className={`${darkMode ? "bg-zinc-800 text-gray-200" : "bg-white text-gray-800"}`}>
      <div className="p-6 max-w-8xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="ml-2">
            <h1 className="text-2xl font-bold">{currentHeader.title}</h1>
            <p className={`text-sm mt-1 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
              {currentHeader.subtitle}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setActiveView("delegated")}
              className={`${activeView === "delegated" ? (darkMode ? "bg-purple-600 hover:bg-purple-700" : "bg-purple-900 hover:bg-purple-800") 
                : (darkMode ? "bg-zinc-700 hover:bg-zinc-600" : "bg-gray-400 hover:bg-gray-500 text-gray-800")} text-white px-4`}
            >
              <UserCircle className="w-4 h-4 mr-2" /> Delegated To Me
            </Button>
            <Button
              onClick={() => setActiveView("authored")}
              className={`${activeView === "authored" ? (darkMode ? "bg-purple-600 hover:bg-purple-700" : "bg-purple-900 hover:bg-purple-800") 
                : (darkMode ? "bg-zinc-700 hover:bg-zinc-600" : "bg-gray-400 hover:bg-gray-500 text-gray-800")} text-white px-4`}
            >
              <CheckCircle className="w-4 h-4 mr-2" /> Authored By Me
            </Button>
            <Button
              onClick={() => setActiveView("approvals")}
              className={`${activeView === "approvals" ? (darkMode ? "bg-purple-600 hover:bg-purple-700" : "bg-purple-900 hover:bg-purple-800") 
                : (darkMode ? "bg-zinc-700 hover:bg-zinc-600" : "bg-gray-400 hover:bg-gray-500 text-gray-800")} text-white px-4`}
            >
              <ClipboardCheck className="w-4 h-4 mr-2" /> Action Item Reviews
            </Button>
          </div>
        </div>

        <div className={`${darkMode ? "bg-transparent" : "bg-transparent"}`}>
          <div className="p-2">
            {activeView === "delegated" && (
              <TaskBoard darkMode={darkMode} isSidebarOpen={isSidebarOpen} showHeader={false} />
            )}
            {activeView === "authored" && (
              <MyTasks darkMode={darkMode} initialProjectId={initialProjectId} showHeader={false} />
            )}
            {activeView === "approvals" && (
              <TeamLeaderApprovals darkMode={darkMode} showHeader={false} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TasksUnified;


