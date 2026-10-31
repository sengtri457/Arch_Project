import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // 1. Initialize Supabase client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: any }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // 2. Fetch active user session securely
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const url = request.nextUrl.clone();

  // 3. Route Guard: Dashboard (Needs active session)
  if (url.pathname.startsWith("/dashboard")) {
    if (!user) {
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile && profile.role === 'admin') {
        url.pathname = '/admin'
        return NextResponse.redirect(url)
      }
    } catch {}
  }

  // 4. Route Guard: Admin panel (Needs active session + admin role)
  if (url.pathname.startsWith("/admin")) {
    if (!user) {
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }

    // Fast-path: Check verified admin cookie or JWT app_metadata to avoid blocking DB query on every route change
    const hasAdminCookie = request.cookies.get("sb-admin-verified")?.value === user.id;
    const isMetadataAdmin = (user.app_metadata as any)?.role === "admin" || (user.user_metadata as any)?.role === "admin";

    if (!hasAdminCookie && !isMetadataAdmin) {
      // Query profiles only when not yet cached in current session
      try {
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (error || !profile || profile.role !== "admin") {
          // Not an admin, redirect back to homepage
          url.pathname = "/";
          return NextResponse.redirect(url);
        }

        // Remember verification for subsequent fast navigations within /admin (valid for 30 minutes)
        response.cookies.set("sb-admin-verified", user.id, {
          path: "/admin",
          sameSite: "lax",
          maxAge: 1800,
          httpOnly: true,
        });
      } catch {
        url.pathname = "/";
        return NextResponse.redirect(url);
      }
    }
  }

  return response;
}

// Ensure middleware only fires on dashboards and admin paths (ignores static resources)
export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
