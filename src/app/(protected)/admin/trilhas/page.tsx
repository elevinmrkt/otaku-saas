import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, Edit } from 'lucide-react'
import TrailForm from '@/components/admin/TrailForm'
import TrailModulesEditor from '@/components/admin/TrailModulesEditor'

export default async function AdminTrilhas({
  searchParams,
}: {
  searchParams: Promise<{ acao?: string; id?: string }>
}) {
  const { acao, id } = await searchParams
  const supabase = await createClient()

  const { data: trails } = await supabase.from('trails').select('*').order('order_index')

  let editTrail = null
  if (acao === 'editar' && id) {
    const { data } = await supabase.from('trails').select('*').eq('id', id).single()
    editTrail = data
  }

  if (acao === 'novo') {
    return <TrailForm trail={null} />
  }

  if (editTrail) {
    const [{ data: modules }, { data: allContent }] = await Promise.all([
      supabase
        .from('trail_modules')
        .select('id, title, order_index, trail_module_contents(id, content_item_id, order_index, content_items(id, title, content_type, thumbnail_url, status))')
        .eq('trail_id', id!)
        .order('order_index'),
      supabase
        .from('content_items')
        .select('id, title, content_type, thumbnail_url, status')
        .eq('status', 'publicado')
        .order('title'),
    ])
    return (
      <div style={{ maxWidth: '900px' }}>
        <TrailForm trail={editTrail} />
        <TrailModulesEditor
          trailId={editTrail.id}
          initialModules={(modules ?? []) as any}
          allContent={(allContent ?? []) as any}
        />
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '900px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
        <div>
          <span className="label">Gestão</span>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', letterSpacing: '0.04em', color: 'var(--text)' }}>Trilhas</h1>
        </div>
        <Link href="/admin/trilhas?acao=novo" className="btn-primary">
          <Plus size={14} />
          Nova trilha
        </Link>
      </div>

      {trails && trails.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {trails.map((t: any) => (
            <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '0.9rem 1.1rem' }}>
              {t.thumbnail_url && <img src={t.thumbnail_url} alt="" style={{ width: '60px', height: '40px', objectFit: 'cover', borderRadius: '4px', flexShrink: 0 }} />}
              <div style={{ flex: 1 }}>
                <strong style={{ display: 'block', fontSize: '0.9rem' }}>{t.title}</strong>
                <span style={{ fontSize: '0.75rem', color: t.status === 'publicado' ? 'var(--green)' : 'var(--muted)', fontWeight: 700 }}>{t.status}</span>
              </div>
              <Link href={`/admin/trilhas?acao=editar&id=${t.id}`} className="btn-ghost sm">
                <Edit size={13} /> Editar
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <p>Nenhuma trilha cadastrada.</p>
          <Link href="/admin/trilhas?acao=novo" className="btn-primary"><Plus size={14} />Criar primeira trilha</Link>
        </div>
      )}
    </div>
  )
}
