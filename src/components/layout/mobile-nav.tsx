"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  CheckSquare,
  BarChart3,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";

const MOBILE_NAV_ITEMS = [
  { href: "/", label: "Home", icon: LayoutDashboard },
  { href: "/schedule", label: "Schedule", icon: Calendar },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/stats", label: "Stats", icon: BarChart3 },
  { href: "/focus", label: "Focus", icon: Target },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur-sm md:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
      <div className="flex h-14 items-center justify-around px-2">
        {MOBILE_NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 rounded-lg px-3 py-1.5 transition-colors",
                isActive
                  ? "text-foreground"
                  : "text-muted-foreground"
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5",
                  isActive && "text-foreground"
                )}
              />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
