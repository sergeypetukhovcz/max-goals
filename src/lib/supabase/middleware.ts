import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Guard the auth lookup with a timeout and fail open: if Supabase is briefly
  // slow/unreachable, we must NOT hang the whole request until Vercel kills the
  // middleware with a 504. Protected routes are still guarded server-side by the
  // (protected) layout, which re-checks the user — so letting a request through
  // here is safe, and only skips the early login/redirect optimization.
  let user: Awaited<ReturnType<typeof supabase.auth.getUser>>["data"]["user"] | null = null;
  let authFailed = false;
  try {
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("auth timeout")), 3000)
    );
    const result = await Promise.race([supabase.auth.getUser(), timeout]);
    user = result.data.user;
  } catch {
    authFailed = true;
  }

  // Could not determine the session in time — proceed without redirecting.
  if (authFailed) {
    return supabaseResponse;
  }

  const isAuthPage =
    request.nextUrl.pathname === "/login" ||
    request.nextUrl.pathname === "/register";

  // The /auth/* routes (e.g. code exchange callback) must run even when there is
  // no session yet — redirecting them to /login would break the login flow.
  const isAuthRoute = request.nextUrl.pathname.startsWith("/auth");

  // Not logged in and trying to access protected route
  if (!user && !isAuthPage && !isAuthRoute && request.nextUrl.pathname !== "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Logged in and trying to access auth pages
  if (user && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
