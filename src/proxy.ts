import type { NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    "/learn/:path*",
    "/ear/:path*",
    "/my-danish/:path*",
    "/progress/:path*",
    "/world/:path*",
    "/login",
  ],
};
