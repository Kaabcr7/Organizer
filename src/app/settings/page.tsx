"use client";

import { useState, useCallback, useEffect } from "react";
import {
  User,
  Bell,
  Palette,
  Clock,
  Database,
  Save,
  X,
  Edit,
  Trash2,
  Plus,
  Sun,
  Moon,
  Download,
  Upload,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Switch,
} from "@/components/ui/switch";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { useApiProfile } from "@/hooks/useApiProfile";
import { useApiSchedule } from "@/hooks/useApiSchedule";
import { getTodayDate } from "@/lib/domain/daily-state";
import { cn } from "@/lib/utils";

const WEEKDAYS = [
  { value: "1", label: "Monday" },
  { value: "2", label: "Tuesday" },
  { value: "3", label: "Wednesday" },
  { value: "4", label: "Thursday" },
  { value: "5", label: "Friday" },
  { value: "6", label: "Saturday" },
  { value: "7", label: "Sunday" },
];

const TIME_OPTIONS = Array.from({ length: 24 * 4 }, (_, i) => {
  const hours = Math.floor(i / 4);
  const minutes = (i % 4) * 15;
  const time = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
  const displayHours = hours % 12 || 12;
  const ampm = hours >= 12 ? "PM" : "AM";
  return { value: time, label: `${displayHours}:${minutes.toString().padStart(2, "0")} ${ampm}` };
});

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const { profile, loading: profileLoading, updateProfile, fetchProfile } = useApiProfile();
  const { schedule, loading: scheduleLoading, fetchSchedule, updateScheduleBlock, deleteScheduleBlock } = useApiSchedule();

  const [activeTab, setActiveTab] = useState("profile");
  const [isSaving, setIsSaving] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>("default");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
 const [systemPrefersDark, setSystemPrefersDark] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [teachingDays, setTeachingDays] = useState<string[]>([]);
  const [collegeStart, setCollegeStart] = useState("09:00");
  const [collegeEnd, setCollegeEnd] = useState("17:00");
  const [teachingStart, setTeachingStart] = useState("17:30");
  const [teachingEnd, setTeachingEnd] = useState("21:30");

  // Initialize from profile data.
  // The API client normalises the profile to camelCase and trims Postgres
  // "HH:MM:SS" times down to the "HH:MM" values used by TIME_OPTIONS — the
  // raw snake_case fields still carry seconds and would not match any option.
  const initializeFromProfile = useCallback(() => {
    if (profile) {
      setDisplayName(profile.displayName || "");
      try {
        const days = JSON.parse(profile.teachingDays || "[1,3,5]");
        setTeachingDays(days.map(String));
      } catch {
        setTeachingDays(["1", "3", "5"]);
      }
      setCollegeStart(profile.collegeStart || "09:00");
      setCollegeEnd(profile.collegeEnd || "17:00");
      setTeachingStart(profile.teachingStart || "17:30");
      setTeachingEnd(profile.teachingEnd || "21:30");
    }
  }, [profile]);

  // Initialize from schedule data
  const initializeFromSchedule = useCallback(() => {
    if (schedule) {
      // Schedule blocks loaded
    }
  }, [schedule]);

  // Check notification permission
  const checkNotificationPermission = useCallback(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  // Initialize on mount
  const [initialized, setInitialized] = useState(false);
  useEffect(() => {
    if (initialized) return;

    if (typeof window !== "undefined") {
      setSystemPrefersDark(
        window.matchMedia("(prefers-color-scheme: dark)").matches
      );
      const savedTheme = localStorage.getItem("theme") as
        | "dark"
        | "light"
        | null;
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)")
        .matches;
      const initialTheme = savedTheme || (prefersDark ? "dark" : "light");
      setTheme(initialTheme);
      document.documentElement.classList.toggle("dark", initialTheme === "dark");
      checkNotificationPermission();
    }

    if (!profileLoading && !scheduleLoading) {
      initializeFromProfile();
      initializeFromSchedule();
      setInitialized(true);
    }
  }, [
    initialized,
    profileLoading,
    scheduleLoading,
    initializeFromProfile,
    initializeFromSchedule,
    checkNotificationPermission,
  ]);

  // The schedule hook has no auto-fetch of its own, so the Schedule tab stays
  // empty unless it is requested explicitly. The profile auto-fetches.
  const [scheduleRequested, setScheduleRequested] = useState(false);
  useEffect(() => {
    if (scheduleRequested) return;
    setScheduleRequested(true);
    fetchSchedule().catch((error) => {
      console.error("Failed to load schedule:", error);
    });
  }, [scheduleRequested, fetchSchedule]);


const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      await updateProfile({
        displayName: displayName.trim() || (user?.name ?? ""),
      });
      await fetchProfile();
    } catch (error) {
      console.error("Failed to save profile:", error);
    } finally {
      setIsSaving(false);
    }
  };

