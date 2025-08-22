import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface VicePresidentTeamsProps {
    darkMode: boolean;
    setDarkMode: (darkMode: boolean) => void;
    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
}

const VicePresidentTeams = ({ darkMode, setDarkMode, sidebarOpen, setSidebarOpen }: VicePresidentTeamsProps) => {
    return (
        <div className="space-y-6 w-full">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold tracking-tight">Vice President Teams</h2>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Teams Overview</CardTitle>
                </CardHeader>
                <CardContent>
                    {/* Add your teams content here */}
                    <p>Vice President Teams Content Coming Soon</p>
                </CardContent>
            </Card>
        </div>
    );
};

export default VicePresidentTeams;
