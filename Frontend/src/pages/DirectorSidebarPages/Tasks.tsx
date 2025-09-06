import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface DirectorTasksProps {
    darkMode: boolean;
    setDarkMode: (darkMode: boolean) => void;
    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
}

const DirectorTasks = ( _props: DirectorTasksProps) => {
    return (
        <div className="space-y-6 w-full">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold tracking-tight">Director My Assignment</h2>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>My Assignment</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>Director My Assignment feature coming soon.</p>
                </CardContent>
            </Card>
        </div>
    );
};

export default DirectorTasks;
