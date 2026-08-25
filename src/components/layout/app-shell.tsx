"use client";

import { DesktopSidebar } from "./desktop-sidebar";
import { MobileNav } from "./mobile-nav";
import { XpToast } from "@/components/gamification/xp-toast";
import { LevelUpModal } from "@/components/gamification/level-up-modal";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="relative flex min-h-svh">
      {/* Desktop sidebar */}
      <DesktopSidebar />

      {/* Main content */}
      <main className="flex-1 pb-20 md:pb-0 md:pl-64">
        <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>

      {/* Mobile bottom nav */}
      <MobileNav />

      {/* Global overlays */}
      <XpToast />
      <LevelUpModal />
    </div>
  );
}
