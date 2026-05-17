'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const GOALS = ['Autoconhecimento', 'Disciplina', 'Filosofia', 'Psicologia', 'Neurociência', 'Leitura guiada', 'Pertencimento', 'Rotina', 'Coragem', 'Sentido']
const DIFFICULTIES = ['Ansiedade', 'Procrastinação', 'Culpa', 'Falta de constância', 'Isolamento', 'Confusão emocional', 'Falta de direção', 'Excesso de comparação', 'Medo de agir']
const FORMATS = ['Vídeo', 'Áudio', 'Podcast', 'PDF', 'Texto curto', 'Encontro ao vivo', 'Discussão em grupo']
const TIMES = ['30 minutos', '1 hora', '2 horas', '3 horas ou mais']
const TRAILS = ['Filosofia', 'Neurociência', 'Filosofia prática', 'Psicologia aplicada', 'Estoicismo', 'Animes e personagens', 'Mangás e obras']

export default function AnamesePage() {
  const router = useRouter()
  const supabase = createClient()
  const [form, setForm] = useState({
    main_goal: '',
    main_difficulty: '',
    preferred_format: '',
    weekly_availability: '',
    initial_trail: '',
    reference_work_or_character: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function pick(field: keyof typeof form, value: string) {
    setForm(f => ({ ...f, [field]: value }))
    setError('')
  }

  function ChoiceGroup({ label, field, options }: { label: string; field: keyof typeof form; options: string[] }) {
    return (
      <div style={{ marginBottom: '1.5rem' }}>
        <p style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>
          {label}
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {options.map(opt => (
            <button
              key={opt}
              type="button"
              onClick={() => pick(field, opt)}
              style={{
                padding: '0.4rem 0.9rem', borderRadius: '6px',
                border: `1px solid ${form[field] === opt ? 'var(--red)' : 'var(--border)'}`,
                background: form[field] === opt ? 'rgba(229,9,20,0.1)' : 'var(--card-2)',
                color: form[field] === opt ? 'var(--text)' : 'var(--muted)',
                cursor: 'pointer', fontSize: '0.83rem', fontWeight: 600,
                transition: 'all 150ms',
              }}
            >{opt}</button>
          ))}
        </div>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.main_goal || !form.main_difficulty || !form.initial_trail) {
      setError('Preencha os campos obrigatórios: objetivo, dificuldade e trilha inicial.')
      return
    }
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const now = new Date().toISOString()
    await Promise.all([
      supabase.from('anamnesis_responses').upsert({ user_id: user.id, ...form, created_at: now, updated_at: now }, { onConflict: 'user_id' }),
      supabase.from('users').update({ anamnesis_completed_at: now }).eq('id', user.id),
      supabase.from('user_xp_summary').upsert({ user_id: user.id, total_xp: 0, level: 1, current_streak: 0, updated_at: now }, { onConflict: 'user_id' }),
    ])
    router.push('/home')
    router.refresh()
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        padding: 'var(--pad)',
        paddingTop: '6rem',
        display: 'flex', justifyContent: 'center',
      }}
    >
      <div style={{ width: '100%', maxWidth: '640px', animation: 'slide-up 400ms ease both' }}>
        <span className="label">Mapa inicial do protagonista</span>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2rem, 5vw, 3rem)',
            letterSpacing: '0.04em', lineHeight: 1.05, color: 'var(--text)',
            marginBottom: '0.75rem',
          }}
        >
          Antes do mapa,<br />precisamos entender<br />seu terreno.
        </h1>
        <p style={{ color: 'var(--muted)', marginBottom: '2.5rem', maxWidth: '440px' }}>
          Esta não é uma diagnose clínica. É um mapa inicial para personalizar sua jornada na Guilda.
        </p>

        <form onSubmit={handleSubmit}>
          <ChoiceGroup label="O que você busca na comunidade? *" field="main_goal" options={GOALS} />
          <ChoiceGroup label="Qual área pesa mais hoje? *" field="main_difficulty" options={DIFFICULTIES} />
          <ChoiceGroup label="Qual formato você prefere?" field="preferred_format" options={FORMATS} />
          <ChoiceGroup label="Quanto tempo por semana pretende dedicar?" field="weekly_availability" options={TIMES} />
          <ChoiceGroup label="Qual trilha inicial você quer seguir? *" field="initial_trail" options={TRAILS} />

          <div style={{ marginBottom: '1.5rem' }}>
            <label className="field">
              Qual personagem ou obra representa seu momento atual?
              <input
                type="text"
                value={form.reference_work_or_character}
                onChange={e => setForm(f => ({ ...f, reference_work_or_character: e.target.value }))}
                placeholder="Thorfinn, Berserk, Vinland Saga..."
              />
            </label>
          </div>

          {error && <p className="error-text">{error}</p>}

          <button
            className="btn-primary"
            type="submit"
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }}
          >
            {loading ? 'Liberando...' : 'Liberar minha home →'}
          </button>
        </form>
      </div>
    </main>
  )
}
