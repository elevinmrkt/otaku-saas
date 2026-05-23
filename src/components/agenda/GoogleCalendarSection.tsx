'use client'
import { useEffect, useState } from 'react'
import { Calendar, ExternalLink, X } from 'lucide-react'

type GCalEvent = {
  id: string
  summary?: string
  start?: { dateTime?: string; date?: string }
  end?: { dateTime?: string; date?: string }
  htmlLink?: string
  hangoutLink?: string
}

type State = {
  loading: boolean
  connected: boolean
  events: GCalEvent[]
  error: string | null
}

export function GoogleCalendarSection({ initialConnected }: { initialConnected: boolean }) {
  const [state, setState] = useState<State>({
    loading: initialConnected,
    connected: initialConnected,
    events: [],
    error: null,
  })

  useEffect(() => {
    if (!initialConnected) return
    fetch('/api/google-calendar/events')
      .then(r => r.json())
      .then((data: { connected: boolean; events: GCalEvent[]; error?: string }) => {
        setState({ loading: false, connected: data.connected, events: data.events ?? [], error: data.error ?? null })
      })
      .catch(() => setState(s => ({ ...s, loading: false, error: 'network' })))
  }, [initialConnected])

  async function disconnect() {
    await fetch('/api/google-calendar/disconnect', { method: 'POST' })
    setState({ loading: false, connected: false, events: [], error: null })
  }

  const cardStyle: React.CSSProperties = {
    background: 'var(--card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--r)',
    padding: '1.25rem',
    marginBottom: '2rem',
  }

  if (state.loading) {
    return (
      <div style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--muted)' }}>
        <span style={{ fontSize: '0.85rem' }}>Carregando sua agenda Google...</span>
      </div>
    )
  }

  if (!state.connected) {
    return (
      <div style={{ ...cardStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', letterSpacing: '0.04em', marginBottom: '0.25rem' }}>
            Minha Agenda Google
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--muted)', margin: 0 }}>
            {state.error === 'reconnect'
              ? 'Sessão expirada. Conecte novamente para ver seus compromissos.'
              : 'Conecte para ver seus compromissos pessoais e adicionar eventos ao Google Agenda.'}
          </p>
        </div>
        <a
          href="/api/google-calendar/connect"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            fontSize: '0.82rem', fontWeight: 700, padding: '0.5rem 1.1rem',
            borderRadius: 'var(--r)', background: 'var(--card-2)',
            border: '1px solid var(--border)', color: 'var(--text)',
            textDecoration: 'none', whiteSpace: 'nowrap',
          }}
        >
          <Calendar size={14} />
          Conectar Google Agenda
        </a>
      </div>
    )
  }

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', letterSpacing: '0.04em' }}>
          Minha Agenda Google
        </div>
        <button
          onClick={disconnect}
          style={{
            fontSize: '0.75rem', color: 'var(--muted)', background: 'none',
            border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem',
          }}
        >
          <X size={12} /> Desconectar
        </button>
      </div>

      {state.error === 'fetch_failed' && (
        <p style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>Não foi possível carregar sua agenda agora. Tente mais tarde.</p>
      )}

      {state.events.length === 0 && !state.error ? (
        <p style={{ fontSize: '0.85rem', color: 'var(--muted)', margin: 0 }}>Nenhum compromisso nos próximos 30 dias.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {state.events.map(ev => {
            const startRaw = ev.start?.dateTime ?? ev.start?.date
            const date = startRaw ? new Date(startRaw) : null
            const isAllDay = !ev.start?.dateTime
            const link = ev.hangoutLink ?? ev.htmlLink

            return (
              <div
                key={ev.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: '0.6rem 0.75rem', background: 'var(--card-2)',
                  borderRadius: 'calc(var(--r) / 1.5)',
                }}
              >
                {date && (
                  <div style={{ minWidth: '2.5rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.62rem', color: 'var(--muted)', textTransform: 'uppercase' }}>
                      {date.toLocaleString('pt-BR', { month: 'short' })}
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, lineHeight: 1 }}>
                      {date.getDate()}
                    </div>
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {ev.summary ?? '(sem título)'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                    {date && !isAllDay
                      ? date.toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                      : 'Dia inteiro'}
                  </div>
                </div>
                {link && (
                  <a
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'var(--muted)', display: 'flex', alignItems: 'center' }}
                  >
                    <ExternalLink size={13} />
                  </a>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
