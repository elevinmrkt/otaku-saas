'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Trash2 } from 'lucide-react'

export default function DeleteContentButton({ id, title }: { id: string; title: string }) {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (!confirm(`Excluir "${title}"? Esta ação não pode ser desfeita.`)) return
    setLoading(true)
    await supabase.from('media_assets').delete().eq('content_item_id', id)
    await supabase.from('trail_module_contents').delete().eq('content_item_id', id)
    await supabase.from('content_items').delete().eq('id', id)
    router.refresh()
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      title="Excluir conteúdo"
      style={{
        background: 'none', border: '1px solid var(--border)', cursor: loading ? 'default' : 'pointer',
        color: 'var(--muted)', padding: '0.3rem 0.5rem', borderRadius: '6px',
        display: 'flex', alignItems: 'center', transition: 'all 150ms',
        opacity: loading ? 0.5 : 1,
      }}
      onMouseEnter={e => { if (!loading) { (e.currentTarget as HTMLElement).style.borderColor = '#ff6b6b'; (e.currentTarget as HTMLElement).style.color = '#ff6b6b' } }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.color = 'var(--muted)' }}
    >
      <Trash2 size={13} />
    </button>
  )
}
