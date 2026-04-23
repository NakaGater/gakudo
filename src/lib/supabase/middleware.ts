import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const ENTRANCE_ALLOWED_PATHS = ['/attendance', '/api/']

// Public pages that don't need auth checks
const PUBLIC_PATHS = ['/', '/login', '/forgot-password', '/reset-password', '/auth/', '/manifest.webmanifest']
const PUBLIC_SLUG_PAGES = ['/about', '/faq', '/daily-life', '/enrollment', '/access', '/news', '/gallery']

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))) return true
  if (PUBLIC_SLUG_PAGES.some(p => pathname === p || pathname.startsWith(p + '/'))) return true
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/billing') && !pathname.startsWith('/api/push')) return true
  return false
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const pathname = request.nextUrl.pathname

  // Skip full auth check for public pages — just refresh session cookie
  if (isPublicPath(pathname)) {
    await supabase.auth.getUser()
    return supabaseResponse
  }

  const { data: { user } } = await supabase.auth.getUser()

  // entrance ロールはattendance関連ページのみアクセス可
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    if (profile?.role === 'entrance') {
      const allowed = ENTRANCE_ALLOWED_PATHS.some(p => pathname.startsWith(p))
      if (!allowed) {
        const url = request.nextUrl.clone()
        url.pathname = '/attendance/dashboard'
        return NextResponse.redirect(url)
      }
    }
  }

  return supabaseResponse
}
