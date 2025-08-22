import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DirectorReportsProps {
    darkMode: boolean;
    setDarkMode: (darkMode: boolean) => void;
    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
}

const DirectorReports = ( _props: DirectorReportsProps) => {
    return (
        <div className="space-y-6 w-full">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold tracking-tight">Director Reports</h2>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Project Reports</CardTitle>
                </CardHeader>
                <CardContent>
                    {/* Add your reports content here */}
                    <p>Director Reports Content Coming Soon</p>
                </CardContent>
            </Card>
        </div>
    );
};

export default DirectorReports;
