import { createClient } from '@/lib/supabase/server'

export default async function DebugPage() {
  const supabase = await createClient()

  const [
    { data: challenges, error: e1, count: c1 },
    { data: clubs, error: e2, count: c2 },
    { data: challengesTasks, error: e3 },
    { data: challengeActive, error: e4 },
    { data: clubActive, error: e5 },
  ] = await Promise.all([
    supabase.from('challenges').select('id, title, status, created_at', { count: 'exact' }).order('created_at', { ascending: false }).limit(10),
    supabase.from('book_club_cycles').select('id, work_title, status, created_at', { count: 'exact' }).order('created_at', { ascending: false }).limit(10),
    supabase.from('challenge_tasks').select('id, challenge_id, title, day_number').limit(10),
    supabase.from('challenges').select('*').in('status', ['ativo', 'previsto']).order('created_at', { ascending: false }).limit(1) as any,
    supabase.from('book_club_cycles').select('*').in('status', ['ativo', 'previsto']).order('created_at', { ascending: false }).limit(1) as any,
  ])

  const result = {
    challenges_all: { count: c1, error: e1?.message ?? null, data: challenges },
    book_club_cycles_all: { count: c2, error: e2?.message ?? null, data: clubs },
    challenge_tasks: { error: e3?.message ?? null, data: challengesTasks },
    challenge_active_filter: { error: e4?.message ?? null, data: challengeActive },
    club_active_filter: { error: e5?.message ?? null, data: clubActive },
  }

  return (
    <div style={{ maxWidth: '900px', padding: '2rem' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', marginBottom: '1.5rem' }}>
        Debug — Estado do banco
      </h1>
      <p style={{ color: 'var(--muted)', marginBottom: '1rem', fontSize: '0.85rem' }}>
        Página temporária de diagnóstico. Remove após resolver o problema.
      </p>
      <pre style={{
        background: 'var(--card-2)', border: '1px solid var(--border)',
        borderRadius: 'var(--r)', padding: '1.5rem',
        fontSize: '0.78rem', color: 'var(--text)', overflowX: 'auto',
        whiteSpace: 'pre-wrap', wordBreak: 'break-all',
      }}>
        {JSON.stringify(result, null, 2)}
      </pre>
    </div>
  )
}
