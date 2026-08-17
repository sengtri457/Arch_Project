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
          cookiesToSet.forEach(({ name, value, options }) =>
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

    // Load user role from db profiles
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
    } catch {
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  }

  return response;
}

// Ensure middleware only fires on dashboards and admin paths (ignores static resources)
export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
