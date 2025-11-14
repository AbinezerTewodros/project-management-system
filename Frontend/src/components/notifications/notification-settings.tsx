"use client";

import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useNotifications } from "@/context/NotificationContext";
import { NotificationCategory } from "@/types/notification";

interface NotificationSettingsProps {
  onBack: () => void;
}

export function NotificationSettings({ onBack }: NotificationSettingsProps) {
  const { preferences, updatePreferences } = useNotifications();

  const categoryLabels = {
    [NotificationCategory.PROJECT_UPDATE]: "Project Updates",
    [NotificationCategory.TASK_ASSIGNMENT]: "Task Assignments",
    [NotificationCategory.ROLE_CHANGE]: "Role Changes",
    [NotificationCategory.DEADLINE_REMINDER]: "Deadline Reminders",
    [NotificationCategory.ESCALATION]: "Escalations",
    [NotificationCategory.SYSTEM]: "System Notifications",
  };

  const handleToggleCategory = (category: NotificationCategory) => {
    updatePreferences({
      categories: {
        ...preferences.categories,
        [category]: !preferences.categories[category],
      },
    });
  };

  return (
    <div className="w-96 bg-background border rounded-lg shadow-lg">
      <div className="flex items-center p-4 border-b">
        <Button variant="ghost" size="sm" onClick={onBack} className="mr-2">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h3 className="font-semibold text-foreground">Notification Settings</h3>
      </div>

      <div className="p-4 space-y-6">
        {/* General Settings */}
        <div className="space-y-4">
          <h4 className="font-medium text-foreground">General</h4>

          <div className="flex items-center justify-between">
            <Label htmlFor="email-notifications" className="text-sm">
              Email Notifications
            </Label>
            <Switch
              id="email-notifications"
              checked={preferences.emailNotifications}
              onCheckedChange={(checked) =>
                updatePreferences({ emailNotifications: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="push-notifications" className="text-sm">
              Push Notifications
            </Label>
            <Switch
              id="push-notifications"
              checked={preferences.pushNotifications}
              onCheckedChange={(checked) =>
                updatePreferences({ pushNotifications: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="urgent-only" className="text-sm">
              Urgent Only
            </Label>
            <Switch
              id="urgent-only"
              checked={preferences.urgentOnly}
              onCheckedChange={(checked) =>
                updatePreferences({ urgentOnly: checked })
              }
            />
          </div>
        </div>

        <Separator />

        {/* Category Settings */}
        <div className="space-y-4">
          <h4 className="font-medium text-foreground">Categories</h4>

          {Object.entries(categoryLabels).map(([category, label]) => (
            <div key={category} className="flex items-center justify-between">
              <Label htmlFor={category} className="text-sm">
                {label}
              </Label>
              <Switch
                id={category}
                checked={
                  preferences.categories[category as NotificationCategory]
                }
                onCheckedChange={() =>
                  handleToggleCategory(category as NotificationCategory)
                }
                disabled={preferences.urgentOnly}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
