import { User, Bell, Palette, Clock, Database } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const SETTINGS_SECTIONS = [
  {
    title: "Profile",
    description: "Name, avatar, and personal info",
    icon: User,
  },
  {
    title: "Notifications",
    description: "Reminders, alerts, and push notifications",
    icon: Bell,
  },
  {
    title: "Appearance",
    description: "Theme, colors, and display preferences",
    icon: Palette,
  },
  {
    title: "Schedule",
    description: "Teaching days, college hours, working hours",
    icon: Clock,
  },
  {
    title: "Data",
    description: "Export, import, and reset your data",
    icon: Database,
  },
];

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1>Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Customize your Organizer experience
        </p>
      </div>

      <Separator />

      {/* Settings list */}
      <div className="space-y-2">
        {SETTINGS_SECTIONS.map((section) => {
          const Icon = section.icon;
          return (
            <Card key={section.title} className="surface-elevated cursor-pointer transition-colors hover:bg-accent/50">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">{section.title}</p>
                  <p className="text-xs text-muted-foreground">{section.description}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
