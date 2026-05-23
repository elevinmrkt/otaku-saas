import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'
import { Plus, Edit } from 'lucide-react'
import ClubForm from '@/components/admin/ClubForm'
import DeleteButton from '@/components/admin/DeleteButton'

async function deleteClube(id: string) {
  'use server'
  const supabase = await createClient()
  await supabase.from('book_club_cycles').delete().eq('id', id)
  revalidatePath('/admin/clube')
}

export default async function AdminClube({
  searchParams,
}: {
  searchParams: Promise<{ acao?: string; id?: string }>
}) {
  const { acao, id } = await searchParams
  const supabase = await createClient()
  const { data: cycles } = await supabase.from('book_club_cycles').select('*').order('created_at', { ascending: false })

  let editCycle = null
  if (acao === 'editar' && id) {
    const [{ data }, { data: weekly_goals }, { data: materials }] = await Promise.all([
      supabase.from('book_club_cycles').select('*').eq('id', id).single(),
      supabase.from('club_weekly_goals').select('*').eq('cycle_id', id).order('week_number'),
      supabase.from('club_cycle_materials').select('*').eq('cycle_id', id).order('order_index'),
    ])
    editCycle = data ? { ...data, weekly_goals: weekly_goals ?? [], materials: materials ?? [] } : null
  }
  if (acao === 'novo' || editCycle) return <ClubForm cycle={editCycle} />

  return (
    <div style={{ maxWidth: '900px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
        <div>
          <span className="label">Gestão</span>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', letterSpacing: '0.04em' }}>Clube da Leitura</h1>
        </div>
        <Link href="/admin/clube?acao=novo" className="btn-primary"><Plus size={14} />Novo ciclo</Link>
      </div>
      {cycles && cycles.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {cycles.map((c: any) => (
            <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '0.9rem 1.1rem' }}>
              <div style={{ flex: 1 }}>
                <strong style={{ display: 'block', fontSize: '0.9rem' }}>{c.work_title}</strong>
                <span style={{ fontSize: '0.75rem', color: c.status === 'ativo' ? 'var(--green)' : 'var(--muted)', fontWeight: 700 }}>{c.status}</span>
              </div>
              {c.meeting_date && <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{new Date(c.meeting_date).toLocaleDateString('pt-BR')}</span>}
              <Link href={`/admin/clube?acao=editar&id=${c.id}`} className="btn-ghost sm"><Edit size={13} />Editar</Link>
              <DeleteButton action={deleteClube.bind(null, c.id)} confirmMsg={`Apagar o ciclo "${c.work_title}" permanentemente?`} />
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state"><p>Nenhum ciclo cadastrado.</p><Link href="/admin/clube?acao=novo" className="btn-primary"><Plus size={14} />Criar primeiro ciclo</Link></div>
      )}
    </div>
  )
}
