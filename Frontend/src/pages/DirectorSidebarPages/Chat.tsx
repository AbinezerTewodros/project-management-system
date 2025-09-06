import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface DirectorChatProps {
    darkMode: boolean;
    setDarkMode: (darkMode: boolean) => void;
    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
}

const DirectorChat = (_props: DirectorChatProps) => {
    return (
        <div className="space-y-6 w-full">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold tracking-tight">Director Chat</h2>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Chat</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>Director Chat feature coming soon.</p>
                </CardContent>
            </Card>
        </div>
    );
};

export default DirectorChat;
