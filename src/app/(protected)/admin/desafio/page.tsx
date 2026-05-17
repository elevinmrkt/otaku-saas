import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, Edit } from 'lucide-react'
import ChallengeAdminForm from '@/components/admin/ChallengeAdminForm'

export default async function AdminDesafio({
  searchParams,
}: {
  searchParams: Promise<{ acao?: string; id?: string }>
}) {
  const { acao, id } = await searchParams
  const supabase = await createClient()
  const { data: challenges } = await supabase.from('challenges').select('*').order('created_at', { ascending: false })

  let editChallenge = null
  if (acao === 'editar' && id) {
    const { data: challenge } = await supabase.from('challenges').select('*').eq('id', id).single()
    const { data: tasks } = await supabase.from('challenge_tasks').select('*').eq('challenge_id', id).order('day_number')
    editChallenge = { ...challenge, tasks: tasks ?? [] }
  }
  if (acao === 'novo' || editChallenge) return <ChallengeAdminForm challenge={editChallenge} />

  return (
    <div style={{ maxWidth: '900px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
        <div><span className="label">Gestão</span><h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', letterSpacing: '0.04em' }}>Desafio Mensal</h1></div>
        <Link href="/admin/desafio?acao=novo" className="btn-primary"><Plus size={14} />Novo desafio</Link>
      </div>
      {challenges && challenges.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {challenges.map((c: any) => (
            <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '0.9rem 1.1rem' }}>
              <div style={{ flex: 1 }}>
                <strong style={{ display: 'block', fontSize: '0.9rem' }}>{c.title}</strong>
                <span style={{ fontSize: '0.75rem', color: c.status === 'ativo' ? 'var(--green)' : 'var(--muted)', fontWeight: 700 }}>{c.status} · {c.duration_days} dias</span>
              </div>
              <Link href={`/admin/desafio?acao=editar&id=${c.id}`} className="btn-ghost sm"><Edit size={13} />Editar</Link>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state"><p>Nenhum desafio cadastrado.</p><Link href="/admin/desafio?acao=novo" className="btn-primary"><Plus size={14} />Criar primeiro desafio</Link></div>
      )}
    </div>
  )
}
