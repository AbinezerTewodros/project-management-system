import { createContext, ReactNode, useContext, useState } from "react";

interface Notification {
    id: string;
    type:'project'| 'task'|'message';
    title: string;
    message:string;
    read: boolean;
    timestamp: Date;
    metadata?: any;
}

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    addNotification:(notification: Omit<Notification, 'id' | 'read'| 'timestamp'>) => void;
    markAsRead: (id: string) => void;
    clearAll:() => void;
}


const NotificationContext =createContext<NotificationContextType | undefined>(undefined);

const NotificationProvider=({children}: {children: ReactNode}) => {
    const [notifications, setNotifications] = useState<Notification[]> ([]);
    const unreadCount = notifications.filter(n => !n.read).length;
    const addNotification = (notification: Omit<Notification, 'id' | 'read' | 'timestamp'>) => {
        const newNotification: Notification = {
            ...notification,
            id: Math.random().toString(36).substring(2,9),
            read: false,
            timestamp: new Date()
        };
        setNotifications(prev =>[newNotification, ...prev]);
    };

    const markAsRead = (id: string) => {
        setNotifications(prev =>
            prev.map(n=> n.id === id ? {...n, read: true} : n)
        );
    };

    const clearAll = () => {
        setNotifications([]);
    };

  return (
    <NotificationContext.Provider
       value={{ notifications, unreadCount, addNotification, markAsRead, clearAll }}>
        {children}
    </NotificationContext.Provider>
  );
};

const useNotifications = () =>{
    const context = useContext(NotificationContext);
    if (!context){
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};
const NotificationContextComponent = () =>{
    return (
        <div>NotificationContext</div>
    )
}
export {NotificationProvider, useNotifications};
export default NotificationContextComponent;
