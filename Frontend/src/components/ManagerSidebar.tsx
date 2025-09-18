import { AnimatePresence, motion } from "framer-motion";
import { ClipboardList, Home, SquareDashedKanban, UsersRound, PlusCircle, MessageCircle, Megaphone, ChevronDown, Archive} from "lucide-react"; // ClipboardCheck
import { useEffect, useState } from "react";
import { useLocation, Link } from "react-router-dom";

interface ManagerSidebarProps {
    isOpen: boolean;
    onClose?: () => void;
    darkMode: boolean;
}

const ManagerSidebar = ({ isOpen, onClose, darkMode }: ManagerSidebarProps) => {
    const location = useLocation();
    const [isMobile, setIsMobile] = useState(false);
    const [isProjectsOpen, setIsProjectsOpen] = useState(false);

    const SIDEBAR_ITEMS = [
        { name: "Home", icon: Home, href: "/dashboard/manager" },
        { name: "Create Project", icon: PlusCircle, href: "/dashboard/manager/create-project" },
        {
            name: "Projects", icon: SquareDashedKanban, subItems: [
                { name: "My Assignment", href: "/dashboard/manager/tasks" },
                { name: "My Projects", href: "/dashboard/manager/projects" }
            ]
        },
        { name: "Teams", icon: UsersRound, href: "/dashboard/manager/teams" },
        { name: "Reports", icon: ClipboardList, href: "/dashboard/manager/reports" },
        { name: "Chat", icon: MessageCircle, href: "/dashboard/manager/chat" },
        { name: "Announcements", icon: Megaphone, href: "/dashboard/manager/announcements" },
        { name: "Archived Tasks", icon: Archive, href: "/dashboard/manager/archived-tasks" },
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
        const activeSubItem = SIDEBAR_ITEMS.find(item => item.subItems?.some(sub => sub.href === location.pathname));
        if (activeSubItem) {
            setIsProjectsOpen(true);
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

export default ManagerSidebar;
