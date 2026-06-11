'use client'

import { useState } from 'react'
import Link from 'next/link'
import { loginAction } from './actions'

export default function LoginPage() {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const form = new FormData(e.currentTarget)
    try {
      const result = await loginAction(
        form.get('email') as string,
        form.get('password') as string
      )
      if (result) {
        if (result.toLowerCase().includes('email not confirmed')) {
          setError('E-mail não confirmado. Verifique sua caixa de entrada e clique no link de confirmação.')
        } else if (result.toLowerCase().includes('invalid login credentials') || result.toLowerCase().includes('invalid email or password')) {
          setError('E-mail ou senha inválidos. Verifique seus dados.')
        } else {
          setError(result)
        }
        setLoading(false)
      }
    } catch {
      setLoading(false)
    }
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
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
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
              name="email"
              type="email"
              placeholder="voce@email.com"
              autoComplete="email"
              required
            />
          </label>
          <label className="field">
            Senha
            <input
              name="password"
              type="password"
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
