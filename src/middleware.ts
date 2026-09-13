import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { isPathAllowedForRole, defaultHomeForRole } from "@/lib/roles";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  // beskyt admin-sider og admin-api, men ikke login-siden eller login-api
  const isAdminPage = pathname.startsWith("/admin") && pathname !== "/admin/login";
  if (isAdminPage) {
    const session = await getSessionFromRequest(req);
    if (!session) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    // FASE 2 (§4/§5): rammer man en side ens rolle ikke maa se, sendes
    // man til rollens egen startside i stedet for at faa lov at blive.
    if (!isPathAllowedForRole(pathname, session.role)) {
      const url = req.nextUrl.clone();
      url.pathname = defaultHomeForRole(session.role);
      url.search = "";
      return NextResponse.redirect(url);
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"]
};
