import { AnimatePresence, motion } from "framer-motion";
import { LayoutDashboard, MilestoneIcon, MessagesSquare, Archive, ListTree, SquareDashedKanban, ArrowBigRight, CircleDot, } from "lucide-react"; // KanbanSquare, PenSquare, Dot
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

type MemberSidebarProps = {
  isOpen: boolean;
  onClose: () => void;
  darkMode: boolean;
};

const MEMBER_SIDEBAR_ITEMS = [
  { name: "Home", icon: LayoutDashboard, href: "/dashboard/member", title: "Project Overview", type: "item" },
  { name: "Milestone Chart", icon: MilestoneIcon, href: "/dashboard/member/MilestoneChart", type: "item" },
  {
    name: "Projects", icon: SquareDashedKanban, type: "dropdown", children: [
      {
        name: "Project", icon: ArrowBigRight, type: "dropdown", children: [
          { name: "My Projects", icon: CircleDot, href: "/dashboard/member/projects/mine" },
          { name: "Assigned to me", icon: CircleDot, href: "/dashboard/member/projects/assigned-to-me" },
        ]
      },
      {
        name: "Tasks", icon: ArrowBigRight, type: "dropdown", children: [
          { name: "My Tasks", icon: CircleDot, href: "/dashboard/member/tasks/mine" },
          { name: "Assigned to me", icon: CircleDot, href: "/dashboard/member/tasks/assigned-to-me" },
        ]
      },
    ]
  },

  { name: "Chat", icon: MessagesSquare, href: "/dashboard/member/Chat", type: "item" },
  { name: "Reports", icon: ListTree, href: "/dashboard/member/Reports", type: "item" },
  { name: "Archived Tasks", icon: Archive, href: "/dashboard/member/ArchivedTasks", type: "item" },
] as const;

const MemberSidebar = ({ isOpen, onClose, darkMode }: MemberSidebarProps) => {
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(false);
  const [openDropdowns, setOpenDropdowns] = useState<string[]>([]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  function renderSidebarItem(item: SidebarItem, parentPath = "") {
    const isActive = location.pathname === item.href;
    const Icon = item.icon;
    const currentPath = parentPath ? `${parentPath}/${item.name}` : item.name;
    const isDropdownOpen = openDropdowns.includes(currentPath) && isOpen;

    if (item.type === "dropdown" && item.children) {
      return (
        <div key={item.name} className="relative">
          <button
            type="button"
            onClick={() => {
              setOpenDropdowns((prev) =>
                isDropdownOpen
                  ? prev.filter((p) => p !== currentPath)
                  : [...prev, currentPath]
              );
            }}
            className={`flex items-center w-full p-3 text-sm font-medium rounded-lg transition-colors ${isDropdownOpen
              ? darkMode
                ? "text-gray-300"
                : " text-gray-700"
              : darkMode
                ? "hover:bg-gray-700 text-gray-300"
                : "hover:bg-purple-200 text-gray-700"
              }`}
          >
            {Icon && (
              <Icon
                size={20}
                className={
                  isDropdownOpen
                    ? darkMode
                      ? "text-gray-300"
                      : "text-gray-700"
                    : darkMode
                      ? "text-gray-200"
                      : "text-gray-700"
                }
              />
            )}
            <AnimatePresence>
              {isOpen && (
                <motion.span
                  className="ml-4 whitespace-nowrap origin-left flex-1 text-left"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.15 }}
                >
                  {item.name}
                </motion.span>
              )}
            </AnimatePresence>
            {isOpen && (
              <span className="ml-auto">
                <svg
                  className={`w-4 h-4 transition-transform duration-200 ${isDropdownOpen ? "rotate-90" : ""
                    }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </span>
            )}
          </button>
          <AnimatePresence>
            {isDropdownOpen && isOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="ml-8 mt-1 flex flex-col space-y-1"
              >
                {item.children.map((child: SidebarItem) => {
                  const ChildIcon = child.icon;
                  if (child.type === "dropdown" && child.children) {
                    return renderSidebarItem(child, currentPath);
                  }
                  return (
                    <Link
                      key={child.href}
                      to={child.href || "#"}
                      onClick={() => isMobile && onClose()}
                      className={`flex items-center px-2 py-2 rounded-lg text-sm transition-colors ${location.pathname === child.href
                        ? "bg-purple-900 text-white"
                        : darkMode
                          ? "hover:bg-gray-700 text-gray-300"
                          : "hover:bg-purple-100 text-gray-700"}`}
                    >
                      {ChildIcon && (
                        <ChildIcon
                          size={16}
                          className={`mr-2 ${location.pathname === child.href ? "text-white" : darkMode ? "text-gray-300" : "text-gray-700"}`}
                        />
                      )}
                      {child.name}
                    </Link>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );
    }


    return (
      <Link
        key={item.href}
        to={item.href || "#"}
        onClick={() => isMobile && onClose()}
        className="block"
      >
        <motion.div
          className={`flex items-center  p-3 text-sm font-medium rounded-lg transition-colors  ${isActive
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
        className={`fixed md:relative z-50 h-screen overflow-hidden ${darkMode ? 'bg-zinc-800 bg-opacity-90 border-r border-gray-700'
          : 'bg-white bg-opacity-50 border-r border-gray-100'} ${isMobile ? (isOpen ? "w-64" : "w-0") : ""}`}
        style={{ width: isOpen ? "240px" : "80px" }}
        animate={{
          width: isMobile ? (isOpen ? 240 : 0) : isOpen ? 220 : 80,
        }}
        transition={{ duration: 0.2 }}>

        <div className={`h-full p-4 flex flex-col bg-opacity-50 backdrop-blur-md ${darkMode ? '' : 'border-gray-100'}`}>
          <nav className="flex-col space-y-2">
            <div className={`flex flex-col  ${darkMode ? "border-gray-700" : "border-gray-300"} ${!isOpen && "opacity-0 scale-95"}`}>
              <h2 className={`text-lg font-semibold ml-3 mt-5 mb-1 ${darkMode ? "text-gray-200" : "text-gray-800"} transition-all duration-200 ${!isOpen && "hidden"}`}>
                My Agile Project
              </h2>
              <p className={`text-xs ml-3 mb-4 ${darkMode ? "text-gray-400" : "text-gray-500"} transition-all duration-200 ${!isOpen && "hidden"}`}>
                Software Development and Customization Unit
              </p>
            </div>

            {MEMBER_SIDEBAR_ITEMS.map(item => renderSidebarItem(item as SidebarItem))}
          </nav>
        </div>
      </motion.aside>
    </>
  );
};

export default MemberSidebar;
