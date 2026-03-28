import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isAdminLoginRoute = pathname === "/admin/login";

  const isAuthRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/admin");

  if (!isAuthRoute || isAdminLoginRoute) {
    return NextResponse.next();
  }

  const requiredCookie = pathname.startsWith("/admin") ? "adminAuthToken" : "userAuthToken";
  const scopedCookie = request.cookies.get(requiredCookie);
  /** @deprecated single-cookie sessions; kept briefly so older tabs still pass edge checks */
  const legacyCookie = request.cookies.get("authToken");

  if (!scopedCookie?.value && !legacyCookie?.value) {
    const loginPath = pathname.startsWith("/admin") ? "/admin/login" : "/login";
    const loginUrl = new URL(loginPath, request.url);

    // Preserve the original path so we can redirect back after login.
    const redirectTarget =
      pathname + request.nextUrl.search || "";
    loginUrl.searchParams.set("redirect", redirectTarget);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/profile/:path*", "/admin/:path*"],
};
