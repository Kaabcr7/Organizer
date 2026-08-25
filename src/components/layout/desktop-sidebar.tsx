"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  CheckSquare,
  BarChart3,
  Target,
  Settings,
  Zap,
  History,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useApp } from "@/lib/store";
import { formatXp } from "@/lib/domain/xp";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/lib/auth";

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: LayoutDashboard },
  { href: "/schedule", label: "Schedule", icon: Calendar },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/history", label: "History", icon: History },
  { href: "/stats", label: "Stats", icon: BarChart3 },
  { href: "/focus", label: "Focus", icon: Target },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function DesktopSidebar() {
  const pathname = usePathname();
  const { state, levelProgress } = useApp();
  const { signOut } = useAuth();
  const { stats } = state;

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (err) {
      console.error("Sign out failed:", err);
    }
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-sidebar md:flex">
      {/* Brand */}
      <div className="flex h-16 items-center gap-2.5 px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
          <Zap className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="text-lg font-bold tracking-tight">Organizer</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer - Level + XP */}
      <div className="border-t border-sidebar-border px-4 py-4 space-y-3">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">Level {stats.level}</span>
            <span className="text-xs text-muted-foreground">
              {formatXp(stats.totalXp)} XP
            </span>
          </div>
          <Progress value={levelProgress} className="h-1.5" />
        </div>

        {/* Sign Out Button */}
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
