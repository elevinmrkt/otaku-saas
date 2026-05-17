import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mdamossubweuqntwsblp.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kYW1vc3N1YndldXFudHdzYmxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5Mjg0NTAsImV4cCI6MjA5NDUwNDQ1MH0.js_2G6--GTLQb72sLjuN2Ypu6nLwUEEGhPc5CVRofVc',
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  const publicPaths = ['/login', '/recuperar-senha', '/atualizar-senha', '/auth/callback']
  const isPublic = publicPaths.some(p => pathname.startsWith(p))

  if (!user && !isPublic) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user && !isPublic) {
    const { data: profile } = await supabase
      .from('users')
      .select('onboarding_completed_at, welcome_video_completed_at, anamnesis_completed_at, role')
      .eq('id', user.id)
      .single()

    if (profile) {
      const isAdminRoute = pathname.startsWith('/admin')
      const isAdminRole = ['admin', 'editor', 'mentor', 'suporte'].includes(profile.role)

      if (isAdminRoute && !isAdminRole) {
        const url = request.nextUrl.clone()
        url.pathname = '/home'
        return NextResponse.redirect(url)
      }

      if (!isAdminRoute) {
        if (!profile.onboarding_completed_at && pathname !== '/onboarding') {
          const url = request.nextUrl.clone()
          url.pathname = '/onboarding'
          return NextResponse.redirect(url)
        }
        if (profile.onboarding_completed_at && !profile.welcome_video_completed_at && pathname !== '/boas-vindas') {
          const url = request.nextUrl.clone()
          url.pathname = '/boas-vindas'
          return NextResponse.redirect(url)
        }
        if (profile.onboarding_completed_at && profile.welcome_video_completed_at && !profile.anamnesis_completed_at && pathname !== '/anamnese') {
          const url = request.nextUrl.clone()
          url.pathname = '/anamnese'
          return NextResponse.redirect(url)
        }
      }
    }
  }

  if (user && isPublic && pathname === '/login') {
    const url = request.nextUrl.clone()
    url.pathname = '/home'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
