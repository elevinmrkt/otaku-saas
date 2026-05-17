import { createClient } from '@/lib/supabase/server'
import { Calendar, Video, Clock, ExternalLink } from 'lucide-react'

export default async function AgendaPage() {
  const supabase = await createClient()
  const now = new Date().toISOString()

  const [{ data: upcoming }, { data: past }] = await Promise.all([
    supabase.from('events').select('*').gte('start_datetime', now).order('start_datetime', { ascending: true }),
    supabase.from('events').select('*').lt('start_datetime', now).order('start_datetime', { ascending: false }).limit(10),
  ])

  function EventCard({ ev, isPast = false }: { ev: any; isPast?: boolean }) {
    const date = new Date(ev.start_datetime)
    const endDate = ev.end_datetime ? new Date(ev.end_datetime) : null
    const weekday = date.toLocaleString('pt-BR', { weekday: 'long' })
    const fullDate = date.toLocaleString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
    const time = date.toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit' })

    return (
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--r)', overflow: 'hidden', opacity: isPast ? 0.65 : 1 }}>
        <div style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{ev.event_type}</span>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: ev.status === 'ao_vivo' ? 'var(--red)' : isPast ? 'var(--muted)' : 'var(--green)', background: 'var(--card-2)', padding: '2px 8px', borderRadius: '99px', whiteSpace: 'nowrap' }}>
              {ev.status === 'ao_vivo' ? '● AO VIVO' : ev.status}
            </span>
          </div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', letterSpacing: '0.03em', marginBottom: '0.5rem' }}>{ev.title}</h3>
          {ev.description && <p style={{ fontSize: '0.82rem', color: 'var(--muted)', marginBottom: '0.75rem', lineHeight: 1.5 }}>{ev.description}</p>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.8rem', color: 'var(--muted)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Calendar size={13} />
              <span style={{ textTransform: 'capitalize' }}>{weekday}, {fullDate}</span>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Clock size={13} />
              {time}{endDate ? ` – ${endDate.toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` : ''}
            </span>
            {ev.meeting_url && !isPast && (
              <a href={ev.meeting_url} target="_blank" rel="noopener noreferrer" className="btn-ghost sm" style={{ marginTop: '0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', width: 'fit-content' }}>
                <Video size={13} />Entrar no evento <ExternalLink size={11} />
              </a>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <span className="label">Comunidade</span>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', letterSpacing: '0.04em' }}>Agenda</h1>
      </div>

      {upcoming && upcoming.length > 0 ? (
        <section style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', letterSpacing: '0.04em', marginBottom: '1rem', color: 'var(--muted)' }}>Próximos eventos</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
            {upcoming.map((ev: any) => <EventCard key={ev.id} ev={ev} />)}
          </div>
        </section>
      ) : (
        <div className="empty-state" style={{ marginBottom: '3rem' }}>
          <Calendar size={40} color="var(--muted)" />
          <p>Nenhum evento agendado no momento.</p>
          <p style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Fique de olho — em breve novidades na agenda.</p>
        </div>
      )}

      {past && past.length > 0 && (
        <section>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', letterSpacing: '0.04em', marginBottom: '1rem', color: 'var(--muted)' }}>Eventos passados</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
            {past.map((ev: any) => <EventCard key={ev.id} ev={ev} isPast />)}
          </div>
        </section>
      )}
    </div>
  )
}
