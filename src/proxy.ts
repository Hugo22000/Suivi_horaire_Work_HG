import { NextResponse, type NextRequest } from "next/server";
import {
  createSessionToken,
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_OPTIONS,
  verifySessionToken,
} from "@/lib/auth";

export async function proxy(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (!session) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Sliding session: renew the cookie's expiry on every visit so a device
  // that keeps being used never has to re-authenticate.
  const response = NextResponse.next();
  const refreshedToken = await createSessionToken(session);
  response.cookies.set(SESSION_COOKIE_NAME, refreshedToken, SESSION_COOKIE_OPTIONS);
  return response;
}

export const config = {
  matcher: ["/((?!login|register|api|_next|favicon.ico).*)"],
};
