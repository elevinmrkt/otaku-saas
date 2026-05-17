import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, Edit } from 'lucide-react'
import GroupForm from '@/components/admin/GroupForm'

export default async function AdminGrupos({
  searchParams,
}: {
  searchParams: Promise<{ acao?: string; id?: string }>
}) {
  const { acao, id } = await searchParams
  const supabase = await createClient()
  const { data: groups } = await supabase.from('community_groups').select('*').order('created_at', { ascending: false })

  let editGroup = null
  if (acao === 'editar' && id) {
    const { data } = await supabase.from('community_groups').select('*').eq('id', id).single()
    editGroup = data
  }
  if (acao === 'novo' || editGroup) return <GroupForm group={editGroup} />

  return (
    <div style={{ maxWidth: '900px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
        <div><span className="label">Gestão</span><h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', letterSpacing: '0.04em' }}>Grupos da Comunidade</h1></div>
        <Link href="/admin/grupos?acao=novo" className="btn-primary"><Plus size={14} />Novo grupo</Link>
      </div>
      {groups && groups.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {groups.map((g: any) => (
            <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '0.9rem 1.1rem' }}>
              <div style={{ flex: 1 }}>
                <strong style={{ display: 'block', fontSize: '0.9rem' }}>{g.title}</strong>
                <span style={{ fontSize: '0.75rem', color: g.status === 'ativo' ? 'var(--green)' : 'var(--muted)', fontWeight: 700 }}>{g.status} · {g.group_type}</span>
              </div>
              <Link href={`/admin/grupos?acao=editar&id=${g.id}`} className="btn-ghost sm"><Edit size={13} />Editar</Link>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state"><p>Nenhum grupo cadastrado.</p><Link href="/admin/grupos?acao=novo" className="btn-primary"><Plus size={14} />Criar primeiro grupo</Link></div>
      )}
    </div>
  )
}
