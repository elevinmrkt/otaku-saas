'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    await supabase.from('users').update({ last_login_at: new Date().toISOString() }).eq('id', (await supabase.auth.getUser()).data.user!.id)
    router.push('/home')
    router.refresh()
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg)',
        padding: '2rem',
        position: 'relative',
      }}
    >
      <div
        style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(229,9,20,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          width: '100%', maxWidth: '420px',
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-lg)',
          padding: '2.5rem',
          position: 'relative',
          boxShadow: '0 32px 64px rgba(0,0,0,0.6)',
          animation: 'fade-in 400ms ease both',
        }}
      >
        <div style={{ marginBottom: '2rem' }}>
          <div
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              marginBottom: '1.5rem',
            }}
          >
            <span
              style={{
                width: '36px', height: '36px',
                background: 'var(--red)',
                borderRadius: '8px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-display)',
                fontSize: '1.1rem',
                color: 'white',
                boxShadow: '0 2px 12px var(--red-glow)',
              }}
            >OE</span>
            <strong style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', letterSpacing: '0.05em' }}>
              Otaku Estóico
            </strong>
          </div>
          <span className="label">Portal de acesso</span>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '2.2rem',
              letterSpacing: '0.04em',
              lineHeight: 1,
              color: 'var(--text)',
            }}
          >
            Entrar no Ecossistema
          </h1>
          <p style={{ marginTop: '0.5rem', color: 'var(--muted)', fontSize: '0.88rem' }}>
            Use o e-mail cadastrado no plano Protagonista.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <label className="field">
            E-mail
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="voce@email.com"
              autoComplete="email"
              required
            />
          </label>
          <label className="field">
            Senha
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Sua senha"
              autoComplete="current-password"
              required
            />
          </label>

          {error && <p className="error-text">{error}</p>}

          <button
            className="btn-primary"
            type="submit"
            disabled={loading}
            style={{ marginTop: '0.5rem', justifyContent: 'center' }}
          >
            {loading ? 'Entrando...' : 'Acessar ecossistema'}
          </button>
        </form>

        <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.82rem', color: 'var(--muted)' }}>
          Esqueceu a senha?{' '}
          <Link href="/recuperar-senha" style={{ color: 'var(--gold)', fontWeight: 700 }}>
            Recuperar acesso
          </Link>
        </p>
      </div>
    </main>
  )
}
