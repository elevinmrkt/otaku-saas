import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'
import { Plus, Edit } from 'lucide-react'
import EventForm from '@/components/admin/EventForm'
import DeleteButton from '@/components/admin/DeleteButton'

async function deleteEvento(id: string) {
  'use server'
  const supabase = await createClient()
  await supabase.from('events').delete().eq('id', id)
  revalidatePath('/admin/agenda')
}

export default async function AdminAgenda({
  searchParams,
}: {
  searchParams: Promise<{ acao?: string; id?: string }>
}) {
  const { acao, id } = await searchParams
  const supabase = await createClient()
  const { data: events } = await supabase.from('events').select('*').order('start_datetime', { ascending: true })

  let editEvent = null
  if (acao === 'editar' && id) {
    const { data } = await supabase.from('events').select('*').eq('id', id).single()
    editEvent = data
  }
  if (acao === 'novo' || editEvent) return <EventForm event={editEvent} />

  return (
    <div style={{ maxWidth: '900px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
        <div><span className="label">Gestão</span><h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', letterSpacing: '0.04em' }}>Agenda de Eventos</h1></div>
        <Link href="/admin/agenda?acao=novo" className="btn-primary"><Plus size={14} />Novo evento</Link>
      </div>
      {events && events.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {events.map((ev: any) => {
            const date = new Date(ev.start_datetime)
            const past = date < new Date()
            return (
              <div key={ev.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '0.9rem 1.1rem' }}>
                <div style={{ minWidth: '50px', textAlign: 'center', background: 'var(--card-2)', borderRadius: '6px', padding: '0.4rem' }}>
                  <div style={{ fontSize: '1.2rem', fontFamily: 'var(--font-display)', color: past ? 'var(--muted)' : 'var(--red)' }}>{date.getDate()}</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--muted)', textTransform: 'uppercase' }}>{date.toLocaleString('pt-BR', { month: 'short' })}</div>
                </div>
                <div style={{ flex: 1 }}>
                  <strong style={{ display: 'block', fontSize: '0.9rem', color: past ? 'var(--muted)' : 'inherit' }}>{ev.title}</strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{ev.event_type} · {date.toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit' })}{past ? ' · passado' : ''}</span>
                </div>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: ev.status === 'agendado' ? 'var(--green)' : 'var(--muted)', background: 'var(--card-2)', padding: '2px 8px', borderRadius: '99px' }}>{ev.status}</span>
                <Link href={`/admin/agenda?acao=editar&id=${ev.id}`} className="btn-ghost sm"><Edit size={13} />Editar</Link>
                <DeleteButton action={deleteEvento.bind(null, ev.id)} confirmMsg={`Apagar o evento "${ev.title}" permanentemente?`} />
              </div>
            )
          })}
        </div>
      ) : (
        <div className="empty-state"><p>Nenhum evento cadastrado.</p><Link href="/admin/agenda?acao=novo" className="btn-primary"><Plus size={14} />Criar primeiro evento</Link></div>
      )}
    </div>
  )
}
