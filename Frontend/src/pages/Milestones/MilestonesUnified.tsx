import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Target, UserCircle } from "lucide-react";
import AuthoredMile from "./AuthoredMile";
import DelegatedAssignments from "../Projects/DelegatedAssignments";

interface MilestonesUnifiedProps {
  darkMode: boolean;
  isSidebarOpen?: boolean;
  initialMilestoneId?: string;
}

const MilestonesUnified = ({ darkMode }: MilestonesUnifiedProps) => {
  const [activeView, setActiveView] = useState<"delegated" | "authored">("delegated");

  const headerFor = (view: "delegated" | "authored") => {
    if (view === 'delegated') {
      return {
        title: 'Milestones',
        subtitle: 'milestones assigned to me | 0 Active milestones'
      };
    }
    return {
      title: 'Milestones',
      subtitle: 'milestones authored by me | 0 Active milestones'
    };
  };

  const currentHeader = headerFor(activeView);

  return (
    <div className={`${darkMode ? "bg-zinc-900 text-gray-200" : "bg-white text-gray-800"}`}>
      <div className="p-6 max-w-8xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="ml-2">
            <h1 className="text-3xl font-bold">{currentHeader.title}</h1>
            <p className={`text-sm mt-1 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
              {currentHeader.subtitle}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setActiveView("delegated")}
              className={`${
                activeView === "delegated" 
                  ? (darkMode ? "bg-purple-600 hover:bg-purple-700" : "bg-purple-900 hover:bg-purple-800") 
                  : (darkMode ? "bg-zinc-700 hover:bg-zinc-600" : "bg-gray-400 hover:bg-gray-500 text-gray-800")
              } text-white px-4 py-2`}
            >
              <UserCircle className="w-4 h-4 mr-2" /> Delegated To Me
            </Button>
            <Button
              onClick={() => setActiveView("authored")}
              className={`${
                activeView === "authored" 
                  ? (darkMode ? "bg-purple-600 hover:bg-purple-700" : "bg-purple-900 hover:bg-purple-800") 
                  : (darkMode ? "bg-zinc-700 hover:bg-zinc-600" : "bg-gray-400 hover:bg-gray-500 text-gray-800")
              } text-white px-4 py-2`}
            >
              <Target className="w-4 h-4 mr-2" /> Authored By Me
            </Button>
          </div>
        </div>
        
        <Card className={`${darkMode ? "bg-zinc-800 border-zinc-700" : "bg-white border-gray-200"}`}>
          <CardContent className="p-0">
            {activeView === "delegated" && (
              <DelegatedAssignments darkMode={darkMode} showHeader={false} />
            )}
            {activeView === "authored" && (
              <AuthoredMile darkMode={darkMode} showHeader={false} />
            )}
          </CardContent>
        </Card> 
      </div>
    </div>
  );
};

export default MilestonesUnified;