import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SettingsProps {
    darkMode: boolean;
    setDarkMode: (darkMode: boolean) => void;
    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
}

const Settings = ({ darkMode, setDarkMode, sidebarOpen, setSidebarOpen }: SettingsProps) => {
    return (
        <>
            <div className="space-y-6 w-full mt-12">
                <div className="flex justify-between items-center">
                    <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle>Account Settings</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {/* Add your settings content here */}
                        <p>Settings Content Coming Soon</p>
                    </CardContent>
                </Card>
            </div>
        </>
    );
};

export default Settings;
