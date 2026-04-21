import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const ENTRANCE_ALLOWED_PATHS = ['/attendance', '/api/']

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

  const { data: { user } } = await supabase.auth.getUser()

  // entrance ロールはattendance関連ページのみアクセス可
  if (user) {
    const pathname = request.nextUrl.pathname
    const isPublicOrAuth = pathname === '/' || pathname.startsWith('/login') ||
      pathname.startsWith('/forgot-password') || pathname.startsWith('/reset-password') ||
      pathname.startsWith('/auth/')
    if (!isPublicOrAuth) {
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
  }

  return supabaseResponse
}
