import { AnimatePresence, motion } from "framer-motion";
import {
  LayoutDashboard, MilestoneIcon, MessagesSquare, Archive, ListTree,
  SquareDashedKanban, ArrowBigRight, ClipboardCheck, ClipboardList,
  PuzzleIcon, PieChart, PlusCircle, UsersRound, Megaphone,
   ClipboardList as  Album,
  Calendar, FileText,
  
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
  roles?: string[]; // Specific roles that can see this item
};

type SidebarProps = {
  isOpen: boolean;
  onClose: () => void;
  darkMode: boolean;
  userRole: string; // 'member' | 'manager' | 'director' | 'vice-president' | 'president'
};

// Base items (same as MemberSidebar)
const BASE_SIDEBAR_ITEMS = [
  { name: "Home", icon: LayoutDashboard, href: "/dashboard", title: "Project Overview", type: "item" },
  
  {
    name: "My Works", icon: Album, type: "dropdown", children: [
      {
        name: "Projects", icon: SquareDashedKanban, href: "/dashboard/:role/projects", type: "item"
      },
      {
        name: "Milestones", icon: SquareDashedKanban, href: "/dashboard/:role/milestones", type: "item"
      },
      {
    name: "Tasks", icon: ClipboardList, href: "/dashboard/:role/tasks", type: "item"
      },    
    ]
  },

  { name: "Timeline", icon: Calendar, href: "/timeline", type: "item" },
  { name: "Escalations", icon: Megaphone, href: "/dashboard/:role/escalations", type: "item" },
  { name: "Requests", icon: FileText, href: "/dashboard/:role/requests", type: "item" },

  { name: "Todos", icon: PuzzleIcon, href: "/dashboard/:role/task/personal", type: "item" },
  { name: "Chat", icon: MessagesSquare, href: "/dashboard/:role/Chat", type: "item" },
  { name: "Reports", icon: ListTree, href: "/dashboard/:role/Reports", type: "item" },
  { name: "Archived Tasks", icon: Archive, href: "/dashboard/:role/ArchivedTasks", type: "item" },
] as const;

// Role-specific additional items
const ROLE_SPECIFIC_ITEMS = {
  'admin': [
    { name: "Pending Approvals", icon: ClipboardCheck, href: "/dashboard/admin/approvals", type: "item" },
  ],
  'manager': [
    { name: "Pending Approvals", icon: ClipboardCheck, href: "/dashboard/manager/approvals", type: "item" },
    { name: "Teams", icon: UsersRound, href: "/dashboard/manager/teams", type: "item" },
    { name: "Announcements", icon: Megaphone, href: "/dashboard/manager/announcements", type: "item" },
  ],
  'supervisor': [
    { name: "Pending Approvals", icon: ClipboardCheck, href: "/dashboard/supervisor/approvals", type: "item" },
  ],
  'director': [
    { name: "Pending Approvals", icon: ClipboardCheck, href: "/dashboard/director/approvals", type: "item" },
    { name: "Teams", icon: UsersRound, href: "/dashboard/director/teams", type: "item" },
    { name: "Announcements", icon: Megaphone, href: "/dashboard/director/announcements", type: "item" },
  ],
  'vice-president': [
    { name: "Pending Approvals", icon: ClipboardCheck, href: "/dashboard/vice-president/approvals", type: "item" },
    { name: "Teams", icon: UsersRound, href: "/dashboard/vice-president/teams", type: "item" },
    { name: "Announcements", icon: Megaphone, href: "/dashboard/vice-president/announcements", type: "item" },
  ],
  'president': [
    { name: "Pending Approvals", icon: ClipboardCheck, href: "/dashboard/president/approvals", type: "item" },
    { name: "Announcements", icon: Megaphone, href: "/dashboard/president/announcements", type: "item" },
  ]
};

const CREATE_PROJECT_ITEM = {
    name: "Create Project", 
    icon: PlusCircle, 
    href: "/dashboard/:role/projects/new/1", 
    type: "item",
    // ✅ EVERYONE can create projects (backend allows all authenticated users)
    // Members/Director/VP/President → Pending approval
    // Manager/Supervisor/Admin → Auto-approved
    roles: ["admin", "manager", "supervisor", "director", "vice_president", "president", "member"]
  };

