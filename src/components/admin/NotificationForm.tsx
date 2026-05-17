'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Send } from 'lucide-react'

export default function NotificationForm() {
  const router = useRouter()
  const supabase = createClient()
  const [form, setForm] = useState({
    target: 'all' as 'all' | 'single',
    user_id: '',
    notification_type: 'sistema',
    title: '',
    body: '',
  })
  const [members, setMembers] = useState<any[]>([])
  const [sending, setSending] = useState(false)
  const [loadingMembers, setLoadingMembers] = useState(false)

  async function loadMembers() {
    if (members.length > 0) return
    setLoadingMembers(true)
    const { data } = await supabase.from('users').select('id, name, nickname').eq('status', 'ativo').order('name')
    setMembers(data ?? [])
    setLoadingMembers(false)
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    setSending(true)
    const now = new Date().toISOString()
    if (form.target === 'all') {
      const { data: allUsers } = await supabase.from('users').select('id').eq('status', 'ativo')
      if (allUsers && allUsers.length > 0) {
        const inserts = allUsers.map((u: any) => ({
          user_id: u.id,
          notification_type: form.notification_type,
          title: form.title,
          body: form.body,
          is_read: false,
          status: 'enviada',
          sent_at: now,
          created_at: now,
        }))
        await supabase.from('notifications').insert(inserts as any)
      }
    } else {
      await supabase.from('notifications').insert({
        user_id: form.user_id,
        notification_type: form.notification_type,
        title: form.title,
        body: form.body,
        is_read: false,
        status: 'enviada',
        sent_at: now,
        created_at: now,
      } as any)
    }
    router.push('/admin/notificacoes')
    router.refresh()
  }

  return (
    <div style={{ maxWidth: '600px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', display: 'flex' }}><ArrowLeft size={20} /></button>
        <div><span className="label">Admin</span><h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', letterSpacing: '0.04em' }}>Nova notificação</h1></div>
      </div>
      <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <label className="field">Destinatário
            <select value={form.target} onChange={e => { setForm(f => ({ ...f, target: e.target.value as 'all' | 'single', user_id: '' })); if (e.target.value === 'single') loadMembers() }}>
              <option value="all">Todos os membros</option>
              <option value="single">Membro específico</option>
            </select>
          </label>
          <label className="field">Tipo
            <select value={form.notification_type} onChange={e => setForm(f => ({ ...f, notification_type: e.target.value }))}>
              <option value="sistema">Sistema</option>
              <option value="conteudo">Conteúdo</option>
              <option value="desafio">Desafio</option>
              <option value="clube">Clube da leitura</option>
              <option value="selo">Conquista</option>
            </select>
          </label>
        </div>
        {form.target === 'single' && (
          <label className="field">Selecionar membro *
            <select value={form.user_id} onChange={e => setForm(f => ({ ...f, user_id: e.target.value }))} required>
              <option value="">{loadingMembers ? 'Carregando...' : 'Selecione um membro'}</option>
              {members.map((m: any) => (
                <option key={m.id} value={m.id}>{m.nickname || m.name}</option>
              ))}
            </select>
          </label>
        )}
        <label className="field">Título *<input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required placeholder="Ex: Novo conteúdo disponível!" /></label>
        <label className="field">Mensagem *<textarea value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} required placeholder="Descreva a notificação..." /></label>
        <div style={{ background: 'var(--card-2)', borderRadius: 'var(--r)', padding: '0.75rem 1rem', fontSize: '0.8rem', color: 'var(--muted)' }}>
          {form.target === 'all' ? 'Esta notificação será enviada para todos os membros ativos.' : form.user_id ? 'Notificação será enviada apenas para o membro selecionado.' : 'Selecione um membro para continuar.'}
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn-primary" type="submit" disabled={sending || (form.target === 'single' && !form.user_id)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Send size={14} />{sending ? 'Enviando...' : 'Enviar notificação'}</button>
          <button type="button" className="btn-ghost" onClick={() => router.back()}>Cancelar</button>
        </div>
      </form>
    </div>
  )
}
