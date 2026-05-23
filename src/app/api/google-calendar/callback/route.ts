import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, protocol, host } = new URL(request.url)
  const code = searchParams.get('code')
  const baseUrl = `${protocol}//${host}`

  if (!code) {
    return NextResponse.redirect(`${baseUrl}/agenda?error=google_cancelled`)
  }

  const redirectUri = `${baseUrl}/api/google-calendar/callback`

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  })

  const tokens = await tokenRes.json()

  if (!tokens.access_token) {
    return NextResponse.redirect(`${baseUrl}/agenda?error=google_token`)
  }

  const supabase = await createClient()
  await supabase.auth.updateUser({
    data: {
      google_calendar: {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token ?? null,
        expires_at: Date.now() + (tokens.expires_in ?? 3600) * 1000,
      },
    },
  })

  return NextResponse.redirect(`${baseUrl}/agenda?google=connected`)
}
