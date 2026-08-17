import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && session) {
      console.log('Auth Callback session established for:', session.user.email, 'ID:', session.user.id)
      // User is logged in. Now look up their role to decide where to route them.
      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single()

        console.log('Auth Callback profiles query result:', { profile, profileError })

        if (!profileError && profile) {
          console.log('Auth Callback found profile role:', profile.role)
          if (profile.role === 'admin') {
            console.log('Auth Callback redirecting to /admin')
            return NextResponse.redirect(new URL('/admin', request.url))
          } else {
            console.log('Auth Callback redirecting to /dashboard')
            return NextResponse.redirect(new URL('/dashboard', request.url))
          }
        } else {
          console.warn('Auth Callback profile lookup failed or returned error, falling back to next:', profileError)
        }
      } catch (err) {
        console.error('Callback error loading profile:', err)
      }
    } else {
      console.warn('Auth Callback failed to establish session or returned auth error:', error)
    }
  }

  // Fallback redirect
  return NextResponse.redirect(new URL(next, request.url))
}
