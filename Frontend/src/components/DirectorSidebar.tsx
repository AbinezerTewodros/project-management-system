import { AnimatePresence, motion } from "framer-motion";
import { ClipboardList, Home, SquareDashedKanban, UsersRound, PlusCircle, MessageCircle, Megaphone, ChevronDown, Settings, Archive } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, Link } from "react-router-dom";

interface DirectorSidebarProps {
    isOpen: boolean;
    onClose?: () => void;
    darkMode: boolean;
}

const DirectorSidebar = ({ isOpen, onClose, darkMode }: DirectorSidebarProps) => {
    const location = useLocation();
    const [isMobile, setIsMobile] = useState(false);
    const [isProjectsOpen, setIsProjectsOpen] = useState(false);
    const [isMyProjectsOpen, setIsMyProjectsOpen] = useState(false);

    const SIDEBAR_ITEMS = [
        { name: "Home", icon: Home, href: "/dashboard/director" },
        { name: "Create Project", icon: PlusCircle, href: "/dashboard/director/create-project" },
        {
            name: "Projects", icon: SquareDashedKanban, subItems: [
                { name: "My Assignment", href: "/dashboard/director/tasks" },
                {
                    name: "My Projects", subItems: [
                        { name: "My Projects", href: "/dashboard/director/projects" },
                        { name: "Assigned to Me", href: "/dashboard/director/projects/assigned" }
                    ]
                }
            ]
        },
        { name: "Teams", icon: UsersRound, href: "/dashboard/director/teams" },
        { name: "Reports", icon: ClipboardList, href: "/dashboard/director/reports" },
        { name: "Chat", icon: MessageCircle, href: "/dashboard/director/chat" },
        { name: "Announcements", icon: Megaphone, href: "/dashboard/director/announcements" },
        { name: "Settings", icon: Settings, href: "/dashboard/director/settings" },
        { name: "Archived Tasks", icon: Archive, href: "/dashboard/director/archived-tasks" },
    ];

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        // Automatically open the Projects dropdown if the current path is a sub-item
        const activeSubItem = SIDEBAR_ITEMS.find(item => item.subItems?.some(sub => {
            if (sub.subItems) {
                return sub.subItems.some(nested => nested.href === location.pathname);
            }
            return sub.href === location.pathname;
        }));
        if (activeSubItem) {
            setIsProjectsOpen(true);
        }
        // Open My Projects dropdown if a nested sub-item is active
        const projectsItem = SIDEBAR_ITEMS.find(item => item.name === "Projects");
        if (projectsItem && projectsItem.subItems) {
            const myProjects = projectsItem.subItems.find(sub => sub.name === "My Projects");
            if (myProjects && myProjects.subItems && myProjects.subItems.some(nested => nested.href === location.pathname)) {
                setIsMyProjectsOpen(true);
            }
        }
    }, [location.pathname]);

    return (
        <>
            <AnimatePresence>
                {isMobile && isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black bg-opacity-50 z-40"
                        onClick={onClose}
                    />
                )}
            </AnimatePresence>
            <motion.aside
                className={`fixed md:relative z-50 h-screen overflow-hidden ${darkMode
                    ? 'bg-zinc-800 bg-opacity-90 border-r border-gray-700'
                    : 'bg-white bg-opacity-50 border-r border-gray-100'
                    } ${isMobile ? (isOpen ? "w-64" : "w-0") : ""}`}
                animate={{ width: isMobile ? (isOpen ? 200 : 0) : isOpen ? 200 : 75 }}
                transition={{ duration: 0.2 }}
            >
                <div className={`h-full mt-5 p-4 flex flex-col bg-opacity-50 backdrop-blur-md ${darkMode ? '' : 'border-gray-100'}`}>
                    <nav className="mt-7 flex-col space-y-2">
                        <div className={`w-full flex items-center fixed top-0 left-1 border-b-8 ${darkMode ? "border-gray-700" : "border-gray-300"}`}>
                            <h2 className={isOpen ? `ml-4 mb-2 text-lg font-bold whitespace-nowrap origin-left ${darkMode ? "text-gray-300" : "text-gray-700"}` : "hidden"}>Workspace</h2>
                        </div>
                        {SIDEBAR_ITEMS.map((item) => {
                            if (item.subItems) {
                                return (
                                    <div key={item.name}>
                                        <motion.div
                                            onClick={() => setIsProjectsOpen(!isProjectsOpen)}
                                            className={`flex items-center justify-between mt-4 p-3 text-sm font-medium rounded-lg cursor-pointer transition-colors mb-2 ${darkMode ? 'hover:bg-zinc-700 text-gray-300' : 'hover:bg-purple-200 text-gray-700'}`}
                                        >
                                            <div className="flex items-center">
                                                <item.icon size={20} className={darkMode ? "text-gray-300" : "text-gray-700"} />
                                                {isOpen && <span className="ml-4 whitespace-nowrap origin-left">{item.name}</span>}
                                            </div>
                                            {isOpen && <ChevronDown size={16} className={`transition-transform ${isProjectsOpen ? 'rotate-180' : ''}`} />}
                                        </motion.div>
                                        <AnimatePresence>
                                            {isOpen && isProjectsOpen && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="ml-8 overflow-hidden"
                                                >
                                                    {item.subItems.map(subItem => {
                                                        if (subItem.subItems) {
                                                            return (
                                                                <div key={subItem.name}>
                                                                    <motion.div
                                                                        onClick={e => { e.stopPropagation(); setIsMyProjectsOpen(!isMyProjectsOpen); }}
                                                                        className={`flex items-center justify-between mt-2 p-2 text-sm font-medium rounded-lg cursor-pointer transition-colors mb-1 ${darkMode ? 'hover:bg-zinc-700 text-gray-300' : 'hover:bg-purple-100 text-gray-700'}`}
                                                                    >
                                                                        <span>{subItem.name}</span>
                                                                        <ChevronDown size={14} className={`transition-transform ${isMyProjectsOpen ? 'rotate-180' : ''}`} />
                                                                    </motion.div>
                                                                    <AnimatePresence>
                                                                        {isMyProjectsOpen && (
                                                                            <motion.div
                                                                                initial={{ height: 0, opacity: 0 }}
                                                                                animate={{ height: 'auto', opacity: 1 }}
                                                                                exit={{ height: 0, opacity: 0 }}
                                                                                className="ml-6 overflow-hidden"
                                                                            >
                                                                                {subItem.subItems.map(nested => {
                                                                                    const isActive = location.pathname === nested.href;
                                                                                    return (
                                                                                        <Link key={nested.href} to={nested.href} onClick={() => isMobile && onClose?.()} className="block">
                                                                                            <motion.div
                                                                                                className={`p-2 my-1 text-sm rounded-lg ${isActive ? 'bg-purple-900 text-white' : darkMode ? 'hover:bg-zinc-700 text-gray-300' : 'hover:bg-purple-200 text-gray-700'}`}
                                                                                            >
                                                                                                {nested.name}
                                                                                            </motion.div>
                                                                                        </Link>
                                                                                    );
                                                                                })}
                                                                            </motion.div>
                                                                        )}
                                                                    </AnimatePresence>
                                                                </div>
                                                            );
                                                        }
                                                        const isActive = location.pathname === subItem.href;
                                                        return (
                                                            <Link key={subItem.href} to={subItem.href} onClick={() => isMobile && onClose?.()} className="block">
                                                                <motion.div
                                                                    className={`p-2 my-1 text-sm rounded-lg ${isActive ? 'bg-purple-900 text-white' : darkMode ? 'hover:bg-zinc-700 text-gray-300' : 'hover:bg-purple-200 text-gray-700'}`}
                                                                >
                                                                    {subItem.name}
                                                                </motion.div>
                                                            </Link>
                                                        );
                                                    })}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                );
                            }
                            const isActive = location.pathname === item.href;
                            const Icon = item.icon;
                            return (
                                <Link key={item.href} to={item.href} onClick={() => isMobile && onClose?.()} className="block">
                                    <motion.div
                                        className={`flex items-center mt-4 p-3 text-sm font-medium rounded-lg transition-colors mb-2 ${isActive
                                            ? 'bg-purple-900 text-white'
                                            : darkMode
                                                ? 'hover:bg-zinc-700 text-gray-300'
                                                : 'hover:bg-purple-200 text-gray-700'
                                            }`}
                                    >
                                        <Icon size={20} className={isActive ? "text-white" : darkMode ? "text-gray-300" : "text-gray-700"} />
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
                        })}
                    </nav>
                </div>
            </motion.aside>
        </>
    );
};

export default DirectorSidebar;
