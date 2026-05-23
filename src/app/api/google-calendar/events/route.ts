import { createClient } from '@/lib/supabase/server'

type GCalTokens = {
  access_token: string
  refresh_token: string | null
  expires_at: number
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ connected: false, events: [] }, { status: 401 })
  }

  const gcal = user.user_metadata?.google_calendar as GCalTokens | undefined

  if (!gcal?.access_token) {
    return Response.json({ connected: false, events: [] })
  }

  let accessToken = gcal.access_token

  // Refresh token se estiver a menos de 60s de expirar
  if (Date.now() > gcal.expires_at - 60_000) {
    if (!gcal.refresh_token) {
      await supabase.auth.updateUser({ data: { google_calendar: null } })
      return Response.json({ connected: false, events: [], error: 'reconnect' })
    }

    const refreshRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        refresh_token: gcal.refresh_token,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        grant_type: 'refresh_token',
      }),
    })

    const refreshed = await refreshRes.json()

    if (!refreshed.access_token) {
      await supabase.auth.updateUser({ data: { google_calendar: null } })
      return Response.json({ connected: false, events: [], error: 'reconnect' })
    }

    accessToken = refreshed.access_token
    await supabase.auth.updateUser({
      data: {
        google_calendar: {
          ...gcal,
          access_token: refreshed.access_token,
          expires_at: Date.now() + (refreshed.expires_in ?? 3600) * 1000,
        },
      },
    })
  }

  const now = new Date().toISOString()
  const future = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

  const calRes = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
      new URLSearchParams({
        timeMin: now,
        timeMax: future,
        orderBy: 'startTime',
        singleEvents: 'true',
        maxResults: '15',
      }),
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )

  if (!calRes.ok) {
    return Response.json({ connected: true, events: [], error: 'fetch_failed' })
  }

  const calData = await calRes.json()

  return Response.json({ connected: true, events: calData.items ?? [] })
}
