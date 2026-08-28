/**
 * Auth Callback Route
 * 
 * This route handles post-authentication redirects.
 * Better Auth handles the actual OAuth exchange via /api/auth/* routes.
 * This callback is used for email verification links and OAuth redirects.
 */

import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const next = searchParams.get("next") ?? "/";

  // Redirect to the intended destination after auth
  return NextResponse.redirect(new URL(next, request.url));
}
