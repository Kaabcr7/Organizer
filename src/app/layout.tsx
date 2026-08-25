import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppShell } from "@/components/layout/app-shell";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider } from "@/lib/store";
import { AuthProvider } from "@/lib/auth";
import {
  SupabaseSyncProvider,
  SupabaseSyncInitializer,
} from "@/components/providers/supabase-sync-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Organizer",
  description: "Your personal productivity RPG",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Organizer",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#0a0a0a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <AuthProvider>
          <AppProvider>
            <SupabaseSyncProvider>
              <SupabaseSyncInitializer>
                <TooltipProvider>
                  <AppShell>{children}</AppShell>
                </TooltipProvider>
              </SupabaseSyncInitializer>
            </SupabaseSyncProvider>
          </AppProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
