import { createClient } from '@/lib/supabase/server'
import { Search } from 'lucide-react'
import MemberActions from '@/components/admin/MemberActions'
import AddMemberModal from '@/components/admin/AddMemberModal'
import { PLAN_LABELS, PLAN_COLORS } from '@/lib/plans'

export default async function AdminMembros({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; plan?: string }>
}) {
  const { q, status, plan } = await searchParams
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = supabase.from('users').select('*, user_xp_summary(total_xp, level)').order('created_at', { ascending: false })
  if (q) query = query.or(`name.ilike.%${q}%,email.ilike.%${q}%,nickname.ilike.%${q}%`)
  if (status) query = query.eq('status', status)
  if (plan) query = query.eq('plan', plan)
  const { data: members } = await query.limit(50)

  function filterHref(overrides: Record<string, string | undefined>) {
    const sp = new URLSearchParams()
    if (q) sp.set('q', q)
    if (status) sp.set('status', status)
    if (plan) sp.set('plan', plan)
    Object.entries(overrides).forEach(([k, v]) => { v ? sp.set(k, v) : sp.delete(k) })
    const s = sp.toString()
    return s ? `/admin/membros?${s}` : '/admin/membros'
  }

  const activeBtn = (active: boolean) => ({
    padding: '0.35rem 0.85rem', borderRadius: '6px', textDecoration: 'none',
    border: `1px solid ${active ? 'var(--red)' : 'var(--border)'}`,
    background: active ? 'rgba(229,9,20,0.10)' : 'var(--card-2)',
    color: 'var(--text)', fontSize: '0.82rem', fontWeight: 600 as const, display: 'inline-block',
  })

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

      {/* Busca */}
      <form method="GET" style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
        {status && <input type="hidden" name="status" value={status} />}
        {plan && <input type="hidden" name="plan" value={plan} />}
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
        <button className="btn-ghost" type="submit" style={{ minHeight: '40px', padding: '0 1rem' }}>Buscar</button>
      </form>

      {/* Filtro status */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: '0.72rem', color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginRight: '0.25rem' }}>Status:</span>
        <a href={filterHref({ status: undefined })} style={activeBtn(!status)}>Todos</a>
        {['ativo', 'inativo', 'bloqueado'].map(s => (
          <a key={s} href={filterHref({ status: s })} style={activeBtn(status === s)}>{s}</a>
        ))}
      </div>

      {/* Filtro plano */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: '0.72rem', color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginRight: '0.25rem' }}>Plano:</span>
        <a href={filterHref({ plan: undefined })} style={activeBtn(!plan)}>Todos</a>
        {['nenhum', 'mensal', 'protagonista'].map(p => (
          <a key={p} href={filterHref({ plan: p })} style={activeBtn(plan === p)}>{PLAN_LABELS[p]}</a>
        ))}
      </div>

      {members && members.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {members.map((m: any) => {
            const memberPlan: string = m.plan ?? 'nenhum'
            const planColors = PLAN_COLORS[memberPlan] ?? PLAN_COLORS.nenhum
            return (
              <div
                key={m.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: '1rem',
                  background: 'var(--card)', border: '1px solid var(--border)',
                  borderRadius: 'var(--r)', padding: '0.9rem 1.1rem',
                }}
              >
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: '0.9rem', color: 'white', flexShrink: 0, overflow: 'hidden' }}>
                  {m.avatar_url ? (
                    <img src={m.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    (m.nickname || m.name || 'R').charAt(0).toUpperCase()
                  )}
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
                    <div style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>{m.role}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', fontSize: '0.68rem' }}>
                    {m.onboarding_completed_at && <span style={{ color: 'var(--green)' }}>✓ Onboarding</span>}
                    {m.anamnesis_completed_at && <span style={{ color: 'var(--green)' }}>✓ Anamnese</span>}
                  </div>
                  {/* Badge plano */}
                  <span style={{
                    padding: '0.2rem 0.55rem', borderRadius: '4px', fontSize: '0.68rem', fontWeight: 800,
                    textTransform: 'uppercase', letterSpacing: '0.06em',
                    background: planColors.bg, color: planColors.color,
                  }}>
                    {PLAN_LABELS[memberPlan]}
                  </span>
                  {/* Badge status */}
                  <span style={{
                    padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.68rem', fontWeight: 800,
                    textTransform: 'uppercase', letterSpacing: '0.06em',
                    background: m.status === 'ativo' ? 'rgba(37,211,102,0.12)' : m.status === 'bloqueado' ? 'rgba(255,107,107,0.12)' : 'var(--card-2)',
                    color: m.status === 'ativo' ? 'var(--green)' : m.status === 'bloqueado' ? '#ff6b6b' : 'var(--muted)',
                  }}>
                    {m.status}
                  </span>
                  <MemberActions memberId={m.id} memberEmail={m.email} currentStatus={m.status} currentRole={m.role} currentPlan={memberPlan as any} />
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="empty-state">
          <p>Nenhum membro encontrado.</p>
        </div>
      )}
    </div>
  )
}