const Sidebar = ({ isOpen, onClose, darkMode, userRole }: SidebarProps) => {
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

  // Process items to replace :role with actual role and add role-specific items
  const getRoleSpecificItems = (): SidebarItem[] => {
    // ✅ FIX: Map "member" to "user" for route matching (App.tsx uses /dashboard/user for members)
    const roleForRoute = userRole === 'member' ? 'member' : userRole;
    
    // Process base items
    const processedBaseItems = BASE_SIDEBAR_ITEMS.map(item => {
      const processItem = (item: any): any => {
        if (item.href) {
          return {
            ...item,
            href: item.href.replace(':role', roleForRoute)
          };
        }
        
        if (item.children) {
          return {
            ...item,
            children: item.children.map(processItem)
          };
        }
        
        return item;
      };
      
      return processItem(item);
    });
    
    // Add Create Project item after Home if user has permission
    let finalItems = [...processedBaseItems];
    
    // Check if user role can see Create Project
    if (CREATE_PROJECT_ITEM.roles.includes(userRole)) {
      const homeIndex = processedBaseItems.findIndex(item => item.name === "Home");
      
      if (homeIndex !== -1) {
        // Create the processed Create Project item
        const processedCreateProject = {
          ...CREATE_PROJECT_ITEM,
          href: CREATE_PROJECT_ITEM.href?.replace(':role', roleForRoute)
        };
        
        // Insert Create Project after Home
        finalItems = [
          ...processedBaseItems.slice(0, homeIndex + 1),
          processedCreateProject,
          ...processedBaseItems.slice(homeIndex + 1)
        ];
      }
    }
    
    // Add other role-specific items at the end
    const roleItems = ROLE_SPECIFIC_ITEMS[userRole as keyof typeof ROLE_SPECIFIC_ITEMS] || [];
    
    if (roleItems.length > 0) {
      // Process role items
      const processedRoleItems = roleItems.map(item => {
        const processItem = (item: any): any => {
          if (item.href) {
            return {
              ...item,
              href: item.href.replace(':role', roleForRoute)
            };
          }
          
          if (item.children) {
            return {
              ...item,
              children: item.children.map(processItem)
            };
          }
          
          return item;
        };
        
        return processItem(item);
      });
      
      finalItems = [...finalItems, ...processedRoleItems];
    }
    
    return finalItems;
  };

  const sidebarItems = getRoleSpecificItems();

  const handleDropdownToggle = (path: string, isUnderMyWorks: boolean) => {
    setOpenDropdowns(prev => {
      // If toggling a dropdown under "My Works", close all other dropdowns under "My Works"
      // but keep the main "My Works" dropdown open
      if (isUnderMyWorks && path !== "My Works") {
        const myWorksDropdowns = prev.filter(p => p.startsWith("My Works") && p !== "My Works");
        const otherDropdowns = prev.filter(p => !p.startsWith("My Works"));
        
        if (myWorksDropdowns.includes(path)) {
          // If the dropdown is already open, close it but keep "My Works" open
          return [...otherDropdowns, "My Works"];
        } else {
          // If the dropdown is closed, open it and close all other "My Works" dropdowns
          // but keep the main "My Works" dropdown open
          return [...otherDropdowns, "My Works", path];
        }
      } else if (isUnderMyWorks && path === "My Works") {
        // Toggling the main "My Works" dropdown
        const otherDropdowns = prev.filter(p => !p.startsWith("My Works"));
        
        if (prev.includes("My Works")) {
          // If "My Works" is open, close it and all its children
          return otherDropdowns;
        } else {
          // If "My Works" is closed, open it
          return [...otherDropdowns, "My Works"];
        }
      } else {
        // If toggling a dropdown outside "My Works", close all "My Works" dropdowns
        const nonMyWorksDropdowns = prev.filter(p => !p.startsWith("My Works"));
        
        if (nonMyWorksDropdowns.includes(path)) {
          // If the dropdown is already open, close it
          return nonMyWorksDropdowns.filter(p => p !== path);
        } else {
          // If the dropdown is closed, open it
          return [...nonMyWorksDropdowns, path];
        }
      }
    });
  };

  const handleItemClick = (isUnderMyWorks: boolean) => {
    if (isMobile) onClose();
    
    // If clicking an item outside "My Works", close all "My Works" dropdowns
    if (!isUnderMyWorks) {
      setOpenDropdowns(prev => prev.filter(p => !p.startsWith("My Works")));
    }
  };

  function renderSidebarItem(item: SidebarItem, parentPath = "") {
    const isActive = location.pathname === item.href;
    const Icon = item.icon;
    const currentPath = parentPath ? `${parentPath}/${item.name}` : item.name;
    const isDropdownOpen = openDropdowns.includes(currentPath) && isOpen;
    const isUnderMyWorks = currentPath.startsWith("My Works");

    if (item.type === "dropdown" && item.children && item.children.length > 0) {
      return (
        <div key={item.name} className="relative">
          <button
            type="button"
            onClick={() => handleDropdownToggle(currentPath, isUnderMyWorks)}
            className={`flex items-center w-full p-3 text-md font-medium rounded-lg transition-colors ${isDropdownOpen
              ? darkMode
                ? "bg-gray-700 text-gray-200"
                : "bg-purple-100 text-gray-800"
              : darkMode
                ? "hover:bg-gray-700 text-gray-200"
                : "hover:bg-purple-200 text-gray-800"
              }`}
          >
            {Icon && (
              <Icon
                size={20}
                className={
                  isDropdownOpen
                    ? darkMode
                      ? "text-gray-200"
                      : "text-gray-800"
                    : darkMode
                      ? "text-gray-200"
                      : "text-gray-800"
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
                className="ml-6 mt-1 flex flex-col space-y-1 "
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
                      onClick={() => handleItemClick(isUnderMyWorks)}
                      className={`flex items-center px-2 py-2 rounded-lg text-sm font-medium transition-colors ${location.pathname === child.href
                        ? "bg-purple-900 text-white"
                        : darkMode
                          ? "hover:bg-gray-700 text-gray-200"
                          : "hover:bg-purple-100 text-gray-800"}`}
                    >
                      {ChildIcon && (
                        <ChildIcon
                          size={17}
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
        onClick={() => handleItemClick(isUnderMyWorks)}
        className="block"
      >
        <motion.div
          className={`flex items-center  p-3 text-md font-medium rounded-lg transition-colors  ${isActive
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
                    : "text-gray-800"
              }
            />
          )
          }
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
        className={`fixed md:relative z-50  overflow-auto ${darkMode ? 'bg-zinc-800 bg-opacity-90 border-r border-gray-700'
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

            {sidebarItems.map(item => renderSidebarItem(item as SidebarItem))}
          </nav>
        </div>
      </motion.aside>
    </>
  );
};

export default Sidebar;