import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface VicePresidentReportsProps {
    darkMode: boolean;
    setDarkMode: (darkMode: boolean) => void;
    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
}

const VicePresidentReports = ({ darkMode, setDarkMode, sidebarOpen, setSidebarOpen }: VicePresidentReportsProps) => {
    return (
        <div className="space-y-6 w-full">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold tracking-tight">Vice President Reports</h2>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Project Reports</CardTitle>
                </CardHeader>
                <CardContent>
                    {/* Add your reports content here */}
                    <p>Vice President Reports Content Coming Soon</p>
                </CardContent>
            </Card>
        </div>
    );
};

export default VicePresidentReports;
