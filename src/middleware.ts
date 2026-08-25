import { NextRequest, NextResponse } from "next/server";
import { createServerClientWithAuth } from "@/lib/supabase/server";

// Routes that don't require authentication
const publicRoutes = ["/auth/login", "/auth/signup", "/auth/callback"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Check authentication for protected routes
  const supabase = createServerClientWithAuth();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    // Redirect unauthenticated users to login
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
