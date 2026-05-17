import { createClient } from '@/lib/supabase/server'
import { Search } from 'lucide-react'
import MemberActions from '@/components/admin/MemberActions'
import AddMemberModal from '@/components/admin/AddMemberModal'

export default async function AdminMembros({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>
}) {
  const { q, status } = await searchParams
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = supabase.from('users').select('*, user_xp_summary(total_xp, level)').order('created_at', { ascending: false })
  if (q) query = query.or(`name.ilike.%${q}%,email.ilike.%${q}%,nickname.ilike.%${q}%`)
  if (status) query = query.eq('status', status)
  const { data: members } = await query.limit(50)

  return (
    <div style={{ maxWidth: '1000px' }}>
      <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <span className="label">Gestão</span>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', letterSpacing: '0.04em', color: 'var(--text)' }}>
            Membros
          </h1>
        </div>
        <AddMemberModal />
      </div>

      <form method="GET" style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <Search size={14} color="var(--muted)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            name="q"
            defaultValue={q}
            placeholder="Buscar por nome, e-mail ou nick..."
            style={{
              width: '100%', background: 'var(--card-2)', border: '1px solid var(--border)',
              borderRadius: '8px', color: 'var(--text)', padding: '0.6rem 1rem 0.6rem 2.2rem',
              fontSize: '0.88rem', outline: 'none',
            }}
          />
        </div>
        {['ativo', 'inativo', 'bloqueado'].map(s => (
          <button
            key={s}
            name="status"
            value={s}
            type="submit"
            style={{
              padding: '0.4rem 0.9rem', borderRadius: '6px',
              border: `1px solid ${status === s ? 'var(--red)' : 'var(--border)'}`,
              background: status === s ? 'rgba(229,9,20,0.1)' : 'var(--card-2)',
              color: 'var(--text)', cursor: 'pointer', fontSize: '0.83rem', fontWeight: 600, textTransform: 'capitalize',
            }}
          >{s}</button>
        ))}
        <button name="status" value="" type="submit" style={{ padding: '0.4rem 0.9rem', borderRadius: '6px', border: `1px solid ${!status ? 'var(--red)' : 'var(--border)'}`, background: !status ? 'rgba(229,9,20,0.1)' : 'var(--card-2)', color: 'var(--text)', cursor: 'pointer', fontSize: '0.83rem', fontWeight: 600 }}>Todos</button>
      </form>

      {members && members.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {members.map((m: any) => (
            <div
              key={m.id}
              style={{
                display: 'flex', alignItems: 'center', gap: '1rem',
                background: 'var(--card)', border: '1px solid var(--border)',
                borderRadius: 'var(--r)', padding: '0.9rem 1.1rem',
              }}
            >
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: '0.9rem', color: 'white', flexShrink: 0 }}>
                {(m.nickname || m.name || 'R').charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <strong style={{ display: 'block', fontSize: '0.9rem' }}>{m.nickname || m.name || '—'}</strong>
                <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>{m.email}</span>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexShrink: 0 }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gold)' }}>
                    {m.user_xp_summary?.[0]?.total_xp ?? 0} XP
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>
                    {m.role}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', fontSize: '0.68rem' }}>
                  {m.onboarding_completed_at && <span style={{ color: 'var(--green)' }}>✓ Onboarding</span>}
                  {m.anamnesis_completed_at && <span style={{ color: 'var(--green)' }}>✓ Anamnese</span>}
                </div>
                <span
                  style={{
                    padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.68rem', fontWeight: 800,
                    textTransform: 'uppercase', letterSpacing: '0.06em',
                    background: m.status === 'ativo' ? 'rgba(37,211,102,0.12)' : m.status === 'bloqueado' ? 'rgba(255,107,107,0.12)' : 'var(--card-2)',
                    color: m.status === 'ativo' ? 'var(--green)' : m.status === 'bloqueado' ? '#ff6b6b' : 'var(--muted)',
                  }}
                >
                  {m.status}
                </span>
                <MemberActions memberId={m.id} memberEmail={m.email} currentStatus={m.status} currentRole={m.role} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <p>Nenhum membro encontrado.</p>
        </div>
      )}
    </div>
  )
}
