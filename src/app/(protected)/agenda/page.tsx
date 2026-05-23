import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Calendar, Video, Clock, ExternalLink } from 'lucide-react'
import type { EventType } from '@/types/database'
import { GoogleCalendarSection } from '@/components/agenda/GoogleCalendarSection'

type AgendaEvent = {
  id: string
  title: string
  description: string | null
  event_type: EventType
  start_datetime: string
  end_datetime: string | null
  meeting_url: string | null
  status: string
  source: 'events' | 'clube' | 'desafio'
  source_href: string | null
}

function toDatetime(dateStr: string): string {
  if (dateStr.includes('T') || /\s\d{2}:/.test(dateStr)) return dateStr
  return `${dateStr}T12:00:00.000Z`
}

function buildGoogleCalendarUrl(ev: AgendaEvent): string {
  const fmt = (d: Date) => d.toISOString().replace(/[-:.]/g, '').slice(0, 15) + 'Z'
  const start = new Date(ev.start_datetime)
  const end = ev.end_datetime
    ? new Date(ev.end_datetime)
    : new Date(start.getTime() + 60 * 60 * 1000)

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: ev.title,
    dates: `${fmt(start)}/${fmt(end)}`,
    details: [ev.description, ev.meeting_url ? `Link: ${ev.meeting_url}` : ''].filter(Boolean).join('\n\n'),
  })
  if (ev.meeting_url) params.set('location', ev.meeting_url)

  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

const EVENT_TYPES: { value: EventType | 'todos'; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'live', label: 'Live' },
  { value: 'aula', label: 'Aula' },
  { value: 'clube', label: 'Clube' },
  { value: 'desafio', label: 'Desafio' },
  { value: 'encontro', label: 'Encontro' },
  { value: 'publicacao', label: 'Publicação' },
]

