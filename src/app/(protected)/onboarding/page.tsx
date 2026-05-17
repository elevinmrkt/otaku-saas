'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const STEPS = [
  {
    id: 'welcome',
    title: 'Bem-vindo à Guilda.',
    desc: 'Animes, mangás, filosofia e psicologia deixam de ser consumo. Aqui, eles viram jornada, prática e combate interno.',
    type: 'info',
  },
  {
    id: 'identity',
    title: 'Como devemos te chamar?',
    type: 'fields',
  },
  {
    id: 'who',
    title: 'Quem somos.',
    cards: [
      { icon: '⚔️', title: 'Comunidade de leitura e prática', desc: 'Não acumulamos conhecimento. Praticamos.' },
      { icon: '🪞', title: 'Usamos histórias como espelho', desc: 'Personagens revelam o que a vida às vezes oculta.' },
      { icon: '🎯', title: 'O protagonista és tu', desc: 'Não existe espectador aqui. Só quem age.' },
    ],
    type: 'cards',
  },
  {
    id: 'values',
    title: 'Nossos valores.',
    values: [
      'Disciplina sem pose',
      'Profundidade sem arrogância',
      'Comunidade sem bagunça',
      'Filosofia aplicada à vida',
      'Cultura nerd tratada com seriedade',
    ],
    type: 'values',
  },
  {
    id: 'intent',
    title: 'O que te trouxe até aqui?',
    options: ['Autoconhecimento', 'Disciplina', 'Filosofia', 'Psicologia', 'Neurociência', 'Leitura guiada', 'Pertencimento', 'Rotina', 'Coragem', 'Sentido'],
    type: 'choice',
    field: 'main_intent',
  },
  {
    id: 'finish',
    title: '"A jornada começa quando você deixa de assistir a própria vida como espectador."',
    type: 'final',
  },
]

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({ name: '', nickname: '', phone: '', main_intent: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const current = STEPS[step]
  const progress = ((step + 1) / STEPS.length) * 100

  function validate() {
    if (current.id === 'identity') {
      if (!form.name.trim()) { setError('Informe seu nome.'); return false }
      if (!form.nickname.trim()) { setError('Informe seu nick.'); return false }
    }
    if (current.id === 'intent' && !form.main_intent) {
      setError('Escolha o que te trouxe até aqui.'); return false
    }
    setError(''); return true
  }

  async function handleNext() {
    if (!validate()) return
    if (step < STEPS.length - 1) { setStep(s => s + 1); return }
    await handleFinish()
  }

  async function handleFinish() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const now = new Date().toISOString()
    await Promise.all([
      supabase.from('users').update({
        name: form.name || undefined,
        nickname: form.nickname || undefined,
        phone: form.phone || undefined,
        onboarding_completed_at: now,
      }).eq('id', user.id),
      supabase.from('onboarding_responses').upsert({
        user_id: user.id,
        name_answer: form.name,
        nickname_answer: form.nickname,
        phone_answer: form.phone,
        main_intent: form.main_intent,
        completed_at: now,
      }, { onConflict: 'user_id' }),
    ])

    router.push('/boas-vindas')
    router.refresh()
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg)', padding: '2rem',
        position: 'relative',
      }}
    >
      <div
        style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(229,9,20,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          width: '100%', maxWidth: '560px',
          background: 'var(--card)', border: '1px solid var(--border)',
          borderRadius: 'var(--r-lg)', padding: 'clamp(1.5rem, 5vw, 2.5rem)',
          boxShadow: '0 32px 64px rgba(0,0,0,0.5)',
          position: 'relative',
          animation: 'slide-up 400ms ease both',
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span className="label">Iniciação</span>
            <span style={{ fontSize: '0.78rem', color: 'var(--muted)', fontWeight: 700 }}>
              {String(step + 1).padStart(2, '0')} / {String(STEPS.length).padStart(2, '0')}
            </span>
          </div>
          <div className="prog-bar">
            <div className="prog-fill" style={{ width: `${progress}%`, background: 'var(--gold)' }} />
          </div>
        </div>

        {/* Step content */}
        <div style={{ minHeight: '240px', animation: 'fade-in 300ms ease both' }} key={step}>
          <h2
            style={{
              fontFamily: current.id === 'finish' ? 'var(--font-body)' : 'var(--font-display)',
              fontSize: current.id === 'finish' ? '1.2rem' : 'clamp(1.6rem, 4vw, 2.2rem)',
              letterSpacing: current.id === 'finish' ? '0' : '0.03em',
              lineHeight: current.id === 'finish' ? 1.5 : 1.1,
              color: 'var(--text)',
              fontStyle: current.id === 'finish' ? 'italic' : 'normal',
              marginBottom: '1.5rem',
              fontWeight: current.id === 'finish' ? 400 : 700,
            }}
          >
            {current.title}
          </h2>

          {current.type === 'info' && (
            <p style={{ color: 'var(--muted)', fontSize: '1rem', lineHeight: 1.7 }}>{current.desc}</p>
          )}

          {current.type === 'fields' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <label className="field">
                Nome
                <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Seu nome completo" />
              </label>
              <label className="field">
                Nick na Guilda
                <input type="text" value={form.nickname} onChange={e => setForm(f => ({ ...f, nickname: e.target.value }))} placeholder="Ex: Vitor, Thorfinn, Recruta..." />
              </label>
              <label className="field">
                WhatsApp (opcional)
                <input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+55 11 9 0000-0000" />
              </label>
            </div>
          )}

          {current.type === 'cards' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {current.cards?.map(card => (
                <div
                  key={card.title}
                  style={{
                    display: 'flex', gap: '1rem', alignItems: 'flex-start',
                    background: 'var(--card-2)', border: '1px solid var(--border)',
                    borderRadius: 'var(--r)', padding: '1rem',
                  }}
                >
                  <span style={{ fontSize: '1.4rem', flexShrink: 0 }}>{card.icon}</span>
                  <div>
                    <strong style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text)', marginBottom: '0.2rem' }}>{card.title}</strong>
                    <p style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>{card.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {current.type === 'values' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {current.values?.map((v, i) => (
                <div
                  key={v}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    padding: '0.75rem 1rem',
                    background: 'var(--card-2)', border: '1px solid var(--border)',
                    borderRadius: '8px',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '0.75rem', color: 'var(--gold)',
                      minWidth: '1.5rem',
                    }}
                  >0{i + 1}</span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{v}</span>
                </div>
              ))}
            </div>
          )}

          {current.type === 'choice' && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {current.options?.map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => { setForm(f => ({ ...f, [current.field!]: opt })); setError('') }}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '6px',
                    border: `1px solid ${form[current.field as keyof typeof form] === opt ? 'var(--red)' : 'var(--border)'}`,
                    background: form[current.field as keyof typeof form] === opt ? 'rgba(229,9,20,0.12)' : 'var(--card-2)',
                    color: form[current.field as keyof typeof form] === opt ? 'var(--text)' : 'var(--muted)',
                    cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
                    transition: 'all 150ms',
                  }}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}

          {current.type === 'final' && (
            <p style={{ color: 'var(--gold)', fontSize: '0.9rem', fontWeight: 600 }}>
              Tudo pronto. Seu próximo passo é assistir ao vídeo de boas-vindas.
            </p>
          )}
        </div>

        {error && <p className="error-text">{error}</p>}

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem', gap: '0.75rem' }}>
          {step > 0 ? (
            <button
              className="btn-ghost"
              onClick={() => { setStep(s => s - 1); setError('') }}
              style={{ flex: 1 }}
            >
              Voltar
            </button>
          ) : <div style={{ flex: 1 }} />}
          <button
            className="btn-primary"
            onClick={handleNext}
            disabled={loading}
            style={{ flex: 1, justifyContent: 'center' }}
          >
            {loading ? 'Salvando...' : step === STEPS.length - 1 ? 'Ir para o vídeo de boas-vindas' : 'Continuar'}
          </button>
        </div>
      </div>
    </main>
  )
}