const handleSaveSchedule = async () => {
    setIsSaving(true);
    try {
      await updateProfile({
        teachingDays: JSON.stringify(teachingDays),
        collegeStart,
        collegeEnd,
        teachingStart,
        teachingEnd,
      });
      await fetchProfile();
    } catch (error) {
      console.error("Failed to save schedule:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleNotificationToggle = async (enabled: boolean) => {
    if (enabled && Notification.permission !== "granted") {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission !== "granted") {
        // Reset switch if permission denied
        // This would need a controlled switch component
      }
    }
  };

  const handleThemeChange = (newTheme: "dark" | "light") => {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  const handleExportData = async () => {
    try {
      const today = getTodayDate();

      const [tasksRes, profileRes, historyRes, scheduleRes] = await Promise.all([
        fetch("/api/tasks?date=" + today),
        fetch("/api/profile"),
        fetch("/api/history?startDate=2020-01-01&endDate=2030-12-31"),
        fetch("/api/schedule"),
      ]);

      const [tasks, profile, history, scheduleData] = await Promise.all([
        tasksRes.json(),
        profileRes.json(),
        historyRes.json(),
        scheduleRes.json(),
      ]);

      const exportData = {
        version: 1,
        exportDate: new Date().toISOString(),
        userId: user?.id,
        tasks: tasks.data || [],
        profile: profile.data || {},
        history: history.data || [],
        schedule: scheduleData.data || [],
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `organizer-backup-${today}.json`;
      // The anchor has to be in the document for the download to start in
      // every browser, and the URL can only be revoked once it has.
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 0);
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        // Note: Import would require multiple API calls
        // For now, just show the data structure
        console.log("Import data:", data);
        alert("Import functionality would restore data via API. Check console for data structure.");
      } catch (error) {
        console.error("Import failed:", error);
        alert("Invalid file format");
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Sign out failed:", error);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm("Are you sure you want to delete your account? This action is irreversible and will delete all your data.")) {
      return;
    }
    if (!confirm("This will permanently delete your account and ALL data. Type 'DELETE' to confirm.")) {
      return;
    }
    // Note: Account deletion would require a backend endpoint
    alert("Account deletion requires backend implementation. Contact support.");
  };

  const profileFields = (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
              disabled={isSaving}
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={user?.email || ""}
              readOnly
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">Email cannot be changed</p>
          </div>
        </div>
      </div>

      <Button
        onClick={handleSaveProfile}
        disabled={isSaving || !displayName.trim()}
        className="w-full"
      >
        <Save className="mr-2 h-4 w-4" />
        {isSaving ? "Saving..." : "Save Changes"}
      </Button>
    </div>
  );

  const notificationsFields = (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Notification Settings</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Browser notifications allow Organizer to remind you about tasks and events.
        </p>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Browser Notifications</p>
              <p className="text-sm text-muted-foreground">
                Receive reminders and alerts in your browser
              </p>
            </div>
            <Switch
              checked={notificationPermission === "granted"}
              onCheckedChange={handleNotificationToggle}
              disabled={isSaving}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Task Reminders</p>
              <p className="text-sm text-muted-foreground">
                Get notified when tasks are due
              </p>
            </div>
            <Switch
              checked={false}
              onCheckedChange={() => {}}
              disabled={true}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Daily Summary</p>
              <p className="text-sm text-muted-foreground">
                Receive end-of-day completion summary
              </p>
            </div>
            <Switch
              checked={false}
              onCheckedChange={() => {}}
              disabled={true}
            />
          </div>
        </div>
        {notificationPermission === "default" && (
          <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-200">
            <p className="text-sm">
              <AlertCircle className="inline h-4 w-4 mr-1" />
              Notifications not yet configured. Enable above to grant permission.
            </p>
          </div>
        )}
      </div>
    </div>
  );

  const appearanceFields = (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Theme</h3>
        <div className="grid grid-cols-2 gap-4">
          <Button
            variant={theme === "light" ? "default" : "outline"}
            onClick={() => handleThemeChange("light")}
            className="h-24 flex-col items-center gap-2"
            disabled={isSaving}
          >
            <Sun className="h-8 w-8" />
            <span>Light</span>
          </Button>
          <Button
            variant={theme === "dark" ? "default" : "outline"}
            onClick={() => handleThemeChange("dark")}
            className="h-24 flex-col items-center gap-2"
            disabled={isSaving}
          >
            <Moon className="h-8 w-8" />
            <span>Dark</span>
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          System preference: {systemPrefersDark ? "Dark" : "Light"}
        </p>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Color Scheme</h3>
        <p className="text-sm text-muted-foreground">
          Uses the application's default color theme. Custom color schemes coming soon.
        </p>
      </div>
    </div>
  );

  const scheduleFields = (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Teaching Days</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Select which days you teach. Recurring tasks will be generated for these days.
        </p>
        <div className="flex flex-wrap gap-2">
          {WEEKDAYS.map((day) => (
            <Button
              key={day.value}
              variant={teachingDays.includes(day.value) ? "default" : "outline"}
              size="sm"
              onClick={() => setTeachingDays((prev) =>
                prev.includes(day.value)
                  ? prev.filter((d) => d !== day.value)
                  : [...prev, day.value]
              )}
              className="h-10 px-3"
            >
              {day.label.slice(0, 3)}
            </Button>
          ))}
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="text-lg font-semibold mb-4">College Hours</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="collegeStart">Start Time</Label>
            <Select value={collegeStart} onValueChange={(value) => value && setCollegeStart(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIME_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="collegeEnd">End Time</Label>
            <Select value={collegeEnd} onValueChange={(value) => value && setCollegeEnd(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIME_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="text-lg font-semibold mb-4">Teaching Hours</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="teachingStart">Start Time</Label>
            <Select value={teachingStart} onValueChange={(value) => value && setTeachingStart(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIME_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="teachingEnd">End Time</Label>
            <Select value={teachingEnd} onValueChange={(value) => value && setTeachingEnd(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIME_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="text-lg font-semibold mb-4">Schedule Blocks</h3>
        {schedule && schedule.length > 0 ? (
          <div className="space-y-2">
            {schedule.map((block) => (
              <Card key={block.id} className="surface-elevated">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{
                        backgroundColor:
                          block.type === "college"
                            ? "hsl(220 90% 56%)"
                            : block.type === "teaching"
                            ? "hsl(142 76% 36%)"
                            : "hsl(262 83% 58%)",
                      }}
                    />
                    <div>
                      <p className="font-medium">{block.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {block.type} • {block.startTime} - {block.endTime}
                        {block.recurrenceDays && " • Recurring"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={block.isActive}
                      onCheckedChange={(checked) =>
                        updateScheduleBlock(block.id, { isActive: checked })
                      }
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteScheduleBlock(block.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No schedule blocks created yet.</p>
        )}
        <Button variant="outline" onClick={() => alert("Create schedule block dialog coming soon")}>
          <Plus className="mr-2 h-4 w-4" />
          Add Schedule Block
        </Button>
      </div>

      <Button onClick={handleSaveSchedule} disabled={isSaving} className="w-full">
        <Save className="mr-2 h-4 w-4" />
        {isSaving ? "Saving..." : "Save Schedule"}
      </Button>
    </div>
  );

  const dataFields = (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Export Data</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Download a complete backup of your tasks, profile, history, and schedule.
        </p>
        <Button onClick={handleExportData} disabled={isSaving}>
          <Download className="mr-2 h-4 w-4" />
          Export All Data (JSON)
        </Button>
      </div>

      <Separator />

      <div>
        <h3 className="text-lg font-semibold mb-4">Import Data</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Restore data from a previously exported JSON file.
        </p>
        <div className="flex items-center gap-4">
          <input
            type="file"
            accept=".json"
            onChange={handleImportData}
            className="sr-only"
            id="import-file"
          />
          <Label htmlFor="import-file" className="cursor-pointer">
            <Button variant="outline">
              <Upload className="mr-2 h-4 w-4" />
              Choose File
            </Button>
          </Label>
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="text-lg font-semibold mb-4">Reset Data</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Dangerous operations that cannot be undone.
        </p>
        <div className="space-y-2">
          <Button variant="destructive" onClick={handleSignOut}>
            Sign Out
          </Button>
          <Button variant="destructive" onClick={handleDeleteAccount}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Account
          </Button>
        </div>
      </div>
    </div>
  );

  const tabPanels = {
    profile: profileFields,
    notifications: notificationsFields,
    appearance: appearanceFields,
    schedule: scheduleFields,
    data: dataFields,
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1>Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Customize your Organizer experience
        </p>
      </div>

      <Separator />

      {/* User info card */}
      {user && (
        <Card className="surface-elevated">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <User className="h-6 w-6" />
            </div>
            <div>
              <p className="font-medium">{user.name || user.email}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="data">Data</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          {profileFields}
        </TabsContent>
        <TabsContent value="notifications" className="mt-6">
          {notificationsFields}
        </TabsContent>
        <TabsContent value="appearance" className="mt-6">
          {appearanceFields}
        </TabsContent>
        <TabsContent value="schedule" className="mt-6">
          {scheduleFields}
        </TabsContent>
        <TabsContent value="data" className="mt-6">
          {dataFields}
        </TabsContent>
      </Tabs>
    </div>
  );
}