const STATUS_LABEL: Record<string, string> = {
  ao_vivo: '● AO VIVO',
  agendado: 'agendado',
  encerrado: 'encerrado',
  cancelado: 'cancelado',
  ativo: 'agendado',
  previsto: 'previsto',
}

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string; google?: string; error?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { tipo, google: googleParam, error: errorParam } = await searchParams
  const activeType = (tipo && tipo !== 'todos') ? tipo as EventType : null
  const now = new Date().toISOString()

  const [
    { data: rawEvents },
    { data: rawClub },
    { data: rawChallenges },
  ] = await Promise.all([
    supabase.from('events').select('*').order('start_datetime', { ascending: true }),
    supabase.from('book_club_cycles')
      .select('id, title, meeting_date, meeting_link, meeting_description, status')
      .not('meeting_date', 'is', null),
    supabase.from('challenges')
      .select('id, title, meeting_date, meeting_link, status')
      .not('meeting_date', 'is', null),
  ])

  const allEvents: AgendaEvent[] = [
    ...(rawEvents ?? []).map((ev: any) => ({
      id: ev.id as string,
      title: ev.title as string,
      description: ev.description as string | null,
      event_type: ev.event_type as EventType,
      start_datetime: ev.start_datetime as string,
      end_datetime: ev.end_datetime as string | null,
      meeting_url: ev.meeting_url as string | null,
      status: ev.status as string,
      source: 'events' as const,
      source_href: null,
    })),
    ...(rawClub ?? []).map((c: any) => ({
      id: `clube-${c.id}`,
      title: `Encontro: ${c.title}`,
      description: (c.meeting_description as string | null) ?? null,
      event_type: 'clube' as EventType,
      start_datetime: toDatetime(c.meeting_date as string),
      end_datetime: null,
      meeting_url: (c.meeting_link as string | null) ?? null,
      status: (c.status as string) === 'encerrado' ? 'encerrado' : (c.status as string) === 'previsto' ? 'previsto' : 'agendado',
      source: 'clube' as const,
      source_href: '/clube-da-leitura',
    })),
    ...(rawChallenges ?? []).map((c: any) => ({
      id: `desafio-${c.id}`,
      title: `Encerramento: ${c.title}`,
      description: null,
      event_type: 'desafio' as EventType,
      start_datetime: toDatetime(c.meeting_date as string),
      end_datetime: null,
      meeting_url: (c.meeting_link as string | null) ?? null,
      status: (c.status as string) === 'encerrado' ? 'encerrado' : (c.status as string) === 'previsto' ? 'previsto' : 'agendado',
      source: 'desafio' as const,
      source_href: '/desafio-mensal',
    })),
  ]

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const filtered = activeType ? allEvents.filter(ev => ev.event_type === activeType) : allEvents
  const upcoming = filtered
    .filter(ev => ev.start_datetime >= now)
    .sort((a, b) => a.start_datetime.localeCompare(b.start_datetime))
  const past = filtered
    .filter(ev => ev.start_datetime < now && ev.start_datetime >= thirtyDaysAgo)
    .sort((a, b) => b.start_datetime.localeCompare(a.start_datetime))

  const isGCalConnected = !!(user.user_metadata?.google_calendar as any)?.access_token

  function EventCard({ ev, isPast = false }: { ev: AgendaEvent; isPast?: boolean }) {
    const date = new Date(ev.start_datetime)
    const endDate = ev.end_datetime ? new Date(ev.end_datetime) : null
    const weekday = date.toLocaleString('pt-BR', { weekday: 'long' })
    const fullDate = date.toLocaleString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
    const time = date.toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    const gcalUrl = buildGoogleCalendarUrl(ev)
    const statusLabel = STATUS_LABEL[ev.status] ?? ev.status

    return (
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--r)', overflow: 'hidden', opacity: isPast ? 0.65 : 1 }}>
        <div style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{ev.event_type}</span>
            <span style={{
              fontSize: '0.7rem', fontWeight: 700,
              color: ev.status === 'ao_vivo' ? 'var(--red)' : isPast ? 'var(--muted)' : 'var(--green)',
              background: 'var(--card-2)', padding: '2px 8px', borderRadius: '99px', whiteSpace: 'nowrap',
            }}>
              {statusLabel}
            </span>
          </div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', letterSpacing: '0.03em', marginBottom: '0.5rem' }}>{ev.title}</h3>
          {ev.description && (
            <p style={{ fontSize: '0.82rem', color: 'var(--muted)', marginBottom: '0.75rem', lineHeight: 1.5 }}>{ev.description}</p>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.8rem', color: 'var(--muted)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Calendar size={13} />
              <span style={{ textTransform: 'capitalize' }}>{weekday}, {fullDate}</span>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Clock size={13} />
              {time}{endDate ? ` – ${endDate.toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` : ''}
            </span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.75rem', alignItems: 'center' }}>
            {ev.meeting_url && !isPast && (
              <a
                href={ev.meeting_url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', width: 'fit-content' }}
              >
                <Video size={13} /> Entrar na call <ExternalLink size={11} />
              </a>
            )}
            {!isPast && (
              <a
                href={gcalUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                  fontSize: '0.75rem', color: 'var(--muted)', textDecoration: 'none',
                  padding: '0.3rem 0.7rem', border: '1px solid var(--border)', borderRadius: '99px',
                }}
              >
                <Calendar size={12} /> Google Agenda
              </a>
            )}
            {ev.source_href && (
              <Link
                href={ev.source_href}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: 'var(--muted)', textDecoration: 'none' }}
              >
                Ver detalhes <ExternalLink size={11} />
              </Link>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <span className="label">Comunidade</span>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', letterSpacing: '0.04em' }}>Agenda</h1>
      </div>

      {googleParam === 'connected' && (
        <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid var(--green)', borderRadius: 'var(--r)', padding: '0.75rem 1rem', marginBottom: '1.5rem', fontSize: '0.85rem', color: 'var(--green)' }}>
          Google Agenda conectado com sucesso!
        </div>
      )}
      {errorParam === 'google_cancelled' && (
        <div style={{ background: 'rgba(229,9,20,0.08)', border: '1px solid var(--red)', borderRadius: 'var(--r)', padding: '0.75rem 1rem', marginBottom: '1.5rem', fontSize: '0.85rem', color: 'var(--red)' }}>
          Conexão com Google Agenda cancelada.
        </div>
      )}
      {errorParam === 'google_token' && (
        <div style={{ background: 'rgba(229,9,20,0.08)', border: '1px solid var(--red)', borderRadius: 'var(--r)', padding: '0.75rem 1rem', marginBottom: '1.5rem', fontSize: '0.85rem', color: 'var(--red)' }}>
          Não foi possível conectar o Google Agenda. Tente novamente.
        </div>
      )}

      <GoogleCalendarSection initialConnected={isGCalConnected} />

      {/* Filtros */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
        {EVENT_TYPES.map(({ value, label }) => {
          const isActive = value === 'todos' ? !activeType : activeType === value
          return (
            <Link
              key={value}
              href={value === 'todos' ? '/agenda' : `/agenda?tipo=${value}`}
              style={{
                fontSize: '0.78rem', fontWeight: 700, padding: '0.35rem 0.85rem',
                borderRadius: '99px', textDecoration: 'none',
                border: `1px solid ${isActive ? 'var(--red)' : 'var(--border)'}`,
                background: isActive ? 'rgba(229,9,20,0.1)' : 'var(--card)',
                color: isActive ? 'var(--red)' : 'var(--muted)',
                transition: 'all 150ms',
              }}
            >
              {label}
            </Link>
          )
        })}
      </div>

      {upcoming.length > 0 ? (
        <section style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', letterSpacing: '0.04em', marginBottom: '1rem', color: 'var(--muted)' }}>
            Próximos eventos
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
            {upcoming.map(ev => <EventCard key={ev.id} ev={ev} />)}
          </div>
        </section>
      ) : (
        <div className="empty-state" style={{ marginBottom: '3rem' }}>
          <Calendar size={40} color="var(--muted)" />
          <p>Nenhum evento {activeType ? `do tipo "${activeType}"` : ''} agendado no momento.</p>
          <p style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Fique de olho — em breve novidades na agenda.</p>
        </div>
      )}

      {past.length > 0 && (
        <section>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', letterSpacing: '0.04em', marginBottom: '1rem', color: 'var(--muted)' }}>
            Eventos passados (últimos 30 dias)
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
            {past.map(ev => <EventCard key={ev.id} ev={ev} isPast />)}
          </div>
        </section>
      )}
    </div>
  )
}
