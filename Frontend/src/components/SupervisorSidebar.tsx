import { AnimatePresence, motion } from "framer-motion";
import {
  LayoutDashboard, MilestoneIcon, MessagesSquare, Archive, ListTree,
  SquareDashedKanban, ArrowBigRight, ClipboardCheck, ClipboardList,
  PuzzleIcon, PieChart, Home, PlusCircle, UsersRound, Megaphone,
  Settings, ClipboardList as ReportsIcon, MessageCircle, Album,
  ChevronDown, Users, FileText, Bell
} from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, Link } from "react-router-dom";

type SidebarItem = {
  name: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  href?: string;
  title?: string;
  type: 'item' | 'dropdown';
  children?: SidebarItem[] | ReadonlyArray<SidebarItem>;
};

type SupervisorSidebarProps = {
  isOpen: boolean;
  onClose: () => void;
  darkMode: boolean;
};

// Supervisor-specific sidebar items
const SUPERVISOR_SIDEBAR_ITEMS: SidebarItem[] = [
  { name: "Home", icon: Home, href: "/dashboard/supervisor", title: "Supervisor Dashboard", type: "item" },
  { name: "Projects", icon: SquareDashedKanban, href: "/dashboard/supervisor/projects", type: "item" },
  { name: "Tasks", icon: ClipboardList, href: "/dashboard/supervisor/tasks", type: "item" },
  { name: "Team", icon: UsersRound, href: "/dashboard/supervisor/team", type: "item" },
  { name: "Reports", icon: ReportsIcon, href: "/dashboard/supervisor/report", type: "item" },
];

const SupervisorSidebar = ({ isOpen, onClose, darkMode }: SupervisorSidebarProps) => {
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  function renderSidebarItem(item: SidebarItem) {
    const isActive = location.pathname === item.href;
    const Icon = item.icon;

    return (
      <Link
        key={item.href}
        to={item.href || "#"}
        onClick={() => isMobile && onClose()}
        className="block"
      >
        <motion.div
          className={`flex items-center p-3 text-md font-medium rounded-lg transition-colors ${isActive
            ? "bg-purple-900 text-gray-200"
            : darkMode
              ? "hover:bg-gray-700 text-gray-300"
              : "hover:bg-purple-200 text-gray-700"
            }`}
        >
          {Icon && (
            <Icon
              size={20}
              className={
                isActive
                  ? "text-white"
                  : darkMode
                    ? "text-gray-200"
                    : "text-gray-700"
              }
            />
          )}
          <AnimatePresence>
            {isOpen && (
              <motion.span
                className="ml-4 whitespace-nowrap origin-left"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
              >
                {item.name}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.div>
      </Link>
    );
  }

  return (
    <>
      <AnimatePresence>
        {isMobile && isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`fixed inset-0 z-40 md:hidden ${darkMode ? 'bg-zinc-800 bg-opacity-70' : 'bg-gray-300 bg-opacity-50'}`}
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      <motion.aside
        className={`fixed md:relative z-50 overflow-auto ${darkMode ? 'bg-zinc-800 bg-opacity-90 border-r border-gray-700'
          : 'bg-white bg-opacity-50 border-r border-gray-100'} ${isMobile ? (isOpen ? "w-64" : "w-0") : ""}`}
        style={{ width: isOpen ? "240px" : "80px" }}
        animate={{
          width: isMobile ? (isOpen ? 240 : 0) : isOpen ? 220 : 80,
        }}
        transition={{ duration: 0.2 }}>

        <div className={`h-full p-4 flex flex-col bg-opacity-50 backdrop-blur-md ${darkMode ? '' : 'border-gray-100'}`}>
          <nav className="flex-col space-y-2">
            <div className={`flex flex-col ${darkMode ? "border-gray-700" : "border-gray-300"} ${!isOpen && "opacity-0 scale-95"}`}>
              <h2 className={`text-lg font-semibold ml-3 mt-5 mb-1 ${darkMode ? "text-gray-200" : "text-gray-800"} transition-all duration-200 ${!isOpen && "hidden"}`}>
                Supervisor Dashboard
              </h2>
              <p className={`text-xs ml-3 mb-4 ${darkMode ? "text-gray-400" : "text-gray-500"} transition-all duration-200 ${!isOpen && "hidden"}`}>
                Project Management & Team Oversight
              </p>
            </div>

            {SUPERVISOR_SIDEBAR_ITEMS.map(item => renderSidebarItem(item))}
          </nav>
        </div>
      </motion.aside>
    </>
  );
};

export default SupervisorSidebar;
