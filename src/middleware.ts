import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that require authentication
const PROTECTED_ROUTES = ["/library", "/vesper", "/discover"];

// Routes only for unauthenticated users (redirect to home if already logged in)
const AUTH_ROUTES = ["/login", "/register"];

const COOKIE_NAME = "aura_session";

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const token = request.cookies.get(COOKIE_NAME)?.value;
    const isAuthenticated = Boolean(token);

    // If trying to access protected routes without auth → redirect to login
    const isProtected = PROTECTED_ROUTES.some(route => pathname.startsWith(route));
    if (isProtected && !isAuthenticated) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("from", pathname);
        return NextResponse.redirect(loginUrl);
    }

    // If trying to access auth routes while already logged in → redirect to home
    const isAuthRoute = AUTH_ROUTES.some(route => pathname.startsWith(route));
    if (isAuthRoute && isAuthenticated) {
        return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
}

export const config = {
    // Run middleware on these paths, skip static files & API routes
    matcher: [
        "/((?!api|_next/static|_next/image|favicon.ico|public).*)",
    ],
};
